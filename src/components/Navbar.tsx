import React from 'react';
import {
  LayoutDashboard,
  Landmark,
  Building2,
  GraduationCap,
  FileSpreadsheet,
} from 'lucide-react';
import { RoleType } from '../types';

export type TabKey = 'dashboard' | 'profil' | 'lembaga' | 'asatidz' | 'rekapan';

interface NavbarProps {
  activeTab: TabKey;
  onSelectTab: (tab: TabKey) => void;
  currentRole: RoleType;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  currentRole,
}) => {
  const navItems: {
    key: TabKey;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }[] = [
    {
      key: 'dashboard',
      label: 'DASBOARD',
      icon: LayoutDashboard,
    },
    {
      key: 'profil',
      label: 'PROFIL PESANTREN',
      icon: Landmark,
    },
    {
      key: 'lembaga',
      label: 'LEMBAGA',
      icon: Building2,
    },
    {
      key: 'asatidz',
      label: 'ASATIDZ',
      icon: GraduationCap,
      badge: currentRole === 'asatidz' ? 'Input Nilai' : undefined,
    },
    {
      key: 'rekapan',
      label: 'HASIL REKAPAN',
      icon: FileSpreadsheet,
      badge: 'Excel',
    },
  ];

  return (
    <nav className="bg-white border-b border-slate-200/80 shadow-2xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-1 sm:space-x-2 overflow-x-auto no-scrollbar py-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                id={`nav-${item.key}`}
                onClick={() => onSelectTab(item.key)}
                className={`relative flex items-center gap-2 px-3.5 sm:px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-sm ring-1 ring-emerald-800'
                    : 'text-slate-600 hover:text-emerald-800 hover:bg-emerald-50/70'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-100' : 'text-slate-500'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-emerald-800 text-emerald-100'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
