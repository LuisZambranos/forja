
export interface StreakInfo {
  days: number;
  level: StreakLevel;
  message: string;
  subMessage: string;
  color: string;
  glowColor: string;
  emoji: string;
  trainedToday: boolean;
}

export type StreakLevel =
  | 'none'
  | 'week'        // 1-6 días
  | 'twoWeeks'    // 7-13 días
  | 'month'       // 14-29 días
  | 'twoMonths'   // 30-59 días
  | 'threeMonths' // 60-89 días
  | 'sixMonths'   // 90-179 días
  | 'year'        // 180-364 días
  | 'twoYears'    // 365-729 días
  | 'legend';     // 730+ días

export function calculateStreakStatus(
  cachedStreak: number,
  lastWorkoutDate: string
): StreakInfo {
  if (!cachedStreak || !lastWorkoutDate) {
    return buildResult(0, false);
  }

  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  const trainedToday = lastWorkoutDate === todayStr;
  
  // If last workout was today or yesterday, the streak is alive.
  // Otherwise, it's broken and visually we show 0.
  const isAlive = trainedToday || lastWorkoutDate === yesterdayStr;
  const activeStreak = isAlive ? cachedStreak : 0;

  return buildResult(activeStreak, trainedToday);
}

export function buildResult(days: number, trainedToday: boolean): StreakInfo {
  if (days === 0) {
    return {
      days,
      level: 'none',
      message: '¡Comienza hoy!',
      subMessage: 'Tu racha está esperando',
      color: 'text-text-muted',
      glowColor: 'shadow-surface',
      emoji: '💤',
      trainedToday,
    };
  }
  if (days < 7) {
    return {
      days,
      level: 'week',
      message: '¡Calentando motores!',
      subMessage: `${days} día${days > 1 ? 's' : ''} de racha`,
      color: 'text-orange-400',
      glowColor: 'shadow-orange-400/30',
      emoji: '🔥',
      trainedToday,
    };
  }
  if (days < 14) {
    return {
      days,
      level: 'twoWeeks',
      message: '¡Una semana cumplida!',
      subMessage: `${days} días — el hábito se forma`,
      color: 'text-orange-400',
      glowColor: 'shadow-orange-400/40',
      emoji: '🔥',
      trainedToday,
    };
  }
  if (days < 30) {
    return {
      days,
      level: 'month',
      message: '¡Dos semanas de hierro!',
      subMessage: `${days} días — tu cuerpo ya nota la diferencia`,
      color: 'text-amber-400',
      glowColor: 'shadow-amber-400/40',
      emoji: '💪',
      trainedToday,
    };
  }
  if (days < 60) {
    return {
      days,
      level: 'twoMonths',
      message: '¡Un mes de dedicación!',
      subMessage: `${days} días — bienvenido al siguiente nivel`,
      color: 'text-amber-300',
      glowColor: 'shadow-amber-300/40',
      emoji: '⚡',
      trainedToday,
    };
  }
  if (days < 90) {
    return {
      days,
      level: 'threeMonths',
      message: '¡Dos meses imparable!',
      subMessage: `${days} días — el cambio es visible`,
      color: 'text-yellow-400',
      glowColor: 'shadow-yellow-400/40',
      emoji: '🏆',
      trainedToday,
    };
  }
  if (days < 180) {
    return {
      days,
      level: 'sixMonths',
      message: '¡Tres meses de élite!',
      subMessage: `${days} días — perteneces a otro mundo`,
      color: 'text-yellow-300',
      glowColor: 'shadow-yellow-300/50',
      emoji: '🥇',
      trainedToday,
    };
  }
  if (days < 365) {
    return {
      days,
      level: 'year',
      message: '¡Medio año de guerrero!',
      subMessage: `${days} días — transformación completa`,
      color: 'text-purple-400',
      glowColor: 'shadow-purple-400/50',
      emoji: '👑',
      trainedToday,
    };
  }
  if (days < 730) {
    return {
      days,
      level: 'twoYears',
      message: '¡Un año de leyenda!',
      subMessage: `${days} días — eres un atleta de verdad`,
      color: 'text-purple-300',
      glowColor: 'shadow-purple-300/60',
      emoji: '🦅',
      trainedToday,
    };
  }
  return {
    days,
    level: 'legend',
    message: '¡LEYENDA VIVIENTE!',
    subMessage: `${days} días — el hierro te reconoce`,
    color: 'text-white',
    glowColor: 'shadow-purple-500/70',
    emoji: '⚜️',
    trainedToday,
  };
}
