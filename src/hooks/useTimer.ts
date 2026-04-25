import { useEffect, useState } from 'react';

export function useTimer(startedAt: string | null): string {
  const [elapsed, setElapsed] = useState('0:00');

  useEffect(() => {
    if (!startedAt) {
      setElapsed('0:00');
      return;
    }

    function tick() {
      const diff = Math.max(0, Math.floor((Date.now() - new Date(startedAt!).getTime()) / 1000));
      const hrs = Math.floor(diff / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      const secs = diff % 60;
      const pad = (n: number) => String(n).padStart(2, '0');
      setElapsed(hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${mins}:${pad(secs)}`);
    }

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startedAt]);

  return elapsed;
}
