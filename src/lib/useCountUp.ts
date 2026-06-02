import { useEffect, useRef, useState } from 'react';

const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

/** Animate a number from its previous value to `target` (and from 0 on mount). */
export function useCountUp(target: number, duration = 700): number {
  const [val, setVal] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    const start = now();
    const from = fromRef.current;
    let raf: number;
    const tick = () => {
      const t = Math.min(1, (now() - start) / duration);
      const v = from + (target - from) * easeOutCubic(t);
      setVal(v);
      fromRef.current = v;
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    const settle = setTimeout(() => {
      fromRef.current = target;
      setVal(target);
    }, duration + 60);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(settle);
    };
  }, [target, duration]);

  return Math.round(val);
}
