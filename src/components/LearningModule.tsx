import React, { useState, useEffect, useMemo } from 'react';
import { 
  AlertTriangle, BookOpen, Target, Calendar, Award, Plus, Sparkles, CheckCircle, HelpCircle, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, User, GraduationCap, ClipboardCheck, FileText, TrendingDown, TrendingUp, Filter, Search, X, Info
} from 'lucide-react';
import { Employee, Project, TrainingCatalog, DevelopmentPlan, CheckpointReview, UserRole, CompetencyStage, RecognitionTagId, getRequiredStage, scoreToStage, getLevelTargetScore } from '../types';
import { MarkdownView } from './MarkdownView';
import EmployeeCVPanel from './EmployeeCVPanel';
import EmployeeRecognitionIcons from './EmployeeRecognitionIcons';
import TruncatedTooltip from './TruncatedTooltip';
import { getEmployeeDivision } from '../utils/salaryRecommendation';
import {
  computeCompetencyScoreDrops,
  groupDropsByCheckpoint,
  indexDropsByCheckpointAndCompetency,
  sortCheckpointsChronological,
  sortCheckpointsNewestFirst
} from '../utils/checkpointAlerts';

interface LearningModuleProps {
  userRole: UserRole;
  employees: Employee[];
  projects?: Project[];
  trainings: TrainingCatalog[];
  devPlans: DevelopmentPlan[];
  checkpoints: CheckpointReview[];
  careerLevels: any[];
  careerPaths: any[];
  competencies: any[];
  onDataRefresh: () => void;
}

export default function LearningModule({
  userRole,
  employees,
  projects = [],
  trainings,
  devPlans,
  checkpoints,
  careerLevels,
  careerPaths,
  competencies,
  onDataRefresh
}: LearningModuleProps) {
  // Selected Employee & List Filters
  const [selectedEmpId, setSelectedEmpId] = useState<string>('E001');
  const [targetLevelId, setTargetLevelId] = useState<string>('L4');
  const [empDivisionFilter, setEmpDivisionFilter] = useState<string>('ALL');
  const [empSearchQuery, setEmpSearchQuery] = useState<string>('');

  // AI Gap Analysis
  const [isGapLoading, setIsGapLoading] = useState(false);
  const [gapAnalysisMarkdown, setGapAnalysisMarkdown] = useState<string | null>(null);
  const [gapError, setGapError] = useState<string | null>(null);

  // Forms
  const [showAddAction, setShowAddAction] = useState(false);
  const [newAction, setNewAction] = useState({
    type: 'Training' as 'Training' | 'Mentoring' | 'Certification',
    description: '',
    targetDate: new Date().toISOString().split('T')[0],
    trainingId: ''
  });

  const [showAddCheckpoint, setShowAddCheckpoint] = useState(false);
  const [newCheckpoint, setNewCheckpoint] = useState({
    employeeId: '',
    projectId: 'PRJ001',
    reviewerId: 'E004', // Default manager
    reviewDate: new Date().toISOString().split('T')[0],
    reviewType: 'Monthly' as any,
    comments: '',
    scores: [] as { competencyId: string; score: number; comments: string }[],
    kpis: [
      { kpi: 'Quality' as any, weight: 30, targetValue: 4, currentValue: 4 },
      { kpi: 'Delivery' as any, weight: 30, targetValue: 4, currentValue: 4 },
      { kpi: 'Customer Satisfaction' as any, weight: 40, targetValue: 4, currentValue: 4 }
    ]
  });

  // Editing checkpoint states
  const [editingCheckpointId, setEditingCheckpointId] = useState<string | null>(null);
  const [editingCheckpoint, setEditingCheckpoint] = useState<CheckpointReview | null>(null);
  const [isCareerGuideExpanded, setIsCareerGuideExpanded] = useState(false);
  const [guideLevelId, setGuideLevelId] = useState<string>('');
  const [showCVPanel, setShowCVPanel] = useState(true);

  const handleSaveEditedCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCheckpoint) return;

    try {
      const res = await fetch(`/api/checkpoints/${editingCheckpoint.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingCheckpoint)
      });
      if (res.ok) {
        alert('Checkpoint actualizado correctamente.');
        onDataRefresh();
        setEditingCheckpointId(null);
        setEditingCheckpoint(null);
      } else {
        alert('Error al actualizar el checkpoint.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al guardar el checkpoint.');
    }
  };

  // Get active selected employee objects & filtered list
  const availableDivisions = useMemo(() => {
    const set = new Set<string>();
    employees.forEach(emp => {
      const div = getEmployeeDivision(emp);
      if (div) set.add(div);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'es'));
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const normalizedQuery = empSearchQuery
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');

    return employees.filter(emp => {
      if (empDivisionFilter !== 'ALL' && getEmployeeDivision(emp) !== empDivisionFilter) {
        return false;
      }
      if (!normalizedQuery) return true;
      const fullName = `${emp.name} ${emp.surname}`
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
      const empIdLower = emp.employeeId.toLowerCase();
      return fullName.includes(normalizedQuery) || empIdLower.includes(normalizedQuery);
    });
  }, [employees, empDivisionFilter, empSearchQuery]);

  const selectedEmployee = employees.find(e => e.employeeId === selectedEmpId) || employees[0];
  const selectedPlan = devPlans.find(p => p.employeeId === selectedEmpId);
  const canManageRecognitions = userRole === 'RRHH' || userRole === 'ProjectManager';

  const handleToggleRecognition = async (
    employeeId: string,
    tagId: RecognitionTagId,
    nextActive: boolean
  ) => {
    const target = employees.find(e => e.employeeId === employeeId);
    const current = target?.recognitions || [];
    const nextRecognitions = nextActive
      ? Array.from(new Set([...current, tagId]))
      : current.filter(t => t !== tagId);

    const res = await fetch(`/api/employees/${employeeId}/recognitions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ recognitions: nextRecognitions })
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || 'No se pudo guardar la marca de talento.');
    }

    onDataRefresh();
  };

  // Automatically reset gap output when changing employee
  useEffect(() => {
    setGapAnalysisMarkdown(null);
    setGapError(null);
    setGuideLevelId('');
    // suggest a target level (+1 of current)
    if (selectedEmployee) {
      const currentLvlNum = parseInt(selectedEmployee.currentLevelId.replace('L', '')) || 1;
      const nextLvlNum = Math.min(6, currentLvlNum + 1);
      setTargetLevelId(`L${nextLvlNum}`);
    }
    // Synchronize default employee inside New Checkpoint form
    setNewCheckpoint(prev => ({
      ...prev,
      employeeId: selectedEmpId
    }));
  }, [selectedEmpId]);

  const getTargetScoreForLevelAndCompetency = (levelId: string, _competencyId: string): number =>
    getLevelTargetScore(levelId);

  const getTargetStageForLevel = (levelId: string): 'A' | 'B' | 'C' | 'D' | 'E' => {
    switch (levelId) {
      case 'L1':
        return 'A';
      case 'L2':
      case 'L3':
        return 'B';
      case 'L4':
        return 'C';
      case 'L5':
        return 'D';
      case 'L6':
      case 'L7':
        return 'E';
      default:
        return 'B';
    }
  };

  const getTargetStageNameForLevel = (levelId: string): string => {
    switch (levelId) {
      case 'L1':
        return 'Etapa A (Inicio)';
      case 'L2':
        return 'Etapa B (Consolidación)';
      case 'L3':
        return 'Etapa B (Consolidación)';
      case 'L4':
        return 'Etapa C (Liderazgo operativo)';
      case 'L5':
        return 'Etapa D (Liderazgo estratégico)';
      case 'L6':
      case 'L7':
        return 'Etapa E (Liderazgo corporativo)';
      default:
        return 'Etapa B';
    }
  };

  const renderCareerGuidePanel = (
    selectedEmpForCheckpoint: Employee | undefined,
    isStandalone = false
  ) => {
    const selectedPathForCheckpoint = selectedEmpForCheckpoint
      ? careerPaths.find(p => p.id === selectedEmpForCheckpoint.currentCareerPathId)
      : null;
    const effectiveLevelId = guideLevelId || selectedEmpForCheckpoint?.currentLevelId || '';
    const selectedLevelForCheckpoint = selectedEmpForCheckpoint
      ? careerLevels.find(l => l.id === effectiveLevelId)
      : null;
    const currentLvlNum = selectedEmpForCheckpoint
      ? parseInt(selectedEmpForCheckpoint.currentLevelId.replace('L', ''), 10) || 1
      : 1;
    const nextLvlId = `L${Math.min(7, currentLvlNum + 1)}`;

    return (
      <div
        className={`bg-white border border-slate-200 rounded-xl p-3.5 space-y-3.5 shadow-sm ${
          isStandalone ? 'mb-5' : 'overflow-y-auto max-h-[550px]'
        }`}
      >
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <div>
            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide block">
              Información de Referencia de la BD
            </span>
            <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1">
              <GraduationCap className="h-3.5 w-3.5 text-emerald-600" />
              Guía de Carreras Sopra Steria
            </h4>
          </div>
          <button
            type="button"
            onClick={() => setIsCareerGuideExpanded(false)}
            className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition flex items-center gap-1 text-[10px] font-semibold text-slate-500"
            title="Ocultar Guía de Carreras"
          >
            <span>Ocultar</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {!selectedEmpForCheckpoint ? (
          <div className="text-center p-6 text-slate-400 space-y-2 h-full flex flex-col items-center justify-center">
            <HelpCircle className="h-8 w-8 text-slate-300 animate-pulse" />
            <p className="text-xs font-semibold">Seleccione un Colaborador</p>
            <p className="text-[10px] leading-relaxed">
              Cargará automáticamente la finalidad, criterios de evaluación, misión e indicadores de posición oficiales para guiar de forma objetiva la valoración.
            </p>
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className={isStandalone ? 'grid grid-cols-1 md:grid-cols-2 gap-3.5' : 'space-y-3.5'}>
              {/* Carrera */}
              <div className="bg-emerald-50/30 border border-emerald-100/55 rounded-lg p-3 space-y-1.5">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[9px] font-bold text-emerald-700 uppercase bg-emerald-50 px-1.5 py-0.2 rounded shrink-0">
                    Carrera
                  </span>
                  <span className="text-[10px] font-semibold text-slate-900 text-right">
                    {selectedPathForCheckpoint?.name}
                  </span>
                </div>
                {selectedPathForCheckpoint?.finality && (
                  <div>
                    <strong className="text-[9.5px] text-slate-700 block">Finalidad del Rol:</strong>
                    <p className="text-[10px] text-slate-600 leading-relaxed">
                      {selectedPathForCheckpoint.finality}
                    </p>
                  </div>
                )}
                {selectedPathForCheckpoint?.toEvaluate && (
                  <div>
                    <strong className="text-[9.5px] text-slate-700 block">¿Qué evaluar en esta carrera?:</strong>
                    <p className="text-[10px] text-slate-600 font-medium">
                      {selectedPathForCheckpoint.toEvaluate}
                    </p>
                  </div>
                )}
              </div>

              {/* Posición */}
              <div className="bg-blue-50/30 border border-blue-100/55 rounded-lg p-3 space-y-1.5">
                <div className="flex justify-between items-center gap-2">
                  <span className="text-[9px] font-bold text-blue-700 uppercase bg-blue-50 px-1.5 py-0.2 rounded shrink-0">
                    Nivel / Posición
                  </span>
                  <select
                    aria-label="Nivel de referencia en Guía de Carreras"
                    value={effectiveLevelId}
                    onChange={e => setGuideLevelId(e.target.value)}
                    className="text-[10px] font-semibold text-slate-900 font-mono bg-white px-1.5 py-0.5 border border-slate-200 rounded max-w-[230px]"
                  >
                    {careerLevels.map(cl => {
                      const tag =
                        cl.id === selectedEmpForCheckpoint.currentLevelId
                          ? ' (Actual)'
                          : cl.id === nextLvlId && nextLvlId !== selectedEmpForCheckpoint.currentLevelId
                            ? ' (Meta)'
                            : '';
                      return (
                        <option key={cl.id} value={cl.id}>
                          {cl.levelCode} • {cl.name}{tag}
                        </option>
                      );
                    })}
                  </select>
                </div>
                {selectedLevelForCheckpoint?.mission && (
                  <div>
                    <strong className="text-[9.5px] text-slate-700 block">Misión de la Posición:</strong>
                    <p className="text-[10px] text-slate-600 leading-relaxed">
                      {selectedLevelForCheckpoint.mission}
                    </p>
                  </div>
                )}
                {selectedLevelForCheckpoint?.evaluationIndicators && (
                  <div>
                    <strong className="text-[9.5px] text-slate-700 block">Indicadores Clave de Evaluación:</strong>
                    <p className="text-[10px] text-slate-600 font-medium">
                      {selectedLevelForCheckpoint.evaluationIndicators}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Competencias Clave y Niveles de Etapa */}
            <div className="space-y-2">
              <strong className="text-[10px] font-bold text-slate-700 uppercase block border-b pb-1">
                Comportamientos Esperados por Competencia
              </strong>
              <div
                className={
                  isStandalone
                    ? 'grid grid-cols-1 md:grid-cols-2 gap-2.5'
                    : 'space-y-2 max-h-[250px] overflow-y-auto pr-1'
                }
              >
                {competencies.map(comp => {
                  const targetStage =
                    selectedPathForCheckpoint && selectedLevelForCheckpoint
                      ? getRequiredStage(
                          selectedPathForCheckpoint.id,
                          selectedLevelForCheckpoint.id,
                          comp.id
                        )
                      : 'B';
                  const indicators = comp.stages?.[targetStage] || [];
                  const targetScore = selectedLevelForCheckpoint
                    ? getTargetScoreForLevelAndCompetency(selectedLevelForCheckpoint.id, comp.id)
                    : 3;

                  return (
                    <div
                      key={comp.id}
                      className="border border-slate-100 rounded p-2 bg-slate-50 space-y-1"
                    >
                      <div className="flex justify-between items-center gap-2 text-[10px] font-semibold border-b border-dashed pb-1">
                        <span className="text-slate-800">{comp.name}</span>
                        <span className="text-indigo-600 font-bold bg-white px-1.5 rounded border shrink-0">
                          Etapa {targetStage.toLowerCase()} (Meta: {targetScore})
                        </span>
                      </div>
                      <ul className="list-disc pl-3.5 space-y-0.5 text-[9.5px] text-slate-500 leading-relaxed">
                        {indicators.map((ind: string, i: number) => (
                          <li key={i}>{ind}</li>
                        ))}
                        {indicators.length === 0 && (
                          <li className="list-none text-slate-400 italic">
                            No hay comportamientos registrados en esta etapa de la base de datos.
                          </li>
                        )}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Initializing scores form for checkpoint and auto-calculating targets based on Employee's Level
  useEffect(() => {
    if (!newCheckpoint.employeeId) {
      if (competencies.length > 0) {
        setNewCheckpoint(prev => ({
          ...prev,
          scores: competencies.map(c => ({ competencyId: c.id, score: 3, stage: 'B' as const, comments: 'Cumple lo esperado.' }))
        }));
      }
      return;
    }

    const emp = employees.find(e => e.employeeId === newCheckpoint.employeeId);
    if (emp) {
      // Calculate objective KPI target based on level number to avoid subjectivity
      const lvlId = emp.currentLevelId;
      let kpiTarget = 4.0;
      if (lvlId === 'L1') kpiTarget = 3.0;
      else if (lvlId === 'L2') kpiTarget = 3.5;
      else if (lvlId === 'L3') kpiTarget = 4.0;
      else if (lvlId === 'L4') kpiTarget = 4.5;
      else kpiTarget = 5.0; // L5, L6, L7

      setNewCheckpoint(prev => ({
        ...prev,
        kpis: prev.kpis.map(k => ({ ...k, targetValue: kpiTarget })),
        scores: competencies.map(c => {
          const targetVal = getTargetScoreForLevelAndCompetency(lvlId, c.id);
          const targetStage = getRequiredStage(emp.currentCareerPathId, lvlId, c.id);
          return {
            competencyId: c.id,
            score: targetVal,
            stage: targetStage,
            comments: `Meta automática calculada (Guía): ${targetVal}`
          };
        })
      }));
    }
  }, [newCheckpoint.employeeId, competencies, employees, showAddCheckpoint]);

  const handleRequestAIAnalysis = async () => {
    if (!selectedEmployee) return;
    setIsGapLoading(true);
    setGapAnalysisMarkdown(null);
    setGapError(null);
    try {
      const res = await fetch('/api/ai/career-gap-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee: selectedEmployee,
          targetLevelId
        })
      });
      if (res.ok) {
        const data = await res.json();
        setGapAnalysisMarkdown(data.analysis);
      } else {
        const err = await res.json();
        setGapError(err.error || 'No se pudo generar el análisis.');
      }
    } catch (e) {
      setGapError('Error de red al conectar con el servidor de IA.');
    } finally {
      setIsGapLoading(false);
    }
  };

  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmpId || !newAction.description) return;
    try {
      const res = await fetch(`/api/dev-plans/${selectedEmpId}/actions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAction)
      });
      if (res.ok) {
        onDataRefresh();
        setShowAddAction(false);
        setNewAction({
          type: 'Training',
          description: '',
          targetDate: new Date().toISOString().split('T')[0],
          trainingId: ''
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCheckpoint = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCheckpoint.employeeId || !newCheckpoint.projectId) {
      alert('Por favor selecciona un colaborador.');
      return;
    }
    try {
      const res = await fetch('/api/checkpoints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCheckpoint)
      });
      if (res.ok) {
        alert('Checkpoint de rendimiento guardado correctamente.');
        onDataRefresh();
        setShowAddCheckpoint(false);
        setNewCheckpoint(prev => ({
          ...prev,
          comments: '',
          employeeId: ''
        }));
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helper to handle KPI inputs
  const updateKPIValue = (idx: number, key: 'targetValue' | 'currentValue', val: number) => {
    const updatedKPIs = [...newCheckpoint.kpis];
    updatedKPIs[idx] = { ...updatedKPIs[idx], [key]: val };
    setNewCheckpoint(prev => ({ ...prev, kpis: updatedKPIs }));
  };

  // Helper to handle Competency Score inputs
  const updateCompetencyScore = (id: string, score: number) => {
    const updatedScores = newCheckpoint.scores.map(s => s.competencyId === id ? { ...s, score } : s);
    setNewCheckpoint(prev => ({ ...prev, scores: updatedScores }));
  };

  const updateCompetencyStage = (id: string, stage: 'A' | 'B' | 'C' | 'D' | 'E') => {
    const updatedScores = newCheckpoint.scores.map(s => s.competencyId === id ? { ...s, stage } : s);
    setNewCheckpoint(prev => ({ ...prev, scores: updatedScores }));
  };

  const isCheckpointAuthorized = userRole === 'RRHH' || userRole === 'ProjectManager';

  return (
    <div id="learning-module" className="space-y-6">
      {/* Grid Layout: Development & Upskilling */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Hand: Employee List and their Active Plan */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between gap-2 mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 min-w-0">
                <User className="h-4 w-4 text-indigo-600 shrink-0" />
                <span className="truncate">Selecciona Colaborador</span>
                <span className="text-xs font-semibold text-slate-500 tabular-nums shrink-0">({filteredEmployees.length})</span>
                <TruncatedTooltip
                  text="Visualiza su plan de desarrollo, diagnostica brechas de promoción y haz seguimiento en el proyecto."
                  onlyWhenTruncated={false}
                  className="inline-flex items-center shrink-0"
                >
                  <button
                    type="button"
                    aria-label="Información sobre Selecciona Colaborador"
                    className="text-blue-600 hover:text-blue-700 focus:text-blue-700 focus:outline-none p-0.5 rounded-full transition-colors"
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </TruncatedTooltip>
              </h3>
            </div>

            {/* Buscador por colaborador y filtro por división al mismo nivel */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mb-3">
              <div className="relative flex-1 min-w-0">
                <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                <input
                  type="text"
                  aria-label="Buscar colaborador por nombre o ID"
                  value={empSearchQuery}
                  onChange={e => setEmpSearchQuery(e.target.value)}
                  placeholder="Buscar colaborador..."
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-7 py-1.5 text-slate-700 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
                {empSearchQuery && (
                  <button
                    type="button"
                    onClick={() => setEmpSearchQuery('')}
                    aria-label="Limpiar búsqueda de colaborador"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="relative sm:w-[155px] shrink-0">
                <Filter className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" aria-hidden="true" />
                <select
                  aria-label="Filtrar colaboradores por división"
                  value={empDivisionFilter}
                  onChange={e => setEmpDivisionFilter(e.target.value)}
                  title={empDivisionFilter === 'ALL' ? 'Divisiones...' : empDivisionFilter}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-2 py-1.5 text-slate-700 font-medium focus:outline-none focus:bg-white focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 truncate"
                >
                  <option value="ALL">Divisiones...</option>
                  {availableDivisions.map(div => (
                    <option key={div} value={div}>
                      {div}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredEmployees.length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-200">
                No se encontraron colaboradores que coincidan con los filtros seleccionados.
              </p>
            ) : (
              <div className="space-y-2 max-h-[258px] overflow-y-auto p-1 -m-1">
                {filteredEmployees.map((emp) => {
                  const isSelected = selectedEmpId === emp.employeeId;
                  return (
                    <button
                      key={emp.employeeId}
                      id={`emp-select-${emp.employeeId}`}
                      type="button"
                      onClick={() => setSelectedEmpId(emp.employeeId)}
                      className={`w-full text-left p-2.5 rounded-lg border text-xs transition flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-indigo-50 border-indigo-500 ring-2 ring-indigo-500/35 shadow-xs'
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 flex items-center gap-1 min-w-0">
                          <span className="truncate">{emp.name} {emp.surname}</span>
                          <EmployeeRecognitionIcons employee={emp} size="xs" />
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate">
                          {careerPaths.find(p => p.id === emp.currentCareerPathId)?.name} · {getEmployeeDivision(emp)}
                        </div>
                      </div>
                      <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold shrink-0">
                        {emp.currentLevelId}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Development Plan Box */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Target className="h-4 w-4 text-emerald-600" />
                Plan de Desarrollo (PDP)
              </h3>
              {userRole !== 'Colaborador' && (
                <button
                  onClick={() => setShowAddAction(!showAddAction)}
                  className="text-xs text-indigo-600 font-semibold hover:text-indigo-800 transition"
                >
                  + Añadir Acción
                </button>
              )}
            </div>

            {showAddAction && (
              <form onSubmit={handleAddAction} className="p-3 bg-slate-50 border border-slate-200 rounded-lg mb-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Tipo</label>
                    <select
                      value={newAction.type}
                      onChange={e => setNewAction({...newAction, type: e.target.value as any})}
                      className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                    >
                      <option value="Training">Curso de Formación</option>
                      <option value="Mentoring">Mentoría</option>
                      <option value="Certification">Certificación</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Fecha Límite</label>
                    <input
                      type="date"
                      value={newAction.targetDate}
                      onChange={e => setNewAction({...newAction, targetDate: e.target.value})}
                      className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                    />
                  </div>
                </div>

                {newAction.type === 'Training' && (
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Vincular al Catálogo</label>
                    <select
                      value={newAction.trainingId}
                      onChange={e => {
                        const tr = trainings.find(t => t.trainingId === e.target.value);
                        setNewAction({
                          ...newAction,
                          trainingId: e.target.value,
                          description: tr ? `Realizar curso: ${tr.name}` : ''
                        });
                      }}
                      className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                    >
                      <option value="">-- Elige un Curso del Catálogo --</option>
                      {trainings.map(t => (
                        <option key={t.trainingId} value={t.trainingId}>{t.name} ({t.durationHours}h)</option>
                      ))}
                    </select>
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Descripción Acción</label>
                  <input
                    type="text"
                    placeholder="E.g., Preparar certificación AWS Associate"
                    value={newAction.description}
                    onChange={e => setNewAction({...newAction, description: e.target.value})}
                    className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white font-semibold rounded text-xs py-1 hover:bg-indigo-700 transition"
                >
                  Vincular Acción
                </button>
              </form>
            )}

            {selectedPlan && selectedPlan.actions.length > 0 ? (
              <div className="space-y-3">
                {selectedPlan.actions.map(a => (
                  <div key={a.id} className="border border-slate-150 rounded-lg p-2.5 bg-slate-50 flex items-start justify-between">
                    <div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                        a.type === 'Training' ? 'bg-emerald-50 text-emerald-700' :
                        a.type === 'Certification' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {a.type}
                      </span>
                      <p className="text-xs font-semibold text-slate-800 mt-1">{a.description}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">Límite: {a.targetDate}</p>
                    </div>
                    <span className={`text-[10px] font-medium ${
                      a.status === 'Completed' ? 'text-emerald-600' : 'text-amber-500'
                    }`}>
                      ● {a.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center p-6 border-2 border-dashed border-slate-200 rounded-lg text-slate-400">
                <GraduationCap className="h-8 w-8 mx-auto text-slate-300 mb-1" />
                <p className="text-xs font-semibold">Sin PDP configurado para 2026</p>
                <p className="text-[10px]">Crea un plan formativo usando el matching de IA.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Hand: Employee CV, AI UpSkilling Diagnostic & Checkpoints Feed */}
        <div className="lg:col-span-8 space-y-6">
          {/* Ficha CV del Colaborador */}
          {selectedEmployee && (
            <div className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <FileText className="h-4 w-4 text-indigo-600" />
                  Currículum y Perfil Técnico
                </span>
                <button
                  type="button"
                  onClick={() => setShowCVPanel(!showCVPanel)}
                  className="text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors whitespace-nowrap shrink-0"
                >
                  {showCVPanel ? 'Ocultar Ficha CV' : 'Mostrar Ficha CV'}
                </button>
              </div>
              {showCVPanel && (
                <EmployeeCVPanel
                  employee={selectedEmployee}
                  careerPaths={careerPaths}
                  careerLevels={careerLevels}
                  projects={projects}
                  canManageRecognitions={canManageRecognitions}
                  onToggleRecognition={handleToggleRecognition}
                />
              )}
            </div>
          )}

          {/* AI Gap Analysis Panel */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
            <div className="border-b border-slate-100 pb-3 mb-4">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Copiloto de Carrera</span>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                Evaluación de Gaps de Promoción (IT Career Path)
              </h3>
            </div>

            {selectedEmployee && (
              <div className="space-y-4">
                <div className="bg-slate-50 border border-slate-150 rounded-lg p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div className="flex flex-wrap items-center gap-1">
                    <span>Colaborador:</span>
                    <strong className="text-slate-950 inline-flex items-center gap-1">
                      <span>{selectedEmployee.name} {selectedEmployee.surname}</span>
                      <EmployeeRecognitionIcons employee={selectedEmployee} size="xs" />
                    </strong>
                    <span className="text-slate-400 mx-1">|</span>
                    <span>División:</span> <strong className="text-slate-800">{selectedEmployee.division || selectedEmployee.department}</strong>
                    <span className="text-slate-400 mx-1">|</span>
                    Nivel Actual: <span className="bg-slate-200 font-mono text-slate-700 px-1 rounded text-[10px] font-bold">{selectedEmployee.currentLevelId}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span>Nivel Objetivo:</span>
                    <select
                      value={targetLevelId}
                      onChange={e => setTargetLevelId(e.target.value)}
                      className="border border-slate-300 rounded px-1.5 py-0.5 bg-white text-xs"
                    >
                      {careerLevels.map(cl => (
                        <option key={cl.id} value={cl.id}>{cl.name}</option>
                      ))}
                    </select>
                    <button
                      onClick={handleRequestAIAnalysis}
                      disabled={isGapLoading}
                      className="bg-indigo-600 text-white font-semibold px-3 py-1 rounded text-xs hover:bg-indigo-700 transition flex items-center gap-1 disabled:opacity-50"
                    >
                      {isGapLoading ? (
                        <>
                          <div className="animate-spin h-3 w-3 border-b-2 border-white rounded-full" />
                          Analizando...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-3 w-3" /> Lanzar Auditoría IA
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {isGapLoading && (
                  <div className="text-center p-8 border border-dashed border-indigo-150 bg-indigo-50/20 rounded-lg">
                    <div className="animate-spin h-6 w-6 border-b-2 border-indigo-600 rounded-full mx-auto mb-2" />
                    <p className="text-xs font-semibold text-slate-700">Mapeando competencias del Career Framework...</p>
                    <p className="text-[11px] text-slate-500">Gemini está comparando skills, certificaciones y seleccionando entrenamientos alineados.</p>
                  </div>
                )}

                {gapAnalysisMarkdown && (
                  <div className="border border-indigo-100 bg-indigo-50/20 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-950 border-b border-indigo-100 pb-2">
                      <GraduationCap className="h-4 w-4 text-indigo-600" />
                      Informe Diagnóstico de Promoción e Itinerario sugerido
                    </div>
                    <div className="bg-white rounded-md p-4 border border-slate-200 max-h-[350px] overflow-y-auto shadow-inner">
                      <MarkdownView content={gapAnalysisMarkdown} />
                    </div>
                  </div>
                )}

                {gapError && (
                  <div className="bg-red-50 text-red-700 border border-red-200 text-xs rounded p-2">
                    {gapError}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Performance Checkpoints Feed */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
            <div className="flex flex-wrap justify-between items-center gap-3 mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ClipboardCheck className="h-4 w-4 text-slate-500" />
                  Seguimiento Continuo en Proyecto (Checkpoints)
                </h3>
                <p className="text-xs text-slate-500">
                  Reviews periódicas de Project Managers y KPIs de entrega para mitigar subjetividad.
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  id="toggle-career-guide-btn"
                  onClick={() => setIsCareerGuideExpanded(!isCareerGuideExpanded)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded border transition whitespace-nowrap shrink-0 ${
                    isCareerGuideExpanded
                      ? 'bg-emerald-600 text-white border-emerald-600 hover:bg-emerald-700'
                      : 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  }`}
                  title={isCareerGuideExpanded ? 'Ocultar Guía de Carreras' : 'Mostrar Guía de Carreras'}
                >
                  <GraduationCap className="h-3.5 w-3.5 shrink-0" />
                  <span>Guía de Carreras</span>
                  {isCareerGuideExpanded ? (
                    <ChevronUp className="h-3.5 w-3.5 shrink-0" />
                  ) : (
                    <ChevronDown className="h-3.5 w-3.5 shrink-0" />
                  )}
                </button>
                {isCheckpointAuthorized && (
                  <button
                    id="add-checkpoint-btn"
                    onClick={() => setShowAddCheckpoint(!showAddCheckpoint)}
                    className="bg-indigo-50 text-indigo-600 border border-indigo-100 font-semibold px-2.5 py-1 text-xs rounded hover:bg-indigo-100 transition whitespace-nowrap shrink-0"
                  >
                    + Nuevo Checkpoint
                  </button>
                )}
              </div>
            </div>

            {isCareerGuideExpanded && !showAddCheckpoint && !editingCheckpointId && (
              renderCareerGuidePanel(selectedEmployee, true)
            )}

            {showAddCheckpoint && (() => {
              const selectedEmpForCheckpoint = employees.find(e => e.employeeId === newCheckpoint.employeeId);
              const selectedPathForCheckpoint = selectedEmpForCheckpoint ? careerPaths.find(p => p.id === selectedEmpForCheckpoint.currentCareerPathId) : null;
              const selectedLevelForCheckpoint = selectedEmpForCheckpoint ? careerLevels.find(l => l.id === selectedEmpForCheckpoint.currentLevelId) : null;
              const targetStageName = selectedLevelForCheckpoint ? getTargetStageNameForLevel(selectedLevelForCheckpoint.id) : '';

              return (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-50 border border-slate-200 rounded-xl p-4 mb-6 transition-all duration-300">
                  {/* Form Column */}
                  <form onSubmit={handleCreateCheckpoint} className={`${isCareerGuideExpanded ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4 transition-all duration-300`}>
                    <div className="flex justify-between items-center border-b pb-2">
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900">Registrar Evaluación Continua</h4>
                        <button
                          type="button"
                          onClick={() => setIsCareerGuideExpanded(!isCareerGuideExpanded)}
                          className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition"
                          title={isCareerGuideExpanded ? "Ocultar Guía de Carreras" : "Mostrar Guía de Carreras"}
                        >
                          <HelpCircle className="h-3.5 w-3.5" />
                          <span>Guía de Carreras</span>
                          {isCareerGuideExpanded ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddCheckpoint(false)}
                        className="text-[10px] text-slate-500 hover:text-slate-700 font-semibold uppercase"
                      >
                        Cancelar
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Colaborador *</label>
                        <select
                          value={newCheckpoint.employeeId}
                          onChange={e => setNewCheckpoint({...newCheckpoint, employeeId: e.target.value})}
                          className="w-full text-xs border border-slate-300 rounded p-1 bg-white font-medium"
                          required
                        >
                          <option value="">-- Elige Colaborador --</option>
                          {employees.map(emp => (
                            <option key={emp.employeeId} value={emp.employeeId}>{emp.name} {emp.surname}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Proyecto</label>
                        <select
                          value={newCheckpoint.projectId}
                          onChange={e => setNewCheckpoint({...newCheckpoint, projectId: e.target.value})}
                          className="w-full text-xs border border-slate-300 rounded p-1 bg-white font-medium"
                        >
                          {projects.length > 0 ? (
                            projects.map(p => (
                              <option key={p.projectId} value={p.projectId}>{p.clientName} — {p.projectName}</option>
                            ))
                          ) : (
                            <>
                              <option value="PRJ001">Banco Santander Cloud</option>
                              <option value="PRJ002">Mercadona E-Commerce</option>
                              <option value="PRJ003">Telefónica IoT Analytics</option>
                            </>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Frecuencia</label>
                        <select
                          value={newCheckpoint.reviewType}
                          onChange={e => setNewCheckpoint({...newCheckpoint, reviewType: e.target.value})}
                          className="w-full text-xs border border-slate-300 rounded p-1 bg-white font-medium"
                        >
                          <option value="Monthly">Mensual</option>
                          <option value="Quarterly">Trimestral</option>
                          <option value="MidProject">Mitad de Proyecto</option>
                          <option value="EndProject">Cierre de Proyecto</option>
                        </select>
                      </div>
                    </div>

                    {/* Score Competencies (1-5) */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">Competencias del Nivel (Escala 1 a 5)</span>
                        {selectedLevelForCheckpoint && (
                          <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                            Meta Requerida: {targetStageName}
                          </span>
                        )}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {competencies.map((comp) => {
                          const scoreObj = newCheckpoint.scores.find(s => s.competencyId === comp.id);
                          const targetScore = selectedLevelForCheckpoint ? getTargetScoreForLevelAndCompetency(selectedLevelForCheckpoint.id, comp.id) : 3;
                          const currentVal = scoreObj?.score || 3;
                          const isMeeting = currentVal >= targetScore;
                          const reqStage = selectedEmpForCheckpoint ? getRequiredStage(selectedEmpForCheckpoint.currentCareerPathId, selectedEmpForCheckpoint.currentLevelId, comp.id) : 'B';

                          return (
                            <div key={comp.id} className="bg-white border p-2 rounded text-xs space-y-1 shadow-xs">
                              <div className="flex items-center justify-between">
                                <span className="font-semibold text-slate-800 truncate max-w-[150px]">{comp.name}</span>
                                <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                  isMeeting ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                                }`}>
                                  Meta: {targetScore} (etapa {reqStage.toLowerCase()})
                                </span>
                              </div>
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] text-slate-400">Nota evaluada:</span>
                                <input
                                  type="number"
                                  min="1"
                                  max="5"
                                  value={currentVal}
                                  onChange={e => updateCompetencyScore(comp.id, Number(e.target.value))}
                                  className="w-12 text-center border rounded font-bold text-slate-900 p-0.5"
                                />
                              </div>
                              <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-1">
                                <span className="text-[10px] text-slate-400">Etapa evaluada:</span>
                                <select
                                  value={scoreObj?.stage || 'B'}
                                  onChange={e => updateCompetencyStage(comp.id, e.target.value as 'A' | 'B' | 'C' | 'D' | 'E')}
                                  className="border rounded text-[11px] p-0.5 font-bold text-indigo-700 bg-white"
                                >
                                  <option value="A">Etapa a</option>
                                  <option value="B">Etapa b</option>
                                  <option value="C">Etapa c</option>
                                  <option value="D">Etapa d</option>
                                  <option value="E">Etapa e</option>
                                </select>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* KPI Metrics */}
                    <div className="space-y-2">
                      <span className="text-[10px] font-bold text-slate-500 uppercase block">KPIs Objetivos del Proyecto (Escala 1 a 5)</span>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {newCheckpoint.kpis.map((k, idx) => (
                          <div key={k.kpi} className="bg-white border p-2 rounded text-xs space-y-1 shadow-xs">
                            <span className="font-semibold text-slate-800 block text-center truncate">{k.kpi}</span>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-slate-500 font-medium">Meta (Calculada):</span>
                              <input
                                type="number"
                                step="0.1"
                                value={k.targetValue}
                                onChange={e => updateKPIValue(idx, 'targetValue', Number(e.target.value))}
                                className="w-10 text-center border rounded font-bold text-slate-700 bg-slate-50"
                              />
                            </div>
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="text-indigo-600 font-semibold">Real:</span>
                              <input
                                type="number"
                                step="0.1"
                                value={k.currentValue}
                                onChange={e => updateKPIValue(idx, 'currentValue', Number(e.target.value))}
                                className="w-11 text-center border rounded font-bold text-indigo-600"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Comments */}
                    <div>
                      <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Comentarios Generales del Desempeño</label>
                      <textarea
                        placeholder="Escribe comentarios objetivos, evidencias técnicas y feedback de entrega..."
                        value={newCheckpoint.comments}
                        onChange={e => setNewCheckpoint({...newCheckpoint, comments: e.target.value})}
                        className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white h-16"
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-indigo-600 text-white font-bold rounded text-xs py-2 hover:bg-indigo-700 transition shadow-sm"
                    >
                      Registrar Checkpoint Oficial
                    </button>
                  </form>

                  {/* Career Guide specs assistance panel */}
                  {isCareerGuideExpanded && (
                    <div className="lg:col-span-5">
                      {renderCareerGuidePanel(selectedEmpForCheckpoint)}
                    </div>
                  )}
                </div>
              );
            })()}

            <div className="space-y-4">
              {(() => {
                const employeeCheckpoints = checkpoints.filter(cp => cp.employeeId === selectedEmpId);
                const chronologicalCheckpoints = sortCheckpointsChronological(employeeCheckpoints);
                const displayCheckpoints = sortCheckpointsNewestFirst(chronologicalCheckpoints);
                const scoreDrops = computeCompetencyScoreDrops(chronologicalCheckpoints);
                const dropsByCheckpoint = groupDropsByCheckpoint(scoreDrops);
                const dropByCpAndComp = indexDropsByCheckpointAndCompetency(scoreDrops);

                if (chronologicalCheckpoints.length === 0) {
                  return (
                    <div className="text-center p-8 bg-slate-50 border border-slate-200/60 rounded-xl text-slate-500">
                      <ClipboardCheck className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                      <p className="text-xs font-semibold">No hay evaluaciones continuas registradas para este colaborador.</p>
                      <p className="text-[10px] text-slate-400 mt-1">Haga clic en "+ Nuevo Checkpoint" para registrar una nueva evaluación continua.</p>
                    </div>
                  );
                }

                const levelTargetScore = selectedEmployee
                  ? getLevelTargetScore(selectedEmployee.currentLevelId)
                  : 3.0;

                const progressionPoints = chronologicalCheckpoints.map((cp) => {
                  const avgScore = cp.scores.length > 0
                    ? cp.scores.reduce((acc, s) => acc + s.score, 0) / cp.scores.length
                    : 0;
                  const avgKpi = cp.kpis.length > 0
                    ? cp.kpis.reduce((acc, k) => acc + k.currentValue, 0) / cp.kpis.length
                    : 0;
                  const avgKpiTarget = cp.kpis.length > 0
                    ? cp.kpis.reduce((acc, k) => acc + k.targetValue, 0) / cp.kpis.length
                    : levelTargetScore;
                  return {
                    id: cp.id,
                    date: cp.reviewDate,
                    avgScore,
                    avgKpi,
                    avgKpiTarget,
                    stage: scoreToStage(avgScore)
                  };
                });

                const firstPt = progressionPoints[0];
                const lastPt = progressionPoints[progressionPoints.length - 1];
                const scoreDelta = lastPt && firstPt ? lastPt.avgScore - firstPt.avgScore : 0;

                return (
                  <>
                    {chronologicalCheckpoints.length >= 2 && (
                      <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/70 space-y-2.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
                            <TrendingUp className="h-4 w-4 text-emerald-600" />
                            Progresión Anual en Checkpoints
                          </span>
                          <span className={`text-xs font-mono tabular-nums font-semibold ${
                            scoreDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'
                          }`}>
                            {scoreDelta >= 0 ? `+${scoreDelta.toFixed(2)}` : scoreDelta.toFixed(2)} pts ({firstPt.avgScore.toFixed(1)} → {lastPt.avgScore.toFixed(1)})
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {progressionPoints.map((pt, idx) => (
                            <div key={pt.id} className="bg-white border border-slate-200 rounded-md px-2.5 py-2 space-y-0.5">
                              <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                                #{idx + 1} · {pt.date}
                              </div>
                              <div className="flex items-baseline justify-between">
                                <span className={`text-xs font-bold font-mono tabular-nums ${
                                  pt.avgScore >= levelTargetScore ? 'text-emerald-700' : 'text-slate-900'
                                }`}>
                                  {pt.avgScore.toFixed(2)} <span className="text-slate-400 font-normal">/ {levelTargetScore.toFixed(2)}</span>
                                </span>
                                <span className="text-[11px] font-semibold text-indigo-700">
                                  Etapa {pt.stage.toLowerCase()}
                                </span>
                              </div>
                              <div className="text-[10px] text-slate-400 font-mono tabular-nums">
                                KPI med: {pt.avgKpi.toFixed(1)} / {pt.avgKpiTarget.toFixed(1)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {displayCheckpoints.map((cp) => {
                  const emp = employees.find(e => e.employeeId === cp.employeeId);
                  const isEditing = editingCheckpointId === cp.id && editingCheckpoint;
                  const cpDrops = dropsByCheckpoint.get(cp.id) || [];
                  
                  if (isEditing) {
                    return (
                      <div key={cp.id} className="grid grid-cols-1 lg:grid-cols-12 gap-6 border-2 border-indigo-500 rounded-xl p-4 bg-slate-50 shadow-md transition-all duration-300">
                        <form 
                          onSubmit={handleSaveEditedCheckpoint}
                          className={`${isCareerGuideExpanded ? 'lg:col-span-7' : 'lg:col-span-12'} space-y-4 transition-all duration-300`}
                        >
                          <div className="flex justify-between items-center border-b pb-2">
                            <div className="flex items-center gap-2">
                              <h4 className="text-xs font-bold text-slate-900">
                                Editar Evaluación Continua {emp ? `(${emp.name} ${emp.surname})` : ''}
                              </h4>
                              <button
                                type="button"
                                onClick={() => setIsCareerGuideExpanded(!isCareerGuideExpanded)}
                                className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition"
                                title={isCareerGuideExpanded ? "Ocultar Guía de Carreras" : "Mostrar Guía de Carreras"}
                              >
                                <HelpCircle className="h-3.5 w-3.5" />
                                <span>Guía de Carreras</span>
                                {isCareerGuideExpanded ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingCheckpointId(null);
                                setEditingCheckpoint(null);
                              }}
                              className="text-[10px] text-slate-500 hover:text-slate-700 font-semibold uppercase"
                            >
                              Cancelar
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Colaborador</label>
                              <input
                                type="text"
                                value={emp ? `${emp.name} ${emp.surname}` : ''}
                                disabled
                                className="w-full text-xs border border-slate-200 rounded p-1 bg-slate-100 text-slate-500 font-semibold"
                              />
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Proyecto</label>
                              <select
                                value={editingCheckpoint.projectId}
                                onChange={e => setEditingCheckpoint({...editingCheckpoint, projectId: e.target.value})}
                                className="w-full text-xs border border-slate-300 rounded p-1 bg-white font-medium"
                              >
                                {projects.length > 0 ? (
                                  projects.map(p => (
                                    <option key={p.projectId} value={p.projectId}>{p.clientName} — {p.projectName}</option>
                                  ))
                                ) : (
                                  <>
                                    <option value="PRJ001">Banco Santander Cloud</option>
                                    <option value="PRJ002">Mercadona E-Commerce</option>
                                    <option value="PRJ003">Telefónica IoT Analytics</option>
                                  </>
                                )}
                              </select>
                            </div>
                            <div>
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Frecuencia</label>
                              <select
                                value={editingCheckpoint.reviewType}
                                onChange={e => setEditingCheckpoint({...editingCheckpoint, reviewType: e.target.value as any})}
                                className="w-full text-xs border border-slate-300 rounded p-1 bg-white font-medium"
                              >
                                <option value="Monthly">Mensual</option>
                                <option value="Quarterly">Trimestral</option>
                                <option value="MidProject">Mitad de Proyecto</option>
                                <option value="EndProject">Cierre de Proyecto</option>
                              </select>
                            </div>
                          </div>

                          {/* Scores */}
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-bold text-slate-500 uppercase block">Competencias del Nivel (Escala 1 a 5)</span>
                              {emp && (
                                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                                  Meta Requerida: {getTargetStageNameForLevel(emp.currentLevelId)}
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {competencies.map((comp) => {
                                const scoreObj = editingCheckpoint.scores.find(s => s.competencyId === comp.id);
                                const scoreVal = scoreObj ? scoreObj.score : 3;
                                const stageVal = scoreObj?.stage || 'B';
                                const editingEmp = employees.find(e => e.employeeId === editingCheckpoint.employeeId);
                                const reqStage = editingEmp ? getRequiredStage(editingEmp.currentCareerPathId, editingEmp.currentLevelId, comp.id) : 'B';
                                const targetLevelForEditing = editingEmp ? careerLevels.find(l => l.id === editingEmp.currentLevelId) : null;
                                const targetScore = targetLevelForEditing ? getTargetScoreForLevelAndCompetency(targetLevelForEditing.id, comp.id) : 3;
                                const isMeeting = scoreVal >= targetScore;

                                return (
                                  <div key={comp.id} className="bg-white border p-2 rounded text-xs space-y-1 shadow-xs">
                                    <div className="flex items-center justify-between">
                                      <span className="font-semibold text-slate-800 truncate max-w-[150px]">{comp.name}</span>
                                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                                        isMeeting ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                                      }`}>
                                        Meta: {targetScore} (etapa {reqStage.toLowerCase()})
                                      </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                      <span className="text-[10px] text-slate-400">Nota evaluada:</span>
                                      <input
                                        type="number"
                                        min="1"
                                        max="5"
                                        value={scoreVal}
                                        onChange={e => {
                                          const val = Math.max(1, Math.min(5, Number(e.target.value)));
                                          const updatedScores = editingCheckpoint.scores.map(s => 
                                            s.competencyId === comp.id ? { ...s, score: val } : s
                                          );
                                          if (!editingCheckpoint.scores.some(s => s.competencyId === comp.id)) {
                                            updatedScores.push({ competencyId: comp.id, score: val, stage: 'B', comments: 'Actualizado.' });
                                          }
                                          setEditingCheckpoint({ ...editingCheckpoint, scores: updatedScores });
                                        }}
                                        className="w-12 text-center border rounded font-bold text-slate-900 p-0.5"
                                      />
                                    </div>
                                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 mt-1">
                                      <span className="text-[10px] text-slate-400">Etapa evaluada:</span>
                                      <select
                                        value={stageVal}
                                        onChange={e => {
                                          const stg = e.target.value as 'A' | 'B' | 'C' | 'D' | 'E';
                                          const updatedScores = editingCheckpoint.scores.map(s => 
                                            s.competencyId === comp.id ? { ...s, stage: stg } : s
                                          );
                                          if (!editingCheckpoint.scores.some(s => s.competencyId === comp.id)) {
                                            updatedScores.push({ competencyId: comp.id, score: 3, stage: stg, comments: 'Actualizado.' });
                                          }
                                          setEditingCheckpoint({ ...editingCheckpoint, scores: updatedScores });
                                        }}
                                        className="border rounded text-[11px] p-0.5 font-bold text-indigo-700 bg-white"
                                      >
                                        <option value="A">Etapa a</option>
                                        <option value="B">Etapa b</option>
                                        <option value="C">Etapa c</option>
                                        <option value="D">Etapa d</option>
                                        <option value="E">Etapa e</option>
                                      </select>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* KPIs */}
                          <div className="space-y-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase block">KPIs Objetivos del Proyecto (Escala 1 a 5)</span>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {editingCheckpoint.kpis.map((k, idx) => (
                                <div key={k.kpi} className="bg-white border p-2 rounded text-xs space-y-1 shadow-xs">
                                  <span className="font-semibold text-slate-800 block text-center truncate">{k.kpi}</span>
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-slate-500 font-medium">Meta (Calculada):</span>
                                    <input
                                      type="number"
                                      step="0.1"
                                      value={k.targetValue}
                                      onChange={e => {
                                        const updatedKPIs = [...editingCheckpoint.kpis];
                                        updatedKPIs[idx] = { ...updatedKPIs[idx], targetValue: Number(e.target.value) };
                                        setEditingCheckpoint({ ...editingCheckpoint, kpis: updatedKPIs });
                                      }}
                                      className="w-10 text-center border rounded font-bold text-slate-700 bg-slate-50"
                                    />
                                  </div>
                                  <div className="flex items-center justify-between text-[10px]">
                                    <span className="text-indigo-600 font-semibold">Real:</span>
                                    <input
                                      type="number"
                                      step="0.1"
                                      value={k.currentValue}
                                      onChange={e => {
                                        const updatedKPIs = [...editingCheckpoint.kpis];
                                        updatedKPIs[idx] = { ...updatedKPIs[idx], currentValue: Number(e.target.value) };
                                        setEditingCheckpoint({ ...editingCheckpoint, kpis: updatedKPIs });
                                      }}
                                      className="w-11 text-center border rounded font-bold text-indigo-600"
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Comments */}
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Comentarios Generales del Desempeño</label>
                            <textarea
                              placeholder="Escribe comentarios objetivos, evidencias técnicas y feedback de entrega..."
                              value={editingCheckpoint.comments}
                              onChange={e => setEditingCheckpoint({...editingCheckpoint, comments: e.target.value})}
                              className="w-full text-xs border border-slate-300 rounded p-1.5 bg-white h-16"
                              required
                            />
                          </div>

                          <button
                            type="submit"
                            className="w-full bg-indigo-600 text-white font-bold rounded text-xs py-2 hover:bg-indigo-700 transition shadow-sm"
                          >
                            Guardar Checkpoint Actualizado
                          </button>
                        </form>

                        {/* Career Guide specs assistance panel (Collapsible) */}
                        {isCareerGuideExpanded && (
                          <div className="lg:col-span-5">
                            {renderCareerGuidePanel(emp)}
                          </div>
                        )}
                      </div>
                    );
                  }

                  return (
                    <div
                      key={cp.id}
                      className={`border rounded-xl p-3 ${
                        cpDrops.length > 0
                          ? 'border-rose-200 bg-rose-50/20'
                          : 'border-slate-150 bg-slate-50/30'
                      }`}
                    >
                      <div className="flex justify-between items-start border-b border-slate-100 pb-2 mb-2 gap-2">
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider bg-slate-200 px-1 py-0.5 rounded">
                              {cp.reviewType} Review
                            </span>
                            {cpDrops.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded">
                                <AlertTriangle className="h-3 w-3 text-rose-600 shrink-0" />
                                Alerta descenso ({cpDrops.length})
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 mt-1 inline-flex items-center gap-1.5">
                            <span>{emp ? `${emp.name} ${emp.surname}` : 'Colaborador Genérico'}</span>
                            <EmployeeRecognitionIcons employee={emp} size="xs" />
                          </h4>
                          <p className="text-[10px] text-slate-400">Evaluado en: {cp.reviewDate}</p>
                        </div>
                        <div className="text-right flex flex-col items-end gap-1.5">
                          <span className="text-[10px] text-slate-500">Evaluador ID: {cp.reviewerId}</span>
                          {isCheckpointAuthorized && (
                            <button
                              onClick={() => {
                                setEditingCheckpointId(cp.id);
                                setEditingCheckpoint(JSON.parse(JSON.stringify(cp)));
                              }}
                              className="text-[10px] text-indigo-600 hover:text-indigo-800 font-semibold bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded transition"
                            >
                              Editar
                            </button>
                          )}
                        </div>
                      </div>

                      {cpDrops.length > 0 && (
                        <div
                          role="alert"
                          className="mb-2.5 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-xs text-rose-900 flex items-start gap-2"
                        >
                          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                          <div className="space-y-1 min-w-0">
                            <div className="font-bold text-rose-800">
                              Alerta: descenso en {cpDrops.length}{' '}
                              {cpDrops.length === 1 ? 'competencia' : 'competencias'} respecto al checkpoint anterior
                            </div>
                            <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-rose-700">
                              {cpDrops.map(d => {
                                const compName =
                                  competencies.find(c => c.id === d.competencyId)?.name || d.competencyId;
                                return (
                                  <span key={d.competencyId} className="font-medium">
                                    {compName}:{' '}
                                    <span className="font-mono font-bold tabular-nums">
                                      {d.previousScore.toFixed(1)} → {d.currentScore.toFixed(1)} ({d.delta.toFixed(1)})
                                    </span>
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-slate-700 italic bg-white p-2 rounded border border-slate-200/50">
                        "{cp.comments}"
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-2">
                        {/* KPI Progress Bars */}
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1.5">KPIs de Proyecto</span>
                          <div className="space-y-1">
                            {cp.kpis.map(k => (
                              <div key={k.kpi} className="text-[10px] flex items-center justify-between bg-white p-1 rounded border border-slate-100">
                                <span className="text-slate-600">{k.kpi}</span>
                                <span className="font-semibold text-slate-900">
                                  {k.currentValue} / {k.targetValue}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Competency Scores */}
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1.5">Competencias Puntuadas vs Metas Reales</span>
                          <div className="flex flex-wrap gap-1.5">
                            {cp.scores.map(s => {
                              const compName = competencies.find(c => c.id === s.competencyId)?.name || s.competencyId;
                              const targetVal = emp ? getTargetScoreForLevelAndCompetency(emp.currentLevelId, s.competencyId) : 3;
                              const isMet = s.score >= targetVal;
                              const reqStage = emp ? getRequiredStage(emp.currentCareerPathId, emp.currentLevelId, s.competencyId) : 'B';
                              const drop = dropByCpAndComp.get(`${cp.id}::${s.competencyId}`);
                              return (
                                <span
                                  key={s.competencyId}
                                  title={
                                    drop
                                      ? `Descenso respecto al checkpoint anterior (${drop.previousReviewDate}): ${drop.previousScore.toFixed(1)} → ${drop.currentScore.toFixed(1)}`
                                      : undefined
                                  }
                                  className={`text-[10px] border px-2 py-0.5 rounded-full font-semibold flex items-center gap-1.5 ${
                                    isMet ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                                  } ${drop ? 'ring-1 ring-rose-400' : ''}`}
                                >
                                  <span>{compName}:</span>
                                  <strong className="font-bold text-slate-950">{s.score}</strong>
                                  {drop && (
                                    <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-rose-700 bg-rose-100 px-1 rounded">
                                      <TrendingDown className="h-2.5 w-2.5" />
                                      {drop.delta.toFixed(1)}
                                    </span>
                                  )}
                                  {s.stage && (
                                    <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1 py-0.2 rounded font-bold uppercase border border-indigo-100">
                                      {s.stage}
                                    </span>
                                  )}
                                  <span className="text-[9px] text-slate-400 font-normal">(Meta: {targetVal} / {reqStage.toLowerCase()})</span>
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
                  </>
                );
              })()}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
