# Verificación

Comandos: pnpm lint; pnpm typecheck; pnpm test; pnpm build; pnpm test:e2e. pnpm validate agrupa lint, tipos, unitarios/componentes y build.

Antes de E2E iniciar PostgreSQL y Mailpit; Redis es opcional salvo que se quiera probar cola distribuida. Aplicar migraciones y seed, y construir el proyecto. Playwright arranca/reutiliza frontend y backend compilados. Instalar Chromium con pnpm exec playwright install chromium. Las pruebas crean cuentas aleatorias con dominio example.test y contenido identificable e2e; usar una base dedicada para CI. No hay contraseñas fijas.

Los E2E usan PostgreSQL real, SMTP/Mailpit real, Redis opcional y adaptadores mock de IA y pagos. Cubren registro/verificación/login/logout, propiedad de intentos y soporte, corrección asíncrona, test, errores, examen y expiración, plan Temario → 403 en Supuestos, nota interna oculta, respuesta de equipo, acceso manual y suspensión → 401. La interfaz prueba login, estudio, navegación y anchura a 360 px. Se añaden verificaciones axe sobre el dashboard.

En Windows con OneDrive los placeholders aparecen como symlinks y Playwright puede omitirlos. infra/prepare-e2e.mjs materializa las pruebas originales de tests/e2e en .local/e2e antes de ejecutarlas. No son copias versionadas. Capturas y trazas locales quedan excluidas de Git.

No se ha probado un despliegue externo, Stripe con claves reales ni un modelo IA real. Mantener esa distinción respecto a los tests locales.
