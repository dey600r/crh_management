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
      value: 'ResourceManager',
      label: 'Resource Manager',
      desc: 'Staffing de proyectos, bench y matching técnico',
      icon: Users,
      color: 'bg-emerald-50 border-emerald-200 text-emerald-700'
    },
    {
      value: 'ProjectManager',
      label: 'Project Manager',
      desc: 'Checkpoints de rendimiento y kpis de entrega',
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
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <User className="h-4 w-4 text-indigo-600" />
            Selector de Simulación de Rol
          </h2>
          <p className="text-xs text-slate-500">
            Cambia de perspectiva para experimentar los diferentes flujos y módulos de la plataforma CRH Management.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {roles.map((r) => {
            const Icon = r.icon;
            const isSelected = currentRole === r.value;
            return (
              <button
                key={r.value}
                id={`role-btn-${r.value}`}
                onClick={() => onRoleChange(r.value)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all text-left ${
                  isSelected
                    ? `${r.color} ring-2 ring-offset-2 ring-indigo-500 shadow-sm`
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <div>
                  <div className="font-semibold">{r.label}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
