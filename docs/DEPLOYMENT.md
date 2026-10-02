# Despliegue

Node 24, pnpm 10.28.2, PostgreSQL con copias/restore, Redis privado y SMTP autenticado. pnpm install --frozen-lockfile; pnpm db:migrate; pnpm db:seed; pnpm build. Procesos: pnpm --filter backend start y pnpm --filter frontend start. Backend y Next pueden correr en el mismo host y exponerse mediante un proxy TLS; el backend escucha en loopback.

Enrutar /api/v1/ hacia localhost:4000 y el resto a localhost:3000. FRONTEND_URL debe ser el origen HTTPS exacto. Configurar secretos únicamente en el entorno. NODE_ENV=production rechaza modo mock y exige configuración real de facturación; AI_PROVIDER puede ser disabled. No utilizar las credenciales de desarrollo fuera del entorno local.

Health /api/v1/health; readiness /api/v1/health/ready comprueba PostgreSQL y Redis. BullMQ se ejecuta en el proceso Nest en esta primera versión. Reintenta trabajos e impide duplicar puntuaciones. Supervisar errores del worker, cola, SMTP y webhook. Detener entradas y drenar trabajos antes de migraciones incompatibles.

Los textos legales son borradores pendientes de identidad y revisión del operador. No publicar la instancia de demostración como servicio comercial sin cerrar las comprobaciones indicadas en SECURITY.md.
