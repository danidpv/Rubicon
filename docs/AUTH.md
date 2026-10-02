# Autenticación

Argon2id. Identidades normalizadas a minúsculas, restricciones UNIQUE. Cookie HttpOnly, SameSite=Lax, Secure en producción. Token aleatorio de 32 bytes; PostgreSQL solo conserva SHA-256 con pepper. Duración absoluta 7 días, inactividad 24 horas y actualización de actividad cada minuto. PostgreSQL verifica usuario y revocación en cada petición; una caché Redis obsoleta nunca autoriza al usuario.

Verificación 24 h; recuperación 1 h, de un uso mediante transacción. Reset y cambio de contraseña revocan sesiones. No hay JWT en localStorage. Origin obligatorio en mutaciones salvo webhook firmado. El cliente móvil futuro debe tener un mecanismo específico, sin desactivar Origin globalmente.

CLI: `pnpm admin:create --email admin@dominio.es`. Solicita nombre, genera una contraseña inusable que no imprime y envía por correo un enlace para establecer la contraseña. No hay credenciales de administrador en seeds.
