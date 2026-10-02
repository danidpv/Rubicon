# Arquitectura

- Next App Router presenta contenido; Nest es la autoridad sobre identidad, permisos, tiempo y puntuaciones.
- Contratos Zod independientes en `shared`; no se entregan soluciones privadas antes de la entrega.
- PostgreSQL guarda usuarios, sesiones revocables, contenido editorial, versiones e intentos inmutables.
- Redis sirve para sesiones, límites distribuidos y BullMQ; la revocación se confirma siempre contra PostgreSQL.
- REST versionado y proxy de misma origin. El frontend no recibe claves de proveedores.
- IA y facturación usan adaptadores explícitos; mock no implica una evaluación jurídica ni un cobro real.
- Fuentes demo empiezan en REVIEW: disponer de una URL oficial no significa haber verificado su vigencia.
- Las notas internas de soporte se almacenan por separado de mensajes públicos.
- El HTML V3 se utiliza como referencia de navegación, paleta, contenidos propios y circuito pedagógico. No se reutiliza su lógica de autorización, corrección por palabras ni cifras ficticias.

Referencias técnicas consultadas: https://docs.prisma.io/docs/guides/upgrade-prisma-orm/v7 y https://nextjs.org/docs/app/getting-started/installation.
