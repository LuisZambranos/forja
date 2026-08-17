# Plan Maestro: Hub de "Mi Progreso" (Definitivo y Detallado)

Tienes toda la razón. Si no documentamos el alcance milimétrico de cada módulo, la deuda técnica y el olvido nos pasarán factura en el desarrollo. 

Este es el desglose **absolutamente detallado** de cada sección y el roadmap para construirlo pieza a pieza.

---

## 🏗️ ARQUITECTURA DE PANTALLAS (El "Qué")

El Hub de `/progress` se dividirá en 4 pestañas/vistas principales. A continuación, el detalle exacto de lo que debe existir en la interfaz y la lógica de cada una:

### 1. 🏋️‍♂️ Fuerza y Récords (1RM por Ejercicio)
Esta vista centraliza la fuerza. Une la progresión y los récords en un solo lugar.
*   **Selector de Ejercicio:** Un dropdown o input de búsqueda que solo muestra ejercicios que el usuario ya ha realizado (no el catálogo entero).
*   **Gráfica de Progresión:** Una gráfica lineal (tipo Recharts o Chart.js) que plotea el peso máximo levantado de ese ejercicio a lo largo del tiempo (Eje X: Fechas, Eje Y: Peso en kg/lbs).
*   **Calculadora de 1RM Real (Epley):** Justo arriba de la gráfica, el sistema detecta la serie más dura de ese ejercicio (basada en peso * reps) y calcula tu 1RM estimado, mostrando: *"1RM Estimado: 125 kg"*. 
*   **Historial de PR (Personal Records):** Un listado abajo de la gráfica mostrando tus mejores marcas históricas. (Ej: *100kg x 1 rep*, *80kg x 5 reps*).

### 2. ⚖️ Evolución Corporal (Métricas y Fotos)
Vista diseñada para ver el cambio físico. **Todo el formulario es 100% opcional.**
*   **Formulario de Captura:**
    *   Input de **Peso** (kg/lbs).
    *   Input de **% Grasa Corporal**.
    *   Inputs de **Medidas**: Brazo, Cintura, Pecho, Piernas.
    *   Módulo de **Fotos**: Subida de foto frontal, lateral y trasera.
*   **Motor de Imágenes de Alto Rendimiento:** 
    *   Al adjuntar una foto, la app usa un `<canvas>` HTML5 oculto para **comprimirla y convertirla a `.webp`** en el mismo celular. 
    *   Se envía la foto ultraligera a la API pública de **ImgBB**.
    *   ImgBB devuelve un link. Ese link es lo **único** que se guarda en Firestore, cuidando tu base de datos al máximo.
*   **Timeline Visual:** Una lista en formato tarjeta ordenando cronológicamente el historial, mostrando peso, medidas, y la miniatura de la foto que al hacer clic se abre en un modal a pantalla completa.

### 3. 🔥 Logros y Consistencia
Gamificación pura, diseñada para retención del usuario.
*   **Tasa de Consistencia:** Un gráfico de anillo (donut) que muestra el % real de cumplimiento semanal. Cruza los días que el usuario *fue* al gimnasio contra la *meta* que configuró (Ej: Rutina de 4 días). Con mensajes variables: *"¡Semana perfecta!"*, *"Casi lo logras, retoma el ritmo"*.
*   **Mapa Muscular Mensual:** Gráfica de radar o barras que suma las repeticiones/series por grupo muscular (Pecho, Espalda, etc.) en los últimos 30 días para identificar rápidamente qué músculo está ignorando.
*   **Racha (Streaks):** UI destacada mostrando los días seguidos (`current_streak`) y el récord de la cuenta (`max_streak`).
*   **Tonelaje Histórico (Logro Maestro):** Un número impactante (Ej: *"¡2.5 Millones de Kilos movidos!"*). 
    *   *Detalle técnico:* Coste cero en base de datos. Usaremos un contador `lifetime_tonnage` guardado en el perfil. Cada vez que termine un entreno, le sumamos a ese contador usando `increment()` de Firestore sin tener que leer nada.

### 4. 📅 Historial Completo de Entrenamientos
Para los geeks de sus propios datos.
*   **Listado de Sesiones:** Una feed vertical infinita de todas las sesiones históricas (Fecha, Duración, Tonelaje de la sesión, Músculos principales tocados).
*   **Motor de Paginación Inteligente:** Para no arruinar la cuota de lecturas de Firestore si el usuario lleva 2 años usando la app, implementaremos paginación por cursores (`startAfter` en Firebase) + TanStack Query (`useInfiniteQuery`). Cargará 10 sesiones, y al llegar al fondo (o hacer click en "Cargar más") traerá las 10 siguientes.

---

## 🚦 ROADMAP DE EJECUCIÓN (El "Cuándo y Cómo")

Ejecutaremos esto paso a paso. Me dirás cuándo empezar el paso 1, y no haré el paso 2 sin que pruebes el 1.

### **Paso 1: Rediseño Dashboard y Backend Base**
*   **Backend:** Agregar la propiedad `lifetime_tonnage` en TypeScript (`types.ts`). Modificar `FocusMode.tsx` para que, en el lote final de la sesión, use `increment()` sumando el tonelaje de hoy al usuario.
*   **Dashboard UI:** Quitar el engañoso 1RM Global de `ProgressPreviewCard.tsx`. Reemplazarlo por **"Tiempo Promedio"** de sesión de la semana.
*   **Tooltips (ⓘ):** Agregar modales al hacer click/hover en "Volumen Semanal" (*"Suma todo el peso movido de la semana. Ayuda a medir tu ritmo contra semanas previas"*) y "Tiempo Promedio" (*"Duración promedio por entreno. Ayuda a optimizar descansos"*).

### **Paso 2: Arquitectura y Push Notifications**
*   Crear los 4 componentes modulares de la interfaz en una nueva carpeta `/progress/components/`. 
*   Configurar Firebase Cloud Messaging, crear un Service Worker y poner la alerta visual ("Han pasado 7 días desde tu última medición corporal").

### **Paso 3: Evolución Corporal y API ImgBB**
*   Quitar el registro de peso estático del "Perfil".
*   Armar el componente de Evolución Corporal, programar la conversión Canvas a WebP local, y conectar con ImgBB para almacenar el historial de fotos/peso.

### **Paso 4: Consistencia y Logros**
*   Armar la UI del anillo de Consistencia y leer el Tonelaje Histórico en tiempo real. 

### **Paso 5: Fuerza, 1RM y Catálogo**
*   Armar la pantalla de progresión de fuerza (gráfica) y modificar el `ExerciseModal` del catálogo para inyectarle tu 1RM si existe.

### **Paso 6: Paginación Infinita**
*   Construir la pantalla final del historial de entrenamientos y programar el cursor infinito en la base de datos.

---

**Ahora sí, tenemos un manual de construcción a prueba de balas.** 
Si estás conforme con este nivel de especificación, dime *"Aprobado, arranca el Paso 1"* y nos vamos al código.
