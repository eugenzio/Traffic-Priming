import React from 'react';

export default function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div aria-label="progress" className="w-full">
      <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="h-full bg-gray-900 transition-[width] duration-500 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="mt-2 text-center text-sm text-gray-500">
        Progress {value} / {max}
      </div>
    </div>
  );
}
