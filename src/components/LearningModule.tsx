import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Target, Calendar, Award, Plus, Sparkles, CheckCircle, HelpCircle, ChevronLeft, ChevronRight, User, GraduationCap, ClipboardCheck
} from 'lucide-react';
import { Employee, TrainingCatalog, DevelopmentPlan, CheckpointReview, UserRole, CompetencyStage, getRequiredStage, scoreToStage, stageToScore } from '../types';
import { MarkdownView } from './MarkdownView';

interface LearningModuleProps {
  userRole: UserRole;
  employees: Employee[];
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
  trainings,
  devPlans,
  checkpoints,
  careerLevels,
  careerPaths,
  competencies,
  onDataRefresh
}: LearningModuleProps) {
  // Selected Employee
  const [selectedEmpId, setSelectedEmpId] = useState<string>('E001');
  const [targetLevelId, setTargetLevelId] = useState<string>('L4');

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

  // Get active selected employee objects
  const selectedEmployee = employees.find(e => e.employeeId === selectedEmpId) || employees[0];
  const selectedPlan = devPlans.find(p => p.employeeId === selectedEmpId);

  // Automatically reset gap output when changing employee
  useEffect(() => {
    setGapAnalysisMarkdown(null);
    setGapError(null);
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

  const getTargetScoreForLevelAndCompetency = (levelId: string, competencyId: string): number => {
    switch (levelId) {
      case 'L1': // Technician (Nivel 1')
        return 2; // Etapa A
      case 'L2': // Engineer (Nivel 1)
        return 3; // Etapa B
      case 'L3': // Senior Engineer (Nivel 2)
        return 3.5; // Etapa B
      case 'L4': // Manager (Nivel 3)
        return 4; // Etapa C
      case 'L5': // Senior Manager (Nivel 4)
        return 4.5; // Etapa D
      case 'L6': // Director (Nivel 5)
      case 'L7': // Senior Director (Nivel 6)
        return 5; // Etapa E
      default:
        return 3;
    }
  };

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

  const renderCareerGuidePanel = (selectedEmpForCheckpoint: Employee | undefined) => {
    const selectedPathForCheckpoint = selectedEmpForCheckpoint ? careerPaths.find(p => p.id === selectedEmpForCheckpoint.currentCareerPathId) : null;
    const selectedLevelForCheckpoint = selectedEmpForCheckpoint ? careerLevels.find(l => l.id === selectedEmpForCheckpoint.currentLevelId) : null;

    return (
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 space-y-3.5 overflow-y-auto max-h-[550px] shadow-sm animate-in fade-in slide-in-from-right-2 duration-300">
        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
          <div>
            <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-wide block">Información de Referencia de la BD</span>
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
          <div className="space-y-3.5 animate-in fade-in duration-200">
            {/* Carrera */}
            <div className="bg-emerald-50/30 border border-emerald-100/55 rounded-lg p-3 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-emerald-700 uppercase bg-emerald-50 px-1.5 py-0.2 rounded">Carrera</span>
                <span className="text-[10px] font-semibold text-slate-900">{selectedPathForCheckpoint?.name}</span>
              </div>
              {selectedPathForCheckpoint?.finality && (
                <div>
                  <strong className="text-[9.5px] text-slate-700 block">Finalidad del Rol:</strong>
                  <p className="text-[10px] text-slate-600 leading-relaxed">{selectedPathForCheckpoint.finality}</p>
                </div>
              )}
              {selectedPathForCheckpoint?.toEvaluate && (
                <div>
                  <strong className="text-[9.5px] text-slate-700 block">¿Qué evaluar en esta carrera?:</strong>
                  <p className="text-[10px] text-slate-600 font-medium">{selectedPathForCheckpoint.toEvaluate}</p>
                </div>
              )}
            </div>

            {/* Posición */}
            <div className="bg-blue-50/30 border border-blue-100/55 rounded-lg p-3 space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold text-blue-700 uppercase bg-blue-50 px-1.5 py-0.2 rounded">Nivel / Posición</span>
                <span className="text-[10px] font-semibold text-slate-900 font-mono bg-white px-1 border rounded">{selectedLevelForCheckpoint?.levelCode} • {selectedLevelForCheckpoint?.name}</span>
              </div>
              {selectedLevelForCheckpoint?.mission && (
                <div>
                  <strong className="text-[9.5px] text-slate-700 block">Misión de la Posición:</strong>
                  <p className="text-[10px] text-slate-600 leading-relaxed">{selectedLevelForCheckpoint.mission}</p>
                </div>
              )}
              {selectedLevelForCheckpoint?.evaluationIndicators && (
                <div>
                  <strong className="text-[9.5px] text-slate-700 block">Indicadores Clave de Evaluación:</strong>
                  <p className="text-[10px] text-slate-600 font-medium">{selectedLevelForCheckpoint.evaluationIndicators}</p>
                </div>
              )}
            </div>

            {/* Competencias Clave y Niveles de Etapa */}
            <div className="space-y-2">
              <strong className="text-[10px] font-bold text-slate-700 uppercase block border-b pb-1">Comportamientos Esperados por Competencia</strong>
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {competencies.map(comp => {
                  const targetStage = (selectedPathForCheckpoint && selectedLevelForCheckpoint)
                    ? getRequiredStage(selectedPathForCheckpoint.id, selectedLevelForCheckpoint.id, comp.id)
                    : 'B';
                  const indicators = comp.stages?.[targetStage] || [];
                  const targetScore = selectedLevelForCheckpoint ? getTargetScoreForLevelAndCompetency(selectedLevelForCheckpoint.id, comp.id) : 3;

                  return (
                    <div key={comp.id} className="border border-slate-100 rounded p-2 bg-slate-50 space-y-1">
                      <div className="flex justify-between items-center text-[10px] font-semibold border-b border-dashed pb-1">
                        <span className="text-slate-800">{comp.name}</span>
                        <span className="text-indigo-600 font-bold bg-white px-1.5 rounded border">
                          Etapa {targetStage.toLowerCase()} (Meta: {targetScore})
                        </span>
                      </div>
                      <ul className="list-disc pl-3.5 space-y-0.5 text-[9.5px] text-slate-500 leading-relaxed">
                        {indicators.map((ind: string, i: number) => (
                          <li key={i}>{ind}</li>
                        ))}
                        {indicators.length === 0 && (
                          <li className="list-none text-slate-400 italic">No hay comportamientos registrados en esta etapa de la base de datos.</li>
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
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <User className="h-4 w-4 text-indigo-600" />
              Selecciona Colaborador
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Visualiza su plan de desarrollo, diagnostica brechas de promoción y haz seguimiento en el proyecto.
            </p>

            <div className="space-y-2 max-h-[250px] overflow-y-auto">
              {employees.map((emp) => {
                const isSelected = selectedEmpId === emp.employeeId;
                return (
                  <button
                    key={emp.employeeId}
                    id={`emp-select-${emp.employeeId}`}
                    onClick={() => setSelectedEmpId(emp.employeeId)}
                    className={`w-full text-left p-2.5 rounded-lg border text-xs transition flex items-center justify-between ${
                      isSelected ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900">{emp.name} {emp.surname}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        {careerPaths.find(p => p.id === emp.currentCareerPathId)?.name}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">
                      {emp.currentLevelId}
                    </span>
                  </button>
                );
              })}
            </div>
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

        {/* Right Hand: AI UpSkilling Diagnostic & Checkpoints Feed */}
        <div className="lg:col-span-8 space-y-6">
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
                  <div>
                    Colaborador: <strong className="text-slate-950">{selectedEmployee.name} {selectedEmployee.surname}</strong>
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
            <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <ClipboardCheck className="h-4 w-4 text-slate-500" />
                  Seguimiento Continuo en Proyecto (Checkpoints)
                </h3>
                <p className="text-xs text-slate-500">
                  Reviews periódicas de Project Managers y KPIs de entrega para mitigar subjetividad.
                </p>
              </div>
              {isCheckpointAuthorized && (
                <button
                  id="add-checkpoint-btn"
                  onClick={() => setShowAddCheckpoint(!showAddCheckpoint)}
                  className="bg-indigo-50 text-indigo-600 border border-indigo-100 font-semibold px-2.5 py-1 text-xs rounded hover:bg-indigo-100 transition"
                >
                  + Nuevo Checkpoint
                </button>
              )}
            </div>

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
                          <option value="PRJ001">Banco Santander Cloud</option>
                          <option value="PRJ002">Mercadona E-Commerce</option>
                          <option value="PRJ003">Telefónica IoT Analytics</option>
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
                const filtered = checkpoints.filter(cp => cp.employeeId === selectedEmpId);
                if (filtered.length === 0) {
                  return (
                    <div className="text-center p-8 bg-slate-50 border border-slate-200/60 rounded-xl text-slate-500">
                      <ClipboardCheck className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                      <p className="text-xs font-semibold">No hay evaluaciones continuas registradas para este colaborador.</p>
                      <p className="text-[10px] text-slate-400 mt-1">Haga clic en "+ Nuevo Checkpoint" para registrar una nueva evaluación continua.</p>
                    </div>
                  );
                }
                return filtered.map((cp) => {
                  const emp = employees.find(e => e.employeeId === cp.employeeId);
                  const isEditing = editingCheckpointId === cp.id && editingCheckpoint;
                  
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
                                <option value="PRJ001">Banco Santander Cloud</option>
                                <option value="PRJ002">Mercadona E-Commerce</option>
                                <option value="PRJ003">Telefónica IoT Analytics</option>
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
                    <div key={cp.id} className="border border-slate-150 rounded-xl p-3 bg-slate-50/30">
                      <div className="flex justify-between items-start border-b border-slate-100 pb-2 mb-2">
                        <div>
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider bg-slate-200 px-1 py-0.5 rounded">
                            {cp.reviewType} Review
                          </span>
                          <h4 className="text-xs font-bold text-slate-900 mt-1">
                            {emp ? `${emp.name} ${emp.surname}` : 'Colaborador Genérico'}
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
                              return (
                                <span key={s.competencyId} className={`text-[10px] border px-2 py-0.5 rounded-full font-semibold flex items-center gap-1.5 ${
                                  isMet ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-rose-50 text-rose-800 border-rose-200'
                                }`}>
                                  <span>{compName}:</span>
                                  <strong className="font-bold text-slate-950">{s.score}</strong>
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
                });
              })()}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
