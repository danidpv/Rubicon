# Auditoria de seguridad

Fecha: 25/09/2026.

## Resultado corto

No se ha encontrado un fallo critico de acceso no autorizado en la version local. La app ya tenia buenas bases: sesiones HttpOnly, tokens hash con pepper, Argon2id, control de Origin en mutaciones, RBAC, ownership por usuario, permisos por plan en servidor, validacion Zod, CSP, Helmet, PostgreSQL/Redis/Mailpit atados a local y auditoria de acciones administrativas.

Durante la auditoria se corrigieron tres endurecimientos:

- Los tokens de verificacion y recuperacion se eliminan de la URL del navegador tras capturarse en cliente.
- Los formularios con credenciales usan `method="post"` para evitar que un envio HTML nativo pueda poner email/contrasena en la query string si se pulsa antes de hidratar React.
- El frontend compilado arranca en `127.0.0.1` y se añadieron cabeceras `Referrer-Policy`, `Permissions-Policy` y `X-Content-Type-Options`.

## Riesgos revisados

| Area | Estado |
| --- | --- |
| Dependencias de produccion | `pnpm audit --prod` sin vulnerabilidades conocidas. |
| Secretos en repositorio | No se detectaron claves reales versionadas; `.env` y `.local` estan ignorados. |
| Sesiones | Cookie HttpOnly, SameSite=Lax, Secure en produccion, revocacion en PostgreSQL. |
| CSRF | Mutaciones rechazan `Origin` distinto de `FRONTEND_URL`; webhook Stripe queda fuera y exige firma. |
| Autorizacion | Rutas privadas usan `AuthGuard`; admin usa roles; datos por usuario comprueban ownership. |
| Permisos de plan | Se aplican en servicios backend, no solo en la interfaz. |
| XSS | React escapa texto; Markdown no usa HTML crudo; CSP con nonce y sin `unsafe-inline` en scripts. |
| IA/RAG | Fuentes oficiales solo `APPROVED`, vigentes y revisadas; sin fuentes se abstiene. |
| Facturacion | Mock local sin cobro; Stripe verifica firma e idempotencia de eventos. |
| Red local | Backend, PostgreSQL, Redis y Mailpit escuchan en loopback; frontend tambien tras el ajuste. |

## Pendientes antes de publicar

- Probar Stripe real en modo test: alta, renovacion, fallo de pago, cancelacion, cambio de plan y reenvio de webhook.
- Revisar textos legales, politica de privacidad, retencion y borrado de datos reales.
- Desplegar detras de HTTPS con `NODE_ENV=production`, `FRONTEND_URL` exacto y secretos fuera del repositorio.
- Mantener el backend solo accesible por proxy interno; no exponer PostgreSQL, Redis ni Mailpit.
- Revisar juridicamente el contenido y aprobar fuentes reales antes de activar IA profesional.
- Definir backups, restauracion y rotacion de secretos.

## Verificacion ejecutada

- `pnpm audit --prod`: 0 vulnerabilidades conocidas.
- `pnpm lint`: correcto.
- `pnpm typecheck`: correcto.
- `pnpm test`: 12 pruebas pasadas.
- `pnpm build`: correcto.
- `pnpm test:e2e`: 3 pruebas pasadas tras reiniciar frontend con el arranque endurecido.

