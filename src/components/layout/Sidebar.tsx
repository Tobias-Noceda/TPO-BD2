import React from 'react';
import { Users, Shield, AlertTriangle, FileText, Car } from 'lucide-react';
import { cn } from '../ui/utils';

export type Section = 'clients' | 'agents' | 'claims' | 'policies' | 'vehicles';

interface SidebarProps {
  activeSection: Section;
  onSectionChange: (section: Section) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange }) => {
  const menuItems = [
    { id: 'clients' as Section, label: 'Clientes', icon: Users },
    { id: 'agents' as Section, label: 'Agentes', icon: Shield },
    { id: 'claims' as Section, label: 'Siniestros', icon: AlertTriangle },
    { id: 'policies' as Section, label: 'Pólizas', icon: FileText },
    { id: 'vehicles' as Section, label: 'Vehículos', icon: Car },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Sistema de Seguros</h1>
        <p className="text-sm text-gray-500 mt-1">Gestión de Aseguradoras</p>
      </div>
      
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <li key={item.id}>
                <button
                  onClick={() => onSectionChange(item.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium text-sm',
                    isActive
                      ? 'bg-primary-50 text-primary-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  )}
                >
                  <Icon size={20} />
                  <span>{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-gray-200 text-xs text-gray-500">
        <p>TPO BD2 - 2025</p>
      </div>
    </aside>
  );
};
