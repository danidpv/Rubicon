# IA y conocimiento

Adaptador AiProvider: MockAiProvider y RealAiProvider (endpoint compatible con chat completions, configurado mediante AI_BASE_URL). No se transmite identidad de cuenta al proveedor. Las respuestas del alumno y las fuentes son datos no fiables, separados de instrucciones.

Mock produce una evaluación fija de prueba (50 por criterio) explícitamente etiquetada. No se utiliza para afirmar errores jurídicos reales. Los errores de preguntas editoriales sí producen refuerzo. Evaluación validada por Zod, criterios exactos sin duplicados, límites 0–100 y total recalculado en backend. Dos intentos de trabajo como máximo. Respuestas entregadas y snapshots persisten antes de encolar. Recuperación periódica de filas QUEUED si falla el envío inicial a Redis.

RAG inicial textual por chunks y metadatos. Solo APPROVED con revisor, fecha y vigencia válida. El asistente profesional usa únicamente categorías oficiales; protocolos internos no se incluyen sin un modelo de permiso específico. Las citas se contrastan con los IDs recuperados. Sin fuentes verificadas, el chat real se abstiene. Fuentes demo empiezan en REVIEW.

pgvector se habilita en Compose; la recuperación semántica y la generación de embeddings están reservadas para una siguiente ampliación. No se guardan vectores inventados. Consumo: operación, modelo, latencia y estado; tokens/coste exactos requieren ampliar la normalización de uso del proveedor.
