// Guarda una referencia a "io" para que los controllers puedan emitir eventos
// sin tener que pasar la instancia manualmente por todos lados
let io = null;

function setIO(instance) {
  io = instance;
}

function getIO() {
  return io;
}

module.exports = { setIO, getIO };