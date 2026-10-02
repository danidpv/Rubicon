# Base de datos

PostgreSQL, Prisma 7 con adaptador `pg`. Tablas y columnas físicas mapeadas a nomenclatura PLA.

`Content` + `ContentRevision` representan unidades, supuestos, exámenes y manuales. La discriminación `kind` evita duplicar infraestructura editorial. `data` es JSON validado por Zod (preguntas, opciones, rúbricas, solución y configuración de examen); es un agregado versionado. `CaseAttempt` y `ExamAttempt` conservan su snapshot independiente de futuras ediciones.

`AuthToken` discrimina verificación y recuperación por `purpose`; solo guarda hashes. `User.profile` contiene perfil no privilegiado validado. Las notas de soporte tienen tabla separada.

Los seeds son idempotentes y no sobrescriben cambios editoriales o precios. No crean cuentas. El contenido inicial lleva `isDemo` y las fuentes `REVIEW`; la IA profesional debe abstenerse hasta disponer de fuentes aprobadas.

Redis no es la fuente de verdad. Nunca se eliminan usuarios para darles de baja.

Compose instala pgvector. El corpus inicial usa búsqueda textual/metadatos; el almacenamiento vectorial puede añadirse sin cambiar los contratos. No se generan embeddings ficticios.
