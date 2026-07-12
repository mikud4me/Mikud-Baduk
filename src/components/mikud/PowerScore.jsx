import React from 'react';
import { motion } from 'framer-motion';

export default function PowerScore({ score }) {
  const scoreColor = score >= 80 ? '#22c55e' : score >= 60 ? '#f59e0b' : '#ef4444';
  const rotation = (score / 100) * 180 - 90; // -90 to 90 degrees

  return (
    <div className="relative w-full max-w-xs mx-auto">
      {/* Gauge Background */}
      <svg viewBox="0 0 200 120" className="w-full">
        {/* Background Arc */}
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="20"
          strokeLinecap="round"
        />
        
        {/* Colored Arc */}
        <motion.path
          d="M 20 100 A 80 80 0 0 1 180 100"
          fill="none"
          stroke={scoreColor}
          strokeWidth="20"
          strokeLinecap="round"
          strokeDasharray="251.2"
          initial={{ strokeDashoffset: 251.2 }}
          animate={{ strokeDashoffset: 251.2 - (251.2 * score) / 100 }}
          transition={{ duration: 2, ease: "easeOut" }}
        />

        {/* Center Text */}
        <text
          x="100"
          y="85"
          textAnchor="middle"
          className="fill-[#1e3a5f] text-4xl font-black"
        >
          {score}
        </text>
        <text
          x="100"
          y="105"
          textAnchor="middle"
          className="fill-gray-500 text-sm font-bold"
        >
          /100
        </text>
      </svg>

      {/* Labels */}
      <div className="flex justify-between text-xs font-bold text-gray-500 px-2 mt-2">
        <span>חלש</span>
        <span>בינוני</span>
        <span>חזק</span>
      </div>
    </div>
  );
}