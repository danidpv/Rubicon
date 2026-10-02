# Seguridad

Autorización en Nest: AuthGuard, RolesGuard y EntitlementGuard; ownership por identidad de sesión. La suspensión revoca sesiones en la misma transacción. ADMIN no puede modificar ADMIN/SUPERADMIN; las acciones sobre cuentas propias se rechazan. Cambios editoriales, accesos y acciones administrativas quedan auditados.

Helmet en API; CSP con nonce por petición y renderizado dinámico en Next; scripts sin unsafe-inline, estilos inline permitidos para Recharts y anchos de progreso. Validación Zod estricta, Markdown sin HTML crudo, cuerpo limitado a 128 KB, consultas Prisma parametrizadas. SQL manual solo para bloqueos de fila con parámetros, necesarios en cuotas, puntuación e integridad de entregas.

Redis aplica límites distribuidos. El despliegue debe limitar el acceso directo al backend y configurar de forma explícita proxies de confianza si se desea atribuir IP del cliente. No confiar indiscriminadamente en X-Forwarded-For.

El registro técnico excluye cuerpos, cookies, contraseñas, claves y prompts. Los artefactos E2E y .env están excluidos del repositorio. Tests de ejemplo usan cuentas y contraseñas aleatorias. Ejecutar pnpm audit --prod al actualizar el lockfile.

Pendiente para apertura pública: textos legales del operador, revisión jurídica/editorial, prueba de proveedores reales, política de retención y borrado de datos, copias y restauración en el destino de despliegue. Las pruebas automatizadas de accesibilidad no sustituyen revisión manual completa WCAG.
