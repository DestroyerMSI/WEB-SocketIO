import e from 'express';
import { Server } from 'socket.io';
import { createServer } from 'node:http';
import loger from 'morgan';
import { Cors } from './midelware/cors.js';
import mysql from 'mysql2/promise';

// Debes de cambiar los parametros a la base de datos para que pueda funcionar la aplicacion
const config = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'Naruto03*',
    database: 'mensajes',
};

const pool = mysql.createPool(config);

const app = e();
app.disable('x-powered-by');
app.use(e.json());
app.use(Cors());
app.use(loger('dev'));

const server = createServer(app);

const io = new Server(server);

async function checkDatabaseConnection() {
    try {
        await pool.getConnection();
        console.log("Conexión a la base de datos exitosa.");
    } catch (error) {
        console.error("Error al conectar a la base de datos:", error);
        throw new Error("No se conecto con la base de datos")
    }
}

checkDatabaseConnection(); 

app.get('/', async (req, res) => {
    try {
        return res.status(200).sendFile(process.cwd() + '/client/index.html');
    } catch (error) {
        console.log(error);
        return res.status(500).send("Lo sentimos, error en el servidor.");
    }
});

app.use((req, res) => {
    return res.status(404).send("Error 404 Forbidden");
});

io.on('connection', async (socket) => {
    try {
        socket.on('get messages', async () => {
            const [mensajes] = await pool.query('SELECT id, user, mensaje FROM msg');
            socket.emit('previous messages', mensajes);
        });

        socket.on('disconnect', () => {
            console.log('Un usuario se ha desconectado');
        });

        socket.on('chat message', async (msg) => {
            console.log(msg);
            try {
                console.log('Mensaje: ' + msg);
                const [[{ ID }]] = await pool.query("SELECT UUID() AS ID");

                await pool.query('INSERT INTO msg (id, user, mensaje) VALUES (UUID_TO_BIN(?), ?, ?)',
                    [ID, 'LOIDS@@@', msg]
                );

                const [todosLosMensajes] = await pool.query('SELECT id, user, mensaje FROM msg');

                console.log(todosLosMensajes);

                io.emit('chat message', msg);
            } catch (error) {
                throw new Error(error);
            }
        });
    } catch (error) {
        throw new Error(error);
    }
});

const Port = process.env.PORT || 3000;

server.listen(Port, () => {
    console.log("Running in port: ", Port);
});





