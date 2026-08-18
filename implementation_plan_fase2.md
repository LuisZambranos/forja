# Plan Maestro de Ejecución: Fase 2 (Flexibilidad y Gamificación) V2

Siguiendo tus indicaciones, hemos invertido las prioridades. Abordaremos primero los **cambios arquitectónicos profundos** (Supersets y Skip) para asentar unas bases sólidas, evitando tener que refactorizar el código más adelante. Hemos ajustado cada módulo con tus observaciones exactas.

---

## Subfase 2.1: Reestructuración Arquitectónica (Las Bases)
*Es imperativo hacer esto primero porque cambia cómo se guarda y se lee una rutina en toda la app.*

1. **Supersets / Circuitos:**
   - **El Reto:** Cambiar la estructura lineal (A, B, C) a agrupaciones (A1, A2, B, C).
   - **Lógica:** Refactorizar el creador de rutinas para permitir "vincular" ejercicios. En el Modo Focus, la navegación cambiará para mostrarte "Serie 1 de Ejercicio A1", y al darle *Check*, saltar inmediatamente a "Serie 1 de Ejercicio A2" sin temporizador de descanso, aplicando el descanso solo al finalizar el bloque del superset.
2. **Botón "Skip" (Omitir) y Entrenamientos Fraccionados (Cardio):**
   - **Lógica:** Añadir el estado `skipped` a los ejercicios de la sesión. Si marcas algo como Skip (por tiempo), **no afectará ni positiva ni negativamente** tus estadísticas, simplemente constará que no se hizo.
   - **Reanudación:** Si dejaste el Cardio "Skipped", podrás "Reanudar" el entrenamiento más tarde en el día. El sistema cargará los ejercicios faltantes, permitiéndote anexar el cardio en la tarde a la misma sesión del día.

---

## Subfase 2.2: Flexibilidad y Educación (El Creador de Hábitos)
*Mejoras masivas a la experiencia de usuario (UX) dentro del Modo Focus.*

1. **Sustitución Rápida en Vivo (+ Creación):**
   - **Lógica:** Botón para "Cambiar Ejercicio". Abre un modal para seleccionar otro ejercicio. **Mejora:** Si el ejercicio no existe en tu lista, tendrás un botón para crearlo allí mismo, guardándolo en tu catálogo y usándolo para reemplazar el actual en esta sesión específica.
2. **Sistema de Calentamiento Inteligente:**
   - **Lógica:** Descartamos registrar el "warmup" en la base de datos para no ensuciar. En su lugar, antes de iniciar el ejercicio, una tarjeta educativa calculará tu calentamiento basado en tu último levantamiento efectivo (o el peso que planees usar hoy):
     - *Serie 1:* 40% - 50% (8 a 10 reps)
     - *Serie 2:* 60% - 70% (5 a 6 reps)
     - *Serie 3:* 80% - 85% (2 a 3 reps)
3. **RPE (Esfuerzo Percibido) y Educación Continua:**
   - **Lógica:** Añadir campo `RPE` (1-10) al registrar la serie. Si el sistema detecta que tu RPE fue bajo (ej. 5) y sacaste muchas repeticiones (ej. > 20), lanzará un aviso educativo sugiriendo subir el peso para optimizar hipertrofia/fuerza y no perder el tiempo con resistencia excesiva.
4. **Calculadora de Discos (Avanzada):**
   - **Lógica:** No será una simple división por dos. Al crear/editar un ejercicio, definiremos su **perfil de equipamiento** (Barra Olímpica de 20kg, Máquina Unilateral, Poleas, Mancuernas). 
     - *Ej. Peso Muerto:* Alzas 100kg -> Sistema resta 20kg de la barra = 80kg -> 40kg por lado (Dos discos de 20kg por lado).
     - *Ej. Máquina Unilateral:* Alzas 25kg -> 25kg por lado directo.

---

## Subfase 2.3: Gamificación y Herramientas Aisladas
*Una vez que el motor de datos está estable con los Supersets y RPE, aplicamos los toques finales.*

1. **Etiquetas de Serie Efectiva (Drop-set / Fallo):**
   - **Lógica:** Botones rápidos en la serie para marcarla como `drop-set` o `failure`. Ayuda a entender por qué en la siguiente serie bajaste tanto el peso.
2. **Animaciones de Récord Personal (PR):**
   - **Lógica:** Integrar animaciones vistosas (ej. `react-confetti`) en la pantalla de éxito que ya te muestra las tarjetas de los ejercicios mejorados.
3. **Exportar Historial (CSV/JSON):**
   - **Lógica:** Se hace de último para garantizar que el archivo CSV incluya correctamente los datos de RPE, el tipo de serie (drop-set), los Supersets y los Skips. Cero impacto en BD.

---

## Siguiente Paso

> [!IMPORTANT]
> **Subfase 2.1: Supersets y Skip** es monumental y requerirá cambios en el núcleo de la base de datos y la UI.
> Si este plan te parece correcto, procederé a crear el **Diseño Técnico Detallado para la Subfase 2.1** (qué archivos se modificarán y cómo estructuraremos la BD para soportar los supersets).
