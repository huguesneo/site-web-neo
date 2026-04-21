'use client';
import React, { useEffect, useRef, useState } from 'react';

interface SectionProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
  background?: 'white' | 'gray' | 'light' | 'dark';
  noAnimation?: boolean;
}

const Section: React.FC<SectionProps> = ({ 
  children, 
  className = '', 
  id, 
  background = 'white',
  noAnimation = false
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const bgStyles = {
    white: 'bg-white',
    gray: 'bg-gray-50',
    light: 'bg-neo-50',
    dark: 'bg-gray-900 text-white'
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Une fois visible, on laisse visible (pas de reset)
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1, // Déclenche dès que 10% de la section est visible
        rootMargin: '0px 0px -50px 0px' // Petite marge pour ne pas déclencher trop tôt en bas
      }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) observer.unobserve(sectionRef.current);
    };
  }, []);

  const animationClass = !noAnimation && isVisible ? 'animate-fade-in-up' : !noAnimation ? 'opacity-0 translate-y-8' : '';

  return (
    <section 
      id={id} 
      ref={sectionRef}
      className={`py-20 md:py-28 relative overflow-hidden transition-all duration-700 ${bgStyles[background]} ${className}`}
    >
      <div className={`container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl relative z-10 ${animationClass}`}>
        {children}
      </div>
    </section>
  );
};

export default Section;