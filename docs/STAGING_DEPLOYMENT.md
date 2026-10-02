# Despliegue staging privado

Objetivo: tener una URL online para probar la web, el panel privado y `/admin` sin presentarlo aun como producto comercial.

## Ruta recomendada

- GitHub privado para alojar el repositorio.
- Railway para backend NestJS, PostgreSQL y Redis.
- Vercel para frontend Next.js.
- SMTP real de pruebas: Resend, Brevo, Mailgun o similar.

Esta combinacion evita meter el backend Nest/BullMQ en funciones serverless y permite usar Vercel donde mas brilla: el frontend Next.

## Antes de desplegar

1. Hacer commit del proyecto.
2. Subirlo a un repositorio privado de GitHub.
3. Crear PostgreSQL en Railway.
4. Crear Redis en Railway.
5. Crear servicio backend en Railway desde el mismo repo.
6. Crear proyecto frontend en Vercel apuntando a `frontend`.
7. Configurar variables de entorno.
8. Ejecutar migracion y seed.
9. Crear usuario admin.

## Backend Railway

Servicio: `sp-local-ia-api`.

Build command:

```sh
pnpm install --frozen-lockfile && pnpm --filter shared build && pnpm --filter backend db:generate && pnpm --filter backend build
```

Start command:

```sh
pnpm --filter backend start
```

Variables necesarias:

```env
NODE_ENV=production
PORT=4000
HOST=0.0.0.0
FRONTEND_URL=https://TU-FRONTEND.vercel.app
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
SESSION_COOKIE_NAME=splocal_session
SESSION_SECRET_PEPPER=valor-largo-aleatorio
SMTP_HOST=smtp.tu-proveedor.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
EMAIL_FROM=SP Local IA <no-reply@tu-dominio.com>
AI_PROVIDER=disabled
SUPPORT_RESPONSE_HOURS=48
```

Para pagos hay dos caminos:

- Staging con Stripe test: `BILLING_PROVIDER=stripe` y claves de prueba.
- Staging privado sin pagos reales: requiere adaptar el backend para permitir mock billing solo en un modo privado controlado.

La segunda opcion es comoda para demo, pero no debe usarse en publico.

## Frontend Vercel

Proyecto: `sp-local-ia-web`.

Root Directory:

```txt
frontend
```

Install command:

```sh
cd .. && pnpm install --frozen-lockfile
```

Build command:

```sh
cd .. && pnpm --filter shared build && pnpm --filter frontend build
```

Output:

```txt
frontend/.next
```

Variables:

```env
BACKEND_INTERNAL_URL=https://TU-BACKEND.railway.app
```

Cuando Vercel de la URL definitiva, actualizar `FRONTEND_URL` en Railway con esa URL exacta.

## Migracion y seed

Tras tener PostgreSQL listo:

```sh
pnpm --filter backend db:migrate
pnpm --filter backend db:seed
```

Despues crear admin:

```sh
pnpm admin:create --email tu-email@dominio.com
```

El enlace llega por SMTP. Si el SMTP aun no esta listo, no crear admin hasta configurarlo.

## Comprobacion final

- Abrir `/registro`.
- Verificar email.
- Entrar a `/app`.
- Entrar a `/admin` con el usuario admin.
- Revisar `/api/v1/health/ready` desde el backend.
- Probar crear supuesto, examen, soporte y cambio de plan.

## Nota importante

No publicar como producto comercial hasta cerrar:

- Stripe test completo o Stripe real.
- Textos legales definitivos.
- Revision juridica del contenido.
- Dominio propio y HTTPS definitivo.
- Politica de backups/restauracion.
- Monitorizacion de errores y logs.
