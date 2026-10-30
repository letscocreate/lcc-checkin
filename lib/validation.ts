const ROOM_NAME_REGEX = /^[a-z0-9-]{1,40}$/;
const STUDENT_NAME_MAX_LENGTH = 30;

// Retorna null quando válido, ou a mensagem de erro em português.
export function validateRoomName(roomName: string): string | null {
  if (!ROOM_NAME_REGEX.test(roomName)) {
    return "Nome de sala inválido. Use só letras minúsculas, números e hífen, até 40 caracteres.";
  }
  return null;
}

export function validateStudentName(studentName: string): string | null {
  if (studentName.length === 0) {
    return "Escreva seu primeiro nome ou apelido.";
  }
  if (studentName.length > STUDENT_NAME_MAX_LENGTH) {
    return `Use até ${STUDENT_NAME_MAX_LENGTH} caracteres.`;
  }
  if (/[\r\n]/.test(studentName)) {
    return "O nome não pode ter quebra de linha.";
  }
  if (studentName.includes("|")) {
    return 'O nome não pode conter o caractere "|".';
  }
  return null;
}
