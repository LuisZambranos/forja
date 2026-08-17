import { useMemo } from 'react';
import { useMyRoutines } from '@ui/hooks/useRoutines';
import { useWorkoutSessions } from '@ui/hooks/useWorkout';

const EIGHT_WEEKS_MS = 8 * 7 * 24 * 60 * 60 * 1000;

export function useAchievements(uid?: string) {
  const { data: routines = [], isLoading: loadingRoutines } = useMyRoutines(uid);
  const { data: sessions = [], isLoading: loadingSessions } = useWorkoutSessions(uid, EIGHT_WEEKS_MS);
  
  const isLoading = loadingRoutines || loadingSessions;

  const targetRoutineDays = useMemo(() => {
    const uniqueDays = new Set<number>();
    routines.forEach(r => {
      if (r.scheduled_days) {
        r.scheduled_days.forEach(d => uniqueDays.add(d));
      }
    });
    return Array.from(uniqueDays);
  }, [routines]);

  const monthSessions = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    return sessions.filter(s => {
      const d = new Date(s.started_at);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });
  }, [sessions]);

  const consistencyStats = useMemo(() => {
    if (!monthSessions.length) {
      return { rate: 0, message: "¡Empieza tu mes!", weeksBreakdown: [] };
    }

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const sorted = [...monthSessions].sort((a, b) => a.started_at - b.started_at);
    const firstWorkoutDate = new Date(sorted[0].started_at);
    firstWorkoutDate.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endDate = new Date(now);
    endDate.setHours(0, 0, 0, 0);

    const getMonday = (d: Date) => {
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      const mon = new Date(d);
      mon.setDate(diff);
      mon.setHours(0, 0, 0, 0);
      return mon.getTime();
    };

    const weeksMap = new Map<number, {
      expected: number;
      actual: Set<string>;
      daysInMonth: Date[];
    }>();

    for (let d = new Date(startOfMonth); d <= endDate; d.setDate(d.getDate() + 1)) {
      const monday = getMonday(new Date(d));
      if (!weeksMap.has(monday)) {
        weeksMap.set(monday, { expected: 0, actual: new Set(), daysInMonth: [] });
      }
      weeksMap.get(monday)!.daysInMonth.push(new Date(d));
    }

    monthSessions.forEach(session => {
      const d = new Date(session.started_at);
      d.setHours(0, 0, 0, 0);
      const monday = getMonday(new Date(d));
      if (weeksMap.has(monday)) {
        weeksMap.get(monday)!.actual.add(d.toISOString().split('T')[0]);
      }
    });

    let totalExpected = 0;
    let totalActual = 0;
    const weeksBreakdown: { label: string; expected: number; actual: number; passed: boolean }[] = [];

    const firstWorkoutTime = firstWorkoutDate.getTime();
    let weekNum = 1;

    const sortedMondays = Array.from(weeksMap.keys()).sort((a, b) => a - b);

    sortedMondays.forEach(mondayTime => {
      const weekData = weeksMap.get(mondayTime)!;
      const sundayTime = mondayTime + 6 * 24 * 60 * 60 * 1000;
      
      if (sundayTime < firstWorkoutTime) {
         return; 
      }

      let expectedForWeek = 0;
      
      weekData.daysInMonth.forEach(day => {
        if (day.getTime() >= firstWorkoutTime) {
           if (targetRoutineDays.includes(day.getDay()) || targetRoutineDays.length === 0) {
              expectedForWeek++;
           }
        }
      });

      if (targetRoutineDays.length === 0) {
         const validDays = weekData.daysInMonth.filter(d => d.getTime() >= firstWorkoutTime).length;
         expectedForWeek = Math.round((3 / 7) * validDays); 
      }

      const actualForWeek = weekData.actual.size;
      
      if (expectedForWeek === 0 && actualForWeek > 0) expectedForWeek = actualForWeek;

      const passed = actualForWeek >= expectedForWeek;

      totalExpected += expectedForWeek;
      totalActual += Math.min(actualForWeek, expectedForWeek);

      weeksBreakdown.push({
        label: `Sem ${weekNum}`,
        expected: expectedForWeek,
        actual: actualForWeek,
        passed: passed
      });

      weekNum++;
    });

    const rate = totalExpected > 0 ? Math.round((totalActual / totalExpected) * 100) : 100;

    let message = "Construyendo el hábito";
    if (rate >= 90) message = "¡Máquina imparable!";
    else if (rate >= 75) message = "¡Excelente consistencia!";
    else if (rate >= 50) message = "Vas por buen camino";
    else message = "¡Retoma el ritmo, tú puedes!";

    return { rate, message, weeksBreakdown };
  }, [monthSessions, targetRoutineDays]);

  return {
    targetDaysPerWeek: targetRoutineDays.length || 3,
    consistencyStats,
    isLoading
  };
}

