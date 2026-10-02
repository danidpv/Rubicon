# Demo online rapida

Objetivo: que otra persona pueda ver la web, registrarse, entrar en `/app` y revisar `/admin` sin activar Stripe ni IA real.

## Plataforma recomendada

Usar solo Railway para esta primera demo:

- 1 servicio PostgreSQL.
- 1 servicio Redis.
- 1 servicio backend.
- 1 servicio frontend.

Asi evitamos coordinar Vercel + Railway y tenemos todo en un mismo panel.

## Servicios

### 1. PostgreSQL

Crear un servicio PostgreSQL en Railway.

Copiar su `DATABASE_URL` para el backend.

### 2. Redis

Crear un servicio Redis en Railway.

Copiar su `REDIS_URL` para el backend.

### 3. Backend

Crear servicio desde GitHub:

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
FRONTEND_URL=https://URL-DEL-FRONTEND
DATABASE_URL=postgresql://...
REDIS_URL=redis://...
SESSION_COOKIE_NAME=splocal_session
SESSION_SECRET_PEPPER=generar-un-valor-largo-aleatorio
SMTP_HOST=smtp.tu-proveedor.com
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
EMAIL_FROM=SP Local IA <no-reply@tu-dominio.com>
BILLING_PROVIDER=mock
AI_PROVIDER=disabled
SUPPORT_RESPONSE_HOURS=48
```

Si no tenemos SMTP todavia, podemos desplegar, pero registro/reset/admin por correo no funcionaran bien hasta configurarlo.

### 4. Frontend

Crear otro servicio desde el mismo repo.

Build command:

```sh
pnpm install --frozen-lockfile && pnpm --filter shared build && pnpm --filter frontend build
```

Start command:

```sh
pnpm --filter frontend start:cloud
```

Variables:

```env
BACKEND_INTERNAL_URL=https://URL-DEL-BACKEND
```

Cuando Railway de la URL publica del frontend, volver al backend y poner esa URL exacta en `FRONTEND_URL`.

## Inicializar datos

Cuando el backend tenga base de datos y Redis:

```sh
pnpm --filter backend db:migrate
pnpm --filter backend db:seed
```

Despues crear admin:

```sh
pnpm admin:create --email TU_EMAIL@gmail.com
```

## Prueba final

- Abrir la URL del frontend.
- Registrar un usuario.
- Verificar correo.
- Entrar en `/app`.
- Entrar en `/admin` con el admin.
- En `Mi suscripcion`, cambiar plan en modo demo sin cobro.

## Importante

Esta demo es privada. No vender ni abrir al publico hasta cerrar Stripe real/test, contenido juridico revisado, textos legales y backups.

