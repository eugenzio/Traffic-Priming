import React from 'react';

export default function SurveyLayout({
  title,
  subtitle,
  progress,
  children,
  footerLeft,
  footerRight,
}: {
  title: string;
  subtitle?: React.ReactNode;
  progress?: React.ReactNode;
  children: React.ReactNode;
  footerLeft?: React.ReactNode;
  footerRight?: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-[1100px] px-4 sm:px-6 lg:px-8 py-8 md:py-10">
        <header className="mb-6 md:mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900">
            {title}
          </h1>
          {subtitle && <div className="mt-2">{subtitle}</div>}
          {progress && <div className="mt-3">{progress}</div>}
        </header>

        <main>{children}</main>

        <footer className="mt-8 md:mt-10 flex items-center justify-between flex-wrap gap-4">
          <div className="text-sm text-gray-500">{footerLeft}</div>
          <div>{footerRight}</div>
        </footer>
      </div>
    </div>
  );
}
