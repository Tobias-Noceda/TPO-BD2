import React from 'react';
import { Database } from 'lucide-react';

export const Header: React.FC = () => {
  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="text-primary-600" size={24} />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Sistema de Gestión de Seguros
            </h2>
            <p className="text-sm text-gray-500">
              MongoDB + Redis - Base de Datos II
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Conectado</span>
          </div>
        </div>
      </div>
    </header>
  );
};
