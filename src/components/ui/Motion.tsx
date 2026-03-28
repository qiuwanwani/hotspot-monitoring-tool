'use client';

import { ReactNode, useRef, useState, useEffect } from 'react';

interface MovingBorderProps {
  children: ReactNode;
  duration?: number;
  className?: string;
  containerClassName?: string;
  borderClassName?: string;
}

export function MovingBorder({
  children,
  duration = 2000,
  className = '',
  containerClassName = '',
  borderClassName = '',
}: MovingBorderProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationId: number;
    let startTime: number;

    const animate = (time: number) => {
      if (!startTime) startTime = time;
      const progress = (time - startTime) % duration;
      const angle = (progress / duration) * Math.PI * 2;

      const rect = container.getBoundingClientRect();
      const x = Math.cos(angle) * 0.5 + 0.5;
      const y = Math.sin(angle) * 0.5 + 0.5;

      setPosition({ x, y });
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationId);
  }, [duration]);

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-xl ${containerClassName}`}
    >
      <div
        className={`absolute inset-0 ${borderClassName}`}
        style={{
          background: `radial-gradient(circle at ${position.x * 100}% ${position.y * 100}%, var(--primary-glow) 0%, transparent 50%)`,
        }}
      />
      <div className={`relative z-10 ${className}`}>{children}</div>
    </div>
  );
}

export function GlowCard({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePosition({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      className={`relative overflow-hidden rounded-xl bg-card border border-border transition-all duration-300 hover:border-primary/30 ${className}`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(400px circle at ${mousePosition.x}px ${mousePosition.y}px, var(--primary-glow), transparent 40%)`,
        }}
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function Spotlight({
  className = '',
  fill = 'white',
}: {
  className?: string;
  fill?: string;
}) {
  return (
    <svg
      className={`absolute pointer-events-none ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 3787 2842"
      fill="none"
    >
      <g filter="url(#filter)">
        <ellipse
          cx="1924.71"
          cy="273.501"
          rx="1924.71"
          ry="273.501"
          transform="matrix(-0.822377 -0.568943 -0.568943 0.822377 3631.88 2291.09)"
          fill={fill}
          fillOpacity="0.21"
        />
      </g>
      <defs>
        <filter
          id="filter"
          x="0.860352"
          y="0.838989"
          width="3785.16"
          height="2840.26"
          filterUnits="userSpaceOnUse"
          colorInterpolationFilters="sRGB"
        >
          <feFlood floodOpacity="0" result="BackgroundImageFix" />
          <feBlend mode="normal" in="SourceGraphic" in2="BackgroundImageFix" result="shape" />
          <feGaussianBlur stdDeviation="151" result="effect1_foregroundBlur_1065_8" />
        </filter>
      </defs>
    </svg>
  );
}

export function TextReveal({
  text,
  className = '',
}: {
  text: string;
  className?: string;
}) {
  const words = text.split(' ');

  return (
    <div className={`flex flex-wrap gap-x-2 ${className}`}>
      {words.map((word, idx) => (
        <span
          key={idx}
          className="animate-fade-in opacity-0"
          style={{ animationDelay: `${idx * 100}ms`, animationFillMode: 'forwards' }}
        >
          {word}
        </span>
      ))}
    </div>
  );
}

export function BackgroundBeams({ className = '' }: { className?: string }) {
  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-secondary/10 rounded-full blur-3xl" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent-green/5 rounded-full blur-3xl" />
    </div>
  );
}

export function AnimatedGradientText({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-block animate-gradient bg-gradient-to-r from-primary via-secondary to-accent-green bg-clip-text text-transparent bg-[length:200%_auto] ${className}`}
    >
      {children}
    </span>
  );
}

export function PulsingDot({ className = '' }: { className?: string }) {
  return (
    <span className={`relative flex h-3 w-3 ${className}`}>
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-green opacity-75" />
      <span className="relative inline-flex rounded-full h-3 w-3 bg-accent-green" />
    </span>
  );
}

export function ShimmerButton({
  children,
  className = '',
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative overflow-hidden rounded-lg bg-primary/10 border border-primary/30 px-4 py-2 text-primary transition-all duration-300 hover:bg-primary/20 hover:border-primary/50 hover:shadow-glow-primary ${className}`}
    >
      <div className="absolute inset-0 shimmer" />
      <span className="relative z-10">{children}</span>
    </button>
  );
}
