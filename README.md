# SP Local IA

Plataforma de aprendizaje de supuestos prácticos de Policía Local en Andalucía.
Monolito modular NestJS y frontend Next.js independientes, con contratos Zod compartidos.

## Estado

Primera versión local funcional, con persistencia real y adaptadores mock de IA y pagos. Incluye registro, correo, sesiones, estudio, supuestos, exámenes, evolución, soporte, manual y administración. La referencia inspeccionada es `sp_local_ia_demo_supuestos_v3.html`.
El contenido de demostración no constituye un protocolo operativo ni una revisión jurídica vigente. No está publicada en un servidor externo.

## Requisitos

Node.js 24 LTS, pnpm y Docker Compose (PostgreSQL, Redis y Mailpit).

```sh
pnpm install
node infra/setup-local-env.mjs
docker compose up -d
pnpm db:migrate
pnpm db:seed
pnpm dev
```

Frontend: http://localhost:3000 · API: http://localhost:4000/api/v1 · Mailpit: http://localhost:8025

Las decisiones y verificaciones se registran en `docs/ARCHITECTURE.md` y `docs/IMPLEMENTATION.md`.

## Probar ahora

Abre http://localhost:3000/registro, crea tu cuenta y verifica el correo desde Mailpit. En **Mi cuenta → Mi suscripción** puedes simular cualquier plan sin cobro. El backend restringe módulos según el plan; cambiarlo conserva tu historial.

En este equipo Windows también se han preparado PostgreSQL y Redis en Ubuntu WSL y Mailpit local. Si están detenidos: `powershell -File infra/start-local.ps1`. Es una alternativa local a Docker, no un cambio de stack.

## Administración

```sh
pnpm admin:create --email admin@dominio.es
```

Solicita nombre y envía un enlace por correo para establecer la contraseña. No se imprimen ni se incluyen credenciales en el repositorio. Entra después en `/admin`.

## Calidad y producción

```sh
pnpm lint
pnpm typecheck
pnpm test
pnpm build
pnpm exec playwright install chromium
pnpm test:e2e
pnpm validate
```

Arranque compilado: `pnpm --filter backend start` y `pnpm --filter frontend start`.

Para proveedores reales faltan claves/configuración externa: `AI_API_KEY`, `AI_BASE_URL`, `AI_CHAT_MODEL`, `AI_EVALUATION_MODEL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PRICE_MAP` y SMTP de producción. No hacen falta para probar localmente. Ver `docs/DEPLOYMENT.md` y `docs/SECURITY.md` antes de abrir al público. La búsqueda RAG inicial es textual; los embeddings y la recuperación semántica son una ampliación pendiente.
