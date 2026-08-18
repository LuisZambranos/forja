# Roadmap — Forja

## Fase 0 — MVP de hoy ✅ Completada

Objetivo: ir al gimnasio y usarla.

- [x] Setup Vite + React 19 + Tailwind v4 + Firebase + Vercel
- [x] `firestore.rules` desde el commit inicial (nunca "modo test")
- [x] Login Google / Email-Password
- [x] Ejercicios: creación manual en la cuenta propia
- [x] Rutinas: armado básico (ejercicios + series objetivo + tiempo de descanso)
- [x] **Modo Focus:** pantalla oscura, peso/reps por serie, temporizador de descanso, botón "Finalizar entrenamiento"
- [x] **"Última vez que hiciste esto":** al abrir un ejercicio, mostrar peso/reps de la sesión anterior
- [x] Wake Lock API (con fallback silencioso si el navegador no lo soporta), para que la pantalla no se apague a mitad de serie
- [x] Escritura por lote (`writeBatch`) al finalizar la sesión — no una escritura por serie
- [x] Catálogo inicial de ~35 ejercicios comunes, cargado como `is_global: true` vía script de seed
- [x] Modo Focus: `target_sets` de la rutina pre-carga filas de input pero no bloquea

### Extras entregados fuera de plan inicial

- [x] Perfil de usuario completo (altura, peso inicial, sexo, avatar SVG dinámico)
- [x] Sistema de rachas gamificado (niveles, hitos, trofeos)
- [x] Descanso diferenciado entre series vs. entre ejercicios en Modo Focus
- [x] Frases motivacionales diarias dinámicas en el dashboard

## Fase 1 — PWA, offline y progresión visual ✅ Completada

Objetivo: robustez contra el wifi del gimnasio, y ver el avance.

- [x] Auditoría de performance: queries acotadas para racha y última vez.
- [x] PWA instalable nativamente (manifest + service worker vía `vite-plugin-pwa`).
- [x] Persistencia offline nativa de Firestore (`persistentLocalCache`).
- [x] Alertas sonoras/vibración al finalizar el descanso.
- [x] **Análisis de Fuerza (Módulo de Progreso)**: Gráficas de evolución de peso por ejercicio.
- [x] **Cálculo de 1RM Estimado**: Fórmula de Epley aplicada en vivo a las mejores series (Mejores Marcas / Historial de PRs).
- [x] **Mapa Muscular**: Gráfico de radar interactivo con la distribución del volumen de entrenamiento en las últimas 8 semanas.
- [x] **Detalle de Consistencia Semanal**: Modal interactivo que desglosa el cumplimiento diario (Cumplidos, Fallados, Pendientes, Programados).
- [x] **Lógica de "Entrenamientos Recuperados"**: El sistema compensa y recompensa días fallados si el usuario realiza la rutina específica en un día extra dentro de la misma semana.
- [x] **Auto-curación de Rachas**: Sistema de mitigación visual dinámica (Auto-heal) para resolver desincronizaciones de récords históricos vs rachas actuales.
- [x] Distintivos UI dinámicos en Dashboard (Hoy asegurado, Pendiente hoy vibrante, ¡Empieza hoy!).

## Fase 2 — Flexibilidad extrema y gamificación ⏳ En curso

Objetivo: retención vía recompensas visuales y comodidad.

- [x] Métricas corporales: peso corporal, medidas, fotos de progreso (Firebase Storage)
- [ ] Etiquetas de serie en la UI: Calentamiento, Drop-set, Al fallo _(Nota: la base de datos ya soporta `normal`, `warmup` y `drop`)_
- [x] RPE (esfuerzo percibido)
- [x] Sustitución rápida de ejercicio en vivo, sin dañar la plantilla de la rutina
- [ ] Animación (confeti/alerta) al superar un Récord Personal histórico
- [x] Supersets / circuitos — ejercicios agrupados sin descanso entre ellos
- [x] Calculadora de discos — qué platos cargar para llegar al peso objetivo
- [ ] Exportar historial a CSV/JSON — dueño de sus propios datos, barato de implementar

### Extras integrados fuera de plan

- [x] **Módulo de Academia:** Biblioteca educativa con tips, músculos involucrados, precauciones y videos de ejecución.
- [x] **Integración de Cardio:** Soporte nativo para ejercicios cardiovasculares (Tiempo/Distancia), rutinas híbridas y UI/progresión adaptativa.

## Fase 3 — Comunidad y escalabilidad

Objetivo: crecimiento orgánico y monetización.

- [ ] Catálogo global de ejercicios ampliado con imágenes/GIFs
- [ ] Rutinas públicas, clonables, con paginación por cursor (`startAfter`) — nunca `offset`
- [ ] Roles de usuario (bases para free/premium)
- [x] Notificaciones push (Firebase Cloud Messaging — no requiere plan Blaze)
- [ ] `firestore.indexes.json` revisado por cada query compuesta nueva
- [ ] Mover consolidación de `user_stats` a una Cloud Function (requiere plan Blaze) — cuando el volumen de base de datos lo justifique

## Fase 4 — Ecosistema mobile

Objetivo: el salto final.

- [ ] Proyecto en React Native
- [ ] Reutilización de `src/shared/` y de los custom hooks de la versión web
- [ ] Lanzamiento en Play Store y App Store
