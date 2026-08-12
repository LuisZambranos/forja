# Roadmap — Forja

## Fase 0 — MVP de hoy

Objetivo: ir al gimnasio y usarla.

- [x] Setup Vite + React 19 + Tailwind v4 + Firebase + Vercel
- [x] `firestore.rules` desde el commit inicial (nunca "modo test")
- [x] Login Google / Email-Password
- [x] Ejercicios: creación manual en la cuenta propia
- [x] Rutinas: armado básico (ejercicios + series objetivo + tiempo de descanso)
- [x] **Modo Focus:** pantalla oscura, peso/reps por serie, temporizador de descanso, botón "Finalizar entrenamiento"
- [x] **"Última vez que hiciste esto":** al abrir un ejercicio, mostrar peso/reps de la sesión anterior. Se mueve de "nice to have" a Fase 0 — es el dato que sostiene la sobrecarga progresiva y evita que el usuario reescriba de memoria
- [x] Wake Lock API (con fallback silencioso si el navegador no lo soporta), para que la pantalla no se apague a mitad de serie
- [x] Escritura por lote (`writeBatch`) al finalizar la sesión — no una escritura por serie
- [x] Catálogo inicial de ~35 ejercicios comunes, cargado como `is_global: true` vía script de seed (`scripts/seed-exercises.mjs`, corrido una vez con `firebase-admin`) — no se crean uno por uno desde el formulario
- [x] Modo Focus: `target_sets` de la rutina pre-carga filas de input pero no bloquea — botón "+ Agregar serie" siempre disponible, y solo se guardan las filas con datos reales al finalizar

## Fase 1 — PWA, offline y progresión visual

Objetivo: robustez contra el wifi del gimnasio, y ver el avance.

- [ ] PWA instalable (manifest + service worker)
- [ ] Persistencia offline nativa de Firestore (`enableIndexedDbPersistence`) — no reinventar una cola offline propia
- [ ] Dashboard: volumen semanal, 1RM estimado (fórmula de Epley), calculado **en el cliente y cacheado** con TanStack Query — sin Cloud Functions todavía, para quedarte en plan Spark sin tarjeta asociada
- [ ] Alertas sonoras/vibración al finalizar el descanso

## Fase 2 — Flexibilidad extrema y gamificación

Objetivo: retención vía recompensas visuales y comodidad.

- [ ] Etiquetas de serie: Calentamiento, Drop-set, Al fallo
- [ ] RPE (esfuerzo percibido) por serie
- [ ] Sustitución rápida de ejercicio en vivo, sin dañar la plantilla de la rutina
- [ ] Animación (confeti/alerta) al superar un Récord Personal histórico
- [ ] Métricas corporales: peso corporal, medidas, fotos de progreso (Firebase Storage)
- [ ] Supersets / circuitos — ejercicios agrupados sin descanso entre ellos
- [ ] Calculadora de discos — qué platos cargar para llegar al peso objetivo
- [ ] Exportar historial a CSV/JSON — dueño de sus propios datos, barato de implementar

## Fase 3 — Comunidad y escalabilidad

Objetivo: crecimiento orgánico y monetización.

- [ ] Catálogo global de ejercicios con imágenes/GIFs
- [ ] Rutinas públicas, clonables, con paginación por cursor (`startAfter`) — nunca `offset`
- [ ] Roles de usuario (bases para free/premium)
- [ ] Notificaciones push (Firebase Cloud Messaging — no requiere plan Blaze)
- [ ] `firestore.indexes.json` revisado por cada query compuesta nueva
- [ ] Recién acá evaluar mover `user_stats` a una Cloud Function (requiere plan Blaze) — el volumen de usuarios ya lo justifica

## Fase 4 — Ecosistema mobile

Objetivo: el salto final.

- [ ] Proyecto en React Native
- [ ] Reutilización de `src/shared/` y de los custom hooks de la versión web
- [ ] Lanzamiento en Play Store y App Store
