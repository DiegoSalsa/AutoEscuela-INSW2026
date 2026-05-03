import React from 'react';

export default function Proximamente() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center text-center p-8 bg-neutral">
      <div className="bg-white p-12 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center max-w-md w-full">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 mb-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>
          </svg>
        </div>
        <h2 className="text-2xl font-bold font-headline text-gray-800 mb-2">Módulo en construcción</h2>
        <p className="text-gray-500 mb-6">Estamos trabajando para habilitar esta funcionalidad pronto. Vuelve más adelante.</p>
        <div className="flex space-x-2">
          <div className="w-2 h-2 bg-primary/20 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    </div>
  );
}
