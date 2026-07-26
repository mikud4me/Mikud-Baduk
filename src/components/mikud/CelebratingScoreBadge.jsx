import React from 'react';
import { motion } from 'framer-motion';
import { Sparkle } from 'lucide-react';

const PARTICLES = [
  { angle: -100, distance: 40, size: 12, delay: 0.56, color: '#0153F4' },
  { angle: -55, distance: 48, size: 9, delay: 0.68, color: '#F5B700' },
  { angle: -15, distance: 42, size: 11, delay: 0.6, color: '#0153F4' },
  { angle: 30, distance: 46, size: 8, delay: 0.8, color: '#F5B700' },
  { angle: 80, distance: 40, size: 10, delay: 0.72, color: '#0153F4' },
  { angle: 130, distance: 44, size: 9, delay: 0.64, color: '#F5B700' },
  { angle: 175, distance: 40, size: 11, delay: 0.88, color: '#0153F4' },
  { angle: -140, distance: 46, size: 8, delay: 0.76, color: '#F5B700' },
];

export default function CelebratingScoreBadge({ score, bgClassName = 'bg-white', textClassName = '' }) {
  const celebrate = score >= 85;

  return (
    <div className="relative flex-shrink-0 w-16 h-16">
      <motion.div
        className="relative w-16 h-16"
        initial={celebrate ? { scale: 0.3, rotate: 0 } : false}
        animate={celebrate ? { scale: [0.3, 1.2, 0.9, 1.06, 0.98, 1], rotate: [0, -12, 10, -6, 4, 0] } : {}}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      >
        {/* עיגול הרקע — שכבה תחתונה */}
        <div className={`absolute inset-0 rounded-full ${bgClassName}`} />

        {/* ניצוצות — מעל העיגול, מתחת למספר */}
        {celebrate && PARTICLES.map((p, i) => {
          const rad = (p.angle * Math.PI) / 180;
          const x = Math.cos(rad) * p.distance;
          const y = Math.sin(rad) * p.distance;
          return (
            <motion.span
              key={i}
              className="absolute top-1/2 left-1/2 flex items-center justify-center"
              style={{ width: p.size, height: p.size, marginLeft: -p.size / 2, marginTop: -p.size / 2 }}
              initial={{ opacity: 0, x: 0, y: 0, scale: 0, rotate: 0 }}
              animate={{ opacity: [0, 1, 0], x: [0, x], y: [0, y], scale: [0, 1, 0.4], rotate: 90 }}
              transition={{ duration: 1.6, delay: p.delay, ease: 'easeOut' }}
            >
              <Sparkle size={p.size} fill={p.color} color={p.color} />
            </motion.span>
          );
        })}

        {/* המספר — שכבה עליונה */}
        <div className={`relative w-full h-full flex items-center justify-center font-semibold text-xl ${textClassName}`}>
          {score}
        </div>
      </motion.div>
    </div>
  );
}
