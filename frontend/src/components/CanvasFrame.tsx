import React from 'react';

export default function CanvasFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 shadow-[0_10px_30px_rgba(0,0,0,0.08)] bg-white p-4 sm:p-5 md:p-6 animate-[fadeIn_100ms_ease-out]">
      {children}
    </div>
  );
}
