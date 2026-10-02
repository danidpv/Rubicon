# Demo online rapida sin Redis

Objetivo: que otra persona pueda ver el frontend, registrarse, entrar en `/app` y revisar `/admin` sin activar Stripe, IA real ni Redis.

## Plataforma recomendada

- Supabase: PostgreSQL.
- Render: backend NestJS.
- Vercel: frontend Next.js.

Redis queda opcional. Si no configuras `REDIS_URL`, el backend usa memoria temporal para limites y ejecuta las correcciones directamente. Para una demo privada es suficiente y reduce servicios.

## 1. Supabase

Ya tienes el proyecto creado. Usa la cadena PostgreSQL con SSL en Render como `DATABASE_URL`.

Formato:

```env
DATABASE_URL=postgresql://postgres:TU_PASSWORD_CODIFICADA@db.TU_PROJECT_ID.supabase.co:5432/postgres?sslmode=require
```

Si la contrasena tiene caracteres especiales, codificalos en URL. Por ejemplo, `+` debe ponerse como `%2B`.

## 2. Backend en Render

Crear un **Web Service** desde GitHub:

```txt
https://github.com/danidpv/Rubicon.git
```

Build command:

```sh
pnpm install --frozen-lockfile && pnpm --filter shared build && pnpm --filter backend db:generate && pnpm --filter backend build
```

Start command:

```sh
pnpm --filter backend start
```

Variables:

```env
NODE_ENV=production
DEPLOYMENT_ENV=staging
HOST=0.0.0.0
FRONTEND_URL=https://URL-DEL-FRONTEND.vercel.app
DATABASE_URL=postgresql://...supabase.co:5432/postgres?sslmode=require
SESSION_COOKIE_NAME=splocal_session
SESSION_SECRET_PEPPER=generar-un-valor-largo-aleatorio-minimo-32-caracteres
SMTP_HOST=smtp.tu-proveedor.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
EMAIL_FROM=SP Local IA <no-reply@tu-dominio.com>
BILLING_PROVIDER=mock
AI_PROVIDER=mock
SUPPORT_RESPONSE_HOURS=48
```

No pongas `REDIS_URL` para esta demo.

Si aun no tienes SMTP, la app puede desplegar, pero registro, reset y enlaces de admin por correo no quedaran bien hasta configurarlo.

## 3. Migrar y cargar datos

En Render, abre la shell del backend o ejecuta un job/manual command:

```sh
pnpm --filter backend db:migrate
pnpm --filter backend db:seed
```

Despues crea el admin:

```sh
pnpm admin:create --email TU_EMAIL@gmail.com
```

## 4. Frontend en Vercel

Crear proyecto desde el mismo repo.

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

Variable:

```env
BACKEND_INTERNAL_URL=https://URL-DEL-BACKEND.onrender.com
```

Cuando Vercel de la URL publica, vuelve a Render y pon esa URL exacta en `FRONTEND_URL`.

## Prueba final

- Abrir la URL de Vercel.
- Registrar un usuario.
- Verificar correo.
- Entrar en `/app`.
- Entrar en `/admin` con el admin.
- Probar un supuesto o examen: se corrige en modo mock, sin IA real.

## Para mas adelante

Cuando el proyecto crezca, se puede anadir Redis para colas y limites persistentes. No hace falta para ensenar la demo.
