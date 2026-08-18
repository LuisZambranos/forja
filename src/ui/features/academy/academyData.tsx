import { Activity, Brain, Flame, Wind, Dumbbell, Zap, BedDouble, AlertTriangle } from 'lucide-react';
import React from 'react';

export type CategoryId = 'biomechanics' | 'recovery' | 'mindset' | 'nutrition';

export interface AcademyCategory {
  id: CategoryId;
  title: string;
  subtitle: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  borderClass: string;
}

export interface AcademyCard {
  id: string;
  categoryId: CategoryId;
  title: string;
  icon: React.ElementType;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  content: React.ReactNode;
}

export const ACADEMY_CATEGORIES: AcademyCategory[] = [
  {
    id: 'biomechanics',
    title: 'Técnica y Biomecánica',
    subtitle: 'La ciencia del movimiento perfecto',
    icon: Dumbbell,
    colorClass: 'text-orange-500',
    bgClass: 'bg-orange-500/20',
    borderClass: 'border-orange-500/30'
  },
  {
    id: 'mindset',
    title: 'Ciencia y Mentalidad',
    subtitle: 'Conexión mente-músculo y enfoque',
    icon: Brain,
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-500/20',
    borderClass: 'border-purple-500/30'
  },
  {
    id: 'recovery',
    title: 'Recuperación y Cuerpo',
    subtitle: 'El crecimiento ocurre cuando descansas',
    icon: BedDouble,
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-500/20',
    borderClass: 'border-blue-500/30'
  },
  {
    id: 'nutrition',
    title: 'Mitos y Realidades',
    subtitle: 'Desmintiendo falsas creencias',
    icon: Zap,
    colorClass: 'text-yellow-400',
    bgClass: 'bg-yellow-500/20',
    borderClass: 'border-yellow-500/30'
  }
];

export const ACADEMY_CARDS: AcademyCard[] = [
  // ── BIOMECÁNICA ──
  {
    id: 'rom',
    categoryId: 'biomechanics',
    title: 'Rango de Movimiento (ROM): El estiramiento mágico',
    icon: Activity,
    colorClass: 'text-orange-500',
    bgClass: 'bg-orange-500/20',
    borderClass: 'border-orange-500/30',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-text-muted leading-relaxed">
          La hipertrofia ocurre mayormente cuando el músculo se estira bajo carga (fase excéntrica). Bajar a la mitad en una sentadilla o un press es robarte las ganancias.
        </p>
        <p className="text-sm text-text-muted leading-relaxed">
          <strong className="text-text">Cada cuerpo es un mundo:</strong> Aunque la ciencia diga que el press en máquina es "óptimo", si a ti te duele el hombro, no es óptimo para ti. Encuentra la variante y el rango donde sientas el músculo trabajar sin dolor articular.
        </p>
      </div>
    )
  },
  {
    id: 'momentum',
    categoryId: 'biomechanics',
    title: 'El Momentum (Impulso): ¿Cuándo es válido?',
    icon: Wind,
    colorClass: 'text-orange-400',
    bgClass: 'bg-orange-500/20',
    borderClass: 'border-orange-500/30',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-text-muted leading-relaxed">
          Hacer trampa moviendo la espalda está mal, <strong>salvo</strong> en las últimas 2 repeticiones (cuando ya llegaste al fallo estricto).
        </p>
        <p className="text-sm text-text-muted leading-relaxed">
          Un ligero impulso ("Cheat reps") es una técnica avanzada válida para exprimir el músculo un poco más, <strong className="text-red-400">pero sin exagerar por riesgo a lesión</strong>. Nunca sacrifiques tu columna por levantar el ego.
        </p>
      </div>
    )
  },
  {
    id: 'breathing',
    categoryId: 'biomechanics',
    title: 'Respira y Relájate',
    icon: Wind,
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-500/20',
    borderClass: 'border-blue-500/30',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-text-muted leading-relaxed">
          Descansar correctamente entre series y respirar bien durante el ejercicio multiplica tu fuerza y resistencia.
        </p>
        <div className="bg-bg/50 p-4 rounded-2xl border border-border/50 mt-2">
          <p className="text-[11px] uppercase tracking-widest font-black text-primary mb-1">Regla de Oxígeno</p>
          <ul className="space-y-2">
            <li className="flex gap-2 items-start">
              <span className="text-primary font-bold">1.</span>
              <p className="text-xs text-text-muted"><strong>Inhala</strong> profundo mientras bajas o sueltas el peso (fase excéntrica).</p>
            </li>
            <li className="flex gap-2 items-start">
              <span className="text-primary font-bold">2.</span>
              <p className="text-xs text-text-muted"><strong>Exhala</strong> o bota el aire con fuerza en el momento en que haces la mayor fuerza (fase concéntrica).</p>
            </li>
          </ul>
        </div>
      </div>
    )
  },

  // ── MINDSET Y CIENCIA ──
  {
    id: 'rpe_scale',
    categoryId: 'mindset',
    title: 'La Escala RPE: Fallo Real vs Falso',
    icon: Activity,
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-500/20',
    borderClass: 'border-purple-500/30',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-text-muted leading-relaxed">
          <strong className="text-text">¿Haces 15 repeticiones y no sientes nada?</strong> Eso es fallo falso. Tu cuerpo se rindió mentalmente, pero el músculo ni se enteró.
        </p>
        <p className="text-sm text-text-muted leading-relaxed">
          El verdadero RPE 8-10 se siente cuando la velocidad de la barra baja drásticamente por más que intentes empujar rápido.
        </p>
        <div className="bg-bg/50 p-4 rounded-2xl border border-border/50 mt-2">
          <p className="text-[11px] uppercase tracking-widest font-black text-primary mb-1">Tip de Oro</p>
          <p className="text-xs text-text-muted">Si terminas la serie y puedes agarrar tu celular inmediatamente sin temblar... pudiste hacer 5 repeticiones más.</p>
        </div>
      </div>
    )
  },
  {
    id: 'mind_muscle',
    categoryId: 'mindset',
    title: 'Conexión Mente-Músculo',
    icon: Brain,
    colorClass: 'text-purple-400',
    bgClass: 'bg-purple-500/20',
    borderClass: 'border-purple-500/30',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-text-muted leading-relaxed">
          Mover peso del punto A al punto B no sirve de nada si usas los músculos equivocados. Si te duele el cuello haciendo press de banca, estás compensando.
        </p>
        <p className="text-sm text-text-muted leading-relaxed">
          <strong>Solución:</strong> Baja el peso un 20%. Tómate 3 segundos para bajar la pesa, haz una pausa de 1 segundo abajo, y concéntrate exclusivamente en el músculo objetivo antes de subir.
        </p>
      </div>
    )
  },

  // ── RECUPERACIÓN ──
  {
    id: 'joint_pain',
    categoryId: 'recovery',
    title: 'Dolor Muscular vs Dolor Articular',
    icon: AlertTriangle,
    colorClass: 'text-red-500',
    bgClass: 'bg-red-500/20',
    borderClass: 'border-red-500/30',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-text-muted leading-relaxed">
          Aprender a diferenciar estos dos tipos de dolor te salvará de meses de rehabilitación.
        </p>
        <ul className="space-y-2 mt-2">
          <li className="flex gap-2">
            <span className="text-green-500 mt-0.5">✔</span>
            <p className="text-sm text-text-muted"><strong>El músculo quema:</strong> Es un dolor sordo, amplio y que incrementa a medida que avanza la serie. Significa buen trabajo.</p>
          </li>
          <li className="flex gap-2">
            <span className="text-red-500 mt-0.5">✖</span>
            <p className="text-sm text-text-muted"><strong>La articulación pincha:</strong> Es un dolor agudo, eléctrico, como una "puntada" justo en el codo, rodilla u hombro. <strong>Para inmediatamente.</strong></p>
          </li>
        </ul>
      </div>
    )
  },
  {
    id: 'doms',
    categoryId: 'recovery',
    title: 'El Mito de las Agujetas (DOMS)',
    icon: Flame,
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-500/20',
    borderClass: 'border-blue-500/30',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-text-muted leading-relaxed">
          Mucha gente cree que si al día siguiente no les duele la vida, entrenaron mal. <strong>Esto es un mito.</strong>
        </p>
        <p className="text-sm text-text-muted leading-relaxed">
          El daño muscular y el dolor excesivo no equivalen a hipertrofia. De hecho, no es bueno llegar al fallo en todas las series. Si lo haces, no descansas el cuerpo, fatigas el sistema nervioso de más y al final es menos lo que puedes ganar y progresar.
        </p>
      </div>
    )
  },
  {
    id: 'sleep',
    categoryId: 'recovery',
    title: 'Dormir: El Esteroide Natural',
    icon: BedDouble,
    colorClass: 'text-blue-400',
    bgClass: 'bg-blue-500/20',
    borderClass: 'border-blue-500/30',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-text-muted leading-relaxed">
          En el gimnasio destruyes el músculo; en la cama lo construyes. Sin embargo, no hay una regla de 8 horas inamovible.
        </p>
        <p className="text-sm text-text-muted leading-relaxed">
          <strong className="text-text">Back to basics:</strong> A veces menos es más. Si no tienes un smartwatch que mida el sueño, tu mejor estudio son los síntomas de tu propio cuerpo. Si durmiendo 8 horas te paras fatigado, pero con 7:30h te sientes lleno de vida, pues ese es tu punto óptimo.
        </p>
      </div>
    )
  },

  // ── MITOS ──
  {
    id: 'anabolic_window',
    categoryId: 'nutrition',
    title: 'La "Ventana Anabólica" de 30 minutos',
    icon: Zap,
    colorClass: 'text-yellow-400',
    bgClass: 'bg-yellow-500/20',
    borderClass: 'border-yellow-500/30',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-text-muted leading-relaxed">
          <strong>"Tómate el batido apenas termines o pierdes músculo".</strong> Falso.
        </p>
        <p className="text-sm text-text-muted leading-relaxed">
          Quítate esa ansiedad. Tu cuerpo mantiene la síntesis proteica elevada hasta 24 horas después de entrenar. Lo que importa es la cantidad total de proteína al final del día, no si te la tomaste 5 minutos después de soltar la mancuerna.
        </p>
      </div>
    )
  }
];
