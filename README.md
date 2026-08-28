API para gestionar el fichado de entrada y salida de empleados
# Control-Horario-API

Esta API consiste en un gestor de fichado de empleados, tanto hora de entrada como de salida, guardando estos registros en una base de datos.

Solución Full-Stack para el registro de jornada laboral, cómputo automatizado de horas netas, control de acceso basado en roles (RBAC) y exportación de reportes para departamentos de Recursos Humanos.

- **Control de Fichajes en Tiempo Real:** Registro de entrada (`Clock-In`) y salida (`Clock-Out`) con validaciones para impedir jornadas duplicadas o cierres sin entrada previa.
- **Cálculo Automático de Horas:** Cómputo exacto de duración de jornada y almacenamiento normalizado en base de datos.
- **Autenticación & Autorización (RBAC):** Sistema seguro de contraseñas hasheadas con `bcrypt` y tokens `JWT` diferenciando privilegios de **Empleado** y **Administrador**.
- **Panel de Administración:** Visualización global de registros de todos los empleados y control de personal.
- **Exportación a CSV / Excel:** Generación de reportes tabulados con delimitador configurado (`sep=;`) y codificación UTF-8 con BOM para visualización directa en Microsoft Excel y Google Sheets.
- **Frontend Reactivo:** Interfaz moderna con temporizador en tiempo real de la jornada activa, historial personal y diseño adaptativo con Tailwind CSS.
