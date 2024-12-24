import cors from 'cors'


 export const Cors = () => cors({
    origin: (origin,callback) =>{

      const PUERTOS = [
        'localhost:3000',
        'localhost:5000',

      ]
      if(PUERTOS.includes(origin) || !origin){
        return callback(null,true)
      }
      
      throw new Error ('A ocurriodo un error q es el siguiente')

    }
 })