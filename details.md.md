# Especificación completa de Airtable (para clon self-hosted)

**Propósito:** este documento es la especificación funcional exhaustiva de Airtable, redactada como checklist de implementación para que un agente de IA construya, paso a paso, una plataforma **self-hosted y dockerizable** de tipo "spreadsheet-database hybrid" equivalente a Airtable (funcionalidad de plan alto).

**Fuentes:** investigación de 7 dimensiones sobre documentación oficial de Airtable (support.airtable.com), más verificación cruzada de conflictos. Cada ítem del checklist está basado en esa investigación.

---

## 1. Introducción

Airtable es una plataforma cloud no-code/low-code que combina la familiaridad de una hoja de cálculo con la potencia de una **base de datos relacional**: la documentación y el mercado la describen como un *"spreadsheet-database hybrid"*. La diferencia clave frente a una hoja de cálculo tradicional es que **los campos tienen tipo de dato** (texto, número, fecha, selección, adjuntos, fórmula…) y que **los registros pueden vincularse entre tablas** mediante *linked records*, lo que la convierte en una base de datos relacional con una única fuente de verdad compartida. El usuario organiza, visualiza y automatiza flujos de trabajo **sin escribir SQL ni código**, aunque dispone de una capa de scripting y una API REST para desarrolladores.

**¿Para qué sirve?** Para construir aplicaciones de gestión a medida sin programar: cada "base" contiene tablas de datos, vistas para verlos de múltiples formas (grid, kanban, calendario, galería, timeline, Gantt, lista), formularios para capturar datos, interfaces (dashboards y apps multipágina) para presentarlos a distintos públicos, y automatizaciones (trigger → acciones) para mover trabajo sin intervención manual. El conjunto *base + automatizaciones + interfaces + extensiones* es lo que Airtable denomina una **"app"**.

**Casos de uso típicos** (documentados en la investigación): gestión de proyectos y trackers, calendarios de contenido/marketing, CRM y pipelines de ventas, gestión de inventario, planificación de eventos, RR. HH. y reclutamiento (applicant tracking), roadmaps de producto, seguimiento de bugs, catálogos y directorios.

**Historia breve.** Airtable fue fundada en **2012** en San Francisco por **Howie Liu** (CEO; había vendido su startup anterior, Etacts, a Salesforce en 2010), **Andrew Ofstad** (ex-Google, PM del rediseño de Google Maps) y **Emmett Nicholas** (ingeniero fundador, ex-Stack Overflow). Tras ~2 años en sigilo, lanzó una beta solo por invitación en 2014 y se hizo pública en **marzo de 2015**. Liu la concibió como un "Force.com para no desarrolladores". La compañía captó ~1.400 M USD en 7 rondas; la Serie F de 735 M USD (diciembre de 2021) la valoró en ~11.700 M USD, y declara más de 500.000 organizaciones clientes, incluido ~80% del Fortune 100. En 2023 hubo despidos y pivote a enterprise; desde 2025 se reposiciona como plataforma "AI-native" (las funciones de IA están **excluidas** de esta especificación).

**Límites por plan (solo referencia informativa; la especificación apunta a la funcionalidad completa):**

| Límite | Free | Team | Business | Enterprise Scale |
|---|---|---|---|---|
| Registros por base (acumulado entre tablas) | 1.000 | 50.000 | 125.000 | ~500.000 |
| Adjuntos por base | 1 GB | 20 GB | 100 GB | 1 TB |
| Ejecuciones de automatizaciones/mes | 100 | 25.000 | 100.000 | 500.000 |
| Historial de revisiones | 2 semanas | 1 año | 2 años | 3 años |
| Llamadas API / workspace / mes | 1.000 | 100.000 | Ilimitadas | Ilimitadas |

Límites estructurales comunes a todos los planes: 1.500 bases por workspace · 1.000 tablas por base · 1.000 vistas por base · 500 campos por tabla · 10.000 opciones por campo select · máx. 3 campos congelados por vista · 100.000 caracteres por campo de texto / por registro al pegar · papelera de base 7 días / de workspace 30 días · API 5 req/s por base. (Fuentes secundarias citan un tope de ~100.000 registros por tabla; se trata como referencia de planes, no como requisito de implementación.)

**Nota terminológica:** Airtable está migrando el término "base" a "app" en su interfaz. En este documento se usa **base** (con esta nota), salvo en "app" cuando se habla del conjunto base+interfaces+automatizaciones.

---

## 2. Cómo usar este documento

Guía para la IA implementadora:

- Cada funcionalidad implementable es una línea `- [ ]`. Al completar y verificar un ítem, márcalo como `- [x]`.
- Los sub-ítems con sangría detallan opciones de configuración, valores concretos o comportamientos obligatorios del ítem padre; un ítem padre solo puede marcarse completo cuando sus sub-ítems obligatorios lo están.
- **Orden sugerido de implementación:** Módulo 1 → Módulo 2 → Módulo 3 → Módulo 4 → Módulo 5 → Módulo 6 → Módulo 7 → Módulo 8. La sección final "Orden de implementación sugerido" agrupa todo en fases MVP → avanzado; síguela para construir incrementalmente.
- Los valores entre paréntesis o tras "—" son requisitos concretos (límites, formatos, valores por defecto), no sugerencias. Respétalos salvo que un requisito de la plataforma self-hosted lo contradiga explícitamente.
- La sección **Exclusiones** (§11) define lo que NO debe implementarse (IA y colaboración multiusuario). No añadas esas funcionalidades.
- Todo debe ser **dockerizable**: diseña persistencia (registros, adjuntos, configuración), servicios de fondo (scheduler de automatizaciones, colas) y almacenamiento de archivos con ese objetivo.

---

## 3. Módulo 1 — Arquitectura y estructura de datos

### 3.1 Jerarquía estructural

- [ ] Jerarquía de datos — Workspace → Base → Tabla → Registro (record) → Campo (field); las vistas (views) cuelgan de cada tabla.
  - [ ] **Workspace** — contenedor de colecciones de bases; en Airtable está ligado a un tipo de plan (en self-hosted, a la instancia).
  - [ ] **Base** — contiene toda la información de un proyecto o colección (análogo a una carpeta con archivos); organizada en tablas.
  - [ ] **Tabla** — conjunto de registros de un mismo tipo dentro de una base.
  - [ ] **Registro** — ítem individual de una tabla (fila).
  - [ ] **Campo** — columna de una tabla con un tipo de dato; cada campo guarda una variable del registro.
- [ ] Concepto "app" — la suma de base + automatizaciones + interfaces + extensiones (la base es la capa de base de datos relacional de la app).
- [ ] Límites estructurales a implementar como constantes configurables — 1.500 bases/workspace, 1.000 tablas/base, 1.000 vistas/base, 500 campos/tabla, 10.000 opciones/select, 1.000 opciones seleccionadas por registro en multi-select, 100.000 caracteres por campo de texto.
- [ ] IDs de sistema — identificadores con prefijo por entidad: registro `rec` + 14 caracteres alfanuméricos, base `app…`, tabla `tbl…`, vista `viw…`, campo `fld…`, workspace `wsp…`, página de interfaz `pag…`; el `record_id` es inmutable y es la clave real (el primary field NO es la clave).

### 3.2 Pantalla de inicio (home screen)

- [ ] Home screen con barra lateral izquierda y barra superior.
  - [ ] Botón de colapsar sidebar.
  - [ ] Búsqueda global de workspaces, bases e interfaces (atajo ⌘K / Ctrl+K, "quick base switcher").
  - [ ] Menú de ayuda.
  - [ ] Menú de cuenta.
  - [ ] Sección Home, sección Starred (favoritos con estrella de workspaces/apps/interfaces), sección Workspaces (con botón + para crear workspace).
  - [ ] Botón "+ Create" — elegir workspace destino y crear app (desde cero, desde plantilla o importando).
  - [ ] Enlaces rápidos al pie del sidebar — plantillas ("Templates and apps") e Import.
- [ ] Vistas de la home — alternar Lista / Grid; filtrar por fecha de apertura y por organización; fijar (pin) hasta 3 apps en la página de un workspace.
- [ ] Acciones al pasar el cursor sobre una app — abrir en la pestaña "Data", marcar con estrella, y menú "…" con: renombrar, mover, duplicar, eliminar, personalizar icono y color.
- [ ] Creación de base desde home — opciones: desde cero, desde plantilla o importando (CSV, Excel, Google Sheets; ver Módulo 8).

### 3.3 Pantalla de base (anatomía)

- [ ] Navegación superior en 3 pestañas — **Data** (tablas y vistas; experiencia por defecto), **Automations** (automatizaciones trigger→acción), **Interfaces** (capa visual de apps sobre los datos).
- [ ] Menú "Tools" (esquina superior derecha) — agrupa Extensions, Library y herramientas de mantenimiento (p. ej. comprobar dependencias).
- [ ] Historial de la base (base history) — icono junto a Share; incluye la **papelera de la base** (base trash).
- [ ] Menú del nombre de la base (⌄) — apariencia (icono/color), renombrar, duplicar, eliminar, base guide.
- [ ] Base guide — descripción opcional de la base que se muestra al abrirla por primera vez.

### 3.4 Gestión de tablas

- [ ] Pestañas horizontales de tablas bajo la barra superior — navegar entre tablas con clic en la pestaña.
- [ ] Crear tabla — botón "+ Add or import" a la derecha de las pestañas (tabla vacía o tabla importada).
- [ ] Renombrar tabla — menú ⌄ de la pestaña → "Rename table"; incluye configurar "What should each record be called?" (nombre singular de los registros de la tabla).
- [ ] Eliminar tabla — menú ⌄ → "Delete table" (va a la papelera de la base, 7 días).
- [ ] Ocultar/mostrar tabla — menú ⌄ → "Hide table" / "Show table".
- [ ] Duplicar tabla — clic derecho en la pestaña → duplicar, con opción de copiar también los datos, incluidas vistas y formularios.
- [ ] Descripción de tabla — editable desde el menú ⌄ de la tabla.

### 3.5 Gestión de registros

- [ ] Crear registro — botón "+" en la esquina inferior izquierda de la tabla (o al final de la última fila); clic derecho sobre un registro → "Insert record above/below"; o teclear en la última fila vacía.
- [ ] Duplicar registro — clic derecho → "Duplicate record" (solo de uno en uno; para varios: copiar/pegar, ver abajo).
- [ ] Eliminar registro(s) — clic derecho → "Delete record"; con selección múltiple → "Delete all selected records"; los registros eliminados van a la papelera de la base durante 7 días.
- [ ] Selección múltiple — checkboxes de fila a la izquierda del número de registro; clic+arrastrar sobre rangos de celdas; Shift+clic para rangos.
- [ ] Copiar/pegar — soporta copiar rangos de celdas y filas completas, incluso entre bases respetando tipos compatibles (⌘/Ctrl+C, ⌘/Ctrl+X, ⌘/Ctrl+V; pegar el mismo valor en múltiples celdas seleccionadas).
  - [ ] Límite de 100.000 caracteres por registro al pegar.
  - [ ] Al pegar en un campo linked record — casar cada valor por coincidencia exacta con el primary field de la tabla enlazada o crear registros nuevos; recomendación de lotes (200–300 registros; ~1.000 valores en campos enlazados).
  - [ ] Al pegar filas nuevas, puede aparecer el modal "Expand the table" → Continue.
- [ ] Fill handle — cuadrado en la esquina inferior derecha de la celda seleccionada; rellena celdas adyacentes en horizontal/vertical y continúa series numéricas y de fechas (arrastrar "1, 2" → "3, 4…").
- [ ] Reordenar registros arrastrando — drag handle en el extremo izquierdo del registro (área del número); NO posible si la vista tiene agrupación u ordenación aplicada (el orden manual solo existe en vistas sin sort).
- [ ] Record templates — plantillas de registro para crear registros pre-rellenados (referencia; usadas también en automatizaciones e interfaces).

### 3.6 Gestión de campos

- [ ] Crear campo — icono "+" a la derecha del último encabezado → elegir tipo → nombrar → "Create field"; también desde el menú de un encabezado: "Insert left" / "Insert right".
- [ ] Editar campo — flecha ⌄ del encabezado → "Edit field" (renombrar, cambiar tipo, valores por defecto y opciones del tipo) → "Save"; doble clic sobre el encabezado abre la edición.
- [ ] Descripción de campo — "Edit field description".
- [ ] Duplicar campo — ⌄ → "Duplicate field" (nombre, celdas o ambos).
- [ ] Eliminar campo — ⌄ → "Delete field" (a papelera de la base).
- [ ] Ocultar/mostrar campos — desde "Hide fields" de la barra de vista (modal con toggles, buscador "Find a field", Hide all/Show all) o desde el encabezado → "Hide field"; también desde el registro expandido ("Show XX hidden fields" → "Unhide field"). Ocultar es **por vista**, no borra datos; el campo primario no se puede ocultar.
- [ ] Fijar/congelar campos (freeze) — solo por arrastre de la barra divisoria azul ("Drag to adjust the number of frozen fields") bajo los encabezados; **máximo 3 campos congelados por vista**; el campo primario está congelado por defecto; los cambios afectan a todos los usuarios de la vista.
- [ ] Reordenar campos — arrastrar el encabezado del campo a otra posición (afecta a la configuración de la vista).
- [ ] Cambiar tipo de campo — desde "Edit field" (ver Módulo 3 § conversión de tipos para efectos sobre datos).
- [ ] Valores por defecto (default values) — solo para: Checkbox, Currency, Date, Multiple select, Number, Percent, Single line text, Single select (y User, fuera de alcance); aplican solo a registros nuevos; **nunca en el campo primario**.
- [ ] Copiar URL del campo (field URL).

### 3.7 Primary field

- [ ] Primary field — siempre la primera columna de la tabla; representa la descripción de cada registro; **no puede eliminarse, moverse ni ocultarse**; se usa como título del registro en toda la UI (selector de linked records, tarjetas Kanban, API, etc.).
- [ ] Tipos permitidos como primary field — Single line text, Long text, Date, Phone number, Email, URL, Number, Currency, Percent, Duration, Formula, Autonumber, Barcode.
- [ ] "Change primary field" — cambiar qué campo/tipo ocupa la primera posición (recomendación: duplicar antes el campo para no perder datos).
- [ ] El primary field NO tiene por qué ser único (la clave real es el `record_id`); admitir duplicados, recomendar nombres legibles.
- [ ] Fórmulas en el primary field — soportar `CONCATENATE()` / `&` y autonumeración con prefijo/sufijo (`CONCATENATE("MYPREFIX", {Autonumber}, "MYSUFFIX")`) para nombres únicos.

### 3.8 Registro expandido (expanded record)

- [ ] Abrir el registro expandido — barra espaciadora sobre una celda del registro, o icono de expandir (flechas diagonales) junto al número de registro; Shift+Espacio expande una celda individual.
- [ ] Panel/modal sin recargar página — muestra todos los campos editables del registro con iconos de tipo, etiquetas de campo a la izquierda y distinción visual editable/no editable.
- [ ] Botón "Show XX hidden fields" — ver/desocultar los campos ocultos en la vista actual.
- [ ] Edición directa de cada campo en el expandido; arrastrar y soltar archivos sobre campos de adjuntos.
- [ ] Historial de revisiones por registro — quién cambió qué y cuándo (usuario, automatización con nombre, sync, API); panel de actividad con selector "All activity / Revision history" (la parte de comentarios queda excluida, ver §11).
- [ ] Barra de acciones persistente — navegar al registro anterior/siguiente (Ctrl/⌘+Shift+, y Ctrl/⌘+Shift+.); Esc cierra.

### 3.9 Búsqueda

- [ ] Búsqueda global de la app — ⌘K / Ctrl+K busca workspaces, bases e interfaces (desde home o dentro de una base).
- [ ] Búsqueda en la vista actual (find-in-view) — Ctrl/⌘+F (o Ctrl/⌘+G) abre la barra de búsqueda de la vista y resalta coincidencias; Esc cierra; NO abre el buscador del navegador; icono de búsqueda en la esquina superior derecha de la base.
- [ ] La búsqueda busca en **todos** los registros de la vista aunque solo se haya cargado el preview inicial.
- [ ] Buscador "Find a view" en la barra lateral de vistas; buscador "Find a field" en el modal Hide fields.
- [ ] Limitación aceptada (fiel a Airtable): no existe búsqueda global nativa a través de todas las tablas de una base ni entre bases (documentar como decisión; opcionalmente mejorarla).

### 3.10 Papelera (trash)

- [ ] Papelera de base — tablas, campos y registros eliminados restaurables durante **7 días** (acceso desde el icono de historial de la base).
- [ ] Papelera de workspace — bases y workspaces eliminados restaurables durante **30 días**.

### 3.11 Plantillas

- [ ] Galería de plantillas — bases preconstruidas buscables/explorables por caso de uso, industria o funcionalidad, con vista previa y descripción; "Use template" → elegir workspace → "Add base".
- [ ] Datos de ejemplo limpiables — "Restart from scratch" al abrir una plantilla, y "Clear data" en el menú ⌄ de cada tabla.

### 3.12 Rendimiento de vistas grandes

- [ ] Preview de 1.000 registros — vistas con más de 5.000 registros visibles cargan inicialmente 1.000 ("Showing the first 1,000 of XX,XXX records") con botón "Load all records"; la búsqueda sí busca en todos.

---

## 4. Módulo 2 — Tipos de campo básicos

> Convenciones transversales: cada tipo se configura desde "Edit field"; se indica el nombre de API (`type`) para el modelo de datos interno. Tipos calculados/relacionales en Módulo 3. El campo **User/Collaborator** se documenta solo a nivel de existencia (la colaboración está excluida).

### 4.1 Single line text (`singleLineText`)

- [ ] Tipo Single line text — texto corto en una línea (nombres, títulos, identificadores); string; tipo por defecto del campo primario de una tabla nueva.
  - [ ] Límite de 100.000 caracteres por campo/registro.
  - [ ] Sin opciones de formato, máscara ni validación propia (sin límite de longitud configurable; workaround documentado: fórmula LEN()).
  - [ ] Opción de valor por defecto (texto) para registros nuevos.
  - [ ] En grid: texto plano en una línea, truncado visualmente; edición en celda o registro expandido. En formulario: input de una línea. En API: string UTF-8.

### 4.2 Long text / Rich text (`multilineText` / `richText`)

- [ ] Tipo Long text — texto multilínea para notas; string; límite 100.000 caracteres.
  - [ ] Toggle **"Enable rich text formatting"** — convierte el campo en rich text (tipo API `richText`).
  - [ ] Estilos inline: negrita (Cmd/Ctrl+B), cursiva (Cmd/Ctrl+I), tachado, código inline, hipervínculos (Cmd/Ctrl+K).
  - [ ] Estilos de bloque: Paragraph, Quote (`>`), Code block, encabezados H1/H2/H3 (`#`/`##`/`###`), listas numeradas (`1.`), bullets (`-`/`*`) y checkboxes (`[ ]`/`[x]`).
  - [ ] Almacenamiento como string Markdown (variante propia de Airtable); al recuperarlo vía API incluye `\n` final; en fórmulas se reduce a texto plano con saltos de línea; HTML incrustado NO se renderiza.
  - [ ] En grid: truncado visual; en registro expandido: todo el contenido con formato. En formulario: textarea expandible con rich text disponible al RESPONDER (no al crear el formulario).
  - [ ] Sin valor por defecto (long text no está en la lista oficial de tipos con default).

### 4.3 Number (`number`)

- [ ] Tipo Number — numérico de propósito general (enteros o decimales).
  - [ ] Formato integer/decimal (presets) con **Decimal places 0–8** (opción API `precision`).
  - [ ] Separadores de miles/decimales configurables (incluida opción "Local" que adapta 1,234.0 vs 1.234,0 al idioma del usuario) y toggle "Show thousands separators".
  - [ ] **Large number abbreviation** — None / Thousands / Millions / Billions (34.1M en vez de 34,100,000; el valor sin abreviar se usa al editar, filtrar y en fórmulas).
  - [ ] Toggle "Allow negative numbers".
  - [ ] Valor por defecto.
  - [ ] Vista "Preview" del resultado en el diálogo de configuración.
  - [ ] Números de 15+ dígitos se redondean (precisión de doble flotante) — advertir; para identificadores largos usar texto.
  - [ ] Sin validación nativa de rango min/max en grid (en formularios sí existe range limit, ver Módulo 5).

### 4.4 Currency (`currency`)

- [ ] Tipo Currency — subtipo numérico con formato monetario.
  - [ ] **Currency symbol** — campo de texto libre (por defecto `$`); NO soporta múltiples monedas en el mismo campo ni conversión de divisas.
  - [ ] Decimal places (API `precision` 0–7; UI por defecto 2 → `$1.00`).
  - [ ] Separadores de miles/decimales (ej. "Comma, period (1,000,000.00)"), toggle "Show thousands separator", Large number abbreviation, toggle "Allow negative numbers".
  - [ ] Valor por defecto.
  - [ ] En grid: número con símbolo prefijo ($1,234.56); en formulario: input numérico con símbolo prefijo visual; en API: número plano (el símbolo es metadato del campo, no viaja con el valor).

### 4.5 Percent (`percent`)

- [ ] Tipo Percent — almacena un número que se muestra como fracción de 100 con símbolo % (0,75 → "75%"); en API el valor es decimal (0 = 0%, 0.5 = 50%, 1 = 100%).
  - [ ] Precision 0–8; separadores de miles/decimales; toggle de separador de miles; valor por defecto.
  - [ ] **"Display as progress bar"** — barra de progreso en grid e interfaces (en formularios sigue siendo input numérico); color por defecto verde medio; personalización de color con **reglas condicionales por rango** (gana la primera regla que coincide); opción de mostrar el % junto a la barra. Aplica también a formula/rollup/lookup con formato Percent.

### 4.6 Duration (`duration`)

- [ ] Tipo Duration — duraciones en horas/minutos/segundos/milisegundos; internamente SIEMPRE almacena el valor en **segundos**.
  - [ ] Opción `durationFormat` con 5 formatos: `h:mm` (1:23), `h:mm:ss` (1:23:40), `h:mm:ss.s` (3:45.6), `h:mm:ss.ss` (3:45.67), `h:mm:ss.sss` (3:45.678).
  - [ ] Parsing de entrada dependiente del formato: bajo `h:mm` "1:30" = 1h30m; bajo `h:mm:ss` "1:30" = 90 segundos; un número suelto = minutos bajo `h:mm`, segundos en los demás formatos.
  - [ ] Valores fraccionarios se redondean HACIA ARRIBA al siguiente valor entero del formato (0.50 con `h:mm` → 0:01).
  - [ ] Separadores de miles/decimales personalizables (como Number/Currency/Percent).
  - [ ] En formulario: input de texto que acepta el mismo formato. No válido como eje Y de charts. Formulas/lookups/rollups numéricos pueden formatearse como duration. Para duraciones en días/semanas usar Number.

### 4.7 Date / DateTime (`date` / `dateTime`)

- [ ] Tipo Date — fecha con formato configurable; almacenamiento interno siempre en **GMT/UTC**.
  - [ ] **Date format** con 5 valores: **Local** (`l`, usa el idioma del navegador de cada usuario), **Friendly** (`LL`, "March 2, 2023"), **US** (`M/D/YYYY`), **European** (`D/M/YYYY`), **ISO** (`YYYY-MM-DD`); el default de campos nuevos intenta usar el idioma local del navegador.
  - [ ] Toggle **"Include time"** (convierte `date` en `dateTime`) con **Time format** 12-hour (`h:mma`) o 24-hour (`HH:mm`); la UI no permite introducir segundos (solo vía API/importación).
  - [ ] Zona horaria: toggle **"Use the same time zone for all collaborators"** (OFF por defecto → cada usuario ve su hora local; ON → se elige zona IANA del dropdown, GMT/UTC por defecto); toggle "Display time zone" para mostrar la abreviatura (EST). En API, `timeZone`: `utc` (default) / `client` / zona IANA.
  - [ ] Parsing de entrada manual según formato configurado (US: 11/15/23, 11/15/2023, 11/15; European: 15/11/23…; ISO: 2023-11-15; Friendly/Local: "January 15, 2023", "Jan 15 2023", "15 Jan 2023"); si se omite el año se asume el año en curso; rango soportado 1/1/0000–12/31/9999; widget de calendario al editar.
  - [ ] Opción "Default to current date" (rellena fecha/hora al crear el registro; no impide editar después).
  - [ ] En automatizaciones y API los valores son siempre **ISO 8601 en UTC** (`2026-11-15` o `2026-11-15T14:30:00.000Z`); con zona no-UTC, strings ambiguos se interpretan según la zona del campo; strings con offset, como timestamp absoluto.

### 4.8 Single select (`singleSelect`)

- [ ] Tipo Single select — selección de UNA opción de una lista predefinida; string; chip/etiqueta coloreada en grid, dropdown o lista en formulario.
  - [ ] Gestión de opciones: "Add option" (nombre libre), color asignable por opción, toggles de color-code y orden alfabético, reordenar arrastrando; **límite 10.000 opciones por campo**; no se puede pegar una lista de opciones de golpe.
  - [ ] **Default option** — una opción por defecto aplicada solo a registros nuevos.
  - [ ] Paleta de colores: 10 tonalidades (blue, cyan, gray, green, orange, pink, purple, red, teal, yellow) × variantes **Bright, Dark1, Light1, Light2** (40 combinaciones: `blueBright`, `redLight2`, `tealDark1`…); la variante base sin sufijo no se acepta como color de opción; cada opción tiene `id` estable (`sel…`).
  - [ ] Creación automática de opciones al escribir valores inexistentes vía API/automatización.
  - [ ] Modelo API: `options.choices: [{id?, name, color?}]`; al escribir celdas el valor es el nombre (string); borrado de opciones con flag `enableSelectFieldChoiceDeletion` (las celdas que la usaban quedan vacías).

### 4.9 Multiple select (`multipleSelects`)

- [ ] Tipo Multiple select — varias opciones por celda; array of strings; etiquetas coloreadas múltiples en grid, multi-select tipo tags en formulario.
  - [ ] Límites: 10.000 opciones definidas por campo; **máximo 1.000 opciones seleccionadas por registro**.
  - [ ] Misma configuración que single select (nombre, color por opción, color-code, orden alfabético, reordenar); el default admite **más de una opción** por defecto.
  - [ ] En API, escribir una celda sobrescribe el array completo (spread del valor actual para conservar); creación automática de opciones inexistentes al escribir.
  - [ ] Al agrupar vistas por un multi-select, los registros con varias opciones se agrupan por **COMBINACIÓN de opciones** (no por opción individual).

### 4.10 Checkbox (`checkbox`)

- [ ] Tipo Checkbox — booleano; en API `true` marcado / `null` desmarcado; en fórmulas = 1 / 0.
  - [ ] **Style** — icono ∈ {`check`, `xCheckbox`, `star`, `heart`, `thumbsUp`, `flag`, `dot`} y color ∈ los 10 Bright (`greenBright` … `grayBright`).
  - [ ] **Default** — estado por defecto checked/unchecked para nuevos registros.
  - [ ] En grid: casilla clicable (hover + clic alterna); en formulario: toggle/switch o checkbox; relleno en masa con fill handle.
  - [ ] Contar checkboxes: sumarlos ({A}+{B}+{C}) o rollup `SUM(values)`.

### 4.11 Rating (`rating`)

- [ ] Tipo Rating — valoración numérica visual (estrellas…); número entero 0–max; 0/vacío = sin valorar.
  - [ ] `icon` ∈ {`star`, `heart`, `thumbsUp`, `flag`, `dot`}; `max` = entero de **1 a 10** (5 por defecto); `color` ∈ los 10 Bright (`yellowBright` … `grayBright`).
  - [ ] En grid: fila de iconos (4 de 5 estrellas), clic para asignar; en formulario: selector interactivo; en API: entero.

### 4.12 Attachment (`multipleAttachments`)

- [ ] Tipo Attachment — uno o más archivos por celda; **tamaño máximo 5 GB por archivo individual**; cualquier tipo de archivo subible; sin opciones de configuración propias ni default value.
  - [ ] Previews soportados — imágenes (JPEG, PNG, GIF, TIFF, WebP, HEIC), documentos (PDF, DOC/DOCX, PPT, XLS, texto básico), audio según navegador (MP3, WAV, FLAC, M4A, AAC), vídeo según navegador (principalmente MP4 H264); el archivo original no se modifica y es descargable.
  - [ ] Subida: icono + de la celda (archivo local, URL, servicios cloud), drag & drop de múltiples archivos al grid para crear registros en bulk; reordenar archivos arrastrando dentro de la celda; renombrar, descargar y eliminar por archivo.
  - [ ] En grid: miniaturas para imágenes, icono+nombre para otros tipos; en formulario: uploader (drag & drop o examinar); en API: array de objetos `{id, url, filename, size, type, thumbnails…}`; añadir con `{url}`; escribir el array sobrescribe la celda; las URLs de adjuntos de la API **caducan a las 2 horas**.

### 4.13 URL (`url`)

- [ ] Tipo URL — una URL por celda (string); hipervínculo clicable en grid (nueva pestaña); input de texto en formulario; sin opciones (field options: n/a); validación de formato débil en Airtable nativo (decidir si el clon valida); válida como campo primario.

### 4.14 Email (`email`)

- [ ] Tipo Email — una dirección por celda (string); clic abre el cliente de correo nativo (mailto:); input de email en formulario; sin opciones; válida como campo primario; validación estricta solo en formularios del nuevo builder (ver Módulo 5).

### 4.15 Phone number (`phoneNumber`)

- [ ] Tipo Phone number — un teléfono (string); formatea cadenas de 10 dígitos como teléfono US/Canadá `(XXX) XXX-XXXX`; sin imposición de formato estricto; sin opciones; válido como campo primario; precaución: el formateo puede perderse al pasar por lookups en automatizaciones (workaround: single line text o fórmula intermediaria).

### 4.16 Autonumber (`autoNumber`)

- [ ] Tipo Autonumber — número único auto-incrementado por registro en orden de creación; garantiza UNICIDAD, no contigüidad (huecos al borrar; no se renumera al ordenar/filtrar).
  - [ ] Sin opciones de configuración; **solo lectura** (no editable en UI ni escribible/creable vía API); sin default value.
  - [ ] Renumeración: borrar y recrear el campo, o convertirlo a otro tipo y volver (asigna valores por orden de creación; en un campo nuevo, por el orden de la vista actual con registros ocultos al final).
  - [ ] Válido como campo primario; útil como identificador; no aparece en formularios como entrada.

### 4.17 Barcode (`barcode`)

- [ ] Tipo Barcode — escaneo de códigos de barras y QR con la cámara de la app móvil; objeto `{text, type}`; en web se ven los valores escaneados y se pueden editar manualmente.
  - [ ] Simbologías soportadas (16): UPCE, Code39, EAN13, EAN8, Code93, Code128, PDF417 (Macro), PDF417, QR (numeric, alphanumeric, byte/binary, Kanji), Aztec, Code39Mod43, Interleaved2of5, ITF14, DataMatrix, Semacode, UPC-A 1D.
  - [ ] Scan-only (no genera imágenes de código; no parsea Application Identifiers GS1 — guarda la cadena cruda); en grid: código en fuente monoespaciada; NO soportado en formularios; búsqueda por escaneo; válido como campo primario.

### 4.18 Button (`button`)

- [ ] Tipo Button — botón clicable en la celda que dispara una acción; configuración: label, style/color del botón y acción; no almacena datos (read-only, no creable por API).
  - [ ] Acciones disponibles (10 en Airtable): **Open URL** (URL fija o construida con FÓRMULA usando valores del registro, con `{}` y `ENCODE_URL_COMPONENT()`; enlaces a la misma base abren en la misma ventana), **Open in page designer**, **Send email with SendGrid**, **Send SMS with Twilio**, **Create document with Formstack**, **Attach stock photos with Pexels**, **Run script** (scripting extension), **Preview URL** (url preview extension), **Open custom extension**, **Open source record** (tablas sincronizadas). Para el clon: priorizar Open URL, Run script, Preview URL; el resto según integraciones disponibles.
  - [ ] En formularios no es un campo de entrada.

### 4.19 User / Collaborator (`singleCollaborator` / `multipleCollaborators`) — solo mención

- [ ] Tipo User (mención; colaboración excluida) — dropdown autogenerado con usuarios; toggle "Allow adding multiple users"; toggle "Notify users…"; soporta default value; en API objeto `{id, email, name?, profilePicUrl?}`. No profundizar (ver §11).

### 4.20 Record ID (identificador de sistema)

- [ ] Record ID — `rec` + 14 caracteres alfanuméricos, único e inmutable por registro; no es un field type; para mostrarlo en columna se crea fórmula `RECORD_ID()`; también visible en la URL del registro expandido y vía API; se usa en linked records, prefills de formularios, botones con URL formulaica y webhooks.

### 4.21 Paleta de colores (modelo de reimplementación)

- [ ] Paleta corporativa — 10 tonalidades (blue, cyan, gray, green, orange, pink, purple, red, teal, yellow) × 5 variantes (base, Bright, Dark1, Light1, Light2) = 50 colores; para selects/checkbox/rating se usan las variantes Bright (y Bright/Dark1/Light1/Light2 en selects); definir constantes RGB/hex por combinación.

---

## 5. Módulo 3 — Campos relacionales y calculados

> Marco: los campos computados calculan sus valores automáticamente (formula, lookup, rollup, count, autonumber, created/last modified time). Aplican **la misma lógica a todos los registros** y referencian **campos (columnas), no celdas**. Lookup, Rollup y Count **requieren un campo Link to another record** en la tabla.

### 5.1 Link to another record (`multipleRecordLinks`)

- [ ] Tipo Link to another record — almacena referencias a registros de la misma tabla (self-link) o de otra tabla de la misma base; fundamento del modelo relacional.
  - [ ] Vínculos bidireccionales y sincronizados — cambiar vínculos en cualquiera de los dos lados actualiza ambos.
  - [ ] **Backlink automático** — al crear el campo se crea el recíproco: entre tablas, al final de la tabla vinculada nombrado con el nombre de la tabla de origen; en self-link, justo después del nuevo campo nombrado "From field: [Nombre]" (renombrable, p. ej. Manager → Direct Reports); ambos renombrables sin romper el vínculo; si el backlink "no aparece" puede estar oculto por los campos ocultos de la vista.
  - [ ] Opción "Show display name instead of primary field" — muestra otro campo como nombre en el selector; NO afecta a automatizaciones, API ni fórmulas (siguen usando el primary field).
  - [ ] Opción "Allow linking to multiple records" — al desactivarla solo 1 registro por celda **en el picker manual** (no impide múltiples vínculos por automatizaciones o pegar; no altera vínculos existentes).
  - [ ] Opción "Limit record selection to a view" — restringe los registros visibles en el picker a los de una vista (no impide vincular fuera de la vista por otros medios).
  - [ ] Opción "Filter record selection by a condition" — filtra los registros del picker por condiciones (mismo matiz).
  - [ ] Límite duro: **100.000 registros vinculados en una sola celda**.
  - [ ] Picker de registros — buscar/seleccionar registros existentes de la tabla destino; opción de crear registro nuevo desde el picker.
  - [ ] Conversión texto → linked record — valores parseados **separados por comas** (valores con comas entre comillas dobles para no dividirse); se crea el backlink; los valores sin registro correspondiente **crean nuevos registros** automáticamente; si el primary field destino es computado (fórmula), los valores sin coincidencia se descartan.
- [ ] Tipos de relaciones soportadas — 1:1 (desmarcando "Allow multiple"; mejor consolidado en una tabla), 1:N, N:M (dos tablas con campos vinculados, o self-link).
- [ ] Junction tables (tablas de unión) — cuando la relación N:M tiene atributos (nota, fecha, cantidad, rol): tercera tabla con un campo vinculado a cada padre + campos propios; buenas prácticas: primary field con fórmula que combine datos (nombre único legible), lookups y rollups sobre los backlinks (p. ej. lookup de coste unitario → fórmula de coste por línea → rollup SUM del total).

### 5.2 Lookup (`multipleLookupValues`)

- [ ] Tipo Lookup — "arrastra" el valor de un campo específico de los registros vinculados, siempre actualizado sin duplicarlo; requiere linked record previo y vínculos reales.
  - [ ] Configuración: fuente (campo linked record), campo a consultar, toggle **"Only include linked records that meet certain conditions"** (condiciones campo/operador/valor combinables AND/OR en grupos, referenciando campos de la tabla vinculada), toggle **"Limit the number of items shown"**.
  - [ ] Con múltiples vínculos: concatena valores separados por comas (separador no configurable; workaround: rollup con `SUBSTITUTE(ARRAYJOIN(values), ",", " + ")`).
  - [ ] Internamente el resultado es un **array**; en fórmulas se accede como unidad (usar funciones de array o un rollup).
  - [ ] Soporta rich text si el campo consultado lo contiene; campos como teléfonos pueden perder formato (workaround: `{Lookup phone} & ""`).

### 5.3 Rollup (`rollup`)

- [ ] Tipo Rollup — agregación con funciones de fórmula sobre celdas de registros vinculados; construye un array `values` del campo elegido y aplica una fórmula de agregación (`AVERAGE(values)`…); se actualiza al vincular/desvincular.
  - [ ] Configuración: rollup source (campo linked record), campo a agregar de la tabla vinculada, fórmula de agregación (editor de fórmulas completo; no nombrar el campo "Values").
  - [ ] Sumarización condicional — toggle "Only include linked records … that meet certain conditions" (condiciones AND/OR en grupos sobre campos de la tabla vinculada); alternativa: IF dentro de la fórmula (`SUM(IF({Status}='Paid', values, 0))`).
  - [ ] No se puede hacer rollup de un rollup sobre la **misma** relación (evaluación circular); sí sobre un rollup de un nivel más profundo (evaluación de abajo hacia arriba).
  - [ ] Funciones de agregación (sobre `values`) — implementar TODAS:
    - [ ] `AND(values)` — true si todos son true (arrays vacíos = true).
    - [ ] `ARRAYCOMPACT(values)` — elimina strings vacíos y null (conserva `false` y strings con espacios).
    - [ ] `ARRAYFLATTEN(values)` — aplana arrays anidados (lookup-de-lookup).
    - [ ] `ARRAYJOIN(values, separator)` — array → string con separador.
    - [ ] `ARRAYSLICE(values, start, [end])` — subarray, índice base-1, negativos desde el final.
    - [ ] `ARRAYUNIQUE(values)` — solo elementos únicos.
    - [ ] `AVERAGE(values)` — media aritmética.
    - [ ] `CONCATENATE(values)` — une textos en uno solo.
    - [ ] `COUNT(values)` — cuenta solo valores numéricos no vacíos.
    - [ ] `COUNTA(values)` — cuenta valores no vacíos (texto y números).
    - [ ] `COUNTALL(values)` — cuenta todos los elementos incluidos vacíos (= nº de registros vinculados).
    - [ ] `MAX(values)` / `MIN(values)` — máximo / mínimo.
    - [ ] `OR(values)` — true si al menos un valor es true.
    - [ ] `SUM(values)` — suma de valores numéricos.
    - [ ] `XOR(values)` — true si un número impar de valores es true.
  - [ ] Además de los presets, la fórmula de agregación admite cualquier función de fórmula (`ROUND(AVERAGE(values), 2)`, `SUM(VALUE(values))`…).

### 5.4 Count (`count`)

- [ ] Tipo Count — número de registros vinculados en una celda de linked record; requiere linked record previo (si no: error "No available sources to count"); se actualiza dinámicamente.
  - [ ] Creación: "Choose a field in this table" → seleccionar el linked record a contar.
  - [ ] Toggle condicional "Only include linked records … that meet certain conditions" (igual que lookup/rollup).

### 5.5 Formula (`formula`)

- [ ] Tipo Formula — calcula un valor por registro con una fórmula escrita por el usuario; puede hacer matemáticas, comparar valores, manipular texto, trabajar con fechas y combinar campos **del mismo registro**.
  - [ ] Referencia a campos con **llaves** `{Nombre del campo}` (obligatorias con espacios; opcionales en nombres de una palabra); paréntesis alteran el orden de operaciones; strings entre comillas simples o dobles; escape `\` para comillas literales.
  - [ ] Editor de fórmulas: resaltado de sintaxis por colores (verde=funciones, morado=campos, naranja=números, teal=strings), emparejamiento de paréntesis, edición multilínea con plegado, avisos de error (paréntesis desbalanceados, espacio entre nombre de función y paréntesis).
  - [ ] **Limitación**: las fórmulas no pueden referenciar valores de otros registros (workarounds: self-link + lookup; linked record + lookup/rollup/count).
  - [ ] Pestaña **Formatting** según tipo de salida: numérica → decimal/integer/currency/percent/duration con precisión; fecha → formatos local/friendly/US/European/ISO + incluir hora + misma zona horaria; texto → opción "Change formula output to single select options"; booleana → formato Checkbox. (Si no aparecen opciones numéricas: envolver en `VALUE()`.)
- [ ] Operadores — `+ - * /` numéricos; `&` concatenación de texto; `> < >= <= = !=` comparación.
- [ ] Funciones de TEXTO (implementar todas con su firma):
  - [ ] `CONCATENATE(text1, [text2, ...])` — une textos.
  - [ ] `LEFT(string, howMany)` / `RIGHT(string, howMany)` — N caracteres desde inicio/final.
  - [ ] `MID(string, whereToStart, count)` — subcadena desde posición.
  - [ ] `LEN(string)` — longitud.
  - [ ] `LOWER(string)` / `UPPER(string)` — minúsculas/mayúsculas.
  - [ ] `TRIM(string)` — elimina espacios al inicio y final.
  - [ ] `SUBSTITUTE(string, old_text, new_text, [index])` — reemplaza todas las ocurrencias (o la n-ésima).
  - [ ] `REPLACE(string, start_character, number_of_characters, replacement)` — reemplaza por posición.
  - [ ] `FIND(stringToFind, whereToSearch, [startFromPosition])` — posición de la coincidencia; **0 si no se encuentra**; sensible a mayúsculas.
  - [ ] `SEARCH(stringToFind, whereToSearch, [startFromPosition])` — como FIND pero devuelve **vacío** si no hay coincidencia.
  - [ ] `REPT(string, number)` — repite el string N veces.
  - [ ] `T(value)` — devuelve el valor si es texto; si no, vacío.
  - [ ] `ENCODE_URL_COMPONENT(component_string)` — codifica para URL/URI.
  - [ ] `ARRAYJOIN([item1, item2, ...], separator)` — array → string con separador.
- [ ] Funciones NUMÉRICAS:
  - [ ] `SUM(number1, [number2, ...])` / `AVERAGE(...)` / `MAX(...)` / `MIN(...)`.
  - [ ] `ROUND(value, precision)` — redondeo al más cercano; `ROUNDUP(value, precision)` — alejándose de cero; `ROUNDDOWN(value, precision)` — acercándose a cero.
  - [ ] `CEILING(value, [significance])` / `FLOOR(value, [significance])` — múltiplo significativo superior/inferior (defecto 1).
  - [ ] `ABS(value)` — valor absoluto; `MOD(value, divisor)` — resto; `POWER(base, power)` — potencia; `SQRT(value)` — raíz cuadrada.
  - [ ] `INT(value)` — mayor entero ≤ valor.
  - [ ] `EXP(power)` — e^x; `LOG(number, [base])` — logaritmo (base 10 por defecto).
  - [ ] `EVEN(value)` / `ODD(value)` — entero par/impar más cercano (alejándose de 0).
  - [ ] `VALUE(text)` — texto → número.
  - [ ] `COUNT(n1, [...])` — cuenta elementos numéricos; `COUNTA(...)` — no vacíos; `COUNTALL(...)` — todos incluidos vacíos.
- [ ] Funciones LÓGICAS:
  - [ ] `IF(expression, value1, value2)` — condicional; admite IFs anidados y comprobación de vacío con `BLANK()`.
  - [ ] `AND(expression, [...])` / `OR(expression, [...])` — conjunción/disyunción.
  - [ ] `NOT(expression)` — invierte.
  - [ ] `XOR(expression1, [...])` — true si un número impar de argumentos es verdadero.
  - [ ] `SWITCH(expression, [pattern, result ..., default])` — mapeo de valores con default opcional.
  - [ ] `TRUE()` / `FALSE()` — valores lógicos (1/0 numéricamente).
  - [ ] `BLANK()` — valor vacío (también detecta celdas vacías).
  - [ ] `ERROR()` — devuelve `#ERROR!`; `ISERROR(expr)` — 1 si la expresión produce error.
- [ ] Funciones de FECHA Y HORA:
  - [ ] `DATEADD([date], [#], 'units')` — añade N unidades ('years', 'months', 'weeks', 'days', 'hours', 'minutes', 'seconds'; usar especificador completo).
  - [ ] `DATETIME_DIFF([date1], [date2], 'units')` — diferencia en unidades ('seconds' por defecto); devuelve enteros; negativo si date2 es posterior.
  - [ ] `DATETIME_FORMAT([date], '[output format]')` — formatea a string con especificadores (YYYY, MM, DD, dddd, h:mm A, LLLL…).
  - [ ] `DATETIME_PARSE(date, ['input format'], ['locale'])` — string → fecha estructurada.
  - [ ] `DATESTR([date])` — → string YYYY-MM-DD; `TIMESTR([date])` — → string HH:mm:ss.
  - [ ] `DAY([date])` / `MONTH([date])` / `YEAR([date])` / `HOUR([datetime])` / `MINUTE([datetime])` / `SECOND([datetime])` — componentes.
  - [ ] `WEEKDAY(date, [startDayOfWeek])` — día de la semana 0–6 (defecto domingo; opcional "Monday"); `WEEKNUM(date, [startDayOfWeek])` — número de semana del año.
  - [ ] `IS_AFTER([date1], [date2])` / `IS_BEFORE([date1], [date2])` — comparación 1/0.
  - [ ] `IS_SAME([date1], [date2], [unit])` — iguales hasta la unidad indicada.
  - [ ] `TODAY()` — fecha actual sin hora; `NOW()` — fecha y hora; se actualizan al recalcular, al cargar la base o ~cada 15 min con la base abierta.
  - [ ] `WORKDAY(startDate, numDays, [holidays])` — N días laborables después (excluye fines de semana y festivos en lista ISO separada por comas); `WORKDAY_DIFF(startDate, endDate, [holidays])` — días laborables entre fechas (cuenta ambos extremos).
  - [ ] `SET_TIMEZONE([date], [tz_identifier])` — fija zona IANA; **solo dentro de DATETIME_FORMAT**.
  - [ ] `SET_LOCALE([date], [locale_modifier])` — fija locale ('es', 'en-gb', 'zh-tw'…); **solo dentro de DATETIME_FORMAT**.
  - [ ] `TONOW([date])` / `FROMNOW([date])` — días entre la fecha actual y otra fecha (texto "25 days").
- [ ] Funciones de ARRAY (solo en rollups o cuando la entrada es un lookup):
  - [ ] `ARRAYCOMPACT(values)` / `ARRAYFLATTEN(values)` / `ARRAYJOIN(values, separator)` / `ARRAYUNIQUE(values)` / `ARRAYSLICE(values, start, [end])` (semántica como en Rollup, §5.3).
- [ ] Funciones de REGISTRO:
  - [ ] `CREATED_TIME()` — fecha/hora de creación del registro.
  - [ ] `LAST_MODIFIED_TIME([{campo1}, {campo2}, ...])` — última modificación de usuario en campos no computados; con argumentos, solo de los campos indicados.
  - [ ] `RECORD_ID()` — ID único e inmutable del registro (`rec…`); para URLs de registro, redirects `{record_id}`, record detail pages.
- [ ] Funciones REGEX (librería RE2):
  - [ ] `REGEX_MATCH(string, regex)` — 1 si coincide.
  - [ ] `REGEX_EXTRACT(string, regex)` — primera subcadena coincidente.
  - [ ] `REGEX_REPLACE(string, regex, replacement)` — reemplaza todas las coincidencias.

### 5.6 Created time (`createdTime`)

- [ ] Tipo Created time — fecha (y opcionalmente hora) de creación de cada registro (manual, formulario, API, integraciones); computado, **no editable**.
  - [ ] Mismas opciones de formato que el campo fecha (formato, incluir hora, misma zona horaria para todos, mostrar zona).
  - [ ] Función hermana `CREATED_TIME()` en fórmulas (formatearla para combinarla con texto: `"Created on " & DATETIME_FORMAT(CREATED_TIME(), "D/M/YY")`).
  - [ ] Campo hermano Created by (mención; muestra el creador, "anonymous" en envíos de formulario anónimos).

### 5.7 Last modified time (`lastModifiedTime`)

- [ ] Tipo Last modified time — fecha/hora más reciente en que un **usuario** actualizó el registro en un campo **no computado** (los cambios en campos computados se ignoran); no editable.
  - [ ] Configuración: **"All editable fields"** o **"Specific fields"** (selección de campos); pestaña Formatting como el campo fecha.
  - [ ] Con linked records: añadir/quitar un vínculo SÍ actualiza el last modified time; cambiar valores del registro vinculado en la otra tabla NO (workaround: last modified time en la tabla vinculada + lookup o rollup `MAX(values)`).
  - [ ] Valores en blanco posibles (registros nuevos sin edición; registros anteriores al tracking); patrón defensivo `IF(ISERROR(…), BLANK(), …)`.
  - [ ] Función hermana `LAST_MODIFIED_TIME()` / `LAST_MODIFIED_TIME({Status}, {Name})`.

### 5.8 Conversión entre tipos de campo

- [ ] Cambiar el tipo de un campo con datos — el sistema intenta convertir los valores actuales al nuevo tipo; algunas conversiones son destructivas (p. ej. texto → attachment borra los valores); advertir y recomendar duplicar el campo antes.
  - [ ] Texto → single select: crea opciones a partir de los valores.
  - [ ] Texto → linked record: parseo por comas, comillas dobles para valores con coma, creación automática de registros y de backlink (ver §5.1).
  - [ ] Tras la conversión, cada tipo ofrece sus opciones de personalización propias.

---

## 6. Módulo 4 — Vistas

> Marco: cada tabla admite múltiples vistas (límite 1.000 vistas por base, según documentación oficial). La **vista Grid es obligatoria**: se crea con cada tabla y toda tabla conserva al menos una vista grid colaborativa. La barra de la vista (view bar) incluye: botón "Views" (sidebar), nombre de la vista con ⌄ (menú de vista), Hide fields, Filter, Group, Sort, Color, selector de Row height y "Share view".

### 6.1 Grid view

- [ ] Vista Grid — hoja de cálculo: cada registro una fila, cada campo una columna; vista por defecto de toda tabla nueva.
  - [ ] Encabezados de campo (icono de tipo + nombre + flecha ⌄ de menú), filas numeradas con checkbox de selección, "+" al final de encabezados (nuevo campo) y "+" inferior izquierdo (nuevo registro).
  - [ ] **Row height** — 4 opciones: Short (por defecto, más densa), Medium, Tall, Extra Tall; a mayor altura más líneas de texto, más linked records, opciones de select e imágenes más grandes; exclusivo de grid entre vistas de base. Altura del encabezado ajustable arrastrando su borde inferior.
  - [ ] Sin toggle "wrap text" (decisión fiel a Airtable): el texto largo se ve con alturas mayores o celda expandida (Shift+Espacio).
  - [ ] **Summary bar** al pie — por campo, funciones según tipo: no numéricos (Empty, Filled, Percent Empty, Percent Filled, Unique, Percent Unique), checkbox (Checked, Unchecked, Percent Checked/Unchecked), numéricos (Sum por defecto, Average, Histogram, Min, Max, Range, Median, Standard Deviation), fechas (Earliest Date, Latest Date, Date Range days/months), adjuntos (tamaño total en bytes); con selección de rango, el resumen solo incluye la selección; con agrupación, resumen por grupo además del total.
  - [ ] Congelar columnas (máx. 3, ver Módulo 1 §3.6).
  - [ ] Menú de vista (⌄ junto al nombre): Rename view, Edit view description, Duplicate view, **Copy another view's configuration** (copia filtros, sorts, grupos, orden de campos…), **Download CSV**, **Print view**, Delete view.

### 6.2 Kanban view

- [ ] Vista Kanban — tarjetas apiladas por un **stacking field** de tipo single select, user o linked record (este último solo si "Allow linking to multiple records" está desactivado); apilado por UN solo campo (sin agrupación multinivel).
  - [ ] **Customize cards** — toggles por campo para mostrar/ocultar en tarjetas (Hide all/Show all, buscador), toggle **"Wrap long cell values"**; registros sin valor en un campo no muestran ese campo.
  - [ ] Imagen de portada desde un campo attachment (image field) con toggle para ajustar ("fit") la imagen en la tarjeta.
  - [ ] Arrastrar tarjetas entre pilas — actualiza el valor del campo de apilado en el registro.
  - [ ] Pilas colapsables (icono "Collapse"); encabezado de pila con número de registros.
  - [ ] Crear registro nuevo por pila (botón +); clic en tarjeta abre registro expandido.

### 6.3 Calendar view

- [ ] Vista Calendar — requiere al menos un campo de fecha; modos de visualización: **Day, 3 day, Week, 2 week, Month (por defecto), Custom (1–6 días o semanas)**; NO existe modo anual ni modo "agenda".
  - [ ] **Rangos start/end** — campo de fecha de fin opcional; registros con inicio y fin aparecen como rangos arrastrables (mover completo o estirar/encoger desde los bordes).
  - [ ] **Múltiples campos de fecha** — hasta **20 campos de fecha (o rangos)** en un mismo calendario, cada uno con su etiqueta.
  - [ ] En modos week/3-day/day con campos fecha-hora, línea de tiempo lateral; colapsar u ocultar fines de semana (solo con escala ≥ 1 semana).
  - [ ] Arrastrar un evento a otra fecha actualiza el campo de fecha; clic en una fecha crea un registro con la fecha prerrellenada.
  - [ ] Coloreado: por campo single select, por condiciones, y modo exclusivo del calendario: **colorear por el campo/rango de fecha** que origina cada tarjeta (con múltiples fechas trazadas); el color rellena toda la tarjeta del evento.

### 6.4 Gallery view

- [ ] Vista Gallery — registros como tarjetas grandes destacando adjuntos; al crearla se selecciona automáticamente el primer campo attachment como **cover field**.
  - [ ] Cover field — cambiar de campo attachment, quitarlo; slider **Crop/Fit** (recortar para rellenar vs ajustar entera); subir adjuntos arrastrando archivos sobre la portada; crear registros arrastrando archivos al botón "+"; scroll sobre la portada si hay varios adjuntos.
  - [ ] **Customize cards** — toggles por campo, Hide all/Show all (excepto primario), reordenar campos arrastrando (icono 6 puntos), buscador.
  - [ ] Filtrado y ordenación como en grid; tamaño de tarjeta NO configurable (el layout se ajusta automáticamente); texto acortado para uniformar tarjetas (sin wrap multilínea; texto completo al expandir).

### 6.5 Timeline view

- [ ] Vista Timeline — línea temporal horizontal desplazable; rasgo estrella: **swimlanes** (agrupar registros por cualquier campo en carriles visualmente distintos); requiere campo(s) de fecha; fechas de fin inclusivas; campos calculados (fórmula) impiden arrastrar barras.
  - [ ] **Escalas del eje temporal**: day, week, 2 week, month, quarter, 6 month, year, 2 year, 5 year, 10 year, cada una con subdivisiones configurables (p. ej. Quarter → Weeks / 2 weeks / Months); botones de flecha para navegar y botón "Today" (línea azul del día actual); opciones "Date visibility".
  - [ ] Summary bar del timeline — funciones: Count, Sum, Average, Min, Max, Range, Median y **Utilization** (asignación de recursos por persona/equipo según escala temporal; requiere campos numéricos y linked records; "Infinity%" = división por cero; no disponible si se agrupa por campo multivalor); resúmenes de grupo con nombre, rango de fechas y número de registros.
  - [ ] Diferencia con Gantt: cada swimlane = un GRUPO de registros (en Gantt, un carril = UN registro); no se puede imprimir ni exportar.
  - [ ] Layout **Gantt dentro de Timeline** (Appearance → Gantt; requiere record height "Short" y width "Precise").

### 6.6 Gantt view

- [ ] Vista Gantt — diagrama de Gantt con dependencias; configuración: campo **Start date**, campo **End date**, campo **Dependencies** (linked record auto-enlazado a la misma tabla, como "Predecessors" o "Successors") y toggle **"Use milestones"**.
  - [ ] Tasks vs milestones — task requiere inicio Y fin; milestone solo fecha de fin (diamante con línea vertical; solo campos de fecha reales, no fórmulas); botón "Add milestone" en la barra lateral.
  - [ ] **Dependencias** — se crean arrastrando desde el círculo blanco de un registro a otro (crea el vínculo en el campo de dependencias); dependencias inválidas (sucesor antes del fin del predecesor, o bucles) marcadas en rojo.
  - [ ] Toggle **"Highlight critical path"** — resalta la cadena de tareas que determina la fecha de fin del proyecto.
  - [ ] Barras arrastrables para reprogramar (excepto con campos calculados); filtrado, coloreado y **agrupación de hasta 3 niveles** (grupos colapsables en barra lateral).
  - [ ] Sin baselines nativas (decisión fiel a Airtable; documentar); relación de dependencia predecesor/sucesor simple (sin tipos FS/SS/FF/SF).

### 6.7 List view

- [ ] Vista List — vista jerárquica que muestra campos de **MÚLTIPLES tablas** a la vez, organizando registros en niveles vía linked records (Proyectos → Tareas → Subtareas).
  - [ ] Profundidad: hasta **10 capas** — 3 niveles de tablas enlazadas + 7 adicionales con el toggle **"Enable nested records"** (registros de la misma tabla anidados).
  - [ ] Configuración: Set levels (orden jerárquico y tablas, toggle nested records), Customize rows (visibilidad de secciones, **prefijo por ítem** desde campos checkbox/user/single-select, campos visibles por nivel), Filter y Sort **por nivel** (por tabla), Row height por nivel, renombrar la terminología de registros por nivel; mostrar/ocultar padres vacíos.
  - [ ] No soporta "Group by" ni summary bar agrupada; **record coloring soportado** como banderas de color junto a registros del primer nivel (resolución de conflicto documental: gana el doc más reciente).

### 6.8 Opciones transversales — Filter (filtros)

- [ ] Sistema de filtros por condiciones — condición = **campo + operador + valor**; filtrar no borra registros, solo los oculta en la vista; campos filtrados resaltados.
  - [ ] Operadores por tipo de campo: texto → "contains", "does not contain", "is empty", "is not empty" (estos dos sin valor); numéricos → "is", "is not", "is greater than", "is less than", "is greater than or equal to", "is less than or equal to", "is empty", "is not empty"; selects → "is", "is not", "is any of", "is none of"; linked records → "Is exactly", "Has any of", "Has all of", "Has none of"; checkbox → checked/unchecked.
  - [ ] Operadores de fecha — absolutos: "is before", "is after", "is on or before", "is on or after", "is"; relativos: "is within" y "is within the past/next week|month|year" (= últimos/próximos 7/30/365 días desde hoy, NO semana/mes/año natural).
  - [ ] Sensibilidad: "contains" es case-insensitive; "is" es case-sensitive.
  - [ ] Conjunciones **AND / OR** entre condiciones; **grupos de condiciones** con su propia conjunción.
  - [ ] Límites: máximo **49 condiciones de filtro por vista** (sueltas + dentro de grupos) y máximo **2 grupos condicionales anidados** (3 niveles de filtro).

### 6.9 Opciones transversales — Group (agrupación)

- [ ] Agrupación de registros — disponible solo en **Grid, Timeline, List y Gantt** (NO en kanban, calendar ni gallery); por campos (single select, user, linked record, multiple select, fecha/rango…); nuevos valores únicos crean grupos automáticamente.
  - [ ] Máximo **3 niveles de agrupación** (1 grupo principal + 2 subgrupos) mediante "Add subgroup".
  - [ ] Opciones: colapsar/expandir todos los grupos; cambiar campo y orden de cada grupo/subgrupo; mostrar/ocultar grupos sin registros; eliminar grupos; reordenar subgrupos arrastrando.
  - [ ] Arrastrar un registro entre grupos reasigna su valor (NO en grupos basados en campos computados: lookup/rollup/fórmula, que tampoco admiten añadir registros al grupo).
  - [ ] Cada grupo: barra de resumen con subtotales y count de registros; secciones plegables.
  - [ ] Con multi-select: agrupación por COMBINACIÓN de opciones.

### 6.10 Opciones transversales — Sort (ordenación)

- [ ] Ordenación multi-nivel — "Add another sort" para criterios primario/secundario/terciario…; dirección según tipo: texto A→Z/Z→A con orden natural ("z2" antes que "z11"), números 1→9/9→1, fechas earliest↔latest, checkbox ▢→✓, selects por orden de opciones First→Last/Last→First.
  - [ ] Reordenar criterios con drag handles; eliminar con X; "Copy from a view…" copia sorts (y opcionalmente grupos, filtros, orden de campos) de otra vista de la misma tabla.
  - [ ] Valores en blanco primero en orden ascendente (casi siempre).
  - [ ] Toggle **"Automatically sort records"** — si está activo, los registros se reordenan solos al cambiar valores y NO hay reordenación manual (campos ordenados con fondo naranja pálido); si está desactivado, ordenación manual arrastrando registros.
  - [ ] Ordenación también desde el encabezado del campo; el orden de una vista no afecta a otras vistas.

### 6.11 Opciones transversales — Hide fields / orden de campos

- [ ] Hide fields (grid) — toggles por campo, buscador "Find a field", Hide all/Show all (primario siempre visible), reordenar por arrastre con icono de 6 puntos; el botón muestra "X fields hidden".
- [ ] Equivalente en gallery/kanban: "Customize cards".
- [ ] El orden y visibilidad de campos es **por vista** y copiable entre vistas ("Copy another view's configuration").

### 6.12 Opciones transversales — Color (record coloring)

- [ ] Colorear registros — tres vías: (1) por **campo single select** (leyenda sincronizada con los colores del campo); (2) por **condiciones** (misma UI que filtros: condiciones y grupos AND/OR, un color por conjunto de condiciones, duplicable, color por defecto opcional, **prioridad por orden de lista** — gana la primera condición que coincide); (3) en calendar, por campo/rango de fecha.
  - [ ] Presentación por vista: grid → bandera junto al campo primario; calendar/gantt/timeline → todo el evento; kanban/gallery → línea lateral en la tarjeta; list → bandera en el primer nivel.
  - [ ] La configuración de color se incluye en los share links.

### 6.13 Sidebar de vistas y gestión de vistas

- [ ] Barra lateral de vistas — secciones: "My personal views", "More personal views", "My favorites", secciones personalizadas (tipo carpeta, con arrastrar y soltar), "More collaborative views"; vistas organizativas "My views" (favoritas + personales) y "All views".
- [ ] Acciones por vista (dropdown o "…"): renombrar, duplicar (Duplicate view), eliminar, cambiar tipo de colaboración, favorito/estrella ("Add to My favorites", sin límite, reordenables por arrastre).
- [ ] Buscador "Find a view" (coincidencias exactas y difusas); atajo ⇧⌘K / Ctrl+Shift+K para saltar entre vistas.
- [ ] Tipos de colaboración de vista — **Collaborative** (todos editan la configuración; tipo por defecto), **Personal** (solo tú la ves/configuras; no puede ser la única vista de una tabla — siempre existe al menos un grid colaborativo), **Locked**. (En el clon sin multiusuario pueden implementarse como configuración por vista con permiso del propietario.)
- [ ] **Locked views** (mención) — bloquean la configuración de la vista (filtros, visibilidad/orden de campos, altura, color…) hasta que un Owner/Creator la desbloquee explícitamente.

### 6.14 Share / Embed de vista

- [ ] Compartir vista — menú "Share and sync" → "Create link to view": enlace público de **solo lectura** de esa vista (respeta filtros, campos ocultos, grupos, ordenaciones y coloreado).
  - [ ] Link settings: "Allow viewers to copy data out of this view", "Show all fields in expanded records", restricción por dominio de email, **contraseña**, regenerar el enlace, deshabilitarlo.
  - [ ] Desde el mismo menú: permitir sync a otras bases, crear form view.
- [ ] **Embed** — "Embed this view" genera código iframe (vista previa + "Copy embed code") para insertar una copia viva de solo lectura en páginas web; el embed refleja la configuración de la vista; los filtros que referencian campos ocultos no funcionan en embeds públicos; deshabilitar el enlace desactiva el embed.

---

## 7. Módulo 5 — Formularios

> Marco: cada envío de formulario crea un **NUEVO registro** en la tabla asociada (los formularios NO editan registros existentes de forma nativa). Los campos **calculados no son soportados como inputs**. Airtable tiene tres experiencias: **form view** (clásica, ligada a tabla/vista), **form builder** (standalone forms, recomendado; los form views pueden "upgradearse") y **formularios dentro de Interfaces** (ver Módulo 6). Límite: 50 formularios por base (form builder). Las respuestas aparecen al final del grid salvo que filtros/agrupaciones lo impidan; disparan el trigger "When a form is submitted".

### 7.1 Creación

- [ ] Form view — view sidebar → Create → Form; título y tipo de vista (Collaborative/Personal); el formulario **se genera automáticamente con todos los campos mostrados en la primera vista grid** de la tabla.
- [ ] Form builder — pestaña Forms → "+ New form" (o plantillas) → elegir tabla existente o crear una nueva para los envíos → "Create form" → configurar → **Publish** (sin publicar, los cambios no se ven).
- [ ] Añadir campos nuevos a la tabla DESDE el formulario ("+ Add a field to this table" / "+ Create field"); duplicar un form view para probar cambios.
- [ ] "Upgrade to new forms" — convertir un form view clásico al nuevo builder (rompe triggers "When a form is submitted" y URLs prefilled: hay que actualizarlos).

### 7.2 Personalización (título, descripción, cover, logo)

- [ ] Título del formulario — se renderiza como **H1** bajo cover y logo (nuevo builder; doble clic para editar); "form title" público distinto del "form name" interno.
- [ ] Descripción — bajo el título; formato rico en el nuevo builder (párrafo, quote, code block, encabezados grande/mediano/pequeño, listas numeradas, bullets, checklist, negrita, cursiva, tachado, código, hyperlink); texto plano en el form view clásico.
- [ ] **Cover image** — form view: área de 240px de alto, ancho del navegador, mín. sugerido 800×240, objetivo 1800×480, recortable/rotatable; form builder: sugerido 1800×512, área renderizada 256px de alto, recorte responsivo sin focal point (contenido clave en el tercio central); solo 1 archivo.
- [ ] **Logo** — 1 solo archivo; en el nuevo builder máx. 200×64 px (imágenes mayores se redimensionan, no se recortan).
- [ ] Branding — toggle "Show Airtable branding" para quitar la marca; en embeds el logo de la barra inferior del iframe NO se puede quitar (en el clon: logo de la plataforma).
- [ ] **Grupos de campos** (nuevo builder) — título de grupo (ocultable), descripción del grupo, color de fondo gris, etiquetas de campo a un lado o arriba ("Side"/"Top"; "Side" no disponible con 2+ campos en la misma fila).

### 7.3 Configuración por campo

- [ ] Por cada campo del formulario:
  - [ ] **Label/Title** — renombrar la etiqueta visible (no cambia el nombre del campo en la tabla).
  - [ ] **Help text / Helper text** — subtítulo de ayuda.
  - [ ] **Required** — asterisco rojo, bloquea el envío (un checkbox requerido debe marcarse).
  - [ ] **Ocultar** el campo del formulario (botón hide o arrastrándolo al panel izquierdo; no borra el campo en la tabla).
  - [ ] **Reordenar** arrastrando por el drag handle.
  - [ ] Appearance → Layout: **Dropdown o List** para selects (List: single select → radio buttons; multiple select → checkboxes); **Card o pills** para linked records; **Size** (tamaño de fuente).
  - [ ] Rules: **Visibility** (condicional), **Selection** (linked records), **Options** (selects), **Default value** (+ toggle "Allow users to edit this field"), **Required field**.
- [ ] Maquetación (nuevo builder) — arrastrar campos lado a lado (**máx. 4 por fila**), redimensionar ancho arrastrando el borde derecho, arrastrar sobre salto de línea crea un nuevo grupo.
- [ ] Form view clásico: sin secciones/encabezados personalizados (el nuevo builder SÍ tiene form groups).

### 7.4 Campos condicionales

- [ ] Visibilidad condicional por campo — "Show field only when conditions are met" (form view) / Rules → Visibility → "+ Add a condition" (builder); icono de ojo tachado en el canvas para campos ocultos condicionalmente.
- [ ] Condición = Field + Operator + Value (mismos operadores que los filtros, según tipo del campo condicionante: texto "contains"…, números "is greater than"…, linked records "is exactly", "has any of", "has all of", "has none of"; "is empty"/"is not empty" sin valor).
- [ ] Condiciones aplicables también a **grupos de campos completos** (builder).
- [ ] Limitaciones: el **primer campo del formulario no puede ser condicional**; no recomendado hacer condicional un campo requerido; NO hay multi-página ni branching; advertencia: visibilidad ≠ seguridad (los valores subyacentes pueden exponerse).

### 7.5 Inputs por tipo de campo

- [ ] Single line text — input de una línea; long text — textarea multilínea (rich text al responder si está activado).
- [ ] Number / Currency / Percent / Duration — inputs numéricos formateados (percent sin barra de progreso en forms; duration acepta el formato configurado).
- [ ] Date — widget de calendario (con hora opcional según configuración del campo).
- [ ] Single select / Multiple select — Dropdown o List (radio/checkboxes); opciones de selects truncadas a **<70 caracteres** (elipsis) en form views; **"Limit selection to specific options"** (diálogo con toggles para restringir qué opciones ve el encuestado).
- [ ] Linked record — picker entre **registros existentes** (NO se pueden crear nuevos registros enlazados desde un formulario); **"Limit record selection to a view"** (configurable a nivel de campo o sobreescrito desde el formulario; si cambian los filtros de una vista usada por un formulario, se avisa); layout Card o pills.
- [ ] Checkbox — casilla simple (si es requerida, debe marcarse).
- [ ] Rating — selector de estrellas clicable (máx. 10).
- [ ] Attachment — uploader (drag & drop o examinar); **máx. 5 GB por archivo**; en el nuevo builder: regla **Allowed types** por MIME types; issue conocido a documentar: submissions con adjuntos muy grandes pueden confirmar éxito sin crear el registro.
- [ ] Email / URL / Phone — inputs de texto (validación solo email y URL en el nuevo builder; no hay validación nativa de teléfono).
- [ ] Barcode — NO soportado en formularios.
- [ ] Campos calculados (formula, lookup, rollup, count, created/last modified time, autonumber, button) — NO son inputs; se calculan en el registro resultante.
- [ ] **Validación de datos (nuevo builder)**: toggle "Validate email" (error "Please enter a valid email address"), **Character limit** mín/máx (single line / long text), **Range limit** mín/máx (Number, Currency, Percent, Duration), toggle "Validate URL"; las validaciones solo aplican a campos no vacíos; los errores bloquean el envío.

### 7.6 Opciones de envío (post-submission)

- [ ] Etiqueta del botón de envío — personalizable (por defecto "Submit").
- [ ] "See who submitted a response" — exige login; guarda el usuario en un campo **Created by** (se crea si no existe; envíos anteriores "Anonymous"); toggle "Collect respondent email addresses automatically (sign-in required)".
- [ ] "Allow people to request a copy of their responses" — checkbox "Email me a copy of my responses" (remitente fijo noreply).
- [ ] **Redirect to URL after submission** — solo http/https completos; soporta variable **{record_id}**; NO disponible cuando el form está embebido (en el clásico usa popups); si hay redirect se deshabilitan: mensaje personalizado, "Submit another response" y "new blank form".
- [ ] Mensaje de confirmación personalizable ("Show this message"; por defecto "Thank you for submitting the form!").
- [ ] Botón "Submit another response" (no disponible en móvil).
- [ ] "Show a new blank form after 5 seconds" (auto-recarga en blanco; form view).
- [ ] **Notificación por email** — "Email me" (form view: al activador del toggle) / "Email responses" (builder: seleccionar destinatarios; requiere re-publicar); para avisar a no-colaboradores: automatización "When a form is submitted" + "Send email".
- [ ] **Stop accepting new responses / "Accepting submissions"** — mantiene el link activo con mensaje personalizable (por defecto "This form is not accepting responses.").
- [ ] Editar la respuesta tras enviar: NO existe nativamente; workaround documentado: formulario prefilled con `prefill_LinkedRecord={Record ID}` + automatización que actualiza el registro vinculado.

### 7.7 Compartir el formulario

- [ ] Enlace público — `https://…/shrXXXXXXXXXXXXXX` (cualquiera con el link puede enviar; sin cuenta).
- [ ] Opciones de link: **Restrict access with a password** (solo en forms públicos), **Restrict access to an email domain** (un solo dominio; exige login), **Stop accepting new responses**, **Generate new link** (invalida el anterior), **Disable link**.
- [ ] Niveles de acceso (builder): Anyone on the web / Anyone at {organization} / Anyone at a domain / Only users with base access / Require a password.
- [ ] **Embed iframe** — "Embed this form on your site" → código iframe con **vista previa desktop y móvil**; forma: `<iframe class="airtable-embed" src="…/embed/shrXXX?backgroundColor=blue" width="100%" height="533">`; parámetros: `backgroundColor`, `viewControls=on`; el embed se actualiza en tiempo real.
- [ ] Vista previa del formulario durante la edición (toggle Preview) y "Open form" (abre el share link); los formularios funcionan en navegadores móviles (no en apps nativas).

### 7.8 Prefill vía URL

- [ ] Sintaxis — `?prefill_FieldName=Value` (primer parámetro con `?`, siguientes con `&`); el nombre debe coincidir **exactamente** (case-sensitive) con el nombre del campo, con el label en el form o con el **Field ID** (`fld…`); espacios `%20` o `+`; UTF-8.
- [ ] **Ocultar campos prefilled** — `&hide_FieldName=true` (el valor se guarda aunque no se muestre; advertencia: NO es medida de seguridad, visible en la URL).
- [ ] Por tipo: multi-select → valores separados por coma (`prefill_FIELD=Option1,Option2`); linked records → **record IDs** (`rec…`) separados por coma SIN espacios; fecha/hora → **ISO 8601**; user → nombre exacto; checkbox → `true`/`false`.
- [ ] Generación dinámica con fórmulas — `CONCATENATE("https://…/shrXXX?", "prefill_" & ENCODE_URL_COMPONENT('Field Name') & '=' & ENCODE_URL_COMPONENT({Field}))`.
- [ ] Límites: URL prefilled **máx. 8.000 caracteres** (1.000 en hyperlinks de emails de automatizaciones); si el form ya fue abierto puede requerir "Clear form"; el prefill **no edita datos existentes**; funciona igual en standalone forms.

### 7.9 Limitaciones nativas (decisiones fieles a Airtable)

- [ ] Documentar como no soportado (a menos que se decida mejorar): multi-página/branching, save-and-resume, actualización de registros existentes, creación de linked records desde el form, secciones en form view clásico, firma electrónica, pagos.

---

## 8. Módulo 6 — Interfaces y Dashboards

> Marco: una **Interface** es una capa de presentación curada (front-end no-code) construida sobre una base — una colección de **páginas**, layouts y configuraciones para mostrar e interactuar con los datos, distinta de las vistas (que viven dentro de las tablas). Se accede desde la pestaña "Interfaces" de la base ("Start building" → "Build an interface", nombrar y elegir icono). Cada layout (excepto Blank) se conecta a **UNA sola tabla**. Los cambios se autoguardan como borrador y requieren **Publish**.

### 8.1 Estructura de interfaz

- [ ] Crear interfaz — nombre + icono (editables); disponible en todos los planes.
- [ ] Editor de interfaz — panel Pages (esquina superior izquierda), lienzo central, panel de propiedades a la derecha (Source, Data, Appearance, User filters, User actions, Advanced).
- [ ] Páginas múltiples — "Add page"; renombrar, cambiar icono, duplicar, ocultar (ojo), despublicar, reordenar (drag&drop), eliminar (la última página no se puede eliminar); cambios requieren Publish.
- [ ] Navegación publicada — menú izquierdo: dropdown de la interfaz, navegación entre interfaces y páginas publicadas (las ocultas/no publicadas no aparecen); si solo hay una interfaz/página publicada, el sidebar no aparece.
- [ ] Publicación — botón "Publish"; autoguardado de borrador; "Unpublish"; compartir interfaz (share; en el clon, al propietario/instancia); compartir una interfaz comparte TODAS sus páginas publicadas.

### 8.2 Layouts de página

#### 8.2.1 Dashboard layout

- [ ] Dashboard layout — vista de alto nivel: números clave, gráficos y filtros self-service; compuesto de uno o más **dashboard groups**, cada grupo asociado a UNA tabla distinta.
  - [ ] Visualizaciones por grupo: **Number, Chart, List, Timeline, Summary Cards**, y también **Gallery, Kanban, Calendar, Pivot table**.
  - [ ] Configuración de grupo: Data (Source = tabla; Filter by = condiciones), Appearance (Width del grupo; Use background color = fondo gris claro), **User filters** (tabs o dropdowns — filtran TODAS las visualizaciones del grupo), **User actions** (toggle "Filter" para que el usuario final defina condiciones propias; botones: "Go to interface page" y "Go to external URL").

#### 8.2.2 Record review layout

- [ ] Record review — triaje/revisión masiva: lista de registros a la izquierda + página de detalle a la derecha.
  - [ ] Configuración: Title; Data (Source, Filter by, Sort by, Group by); **List item** (Color by select/condiciones, Image field, Title, Field 1, Field 2); User filters (none/tabs/dropdowns); User actions (Sort, Filter, Add records through a form, Buttons); Advanced (export CSV, print).
  - [ ] Página de detalle: Title field, campos visibles, Title size, Show as full width, Print, Buttons, propiedades por campo.

#### 8.2.3 List layout (visualización)

- [ ] List layout — registros en lista agrupable; Hierarchy (Levels entre tablas); Data (Filter by, Sort by — "Manual" permite drag&drop, **Group by hasta 2 campos**, Prefix field, Fields con opción "Make view-only" por campo); Appearance (Color by select/condiciones, Field text color, Row height short/medium/tall/extra tall, Wrap headers, Show field descriptions, Collapse all by default).

#### 8.2.4 Kanban layout (visualización)

- [ ] Kanban layout — Stacking field (single select, user o created by); Sort by (Manual = drag&drop); Fields visibles; Image field (attachment); Color by; Wrap long cell values; Hide empty stacks; **no edición inline**; sí Add/delete records inline y Click into record details.

#### 8.2.5 Timeline layout (visualización)

- [ ] Timeline layout — fecha de inicio y fin opcional; Date settings (date visibility: todos los días o solo laborables con festivos personalizados; Initial view: Position, Timescale, "Set for all visits"; custom quarters); Sort by; Group by (hasta 3 campos); **Summarize (incl. "Utilization")**; Fields; Label; Label image. Appearance: Layout **Stacked o Gantt**, Color by, Record height (short→extra tall), Width (Precise/Expanded), "Show all visible fields on left" (Gantt), Stack labels vertically, Wrap labels, Split multiple values into groups, Collapse groups by default.

#### 8.2.6 Calendar layout (visualización)

- [ ] Calendar layout — date field (inicio y fin opcional); Initial view (Position, Timescale, Set for all visits); Sort by; Fields del evento; Label y Label image (attachment); Color by; Fit image size.

#### 8.2.7 Gallery layout (visualización)

- [ ] Gallery layout — tarjetas con imagen (attachment field); Title field; Sort by; Fields visibles; **Rows per page (1–4 filas)**; Fit image size; Display field names; Color by.

#### 8.2.8 Grid visualization

- [ ] Grid (activable en table layouts) — visualización tipo hoja de cálculo; como elemento: permisos View-only/Editable, record details toggle (barra espaciadora), filtros, campos visibles, sort, groups, Row height, Color records, label.

#### 8.2.9 Overview layout

- [ ] Overview layout — landing page de orientación: cover image (mín. 1800×480px), logo (máx. 200×64px), Title, Description, bloques de texto con formato, **Bookmarks** a páginas del app (máx. 8 por grupo; solo visibles con acceso; opción "Open in a new tab"), Sidebar opcional con grupos de título/descripción y enlaces externos (Title, URL, Open in a new tab; máx. 8 por grupo); NO soporta botones.

#### 8.2.10 Form layout

- [ ] Form layout — página de interfaz para crear registros (requiere permisos de edición): tabla fuente, campos a mostrar, grupos de campos, drag&drop (máx. 4 campos por fila), Submission options (Button label, mensaje post-envío, "Submit another response", Email responses); por campo: Title, Appearance (Dropdown/List; Card/Pills; Size; Helper text), Rules (Visibility, Selection, Options, Default value, Required). Campos computados no aparecen; linked records no se crean desde el formulario.

#### 8.2.11 Record detail (sub-página)

- [ ] Record detail pages — habilitadas con toggle "Click into record details" en layouts List/Gallery/Kanban/Calendar/Timeline/Grid; se muestran como **Sidesheet** (redimensionable, prev/next) o **Full-screen**.
  - [ ] Configuración: Title size, grupos de campos (tab navigation, collapsible groups), Buttons, campos condicionales, estilo Stepper/List/Field para single selects; pueden incluir Charts, Numbers y visualizaciones List jerárquicas (hasta 3 niveles) alimentadas por linked records.

#### 8.2.12 Blank layout (element-based)

- [ ] Blank layout — lienzo vacío con elementos drag-and-drop (con gridlines); usar solo cuando ningún otro layout encaja (experiencia legacy; muchas funciones nuevas no soportadas ahí).

#### 8.2.13 Swimlanes / Roadmap (mención)

- [ ] Swimlanes/Roadmap (mención; Business/Enterprise) — tipo Kanban de doble eje (columnas × swimlanes): columnas (stacking field, sort, show/hide columnas, uncategorized, show empty columns, show number of records), filas (Group by, label size), tarjetas (image field, title field, footer, compact layout).

### 8.3 Elementos (arrastrables al lienzo)

- [ ] Sistema de elementos — lista: **Text, Divider, Grid, Calendar, Kanban, Timeline, Gallery, Chart, Number, Record picker, Filter, Button, Field, Record list, Comment** (Comment excluido, ver §11); se añaden con "+ Add element" y se colocan con drag-and-drop; cada uno tiene propiedad **Source** (tabla o elemento especial: Record picker / Record list / Filter).
- [ ] **Filter element** — filtro dinámico por usuario final: (1) elegir Source (tabla); (2) conectar otros elementos de la página; (3) condiciones por defecto (el usuario puede modificarlas); (4) toggle de label. Restricciones: solo filtra elementos de la misma tabla; un elemento se conecta como máximo a UN filter element; se combina con el filtrado estático propio del elemento; lo que elige una persona no afecta a otras.
- [ ] **Chart element** — ver §8.4.
- [ ] **Number element** — "Record count" o "Field summary" (campo + Summary type: Empty, Unique, Percent empty, Percent filled, Percent unique; y para numéricos/currency: sum, average, min, max). Config: Source, filtros (Copy settings from a view / All records / Viewer's records only / Specific records), color, Label. En dashboards modernos: Title, Subtitle, Type (Count o Summary), color de fondo opcional, **colores condicionales con fallback "Otherwise"**, toggle **"Click to see underlying records"** (side-sheet con los registros). Conectable a Filter element.
- [ ] **Text element** — texto formateado (encabezados, listas, enlaces, descripciones); en layouts legacy: inserción de valores de campo dinámicos con el icono "+".
- [ ] **Divider element** — línea horizontal para separar secciones.
- [ ] **Button element** — ver §8.5.
- [ ] **Record list element** — columna izquierda de registros (solo en Record review); búsqueda/scroll; los field elements conectados muestran el registro seleccionado.
- [ ] **Record picker element** — desplegable para elegir UN registro; config: Source, filtro (All records / Viewer's records only / Specific records), orden del dropdown, permitir crear nuevos registros desde el picker, label on/off; solo en layouts element-based.
- [ ] **Field element** — muestra campos del registro seleccionado en un Record picker/Record list; opción editable o view-only por campo; "headline/title" con apariencia destacada y label conmutable.
- [ ] **Grid / Gallery / Kanban / Calendar / Timeline elements** — equivalentes a sus vistas/layouts (Grid: permisos, record details, filtros, campos/sort/groups, Row height, Color records; Gallery: columnas 1–3 o Auto, aspect ratio wide/square/tall, Fit image, Title field, Color records, display field names; Kanban: stacking, sort, fields, image, color, hide/wrap).
- [ ] **Pivot table (en Dashboard)** — Columns (Field opcional, Sort by group/value, sort order, Show label, Show totals), Values (Summarize by Count o Field + función sum/average/min/max), Appearance (Size), "Click to see underlying records".
- [ ] **Summary cards (Dashboard)** — tarjetas de registros individuales: Record limit, Filter by, Sort by, Image field, Title field, Subtitle field, hasta 3 Fields adicionales, Click into record details.
- [ ] **Form element / "Add records through a form"** — botón "+"/"Add record" que abre un formulario configurable y reutilizable dentro de la interfaz; también botón "Open record creation form".
- [ ] Edición de elementos — duplicar (icono doble cuadrado), eliminar (papelera o "Delete"); si se borra un elemento que es Source de otros, los conectados muestran error hasta reconectar; algunos elementos de layouts predefinidos no se pueden borrar.

### 8.4 Chart element (detalle)

- [ ] Tipos de chart — **Bar, Line, Pie, Donut, Scatter** (cambiable tras crearlo); en dashboards modernos: series múltiples y doble eje Y.
- [ ] Datos: Source (tabla); filtros — "Copy settings from a view", All records, Viewer's records only, Specific records (condiciones/grupos). Bar/Line/Scatter: X-axis, Y-axis (left) y Y-axis (right); Pie/Donut: Categories y Values.
- [ ] Eje Y: **Count** por defecto; con "Field", campo numérico agregado con **sum, min, max o mean (average)**; si el eje X es fecha: agrupación (bucket) por semana/mes/trimestre y opción "Include empty cells".
- [ ] **Group by + Stacking** en bar charts: None / Standard / **100%** (porcentaje); no se puede usar Group by junto con múltiples series en el eje Y izquierdo.
- [ ] Appearance: paletas de color preconfiguradas; **Bar orientation** (horizontal/vertical — solo bar); **Legend orientation** para pie/donut (left/right/top/bottom/hidden); Show record count in chart (bar/line/scatter); Show record count in legend (pie/donut); Show percentage on chart (pie/donut); size preset (altura; charts lado a lado comparten altura); **"Click to see underlying records"** (drill-down al record detail).

### 8.5 Botones en interfaces (acciones)

- [ ] Botones — aparecen en la esquina superior derecha de páginas de visualización, record detail pages o grupos de campos; en blank layouts como elemento arrastrable; en layouts modernos se configuran en User actions → Buttons.
  - [ ] Acciones en TODOS los layouts: **"Go to interface page"** (opción nueva pestaña), **"Go to external URL"**.
  - [ ] En todos excepto record detail/dashboard: **"Open record creation form"**.
  - [ ] Solo en record detail/record review: **"Update record"** (una o varias actualizaciones; toggle "After update, move to next record"), **"Copy link to record"**, **"Delete record"** (deshacer con CMD+Z), **"Apply record template"** (rellena campos vacíos y añade en multi-value; no crea registro ni sobrescribe), **"Go to URL in record"**, **"Run automation"** (requiere trigger "When a button is clicked").
  - [ ] Un botón ejecuta un **máximo de 5 acciones** (todo-o-nada, sin lógica); confirmación opcional ("Require confirmation": Title "Are you sure?", Message, Button label "Yes, continue"); color del botón configurable (gris por defecto); reglas de visibilidad condicional del botón ("Rules").
  - [ ] Layouts que soportan botones: Record review, Record detail, List, Gallery, Grid, Kanban, Calendar, Timeline, Swimlanes (y blank con limitaciones); **Overview NO soporta botones**.

### 8.6 Configuración de página y filtros de usuario final

- [ ] Propiedades de página (table layouts) — Page → Title; Data → Source (tabla), Levels (jerarquía entre tablas, toggle "Enable nested records below Level 1"; solo si la página no usa tabs), **Filter by** (condiciones/grupos ESTÁTICOS fijados por el builder — el usuario final no puede cambiarlos; prevalecen sobre filtros de usuario); Appearance → Show description, **Visualizations** (cambiar tipo; activar varias visualizaciones con el icono ojo → el usuario final elige en un dropdown).
- [ ] User actions a nivel de página — Sort, Search, Filter (condiciones del usuario), Group, Add records through a form, Buttons; Advanced: **export CSV, print, import CSV**; Inline: Edit records inline, Add/delete records inline, Click into record details.
- [ ] **User filters: tabs vs dropdowns** (solo UNA opción por página):
  - [ ] **Tabs** — filtros predefinidos y nombrados por el builder (p. ej. un tab por estado); siempre existe "All records".
  - [ ] **Dropdowns** — filtros interactivos donde el usuario elige valores; con 2+ dropdowns, drill-down; tipos soportados: date, single select, multiple select, linked record, user, created by, checkbox (+ lookup/rollup/formula cuyo resultado formateado coincida con esos tipos).
- [ ] Impresión/exportación — imprimir/guardar como PDF (Cmd/Ctrl+P; toggle "Format for printing"): List, Timeline, Calendar, Record Detail (hasta 100 pages por PDF) y Charts; export CSV de datos si se habilita ("Allow users to export data as CSV" → "Download data"); búsqueda en layouts limitada a 200 resultados.

---

## 9. Módulo 7 — Automatizaciones

> Marco: una automatización es un flujo **trigger → acción(es)** que vive dentro de una base (pestaña "Automations" → "+ Create new" → "+ Create automation" → "+ Add trigger", luego "+ Add advanced logic or action"). **Testing obligatorio por pasos**: para activar, todos los pasos (trigger y acciones) deben probarse con éxito (se elige un registro de prueba); activación con toggle OFF (rojo) → ON (verde). Los triggers **NO son retroactivos**: el registro debe cambiar de estado tras activar la automatización. Riesgo de bucles si la acción re-dispara el trigger (revisar solapamientos, encender de una en una).

### 9.1 Motor de automatizaciones

- [ ] Constructor de automatizaciones — trigger + 1..n acciones/grupos; renombrar, duplicar, eliminar, descripción; ON/OFF.
- [ ] Sistema de testing por pasos — "Use suggested record" / "Choose record"; "Run test" por paso; todos los tests deben pasar para activar.
- [ ] **Run history** — ejecuciones exitosas y fallidas con detalle por ejecución (las pruebas no aparecen); **"Rerun" de ejecuciones fallidas** (con la configuración del momento original); pestaña **Version history** con versiones y autor; retención configurable.
- [ ] **Tokens dinámicos** — las acciones insertan valores del registro del trigger (Airtable record ID, created/last modified time, valores de cualquier campo) y salidas de acciones previas (Find records, Run script); inserción con selector "+" → "Record (Step 1: Trigger)" → campo → "Insert"; fechas en tokens en GMT/UTC por defecto (workaround: fórmula con SET_TIMEZONE/DATETIME_FORMAT o token "Actual run time"); los campos calculados pueden no estar resueltos en el instante del trigger (workaround: paso Find records que re-lee el registro).
- [ ] Detección/aviso de bucles potenciales (la acción re-dispara el trigger).
- [ ] Scheduler de fondo (dockerizable) para triggers programados y ejecución asíncrona con cola.

### 9.2 Triggers

- [ ] **When a record is created** — al crear un registro en la tabla seleccionada (y opcionalmente vista); puede dispararse antes de terminar de editar campos en grid (sugerir formularios o "matches conditions" para registros completos).
- [ ] **When a record is updated** — vigila todo el registro o campos individuales ("Select fields": Watch all / Unwatch all / selección manual); tabla + vista opcional; no se dispara al crear; cualquier cambio en campo vigilado lo dispara; los comentarios NO disparan.
- [ ] **When a record matches conditions** — cuando un registro pasa a cumplir condiciones (constructor campo+operador+valor, múltiples condiciones); autocontenido (no depende de una vista); no retroactivo; condiciones con fechas evalúan en GMT; tokens: record ID, last modified time, valores de campos.
- [ ] **When a record enters a view** — cuando un registro entra en la vista elegida (recomendado: vista dedicada y bloqueada); si sale y vuelve a entrar, se re-dispara.
- [ ] **When a form is submitted** — al enviarse un formulario de la base; todos los campos llegan simultáneamente.
- [ ] **At a scheduled time** — "Interval type" (Minutes, Hours, Days, Weeks, Months, **One time**) + "Timing" (p. ej. cada 1 semana a las 9:00) + "Starting" (fecha/hora futura, excepto One time); uso típico con Find records para informes periódicos.
- [ ] **When a webhook is received** — genera URL de webhook única; al recibir POST externo, las propiedades del body quedan disponibles como tokens; "Test trigger" tras enviar petición de prueba; vía nativa para Zapier/Make/formularios externos.
- [ ] **When a button is clicked** — al pulsar un botón (campo Button o botón de Interface); trigger manual para aprobaciones/re-ejecuciones.
- [ ] Triggers externos (mención; implementar según integraciones disponibles): Google Workspace (p. ej. "Google Sheets: When row created" — requiere hoja con cabeceras), Outlook triggers, "When email received" (dirección de email propia que parsea el correo).

### 9.3 Acciones

- [ ] **Create record** — crea un registro en la tabla elegida (misma base); cada campo con texto estático, valores dinámicos del trigger/acciones previas, o ambos; opción "From a template" (record templates); vinculación por valor del campo primario (excepto si es fórmula) o por record ID; múltiples vínculos con "Make a new list of Airtable record IDs / Field values".
- [ ] **Update record** — actualiza UN único registro identificado por su **Record ID** (típicamente el del trigger); tabla + Record ID + campos con valores estáticos o dinámicos; las vinculaciones son bidireccionales.
- [ ] **Find records** — busca registros en cualquier tabla (sin requerir linked records) según **Condition** (condiciones campo/operador/valor; los campos linked record no pueden ser criterio) o según **View** (hereda filtros y orden); límite por defecto **1.000 registros por acción**; salida usable como lista (renderizada como lista/grid HTML en un email, respetando el orden de la vista) o como input de un Repeating group.
- [ ] **Send an email** — remitente fijo (no personalizable); To/CC/BCC, Subject, Message con texto enriquecido + tokens dinámicos; "Show more options"; "Preview email" y "Run test"; puede adjuntar archivos (p. ej. vía Find records); límites: **1.000 destinatarios por run** (batch con Find records), cuotas diarias a no-colaboradores configurables; botón Unsubscribe.
- [ ] **Run a script** — JavaScript en **background** al dispararse: **input variables** con `input.config()` (alimentadas con tokens), **secrets** para claves API (redactadas de la salida), **salidas** con `output.set('nombre', valor)` para acciones posteriores; `fetch()` a APIs externas (sin CORS) y a la API propia; límites: timeout ~30 s (temporalmente 120 s), scripting API 12 s, fetch 30 s; 512 MB RAM; 50 fetch y 30 selectRecords por run; 15 mutaciones/s (hasta 50 registros por mutación); output máx. 6 MB; sin I/O interactivo.
- [ ] Acciones de mensajería/externas (mención; según integraciones): Slack message, Microsoft Teams message, Google Workspace actions (Docs, Calendar — título, descripción, ubicación, asistentes, all-day, Meet; NO recurrentes —, Gmail, Sheets append, Forms), Outlook actions, Jira (Cloud y Server/DC), Salesforce, Facebook Pages, GitHub, Twilio SMS, Hootsuite, Document automator.

### 9.4 Lógica avanzada

- [ ] **Conditional groups (grupos condicionales de acciones)** — "+ Add advanced logic or action" → Conditional group: cada grupo ejecuta sus acciones solo si se cumplen sus condiciones; grupo **"Otherwise"** aditivo ("If the conditions are met") y catch-all ("If no other conditions are met", sin grupos debajo); patrón: If Stage = X → acciones; Otherwise If Stage = Y → otras.
- [ ] **Repeating groups** — itera sobre una lista (típicamente salida de "Find records" → "Use as list") ejecutando las acciones internas una vez por elemento con tokens **"Current item"** (p. ej. Current item → record ID → Update record); acciones habituales: Update record, Create record, Slack message, Run script, Send email; con repeating group, el "Test automation" global se deshabilita (testing paso a paso).

---

## 10. Módulo 8 — Importación/Exportación y extensiones

### 10.1 Importación

- [ ] Importación nativa CSV / Google Sheets — desde "+ Add or import": como tabla nueva (en base nueva o existente) o **dentro de una tabla existente** (dropdown de la tabla → "Import data" → CSV).
  - [ ] Paso "Adjust your import" — seleccionar campos a incluir, toggle **"Auto-select field types"**, toggle **"Use the first row as headers"**.
- [ ] Importación **pegando datos** — copiar un rango de una hoja y pegarlo directamente en la tabla (ver Módulo 1 §3.5).
- [ ] Importación Excel — vía CSV/hojas (cada hoja del workbook → su propia tabla; primera fila = nombres de campo); comas como separadores al convertir a multi-select/linked records (comillas para valores con coma).
- [ ] **CSV Import extension** (add-on) — importa CSV a tabla existente con **mapeo de campos**:
  - [ ] Mapeo: campos de la tabla ↔ columnas del CSV (auto-match por nombre, mapeo manual con toggles+dropdowns; campos omitibles; orden/nombres no tienen que coincidir).
  - [ ] Toggle "First row is headers" (auto-detectada); toggle **"Merge with existing records"** (upsert por campo único — case-sensitive, ignora espacios extremos; preview de registros a actualizar/crear; crea nuevos sin match); toggle "Skip blank or invalid CSV values"; toggle "Create missing select options" (requiere Creator).
  - [ ] Límites: **25.000 filas y 5 MB** por CSV; mapeo recordado por instancia de extensión; errores reversibles restaurando un snapshot.
- [ ] Otras extensiones de importación (mención): Calendar import (ICS), Contact import (vCard/VCF), XML import (RSS/Atom).
- [ ] Importación desde herramientas de gestión (Trello/Asana — mención, fuentes secundarias).

### 10.2 Exportación

- [ ] **Exportar CSV por vista** — dropdown junto al nombre de la vista → "Download CSV" (no hay descarga de base/tabla entera de golpe; CSV como intermediario para XLSX/PDF/TSV/Numbers); los adjuntos exportan como URLs.
- [ ] "Download CSV" y "Print view" en el menú de vista; export CSV habilitable en interfaces ("Allow users to export data as CSV").
- [ ] **Airtable Sync (mención)** — sincronización entre bases: habilitar en la vista origen (solo grid views) "Sync data to another base"; en destino "+ Add or import" → "Airtable base"; opciones: todos los campos o específicos, campo primario alternativo, frecuencia (automática en tiempo real o manual), comportamiento ante borrados, two-way sync, multi-source syncing, sync de linked records; tabla destino de solo lectura (one-way); "Stop syncing" la convierte en tabla normal conservando datos.

### 10.3 Extensiones (no-IA)

- [ ] Sistema de extensiones — módulos instalables desde **Tools → Extensions → + Add an extension** (marketplace con búsqueda "Find an extension or script"); Owners/Creators crean/modifican; extensible con SDK propio.
- [ ] **Chart** — bar, line, scatter, pie y donut; eje X desde cualquier campo (fechas agrupables por semana/mes/trimestre, "Include empty cells"); eje Y = Count o campo numérico agregado (sum/min/max/mean); ordenación (View/X value/Y value) y agrupación; clic en punto/barra abre registros subyacentes.
- [ ] **Summary** — un único número destacado con etiqueta y color: "Count" (registros de la vista) o "Summary" (suma, media, máximo… según tipo de campo); distinto de la summary bar.
- [ ] **Page Designer** — diseños imprimibles desde registros (facturas, tarjetas, catálogos): tabla origen, tamaño de página (Letter/A4/Business card/personalizado), orientación, campos arrastrables con modos para campos multi-valor (Table/List/Inline), modo Present, export a PDF/imprime vía diálogo del sistema (un registro por página o todos los de una vista); limitaciones: no automatizable, no multi-página real, no funciona en interfaces.
- [ ] **URL preview** — previsualiza URLs soportadas del registro (share links, YouTube, Vimeo, Spotify, SoundCloud, Figma, Loom, Google Drive/Docs/Sheets/Slides); sin configuración; requiere campo URL.
- [ ] **Batch update** — múltiples acciones de actualización sobre todos los registros de una vista: ordenar valores de multi-select, añadir/quitar opciones de select, incrementar/decrementar números y fechas…; botón "Update records" con "Undo"; re-ejecutable.
- [ ] **Dedupe** — encuentra y gestiona duplicados por campos elegidos: borrar duplicados o **fusionar** campos individuales preservando historial elegido.
- [ ] **Pivot table** — agrupación fila/columna con Count o función de resumen por campo; "Split multiple choices"; sin exportación/impresión nativa.
- [ ] **Scripting extension** — editor JavaScript en foreground con 3 paneles (código, documentación con ejemplos, salida); ejecución manual con botón Run (respeta permisos del ejecutor); input interactivo (`input.textAsync()`, `input.buttonsAsync`…); output formateado; scripts pre-hechos ("Examples"); anti-timeout: `selectRecordAsync`/vistas en vez de `selectRecordsAsync`, dividir fetch.
- [ ] Otras (mención): Org chart, Map, Search (full-text multi-campo), Description (notas rich-text), Embed (URL fija), JSON editor, record list, Web clipper.

### 10.4 API REST y Webhooks (mención)

- [ ] **Web API REST** (mención) — JSON, CRUD de registros, endpoints Meta (esquema de bases/tablas); autenticación por Personal Access Token (PAT, con scopes `data.records:read/write`, `schema.bases:read`…) u OAuth; rate limit **5 req/s por base**; batching (10 registros/petición); upsert (`performUpsert`); Sync API (hasta 10.000 filas CSV/petición).
- [ ] **Webhooks API salientes** (mención) — registrar endpoints que reciben notificaciones en tiempo real de cambios (registros creados, campos actualizados, registros que entran/salen de una vista), con cursor para listar payloads.
- [ ] Trigger entrante "When webhook received" (ver Módulo 7) y llamadas HTTP salientes vía "Run a script" + `fetch()` (no hay acción nativa "send HTTP request").

---

## 11. Exclusiones del proyecto

Lo siguiente **NO se implementará** en el clon (excluido del alcance):

- [ ] **Funciones de IA** — Airtable AI, Omni ("Build an app with Omni", chat con IA, resumen de comentarios con IA), **field agents**, **AI fields** ("Generate text"), "Use AI to show top matches" en linked records, managed apps (Enterprise).
- [ ] **Trabajo colaborativo multiusuario** — comentarios en registros/bases/interfaces (incl. Comment element y paneles de comentarios), @menciones, notificaciones a colaboradores, permisos multiusuario (Owner/Creator/Editor/Commenter/Read-only y sus matrices), colaboradores interface-only, portales, "See who submitted"/login de encuestados, historial compartido de colaboración, workspaces multi-equipo con roles, admin panel, user fields con flujos de notificación, Share con invitaciones por email (mantener solo share links públicos/contraseña).
- [ ] Notas: el campo **User/Collaborator** y los campos **Created by / Last modified by** se documentan solo a nivel de existencia; las referencias a "planes de pago" se resuelven siempre a favor de la **funcionalidad completa**; las vistas Personal/Locked y secciones de sidebar pueden implementarse en modo mono-usuario como configuración del propietario.

---

## 12. Orden de implementación sugerido (fases)

**Fase 0 — Cimientos (MVP técnico)**
- [ ] Stack dockerizado: base de datos, backend API, frontend, almacenamiento de archivos, worker/scheduler.
- [ ] Modelo de datos: Workspace → Base → Tabla → Registro → Campo con IDs `wsp/app/tbl/rec/fld/viw/pag` (Módulo 1 §3.1).
- [ ] CRUD de workspaces, bases, tablas, registros y campos; home screen básica; pantalla de base con pestaña Data (Módulo 1 §§3.2–3.6).
- [ ] Primary field y sus reglas (§3.7); papelera (§3.10).

**Fase 1 — Grid y campos básicos (MVP funcional)**
- [ ] Grid view completa: edición en celda, row height, freeze, fill handle, copiar/pegar, selección múltiple, reordenar, summary bar (Módulo 4 §6.1 + Módulo 1 §3.5).
- [ ] Registro expandido (§3.8); búsqueda find-in-view y ⌘K (§3.9).
- [ ] Tipos de campo básicos: single line text, long text (+rich text), number, currency, percent, duration, date/datetime, single select, multiple select, checkbox, rating, URL, email, phone, autonumber (Módulo 2).
- [ ] Attachment con previews y drag & drop (§4.12).

**Fase 2 — Relacional y calculado**
- [ ] Link to another record + backlink + picker (Módulo 3 §5.1).
- [ ] Lookup, Count (§§5.2, 5.4); Rollup con funciones de agregación (§5.3).
- [ ] Motor de fórmulas: parser, editor con resaltado, funciones de texto/numéricas/lógicas/fechas/arrays/registro/regex (§5.5); Formatting por tipo de salida.
- [ ] Created time / Last modified time (§§5.6–5.7); conversión entre tipos (§5.8); barcode y button fields (§§4.17–4.18).

**Fase 3 — Vistas**
- [ ] Opciones transversales: Filter (operadores + grupos), Group (3 niveles), Sort, Hide fields, Color, sidebar de vistas (Módulo 4 §§6.8–6.13).
- [ ] Kanban, Calendar, Gallery (§§6.2–6.4).
- [ ] Timeline y Gantt (dependencias, milestones, critical path) (§§6.5–6.6); List view jerárquica (§6.7).
- [ ] Share/embed de vista (§6.14); importación CSV/pegar y exportación CSV por vista (Módulo 8 §§10.1–10.2).

**Fase 4 — Formularios**
- [ ] Form view clásico: generación automática, configuración por campo, condicionales, opciones de envío, share link + embed, prefill vía URL (Módulo 5).
- [ ] Form builder moderno: grupos, maquetación multi-columna, validaciones (email/URL/rango/character limit), cover/logo, Publish.

**Fase 5 — Interfaces y Dashboards**
- [ ] Layouts: Dashboard (groups + visualizaciones), Record review, List, Kanban, Calendar, Timeline, Gallery, Overview, Form (Módulo 6 §8.2).
- [ ] Elementos: Number, Chart (5 tipos + opciones), Text, Divider, Filter element, Record picker/list, Field, Button con acciones, Pivot table, Summary cards (§§8.3–8.5).
- [ ] Tabs/dropdowns de usuario final, record detail pages, publicación (§§8.6, 8.1).

**Fase 6 — Automatizaciones**
- [ ] Motor trigger→acciones con testing por pasos, ON/OFF, run history + rerun, tokens (Módulo 7 §9.1).
- [ ] Triggers: record created/updated/matches conditions/enters view/form submitted/scheduled time/webhook received/button clicked (§9.2).
- [ ] Acciones: Create/Update record, Find records, Send email, Run script (§9.3); conditional groups y repeating groups (§9.4).
- [ ] Integraciones externas según prioridad (Slack, Google Workspace, Twilio…).

**Fase 7 — Extensiones y API**
- [ ] Extensiones: Chart, Summary, Page Designer, Batch update, Dedupe, Pivot table, Scripting (Módulo 8 §10.3).
- [ ] API REST con PAT/OAuth, rate limiting, batching, upsert; webhooks salientes (§10.4).
- [ ] Sync entre bases (§10.2, mención) y plantillas (§3.11).

---

**Fin de la especificación.** Documento basado íntegramente en la investigación de las 7 dimensiones y las resoluciones de la verificación cruzada (límite de vistas por base, escalas de calendario sin modo "agenda", color en List view soportado, terminología "base").
