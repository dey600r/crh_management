import React, { useState, useEffect } from 'react';
import { 
  Plus, Users, Briefcase, Zap, HelpCircle, CheckCircle2, AlertCircle, ChevronRight, Sparkles, ShieldAlert 
} from 'lucide-react';
import { Project, ProjectRoleRequest, Employee, UserRole } from '../types';
import { MarkdownView } from './MarkdownView';

interface StaffingModuleProps {
  userRole: UserRole;
  employees: Employee[];
  projects: Project[];
  roleRequests: ProjectRoleRequest[];
  careerPaths: any[];
  careerLevels: any[];
  onDataRefresh: () => void;
}

export default function StaffingModule({
  userRole,
  employees,
  projects,
  roleRequests,
  careerPaths,
  careerLevels,
  onDataRefresh
}: StaffingModuleProps) {
  // Selection States
  const [selectedRequest, setSelectedRequest] = useState<ProjectRoleRequest | null>(null);
  const [matchingCandidates, setMatchingCandidates] = useState<any[]>([]);
  const [isMatchingLoading, setIsMatchingLoading] = useState(false);

  // IA Explanation states
  const [explainingId, setExplainingId] = useState<string | null>(null);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Forms states
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState({
    projectId: '',
    clientName: '',
    projectName: '',
    businessUnit: 'IT Consulting',
    budget: 250000,
    technologies: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '2027-12-31'
  });

  const [showAddRequest, setShowAddRequest] = useState(false);
  const [newRequest, setNewRequest] = useState({
    projectId: '',
    careerPathId: 'P_SWE',
    requiredLevelId: 'L3',
    requiredSkills: '',
    allocation: 100,
    priority: 'High' as 'High' | 'Medium' | 'Low'
  });

  // Fetch match results whenever selected request changes
  useEffect(() => {
    if (selectedRequest) {
      fetchMatches(selectedRequest.id);
    } else {
      setMatchingCandidates([]);
    }
    setAiExplanation(null);
    setAiError(null);
  }, [selectedRequest, employees]);

  const fetchMatches = async (reqId: string) => {
    setIsMatchingLoading(true);
    try {
      const res = await fetch(`/api/matching/${reqId}`);
      if (res.ok) {
        const data = await res.json();
        setMatchingCandidates(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsMatchingLoading(false);
    }
  };

  // Form Submissions
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProject.projectId || !newProject.projectName) return;
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newProject,
          technologies: newProject.technologies.split(',').map(t => t.trim()).filter(Boolean)
        })
      });
      if (res.ok) {
        onDataRefresh();
        setShowAddProject(false);
        // reset form
        setNewProject({
          projectId: '',
          clientName: '',
          projectName: '',
          businessUnit: 'IT Consulting',
          budget: 250000,
          technologies: '',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '2027-12-31'
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRequest.projectId) return;
    try {
      const res = await fetch('/api/role-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRequest,
          requiredSkills: newRequest.requiredSkills.split(',').map(s => s.trim()).filter(Boolean)
        })
      });
      if (res.ok) {
        onDataRefresh();
        setShowAddRequest(false);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestAIExplanation = async (candidate: any) => {
    setExplainingId(candidate.employeeId);
    setAiExplanation(null);
    setAiError(null);
    try {
      const res = await fetch('/api/ai/match-explanation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employee: candidate.employee,
          request: selectedRequest,
          scoreBreakdown: {
            skillScore: candidate.skillScore,
            levelScore: candidate.levelScore,
            availabilityScore: candidate.availabilityScore,
            performanceScore: candidate.performanceScore,
            globalScore: candidate.globalScore
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiExplanation(data.explanation);
      } else {
        const errData = await res.json();
        setAiError(errData.error || 'Error invocando a Gemini.');
      }
    } catch (e: any) {
      setAiError('Error de red al conectar con el servidor.');
    } finally {
      setExplainingId(null);
    }
  };

  const handleAssignCandidate = async (candidate: any) => {
    if (!selectedRequest) return;
    const confirmAssign = window.confirm(`¿Estás seguro de asignar a ${candidate.employee.name} ${candidate.employee.surname} a este proyecto? Esto actualizará su disponibilidad.`);
    if (!confirmAssign) return;

    try {
      const prj = projects.find(p => p.projectId === selectedRequest.projectId);
      const res = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: candidate.employeeId,
          projectId: selectedRequest.projectId,
          role: `${careerPaths.find(p => p.id === selectedRequest.careerPathId)?.name || 'Especialista'} (${careerLevels.find(l => l.id === selectedRequest.requiredLevelId)?.name || 'Senior'})`,
          allocationPercent: selectedRequest.allocation,
          startDate: selectedRequest.startDate,
          endDate: prj?.endDate || ''
        })
      });

      if (res.ok) {
        alert('Asignación realizada con éxito. Se ha actualizado la disponibilidad de la plantilla.');
        onDataRefresh();
        setSelectedRequest(null);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Stats
  const activeRequestsCount = roleRequests.length;
  const onBenchCount = employees.filter(e => e.availabilityPercent === 100 && e.status === 'Active').length;
  const benchRate = Math.round((onBenchCount / employees.length) * 100) || 0;

  const isStaffingAuthorized = userRole === 'RRHH' || userRole === 'ResourceManager' || userRole === 'ProjectManager';

  return (
    <div id="staffing-module" className="space-y-6">
      {/* Overview Metric Widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Necesidades de Staffing</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{activeRequestsCount} Roles</span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-lg">
            <Briefcase className="h-6 w-6" />
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Colaboradores en Bench (100% Libres)</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{onBenchCount} personas</span>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg">
            <Users className="h-6 w-6" />
          </div>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Tasa de Disponibilidad Total</span>
            <span className="text-2xl font-bold text-slate-900 mt-1 block">{benchRate}% de la plantilla</span>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
            <Zap className="h-6 w-6" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Projects and Requests */}
        <div className="lg:col-span-5 space-y-6">
          {/* Projects Card */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-slate-500" />
                Catálogo de Proyectos
              </h3>
              {isStaffingAuthorized && (
                <button
                  id="add-project-btn"
                  onClick={() => setShowAddProject(!showAddProject)}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                >
                  <Plus className="h-3 w-3" /> Nuevo Proyecto
                </button>
              )}
            </div>

            {showAddProject && (
              <form onSubmit={handleCreateProject} className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Cód. Proyecto *</label>
                    <input
                      type="text"
                      placeholder="PRJ004"
                      value={newProject.projectId}
                      onChange={e => setNewProject({...newProject, projectId: e.target.value})}
                      className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Cliente *</label>
                    <input
                      type="text"
                      placeholder="Iberdrola"
                      value={newProject.clientName}
                      onChange={e => setNewProject({...newProject, clientName: e.target.value})}
                      className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre Proyecto *</label>
                  <input
                    type="text"
                    placeholder="E-Billing Architecture Transformation"
                    value={newProject.projectName}
                    onChange={e => setNewProject({...newProject, projectName: e.target.value})}
                    className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Línea Negocio</label>
                    <input
                      type="text"
                      value={newProject.businessUnit}
                      onChange={e => setNewProject({...newProject, businessUnit: e.target.value})}
                      className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Presupuesto (€)</label>
                    <input
                      type="number"
                      value={newProject.budget}
                      onChange={e => setNewProject({...newProject, budget: Number(e.target.value)})}
                      className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Tecnologías (separadas por comas)</label>
                  <input
                    type="text"
                    placeholder="React, AWS, Node.js"
                    value={newProject.technologies}
                    onChange={e => setNewProject({...newProject, technologies: e.target.value})}
                    className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white rounded text-xs py-1.5 font-semibold hover:bg-indigo-700 transition"
                >
                  Guardar Proyecto
                </button>
              </form>
            )}

            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
              {projects.map((p) => (
                <div key={p.projectId} className="p-3 hover:bg-slate-50 transition">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-bold">
                        {p.projectId}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 mt-1">{p.projectName}</h4>
                      <p className="text-[11px] text-slate-500">Cliente: {p.clientName} | BU: {p.businessUnit}</p>
                    </div>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      p.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                      p.status === 'InPreparation' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {p.technologies.map(t => (
                      <span key={t} className="text-[9px] bg-slate-100 text-slate-700 px-1.5 rounded">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Role Requests Card */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-indigo-500" />
                Necesidades de Personal (Staffing)
              </h3>
              {isStaffingAuthorized && (
                <button
                  id="add-request-btn"
                  onClick={() => setShowAddRequest(!showAddRequest)}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                >
                  <Plus className="h-3 w-3" /> Nueva Solicitud
                </button>
              )}
            </div>

            {showAddRequest && (
              <form onSubmit={handleCreateRequest} className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Selecciona Proyecto *</label>
                  <select
                    value={newRequest.projectId}
                    onChange={e => setNewRequest({...newRequest, projectId: e.target.value})}
                    className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                    required
                  >
                    <option value="">-- Elige Proyecto --</option>
                    {projects.map(p => (
                      <option key={p.projectId} value={p.projectId}>{p.projectName}</option>
                    ))}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Path de Carrera</label>
                    <select
                      value={newRequest.careerPathId}
                      onChange={e => setNewRequest({...newRequest, careerPathId: e.target.value})}
                      className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                    >
                      {careerPaths.map(cp => (
                        <option key={cp.id} value={cp.id}>{cp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nivel Requerido</label>
                    <select
                      value={newRequest.requiredLevelId}
                      onChange={e => setNewRequest({...newRequest, requiredLevelId: e.target.value})}
                      className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                    >
                      {careerLevels.map(cl => (
                        <option key={cl.id} value={cl.id}>{cl.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Dedicación (%)</label>
                    <input
                      type="number"
                      value={newRequest.allocation}
                      onChange={e => setNewRequest({...newRequest, allocation: Number(e.target.value)})}
                      className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Prioridad</label>
                    <select
                      value={newRequest.priority}
                      onChange={e => setNewRequest({...newRequest, priority: e.target.value as any})}
                      className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                    >
                      <option value="High">Alta</option>
                      <option value="Medium">Media</option>
                      <option value="Low">Baja</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Skills Requeridas (comas)</label>
                  <input
                    type="text"
                    placeholder="React, TypeScript, AWS"
                    value={newRequest.requiredSkills}
                    onChange={e => setNewRequest({...newRequest, requiredSkills: e.target.value})}
                    className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white rounded text-xs py-1.5 font-semibold hover:bg-indigo-700 transition"
                >
                  Publicar Solicitud de Staffing
                </button>
              </form>
            )}

            <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto">
              {roleRequests.map((req) => {
                const isSelected = selectedRequest?.id === req.id;
                const associatedProject = projects.find(p => p.projectId === req.projectId);
                return (
                  <div
                    key={req.id}
                    onClick={() => setSelectedRequest(req)}
                    className={`p-3 cursor-pointer transition ${
                      isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="text-xs font-bold text-slate-900">
                          {careerPaths.find(p => p.id === req.careerPathId)?.name}
                        </h4>
                        <p className="text-[11px] text-indigo-700 font-semibold">{associatedProject?.projectName}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Nivel: <span className="text-slate-700 font-medium">{careerLevels.find(l => l.id === req.requiredLevelId)?.name}</span>
                        </p>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        req.priority === 'High' ? 'bg-red-50 text-red-700' :
                        req.priority === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {req.priority}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1 mt-2">
                      {req.requiredSkills.map(s => (
                        <span key={s} className="text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.2 rounded-full font-medium">
                          {s}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 mt-2.5 pt-2 border-t border-slate-100">
                      <span>Asignación: <strong className="text-slate-700">{req.allocation}%</strong></span>
                      <span className="text-indigo-600 font-semibold flex items-center gap-0.5">
                        Buscar Matches <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column: Matching Results & AI Expert Report */}
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 min-h-[500px]">
            {!selectedRequest ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 my-auto">
                <Users className="h-12 w-12 mb-3 text-slate-300" />
                <h3 className="text-sm font-bold text-slate-800">Matching de Talento Inteligente</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Selecciona una necesidad de personal de la izquierda para analizar de forma objetiva la base de colaboradores disponibles.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="border-b border-slate-100 pb-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block">Búsqueda Activa</span>
                      <h3 className="text-base font-bold text-slate-900">
                        {careerPaths.find(p => p.id === selectedRequest.careerPathId)?.name}
                      </h3>
                      <p className="text-xs text-slate-500">
                        Proyecto: {projects.find(p => p.projectId === selectedRequest.projectId)?.projectName}
                      </p>
                    </div>
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>

                {isMatchingLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2" />
                    <p className="text-xs text-slate-500">Calculando compatibilidad técnica, disponibilidad y desempeño...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider text-slate-500">
                        Colaboradores Sugeridos (Ordenados por Afinidad Global)
                      </h4>

                      <div className="space-y-3">
                        {matchingCandidates.map((c) => {
                          const isExplaining = explainingId === c.employeeId;
                          const showCurrentExpt = explainingId === c.employeeId || aiExplanation;

                          // color coding global score
                          const scoreColor = 
                            c.globalScore >= 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                            c.globalScore >= 60 ? 'text-amber-700 bg-amber-50 border-amber-200' :
                            'text-rose-700 bg-rose-50 border-rose-200';

                          return (
                            <div key={c.employeeId} className="border border-slate-200 rounded-lg p-3 hover:shadow-sm transition bg-slate-50/50">
                              <div className="flex justify-between items-start gap-3">
                                <div className="space-y-0.5">
                                  <h5 className="text-xs font-bold text-slate-900">
                                    {c.employee.name} {c.employee.surname}
                                  </h5>
                                  <p className="text-[11px] text-slate-500">
                                    Nivel: <strong className="text-slate-700">{careerLevels.find(l => l.id === c.employee.currentLevelId)?.name}</strong> | Depto: {c.employee.department}
                                  </p>
                                  <p className="text-[11px] text-slate-500">
                                    Disponibilidad Actual: <strong className="text-emerald-600">{c.employee.availabilityPercent}%</strong>
                                  </p>
                                </div>

                                <div className={`flex flex-col items-center justify-center px-2.5 py-1 rounded-md border ${scoreColor}`}>
                                  <span className="text-[9px] uppercase font-bold tracking-wider opacity-80">Match</span>
                                  <span className="text-sm font-bold">{c.globalScore}%</span>
                                </div>
                              </div>

                              {/* Breakdown of algorithms */}
                              <div className="grid grid-cols-4 gap-2 mt-3 pt-2 border-t border-slate-100 text-center">
                                <div>
                                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Skills</span>
                                  <span className="text-xs font-semibold text-slate-700">{c.skillScore}%</span>
                                </div>
                                <div>
                                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Nivel</span>
                                  <span className="text-xs font-semibold text-slate-700">{c.levelScore}%</span>
                                </div>
                                <div>
                                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Disp.</span>
                                  <span className="text-xs font-semibold text-slate-700">{c.availabilityScore}%</span>
                                </div>
                                <div>
                                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Desempeño</span>
                                  <span className="text-xs font-semibold text-slate-700">{c.performanceScore}%</span>
                                </div>
                              </div>

                              {/* Action Bar */}
                              <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-slate-100">
                                <button
                                  onClick={() => handleRequestAIExplanation(c)}
                                  disabled={isExplaining}
                                  className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded border border-indigo-100 hover:bg-indigo-100 transition disabled:opacity-50"
                                >
                                  {isExplaining ? (
                                    <>
                                      <div className="animate-spin h-3 w-3 border-b-2 border-indigo-700 rounded-full" />
                                      Analizando...
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="h-3 w-3" /> Explicar Match (IA)
                                    </>
                                  )}
                                </button>
                                {isStaffingAuthorized && (
                                  <button
                                    onClick={() => handleAssignCandidate(c)}
                                    className="flex items-center gap-1 bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-1 rounded hover:bg-indigo-700 transition"
                                  >
                                    Asignar a Proyecto
                                  </button>
                                )}
                              </div>

                              {/* Display IA explanation inside candidate card if specifically requested for this candidate */}
                              {explainingId === null && aiExplanation && (
                                <div className="mt-4 bg-indigo-50/50 border border-indigo-100 rounded-lg p-3 space-y-2">
                                  <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                                    <Sparkles className="h-4 w-4 text-indigo-600" />
                                    Informe de Idoneidad Generado por Gemini AI
                                  </div>
                                  <div className="bg-white border border-slate-200/50 rounded-md p-3 max-h-[250px] overflow-y-auto">
                                    <MarkdownView content={aiExplanation} />
                                  </div>
                                </div>
                              )}

                              {aiError && (
                                <div className="mt-3 bg-red-50 text-red-700 border border-red-200 text-xs rounded p-2 flex items-center gap-1.5">
                                  <ShieldAlert className="h-4 w-4 shrink-0" />
                                  {aiError}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
