require('dotenv').config(); // esto va PRIMERO, antes de leer cualquier variable de entorno
// llamamos al script principal para levantar el servidor
const app = require('./app.js')
// Indicamos que puertos puede utilizar en express (no es el mismo de la bbdd)
const PORT = process.env.PORT || 3080;

// Abrimos la el puerto para su conexion con el exterior siendo server
app.listen(PORT, () => {
    console.log(`Puerto ${PORT} abierto`); 
});
