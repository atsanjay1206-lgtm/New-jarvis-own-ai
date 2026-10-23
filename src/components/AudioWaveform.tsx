import React, { useEffect, useState } from 'react';

interface AudioWaveformProps {
  isActive: boolean;
  isSpeaking: boolean;
  isListening: boolean;
  barCount?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isActive,
  isSpeaking,
  isListening,
  barCount = 24,
}) => {
  const [heights, setHeights] = useState<number[]>(() =>
    Array.from({ length: barCount }, () => 8)
  );

  useEffect(() => {
    let animId: number;

    const updateBars = () => {
      setHeights(prev =>
        prev.map((_, i) => {
          if (isListening) {
            // High dynamic jitter for listening
            const centerFactor = 1 - Math.abs(i - barCount / 2) / (barCount / 2);
            return Math.max(6, Math.floor(Math.random() * 32 * centerFactor + 6));
          } else if (isSpeaking) {
            // Harmonic wave rhythm for speech
            const time = Date.now() / 150;
            const wave = Math.sin(time + i * 0.4) * 0.5 + 0.5;
            return Math.max(6, Math.floor(wave * 28 + 6));
          } else if (isActive) {
            // Calm idle fluctuation
            const time = Date.now() / 400;
            const subtle = Math.sin(time + i * 0.2) * 4 + 8;
            return Math.max(4, Math.floor(subtle));
          }
          return 4;
        })
      );
      animId = requestAnimationFrame(updateBars);
    };

    animId = requestAnimationFrame(updateBars);
    return () => cancelAnimationFrame(animId);
  }, [isActive, isSpeaking, isListening, barCount]);

  const getBarColor = (index: number) => {
    if (isListening) return 'bg-sky-400 shadow-[0_0_8px_#38bdf8]';
    if (isSpeaking) return 'bg-cyan-400 shadow-[0_0_8px_#06b6d4]';
    return 'bg-cyan-900/60';
  };

  return (
    <div className="flex items-center justify-center gap-1 h-10 px-4 py-2 select-none">
      {heights.map((h, idx) => (
        <div
          key={idx}
          className={`w-[2.5px] rounded-full transition-all duration-75 ${getBarColor(idx)}`}
          style={{ height: `${h}px` }}
        />
      ))}
    </div>
  );
};
