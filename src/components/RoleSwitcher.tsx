import { User, Shield, Users, Briefcase } from 'lucide-react';
import { UserRole } from '../types';

interface RoleSwitcherProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
}

export default function RoleSwitcher({ currentRole, onRoleChange }: RoleSwitcherProps) {
  const roles: { value: UserRole; label: string; desc: string; icon: any; color: string }[] = [
    {
      value: 'RRHH',
      label: 'RRHH / Talent Team',
      desc: 'Ciclo anual, calibración y planes formativos',
      icon: Shield,
      color: 'bg-indigo-50 border-indigo-200 text-indigo-700'
    },
    {
      value: 'ProjectManager',
      label: 'Project Manager',
      desc: 'Staffing de proyectos, checkpoints de rendimiento y KPIs de entrega',
      icon: Briefcase,
      color: 'bg-amber-50 border-amber-200 text-amber-700'
    },
    {
      value: 'Colaborador',
      label: 'Colaborador (Sanz)',
      desc: 'Autodesarrollo, cursos y autoevaluación',
      icon: User,
      color: 'bg-slate-100 border-slate-300 text-slate-700'
    }
  ];

  return (
    <div className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 shadow-xs">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
        <h2 className="text-xs font-semibold text-slate-800 flex items-center gap-1.5 whitespace-nowrap shrink-0">
          <User className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
          Selector de Simulación de Rol
        </h2>
        <div className="flex items-center gap-2 flex-nowrap overflow-x-auto py-1 px-1 -my-1">
          {roles.map((r) => {
            const Icon = r.icon;
            const isSelected = currentRole === r.value;
            return (
              <button
                key={r.value}
                id={`role-btn-${r.value}`}
                type="button"
                title={r.desc}
                onClick={() => onRoleChange(r.value)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors whitespace-nowrap shrink-0 ${
                  isSelected
                    ? `${r.color} border-indigo-500 ring-2 ring-indigo-500/35 shadow-xs`
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <Icon className="h-3.5 w-3.5 shrink-0" />
                <span className="font-semibold">{r.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
