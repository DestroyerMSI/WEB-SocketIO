import express from "express"; 
import { Cors } from "./midelware/cors.js"; 
import { createServer } from 'node:http';
import logger from 'morgan';
import { Server } from "socket.io";
import mysql from 'mysql2/promise';

const config = {
   host: 'localhost',
   port: 3306,
   user: 'root', 
   password: 'Naruto03*',
   database: 'mensajes',  
};

const pool = mysql.createPool(config);

const app = express();
app.use(Cors());
app.use(logger('dev'));

const server = createServer(app);
const io = new Server(server);

app.get('/', async (req, res) => {
  try {


    res.status(200).sendFile(process.cwd() + '/client/inde.html'); 
  } catch (error) {
    console.error('Error al obtener mensajes:', error);
    res.status(500).send('Error interno del servidor');
  }
});


app.use((req, res) => {
    res.status(404).send('ERROR 404');
});

io.on('connection', (socket) => {
  console.log('Se ha conectado un nuevo usuario');


  socket.on('get messages', async () => {
      const [mensajes] = await pool.query('SELECT id, user, mensaje FROM msg');
      socket.emit('previous messages', mensajes); 
  });

  socket.on('disconnect', () => {  
      console.log('Un usuario se ha desconectado');
  });

  socket.on('chat message', async (msg) => {
      console.log('Mensaje: ' + msg);

      // Obtener un nuevo UUID
      const [[{ ID }]] = await pool.query("SELECT UUID() AS ID");

      // Insertar el nuevo mensaje en la base de datos
      await pool.query('INSERT INTO msg (id, user, mensaje) VALUES (UUID_TO_BIN(?), ?, ?)', 
          [ID, 'LOIDS@@@', msg]
      );

      // Recuperar todos los mensajes
      const [todosLosMensajes] = await pool.query('SELECT id, user, mensaje FROM msg');
      
      console.log(todosLosMensajes);

      // Emitir el mensaje a todos los clientes conectados
      io.emit('chat message', msg);
  });
});

const Puerto = process.env.PORT || 3000;

server.listen(Puerto, () => {
    console.log(`Servidor escuchando en el puerto ${Puerto}`); 
});
