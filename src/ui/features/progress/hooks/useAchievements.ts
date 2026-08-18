import { useMemo } from 'react';
import { useMyRoutines } from '@ui/hooks/useRoutines';
import { useWorkoutSessions } from '@ui/hooks/useWorkout';

const EIGHT_WEEKS_MS = 8 * 7 * 24 * 60 * 60 * 1000;

export function useAchievements(uid?: string) {
  const { data: routines = [], isLoading: loadingRoutines } = useMyRoutines(uid);
  const { data: sessions = [], isLoading: loadingSessions } = useWorkoutSessions(uid, EIGHT_WEEKS_MS);
  
  const isLoading = loadingRoutines || loadingSessions;

  const targetRoutineDays = useMemo(() => {
    const map = new Map<number, string[]>();
    routines.forEach(r => {
      if (r.scheduled_days) {
        r.scheduled_days.forEach(d => {
           if (!map.has(d)) map.set(d, []);
           map.get(d)!.push(r.id);
        });
      }
    });
    return map;
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
      actual: Map<string, string[]>;
      daysInMonth: Date[];
    }>();

    for (let d = new Date(startOfMonth); d <= endDate; d.setDate(d.getDate() + 1)) {
      const monday = getMonday(new Date(d));
      if (!weeksMap.has(monday)) {
        weeksMap.set(monday, { expected: 0, actual: new Map(), daysInMonth: [] });
      }
      weeksMap.get(monday)!.daysInMonth.push(new Date(d));
    }

    monthSessions.forEach(session => {
      const d = new Date(session.started_at);
      d.setHours(0, 0, 0, 0);
      const monday = getMonday(new Date(d));
      if (weeksMap.has(monday)) {
        const actualMap = weeksMap.get(monday)!.actual;
        const dateStr = d.toISOString().split('T')[0];
        if (!actualMap.has(dateStr)) actualMap.set(dateStr, []);
        actualMap.get(dateStr)!.push(session.routine_id);
      }
    });

    let totalExpected = 0;
    let totalActual = 0;
    const weeksBreakdown: { 
      label: string; 
      expected: number; 
      actual: number; 
      passed: boolean;
      days: { date: string, label: string, expected: boolean, actual: boolean, status: 'completed' | 'missed' | 'pending_today' | 'scheduled_future' | 'none' | 'recovered' }[]
    }[] = [];

    const firstWorkoutTime = firstWorkoutDate.getTime();
    let weekNum = 1;

    const sortedMondays = Array.from(weeksMap.keys()).sort((a, b) => a - b);

    sortedMondays.forEach(mondayTime => {
      const weekData = weeksMap.get(mondayTime)!;
      const sundayTime = mondayTime + 6 * 24 * 60 * 60 * 1000;
      
      if (sundayTime < firstWorkoutTime) {
         return; 
      }

      const daysDetails: typeof weeksBreakdown[0]['days'] = [];
      const todayTime = new Date().setHours(0, 0, 0, 0);

      // Paso 1: Encontrar fallos y extras en la semana para detectar "Recuperados"
      const missedRoutines: { date: string, routineId: string }[] = [];
      const extraRoutines: { date: string, routineId: string }[] = [];
      
      for (let i = 0; i < 7; i++) {
        const d = new Date(mondayTime + i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().split('T')[0];
        const isAfterFirstWorkout = d.getTime() >= firstWorkoutTime;
        
        if (!isAfterFirstWorkout) continue;

        const scheduledRoutineIds = targetRoutineDays.get(d.getDay()) || [];
        const actualRoutineIds = weekData.actual.get(dateStr) || [];
        
        // Rutinas falladas (días pasados)
        if (d.getTime() < todayTime) {
           scheduledRoutineIds.forEach(rId => {
              if (!actualRoutineIds.includes(rId)) {
                  missedRoutines.push({ date: dateStr, routineId: rId });
              }
           });
        }
        
        // Rutinas extra
        actualRoutineIds.forEach(rId => {
           if (!scheduledRoutineIds.includes(rId)) {
               extraRoutines.push({ date: dateStr, routineId: rId });
           }
        });
      }

      const recoveredDates = new Set<string>();
      
      extraRoutines.forEach(extra => {
          const missedIdx = missedRoutines.findIndex(m => m.routineId === extra.routineId);
          if (missedIdx !== -1) {
             recoveredDates.add(missedRoutines[missedIdx].date);
             missedRoutines.splice(missedIdx, 1);
          }
      });
      
      // Calcular 7 días para el modal
      for (let i = 0; i < 7; i++) {
        const d = new Date(mondayTime + i * 24 * 60 * 60 * 1000);
        const dateStr = d.toISOString().split('T')[0];
        
        const isAfterFirstWorkout = d.getTime() >= firstWorkoutTime;
        const isExpected = isAfterFirstWorkout && targetRoutineDays.has(d.getDay());
        const isActual = weekData.actual.has(dateStr);
        
        let status: 'completed' | 'missed' | 'pending_today' | 'scheduled_future' | 'none' | 'recovered' = 'none';
        if (isActual) {
           status = 'completed';
        } else if (isExpected) {
           if (d.getTime() < todayTime) {
              if (recoveredDates.has(dateStr)) {
                  status = 'recovered';
              } else {
                  status = 'missed';
              }
           } else if (d.getTime() === todayTime) {
              status = 'pending_today';
           } else {
              status = 'scheduled_future';
           }
        }
        
        const dayName = ['D','L','M','X','J','V','S'][d.getDay()];
        
        daysDetails.push({
           date: dateStr,
           label: dayName,
           expected: isExpected,
           actual: isActual,
           status
        });
      }

      let expectedForWeek = 0;
      let actualOnExpected = 0;
      let totalActualInWeek = 0;
      
      weekData.daysInMonth.forEach(day => {
        if (day.getTime() >= firstWorkoutTime) {
           const isExpectedDay = targetRoutineDays.has(day.getDay()) || targetRoutineDays.size === 0;
           const dateStr = day.toISOString().split('T')[0];
           const isDone = weekData.actual.has(dateStr);
           const isRecovered = recoveredDates.has(dateStr);
           
           if (isExpectedDay) {
              expectedForWeek++;
              if (isDone || isRecovered) actualOnExpected++;
           }
           if (isDone) totalActualInWeek++;
        }
      });

      let actualForWeek = actualOnExpected;

      if (targetRoutineDays.size === 0) {
         const validDays = weekData.daysInMonth.filter(d => d.getTime() >= firstWorkoutTime).length;
         expectedForWeek = Math.round((3 / 7) * validDays); 
         actualForWeek = totalActualInWeek;
      }
      
      if (expectedForWeek === 0 && totalActualInWeek > 0) {
        expectedForWeek = totalActualInWeek;
        actualForWeek = totalActualInWeek;
      }

      const passed = actualForWeek >= expectedForWeek;

      totalExpected += expectedForWeek;
      totalActual += Math.min(actualForWeek, expectedForWeek);

      weeksBreakdown.push({
        label: `Sem ${weekNum}`,
        expected: expectedForWeek,
        actual: actualForWeek,
        passed: passed,
        days: daysDetails
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
    targetDaysPerWeek: targetRoutineDays.size || 3,
    consistencyStats,
    isLoading
  };
}

