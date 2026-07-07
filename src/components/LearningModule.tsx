import React, { useState, useEffect } from 'react';
import { 
  BookOpen, Target, Calendar, Award, Plus, Sparkles, CheckCircle, HelpCircle, ChevronRight, User, GraduationCap, ClipboardCheck
} from 'lucide-react';
import { Employee, TrainingCatalog, DevelopmentPlan, CheckpointReview, UserRole } from '../types';
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
  }, [selectedEmpId]);

  // Initializing scores form for checkpoint
  useEffect(() => {
    if (competencies.length > 0) {
      setNewCheckpoint(prev => ({
        ...prev,
        scores: competencies.map(c => ({ competencyId: c.id, score: 4, comments: 'Cumple lo esperado.' }))
      }));
    }
  }, [competencies, showAddCheckpoint]);

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

  const isCheckpointAuthorized = userRole === 'RRHH' || userRole === 'ProjectManager' || userRole === 'ResourceManager';

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

            {showAddCheckpoint && (
              <form onSubmit={handleCreateCheckpoint} className="p-4 bg-slate-50 border border-slate-200 rounded-xl mb-4 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 border-b pb-1">Registrar Evaluación Continua</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Colaborador *</label>
                    <select
                      value={newCheckpoint.employeeId}
                      onChange={e => setNewCheckpoint({...newCheckpoint, employeeId: e.target.value})}
                      className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
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
                      className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
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
                      className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
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
                  <span className="text-[10px] font-bold text-slate-500 uppercase block">Competencias del Nivel (Escala 1 a 5)</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {competencies.map((comp) => {
                      const scoreObj = newCheckpoint.scores.find(s => s.competencyId === comp.id);
                      return (
                        <div key={comp.id} className="flex items-center justify-between bg-white border p-1.5 rounded text-xs">
                          <span className="truncate max-w-[150px] font-medium text-slate-700">{comp.name}</span>
                          <input
                            type="number"
                            min="1"
                            max="5"
                            value={scoreObj?.score || 4}
                            onChange={e => updateCompetencyScore(comp.id, Number(e.target.value))}
                            className="w-12 text-center border rounded font-semibold text-slate-900 p-0.5"
                          />
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
                      <div key={k.kpi} className="bg-white border p-2 rounded text-xs space-y-1">
                        <span className="font-semibold text-slate-800 block text-center">{k.kpi}</span>
                        <div className="flex items-center justify-between text-[10px]">
                          <span>Meta:</span>
                          <input
                            type="number"
                            step="0.1"
                            value={k.targetValue}
                            onChange={e => updateKPIValue(idx, 'targetValue', Number(e.target.value))}
                            className="w-10 text-center border rounded"
                          />
                        </div>
                        <div className="flex items-center justify-between text-[10px]">
                          <span>Real:</span>
                          <input
                            type="number"
                            step="0.1"
                            value={k.currentValue}
                            onChange={e => updateKPIValue(idx, 'currentValue', Number(e.target.value))}
                            className="w-10 text-center border rounded font-bold text-indigo-600"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comments */}
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Comentarios Generales del Desempeño</label>
                  <textarea
                    placeholder="Escribe comentarios objetivos, evidencias técnicas y feedback de entrega..."
                    value={newCheckpoint.comments}
                    onChange={e => setNewCheckpoint({...newCheckpoint, comments: e.target.value})}
                    className="w-full text-xs border border-slate-300 rounded p-1 bg-white h-16"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white font-bold rounded text-xs py-1.5 hover:bg-indigo-700 transition"
                >
                  Registrar Checkpoint Oficial
                </button>
              </form>
            )}

            <div className="space-y-4">
              {checkpoints.map((cp) => {
                const emp = employees.find(e => e.employeeId === cp.employeeId);
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
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500">Evaluador ID: {cp.reviewerId}</span>
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
                            <div key={k.id} className="text-[10px] flex items-center justify-between bg-white p-1 rounded border border-slate-100">
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
                        <span className="text-[9px] font-bold text-slate-500 uppercase block mb-1.5">Competencias Puntuadas</span>
                        <div className="flex flex-wrap gap-1">
                          {cp.scores.map(s => (
                            <span key={s.competencyId} className="text-[10px] bg-indigo-50 text-indigo-800 border border-indigo-100 px-2 py-0.5 rounded-full font-semibold">
                              {competencies.find(c => c.id === s.competencyId)?.name || s.competencyId}: <strong className="text-indigo-950 font-bold">{s.score}</strong>
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
