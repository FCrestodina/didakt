// Validación de contraseña de estudiante. Isomórfica (sin dependencias de
// Node), se usa tanto en el cliente para feedback inmediato como en el server.
// Reglas: 6 a 8 caracteres, con al menos una minúscula, una mayúscula y un número.

export function validatePassword(password: string): string | null {
  if (password.length < 6 || password.length > 8) {
    return "La contraseña debe tener entre 6 y 8 caracteres.";
  }
  if (!/[a-z]/.test(password)) {
    return "La contraseña debe incluir al menos una letra minúscula.";
  }
  if (!/[A-Z]/.test(password)) {
    return "La contraseña debe incluir al menos una letra mayúscula.";
  }
  if (!/[0-9]/.test(password)) {
    return "La contraseña debe incluir al menos un número.";
  }
  return null;
}

export function isPasswordValid(password: string): boolean {
  return validatePassword(password) === null;
}
