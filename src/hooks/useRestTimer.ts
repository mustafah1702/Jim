import { useEffect, useState } from 'react';
import { useWorkoutStore } from '@/stores/workoutStore';

export function useRestTimer() {
  const restEndAt = useWorkoutStore((s) => s.restEndAt);
  const skipRestTimer = useWorkoutStore((s) => s.skipRestTimer);
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (!restEndAt) {
      setSecondsLeft(0);
      return;
    }

    function tick() {
      const remaining = Math.max(0, Math.floor((new Date(restEndAt!).getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
      if (remaining <= 0) {
        skipRestTimer();
      }
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [restEndAt, skipRestTimer]);

  const isActive = restEndAt !== null && secondsLeft > 0;

  const formatted = `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`;

  return { isActive, secondsLeft, formatted };
}
