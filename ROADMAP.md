# Roadmap — Forja

## Fase 0 — MVP de hoy ✅ completada

Objetivo: ir al gimnasio y usarla.

- [x] Setup Vite + React 19 + Tailwind v4 + Firebase + Vercel
- [x] `firestore.rules` desde el commit inicial (nunca "modo test")
- [x] Login Google / Email-Password
- [x] Ejercicios: creación manual en la cuenta propia
- [x] Rutinas: armado básico (ejercicios + series objetivo + tiempo de descanso)
- [x] **Modo Focus:** pantalla oscura, peso/reps por serie, temporizador de descanso, botón "Finalizar entrenamiento"
- [x] **"Última vez que hiciste esto":** al abrir un ejercicio, mostrar peso/reps de la sesión anterior — **pendiente de confirmar que muestra el último valor real y no un promedio, ver auditoría en Fase 1**
- [x] Wake Lock API (con fallback silencioso si el navegador no lo soporta), para que la pantalla no se apague a mitad de serie
- [x] Escritura por lote (`writeBatch`) al finalizar la sesión — no una escritura por serie
- [x] Catálogo inicial de ~35 ejercicios comunes, cargado como `is_global: true` vía script de seed
- [x] Modo Focus: `target_sets` de la rutina pre-carga filas de input pero no bloquea

### Extras entregados fuera de plan (no estaban en el prompt de Fase 0)

- Perfil de usuario completo (altura, peso inicial, sexo, avatar SVG dinámico)
- Sistema de rachas gamificado (niveles, hitos, badge "hoy asegurado") — **pendiente de confirmar que la query esté acotada, ver auditoría en Fase 1**
- Frases motivacionales diarias en el dashboard
- Descanso diferenciado entre series vs. entre ejercicios en Modo Focus

> **Nota de proceso:** de acá en adelante, cualquier funcionalidad fuera de lo pedido en el prompt se propone antes de implementarse, no se agrega directamente. Lo de arriba se queda — es buen trabajo — pero sirve como recordatorio de mantener el alcance bajo control de cara a las siguientes fases.

## Fase 1 — PWA, offline y progresión visual

Objetivo: robustez contra el wifi del gimnasio, y ver el avance.

- [x] Auditoría: confirmar que el cálculo de racha use una query acotada (no todo el historial) y que "última vez" traiga el valor real más reciente (no un promedio) — corregir si hace falta
- [x] PWA instalable de verdad (manifest + service worker vía `vite-plugin-pwa`) — lo que viste instalarse antes probablemente era el atajo genérico de Chrome, no esto
- [x] Persistencia offline nativa de Firestore (`persistentLocalCache` — la API vieja `enableIndexedDbPersistence` está deprecada) — no reinventar una cola offline propia
- [x] Dashboard: volumen semanal, 1RM estimado (fórmula de Epley), calculado **en el cliente sobre una query acotada y cacheado** con TanStack Query — sin Cloud Functions todavía, para quedarte en plan Spark sin tarjeta asociada
- [x] Alertas sonoras/vibración al finalizar el descanso

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
