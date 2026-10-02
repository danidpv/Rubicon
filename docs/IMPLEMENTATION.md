# Registro de implementación

## Fase 0

Carpeta inicialmente vacía, sin repositorio Git. Inspeccionados misión completa y HTML V3 en Descargas.
Entorno: Windows, Node 24.13.1; pnpm y Docker no están en PATH al inicio.
Se conservará PostgreSQL como base real. Los bloqueos de infraestructura no se ocultarán con persistencia en navegador.

## Fases implementadas

1. Workspace pnpm, Next, Nest, Zod, health y Compose. Validación inicial superada.
2. Prisma 7, migración inicial PLA y seed idempotente aplicados a PostgreSQL real.
3. Auth, correo Mailpit, sesiones revocables, RBAC y límites Redis. E2E de registro, verificación y sesión superado.
4–6. Página pública, planes, cuenta, temario y práctica con snapshots, borradores y scoring.
7. Adaptadores IA, cola BullMQ, validación estructurada y recuperación de encolados.
8–9. Exámenes, tiempo de servidor, evolución y repaso. Mock marcado como simulación.
10–13. Soporte humano, notas privadas, manual, billing mock/Stripe y administración auditada.
14. Build compilado, pruebas de API y navegador, revisión móvil y dependencias.

## Evidencia y límites

Verificación final local: lint, TypeScript, 12 pruebas unitarias/componentes y build superados. Las 3 pruebas E2E pasaron con PostgreSQL/Redis/Mailpit reales: registro, desarrollo, test, examen mixto, ownership, permisos por plan, soporte y revocación al suspender. Interfaz y anchura a 360 px verificadas en Chromium. Axe no detectó infracciones en el panel del alumno con las reglas WCAG A/AA seleccionadas; esto no equivale a una auditoría completa de accesibilidad. Se corrigió el contraste del logotipo lateral y del pie. Health confirmó base de datos y Redis disponibles.

Auditoría de dependencias de producción: cero avisos conocidos tras actualizar Nest, Prisma, correo, BullMQ y fijar overrides documentados en pnpm-workspace.yaml. Es una comprobación puntual, no una garantía permanente.

No se ha desplegado públicamente. Proveedores reales, corpus jurídico aprobado, textos legales definitivos, operación de producción y recuperación semántica requieren la configuración/revisión descrita en la documentación. No se presenta la demo como contenido exhaustivo ni protocolo oficial.
