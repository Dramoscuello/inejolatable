# La interfaz de Airtable — Especificación UI/UX (VERSIÓN CORREGIDA)

**Propósito:** documento descriptivo de la interfaz de usuario de Airtable (webapp de escritorio), redactado con suficiente precisión posicional para que una IA o un diseñador pueda replicar la interfaz sin haber visto el producto.
**Alcance:** UI 2025+ verificada visualmente contra la plataforma real (base de ejemplo "Prestamos APP"); se excluyen deliberadamente las funciones de IA (Omni) y la colaboración multiusuario, salvo mención mínima de dónde irían esos elementos en el layout (p. ej. el botón Compartir existe aunque el clon sea mono-usuario).
**Fuentes:** verificación visual directa de la plataforma + investigaciones previas de documentación oficial de support.airtable.com.
**Idioma de la interfaz:** español (etiquetas, menús, controles).

---

## 1. Introducción: cómo leer este documento

### 1.1 Propósito

Este documento describe **dónde está cada elemento de la interfaz de Airtable, cómo se ve y qué hace**. No es un checklist de implementación ni una especificación funcional: es una descripción visual y posicional pensada para reconstruir la UI "de memoria" con fidelidad reconocible.

### 1.2 Convenciones

- **Orientación:** "izquierda/derecha", "arriba/abajo", "superior/inferior" siempre se refieren a la posición en pantalla del usuario, en layout LTR. "Extremo derecho" = el último elemento de una fila horizontal leyendo de izquierda a derecha.
- **Wireframes ASCII:** los bloques de código con diagramas son esquemas de disposición (zonas y orden), no a escala. Los elementos entre corchetes `[...]` son controles (botones, tabs); el texto suelto es contenido o etiquetas.
- **Glifos:** se usan los símbolos reales de la UI cuando se conocen: `⌄` chevron de dropdown, `⋯`/`...` menú spillover, `⋮⋮` handle de arrastre de 6 puntos, `✕` cerrar, `☰` hamburguesa, `+` añadir.
- **Marcas de certeza:** "(inferencia)" = dato deducido visualmente, no confirmado por fuentes; "(aprox.)" = medida estimada. Todo lo no marcado procede de documentación oficial o de capturas verificadas.
- **Versionado:** Airtable desplegó en 2025 un rediseño que cambia el chrome de la base (rail lateral, pestañas centradas, controles de vista a la derecha). Cuando una pantalla difiere entre la UI clásica (≤2024) y la 2025+, se describen ambas. Para un clon reconocible se recomienda la UI clásica, que es la más documentada y la más "icónica".

### 1.3 Mapa de pantallas cubiertas

1. Home screen (post-login).
2. Pantalla de base abierta: chrome general (barra superior, table bar, view bar, view sidebar).
3. Grid view (la vista por defecto) con todos sus popovers de configuración.
4. Registro expandido (modal canónico).
5. Menús contextuales (registro, multi-selección, tab de tabla).
6. Vistas no-grid: Kanban, Calendar, Gallery, Timeline, Gantt, List.
7. Formularios: editor (legacy y builder 2024) y página pública.
8. Interface Designer: lista, editor y página publicada.
9. Automations: lista y editor.

---

## 2. Diseño visual global

### 2.1 Paleta de colores

**Colores de marca (logo):** el emblema de Airtable es una "mesa" isométrica de tres piezas:

- **Amarillo** `#FCB400` (Selective Yellow) — paralelogramo superior.
- **Turquesa/azul cielo** `#14BFFF` (Deep Sky Blue) — pieza lateral.
- **Rojo** `#F82B60` (Radical Red) — triángulo.
- Wordmark en gris oscuro `#333333`.

**Colores de producto (tema claro) — CORREGIDOS POR VERIFICACIÓN VISUAL:**

| Rol | Hex | Uso |
|---|---|---|
| Azul producto (acento) | `#1665D8` | Botón primario (Compartir), icono del cohete en header, línea indicadora de pestaña activa, bordes de selección, focus |
| Ink (texto principal) | `#1F2937` | Títulos, encabezados de columna, iconos de navegación, textos de primer nivel |
| Canvas | `#FFFFFF` | Fondo principal de la app |
| Surface soft | `#F7F8FA` | Fondos suaves de paneles, sidebar de vistas, filas alternas |
| Surface strong | `#E0E2E6` | Fondos de mayor contraste |
| Hairline / bordes finos | `#E5E7EB` | Líneas divisoras de la grilla, bordes de botones secundarios, separadores |
| Border strong | `#D1D5DB` | Bordes marcados, inputs, dropdowns |
| Texto body | `#1F2937` | Texto general en celdas y controles |
| Texto muted | `#6B7280` | Texto secundario, labels grises, texto de ayuda |
| Azul de acento en sombras | `#2D7FF9` | Sombra azulada multicapa `rgba(45,127,249,0.28)` (web) |

*Paleta verificada visualmente contra la interfaz real de Airtable (agosto 2026).*

**Colores semánticos:**

- **Verde** = éxito / activado: toggle ON, checks verdes de pasos probados en automatizaciones, marca ✓ de checkbox en celdas.
- **Rojo** = error / desactivado / destructivo: toggle OFF, botón "Delete record", opciones de menú destructivas (texto rojo), badge rojo de notificaciones.
- **Amarillo** = acento de marca y color por defecto de ratings (estrellas `yellowBright`).

**Los 40 colores de píldoras de select:** 10 familias (blue, cyan, teal, green, yellow, orange, red, pink, purple, gray) × 4 variantes (Light2, Light1, Bright, Dark1) = 40 colores canónicos (`blueLight2` … `grayDark1`). Los hex RGB exactos no están publicados oficialmente; en la UI las píldoras de select se ven como fondos pastel con texto oscuro. Checkbox y rating usan solo los 10 colores **Bright**.

**Color de acento por base:** cada base tiene un color de apariencia personalizable (hover → ⋮ → "Customize appearance" → diálogo "Edit appearance" con selector de color + pestaña "Icon"). En la UI 2025 ese acento tiñe exactamente cuatro cosas: **icono de la base, barra de pestañas de tablas (table bar), botón Share e icono de Omni**. En la UI clásica teñía superficies más prominentes (el sidebar de interfaces llegó a verse completamente teñido).

**Modo oscuro:** existe en beta pública desde mayo-2025 (web). Se activa desde menú de cuenta (avatar) → **Appearance** → **Dark** o **"Use system setting"** (también Light). Es preferencia por cuenta y aplica también a las interfaces publicadas.

### 2.2 Tipografía

- **Fuente del producto:** system font stack — se renderiza con la tipografía nativa de cada plataforma (San Francisco en macOS/iOS, Segoe UI en Windows, Roboto en Android). Familias visuales: sans-serif moderna y limpia (estilo Inter o System UI), optimizada para legibilidad de datos masivos.
- **Tamaños (verificados visualmente):**
  - Texto de tabla y controles: **~12px a 14px** (peso Regular 400).
  - Título del proyecto/base: **~16px** (peso Bold/Semibold).
  - Encabezados de columna: **~13px** (peso Semibold).
  - Labels secundarios / help text: **~11-12px** (peso Regular).
  - Peso Regular para contenido de celdas y opciones de menú; Bold/Semibold para títulos, botones destacados y encabezados.

### 2.3 Iconografía

Estilo: iconos lineales/glyph simples y geométricos, propios de Airtable (no hay librería pública documentada). Glifos recurrentes confirmados por la documentación oficial:

- `⌄` chevron — abre dropdowns (nombre de base, nombre de vista, nombre de campo, nombre de tabla).
- `☰` tres barras horizontales — toggle del view sidebar.
- `⚙` engranaje — configuración.
- `👁` ojo — mostrar/ocultar (campos, páginas de interface).
- `⋯`/`...` — menú spillover (aparece al hover).
- `⋮⋮` handle de 6 puntos — drag & drop (vistas, campos, condiciones).
- `✕` — cerrar/eliminar. `⤢` — expandir registro/celda. `↕`/`↔` — redimensionar.
- Estrella — favoritos (starred). Campana con badge rojo — notificaciones. Reloj (con flecha) — base history.
- Iconos de tipo de campo en encabezados: `A` texto, `#` número, `fx` fórmula, `◎` single select, `☑` checkbox, `📎` attachment, `🔗` linked record, `📅` fecha, `👤` collaborator (con campana 🔔 adicional).
- Los iconos **personalizables** documentados son los de checkbox y rating: conjunto `check, xCheckbox, star, heart, thumbsUp, flag, dot` (7 iconos) × 10 colores Bright.
- Bases y tablas llevan **tiles cuadrados redondeados de color con un glifo blanco** (elegibles en "Customize appearance").

### 2.4 Componentes base

**Botones (jerarquía):**

1. **Primario relleno:** azul `#1B61C9` (o teñido con el acento de la base, p. ej. el botón Share de la base). Texto blanco. Ejemplos: "+ Create" de la home (ancho completo del sidebar), "Share" arriba-derecha, "Publish" del Interface Designer, "Submit" de formularios. En la web pública el CTA principal es una píldora casi-negra `#181D26`.
2. **Secundario / ghost:** fondo blanco o transparente con borde gris fino; texto ink. La mayoría de los botones de la view bar (Hide fields, Filter, Group…) son de este tipo hasta que se activan (entonces ganan fondo de color, ver §6.2).
3. **Destructivo:** texto o fondo rojo. En menús, las opciones destructivas ("Delete field", "Delete record") se muestran con texto rojo al final del menú. El botón "Delete record" de interfaces es rojo por defecto; el resto de botones de interface son grises por defecto.
4. **Botón de creación circular:** círculo azul con "+" blanco — aparece al pie de cada stack del Kanban y como botón flotante abajo-derecha en List view.

**Modales:** centrados sobre overlay oscuro translúcido. El modal canónico es el **registro expandido** (ver §8). Otros: "Edit appearance" (selector de color + pestaña Icon), diálogo Share (pestañas Email invite / Invite via link / Share publicly), "Manage subscribers", confirmaciones de borrado ("Click Delete again").

**Popovers:** paneles blancos con sombra, anclados al botón que los abre (los popovers de la view bar se anclan bajo su botón). Autoguardado inmediato; se cierran al hacer clic fuera. Estructura típica: cabecera con título + ⓘ, filas de configuración con handles ⋮⋮, acciones al pie.

**Toggles:** interruptor verde cuando está ON (a la derecha), gris cuando está OFF (a la izquierda). En Automations el toggle incluye el texto "ON"/"OFF" dentro (UI 2025) y el OFF es rojo.

**Tooltips y descripciones:** los campos con descripción muestran un icono "i" clicable; los charts de interfaces pueden mostrar su descripción como tooltip con icono. Los menús `⋯` aparecen al hover (patrón "hover-reveal" en todo el producto).

**Empty states:** filosofía "nunca mostrar una pantalla en blanco": la home vacía ofrece templates/bases de ejemplo y "start from scratch"; la primera interface muestra pantalla con botón "Start building".

**Loaders:** spinner de carga en los elementos de interface mientras cargan datos. En vistas con >5.000 registros visibles, previsualización de 1.000 con botón "Load all records" (ver §6.10).

**Notificaciones:** campana con badge rojo numérico (UI clásica: esquina superior derecha; UI 2025: rail lateral inferior). Toasts transitorios: no documentados en las fuentes (hallazgo negativo) — para el clon, usar un toast estándar inferior si es necesario (inferencia).

### 2.5 Espaciados, radios y sombras

- **Radios (web pública, mejor referencia cuantificada):** 12px en botones, 16–32px en cards (aprox.; el producto comparte estética de radios medios: tiles redondeados, tarjetas de kanban/gallery con esquinas redondeadas).
- **Sombra característica:** azulada multicapa `rgba(45,127,249,0.28) 0px 1px 3px` (web); en el producto, sombras sutiles grises en tarjetas y popovers (inferencia).
- **Densidad:** UI densa tipo herramienta. Sidebars colapsables y **redimensionables arrastrando el borde**; alturas de fila configurables (Short/Medium/Tall/Extra Tall); altura de la fila de encabezados ajustable arrastrando (cursor ↕); scroll horizontal en barras de tablas y grids (scrollbar inferior o Shift+rueda).
- **Anillo de foco:** azul, 3px, en elementos interactivos (token del sistema web).
- **Anchos clave (aprox., inferencia salvo indicación):** sidebar de home y view sidebar ~250–300px; columna de contenido de formularios públicos ~640–720px; cover de formulario 240px de alto (legacy) / 256px (builder nuevo) × ancho de ventana — estos dos últimos confirmados oficialmente.

---

## 3. Home screen (pantalla de inicio, post-login)

### 3.1 Wireframe general

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [logo Airtable] [«]   🔍 Search...                              ⌘K       │
│                                                              [? Help]    │
│                                                     [🔔³] [(A) avatar]   │
├──────────────┬───────────────────────────────────────────────────────────┤
│ 🏠 Home      │  Home                                                     │
│ ★ Starred  ⌄ │  ┌─────────────────────────────────────────────────────┐  │
│ 👥 Shared    │  │ [Opened in the past 7 days ⌄] [All organizations ⌄] │  │
│ 🗂 Workspaces│  │                                   [☰ List | ▦ Grid]  │  │
│   ⌄  +       │  └─────────────────────────────────────────────────────┘  │
│   ▸ Design   │                                                           │
│   ▸ Marketing│   ┌───────────┐ ┌───────────┐ ┌───────────┐ ┌───────────┐│
│              │   │ ┌───────┐ │ │ ┌───────┐ │ │ ┌───────┐ │ │ ┌───────┐ ││
│              │   │ │ [🗓]  │ │ │ │ [📦]  │ │ │ │ [🚀]  │ │ │ │ [🐛]  │ ││
│              │   │ └───────┘ │ │ └───────┘ │ │ └───────┘ │ │ └───────┘ ││
│              │   │ Content   │ │ Inventory │ │ Product   │ │ Bug       ││
│              │   │ calendar  │ │ tracker   │ │ launch    │ │ tracker   ││
│              │   │ Workspace │ │ Workspace │ │ Workspace │ │ Workspace ││
│              │   └───────────┘ └───────────┘ └───────────┘ └───────────┘│
│              │        ... (más tarjetas en rejilla) ...                  │
│              │                                                           │
│ ──────────── │                                                           │
│ Templates &  │                                                           │
│   apps       │                                                           │
│ Builder hub  │                                                           │
│ Admin panel  │                                                           │
│ Import       │                                                           │
│              │                                                           │
│ ┌──────────┐ │                                                           │
│ │ + Create │ │  ← botón primario azul, ancho completo del sidebar        │
│ └──────────┘ │                                                           │
└──────────────┴───────────────────────────────────────────────────────────┘
```

### 3.2 Barra superior (top bar global)

Fila horizontal de altura reducida (aprox. 48–56px), fondo blanco, hairline inferior. De izquierda a derecha:

1. **Logo de Airtable** (mesa tricolor) — extremo izquierdo.
2. **Botón de colapso del sidebar** — junto al logo; cierra/reabre el sidebar izquierdo. Es el único mecanismo de adaptación a pantallas estrechas (no hay breakpoints documentados).
3. **Campo de búsqueda centrado** — caja clara con hint de teclado "**⌘K**" visible dentro. Abre la búsqueda global / quick base switcher (también con ⌘K / Ctrl+K desde cualquier superficie: home, base o interface).
4. **Help** (menú de ayuda, icono `?`) — derecha.
5. **Notifications** — campana con **badge rojo** numérico.
6. **Account** — avatar circular de color con la inicial del usuario; abre el menú de cuenta (incluye Appearance → Light/Dark/System).

*(Orden 1–6 verificado contra el screenshot oficial anotado de Airtable Support: callouts 1=logo+collapse, 2=Search, 3=Help, 4=Notifications con badge, 5=avatar.)*

### 3.3 Sidebar izquierdo de la home

Columna vertical colapsable (ancho aprox. 250–280px, inferencia). De arriba abajo:

1. **Inicio** — item con icono 🏠.
2. **Destacados** — con chevron `⌄` a la derecha que expande la lista de favoritos; los favoritos se reordenan con drag & drop.
3. **Compartido** — elementos compartidos contigo.
4. **Espacios de trabajo** — con botón "**+**" (crear workspace) y chevron `⌄` para desplegar la lista de workspaces; cada workspace se expande a su vez.

En la **parte inferior** del sidebar, anclados abajo:

5. **Enlaces rápidos:** "Plantillas", "Importar".
6. **Botón "+ Crear"** — primario azul `#1665D8`, ocupa el ancho completo del sidebar, último elemento. Abre un popover para elegir el workspace destino y crear una nueva base.

### 3.4 Área principal

- **Encabezado H1** de sección arriba: "Home", "Starred", "Shared" o el nombre del workspace.
- **Fila de filtros** bajo el H1: a la izquierda dos dropdowns — "**Opened in the past 7 days ⌄**" (filtro temporal) y "**All organizations ⌄**" (planes Business/Enterprise); alineado a la derecha, el **toggle List/Grid** (icono de lista = 3 líneas horizontales; icono de grid = caja).
- *(Versión legacy: dropdown izquierdo con "Opened by you / Shared with you / Starred" y dropdown derecho con "Show all / Show bases only / Show interfaces only", más el toggle List/Grid.)*

### 3.5 Tarjetas de apps

Cada app/base se muestra como tarjeta (modo Grid) o fila (modo List) con:

- **Tile de icono:** cuadrado redondeado del color de apariencia de la base con un glifo blanco dentro.
- **Nombre de la app** y **metadatos** debajo (workspace, texto secundario gris).
- En modo Grid, las tarjetas se disponen en rejilla de varias columnas (depende del ancho; ~4–6, inferencia). Cada página de workspace puede fijar ("pin") **hasta 3 apps** en la parte superior, en orden de fijado (más antiguo primero).

**Estado hover sobre una tarjeta:** aparecen acciones superpuestas: botón "**Data**" (ir directo a la pestaña Data), **estrella** (star/unstar) y menú "**...**" (rename, move, duplicate, delete, customize icon, change color). En Business/Enterprise hay además "Open" con submenú de interfaces y sandboxes.

**Comportamiento al hacer clic:** abre la última superficie visitada de esa app (última vista de datos o última página de interface); no hay ajuste para forzar una capa.

**Personalización:** hover → menú ⋮ → "Customize appearance" → diálogo "Edit appearance" con selector de color y pestaña "Icon".

**Disponibilidad:** la home screen solo existe en Web/Browser y apps de escritorio Mac/Windows (no en móvil nativo).

---

## 4. Pantalla de base — chrome general

Al abrir una base, la pantalla tiene **cuatro capas verticales inmutables**: (1) barra superior de la base, (2) barra de pestañas de tablas (table bar), (3) view bar (controles de la vista actual), (4) cuerpo: view sidebar a la izquierda + área de datos central.

### 4.1 Wireframe general (UI 2025+, verificada visualmente)

```
┌──┬──────────────────────────────────────────────────────────────────────────┐
│🟦│ [🚀] Prestamos APP v  [Datos] [Automatizaciones] [Interfaces] [Formularios] │
│  │                                                    [↺] [🔗] [Compartir]   │
│  ├──────────────────────────────────────────────────────────────────────────┤
│  │ [Clientes v] [Proveedores v] ...              [+ Añadir o importar] [Herramientas v] │
│  ├──────────────────────────────────────────────────────────────────────────┤
│? │ [☰] [Grid view v] [Ocultar campos] [Filtro] [Grupo] [Clasificar] [Color] [▤] [🔍] │
│  ├──────────┬───────────────────────────────────────────────────────────────┤
│🗄 │ + Crear  │                                                               │
│  │   nuevo..│                                                               │
│🔔│ ┌──────┐ │                   ÁREA DE DATOS (grid)                        │
│  │ │Encon-│ │                                                               │
│👤│ │trar  │ │  [☐] [A Name ⌄] [Notes ⌄] [Assignee ⌄] [Status ⌄] [Attach. ⌄] [+]│
│  │ │vista │ │  ════════════════════════════════════════════════════════════ │
│  │ └──────┘ │  1 ⤢ hola                                                     │
│  │ ✓ Grid   │  2                                                            │
│  │   view   │  3                                                            │
│  │          │  +                                                            │
│  │          ├───────────────────────────────────────────────────────────────┤
│  │          │ [+ Añadir...]   4 clientes    ════════════════════════         │
└────────────┴───────────────────────────────────────────────────────────────┘
```

**Rail lateral izquierdo (franja estrecha, ~48px, no colapsable):**
- **Parte superior:** Logo de la plataforma (bloque con cubo tridimensional) y un icono circular de carga (spinner de puntos).
- **Parte inferior:** cuatro iconos distribuidos verticalmente:
  1. Ayuda (`?`)
  2. Base de datos / discos apilados
  3. Notificaciones (campana)
  4. Avatar circular de perfil de usuario

Este rail reemplaza la barra superior global de la UI clásica. Los puntos de entrada de cuenta, notificaciones y ayuda migran aquí desde la esquina superior derecha.

### 4.2 Barra superior de la base — orden exacto de elementos (UI 2025+)

**Extremo izquierdo:**

1. **Icono azul con cohete blanco** (`#1665D8`) junto al **nombre de la base** con chevron `⌄` (ej. "Prestamos APP v").

**Pestañas centrales:**

2. **Datos** — activa con subrayado azul `#1665D8`; la única pestaña que muestra table bar + view sidebar + view bar + grid.
3. **Automatizaciones** — editor de automatizaciones.
4. **Interfaces** — editor/gestor de interfaces.
5. **Formularios** — punto de entrada a formularios.

**Extremo derecho (en orden):**

6. **Historial** — icono de reloj con flecha `↺`; abre panel con instantáneas, papelera e historial de revisiones.
7. **Icono de enlace `🔗`** — copiar enlace de la base.
8. **Compartir** — botón primario azul `#1665D8` relleno, texto blanco. *(En un clon mono-usuario se mantiene visible por fidelidad visual.)*

**Elementos omitidos del clon (funciones IA):**
- `+ Mejorar` (botón gris con icono de destellos)
- `Lanzamiento` (botón de despliegue)
Estos botones existen en la plataforma real pero corresponden a funciones de IA (Omni/Copilot) que están explícitamente excluidas del alcance.

### 4.3 Menú ⌄ del nombre de la base

Clic en el `⌄` junto al nombre de la base abre un panel que permite:

- **Renombrar** la base inline.
- Sección **"Appearance"**: cambiar color e icono de la base.
- Menú "..." con acciones: **Duplicate base** / **Delete base**.

### 4.4 Barra de pestañas de tablas (table bar)

- Segunda fila horizontal, **teñida con el color de apariencia de la base** (`#1665D8`).
- Una pestaña por tabla: **nombre de la tabla + `⌄`** propio. La pestaña activa se distingue con **borde superior redondeado** y fondo resaltado.
- Separador vertical entre el conjunto de pestañas y las opciones de la derecha.
- **Clic derecho sobre la tab o clic en su `⌄`** abre el menú de la tabla.
- Al final de la fila (derecha de la última tabla): botón "**+ Añadir o importar**" → menú para crear tabla vacía o importar datos.
- Extremo derecho: menú desplegable "**Herramientas ⌄**".
- Con muchas tablas, la barra hace **scroll horizontal**.

### 4.5 View bar (tercera fila) — resumen

La view bar es la barra de herramientas de la vista actual. Su anatomía completa y el orden exacto de botones se detallan en §6.1. Contiene, a la izquierda, el toggle `☰ Views` del sidebar y el view switcher (`▦ <Nombre vista> 👥 ⌄`), y a continuación los controles de configuración de la vista, con la lupa 🔍 (buscar en la vista) en el extremo derecho.

El **menú ⌄ del nombre de la vista** incluye: `Add to 'My favorites'` (estrella), `Rename view` (lápiz), `Duplicate view`, `Delete view` (rojo); en el sidebar de vistas el menú ⋯ añade: tipo de colaboración (Collaborative/Personal/Locked), `Copy another view's configuration`, `Download CSV`, `Move to…`.

---

## 5. Sidebar de vistas (view sidebar)

### 5.1 Comportamiento de apertura

- Se abre/cierra con el icono `☰` (hamburguesa) en el extremo izquierdo de la view bar.
- **Interacción dual:** al pasar el ratón sobre el icono se abre como **fly-out temporal** (se cierra al salir); al hacer **clic** queda **fijado (pinned)**.
- **Redimensionable:** arrastrando el borde derecho del panel (handle de resize). No hay ancho fijo documentado (aprox. 250–300px por defecto, inferencia).

### 5.2 Estructura interna

```
┌────────────────────────────┐
│ [+ Crear nuevo...]          │
│ ┌────────────────────────┐ │
│ │ 🔍 Encontrar una vista │ │  ← buscador
│ └────────────────────────┘ │
│ MIS FAVORITOS               │
│ ★ 📅 Calendario             │
│ MIS VISTAS PERSONALES       │
│ ▦ Grid view          ✓     │  ← ✓ = vista activa
│ ▦ Grid 2        [...] [⋮⋮] │  ← vista activa destacada en gris claro con indicador azul
│ 🔒 🖼 Assets               │  ← candado (locked), persona (personal)
│ ────────────────────────── │
│ MÁS VISTAS COLABORATIVAS    │
│ ◧ Tablero Kanban            │
│ 🗓 Calendario contenidos     │
└────────────────────────────┘
```

- **Cabecera:** buscador "**Encontrar una vista**".
- **Items de la lista:** cada item = **icono coloreado según el tipo de vista** + **nombre**. La **vista activa muestra una marca de check ✓** y fondo **gris claro con indicador azul** en el borde izquierdo. Indicadores adicionales: **candado** (Locked), **icono de persona** (Personal), **estrella** (favorito).
- **Hover sobre un item:** revela el menú "**...**" (`Renombrar vista / Duplicar vista / Eliminar vista / Añadir a favoritos / Mover a…`) y un **handle de 6 puntos ⋮⋮** para arrastrar y reordenar — solo dentro de su misma sección.
- **Secciones automáticas** (orden de arriba abajo): "Mis favoritos" → "Mis vistas personales" → secciones personalizadas → "Más vistas colaborativas" → "Más vistas personales". Las secciones vacías no se muestran.

### 5.3 Crear una vista

- El botón "**+ Crear nuevo...**" está en la parte **superior-izquierda** del sidebar.
- Abre un **menú pop-out** donde eliges crear una **vista**, un **formulario** o una **sección de vistas**.
- El menú de tipos de vista lista cada tipo con **icono + nombre**: **Grid** (por defecto; obligatoria ≥1 por tabla), **Calendario**, **Galería**, **Kanban**, **Lista**, **Formulario**, **Timeline** y **Gantt**.

---

## 6. Grid view

La grid view es la vista por defecto y la pieza más icónica del producto. Jerarquía vertical dentro del área de datos: view bar → fila de encabezados de columna → cuerpo del grid → barra de estado inferior (summary bar + contador + "+ Add...").

### 6.1 View bar — orden exacto de botones (UI 2025+, español)

De izquierda a derecha:

```
[☰] [Grid view v]  [Ocultar campos] [Filtro] [Grupo] [Clasificar] [Configurar color] [▤]   [↗ Compartir y sincronizar] [🔍]
```

1. **`☰`** — toggle del sidebar de vistas (abre/cierra panel lateral izquierdo).
2. **`<Nombre vista> v`** — nombre de la vista actual con chevron que abre el menú de la vista.
3. **`Ocultar campos`** — mostrar/ocultar campos en la vista.
4. **`Filtro`** — filtros de la vista.
5. **`Grupo`** — agrupación de registros.
6. **`Clasificar`** — ordenación.
7. **`Configurar color`** — coloreado de registros (con etiqueta/badge de estado si aplica).
8. **`▤`** — ajuste de densidad de fila (row height switcher, solo icono, sin texto).
9. **`↗ Compartir y sincronizar`** — menú de compartir/sincronizar la vista.
10. **`🔍` lupa** — buscar en la vista, extremo derecho.

### 6.2 Badges de estado (cuando un control está activo)

Los botones de la view bar cambian de texto y ganan **fondo de color** al estar activos:

| Botón | Estado activo | Fondo del badge |
|---|---|---|
| Ocultar campos | `N campos ocultos` | **azul claro** |
| Filtro | `N filtros` | **verde claro** |
| Grupo | `Agrupado por N campos` | **lila/morado claro** |
| Clasificar | `Ordenado por N campos` | **melocotón/naranja pálido** |
| Configurar color | `Color` | **melocotón** |

Inactivos: texto gris sobre fondo neutro (ghost).

### 6.3 Wireframe del grid completo

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [☰][Grid view v][3 filtros][Agrupado por 2 campos][Clasificar][Configurar color]…🔍│ ← view bar con badges
├────┬───────────┬────────────┬───────────┬────────────┬──────────┬────────────────┤
│ ☐  │ A Name ⌄  │ ◎ Estado ⌄ │🔗 Clientes⌄│📎 Adjuntos⌄│☑ Hecho ⌄│ +              │ ← encabezados
│════╪═══════════╪════════════╪═══════════╪════════════╪══════════╪════════════════╡
│ 1 ⤢│▌Betty     │ [Por hacer]│ [Acme]    │ 🖼 🖼       │    ✓     │                │ ← ▌ = barra de color
│ 2  │▌Alpha proj│ [En curso] │ [Beta LLC]│            │          │                │
│ ☑ 3│▌Gamma     │ [Hecho]    │           │ 🖼          │    ✓     │                │ ← fila seleccionada
│ 4  │ ...       │            │           │            │          │                │
│ +  │           │            │           │            │          │                │ ← fila "+"
├────┴───────────┴────────────┴───────────┴────────────┴──────────┴────────────────┤
│[+ Añadir...]  4 clientes        │Vacío 0    │Únicos 3   │Relleno 100%│Desmarcado 13│ ← summary bar
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 6.4 Encabezados de columna

- **Anatomía:** icono de tipo de campo (`A`, `#`, `fx`, `◎`, `☑`, `📎`, `🔗`, `📅`, `👤`…) + **nombre del campo** + chevron **`⌄`** a la derecha. Los campos collaborator muestran además una **campana 🔔**.
- El **checkbox "seleccionar todo"** está en la cabecera de la columna de números de fila (esquina superior izquierda).
- **Clic en el header o en el ⌄** abre el menú contextual del campo (orden literal en §6.5).
- **Resize de columnas:** hover sobre el borde derecho del encabezado → cursor `↔` (dos flechas) → arrastrar. La **altura del encabezado** se ajusta arrastrando el borde inferior de la fila de headers (cursor `↕`).
- **Congelar columnas (freeze):** la primera columna (primary field) está congelada por defecto. Para congelar más: hover sobre el borde derecho del primer campo hasta que aparezca una **barra azul gruesa** y arrastrarla hasta el borde derecho de la última columna a congelar. Las columnas congeladas muestran **fondo gris muy tenue** y un divisor más marcado.
- **Reordenar campos:** arrastrar el encabezado a otra posición (también desde el popover Hide fields con el handle ⋮⋮).
- **Añadir campo:** botón **`+`** al final (extremo derecho) de la fila de encabezados.

### 6.5 Menú contextual del encabezado de campo (orden literal)

1. `Edit field` (lápiz)
2. `Duplicate field`
3. `Insert left` (←)
4. `Insert right` (→)
5. — divisor —
6. `Copy field URL` (icono enlace)
7. `Edit field description` (ⓘ)
8. `Edit field permissions` (candado)
9. — divisor —
10. `Sort A → Z`
11. `Sort Z → A` *(en numéricos: `Sort 1 → 9` / `Sort 9 → 1`)*
12. — divisor —
13. `Filter by this field`
14. `Group by this field`
15. — divisor —
16. `Hide field` (ojo tachado)
17. `Delete field` (papelera, **texto rojo**)

*En campos fórmula/computados aparece además `Show dependencies`.*

### 6.6 Cuerpo del grid — columna izquierda (gutter)

- **Números de fila** (1, 2, 3…) en la columna más a la izquierda.
- **Hover sobre una fila:** el número se sustituye por un **checkbox** de selección (azul al marcarlo) y aparece un **icono de expandir ⤢** junto al número.
- **Filas seleccionadas:** fondo azul muy claro en toda la fila. El checkbox de cabecera selecciona todos los registros de la vista.

### 6.7 Estilos de celda por tipo de campo

| Tipo | Representación en la celda |
|---|---|
| Texto, fechas | Texto plano **alineado a la izquierda** |
| Número, currency, percent, duration, rating | **Alineado a la derecha** (la alineación depende del tipo o del resultado de una fórmula) |
| Checkbox | Marca **verde ✓ centrada**; vacía si unchecked |
| Single select | **Píldora redondeada** con fondo pastel del color de la opción, alineada a la izquierda (ej. Todo rosa, In progress amarillo, Done verde) |
| Multiple select | Varias píldoras en línea |
| Linked record | **Píldoras grises** con el nombre del registro vinculado |
| Attachment | Thumbnails pequeños (una línea a altura Short; más grandes con row height mayor) |
| Collaborator / user | Avatar circular + nombre |
| Celda vacía | Fondo blanco, sin contenido ni placeholder |

### 6.8 Selección de celda, fill handle y fila "+"

- **Celda seleccionada:** **borde azul** alrededor. En su **esquina inferior derecha** hay un punto/mango (**fill handle**): al arrastrarlo copia/extiende valores a celdas adyacentes (con 1 celda de fecha copia la misma fecha; con 2 celdas de fecha crea una serie equiespaciada).
- En celdas de texto largo, al seleccionarlas aparece un **icono de expandir ⤢** dentro de la celda (arriba-derecha); `Shift+Space` expande el contenido.
- **Fila de nuevo registro:** al final del grid hay una fila con **`+`** en el gutter; en el pie inferior-izquierdo también hay botón "**+ Add...**". Con agrupaciones, **cada grupo tiene su propia fila `+`** para añadir un registro dentro de ese grupo.
- **Record coloring:** cuando hay coloreado activo, se muestra una **barrita vertical de color en el borde izquierdo de la celda del primer campo** (no tiñe toda la fila).
- **Celdas de campos calculados** (fórmula/lookup/rollup): sin fondo distintivo; se renderizan como su tipo de resultado. Excepción: con sort automático activo, las columnas ordenadas muestran fondo naranja pálido.

### 6.9 Edición inline con doble clic

La edición de celdas es una interacción fundamental del grid. El comportamiento es:

#### 6.9.1 Activación del modo edición

- **Doble clic** sobre una celda → activa el modo edición inline.
- **Enter** con una celda seleccionada → activa el modo edición.
- La celda en edición muestra un **borde azul `#1665D8`** de 2px.
- El contenido previo se selecciona automáticamente para permitir reemplazo rápido.

#### 6.9.2 Editores por tipo de campo

| Tipo de campo | Componente editor | Comportamiento |
|---|---|---|
| Single line text | `<input>` de una línea | Texto libre |
| Long text / Rich text | `<textarea>` expandible | Multilínea; sin barra de formato en grid |
| Number / Currency / Percent / Duration | `<input type="number">` | Validación numérica; formato visual aplicado al salir |
| Email | `<input type="email">` | Validación de formato |
| URL | `<input type="url">` | Validación de sintaxis |
| Phone | `<input type="tel">` | Sin validación estricta |
| Single select | Dropdown/popover con lista de opciones | Píldoras de color; teclear filtra opciones |
| Multiple select | Multi-select con checkboxes + píldoras | Acumula opciones seleccionadas |
| Checkbox | Toggle inline | Clic simple cambia estado |
| Date / DateTime | Date picker desplegable | Calendario + selector de hora si aplica |
| Rating | Fila de iconos interactivos (estrellas) | Clic para fijar valor |
| Linked record | Picker de registros con buscador | Píldoras grises; permite crear nuevo registro |
| Attachment | Dropzone + botón examinar | Drag & drop de archivos |
| Fórmula / Computado | **No editable** | Solo lectura; sin borde de edición |
| Autonumber | **No editable** | Solo lectura |
| Created/Modified time | **No editable** | Solo lectura |

#### 6.9.3 Confirmación y cancelación

- **Enter** — confirma la edición y guarda el valor (PATCH a la API).
- **Escape** — cancela la edición, restaura el valor original.
- **Tab** — confirma la edición y mueve el foco a la siguiente celda editable.
- **Shift+Tab** — confirma y mueve a la celda anterior.
- **Clic fuera** de la celda — confirma la edición.
- Mientras se guarda, la celda muestra un indicador de carga sutil (spinner pequeño o fondo pulsante).

#### 6.9.4 Comportamiento visual durante edición

- El editor ocupa exactamente el área de la celda (mismo padding, altura).
- Para campos de texto largo, el editor puede expandirse temporalmente (similar a Shift+Space).
- La celda en edición tiene `z-index` elevado para que dropdowns/date pickers no queden recortados.
- Si el campo tiene descripción, se muestra un tooltip `ⓘ` al lado.

#### 6.9.5 Navegación por teclado

- **Flechas ↑ ↓ ← →** — cuando no hay celda seleccionada, mueven la selección entre celdas.
- **Enter** sobre celda seleccionada — activa edición.
- **Escape** — sale del modo edición sin guardar (segundo Escape deselecciona la celda).
- **Ctrl+Enter** — inserta salto de línea en campos de texto largo (no confirma).

### 6.10 Alturas de fila y agrupaciones

- **Row height:** 4 opciones aplicadas a toda la vista: **Short** (por defecto), **Medium**, **Tall**, **Extra Tall**. Líneas de texto visibles aprox.: Short=1, Medium=2, Tall=4, Extra Tall=6 (aprox., fuente antigua), con thumbnails y píldoras más grandes. No afecta a la altura del encabezado.
- **Agrupaciones:** cabecera de grupo con el campo y valor (píldora si es select), **`Count N`** a la derecha y **resúmenes por columna en la propia fila de cabecera del grupo** (ej. `Sum $11,750.00`). La summary bar inferior muestra el total global (ej. `Sum $17,750.00`). No se pueden añadir registros a agrupaciones basadas en campos computados.

### 6.11 Summary bar y estados de carga

- **Barra inferior (pie de página del grid):**
  - **Izquierda:** Botón flotante redondeado `+ Añadir...` (crea un nuevo registro en la tabla). Junto a él, el **contador de registros**: texto como "`4 clientes`" (usa el nombre singular configurado para los registros de esa tabla: "cliente", "tarea", "proyecto", etc.).
  - **Centro/Derecha:** Barra de desplazamiento horizontal en gris claro `#E5E7EB` para navegar celdas fuera de pantalla.
- **Summary bar (opcional):** barra de resúmenes por columna bajo los datos. Por defecto: `Suma` en campos numéricos, vacío en el resto. Clic en la celda abre menú de funciones según tipo: genéricas (Vacío, Relleno, % Vacío, % Relleno, Únicos, % Únicos), checkbox (Marcado, Desmarcado, %), numéricas (Suma, Promedio, Histograma, Mín, Máx, Rango, Mediana, Desviación estándar), fechas (Fecha más temprana/tardía, Rango en días/meses), adjuntos (tamaño total en bytes).
- **View preview:** vistas con >5.000 registros visibles cargan previsualización de 1.000; mensaje "**Mostrando los primeros 1.000 de XX,XXX registros**" con botón azul "**Cargar todos los registros**".

---

## 7. Popovers de configuración de vista

Todos los popovers de la view bar comparten el mismo patrón: panel blanco con sombra anclado bajo su botón, autoguardado inmediato, se cierran al hacer clic fuera.

### 7.1 Hide fields

```
┌─────────────────────────────────┐
│ 🔍 Find a field                 │
│─────────────────────────────────│
│ (•━━) A Name              ⋮⋮    │  ← toggle verde/derecha = visible
│ (•━━) ◎ Status            ⋮⋮    │
│ (━━•) 🔗 Clients          ⋮⋮    │  ← toggle gris/izquierda = oculto
│ (•━━) 📎 Attachments      ⋮⋮    │
│─────────────────────────────────│
│ [Hide all]        [Show all]    │
└─────────────────────────────────┘
```

- Buscador "Find a field" arriba; lista de campos: **toggle a la izquierda** (verde/a la derecha = visible; gris/izquierda = oculto) + icono de tipo + nombre + **handle de 6 puntos a la derecha** para reordenar.
- Abajo: botones `Hide all` y `Show all`. El **primary field no se puede ocultar**.

### 7.2 Filter

```
┌──────────────────────────────────────────────────────────┐
│ Where [Type      ⌄] [is        ⌄] [Chairs      ] 🗑 ⋮⋮   │
│ And ⌄ [Unit cost ⌄] [>         ⌄] [$1,000.00   ] 🗑 ⋮⋮   │
│                                                          │
│ + Add condition   + Add condition group                  │
│                                  Copy from another view  │
└──────────────────────────────────────────────────────────┘
```

- Filas de condición: label **`Where`** en la primera; cada fila = `[campo ▼] [operador ▼] [valor]` + papelera 🗑 + handle ⋮⋮ a la derecha.
- A partir de la 2ª condición, a la izquierda aparece el dropdown de **conjunción `And ⌄ / Or ⌄`** (And por defecto).
- Abajo-izquierda: `+ Add condition` y `+ Add condition group`; abajo-derecha: `Copy from another view`.
- Los **grupos de condiciones** se dibujan como **cajas anidadas** con cabecera "All of the following are true..." / "Any of the following are true...", con `+`, 🗑 y handle propios. Máximo **3 niveles** de anidación y **49 condiciones** por vista.

### 7.3 Group

- Cabecera `Group by ⓘ` con enlaces **`Collapse all` / `Expand all`** a la derecha.
- Cada fila: `[campo ▼ con icono de tipo] [dirección ▼ ej. "First → Last"] [⋯] [🗑] [⋮⋮]`.
- Botón `Add subgroup` para niveles adicionales (máx. 3: 1 grupo + 2 subgrupos). El menú ⋯ permite mostrar/ocultar grupos vacíos. Al abrirse sin configuración previa muestra campos sugeridos + `See all fields`.

### 7.4 Sort

```
┌────────────────────────────────────────┐
│ Sort by ⓘ                              │
│ [Current Day   ⌄] [1 → 9 ⌄]  ✕   ⋮⋮    │
│ [Article Title ⌄] [A → Z ⌄]  ✕   ⋮⋮    │
│ + Add another sort                     │
│────────────────────────────────────────│
│ (•━━) Automatically sort records       │
└────────────────────────────────────────┘
```

- Cabecera `Sort by ⓘ`. Cada fila: `[campo ▼] [dirección ▼ ej. "A → Z", "1 → 9", "Earliest → Latest"] [✕ quitar] [⋮⋮]`.
- Debajo: `+ Add another sort`. Al pie: **toggle verde `Automatically sort records`** (ON por defecto; si está OFF aparecen botones `Cancel` y `Sort` azul para re-aplicar manualmente).
- Opción `Copy from a view...`: Choose a view → toggles de qué copiar → botón azul `Copy configuration`.

### 7.5 Color

- Nota superior: "**Records are assigned the first color that they match.**" ⓘ
- Modos: por campo **single select** o por **condiciones** (UI idéntica al popover de filtros: campo-operador-valor, `+ Add condition`, `+ Add condition group`).
- Cada color = fila con `[muestra de color ▼]` + resumen de condiciones + icono duplicar ⧉ + handle ⋮⋮. Clic en la muestra abre el color picker.
- Abajo: `+ Add color` (izquierda) y `+ Set fallback color` (derecha; también llamado "Set default color"). La prioridad es de arriba hacia abajo (reordenable arrastrando).

### 7.6 Row height

```
┌──────────────────────────┐
│ Select a row height      │
│ ▤  Short        ← azul   │  ← opción activa en texto azul
│ ▤  Medium                │
│ ▫  Tall                  │
│ □  Extra Tall            │
└──────────────────────────┘
```

- Popover titulado `Select a row height` con 4 opciones en lista vertical, cada una con un **icono de densidad** (líneas horizontales decrecientes: Short = más líneas, Extra Tall = una caja). La opción activa aparece en **texto azul**.

---

## 8. Registro expandido (modal)

### 8.1 Cómo se abre

- (a) Clic en cualquier celda + tecla **`Space`**.
- (b) Hover sobre la fila y clic en el **icono de expandir ⤢** junto al número de registro.
- (c) `Shift+Space` expande una celda de texto individual.

### 8.2 Wireframe del modal (rediseño ene-2022, vigente)

Modal centrado sobre la vista, sobre overlay oscuro. Ocupa la mayor parte del viewport (aprox. 80–90% de ancho, inferencia).

```
┌───────────────────────────────────────────────────────────────────────┐
│ [⌃] [⌄]   ▌Título del registro (primary field, grande)   [⋯] [🔗] [💬] [✕] │  ← action bar persistente
├──────────────────────────────────────────────────┬────────────────────┤
│  Name ⓘ          Betty Johnson                   │  All activity   ⌄  │
│  Status          [In progress]                   │────────────────────│
│  Due date        yyyy-mm-dd   hh:mm              │  (A) Comentario... │
│  Clients         [+ Add a record]                │      hace 2 h      │
│     ┌─────────────┐ ┌─────────────┐              │  (B) Cambió Status │
│     │ tarjeta reg │ │ tarjeta reg │              │      hace 1 h      │
│     └─────────────┘ └─────────────┘              │        ...         │
│  Attachments     [Drop files here or browse]     │                    │
│  Notes           [textarea]                      │                    │
│                                                  │                    │
│  [Show 4 hidden fields]                          │ ┌────────────────┐ │
│                                                  │ │ Add a comment… │ │
└──────────────────────────────────────────────────┴────────────────────┘
```

### 8.3 Action bar persistente superior

De izquierda a derecha:

1. **Flechas de navegación `⌃` `⌄`** — registro anterior/siguiente.
2. **Título del registro** en grande (valor del primary field), con una **barra vertical de color a su izquierda** si el registro está coloreado.
3. A la derecha: menú **`⋯`**, **icono de enlace 🔗** (copiar URL del registro), **icono de comentario 💬** (muestra/oculta el panel de actividad) y **cerrar `✕`**.

La barra es persistente: las acciones comunes y el título permanecen en el mismo sitio al navegar entre registros.

### 8.4 Lista de campos (columna izquierda/principal)

- Cada campo ocupa una **fila de ancho completo** con **label a la IZQUIERDA** (nombre del campo en gris + ⓘ si tiene descripción) y **valor editable a la DERECHA**. *(Antes de 2022 el label estaba ARRIBA del valor.)*
- Edición inline: píldoras para selects, input con placeholder gris "**yyyy-mm-dd**" / "**hh:mm**" en fechas vacías, selects vacíos con guion "–", "**+ Add a record**" + tarjetas en linked records, dropzone en attachments.
- Los **campos ocultos** de la vista aparecen al final bajo el botón "**Show XX hidden fields**" (clic para mostrarlos; cada uno con `⌄` → `Unhide field`).

### 8.5 Panel de actividad (columna derecha)

- Columna a la **derecha** del modal con dropdown **`All activity / Comments / Revision history`**, entradas con **avatar + texto + timestamp**, y caja "**Add a comment…**" abajo.
- El icono de comentario 💬 de la action bar lo oculta/muestra. *(En un clon mono-usuario puede ocultarse, manteniendo el icono en la barra por fidelidad.)*

---

## 9. Menús contextuales (clic derecho)

### 9.1 Clic derecho en celda/registro (orden literal)

1. `↑ Insert record above`
2. `↓ Insert record below`
3. — divisor —
4. `Duplicate record`
5. `Apply template`
6. `⤢ Expand record`
7. — divisor —
8. `💬 Add comment`
9. `🔗 Copy cell URL`
10. `✉ Send record`
11. — divisor —
12. `🗑 Delete record` (**texto rojo**)

*Si la tabla renombró sus registros, "record" se sustituye por ese nombre (ej. "Insert budget above").*

### 9.2 Clic derecho con varios registros seleccionados

Menú reducido: `Send all selected records`, `Delete all selected records` (rojo).

### 9.3 Menú de pestaña de tabla (clic derecho o ⌄ en la tab)

1. `Import data` (con subflecha >)
2. `Rename table` (incluye el diálogo "What should each record be called?")
3. `Manage fields` (badge de plan, ej. [Team])
4. `Duplicate table`
5. `Edit table description`
6. `Edit table permissions` (badge de plan)
7. `Delete table` (gris/rojo)

*(Tutoriales confirman además "Customize table" para icono/color de la tabla y "Hide table" en esta misma familia de menús.)*

---

## 10. Vistas no-grid

Todas comparten el patrón de toolbar: **icono + nombre de vista ▾**, luego chips contextuales ("Stacked by {field}" / "Using N fields and date ranges" / "Grouped by N field"), y botones **Customize cards/labels, Filter, Sort, Color, Share view**. Las píldoras de color de los selects se usan en TODAS las vistas. El botón primario de creación es un **círculo azul con "+"**.

### 10.1 Kanban

```
┌─────────────────────────────────────────────────────────────────────┐
│ [◧ Kanban ⌄] [Stacked by Status ⌄] [Filter][Sort][Color] [Share…] 🔍│
├───────────┬──────────────┬──────────────┬──────────────┬────────────┤
│ U         │ [To do]    ▾ │ [In progr.]▾ │ [Completed]▾ │ + New      │
│ n         │ (azul)       │ (morado)     │ (verde)      │ stack      │
│ c         │ ┌──────────┐ │ ┌──────────┐ │ ┌──────────┐ │            │
│ a         │ │ [img]    │ │ │ Título   │ │ │ Título   │ │            │
│ t         │ │ Título   │ │ │ SUBTASK  │ │ │ DUE DATE │ │            │
│ e         │ │ ASSIGNEE │ │ │  valor   │ │ │  12 may  │ │            │
│ g         │ │  (A) Ana │ │ │ [píldora]│ │ │          │ │            │
│ o         │ └──────────┘ │ └──────────┘ │ └──────────┘ │            │
│ r         │ ┌──────────┐ │              │              │            │
│ i         │ │ Título 2 │ │              │              │            │
│ z         │ └──────────┘ │              │              │            │
│ e         │ 3 records    │ 1 records    │ 1 records    │            │
│ d         │    [ (+) ] ⤢ │    [ (+) ] ⤢ │    [ (+) ] ⤢ │            │
└───────────┴──────────────┴──────────────┴──────────────┴────────────┘
        ← scroll horizontal →
```

- **Columnas ("stacks"):** generadas a partir de un **único campo** single select, user o linked record (sin multi-select ni agrupación de 2º nivel). Se cambia desde el chip "**Stacked by {field}**" de la view bar.
- **Cabecera de columna:** **píldora de color** (color de la opción del select) con el nombre de la opción en texto blanco/oscuro + **chevron ▾ a la derecha** (menú del stack). Fondo de columna gris claro; columnas separadas por gaps; **scroll horizontal** del tablero (atajos: ←/→ un stack, Ctrl+←/→ a los extremos).
- **"Uncategorized":** SIEMPRE la columna más a la izquierda (registros sin valor); no se puede ocultar ni mover. Se puede **colapsar**: queda como **tira vertical estrecha** en el borde izquierdo con el texto rotado 90° ("Uncategorized" + "N records"); acepta tarjetas arrastradas incluso colapsada.
- **Tarjetas:** rectángulo **blanco, esquinas redondeadas, borde fino gris y sombra sutil**. Contenido: si hay imagen de portada (attachment), va **arriba ocupando todo el ancho**; luego el **campo primario en negrita**; debajo los campos visibles con **etiqueta en versalitas gris pequeñas** ("SUBTASK", "ASSIGNEE", "DUE DATE") y su valor (selects como píldoras, fechas, texto). Desde 2021 las tarjetas **solo muestran campos con valor**. El record coloring añade una **franja de color lateral** en la tarjeta.
- **Pie de cada columna:** contador "**N records**" (abajo-izquierda), **botón circular azul con "+"** (centrado abajo) para crear un registro en ese stack, e icono de expansión diagonal ⤢ (abajo-derecha).
- A la derecha de la última columna: **columna fantasma "+ New stack"**.
- **Drag & drop:** arrastrar una tarjeta entre columnas **actualiza el campo** de stack; también se reordenan tarjetas dentro del stack y los stacks mismos.
- *(En Interfaces, el elemento Kanban sí permite mostrar contador en cabecera, ocultar Uncategorized y ocultar columnas vacías — opciones que la vista del base no tiene.)*

### 10.2 Calendar

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [🗓 Calendar ⌄]  [«][‹][›][»] [📅 Go to date] [Today]    [Month ⌄][height][See events] │
├──────┬──────┬──────┬──────┬──────┬──────┬──────┬─────────────┤
│ Sun  │ Mon  │ Tue  │ Wed  │ Thu  │ Fri  │ Sat  │ RECORD LIST │
│      │  1   │ 2    │ 3    │ 4    │ 5    │ 6    │ find record │
│      │      │[píldora DRAFT]   │      │      │ ┌─────────┐ │
│  7   │  8   │  9   │ 10   │ 11   │ 12   │ 13   │ │ reg 1   │ │
│[═══════ barra multi-día ═══════]│      │      │ │ reg 2   │ │
│      │ [pill]│      │ +2 more│      │      │ └─────────┘ │
└──────┴──────┴──────┴──────┴──────┴──────┴──────┴─────────────┘
```

- **Toolbar superior, agrupada a la izquierda:** flechas de navegación dobles `« › »` (por período completo) y simples `‹ ›` (por unidad), botón **"Go to date"** (icono calendario, abre date picker) y botón **"Today"**.
- **A la derecha:** selector de escala ("Change timescale": **Day / 3 day / Week / 2 week / Month** (por defecto) / Custom 1–6 días-semanas), botón "Calendar date height" (**Compact/Expanded**) y botón **"See events"** (record list). *(Legacy: segmented control "Month | 2 week | Week | 3 day | Day" arriba-derecha y "Today ‹ › October 2017" arriba-izquierda.)*
- **Grid mensual:** fila de cabecera **Sun…Sat**; cada celda de día muestra el **número de día arriba-izquierda** y los eventos como **píldoras de color** (según Color por select/condiciones) con título truncado y etiqueta pequeña (ej. "DRAFT").
- **Overflow:** si no caben, "**+N more**" en gris al pie de la celda (modo Compact, por defecto; Expanded da scroll vertical y muestra todo).
- **Eventos multi-día (date ranges):** **barras continuas que atraviesan varias celdas/semanas**, arrastrables y redimensionables desde los bordes.
- **Crear:** hover sobre una celda → aparece "**+**" (o doble clic).
- **Escalas Week/3 day/Day:** si el campo incluye hora, aparece una **timeline (columna de horas) en el lado izquierdo**.
- **Record list (panel lateral derecho):** buscador "find record", filtro All records / Records with dates / Records without dates; se cierra con la X y se reabre con "See events"/"Show record list". Arrastrar desde el panel al calendario **programa** el registro; arrastrar al panel lo **desprograma**.
- Opciones de fin de semana (Show/Collapse/Hide) dentro de "Change timescale". Hasta **20 campos de fecha/rangos** ploteables en la misma vista.

### 10.3 Gallery

- Cada registro = **tarjeta grande en un grid flexible** (≈4–6 columnas según ancho de ventana; ~5 columnas a ~1500px en capturas, inferencia).
- **Tarjeta:** **imagen de portada dominante arriba** (primer attachment del cover field; slider Crop = rellenar / Fit = letterbox), luego **título (campo primario) en negrita** y debajo los campos visibles con etiqueta en versalitas gris y valores (selects como píldoras de color). Tarjeta blanca, esquinas redondeadas, borde/sombra sutil, espaciado uniforme. Sin attachment configurado, las tarjetas muestran solo campos.
- **Tamaño:** Image size **Small/Medium/Large** en "Customize cards" (Small = más tarjetas por fila). Hover sobre la portada permite hojear múltiples attachments. Orden manual por drag & drop.

### 10.4 Timeline

```
┌──────────────────────────────────────────────────────────────────┐
│ [▶ Timeline ⌄][Date settings][Customize labels][Appearance]…[See records] │
├─────────────────┬────────────────────────────────────────────────┤
│ Grouped by St.  │ April 2022                                     │
│ ▸[In progress]  │ Wed 6 Thu 7 Fri 8 Sat 9 … │(línea azul "hoy")  │
│   [███████ Tarea A ██████]                                       │
│   [██ Tarea B ██]  [◆ milestone]                                 │
│ ▸[Delayed]      │                                                │
│   [████████ Tarea C █████████]                                   │
└─────────────────┴────────────────────────────────────────────────┘
```

- **Panel izquierdo fijo con las swimlanes:** encabezado "Grouped by {field}"; cada swimlane muestra **flecha de colapso** + **label del grupo** (píldora de color si es select).
- **Eje temporal arriba** (mes + semana/días: "April 2022 | Wed 6 Thu 7…").
- Los registros son **barras de color** con labels dentro (campo primario siempre primero; negrita/cursiva/subrayado configurables; labels apilables verticalmente). **Línea vertical azul de "hoy"**.
- Colapso de swimlanes: flecha junto al nombre o menú ⋯ ("Collapse group", "Expand all"/"Collapse all"). Arrastrar una barra a otra swimlane **actualiza el campo de agrupación** (incl. swimlanes anidadas).
- Registros con fecha fin pero sin inicio = **milestones (diamantes)**, también en Timeline.
- Toolbar específica: "Date settings", "Customize labels", "Appearance", "Summarize", "Filter", "Grouped by N field", "Sort", "Color", "Share view", y botón **"See records"** (record list en panel derecho). Altura de registro: short/medium/tall/extra tall; ancho Precise/Expanded.

### 10.5 Gantt

```
┌──────────────────────────────────────────────────────────────────┐
│ [Gantt ⌄] …                          [Month ⌄][Today] [‹][›]     │
├──────────────────┬───────────────────────────────────────────────┤
│ 🔍 Find a record │  T 29  W 30  T 1  F 2  S 3  S 4  …           │
│ [+ Add task]     │            ▓▓ = fines de semana grises         │
│ [⚑ Add milestone]│           ┃ = línea azul gruesa "hoy"          │
│ [Brand id.] 6 ▾  │  [███████ Tarea 1 █████]──▶                   │
│  Tarea 1         │            [████ Tarea 2 ████]                 │
│  Tarea 2         │                 ◆ ← milestone (diamante+línea) │
│ [Design] 4 ▾     │        [█████ Tarea 3 █████]                   │
│  Tarea 3         │                                                │
└──────────────────┴───────────────────────────────────────────────┘
```

- **Sidebar izquierdo** (redimensionable): buscador "Find a record" arriba, botones **"+ Add task"** y **"⚑ Add milestone"**, y debajo la **lista de registros agrupada** — encabezados de grupo como **píldora de color + contador + flecha de colapso** ("Brand identity 6 ▾") y nombres de registro debajo. Cada fila del sidebar = **un registro** (1 barra por tarea).
- **Eje temporal arriba** con meses y días (letra + número: "T 29 W 30…").
- **Arriba-derecha:** dropdown de rango (week, 2 weeks, month, quarter, year, 5 years) a la izquierda del botón **"Today"**, y **flechas ‹ ›** para saltar períodos.
- **En el chart:** "hoy" = **línea vertical azul gruesa**; líneas grises finas = cambio de mes; **fines de semana = franjas verticales gris más oscuro** (con rango ≤ mes). Barras coloreadas por "Record color" (color único / by view / by select field) con el label dentro.
- **Milestones = diamantes con línea vertical**. **Dependencias = flechas entre barras**; las barras muestran **puntos conectores circulares en sus extremos** para crear dependencias arrastrando (predecessor/successor vía linked record a la misma tabla, con critical path).
- Opción "Only workdays" oculta sábado/domingo (+ festivos configurables).

### 10.6 List

```
┌──────────────────────────────────────────────────────────────┐
│ [☰ List ⌄] [Set levels][Customize rows][Filter][Sort]  [Share…] │
├──────────────────────────────────────────────────────────────┤
│ PROJECT                                                      │  ← etiqueta de nivel en versalitas gris
│ ▾ Website redesign              [Status▾]   [Project▾]       │  ← padre: flecha ▾ + título negrita + columnas
│   FEATURE                                                    │
│   ▾ Homepage revamp           [In progress]                  │
│     TASKS                                                    │
│     ▸ Hero section            [To do]                        │
│     ▸ Copy update             [Done]                         │
│     + ADD TASK                                               │
│   + ADD FEATURE                                              │
│ ▾ Mobile app                                                 │
│                                                              │
│                                                    [ (+) ]   │  ← botón flotante circular azul abajo-derecha
└──────────────────────────────────────────────────────────────┘
```

- **Lista jerárquica indentada:** cada nivel tiene una **etiqueta de tipo de registro en versalitas gris pequeñas** sobre el grupo ("PROJECT", "FEATURE", "TASKS"); cada fila padre tiene **flecha de colapso ▾ a la izquierda** y título en negrita; los hijos aparecen **indentados**.
- Los campos adicionales se muestran como **columnas alineadas a la derecha** de cada fila (Status con píldora de color, Project, etc.).
- Bajo cada padre: fila "**+ ADD TASK**" / "**+ ADD FEATURE**" para crear hijos.
- Botón flotante **circular azul "+"** abajo-derecha para añadir registro.
- Toolbar específica: "Set levels", "Customize rows", "Filter", "Sort".
- Hasta **3 niveles cross-table** + 7 niveles de "nested records" (misma tabla; total 10). "Customize rows": visibilidad de secciones, **prefijo por ítem** (checkbox/user/single-select al inicio del primer campo del nivel más bajo), campos visibles por nivel, altura de fila por nivel, expandir/colapsar nivel completo con clic derecho, mostrar/ocultar padres vacíos.

---

## 11. Formularios

Airtable tiene **dos generaciones** de formularios: **Form view (legacy)** y **Form builder nuevo (2024+, basado en Interface Designer)**. Se documentan ambos.

### 11.1 Editor — Form view (legacy)

```
┌──────────────────────────────────────────────────────────────────┐
│ [🗒 Form ⌄] [Hide fields][Filter]…              [↗ Share form]   │
├────────────────┬─────────────────────────────────────────────────┤
│ FIELDS         │  ┌───────────────────────────────────────────┐  │
│ 🔍             │  │        Add a cover image (zona gris)      │  │
│ A Name         │  └───────────────────────────────────────────┘  │
│ ◎ Status       │  [Add a logo]                                   │
│ 🔗 Clients     │  Título del formulario (editable)               │
│ ☑ Done         │  Add a description for this form                │
│                │  ┌───────────────────────────────────────────┐  │
│                │  │ ⠿ A Name ⌄            Required (•━━) 👁  │  │  ← tarjeta de campo
│                │  │ [label            ]                       │  │
│                │  │ [Add some help text]                      │  │
│                │  └───────────────────────────────────────────┘  │
│ [+ Add a field │  ┌───────────────────────────────────────────┐  │
│  to this table]│  │ ⠿ ◎ Status ⌄          Required (━━•) 👁  │  │
│                │  │ Show field as: Dropdown | List            │  │
│                │  │ ☐ Limit selection to specific options     │  │
│                │  └───────────────────────────────────────────┘  │
│                │            [ Submit ]  ← doble clic para editar │
└────────────────┴─────────────────────────────────────────────────┘
```

- **Dos zonas:** **panel izquierdo "Fields"** (campos disponibles/ocultos; se arrastran desde ahí al formulario y viceversa para ocultarlos; botón "**+ Add a field to this table**" al fondo) y **canvas central** con preview en vivo.
- Arriba del canvas: zona gris "**Add a cover image**", opción "**Add a logo**", título editable y "**Add a description for this form**".
- **Cada campo en el canvas** es una tarjeta con: **drag handle (⠿) arriba-izquierda**, icono+nombre de campo con dropdown, **toggle verde "Required"** e **icono de ojo (ocultar) arriba-derecha**. Al hacer clic se despliega: caja de **label** (texto grande), caja de **help text** ("Add some help text") y opciones específicas ("Show field as: Dropdown | List", "Limit selection to specific options", "Limit record selection to a view", toggle condicional "Show field only when conditions are met").
- El botón **Submit** se edita con doble clic.
- **Dimensiones de marca (legacy, confirmadas oficialmente):** cover image **siempre 240px de alto × ancho de la ventana del navegador** (recomendado mín. 800×240, ideal 1800×480); **logo max-width 200px** (proporcional). Cover/logo/label de Submit/eliminar branding = solo planes de pago.

### 11.2 Editor — Form builder nuevo (2024+)

```
┌──────────────────────────────────────────────────────────────────┐
│ [Preview◯]  No changes · Last published {date}   [Share form][Publish form][Done] │
├────────────────────────────────────────┬─────────────────────────┤
│  CANVAS (fondo gris, preview en vivo)  │  PROPERTIES             │
│  ┌──────────────────────────────────┐  │  ▸ Form (Title)         │
│  │      Add a cover image           │  │  ▸ Data                 │
│  └──────────────────────────────────┘  │     Source table        │
│  [Add a logo]                          │     Fields: N visible   │
│  New Recipes (H1 editable)             │  ▸ Appearance           │
│  Add a description                     │     (•━━) Show Airtable │
│  Click to add text                     │            branding     │
│  ┌────────────┐ ┌────────────┐         │  ▸ Settings             │
│  │ campo      │ │ campo      │         │     See who submitted…  │
│  │ (lado a    │ │ lado)      │         │     Accepting submiss.  │
│  └────────────┘ └────────────┘         │  ▸ Submission options   │
│  ┌──────────────────────────────────┐  │     Button label=Submit │
│  │ ┄ Drop files here or browse ┄    │  │     Redirect to URL     │
│  └──────────────────────────────────┘  │     Message post-envío  │
│              [ Submit ]                │     ( ) Submit another… │
│                                        │     Email responses     │
└────────────────────────────────────────┴─────────────────────────┘
```

- **Tres zonas:** **canvas central gris** (preview en vivo), **panel de propiedades a la derecha** y **barra superior** ("No changes · Last published {date} · Share form · Publish form · Done"; toggle **Preview** arriba-izquierda).
- En el canvas, de arriba abajo: "**Add a cover image**" (arriba del todo), "**Add a logo**" (debajo-izquierda), **título H1 editable**, "**Add a description**", "**Click to add text**" (bloques de texto libre) y los campos, que pueden ir **apilados o lado a lado**, agrupados en "form groups".
- **Panel derecho** con secciones: **Form** (Title), **Data** (Source table, "Fields: N visible"), **Appearance** (toggle "**Show Airtable branding**"), **Settings** ("See who submitted a response", "Accepting submissions"), **Submission options** (Button label="Submit", Redirect to URL, Message post-envío, toggle "Show a 'Submit another response' button", Email responses).
- **Clic en un campo** abre su properties panel derecho: Title (label personalizado), Data→Source (Edit field), **Appearance** (Layout: "**Dropdown or List**" para selects; "**Card or pills**" para linked records; Size; Helper text), **Rules** (Visibility condicional, Selection, Options, Collaborators, Default value, Required field).
- **Form groups:** Show group title, Show description, **Show background color** (fondo gris claro del grupo) y **Field labels: Top o Side**.
- **Dimensiones de marca (builder nuevo, confirmadas):** cover renderizado a **256px de alto × ancho de ventana**, recorte responsivo (safe area = tercio central; recomendado 1800×512); **logo máx. 200×64px** (redimensiona, no recorta). Botón ✕ arriba-izquierda del canvas para eliminar cover/logo.

### 11.3 Página pública del formulario (vista del encuestado)

```
┌─────────────────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░ COVER IMAGE (full-width, 240/256px) ░░░░░░░░░ │
├─────────────────────────────────────────────────────────────┤
│        ┌──────────────────────────────────────┐             │
│        │ [logo YUM]  (máx. 200×64px)          │             │
│        │                                      │             │
│        │ Submit a new snack                   │  ← H1       │
│        │ Descripción en gris…                 │             │
│        │                                      │             │
│        │ Department *                         │  ← label + asterisco rojo
│        │ [+ Add record              ]         │  ← linked record picker
│        │ Help text gris                       │             │
│        │                                      │             │
│        │ How many                             │             │
│        │ [                        ]           │             │
│        │                                      │             │
│        │ Rating                               │             │
│        │ ★ ★ ★ ★ ☆                            │             │
│        │                                      │             │
│        │ [  Submit  ]   Clear form            │             │
│        │                                      │             │
│        └──────────────────────────────────────┘             │
│              Powered by Airtable                            │
└─────────────────────────────────────────────────────────────┘
                 ↑ columna centrada ~640–720px (aprox.)
```

Estructura de arriba abajo:

1. **Cover image a todo lo ancho** de la ventana (240px legacy / 256px builder nuevo de alto).
2. **Logo** justo debajo del cover, alineado a la izquierda de la columna de contenido (máx. 200×64px).
3. **Columna de contenido centrada** de ancho fijo (**~640–720px, aprox./inferencia** por capturas) sobre fondo blanco/gris muy claro.
4. **Título H1** del formulario (justificado a la izquierda), debajo la **descripción** (texto gris; soporta formato en builder nuevo).
5. **Campos en una sola columna:** **label arriba, input debajo** (en builder nuevo los labels pueden ir "Top" o "Side" por grupo); **asterisco rojo** junto al label en requeridos; **help text gris** bajo el label.
6. Al final: **botón "Submit"** (label editable; color primario azul en form view legacy, no personalizable) con la opción **"Clear form"** junto a él (pide confirmación).
7. **Branding "Powered by Airtable"** visible salvo toggle "Show Airtable branding" off (planes de pago).

**Alineación:** todo el contenido va **justificado a la izquierda** (título, labels, descripciones, inputs); no hay opción de centrar.

**Post-envío:** la página recarga y muestra el **mensaje post-envío** personalizable ("Thank you for submitting…") y, si está activo, el botón **"Submit another response"**. Opcionalmente: redirect a URL (no en embeds) o "request a copy of their responses" por email.

**Móvil:** página responsiva de una columna; el cover conserva altura fija y recorta por los lados; los campos attachment permiten hacer foto directamente.

### 11.4 Estilos de inputs en formularios

| Tipo de campo | Render en el formulario |
|---|---|
| Single/Multi select | Dos presentaciones: **"Dropdown"** (caja con chevron ▾ que despliega opciones) o **"List"** (lista vertical visible: **checkbox cuadrado (multi) o radio (single) a la izquierda + píldora de color**). En legacy el multi-select es un dropdown "select an option" que acumula píldoras seleccionadas |
| Attachment | Zona de **drag & drop punteada** con texto "**Drop files here or browse**" (link); múltiples archivos; thumbnails/píldoras tras subir; límite 5GB por archivo |
| Linked record | Botón "**+ Add record**" (builder nuevo) o "**+ Link to a record from {Table}**" (legacy) que abre un **picker con buscador** y lista de registros (elegidos como píldoras/cards). Configurable: "Limit record selection to a view", layout "Card or pills", permitir crear nuevos registros |
| Date | Input que abre un **date picker (mini-calendario desplegable)**; con hora incluye selector de tiempo; respeta timezone del campo |
| Rating | **Estrellas interactivas** (clic para fijar; máx. configurable, p. ej. 4/5) |
| Checkbox | Casilla/toggle |
| Long text | Textarea plano (sin markdown) |
| Email/Phone/URL | Validación de formato en cliente |
| Formula/Rollup/Created time | **No aparecen** en formularios |

---

## 12. Interface Designer

### 12.1 Lista de interfaces y creación

- Punto de entrada: pestaña **Interfaces** de la barra superior de la base (centrada en UI 2025).
- **Primera interface:** pantalla vacía con botón "**Start building**" → "**Build an interface**" → se pide **nombre + icono** → **Next**.
- **Si ya existen interfaces:** se abre el editor mostrando las páginas creadas; para editar se abre el **dropdown ⌄ arriba-izquierda junto al nombre de la base** → "**Edit**".
- **Selector de layout:** table layouts recomendados (**List, Gallery, Kanban, Calendar, Timeline**) + **Overview, Form, Dashboard, Record review**; en la sección "**More**", "**Blank**" (desde cero).
- **Asistente por pasos:** elegir layout → Next → elegir tabla origen (dropdown) → **Finish** → aterriza en la **versión borrador** dentro del editor.

### 12.2 Editor de interface (modo Edit) — 3 columnas + barra superior

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [Pages] [Nombre ⌄→Edit]  [Preview◯]              [Done] [Publish] [Share][🔔][(A)] │
├───────────────┬──────────────────────────────────────┬───────────────────┤
│ PAGES         │  CANVAS                              │ PROPERTIES        │
│ ▸ Interface 1 │  ┌────────────────────────────────┐  │ ▸ Data            │
│   ▾ Page 1 👁⋯│  │ ╔══════════════════╗           │  │   Source, Levels, │
│   ▸ Page 2    │  │ ║ visualización    ║ ← marco   │  │   Filter by, Sort │
│ ▸ Interface 2 │  │ ║ seleccionada azul║   azul    │  │   by, Group by…   │
│               │  │ ╚══════════════════╝           │  │ ▸ Filters         │
│               │  │  + (hover entre elementos)     │  │ ▸ Appearance      │
│               │  │  + Add group (hover en salto)  │  │   Color by, Row   │
│               │  │                                │  │   height…         │
│               │  │                                │  │ ▸ User actions    │
│               │  │                                │  │   Edit records    │
│               │  │                                │  │   inline…         │
│               │  [+ Add element] ← abajo-izquierda │  │                   │
└───────────────┴──────────────────────────────────────┴───────────────────┘
```

- **(1) Panel izquierdo "Pages":** se abre/cierra con el botón "**Pages**" (esquina superior izquierda); lista interfaces, grupos y páginas, **reordenables arrastrando**. Hover sobre una página revela icono **ojo** (mostrar/ocultar en la navegación del usuario final) y menú **"..."** (Rename / Duplicate / Delete / **Clear unpublished changes** (gris hasta que hay cambios) / **Keep as draft** → muestra etiqueta "**Draft**" junto al nombre; más mensaje de Publishing status: "Not published yet" o "Last published {x} ago").
- **(2) Canvas central:** la página y sus grupos/elementos. Al hacer clic sobre una visualización, el área se resalta con un **marco azul** y el panel derecho se puebla con sus propiedades. Al hacer hover aparecen botones **+** (añadir campo/insight) entre elementos y **"+ Add group"** sobre los saltos de línea.
- **(3) Panel derecho de propiedades:** para visualizaciones de table layouts, 4 bloques: **Data** (Source, Levels, Filter by, Sort by, Group by, Fields…), **Filters** (condiciones), **Appearance** (Color by, Field text color, Row height short/medium/tall/extra tall, Wrap headers, Show field descriptions…), **User actions** (Edit records inline, Add/delete records inline, Click into record details, Sort, Search, Filter, Group, Add records through a form, Buttons). En layouts legacy, pestañas **Data** y **Appearance** por elemento (Source, Permissions View-only/Editable, filtros: Copy settings from a view / All records / Viewer's records only / Specific records; Options; Appearance).
- **(4) Barra superior:** dropdown ⌄ junto al nombre (menú Edit), toggle **Preview** (arriba-izquierda; en layouts soportados permite alternar **Desktop / Mobile**; en Business/Enterprise puede simular un colaborador externo), botón **Done** y botón **Publish azul** arriba-derecha (azul cuando hay cambios pendientes; **gris/deshabilitado** si ya estás en la última versión publicada; los cambios se **autoguardan como borrador**, comunicado como "Interface has unpublished changes"). Junto a ellos: **Share** (azul), notificaciones y avatar.

### 12.3 Elementos y "+ Add element" (layouts Blank/legacy)

- Botón "**+ Add element**" en la esquina **inferior izquierda** del editor; abre un menú con buscador arriba-derecha.
- **Elementos disponibles:** Text, Divider, Grid, Calendar, Kanban, Timeline, Gallery, Chart, Number, Record picker, Filter, Button.
- Al arrastrar, aparece una **cuadrícula de líneas discontinuas (dashed grid)** que muestra dónde caerá el elemento y cómo se desplazarán los demás. `Esc` cancela; `Ctrl+Z` deshace.
- Una vez colocado, aparece una **barra de opciones sobre el elemento**: tirador punteado (mano para mover), dos iconos de expandir/contraer, duplicar y papelera.

### 12.4 Record detail en el editor

Canvas con campos apilados; entre campos aparece **+** al hover (añadir campo existente o "+ Create field"); clic en un campo revela icono **…** (Remove); campos reordenables arrastrando (máx. ~4 por fila). Propiedades de grupo: Title, Fields, Show group title, Show description, **Show background color** ("slight gray background"), Field labels **Side/Top**, Buttons, Rules (visibilidad condicional, icono cogwheel).

### 12.5 Página publicada (usuario final)

- **Navegación lateral izquierda** con, de arriba abajo: (1) **dropdown de la interface** (nombre; opciones View data / Edit / "← Back to home"), (2) **navegación de interfaces y páginas** (grupos y páginas clicables; las ocultas/no publicadas no aparecen; si solo hay una interface/página publicada, el sidebar no se muestra), y en la zona inferior: **menú de cuenta**, **notificaciones** y **menú Share de la interface**.
- **Filtros de usuario arriba:** UN tipo por página — **Tabs** (pestañas-filtro predefinidos; la primera es "All records"; se añaden con un **botón + azul** en el canvas) o **Dropdowns** (filtros interactivos; 2+ permiten drill-down).
- **Visualizaciones publicadas:**
  - **Charts:** tipos Bar (por defecto), Line, Pie, Donut, Scatter; leyenda configurable (izquierda/derecha/arriba/abajo/oculta), barras horizontales/verticales, toggles "Show record count in chart/legend" y "Show percentage on chart", **paletas de color preconfiguradas**; descripción como tooltip con icono.
  - **Number cards:** número grande con **color seleccionable** (flechas para navegar opciones) y **label** editable.
  - **Listas de registros** con fields visibles, prefix field (status/checkbox), agrupación y coloreado.
  - **Botones:** esquina **superior derecha** de las páginas; color por defecto **gris** (**rojo** para "Delete record"); pueden pedir confirmación y disparar acciones (crear registro, ir a URL, copiar link, aplicar template, run automation).
- **Multi-visualización:** si el builder habilita más de una visualización (icono ojo en Appearance > Visualizations), el usuario las cambia con un **dropdown**. Acciones avanzadas vía menú **…** arriba-derecha: Print all records, export/import CSV (según toggles).

---

## 13. Automations

### 13.1 Lista de automatizaciones

- Punto de entrada: pestaña **Automations** de la barra superior (centrada en UI 2025).
- **Layout de 3 columnas:** izquierda = lista de automations; centro = canvas/árbol de la automation; derecha = panel de propiedades del paso seleccionado.
- **Sidebar izquierdo:** buscador "Find an automation", lista de automatizaciones agrupadas en **secciones colapsables** (la sección "More" por defecto siempre al fondo); hover sobre una automation revela handle de 6 puntos para reordenar. Creación: botón "**+ Create new…**" **arriba** (antes abajo) → menú: Create automation / Create section / Browse automation catalog.
- **Toggle ON/OFF:** situado **encima del sidebar izquierdo**, con el texto "ON"/"OFF" dentro del toggle (UI 2025). **OFF = rojo**; al activarlo queda **verde (ON)**. Junto al nombre de la automation hay un **dropdown ⌄**: Rename automation (o doble clic en el nombre), Edit description, Manage subscribers (modal), Copy automation URL, Duplicate automation ("{name} copy"), Delete automation (requiere apagarla primero).

### 13.2 Editor de automatización — trigger → acciones vertical

```
┌──────────────┬──────────────────────────────────┬──────────────────┐
│ [(•━━) ON]   │   Nombre de la automation ⌄      │                  │
│──────────────│──────────────────────────────────│──────────────────┤
│ Find an      │                                  │  PROPERTIES      │
│ automation   │   ┌────────────────────────┐     │  Configuration   │
│ ──────────── │   │ + Add trigger          │     │                  │
│ More       ⌄ │   └────────────────────────┘     │  Table: [Table 1]│
│ ⚡ Email dig.│            │                      │  Record ID:      │
│ ⚡ Weekly    │   ┌────────────────────────┐     │  [            ][+]│ ← botón "+" azul
│   report     │   │ ⚡ When record created ✓│ ← check verde      │   y blanco =
│              │   └────────────────────────┘     │   insertar token │
│ [+ Create    │            │                      │                  │
│  new…]       │   ┌────────────────────────┐     │  (campos de la   │
│              │   │ ✉ Send email       ✓   │     │   acción)        │
│              │   └────────────────────────┘     │                  │
│              │            │                      │                  │
│              │   [+ Add advanced logic          │                  │
│              │       or action]                 │                  │
└──────────────┴──────────────────────────────────┴──────────────────┘
```

- **Columna vertical de pasos en el centro:** primero "**+ Add trigger**" (tarjeta de trigger arriba), debajo las **acciones apiladas**, y al final el botón "**+ Add advanced logic or action**" (en el centro de la página) que abre un menú de acciones/lógica: Create record, Update record, Send email, Run a script, Find records, Conditional logic, Repeating group… Los pasos se pueden arrastrar dentro de bloques condicionales.
- **Panel de configuración a la derecha:** al seleccionar un paso, sus propiedades aparecen en el **sidebar derecho** (Properties/Configuration): p. ej. Update record muestra "Configuration" con tabla + "Record ID" y un **botón "+" azul y blanco** para insertar **tokens dinámicos** de pasos previos (menú "Use data from…"; los tokens con icono `>` tienen submenú de propiedades).
- **Testing por pasos:** cada paso debe probarse antes de activar — el trigger con "**Use suggested record**" o "**Choose record**"; las acciones con "**Test action**" (Send email incluye "**Generate a preview**"). Un paso probado con éxito muestra **check/marca verde** junto al paso (confianza media-alta en el glifo exacto). La automation **no se puede encender hasta que TODOS los pasos tienen test exitoso**.
- **Run history:** sección "**Automation history**" con ejecuciones exitosas y fallidas (las pruebas NO aparecen), opción "**Rerun**" de runs fallidos y pestaña "**Version history**". Retención según plan: Free 2 semanas, Team 6 meses, Business 1 año, Enterprise 3 años.
- **Editor de script:** la acción "Run a script" abre una ventana de edición de código con **sidebar de Input Variables** (y opción "secrets") a un lado y la consola/editor JavaScript al otro.
- *(UI legacy 2022: el editor era un panel lateral derecho superpuesto a la base con pestañas "When…"/"Run actions" y botón "+ Add Action" — solo relevante para réplica de UI clásica.)*

---

## 14. Atajos de teclado

Los atajos son parte de la UI (visibles como hints en la interfaz, p. ej. "⌘K" en el campo Search). Tabla de referencia (Mac / Windows):

| Atajo | Acción |
|---|---|
| `⌘K` / `Ctrl+K` | Búsqueda global / quick base switcher (desde home, base o interface) |
| `⌘J` / `Ctrl+J` | Table switcher |
| `⇧⌘K` / `Ctrl+Shift+K` | View switcher |
| `⌘F` o `⌘G` / `Ctrl+F` | Find bar en la vista (`Esc` cierra) |
| `⇧⌘F` | Abrir menú Filter |
| `⇧⌘D` | Abrir menú Group (`Enter` colapsa/expande grupos) |
| `⇧⌘S` | Abrir menú Sort |
| `⇧⌘` | Toggle de extensions |
| `Space` | Expandir el registro de la celda seleccionada |
| `Shift+Space` | Expandir el contenido de una celda de texto |
| `⌘P` | Imprimir vista / registro expandido |
| `⌘Z` / `⌘Y` | Undo / Redo |
| `Tab` / `Shift+Tab` | Moverse entre elementos similares |
| `⌘/` o `Ctrl+/` | Lista completa de atajos (ayuda) |

---

## 15. Notas finales para el implementador

### 15.1 Qué priorizar para un clon reconocible

Si el objetivo es que cualquier usuario de Airtable reconozca el producto al instante, estos son los elementos de mayor valor identificativo, en orden:

1. **La view bar con sus badges de estado** — el patrón `[▽ 3 filters]` verde, `[▦ Grouped by 2 fields]` lila, `[↓↑ Sorted by 1 field]` melocotón y `[👁 N hidden fields]` azul es probablemente el rasgo visual más distintivo de Airtable. Replicar orden exacto de botones, iconos y colores de badge.
2. **Las píldoras de color** — selects como píldoras pastel en grid, kanban, gallery, calendar y swimlanes; píldoras grises para linked records; checkbox verde centrado. Son el "lenguaje visual" transversal del producto.
3. **El registro expandido** — modal con action bar persistente (⌃⌄, título con barra de color, ⋯🔗💬✕) y campos label-izquierda/valor-derecha. Es la pantalla que todo usuario abre decenas de veces al día.
4. **El gutter del grid** — números de fila que se convierten en checkboxes azules al hover, icono ⤢ de expandir, fila "+" final y fill handle en la celda seleccionada con borde azul.
5. **La table bar teñida** con el color de la base + botón Share del mismo acento: el sistema de "acento por base" es característico.
6. **Los formularios centrados** — cover full-width (240/256px) → logo → columna ~640–720px (aprox.) → H1 → campos → Submit azul + "Clear form" + "Powered by Airtable". Estructura inconfundible.
7. **Los popovers de configuración** (Filter con filas campo-operador-valor y conjunción And/Or, Hide fields con toggles verdes, Row height con iconos de densidad) — patrones repetidos que dan consistencia.

### 15.2 Qué puede simplificarse

- **Colaboración multiusuario:** avatares, presencia en tiempo real, comentarios, revision history y permisos pueden omitirse o dejarse como elementos visuales inertes (el botón Share, el icono 💬 del modal y la campana 🔔 deben existir en el layout aunque no hagan nada).
- **Funciones de IA (Omni):** excluir el rail lateral 2025 con el icono Omni; basta la UI clásica. Si se usa UI 2025, dejar el hueco del rail sin el icono de IA.
- **Planes y badges de pago:** los badges [Team]/[Business] junto a opciones de menú pueden ignorarse.
- **Sync, data library, sandboxes, App library, product switcher:** puntos de entrada empresariales; omitir.
- **Extensions / Tools:** mantener el menú Tools en la barra superior como elemento visual; el contenido puede ser mínimo.
- **Run history con retención por plan, Version history, Manage subscribers:** simplificables a una lista plana de ejecuciones.
- **Dark mode:** es beta y personal; el clon puede limitarse al tema claro sin pérdida de reconocibilidad.

### 15.3 Datos marcados como inferencia (resumen de incertidumbres)

- Anchos en px de sidebars (~250–300px) y columna de formulario público (~640–720px): aproximados, no documentados oficialmente (el cover de 240/256px y el logo 200×64px sí están confirmados).
- Tamaño de fuente del grid (~13px): estimación visual extendida; solo está confirmado que históricamente no era personalizable.
- Estilo exacto de la tab de tabla activa (subrayado vs. fondo saturado): no descrito en fuentes.
- Copy de las descripciones bajo cada tipo de vista en "Create new view": confirmados icono+nombre, no el texto.
- Orden vertical estricto de las secciones del view sidebar: la documentación las enumera pero no fija el orden de renderizado.
- Check verde por paso probado en automatizaciones: flujo documentado, glifo exacto inferido de screenshots.
- Toasts transitorios: no documentados (hallazgo negativo).
- Hex RGB de las 40 variantes de color de select: no publicados oficialmente; solo nombres canónicos.
- La UI de Airtable está en evolución activa (rediseño 2025–2026 por cohortes): conviene validar contra la UI viva antes de congelar una réplica pixel-perfect.

---

*Documento generado a partir de las investigaciones `ui_dim01` (anatomía global), `ui_dim02` (grid view), `ui_dim03` (vistas no-grid y formularios) y `ui_dim04` (interfaces, automatizaciones y diseño visual), todas con verificación contra documentación oficial de Airtable y capturas oficiales anotadas.*
