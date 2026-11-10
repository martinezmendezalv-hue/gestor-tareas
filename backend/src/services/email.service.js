// Álvaro Martínez
// Servicio de email SIMULADO: en desarrollo solo muestra el mensaje en consola.
// Para envío real bastaría con sustituir el contenido de esta función.
exports.sendTaskAssigned = async (user, task) => {
  console.log(
    `[EMAIL SIMULADO] Para: ${user.email} | Asunto: Nueva tarea asignada | ` +
      `Hola ${user.name}, se te ha asignado la tarea "${task.title}".`
  );
  return true;
};
