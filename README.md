# Forja — Registro de Entrenamiento

App web progresiva (PWA) para registrar entrenamientos de gimnasio en tiempo real: series, pesos, repeticiones, temporizador de descanso y progreso histórico. Diseñada mobile-first, para usarse con una mano y en modo oscuro, en pleno gimnasio.

> **Nombre de trabajo.** Ver [Sobre el nombre](#sobre-el-nombre) antes de registrar marca o dominio en firme.

## Stack

| Capa | Tecnología | Por qué |
|---|---|---|
| UI | React 19 + Vite | Arranque rápido, sin overhead de SSR (app autenticada, no indexable) |
| Estilos | Tailwind CSS v4 | Design tokens vía `@theme` → variables CSS nativas, cero color hardcodeado |
| Iconos | lucide-react | Liviano, tree-shakeable, set consistente |
| Estado global | Zustand | Suscripción por selector: solo re-renderiza quien lee ese slice (clave para el timer, que cambia cada segundo) |
| Datos remotos | TanStack Query + Firebase SDK | Cache, dedupe y `staleTime` sobre las lecturas a Firestore |
| Backend | Firebase (Auth, Firestore, Storage) | Plan Spark (gratis) cubre todo el MVP, sin tarjeta asociada |
| Hosting | Vercel | Deploy continuo desde GitHub, plan gratuito |

## Principios de rendimiento y costo

Léelo antes de tocar Firestore — es la diferencia entre una app que escala gratis y una que factura por gastar mal las lecturas.

1. **`onSnapshot` es la excepción, no la regla.** Solo la sesión de entrenamiento activa usa un listener en tiempo real. Historial, catálogo de ejercicios y rutinas se leen con `getDocs` y se cachean con TanStack Query.
2. **El catálogo de ejercicios casi no cambia.** Se cachea con `staleTime` largo (horas). No hay razón para volver a pedirlo en cada pantalla.
3. **Nunca se escribe en Firestore por cada tecla.** Se escribe una vez por serie confirmada, y la sesión completa se persiste con una sola escritura por lote (`writeBatch`) al finalizar.
4. **Sin agregaciones en el cliente.** Nada de traer todas las sesiones y sumar en el navegador para el dashboard. Ver `user_stats` más abajo — y ojo con el matiz de plan Blaze.
5. **Reglas de seguridad desde el día 1**, nunca "las agrego después". Un Firestore en modo test es una base de datos pública.
6. **Todo query compuesto necesita su índice.** Se versiona `firestore.indexes.json` junto con el código, no se deja para que Firestore lo pida en producción.

## Paleta de color

Morado + naranja neón sobre negro profundo (no gris). Se descartó ámbar/negro por asociarse directamente con Smartfit en Chile, y verde neón/negro por chocar semánticamente con `--color-success` (el verde de "PR logrado" se diluye si es también el color de marca). El morado no compite con ningún color de estado (éxito/advertencia/error quedan libres), es el menos usado en este rubro, y conecta con el nombre de la pantalla central ("Modo Focus").

```css
@theme {
  --color-bg: #09070F;
  --color-surface: #15101F;
  --color-surface-alt: #1E1830;
  --color-border: #2E2645;
  --color-text: #F5F3FA;
  --color-text-muted: #9C93B5;
  --color-primary: #8B5CF6;       /* marca: nav, headers, bordes, focus rings */
  --color-primary-hover: #A78BFA;
  --color-highlight: #FF6B00;     /* uso reservado: CTA principal, PR, timer activo */
  --color-highlight-hover: #FF8A33;
  --color-success: #2FBF71;
  --color-warning: #F5B942;
  --color-danger: #F5473E;
}
```

Regla de uso: negro domina el fondo, morado es el color estructural, naranja se reserva para lo que exige atención (botón de finalizar, timer activo, festejo de PR). Si aparece en todos lados, pierde el efecto.

## Colecciones de Firestore

- **`users/{uid}`** — perfil, rol, racha, configuración (timer automático, etc).
- **`exercises/{id}`** — `name`, `muscle_group`, `equipment`, `owner_id` (null si es global), `is_global`. Lectura si `is_global == true` o `owner_id == uid`; escritura solo si `owner_id == uid`. Los ejercicios globales (~35 iniciales) se cargan una sola vez vía `scripts/seed-exercises.mjs` con `firebase-admin` — nunca se crean desde el cliente.
- **`routines/{id}`** — `owner_id`, `name`, `exercises[]` (con series objetivo y descanso), `is_public`.
- **`workout_sessions/{id}`** — `owner_id`, `date`, `duration`, `sets[]` (ejercicio, peso, reps, tipo de serie).
- **`user_stats/{uid}`** *(Fase 1+)* — agregados pre-calculados (volumen semanal, 1RM por ejercicio). En Fase 0/1 se calcula en el cliente y se cachea; recién en Fase 3 se evalúa mover a una Cloud Function (requiere plan Blaze).

## Estructura de carpetas

```
src/
  shared/            # sin imports de React/DOM — reutilizable en React Native (Fase 4)
    types/
    utils/
    firebase/        # config y helpers de Firestore puros
  features/
    auth/
    exercises/
    routines/
    workout/         # Modo Focus, timer, registro de series
    dashboard/
  hooks/             # useWorkout, useAuth, useRestTimer, useWakeLock...
  store/             # slices de Zustand
  components/ui/     # botones, inputs — sin lógica de negocio
  index.css          # @theme de Tailwind v4 — única fuente de colores
```

## Sobre el nombre

"Forja" quedó como nombre de trabajo tras descartar el resto: `RepLog` y `NexSet` ya existen como apps de entrenamiento publicadas (colisión directa en tiendas), y `Kinex` está muy cerca de KINEXON, una empresa real de analítica deportiva. "Forja" no tuvo colisión directa como app individual, aunque sí hay gimnasios físicos con nombres parecidos — conviene una verificación rápida en INAPI (marcas Chile) y en la tienda de apps antes de comprometerte con el nombre para lanzamiento público. No bloquea usarla hoy. El nombre encaja bien con la paleta morado/naranja: la idea de "forjar" combina con negro profundo + acentos intensos.

## Scripts

```
npm run dev
npm run build
npm run preview
```

## Roadmap

Ver [ROADMAP.md](./ROADMAP.md)
