'use client';
import React, { useEffect, useState, useRef } from 'react';

interface CounterProps {
  end: number;
  duration?: number;
  suffix?: string;
  prefix?: string;
  className?: string;
  decimals?: number;
}

const Counter: React.FC<CounterProps> = ({ 
  end, 
  duration = 2000, 
  suffix = '', 
  prefix = '', 
  className = '',
  decimals = 0
}) => {
  const [count, setCount] = useState(0);
  const countRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  // Auto-detect decimals if not provided but end has them
  const actualDecimals = decimals || (end % 1 !== 0 ? 1 : 0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (countRef.current) {
      observer.observe(countRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;

    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      const easeOut = (x: number): number => {
        return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
      };

      const currentVal = easeOut(percentage) * end;
      setCount(currentVal);

      if (progress < duration) {
        animationFrame = requestAnimationFrame(animate);
      } else {
        setCount(end);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);
  }, [end, duration, isVisible]);

  // Format number
  const formattedCount = count.toLocaleString('fr-CA', {
    minimumFractionDigits: actualDecimals,
    maximumFractionDigits: actualDecimals,
  });

  return (
    <div ref={countRef} className={`font-bold tabular-nums ${className}`}>
      {prefix}{formattedCount}{suffix}
    </div>
  );
};

export default Counter;