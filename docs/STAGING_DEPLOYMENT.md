# Despliegue staging privado

Objetivo: tener una URL online para probar la web, el panel privado y `/admin` sin presentarlo aun como producto comercial.

## Ruta recomendada actual

- GitHub privado para alojar el repositorio.
- Supabase para PostgreSQL.
- Render para backend NestJS.
- Vercel para frontend Next.js.
- SMTP real de pruebas: Resend, Brevo, Mailgun o similar.

Redis es opcional. En staging privado puedes omitir `REDIS_URL`; el backend usara memoria temporal para limites y corregira en el mismo proceso.

## Antes de desplegar

1. Subir el repositorio a GitHub.
2. Crear PostgreSQL en Supabase.
3. Crear servicio backend en Render desde el mismo repo.
4. Crear proyecto frontend en Vercel apuntando a `frontend`.
5. Configurar variables de entorno.
6. Ejecutar migracion y seed.
7. Crear usuario admin.

## Backend Render

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
DEPLOYMENT_ENV=staging
PORT=4000
HOST=0.0.0.0
FRONTEND_URL=https://TU-FRONTEND.vercel.app
DATABASE_URL=postgresql://...supabase.co:5432/postgres?sslmode=require
SESSION_COOKIE_NAME=splocal_session
SESSION_SECRET_PEPPER=valor-largo-aleatorio-minimo-32-caracteres
SMTP_HOST=smtp.tu-proveedor.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
EMAIL_FROM=SP Local IA <no-reply@tu-dominio.com>
BILLING_PROVIDER=mock
AI_PROVIDER=mock
SUPPORT_RESPONSE_HOURS=48
```

No configures `REDIS_URL` si quieres mantener la demo simple.

Para pagos hay dos caminos:

- Staging rapido sin pagos reales: `DEPLOYMENT_ENV=staging` y `BILLING_PROVIDER=mock`.
- Staging con Stripe test: `BILLING_PROVIDER=stripe` y claves de prueba.

El modo mock solo debe usarse en staging privado. Para publicar de verdad, usar `DEPLOYMENT_ENV=production` con Stripe real o test segun corresponda.

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
BACKEND_INTERNAL_URL=https://TU-BACKEND.onrender.com
```

Cuando Vercel de la URL definitiva, actualizar `FRONTEND_URL` en Render con esa URL exacta.

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
- Revisar `/api/v1/health/ready` desde el backend. Debe mostrar `redis: disabled` si no configuraste Redis.
- Probar crear supuesto, examen, soporte y cambio de plan.

## Nota importante

No publicar como producto comercial hasta cerrar:

- Stripe test completo o Stripe real.
- Textos legales definitivos.
- Revision juridica del contenido.
- Dominio propio y HTTPS definitivo.
- Politica de backups/restauracion.
- Monitorizacion de errores y logs.
