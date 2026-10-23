import React, { useEffect, useRef } from 'react';
import { JarvisState } from '../types/jarvis';
import { soundEffects } from '../services/soundEffects';

interface ArcReactorProps {
  state: JarvisState;
  isListening: boolean;
  isSpeaking: boolean;
  onCoreTap?: () => void;
  size?: number;
}

export const ArcReactor: React.FC<ArcReactorProps> = ({
  state,
  isListening,
  isSpeaking,
  onCoreTap,
  size = 280,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rotationAngle = 0;
    let pulsePhase = 0;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const cx = width / 2;
      const cy = height / 2;
      const baseRadius = width * 0.42;

      ctx.clearRect(0, 0, width, height);

      // Speed depends on state
      let speed = 0.008;
      if (state === 'analyzing') speed = 0.035;
      else if (isListening) speed = 0.025;
      else if (isSpeaking) speed = 0.02;

      rotationAngle += speed;
      pulsePhase += 0.04;

      // Color scheme based on state
      let primaryColor = '#00f0ff'; // Cyan
      let secondaryColor = '#38bdf8';
      let glowColor = 'rgba(0, 240, 255, ';

      if (state === 'alert') {
        primaryColor = '#ef4444';
        secondaryColor = '#f97316';
        glowColor = 'rgba(239, 68, 68, ';
      } else if (state === 'analyzing') {
        primaryColor = '#f59e0b';
        secondaryColor = '#fbbf24';
        glowColor = 'rgba(245, 158, 11, ';
      } else if (isListening) {
        primaryColor = '#38bdf8';
        secondaryColor = '#ffffff';
        glowColor = 'rgba(56, 189, 248, ';
      } else if (isSpeaking) {
        primaryColor = '#06b6d4';
        secondaryColor = '#22d3ee';
        glowColor = 'rgba(6, 182, 212, ';
      }

      const pulseScale = isSpeaking || isListening 
        ? 1 + Math.sin(pulsePhase * 2.5) * 0.08 
        : 1 + Math.sin(pulsePhase) * 0.03;

      // --- 1. Background Ambient Glow ---
      const ambientGrad = ctx.createRadialGradient(cx, cy, 10, cx, cy, baseRadius * 1.25);
      ambientGrad.addColorStop(0, `${glowColor}0.35)`);
      ambientGrad.addColorStop(0.5, `${glowColor}0.12)`);
      ambientGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = ambientGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 1.25, 0, Math.PI * 2);
      ctx.fill();

      // --- 2. Outer Segmented Tachometer Ring ---
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotationAngle);
      const outerSegments = 36;
      for (let i = 0; i < outerSegments; i++) {
        const angle = (i * 2 * Math.PI) / outerSegments;
        const isMajor = i % 3 === 0;
        const segLen = isMajor ? 12 : 6;
        const r1 = baseRadius - segLen;
        const r2 = baseRadius;

        ctx.strokeStyle = isMajor ? primaryColor : `${glowColor}0.4)`;
        ctx.lineWidth = isMajor ? 2.5 : 1.2;
        ctx.beginPath();
        ctx.moveTo(r1 * Math.cos(angle), r1 * Math.sin(angle));
        ctx.lineTo(r2 * Math.cos(angle), r2 * Math.sin(angle));
        ctx.stroke();
      }
      ctx.restore();

      // --- 3. Outer Circular Boundary ---
      ctx.strokeStyle = `${glowColor}0.5)`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 0.88, 0, Math.PI * 2);
      ctx.stroke();

      // --- 4. Counter-rotating Intermediate Ring with Tech Brackets ---
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-rotationAngle * 1.2);
      const bracketCount = 8;
      for (let i = 0; i < bracketCount; i++) {
        const startAng = (i * 2 * Math.PI) / bracketCount;
        const endAng = startAng + Math.PI / bracketCount * 0.65;

        ctx.strokeStyle = secondaryColor;
        ctx.lineWidth = 3.5;
        ctx.beginPath();
        ctx.arc(0, 0, baseRadius * 0.76, startAng, endAng);
        ctx.stroke();

        // Small node on end
        const nodeX = baseRadius * 0.76 * Math.cos(endAng);
        const nodeY = baseRadius * 0.76 * Math.sin(endAng);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, 2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // --- 5. Middle Triangular Coil Segments (The Palladium Coils) ---
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(rotationAngle * 0.6);
      const coilCount = 10;
      for (let i = 0; i < coilCount; i++) {
        const coilAngle = (i * 2 * Math.PI) / coilCount;
        ctx.save();
        ctx.rotate(coilAngle);
        ctx.translate(0, -baseRadius * 0.55);

        // Coil box
        ctx.fillStyle = 'rgba(8, 20, 36, 0.85)';
        ctx.strokeStyle = primaryColor;
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.rect(-10, -7, 20, 14);
        ctx.fill();
        ctx.stroke();

        // Copper filament wire
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-6, -7);
        ctx.lineTo(-6, 7);
        ctx.moveTo(0, -7);
        ctx.lineTo(0, 7);
        ctx.moveTo(6, -7);
        ctx.lineTo(6, 7);
        ctx.stroke();

        ctx.restore();
      }
      ctx.restore();

      // --- 6. Inner Core Ring ---
      const innerRadius = baseRadius * 0.38 * pulseScale;
      ctx.strokeStyle = primaryColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, innerRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Inner tick marks
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(-rotationAngle * 2);
      for (let i = 0; i < 16; i++) {
        const a = (i * 2 * Math.PI) / 16;
        ctx.strokeStyle = `${glowColor}0.7)`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(innerRadius * 0.82 * Math.cos(a), innerRadius * 0.82 * Math.sin(a));
        ctx.lineTo(innerRadius * Math.cos(a), innerRadius * Math.sin(a));
        ctx.stroke();
      }
      ctx.restore();

      // --- 7. Central Singular Light Core ---
      const coreGrad = ctx.createRadialGradient(cx, cy, 2, cx, cy, innerRadius * 0.75);
      coreGrad.addColorStop(0, '#ffffff');
      coreGrad.addColorStop(0.3, primaryColor);
      coreGrad.addColorStop(0.8, `${glowColor}0.5)`);
      coreGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');

      ctx.fillStyle = coreGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, innerRadius * 0.75, 0, Math.PI * 2);
      ctx.fill();

      // Central Stark insignia / micro-core
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(cx, cy, 4 * pulseScale, 0, Math.PI * 2);
      ctx.fill();

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [state, isListening, isSpeaking]);

  const handleTap = () => {
    soundEffects.playReactorPulse();
    onCoreTap?.();
  };

  return (
    <div
      onClick={handleTap}
      className="relative flex items-center justify-center cursor-pointer group select-none transition-transform active:scale-95"
      style={{ width: size, height: size }}
      title="Arc Reactor Core (Tap to trigger reactor pulse or toggle speech)"
    >
      <canvas
        ref={canvasRef}
        width={size * 2}
        height={size * 2}
        style={{ width: size, height: size }}
        className="drop-shadow-[0_0_35px_rgba(0,240,255,0.35)]"
      />

      {/* Holographic state overlay text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="font-mono text-[9px] tracking-[0.25em] uppercase text-cyan-400/70 font-semibold mt-24 group-hover:text-cyan-300 transition-colors">
          {isListening ? 'VOICE INTAKE' : isSpeaking ? 'VOCAL SYNTH' : state === 'analyzing' ? 'REASONING' : 'MK-LXXXV CORE'}
        </span>
      </div>
    </div>
  );
};
