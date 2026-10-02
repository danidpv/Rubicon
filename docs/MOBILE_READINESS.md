# Preparación móvil

La aplicación móvil futura reutilizará /api/v1/auth, theory, practical-cases, case-attempts, exams, exam-attempts, progress, error-bank, ai/conversations, manual, support/threads y subscriptions. La lógica de dominio permanece en Nest y los contratos Zod en shared.

No se implementa React Native en esta versión. Una app nativa necesita transporte de sesión específico con almacenamiento seguro del sistema, revocación, protección por cliente y un endpoint de autenticación dedicado. No guardar tokens en almacenamiento plano ni eliminar globalmente la comprobación de Origin.

Reutilizables: validaciones, tipos, scoring, estados, planificación de repasos y contratos. Los componentes visuales web se adaptarán a componentes nativos. El servidor ya controla propiedad, tiempo, permisos, snapshots y corrección asíncrona.
