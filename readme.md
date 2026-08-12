ESPECIFICACIÓN TÉCNICA Y ROADMAP DE IMPLEMENTACIÓN: CLON SELF-HOSTED DE AIRTABLE
Documento detallado de diseño, arquitectura y lista de verificación paso a paso para la construcción, dockerización y despliegue de una plataforma de bases de datos relacionales sin código (no-code), similar a Airtable. Diseñado para ser procesado e implementado secuencialmente por una Inteligencia Artificial o un equipo de desarrollo.


1. INFORMACIÓN GENERAL Y ARQUITECTURA DEL SISTEMA
1.1 ¿Qué es Airtable y para qué sirve?
Airtable es una plataforma de base de datos relacional híbrida con interfaz de hoja de cálculo visual. Combina la flexibilidad de una hoja de cálculo (filas, columnas, celdas interactivas, fórmulas y ordenamiento visual) con la potencia de una base de datos relacional (tipos de datos estrictos, relaciones entre tablas mediante claves foráneas, campos de búsqueda Lookup y agregaciones Rollup). Permite organizar datos, crear vistas personalizadas (Grid, Kanban, Galería, Calendario), diseñar formularios públicos para captura de datos y construir paneles/dashboards interactivos sin escribir código.
1.2 Visión General de la UI/UX y Jerarquía de Componentes
La interfaz se organiza en la siguiente jerarquía estructural:

Espacio de Trabajo (Workspace): Contenedor principal que agrupa bases de datos.
Base de Datos (Base): Un proyecto individual que contiene múltiples tablas relacionadas entre sí.
Tabla (Table): Colección de registros organizados en filas y campos (columnas).
Campo (Field): Columna con un tipo de dato definido (Texto, Número, Selección, Relación, etc.).
Registro (Record): Una fila individual dentro de una tabla que contiene valores para cada campo.
Vista (View): Diferentes representaciones visuales de los mismos datos de una tabla (Grid, Kanban, Galería, Calendario, Formulario).
Interfaz / Dashboard: Panel independiente compuesto por widgets (métricas, gráficos, tablas) conectado a las bases de datos.
1.3 Arquitectura Técnica Recomendada (Self-Hosted Stack)
Base de Datos Principal: PostgreSQL 16+ (soporta almacenamiento dinámico relacional o esquemas flexibles mediante JSONB / EAV).
Caché y Mensajería: Redis 7+ (gestión de sesiones, almacenamiento en caché de consultas y colas de tareas background).
Almacenamiento de Archivos (Object Storage): MinIO (compatible con Amazon S3) para guardar archivos adjuntos e imágenes de forma local.
Backend API: Node.js (NestJS / Express) o Python (FastAPI) para manejar la lógica de negocio, motor de fórmulas, parsing de expresiones y endpoints REST/GraphQL.
Frontend SPA: React / Next.js o Vue 3 / Nuxt 3 con Tailwind CSS, TanStack Table (o canvas virtualizado), React Flow / Dnd Kit para drag and drop.
Contenedorización: Docker & Docker Compose con proxy inverso Nginx / Traefik.


2. ROADMAP Y LISTA DE COMPROBACIÓN DE IMPLEMENTACIÓN

FASE 1: INFRAESTRUCTURA, ENTORNO Y DOCKERIZACIÓN
1.1 Configuración del Entorno de Contenedores con Docker Compose

Crear el archivo docker-compose.yml en la raíz del proyecto.
Configurar el servicio db (PostgreSQL 16) con volúmenes persistentes para almacenamiento de datos.
Configurar el servicio redis (Redis 7) con persistencia RDB/AOF activa.
Configurar el servicio storage (MinIO) para el almacenamiento de archivos adjuntos localmente.
Configurar el servicio backend (API REST / GraphQL) vinculado a PostgreSQL, Redis y MinIO.
Configurar el servicio frontend (Aplicación Web SPA).
Configurar el servicio proxy (Nginx / Traefik) para enrutamiento HTTP/HTTPS y gestión de dominios.
Definir la red interna de Docker (airtable_net) para aislar el tráfico entre contenedores.

1.2 Variables de Entorno y Configuración de Seguridad (.env)

Definir claves para PostgreSQL (POSTGRES_USER, POSTGRES_PASSWORD, POSTGRES_DB, POSTGRES_PORT).
Definir variables para Redis (REDIS_HOST, REDIS_PORT, REDIS_PASSWORD).
Definir credenciales de MinIO (MINIO_ROOT_USER, MINIO_ROOT_PASSWORD, MINIO_BUCKET_NAME).
Definir secretos de autenticación del Backend (JWT_SECRET, JWT_EXPIRATION, API_KEY_SALT).
Definir URL pública del sistema (PUBLIC_URL, FRONTEND_URL, BACKEND_URL).

1.3 Scripts de Despliegue y Salud del Sistema

Crear script setup.sh para la inicialización automática de volúmenes, carpetas y migraciones de base de datos.
Implementar endpoints de Health Check (/healthz) en el backend para verificar conectividad con DB, Redis y Storage.
Configurar políticas de reinicio automático (restart: unless-stopped) en todos los servicios de Docker.


FASE 2: NÚCLEO DE MODELADO DE DATOS Y ESTRUCTURA ORGANIZACIONAL
2.1 Entidades Jerárquicas Base (Organización y Contenedores)

Crear tabla/modelo workspaces (ID, nombre, descripción, fecha de creación, fecha de actualización).
Crear tabla/modelo bases (ID, workspace_id, nombre, icono, color, fecha de creación).
Crear tabla/modelo tables (ID, base_id, nombre, descripción, orden, fecha de creación).
Crear tabla/modelo fields (ID, table_id, nombre, tipo_dato, opciones_json, orden, es_clave_primaria).
Crear tabla/modelo records (ID, table_id, datos_json/valores_columna, fecha_creacion, fecha_actualizacion).

2.2 Motor de Almacenamiento de Registros Dinámicos

Implementar arquitectura de esquema flexible (JSONB estructurado por registro o esquemas dinámicos DDL en PostgreSQL por cada tabla creada).
Diseñar el normalizador de datos para asegurar que los valores insertados cumplan con la especificación del campo.
Implementar asignador automático de ID único global para cada registro (rec_XXXXXXXXXXXX).

2.3 API RESTful Autogenerada para Tablas y Registros

Implementar endpoint GET /api/v1/bases/{baseId}/tables para listar tablas de una base.
Implementar endpoint POST /api/v1/bases/{baseId}/tables para crear nueva tabla.
Implementar endpoint GET /api/v1/tables/{tableId}/records con soporte para paginación, filtros y ordenamiento.
Implementar endpoint POST /api/v1/tables/{tableId}/records para inserción individual o por lotes (bulk insert).
Implementar endpoint PATCH /api/v1/tables/{tableId}/records/{recordId} para actualización parcial de celdas.
Implementar endpoint DELETE /api/v1/tables/{tableId}/records/{recordId} para eliminación de registros.

2.4 Autenticación Local y Claves de API (API Keys)

Sistema de registro e inicio de sesión de usuario local (email + contraseña con hash bcrypt/argon2).
Autenticación basada en Tokens JWT (Access Token y Refresh Token).
Generador de Claves de API (pat_XXXXXXXXXXXX / Personal Access Tokens) para acceso externo programático.


FASE 3: TIPOS DE DATOS Y CAMPOS DETALLADOS
3.1 Campos de Texto e Información Básica

Campo Single Line Text (Texto plano de una línea, límite de caracteres configurable).
Campo Long Text (Texto multilínea, formato enriquecido Markdown, saltos de línea).
Campo Email (Validación de formato de correo electrónico, enlace mailto: directo).
Campo Phone Number (Formateador de número telefónico, enlace tel: directo).
Campo URL (Validación de sintaxis de enlace web, apertura en nueva pestaña).

3.2 Campos Numéricos y Financieros

Campo Number (Entero o Decimal, precisión decimal configurable, separadores de miles).
Campo Currency (Formateador de moneda con símbolo configurable: USD $, EUR €, COP $, etc.).
Campo Percent (Formateador de porcentaje, conversión automática decimal/porcentaje).
Campo Rating (Calificación visual por estrellas o íconos, rango configurable de 1 a 10).
Campo Duration (Formato de tiempo en h:mm, h:mm:ss o días/horas/minutos).

3.3 Campos de Selecciones y Estado

Campo Checkbox (Estado booleano Verdadero/Falso, casilla interactiva en celda).
Campo Single Select (Opción única de lista predefinida, asignación de color personalizado por opción).
Campo Multiple Select (Múltiples opciones de lista predefinida, etiquetas con colores en celda).

3.4 Campos de Fecha y Tiempo

Campo Date (Seleccionador de fecha con calendario emergente, formatos configurable ISO/US/EU).
Campo Date with Time (Soporte para hora en formato 12h/24h y zona horaria configurable).

3.5 Campos de Archivos Adjuntos (Attachments)

Campo Attachment (Carga de imágenes, PDF, documentos mediante Drag & Drop).
Subida directa a MinIO con generación de previsualizaciones (thumbnails) para imágenes.
Visor emergente modal para previsualizar PDF, imágenes y descargar archivos adjuntos.

3.6 Campos Calculados y Metadatos de Sistema

Campo Auto Number (Contador numérico autoincremental por registro dentro de la tabla).
Campo Created Time (Marca de tiempo inmutable con la fecha y hora de creación del registro).
Campo Last Modified Time (Marca de tiempo actualizada automáticamente ante cualquier cambio en el registro).
Campo Created By (ID / nombre del usuario que creó el registro).
Campo Last Modified By (ID / nombre del usuario que realizó la última modificación).
Campo Formula (Evaluador de expresiones matemáticas, concatenación de texto y lógica condicional IF, AND, OR, CONCAT, SUM, UPPER, LOWER).


FASE 4: RELACIONES ENTRE TABLAS, LOOKUP Y ROLLUP
4.1 Campo de Relación ("Link to Another Record")

Permitir conectar un registro de la Tabla A con uno o varios registros de la Tabla B.
Configuración de relación Unidireccional o Bidireccional (crear automáticamente campo inverso en Tabla B).
Soporte para relación 1:1, 1:N y N:M (usando tabla de unión / junction table interna).
Selector interactivo modal/dropdown en celda para buscar y seleccionar registros vinculados.
Renderizado visual de registros vinculados como etiquetas con el valor del campo primario.

4.2 Campo de Búsqueda ("Lookup Field")

Permitir extraer y mostrar el valor de un campo específico desde los registros vinculados en un campo Link.
Actualización automática del valor en tiempo real cuando el registro de origen cambia.
Manejo de múltiples valores cuando la relación vincula más de un registro (presentación como lista/array).

4.3 Campo de Agregación y Resumen ("Rollup Field")

Permitir aplicar funciones de agregación sobre los campos de los registros vinculados.
Función de agregación SUM(values) (Suma numérica).
Función de agregación AVERAGE(values) (Promedio numérico).
Función de agregación COUNT(values) (Conteo de elementos existentes).
Función de agregación MAX(values) y MIN(values) (Valores máximo y mínimo).
Función de agregación ARRAYJOIN(values, separator) (Concatenación de texto con separador).
Función de agregación COUNTA(values) (Conteo de celdas no vacías).


FASE 5: VISTAS Y CONFIGURACIÓN VISUAL DE TABLAS
5.1 Vista de Cuadrícula (Grid View)

Renderizado en tabla interactiva con celdas editables al hacer doble clic o presionar Enter.
Desplazamiento virtualizado (Virtual Scrolling) para renderizar eficientemente miles de filas sin degrada de memoria.
Fijación de columnas (Freeze Columns) para mantener la columna primaria visible durante el scroll horizontal.
Reordenamiento de filas y columnas mediante arrastrar y soltar (Drag & Drop).
Ajuste de altura de fila (Compacta, Mediana, Alta, Extra Alta).
Fila de resumen inferior (Footer Summary) con conteo, suma, promedio, min, max por columna.

5.2 Vista Kanban (Kanban View)

Selección de un campo tipo Single Select para definir las columnas/estados del tablero.
Mover tarjetas entre columnas mediante Drag & Drop, actualizando automáticamente el valor del campo Single Select.
Configuración de campos visibles dentro de cada tarjeta Kanban.
Columna especial para "Sin estado" (Registros con valor nulo en el campo de agrupación).

5.3 Vista Galería (Gallery View)

Renderizado de registros como una cuadrícula de tarjetas de catálogo/tarjetero.
Selección de campo de imagen/adjunto para usar como portada (Cover Image) de la tarjeta.
Selección y reordenamiento de campos de texto/datos visibles en el cuerpo de la tarjeta.
Clic en tarjeta para abrir la vista detallada en modal expandido.

5.4 Vista Calendario (Calendar View)

Selección de un campo tipo Date para mapear la posición de los registros en un calendario mensual/semanal.
Mover eventos entre días mediante Drag & Drop para cambiar la fecha del registro automáticamente.
Configuración del título y campos secundarios visibles en el bloque del evento.

5.5 Vista Línea de Tiempo / Gantt Simplificado (Timeline View)

Selección de campo de Fecha de Inicio y Fecha de Fin.
Renderizado de barras horizontales sobre un eje temporal con zoom por Días, Semanas, Meses.
Modificación de fechas mediante el estiramiento o desplazamiento de las barras temporales.

5.6 Motor de Operaciones y Filtros sobre Vistas

Filtrado Avanzado: Creación de grupos de reglas condicionales (Operadores: es, no es, contiene, está vacío, es posterior a, etc.) con combinadores AND / OR.
Ordenamiento (Sorting): Múltiples niveles de ordenamiento ascendente/descendente por cualquier campo.
Agrupamiento (Group By): Agrupar filas visualmente por campos tipo Single Select, Fecha o Relación con cabeceras colapsables y conteos por grupo.
Ocultar/Mostrar Campos: Menú para seleccionar qué columnas se muestran u ocultan en cada vista.
Formato Condicional: Resaltado de color de fondo o texto en celdas/filas que cumplan reglas condicionales.


FASE 6: GENERADOR Y VISTA DE FORMULARIOS (FORM VIEWS)
6.1 Constructor de Formularios (Form Builder)

Vista de diseño para arrastrar y organizar los campos de la tabla que formarán parte del formulario.
Personalización del título del formulario, logotipo, encabezado y descripción explicativa.
Marcado de campos como "Requerido / Obligatorio".
Personalización de etiquetas de campo (labels) y textos de ayuda (help text / placeholders).
Posibilidad de ocultar campos específicos del formulario público.

6.2 Enlace Público y Experiencia de Usuario en Formulario

Generación de URL pública única e independiente para compartir el formulario (/forms/f_XXXXXXXXXX).
Soporte para pre-llenado de campos mediante parámetros URL (?prefill_Nombre=Juan).
Validación de tipos de datos e insumos obligatorios antes de permitir el envío en el cliente.
Carga de archivos adjuntos directamente desde la interfaz del formulario público hacia MinIO.

6.3 Acciones Posteriores al Envío

Configuración del mensaje de confirmación/agradecimiento personalizado tras el envío.
Opción para permitir enviar otra respuesta o redirigir a una URL específica tras completar el formulario.
Creación inmediata del registro en la tabla correspondiente al recibir el envío.


FASE 7: DASHBOARDS E INTERFACES (INTERFACE DESIGNER)
7.1 Lienzo de Diseño de Dashboards (Canvas & Grid Layout)

Crear sección de "Interfaces / Dashboards" independiente de la vista de tabla.
Lienzo interactivo basado en cuadrícula flexible para agregar, redimensionar y arrastrar widgets.
Selección de la Base de Datos y Tabla origen para conectar los widgets del dashboard.

7.2 Widgets Métricos y KPIs

Widget Métrica (KPI Card): Muestra un valor numérico destacado (Conteo total de registros, Suma de columna, Promedio).
Configuración de etiqueta, icono, prefijo/sufijo de moneda o unidad.
Opción de aplicar filtro interno al widget (ej. "Suma de Ventas donde Estado = 'Completado'").

7.3 Widgets Gráficos Visuales

Gráfico de Barras (Bar Chart): Comparativa de categorías (Eje X: Campo de agrupación, Eje Y: Conteo o Suma).
Gráfico de Líneas (Line Chart): Análisis de tendencias temporales (Eje X: Campo de Fecha).
Gráfico de Pastel / Donas (Pie/Donut Chart): Distribución porcentual por categorías.
Leyendas interactivas, colores personalizados por serie y tooltips emergentes con datos exactos.

7.4 Widgets de Datos y Listas

Widget Tabla Resumen: Inserción de una vista de tabla reducida dentro del dashboard.
Widget Lista de Tarjetas: Vista de tarjetas compactas para seguimiento rápido de registros clave.

7.5 Controles de Filtro Global para Dashboard

Selector de Filtro Global (dropdown de fecha, usuario o estado) que afecta dinámicamente a todos los widgets del dashboard simultáneamente.


FASE 8: BÚSQUEDA, IMPORTACIÓN/EXPORTACIÓN Y MOTOR DE EVENTOS
8.1 Búsqueda Rápida y Global

Barra de búsqueda en tabla para filtrado instantáneo por coincidencia de texto en cualquier celda.
Búsqueda global a nivel de Base de Datos para encontrar registros en múltiples tablas.

8.2 Importador de Datos (CSV / Excel)

Asistente modal para subir archivos .csv o .xlsx.
Mapeo automático inteligente de columnas del CSV con campos existentes o detección para crear nuevos campos.
Detección automática del tipo de dato (Números, Fechas, Booleans, Cadenas).
Muestreo previo y vista previa de los datos antes de ejecutar la importación masiva.

8.3 Exportador de Datos

Exportación de la vista actual a archivo .csv.
Exportación completa de datos de la tabla en formato .json estructurado.

8.4 Webhooks y Eventos de Registros

Panel de configuración para registrar URLs de Webhooks receptores.
Disparo de evento HTTP POST al crear un registro (record.created).
Disparo de evento HTTP POST al actualizar un registro (record.updated).
Disparo de evento HTTP POST al eliminar un registro (record.deleted).
Log de historial de envíos de webhooks con código de estado HTTP y reintentos automáticos.


3. GUÍA DE ESTRUCTURA DEL PROYECTO (CÓDIGO FUENTE)
Para mantener una arquitectura limpia y modular durante la implementación, se recomienda seguir la siguiente estructura de carpetas en el repositorio:

/ (Raíz del proyecto)

├── docker-compose.yml          # Configuración multi-contenedor

├── .env.example                # Plantilla de variables de entorno

├── nginx.conf                  # Configuración del proxy inverso

├── setup.sh                    # Script de inicialización

├── backend/                    # Código fuente del servidor/API

│   ├── src/

│   │   ├── modules/

│   │   │   ├── workspaces/     # Módulo de Espacios de Trabajo

│   │   │   ├── bases/          # Módulo de Bases de Datos

│   │   │   ├── tables/         # Módulo de Tablas y Esquemas

│   │   │   ├── fields/         # Módulo de Tipos de Campo y Fórmulas

│   │   │   ├── records/        # Módulo de CRUD de Registros

│   │   │   ├── views/          # Módulo de Filtros, Sorts, Vistas

│   │   │   ├── forms/          # Módulo de Formularios Públicos

│   │   │   ├── interfaces/     # Módulo de Dashboards y Widgets

│   │   │   └── webhooks/       # Módulo de Integraciones de Webhooks

│   │   ├── common/             # Helpers, Evaluador de Fórmulas, MinIO S3

│   │   └── main.ts

│   └── Dockerfile

├── frontend/                   # Código fuente de la interfaz web

│   ├── src/

│   │   ├── components/

│   │   │   ├── grid/           # Componente Tabla Virtualizada

│   │   │   ├── kanban/         # Componente Tablero Kanban

│   │   │   ├── gallery/        # Componente Galería de Tarjetas

│   │   │   ├── calendar/       # Componente Calendario

│   │   │   ├── forms/          # Diseñador y Renderizador de Formularios

│   │   │   ├── dashboards/     # Diseñador de Dashboards y Widgets

│   │   │   └── fields/         # Renderizadores de Celdas por Tipo

│   │   ├── pages/

│   │   └── store/              # Estado Global (Zustand / Redux / Pinia)

│   └── Dockerfile

