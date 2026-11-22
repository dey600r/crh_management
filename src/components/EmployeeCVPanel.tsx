import { useEffect, useRef, useState } from 'react';
import { Award, Briefcase, Check, ChevronDown, GraduationCap, Globe, Mail, MapPin, Star, User, X } from 'lucide-react';
import { Employee, Project, RecognitionDefinition, RecognitionTagId, TALENT_RECOGNITIONS } from '../types';
import EmployeeRecognitionIcons, { renderRecognitionIcon } from './EmployeeRecognitionIcons';

interface EmployeeCVPanelProps {
  employee: Employee;
  careerPaths: any[];
  careerLevels: any[];
  projects?: Project[];
  canManageRecognitions?: boolean;
  onToggleRecognition?: (
    employeeId: string,
    tagId: RecognitionTagId,
    nextActive: boolean
  ) => Promise<void>;
  onClose?: () => void;
}

export default function EmployeeCVPanel({
  employee,
  careerPaths,
  careerLevels,
  projects = [],
  canManageRecognitions = false,
  onToggleRecognition,
  onClose
}: EmployeeCVPanelProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<{
    def: RecognitionDefinition;
    nextActive: boolean;
  } | null>(null);
  const [isSavingRecognition, setIsSavingRecognition] = useState(false);
  const [recognitionError, setRecognitionError] = useState<string | null>(null);

  useEffect(() => {
    setIsDropdownOpen(false);
  }, [employee.employeeId]);

  useEffect(() => {
    if (!isDropdownOpen) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsDropdownOpen(false);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDropdownOpen]);

  useEffect(() => {
    if (!pendingConfirmation) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isSavingRecognition) {
        setPendingConfirmation(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pendingConfirmation, isSavingRecognition]);

  const handleConfirmToggle = async () => {
    if (!pendingConfirmation || !onToggleRecognition) return;
    setIsSavingRecognition(true);
    setRecognitionError(null);
    try {
      await onToggleRecognition(
        employee.employeeId,
        pendingConfirmation.def.id,
        pendingConfirmation.nextActive
      );
      setPendingConfirmation(null);
    } catch (err) {
      setRecognitionError(
        err instanceof Error ? err.message : 'No se pudo actualizar la marca de talento.'
      );
    } finally {
      setIsSavingRecognition(false);
    }
  };

  const activeRecognitions = employee.recognitions || [];
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
              <h3 className="text-base font-bold text-slate-900 inline-flex items-center gap-1.5">
                <span>{employee.name} {employee.surname}</span>
                <EmployeeRecognitionIcons employee={employee} size="md" />
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
          {canManageRecognitions && onToggleRecognition && (() => {
            const activeDefs = TALENT_RECOGNITIONS.filter(def => activeRecognitions.includes(def.id));
            const buttonLabel =
              activeDefs.length === 0
                ? 'Distintivos'
                : activeDefs.length <= 2
                ? activeDefs.map(d => d.label).join(' · ')
                : `Distintivos (${activeDefs.length})`;

            return (
              <div ref={dropdownRef} className="relative pt-0.5">
                <button
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={isDropdownOpen}
                  onClick={() => setIsDropdownOpen(prev => !prev)}
                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                    activeDefs.length > 0
                      ? 'bg-amber-50 border-amber-300 text-amber-900 hover:bg-amber-100/80'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-amber-300 hover:bg-amber-50/40'
                  }`}
                >
                  {activeDefs.length > 0 ? (
                    <span className="inline-flex items-center gap-1 shrink-0">
                      {activeDefs.map(def => (
                        <span key={def.id} className="inline-flex items-center">
                          {renderRecognitionIcon(def.id, 'h-3.5 w-3.5', true)}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <Star className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                  )}
                  <span>{buttonLabel}</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 text-slate-400 transition-transform shrink-0 ${
                      isDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {isDropdownOpen && (
                  <div
                    role="menu"
                    aria-label="Seleccionar distintivo de talento"
                    className="absolute right-0 mt-1.5 w-56 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 z-30"
                  >
                    <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Distintivos de talento
                    </div>
                    {TALENT_RECOGNITIONS.map(def => {
                      const isActive = activeRecognitions.includes(def.id);
                      return (
                        <button
                          key={def.id}
                          type="button"
                          role="menuitemcheckbox"
                          aria-checked={isActive}
                          onClick={() => {
                            setIsDropdownOpen(false);
                            setRecognitionError(null);
                            setPendingConfirmation({ def, nextActive: !isActive });
                          }}
                          className={`w-full px-3 py-2 text-left text-xs flex items-center justify-between gap-2 transition-colors ${
                            isActive
                              ? 'bg-amber-50/70 text-slate-900 font-semibold hover:bg-amber-50'
                              : 'text-slate-700 hover:bg-slate-50 font-medium'
                          }`}
                        >
                          <span className="inline-flex items-center gap-2 min-w-0">
                            {renderRecognitionIcon(def.id, 'h-3.5 w-3.5', isActive)}
                            <span className="truncate">{def.label}</span>
                          </span>
                          <span
                            className={`inline-flex items-center justify-center w-4 h-4 rounded border shrink-0 ${
                              isActive
                                ? 'bg-amber-600 border-amber-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isActive && <Check className="h-3 w-3" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
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

      {/* Modal de Doble Confirmación para Marcas de Talento */}
      {pendingConfirmation && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="recognition-confirm-title"
          className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
          onClick={() => {
            if (!isSavingRecognition) setPendingConfirmation(null);
          }}
        >
          <div
            className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl p-5 space-y-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-amber-50 border border-amber-200 shrink-0">
                  {renderRecognitionIcon(
                    pendingConfirmation.def.id,
                    'h-4 w-4',
                    pendingConfirmation.nextActive
                  )}
                </div>
                <div>
                  <h4 id="recognition-confirm-title" className="text-sm font-bold text-slate-900">
                    {pendingConfirmation.nextActive
                      ? `Confirmar AAAAAA: ${pendingConfirmation.def.label}`
                      : `Confirmar desactivación: ${pendingConfirmation.def.label}`}
                  </h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {employee.name} {employee.surname} · {employee.employeeId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                disabled={isSavingRecognition}
                onClick={() => setPendingConfirmation(null)}
                aria-label="Cerrar confirmación"
                className="p-1 text-slate-400 hover:text-slate-600 rounded transition disabled:opacity-50"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed space-y-2">
              {pendingConfirmation.nextActive ? (
                <>
                  <p>
                    ¿Confirmas que deseas marcar a{' '}
                    <strong className="text-slate-900">
                      {employee.name} {employee.surname}
                    </strong>{' '}
                    como <strong className="text-amber-700">{pendingConfirmation.def.label}</strong>?
                  </p>
                  <p className="text-[11px] text-slate-500">
                    {pendingConfirmation.def.description}
                  </p>
                </>
              ) : (
                <p>
                  ¿Confirmas que deseas retirar la marca{' '}
                  <strong className="text-slate-900">{pendingConfirmation.def.label}</strong> a{' '}
                  <strong className="text-slate-900">
                    {employee.name} {employee.surname}
                  </strong>
                  ? El icono dejará de mostrarse junto a su nombre.
                </p>
              )}
            </div>

            {recognitionError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-2.5 text-xs">
                {recognitionError}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isSavingRecognition}
                onClick={() => setPendingConfirmation(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition disabled:opacity-50 whitespace-nowrap shrink-0"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={isSavingRecognition}
                onClick={handleConfirmToggle}
                className={`px-3.5 py-1.5 text-xs font-semibold text-white rounded-lg transition disabled:opacity-50 whitespace-nowrap shrink-0 ${
                  pendingConfirmation.nextActive
                    ? 'bg-amber-600 hover:bg-amber-700'
                    : 'bg-slate-800 hover:bg-slate-900'
                }`}
              >
                {isSavingRecognition ? 'Guardando...' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
