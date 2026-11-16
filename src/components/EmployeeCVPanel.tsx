import { Award, Briefcase, GraduationCap, Globe, Mail, MapPin, User } from 'lucide-react';
import { Employee, Project } from '../types';

interface EmployeeCVPanelProps {
  employee: Employee;
  careerPaths: any[];
  careerLevels: any[];
  projects?: Project[];
  onClose?: () => void;
}

export default function EmployeeCVPanel({
  employee,
  careerPaths,
  careerLevels,
  projects = [],
  onClose
}: EmployeeCVPanelProps) {
  const pathName = careerPaths.find(p => p.id === employee.currentCareerPathId)?.name || employee.currentCareerPathId;
  const levelObj = careerLevels.find(l => l.id === employee.currentLevelId);
  const levelLabel = levelObj ? levelObj.name : employee.currentLevelId;

  const availabilityLabel =
    employee.availabilityPercent >= 80
      ? 'Disponible (Bench)'
      : employee.availabilityPercent > 0
      ? 'Disponibilidad parcial'
      : 'Asignado completo';

  const availabilityColor =
    employee.availabilityPercent >= 80
      ? 'text-emerald-700'
      : employee.availabilityPercent > 0
      ? 'text-amber-700'
      : 'text-slate-600';

  const initials = `${employee.name.charAt(0)}${employee.surname.charAt(0)}`.toUpperCase();

  return (
    <section
      aria-label={`Currículum de ${employee.name} ${employee.surname}`}
      className="bg-white border border-slate-200 rounded-xl p-6 space-y-6"
    >
      {/* Header del Perfil */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-slate-900 text-white flex items-center justify-center text-sm font-bold tracking-wide shrink-0">
            {initials}
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                {employee.name} {employee.surname}
              </h3>
              <span className="text-xs font-mono tabular-nums text-slate-500">
                {employee.employeeId}
              </span>
            </div>
            <p className="text-xs font-semibold text-indigo-700">
              {pathName} <span aria-hidden="true">·</span> {levelLabel}
            </p>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 pt-0.5">
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                {employee.office}, {employee.country}
              </span>
              <span aria-hidden="true">·</span>
              <span>
                División: <strong className="font-semibold text-slate-700">{employee.division || employee.department}</strong>
              </span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1">
                <Mail className="h-3.5 w-3.5 text-slate-400" />
                {employee.email}
              </span>
            </div>
          </div>
        </div>

        <div className="flex sm:flex-col items-end justify-between gap-2 shrink-0">
          <div className="text-right">
            <div className="text-[11px] text-slate-500">
              Incorporación: <span className="font-mono tabular-nums text-slate-700">{employee.hireDate}</span>
            </div>
            <div className={`text-xs font-semibold tabular-nums mt-0.5 ${availabilityColor}`}>
              {availabilityLabel} ({employee.availabilityPercent}%)
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="text-xs font-medium text-slate-500 hover:text-slate-900 px-2.5 py-1 border border-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
            >
              Cerrar ficha
            </button>
          )}
        </div>
      </div>

      {/* Resumen Profesional */}
      {employee.bio && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-slate-400" />
            Resumen Profesional
          </h4>
          <p className="text-xs text-slate-600 leading-relaxed">{employee.bio}</p>
        </div>
      )}

      {/* Stack Técnico (Skills) */}
      <div className="space-y-3 border-t border-slate-100 pt-4">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-semibold text-slate-900">Competencias Técnicas y Stack</h4>
          <span className="text-[11px] text-slate-500 tabular-nums">
            {employee.skills?.length || 0} registradas
          </span>
        </div>

        {employee.skills && employee.skills.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3">
            {employee.skills.map((skill) => (
              <div key={skill.skillId || skill.name} className="space-y-1">
                <div className="flex items-baseline justify-between text-xs">
                  <span className="font-semibold text-slate-800 truncate">{skill.name}</span>
                  <span className="font-mono tabular-nums text-[11px] font-semibold text-indigo-700">
                    {skill.level}/5
                  </span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 rounded-full"
                    style={{ width: `${(skill.level / 5) * 100}%` }}
                  />
                </div>
                <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                  <span>{skill.category}</span>
                  <span aria-hidden="true">·</span>
                  <span>{skill.source}</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums">{skill.validatedDate}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-400 italic">Sin skills técnicas registradas.</p>
        )}
      </div>

      {/* Certificaciones e Historial de Proyectos en dos columnas limpias */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-4">
        {/* Certificaciones */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
            <Award className="h-3.5 w-3.5 text-slate-400" />
            Certificaciones Oficiales
          </h4>
          {employee.certifications && employee.certifications.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {employee.certifications.map((cert) => (
                <li key={cert.id} className="py-2 first:pt-0 last:pb-0">
                  <div className="text-xs font-semibold text-slate-800">{cert.certificationName}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span>{cert.provider}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {cert.issueDate} / {cert.expiryDate}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">Sin certificaciones registradas.</p>
          )}
        </div>

        {/* Experiencia en Proyectos */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
            <Briefcase className="h-3.5 w-3.5 text-slate-400" />
            Trayectoria en Proyectos
          </h4>
          {employee.projectHistory && employee.projectHistory.length > 0 ? (
            <ul className="divide-y divide-slate-100">
              {employee.projectHistory.map((ph, idx) => {
                const prj = projects.find(p => p.projectId === ph.projectId);
                return (
                  <li key={`${ph.projectId}-${idx}`} className="py-2 first:pt-0 last:pb-0 flex items-start justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-slate-800">
                        {prj ? prj.projectName : ph.projectId}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {ph.role}
                        {prj?.clientName ? ` · ${prj.clientName}` : ''}
                      </div>
                    </div>
                    <span className="text-xs font-mono tabular-nums font-semibold text-emerald-700 shrink-0">
                      {ph.performance.toFixed(1)}/5
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="text-xs text-slate-400 italic">Sin historial de proyectos previo.</p>
          )}
        </div>
      </div>

      {/* Formación Académica e Idiomas */}
      {((employee.education && employee.education.length > 0) || (employee.languages && employee.languages.length > 0)) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-4">
          {employee.education && employee.education.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-slate-400" />
                Formación Académica
              </h4>
              <ul className="space-y-1 text-xs text-slate-600">
                {employee.education.map((edu, idx) => (
                  <li key={idx}>{edu}</li>
                ))}
              </ul>
            </div>
          )}

          {employee.languages && employee.languages.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                <Globe className="h-3.5 w-3.5 text-slate-400" />
                Idiomas
              </h4>
              <div className="text-xs text-slate-600">
                {employee.languages.join(' · ')}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
