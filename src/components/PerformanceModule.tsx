import { useState } from 'react';
import { 
  Award, ShieldCheck, FileText, CheckCircle, HelpCircle, ArrowRight, Sparkles, Send, AlertTriangle, Scale, Lock, Plus, Users
} from 'lucide-react';
import { AnnualEvaluation, Employee, CheckpointReview, UserRole } from '../types';
import { MarkdownView } from './MarkdownView';

interface PerformanceModuleProps {
  userRole: UserRole;
  employees: Employee[];
  evaluations: AnnualEvaluation[];
  checkpoints: CheckpointReview[];
  careerLevels: any[];
  careerPaths: any[];
  competencies: any[];
  onDataRefresh: () => void;
}

export default function PerformanceModule({
  userRole,
  employees,
  evaluations,
  checkpoints,
  careerLevels,
  careerPaths,
  competencies,
  onDataRefresh
}: PerformanceModuleProps) {
  const [selectedEval, setSelectedEval] = useState<AnnualEvaluation | null>(null);

  // IA draft states
  const [isDraftingLoading, setIsDraftingLoading] = useState(false);
  const [aiDraftMarkdown, setAiDraftMarkdown] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);

  // Edit states
  const [managerComment, setManagerComment] = useState('');
  const [hrComment, setHrComment] = useState('');

  // Handle Dimension Score Updates
  const handleUpdateDimensionScore = async (dimId: string, newScore: number) => {
    if (!selectedEval) return;
    
    // Clamp score to 1-5
    const clampedScore = Math.max(1, Math.min(5, Number(newScore)));
    
    const updatedDimensions = selectedEval.dimensions.map(d => {
      if (d.id === dimId) {
        return { ...d, score: clampedScore };
      }
      return d;
    });

    // Recalculate final score using weights
    let weightedSum = 0;
    updatedDimensions.forEach(d => {
      weightedSum += d.score * (d.weight / 100);
    });
    const newFinalScore = Number(weightedSum.toFixed(2));

    // Determine result based on finalScore
    let result: 'Unsatisfactory' | 'MeetsExpectations' | 'ExceedsExpectations' | 'Outstanding' | 'Promoted' = 'MeetsExpectations';
    if (newFinalScore >= 4.5) {
      result = 'Outstanding';
    } else if (newFinalScore >= 4.0) {
      result = 'ExceedsExpectations';
    } else if (newFinalScore >= 3.0) {
      result = 'MeetsExpectations';
    } else {
      result = 'Unsatisfactory';
    }

    try {
      const res = await fetch(`/api/annual-evaluations/${selectedEval.evaluationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dimensions: updatedDimensions,
          finalScore: newFinalScore,
          evaluationResult: result
        })
      });
      if (res.ok) {
        onDataRefresh();
        const updated = await res.json();
        setSelectedEval(updated);
      }
    } catch (err) {
      console.error('Error updating dimension score:', err);
    }
  };

  // Handle Starting a new Annual Evaluation
  const handleCreateEvaluation = async (empId: string) => {
    const emp = employees.find(e => e.employeeId === empId);
    if (!emp) return;

    const newLvlNum = parseInt(emp.currentLevelId.replace('L', '')) || 1;
    const nextLvlNum = Math.min(6, newLvlNum + 1);
    const targetLevelId = `L${nextLvlNum}`;

    const newEvalPayload = {
      employeeId: empId,
      year: 2025,
      currentLevelId: emp.currentLevelId,
      targetLevelId: targetLevelId,
      status: 'Draft' as const,
      finalScore: 3.0,
      evaluationResult: 'MeetsExpectations' as const,
      dimensions: [
        { id: `d_comp_${Date.now()}`, dimension: 'Competencies', weight: 40, score: 3.0 },
        { id: `d_perf_${Date.now()}`, dimension: 'ProjectPerformance', weight: 30, score: 3.0 },
        { id: `d_train_${Date.now()}`, dimension: 'Training', weight: 15, score: 3.0 },
        { id: `d_f360_${Date.now()}`, dimension: 'Feedback360', weight: 10, score: 3.0 },
        { id: `d_corp_${Date.now()}`, dimension: 'CorporateContribution', weight: 5, score: 3.0 }
      ],
      competencies: [
        { id: `c_c1_${Date.now()}`, competencyId: 'CLIENT_ORIENTATION', expectedStage: 'B', actualStage: 'B', score: 3.0, gap: 0 },
        { id: `c_c2_${Date.now()}`, competencyId: 'INNOVATION', expectedStage: 'B', actualStage: 'B', score: 3.0, gap: 0 },
        { id: `c_c3_${Date.now()}`, competencyId: 'HUMAN_RELATIONS', expectedStage: 'B', actualStage: 'B', score: 3.0, gap: 0 },
        { id: `c_c4_${Date.now()}`, competencyId: 'TEAM_LEADERSHIP', expectedStage: 'A', actualStage: 'B', score: 3.0, gap: 0 },
        { id: `c_c5_${Date.now()}`, competencyId: 'ORGANIZATION_RESULTS', expectedStage: 'B', actualStage: 'B', score: 3.0, gap: 0 },
        { id: `c_c6_${Date.now()}`, competencyId: 'PROFESSIONAL_OPENNESS', expectedStage: 'B', actualStage: 'B', score: 3.0, gap: 0 }
      ],
      commentsManager: 'Ciclo de evaluación iniciado por el Manager.',
      commentsHR: '',
      promotionRecommendation: {
        ready: false,
        reason: 'Pendiente de calibración.'
      }
    };

    try {
      const res = await fetch('/api/annual-evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvalPayload)
      });
      if (res.ok) {
        onDataRefresh();
        alert(`Ciclo de evaluación anual iniciado correctamente para ${emp.name} ${emp.surname}.`);
      }
    } catch (err) {
      console.error('Error starting evaluation cycle:', err);
    }
  };

  // Formula constants
  const FORMULA = [
    { label: 'Competencias de Nivel', weight: 40, color: 'bg-indigo-600' },
    { label: 'Desempeño de Proyectos (KPIs)', weight: 30, color: 'bg-emerald-500' },
    { label: 'Formación y Certificaciones', weight: 15, color: 'bg-amber-500' },
    { label: 'Feedback 360', weight: 10, color: 'bg-blue-500' },
    { label: 'Contribución Corporativa', weight: 5, color: 'bg-rose-500' }
  ];

  const handleSelectEval = (ev: AnnualEvaluation) => {
    setSelectedEval(ev);
    setAiDraftMarkdown(null);
    setDraftError(null);
    setManagerComment(ev.commentsManager || '');
    setHrComment(ev.commentsHR || '');
  };

  const handleUpdateStatus = async (newStatus: 'Draft' | 'ManagerReview' | 'Calibration' | 'HRReview' | 'Approved' | 'Closed') => {
    if (!selectedEval) return;
    try {
      const res = await fetch(`/api/annual-evaluations/${selectedEval.evaluationId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          commentsManager: managerComment,
          commentsHR: hrComment
        })
      });
      if (res.ok) {
        alert(`Estado de la evaluación actualizado a: ${newStatus}`);
        onDataRefresh();
        // update local select state too
        const updated = await res.json();
        setSelectedEval(updated);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDraftAIEvaluation = async () => {
    if (!selectedEval) return;
    const emp = employees.find(e => e.employeeId === selectedEval.employeeId);
    if (!emp) return;

    setIsDraftingLoading(true);
    setAiDraftMarkdown(null);
    setDraftError(null);

    // filter checkpoints for this employee
    const empCheckpoints = checkpoints.filter(c => c.employeeId === emp.employeeId);

    try {
      const res = await fetch('/api/ai/draft-evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee: emp,
          evaluation: selectedEval,
          checkpoints: empCheckpoints
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiDraftMarkdown(data.draft);
      } else {
        const err = await res.json();
        setDraftError(err.error || 'Error redactando la evaluación.');
      }
    } catch (e) {
      setDraftError('Error al conectar con el servidor de inteligencia artificial.');
    } finally {
      setIsDraftingLoading(false);
    }
  };

  const isHR = userRole === 'RRHH';
  const isManager = userRole === 'ProjectManager' || userRole === 'RRHH';

  return (
    <div id="performance-module" className="space-y-6">
      
      {/* Weighted Score Formula Rules Panel */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 border border-slate-700 rounded-2xl p-5 text-white shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-xs text-indigo-400 font-bold uppercase tracking-wider block">Estándar IT Consulting</span>
            <h3 className="text-base font-bold flex items-center gap-2 mt-1">
              <Scale className="h-5 w-5 text-indigo-400" />
              Fórmula Oficial de Evaluación y Coordinación de Calibración
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              Garantizamos la máxima objetividad ponderando múltiples fuentes. El ciclo pasa de los borradores del Manager a la Calibración de RRHH para evitar disparidades de notas.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {FORMULA.map(f => (
              <span key={f.label} className="text-[10px] bg-white/10 px-2 py-1 rounded border border-white/10 font-medium">
                {f.label}: <strong className="text-indigo-300">{f.weight}%</strong>
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Annual Evaluations Table */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              Ciclo Anual de Evaluación 2025
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Selecciona una fila para evaluar dimensiones, comparar contra comités de calibración y generar informes por IA.
            </p>

            <div className="space-y-3">
              {evaluations.map((ev) => {
                const emp = employees.find(e => e.employeeId === ev.employeeId);
                const isSelected = selectedEval?.evaluationId === ev.evaluationId;
                
                // Color codes for results
                const badgeColor = 
                  ev.status === 'Closed' ? 'bg-slate-100 text-slate-700' :
                  ev.status === 'Approved' ? 'bg-emerald-100 text-emerald-800' :
                  ev.status === 'Calibration' ? 'bg-purple-100 text-purple-800' :
                  'bg-amber-100 text-amber-800';

                return (
                  <button
                    key={ev.evaluationId}
                    id={`eval-row-${ev.evaluationId}`}
                    onClick={() => handleSelectEval(ev)}
                    className={`w-full text-left p-3.5 rounded-xl border text-xs transition space-y-2 flex flex-col ${
                      isSelected ? 'bg-indigo-50/75 border-indigo-300 ring-1 ring-indigo-500' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex justify-between items-start w-full">
                      <div>
                        <div className="font-bold text-slate-950 text-xs">
                          {emp ? `${emp.name} ${emp.surname}` : 'Colaborador Genérico'}
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {careerPaths.find(p => p.id === emp?.currentCareerPathId)?.name}
                        </div>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${badgeColor}`}>
                        {ev.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-slate-200/50 w-full">
                      <div>
                        Nivel: <strong className="text-slate-700">{careerLevels.find(l => l.id === ev.currentLevelId)?.levelCode}</strong>
                        <span className="text-slate-300 mx-1">→</span>
                        Objetivo: <strong className="text-indigo-600">{careerLevels.find(l => l.id === ev.targetLevelId)?.levelCode}</strong>
                      </div>
                      <div className="font-bold text-indigo-700">
                        Score: {ev.finalScore}/5
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card: Colaboradores sin Evaluación Activa */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4">
            <h3 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
              <Users className="h-4 w-4 text-indigo-600" />
              Colaboradores sin Evaluación Anual ({employees.filter(emp => !evaluations.some(ev => ev.employeeId === emp.employeeId)).length})
            </h3>
            <p className="text-xs text-slate-500 mb-3">
              Estos colaboradores están registrados en la plantilla pero no tienen abierto un expediente para el ciclo actual. Haz clic en "Iniciar" para abrir su proceso.
            </p>
            {employees.filter(emp => !evaluations.some(ev => ev.employeeId === emp.employeeId)).length === 0 ? (
              <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-lg border border-slate-150">
                Todos los colaboradores tienen un proceso de evaluación abierto.
              </p>
            ) : (
              <div className="space-y-2 max-h-[250px] overflow-y-auto">
                {employees
                  .filter(emp => !evaluations.some(ev => ev.employeeId === emp.employeeId))
                  .map((emp) => (
                    <div key={emp.employeeId} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <div>
                        <span className="text-[10px] font-mono bg-slate-200 text-slate-700 px-1 py-0.5 rounded font-bold mr-1">
                          {emp.employeeId}
                        </span>
                        <strong className="text-slate-900">{emp.name} {emp.surname}</strong>
                        <div className="text-[10px] text-slate-500">
                          {careerPaths.find(p => p.id === emp.currentCareerPathId)?.name || 'Especialista'} | {careerLevels.find(l => l.id === emp.currentLevelId)?.levelCode}
                        </div>
                      </div>
                      <button
                        onClick={() => handleCreateEvaluation(emp.employeeId)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-[10px] px-2.5 py-1 rounded transition flex items-center gap-0.5"
                      >
                        <Plus className="h-3 w-3" /> Iniciar
                      </button>
                    </div>
                  ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Deep Score Evaluation Report Card */}
        <div className="lg:col-span-7 space-y-6">
          {!selectedEval ? (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-8 text-center text-slate-400 min-h-[500px] flex flex-col justify-center items-center">
              <Award className="h-12 w-12 mb-3 text-slate-300" />
              <h3 className="text-sm font-bold text-slate-800">Tarjeta de Calibración de Desempeño</h3>
              <p className="text-xs text-slate-500 max-w-sm mt-1">
                Haz clic en una ficha de evaluación anual para abrir el calibrador grupal, revisar objetivos por peso y redactar feedbacks por IA.
              </p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-6">
              {/* Header card info */}
              <div className="border-b border-slate-100 pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Expediente de Calibración 2025</span>
                    <h3 className="text-base font-bold text-slate-900">
                      {employees.find(e => e.employeeId === selectedEval.employeeId)?.name} {employees.find(e => e.employeeId === selectedEval.employeeId)?.surname}
                    </h3>
                    <p className="text-xs text-slate-500">
                      Fase Actual del Proceso: <span className="text-indigo-700 font-semibold">{selectedEval.status}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedEval(null)}
                    className="text-xs text-slate-400 hover:text-slate-600"
                  >
                    Cerrar
                  </button>
                </div>
              </div>

              {/* Dimensions Breakdown Slider view */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider text-slate-500">
                  Desglose de Dimensiones de la Evaluación (Ponderación Real)
                </h4>
                <div className="space-y-3">
                  {selectedEval.dimensions.map((dim) => {
                    const formulaDef = FORMULA.find(f => f.label.toLowerCase().includes(dim.dimension.toLowerCase().substring(0, 5))) || FORMULA[0];
                    const canEdit = userRole === 'RRHH' || userRole === 'ProjectManager';
                    
                    return (
                      <div key={dim.id} className="bg-slate-50 border border-slate-150 rounded-lg p-2.5">
                        <div className="flex justify-between items-center text-xs mb-1">
                          <span className="font-semibold text-slate-800">{dim.dimension}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-medium">
                              Peso: {dim.weight}% | Score:
                            </span>
                            {canEdit && selectedEval.status !== 'Closed' ? (
                              <input
                                type="number"
                                min="1.0"
                                max="5.0"
                                step="0.1"
                                value={dim.score}
                                onChange={(e) => handleUpdateDimensionScore(dim.id, Number(e.target.value))}
                                className="w-14 text-xs font-bold text-indigo-600 bg-white border border-slate-300 rounded px-1 text-center py-0.5 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                              />
                            ) : (
                              <strong className="text-indigo-600">{dim.score}/5</strong>
                            )}
                          </div>
                        </div>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className={`${formulaDef.color} h-full rounded-full`} 
                            style={{ width: `${(dim.score / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Checkpoints Continuos del Colaborador */}
              <div className="border-t border-slate-100 pt-4">
                <h4 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider text-slate-500">
                  Historial de Checkpoints de Rendimiento (Evaluación Continua)
                </h4>
                {checkpoints.filter(chk => chk.employeeId === selectedEval.employeeId).length === 0 ? (
                  <div className="text-xs text-slate-500 italic bg-slate-50 p-4 rounded-xl border border-slate-150 space-y-1">
                    <p className="font-semibold text-slate-700">No hay checkpoints continuos registrados aún.</p>
                    <p className="text-[11px] text-slate-400">Puedes registrar checkpoints en la sección "Desarrollo y Checkpoints" para que sirvan de base para calibrar esta evaluación.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {checkpoints
                      .filter(chk => chk.employeeId === selectedEval.employeeId)
                      .map((chk) => (
                        <div key={chk.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5 shadow-xs">
                          <div className="flex justify-between items-center border-b border-slate-200/50 pb-1.5">
                            <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase tracking-wider">
                              {chk.reviewType} • {chk.reviewDate}
                            </span>
                            <span className="text-[10px] text-slate-500 font-medium">
                              Proyecto: <strong className="text-slate-700">{chk.projectId}</strong>
                            </span>
                          </div>
                          
                          {chk.comments && (
                            <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-150 leading-relaxed">
                              "{chk.comments}"
                            </p>
                          )}

                          {/* Checkpoint Scores and KPIs breakdown */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            {chk.scores && chk.scores.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Competencias del Checkpoint</span>
                                <div className="space-y-1">
                                  {chk.scores.map(sc => {
                                    const compName = competencies.find(c => c.id === sc.competencyId)?.name || sc.competencyId;
                                    return (
                                      <div key={sc.competencyId} className="text-[10px] flex justify-between items-center bg-white px-2 py-1 rounded border border-slate-150">
                                        <span className="text-slate-500 truncate max-w-[130px] font-medium">{compName}</span>
                                        <strong className="text-indigo-600 font-bold bg-indigo-50 px-1 py-0.5 rounded">{sc.score}/5</strong>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {chk.kpis && chk.kpis.length > 0 && (
                              <div className="space-y-1">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">KPIs Medidos</span>
                                <div className="space-y-1">
                                  {chk.kpis.map(kp => (
                                    <div key={kp.id || kp.kpi} className="text-[10px] flex justify-between items-center bg-white px-2 py-1 rounded border border-slate-150">
                                      <span className="text-slate-500 truncate font-medium">{kp.kpi}</span>
                                      <span className="font-semibold">
                                        <strong className="text-emerald-600">{kp.currentValue}</strong> <span className="text-slate-300">/</span> <span className="text-slate-400">{kp.targetValue}</span>
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {/* Promo recommendation */}
              <div className="bg-indigo-50 border border-indigo-150 rounded-lg p-3">
                <h5 className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                  <Award className="h-4 w-4 text-indigo-600" />
                  Dictamen de Promoción del Framework
                </h5>
                <p className="text-xs text-indigo-900 mt-1 font-semibold">
                  Apto para promoción: <span className={selectedEval.promotionRecommendation.ready ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                    {selectedEval.promotionRecommendation.ready ? 'SÍ, RECOMENDADO' : 'NO, EN CONSOLIDACIÓN'}
                  </span>
                </p>
                <p className="text-[11px] text-indigo-700/80 mt-1">
                  Motivo: {selectedEval.promotionRecommendation.reason}
                </p>
              </div>

              {/* AI Draft Assist Action button */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500">
                    Borrador de Carta de Feedback (Generador IA)
                  </h4>
                  <button
                    onClick={handleDraftAIEvaluation}
                    disabled={isDraftingLoading}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3 py-1.5 rounded flex items-center gap-1.5 transition disabled:opacity-50"
                  >
                    {isDraftingLoading ? (
                      <>
                        <div className="animate-spin h-3.5 w-3.5 border-b-2 border-white rounded-full" />
                        Redactando...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-3.5 w-3.5" /> Borrador por Gemini AI
                      </>
                    )}
                  </button>
                </div>

                {aiDraftMarkdown && (
                  <div className="bg-indigo-50/30 border border-indigo-150 rounded-xl p-4 max-h-[250px] overflow-y-auto">
                    <MarkdownView content={aiDraftMarkdown} />
                  </div>
                )}

                {draftError && (
                  <div className="bg-red-50 text-red-700 border border-red-200 text-xs rounded p-2">
                    {draftError}
                  </div>
                )}
              </div>

              {/* Status Update & Calibration Comments (Sync between Manager and HR) */}
              <div className="border-t border-slate-100 pt-4 space-y-4">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider text-slate-500">
                  Comentarios y Alineación del Comité (Manager vs RRHH)
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Notas de Desempeño (Manager)</label>
                    <textarea
                      placeholder="Escribe comentarios justificando la nota técnica..."
                      value={managerComment}
                      onChange={e => setManagerComment(e.target.value)}
                      disabled={selectedEval.status === 'Closed' || !isManager}
                      className="w-full border rounded p-1.5 bg-white text-xs h-20 disabled:bg-slate-50"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Notas de Calibración (RRHH)</label>
                    <textarea
                      placeholder="Escribe comentarios justificando alineación grupal..."
                      value={hrComment}
                      onChange={e => setHrComment(e.target.value)}
                      disabled={selectedEval.status === 'Closed' || !isHR}
                      className="w-full border rounded p-1.5 bg-white text-xs h-20 disabled:bg-slate-50"
                    />
                  </div>
                </div>

                {/* Workflow Transitions */}
                {selectedEval.status !== 'Closed' && isManager && (
                  <div className="flex flex-wrap gap-2 justify-end pt-2">
                    {selectedEval.status === 'Draft' && (
                      <button
                        onClick={() => handleUpdateStatus('ManagerReview')}
                        className="bg-amber-600 text-white font-semibold text-xs px-3 py-1.5 rounded hover:bg-amber-700 transition"
                      >
                        Enviar a Revisión de Manager
                      </button>
                    )}
                    {selectedEval.status === 'ManagerReview' && (
                      <button
                        onClick={() => handleUpdateStatus('Calibration')}
                        className="bg-purple-600 text-white font-semibold text-xs px-3 py-1.5 rounded hover:bg-purple-700 transition"
                      >
                        Enviar a Calibración Grupal
                      </button>
                    )}
                    {selectedEval.status === 'Calibration' && isHR && (
                      <button
                        onClick={() => handleUpdateStatus('HRReview')}
                        className="bg-indigo-600 text-white font-semibold text-xs px-3 py-1.5 rounded hover:bg-indigo-700 transition"
                      >
                        Avanzar a Revisión de RRHH
                      </button>
                    )}
                    {selectedEval.status === 'HRReview' && isHR && (
                      <button
                        onClick={() => handleUpdateStatus('Approved')}
                        className="bg-emerald-600 text-white font-semibold text-xs px-3 py-1.5 rounded hover:bg-emerald-700 transition"
                      >
                        Aprobar Evaluación
                      </button>
                    )}
                    {selectedEval.status === 'Approved' && isHR && (
                      <button
                        onClick={() => handleUpdateStatus('Closed')}
                        className="bg-slate-700 text-white font-semibold text-xs px-3 py-1.5 rounded hover:bg-slate-800 transition"
                      >
                        Cerrar y Publicar
                      </button>
                    )}
                  </div>
                )}

                {selectedEval.status === 'Closed' && (
                  <div className="flex items-center gap-1 text-xs text-slate-500 font-medium justify-center bg-slate-50 border border-slate-150 p-2 rounded">
                    <Lock className="h-4 w-4" />
                    Esta evaluación ha sido calibrada y cerrada de forma definitiva.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
