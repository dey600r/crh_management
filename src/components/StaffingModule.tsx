import React, { useState, useEffect } from 'react';
import { 
  Plus, Users, Briefcase, Zap, ChevronRight, Sparkles, ShieldAlert, FileText, X, Eye, EyeOff, RefreshCw, Flame, Filter, AlertTriangle, Building2
} from 'lucide-react';
import { Project, ProjectRoleRequest, Employee, UserRole, RoleCriticality, ROLE_CRITICALITY_META, STANDARD_DIVISIONS } from '../types';
import { MarkdownView } from './MarkdownView';
import EmployeeCVPanel from './EmployeeCVPanel';
import EmployeeRecognitionIcons from './EmployeeRecognitionIcons';

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
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<ProjectRoleRequest | null>(null);
  const [matchingCandidates, setMatchingCandidates] = useState<any[]>([]);
  const [isMatchingLoading, setIsMatchingLoading] = useState(false);

  // IA Explanation states (cached per request + candidate, hideable without losing content)
  const [explainingKey, setExplainingKey] = useState<string | null>(null);
  const [aiExplanations, setAiExplanations] = useState<Record<string, string>>({});
  const [aiErrors, setAiErrors] = useState<Record<string, string>>({});
  const [aiReportOpen, setAiReportOpen] = useState<Record<string, boolean>>({});
  const [cvEmployee, setCvEmployee] = useState<Employee | null>(null);

  // Forms states
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProject, setNewProject] = useState({
    projectId: '',
    clientName: '',
    projectName: '',
    businessUnit: 'IT Consulting',
    division: 'Software Engineering',
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
    priority: 'High' as 'High' | 'Medium' | 'Low',
    criticality: 'Medium' as RoleCriticality
  });

  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    surname: '',
    email: '',
    country: 'España',
    office: 'Madrid',
    department: 'Software Engineering',
    currentCareerPathId: 'P_SWE',
    currentLevelId: 'L3',
    managerId: 'E004',
    skills: '',
    availabilityPercent: 100
  });

  // Fetch match results whenever selected request changes (without clearing cached AI reports)
  useEffect(() => {
    if (selectedRequest) {
      fetchMatches(selectedRequest.id);
    } else {
      setMatchingCandidates([]);
    }
  }, [selectedRequest?.id, employees]);

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
          division: 'Software Engineering',
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
        setNewRequest({
          projectId: selectedProjectId || '',
          careerPathId: 'P_SWE',
          requiredLevelId: 'L3',
          requiredSkills: '',
          allocation: 100,
          priority: 'High',
          criticality: 'Medium'
        });
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.name || !newEmployee.surname) return;

    // Generate a unique ID based on existing IDs
    const currentIds = employees.map(emp => {
      const match = emp.employeeId.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    });
    const maxId = currentIds.length > 0 ? Math.max(...currentIds) : 6;
    const nextIdNum = maxId + 1;
    const employeeId = `E${String(nextIdNum).padStart(3, '0')}`;

    // Generate email if not custom specified
    const cleanName = newEmployee.name.toLowerCase().trim().replace(/\s+/g, '.');
    const cleanSurname = newEmployee.surname.toLowerCase().trim().replace(/\s+/g, '.');
    const generatedEmail = newEmployee.email || `${cleanName}.${cleanSurname}@itconsulting.com`;

    // Parse skills
    const parsedSkills = newEmployee.skills
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map((skillName, index) => ({
        skillId: `s_${Date.now()}_${index}`,
        name: skillName,
        category: 'General',
        level: 3,
        validatedDate: new Date().toISOString().split('T')[0],
        source: 'Self'
      }));

    const employeePayload = {
      employeeId,
      name: newEmployee.name.trim(),
      surname: newEmployee.surname.trim(),
      email: generatedEmail,
      country: newEmployee.country,
      office: newEmployee.office,
      department: newEmployee.department,
      division: newEmployee.department,
      managerId: newEmployee.managerId || 'E004',
      careerManagerId: newEmployee.managerId || 'E004',
      currentCareerPathId: newEmployee.currentCareerPathId,
      currentLevelId: newEmployee.currentLevelId,
      hireDate: new Date().toISOString().split('T')[0],
      status: 'Active' as const,
      availabilityPercent: Number(newEmployee.availabilityPercent) || 100,
      skills: parsedSkills,
      certifications: [],
      projectHistory: []
    };

    try {
      const res = await fetch('/api/employees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(employeePayload)
      });
      if (res.ok) {
        onDataRefresh();
        setShowAddEmployee(false);
        // reset form
        setNewEmployee({
          name: '',
          surname: '',
          email: '',
          country: 'España',
          office: 'Madrid',
          department: 'Software Engineering',
          currentCareerPathId: 'P_SWE',
          currentLevelId: 'L3',
          managerId: 'E004',
          skills: '',
          availabilityPercent: 100
        });
      } else {
        const errorData = await res.json();
        alert(`Error al guardar colaborador: ${errorData.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error de red al registrar el colaborador.');
    }
  };

  const handleRequestAIExplanation = async (candidate: any, forceRefresh = false) => {
    if (!selectedRequest) return;
    const reportKey = `${selectedRequest.id}::${candidate.employeeId}`;

    // If cached and not forcing refresh, toggle visibility or open without re-fetching
    if (!forceRefresh && aiExplanations[reportKey]) {
      setAiReportOpen(prev => ({ ...prev, [reportKey]: true }));
      return;
    }

    setExplainingKey(reportKey);
    setAiErrors(prev => {
      const next = { ...prev };
      delete next[reportKey];
      return next;
    });
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
            criticalityFitScore: candidate.criticalityFitScore,
            autonomyScore: candidate.autonomyScore,
            criticalitySignals: candidate.criticalitySignals,
            sameDivision: candidate.sameDivision,
            projectDivision: candidate.projectDivision,
            candidateDivision: candidate.candidateDivision,
            globalScore: candidate.globalScore
          }
        })
      });
      if (res.ok) {
        const data = await res.json();
        setAiExplanations(prev => ({ ...prev, [reportKey]: data.explanation }));
        setAiReportOpen(prev => ({ ...prev, [reportKey]: true }));
      } else {
        const errData = await res.json();
        setAiErrors(prev => ({ ...prev, [reportKey]: errData.error || 'Error invocando a Gemini.' }));
      }
    } catch (e: any) {
      setAiErrors(prev => ({ ...prev, [reportKey]: 'Error de red al conectar con el servidor.' }));
    } finally {
      setExplainingKey(null);
    }
  };

  const toggleReportVisibility = (reportKey: string, open?: boolean) => {
    setAiReportOpen(prev => ({
      ...prev,
      [reportKey]: open !== undefined ? open : !prev[reportKey]
    }));
  };

  const handleSelectProject = (projectId: string) => {
    const nextProjectId = selectedProjectId === projectId ? null : projectId;
    setSelectedProjectId(nextProjectId);
    if (nextProjectId && selectedRequest && selectedRequest.projectId !== nextProjectId) {
      setSelectedRequest(null);
    }
  };

  const handleToggleAddRequest = () => {
    const nextOpen = !showAddRequest;
    setShowAddRequest(nextOpen);
    if (nextOpen && selectedProjectId) {
      setNewRequest(prev => ({ ...prev, projectId: selectedProjectId }));
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

  // Stats & derived filters
  const availableDivisions = Array.from(
    new Set([
      ...STANDARD_DIVISIONS,
      ...projects.map(p => p.division).filter((d): d is string => Boolean(d && d.trim())),
      ...employees.map(e => e.division || e.department).filter((d): d is string => Boolean(d && d.trim()))
    ])
  );

  const filteredRoleRequests = selectedProjectId
    ? roleRequests.filter(r => r.projectId === selectedProjectId)
    : roleRequests;
  const selectedProjectObj = selectedProjectId
    ? projects.find(p => p.projectId === selectedProjectId) || null
    : null;

  const activeRequestsCount = roleRequests.length;
  const onBenchCount = employees.filter(e => e.availabilityPercent === 100 && e.status === 'Active').length;
  const benchRate = Math.round((onBenchCount / employees.length) * 100) || 0;

  const isStaffingAuthorized = userRole === 'RRHH' || userRole === 'ProjectManager';

  const getCriticalityBadgeStyle = (crit?: RoleCriticality) => {
    switch (crit) {
      case 'Critical':
        return 'bg-rose-100 text-rose-800 border border-rose-200';
      case 'High':
        return 'bg-orange-100 text-orange-800 border border-orange-200';
      case 'Low':
        return 'bg-slate-100 text-slate-600 border border-slate-200';
      case 'Medium':
      default:
        return 'bg-sky-50 text-sky-700 border border-sky-200';
    }
  };

  const getCriticalityLabel = (crit?: RoleCriticality) => {
    const key: RoleCriticality = crit && crit in ROLE_CRITICALITY_META ? crit : 'Medium';
    return ROLE_CRITICALITY_META[key].label;
  };

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
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-slate-500" />
                  Catálogo de Proyectos
                </h3>
                {selectedProjectId && (
                  <button
                    type="button"
                    onClick={() => setSelectedProjectId(null)}
                    className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-1.5 py-0.5 rounded inline-flex items-center gap-1 transition"
                    title="Mostrar necesidades de todos los proyectos"
                  >
                    Ver todos <X className="h-2.5 w-2.5" />
                  </button>
                )}
              </div>
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
                    <label className="text-[10px] font-bold text-slate-500 uppercase">División *</label>
                    <select
                      value={newProject.division}
                      onChange={e => setNewProject({...newProject, division: e.target.value})}
                      className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                      required
                    >
                      {availableDivisions.map(div => (
                        <option key={div} value={div}>{div}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Línea Negocio</label>
                    <input
                      type="text"
                      value={newProject.businessUnit}
                      onChange={e => setNewProject({...newProject, businessUnit: e.target.value})}
                      className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Presupuesto (€)</label>
                    <input
                      type="number"
                      value={newProject.budget}
                      onChange={e => setNewProject({...newProject, budget: Number(e.target.value)})}
                      className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Tecnologías (comas)</label>
                    <input
                      type="text"
                      placeholder="React, AWS, Node.js"
                      value={newProject.technologies}
                      onChange={e => setNewProject({...newProject, technologies: e.target.value})}
                      className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                    />
                  </div>
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
              {projects.map((p) => {
                const isProjectSelected = selectedProjectId === p.projectId;
                const projectReqCount = roleRequests.filter(r => r.projectId === p.projectId).length;
                return (
                  <div
                    key={p.projectId}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isProjectSelected}
                    onClick={() => handleSelectProject(p.projectId)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleSelectProject(p.projectId);
                      }
                    }}
                    className={`p-3 cursor-pointer transition focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-indigo-500 ${
                      isProjectSelected
                        ? 'bg-indigo-50/80 border-l-4 border-indigo-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-bold">
                            {p.projectId}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">
                            {projectReqCount} {projectReqCount === 1 ? 'necesidad' : 'necesidades'}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-900 mt-1">{p.projectName}</h4>
                        <p className="text-[11px] text-slate-500">Cliente: {p.clientName} | BU: {p.businessUnit}</p>
                        {p.division && (
                          <p className="text-[10px] text-indigo-700 font-semibold mt-0.5 inline-flex items-center gap-1">
                            <Building2 className="h-3 w-3 text-indigo-500" />
                            División: {p.division}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          p.status === 'Active' ? 'bg-emerald-50 text-emerald-700' :
                          p.status === 'InPreparation' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {p.status}
                        </span>
                        {isProjectSelected && (
                          <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded inline-flex items-center gap-1">
                            <Filter className="h-2.5 w-2.5" /> Filtrando
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {p.technologies.map(t => (
                        <span key={t} className="text-[9px] bg-slate-100 text-slate-700 px-1.5 rounded">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
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
                  onClick={handleToggleAddRequest}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                >
                  <Plus className="h-3 w-3" /> Nueva Solicitud
                </button>
              )}
            </div>

            {selectedProjectObj && (
              <div className="px-4 py-2 bg-indigo-50/70 border-b border-indigo-100 flex items-center justify-between gap-2 text-[11px]">
                <span className="text-indigo-900 font-medium truncate">
                  <Filter className="h-3 w-3 inline mr-1 text-indigo-600" />
                  Proyecto: <strong className="font-bold">{selectedProjectObj.projectName}</strong> ({filteredRoleRequests.length})
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedProjectId(null)}
                  className="text-indigo-700 hover:text-indigo-900 font-semibold shrink-0 inline-flex items-center gap-0.5"
                >
                  Ver todas <X className="h-3 w-3" />
                </button>
              </div>
            )}

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
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Dedicación (%)</label>
                    <input
                      type="number"
                      min="10"
                      max="100"
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
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Criticidad</label>
                    <select
                      value={newRequest.criticality}
                      onChange={e => setNewRequest({...newRequest, criticality: e.target.value as RoleCriticality})}
                      className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                    >
                      <option value="Low">Baja</option>
                      <option value="Medium">Media</option>
                      <option value="High">Alta</option>
                      <option value="Critical">Crítica</option>
                    </select>
                  </div>
                </div>
                <p className="text-[10px] text-slate-500 leading-snug">
                  {ROLE_CRITICALITY_META[newRequest.criticality].description}
                </p>
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
              {filteredRoleRequests.length === 0 ? (
                <div className="p-6 text-center space-y-2">
                  <p className="text-xs text-slate-500">
                    No hay necesidades de staffing registradas para este proyecto.
                  </p>
                  {isStaffingAuthorized && (
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedProjectId) {
                          setNewRequest(prev => ({ ...prev, projectId: selectedProjectId }));
                        }
                        setShowAddRequest(true);
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Crear solicitud para este proyecto
                    </button>
                  )}
                </div>
              ) : (
                filteredRoleRequests.map((req) => {
                  const isSelected = selectedRequest?.id === req.id;
                  const associatedProject = projects.find(p => p.projectId === req.projectId);
                  const reqCrit = req.criticality || 'Medium';
                  return (
                    <div
                      key={req.id}
                      onClick={() => setSelectedRequest(req)}
                      className={`p-3 cursor-pointer transition ${
                        isSelected ? 'bg-indigo-50/70 border-l-4 border-indigo-600' : 'hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900">
                            {careerPaths.find(p => p.id === req.careerPathId)?.name}
                          </h4>
                          <p className="text-[11px] text-indigo-700 font-semibold">{associatedProject?.projectName}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Nivel: <span className="text-slate-700 font-medium">{careerLevels.find(l => l.id === req.requiredLevelId)?.name}</span>
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                            req.priority === 'High' ? 'bg-red-50 text-red-700' :
                            req.priority === 'Medium' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                          }`}>
                            Prio: {req.priority}
                          </span>
                          <span
                            title={ROLE_CRITICALITY_META[reqCrit].description}
                            className={`text-[9px] font-bold px-1.5 py-0.5 rounded inline-flex items-center gap-1 ${getCriticalityBadgeStyle(reqCrit)}`}
                          >
                            {(reqCrit === 'Critical' || reqCrit === 'High') && (
                              <Flame className="h-2.5 w-2.5" />
                            )}
                            Criticidad: {getCriticalityLabel(reqCrit)}
                          </span>
                        </div>
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
                })
              )}
            </div>
          </div>

          {/* Plantilla de Colaboradores Card */}
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="h-4 w-4 text-slate-500" />
                Plantilla de Colaboradores ({employees.length})
              </h3>
              {isStaffingAuthorized && (
                <button
                  id="add-employee-btn"
                  onClick={() => setShowAddEmployee(!showAddEmployee)}
                  className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition"
                >
                  <Plus className="h-3 w-3" /> Nuevo Colaborador
                </button>
              )}
            </div>

            {showAddEmployee && (
              <form onSubmit={handleCreateEmployee} className="p-4 bg-slate-50 border-b border-slate-200 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nombre *</label>
                    <input
                      type="text"
                      placeholder="Juan"
                      value={newEmployee.name}
                      onChange={e => setNewEmployee({...newEmployee, name: e.target.value})}
                      className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Apellidos *</label>
                    <input
                      type="text"
                      placeholder="Pérez Gómez"
                      value={newEmployee.surname}
                      onChange={e => setNewEmployee({...newEmployee, surname: e.target.value})}
                      className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Email (Opcional)</label>
                    <input
                      type="email"
                      placeholder="juan.perez@itconsulting.com"
                      value={newEmployee.email}
                      onChange={e => setNewEmployee({...newEmployee, email: e.target.value})}
                      className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">División / Departamento</label>
                    <select
                      value={newEmployee.department}
                      onChange={e => setNewEmployee({...newEmployee, department: e.target.value})}
                      className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                    >
                      {availableDivisions.map(div => (
                        <option key={div} value={div}>{div}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Path de Carrera</label>
                    <select
                      value={newEmployee.currentCareerPathId}
                      onChange={e => setNewEmployee({...newEmployee, currentCareerPathId: e.target.value})}
                      className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                    >
                      {careerPaths.map(cp => (
                        <option key={cp.id} value={cp.id}>{cp.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Nivel de Entrada</label>
                    <select
                      value={newEmployee.currentLevelId}
                      onChange={e => setNewEmployee({...newEmployee, currentLevelId: e.target.value})}
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
                    <label className="text-[10px] font-bold text-slate-500 uppercase">País</label>
                    <input
                      type="text"
                      value={newEmployee.country}
                      onChange={e => setNewEmployee({...newEmployee, country: e.target.value})}
                      className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Oficina</label>
                    <input
                      type="text"
                      value={newEmployee.office}
                      onChange={e => setNewEmployee({...newEmployee, office: e.target.value})}
                      className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Disponibilidad (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newEmployee.availabilityPercent}
                      onChange={e => setNewEmployee({...newEmployee, availabilityPercent: Number(e.target.value)})}
                      className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Supervisor / Manager</label>
                    <select
                      value={newEmployee.managerId}
                      onChange={e => setNewEmployee({...newEmployee, managerId: e.target.value})}
                      className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                    >
                      {employees.filter(emp => ['L4', 'L5', 'L6'].includes(emp.currentLevelId)).map(mgr => (
                        <option key={mgr.employeeId} value={mgr.employeeId}>{mgr.name} {mgr.surname}</option>
                      ))}
                      <option value="E004">Daniela Vega Soler (Por defecto)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase">Skills Iniciales (separadas por comas)</label>
                  <input
                    type="text"
                    placeholder="React, AWS, Node.js"
                    value={newEmployee.skills}
                    onChange={e => setNewEmployee({...newEmployee, skills: e.target.value})}
                    className="w-full text-xs border border-slate-300 rounded p-1 bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white rounded text-xs py-1.5 font-semibold hover:bg-indigo-700 transition"
                >
                  Registrar Colaborador
                </button>
              </form>
            )}

            <div className="divide-y divide-slate-100 max-h-[300px] overflow-y-auto">
              {employees.map((emp) => {
                const pathName = careerPaths.find(p => p.id === emp.currentCareerPathId)?.name || 'Especialista';
                const levelName = careerLevels.find(l => l.id === emp.currentLevelId)?.name || 'Consultor';
                const availColor = 
                  emp.availabilityPercent >= 80 ? 'text-emerald-700 bg-emerald-50' :
                  emp.availabilityPercent >= 30 ? 'text-amber-700 bg-amber-50' :
                  'text-slate-600 bg-slate-100';

                return (
                  <div key={emp.employeeId} className="p-3 hover:bg-slate-50 transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1 py-0.5 rounded font-bold">
                          {emp.employeeId}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 mt-1 inline-flex items-center gap-1.5">
                          <span>{emp.name} {emp.surname}</span>
                          <EmployeeRecognitionIcons employee={emp} size="xs" />
                        </h4>
                        <p className="text-[11px] text-slate-500">{pathName} | <span className="font-semibold">{levelName}</span></p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{emp.email}</p>
                      </div>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${availColor}`}>
                        Disp: {emp.availabilityPercent}%
                      </span>
                    </div>
                    {emp.skills && emp.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {emp.skills.map(s => (
                          <span key={s.skillId || s.name} className="text-[9px] bg-slate-100 text-slate-700 px-1.5 rounded">
                            {s.name}
                          </span>
                        ))}
                      </div>
                    )}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex justify-end">
                      <button
                        type="button"
                        onClick={() => setCvEmployee(emp)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 transition-colors whitespace-nowrap shrink-0"
                      >
                        <FileText className="h-3 w-3" />
                        Ver Ficha CV
                      </button>
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
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Búsqueda Activa</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded inline-flex items-center gap-1 ${getCriticalityBadgeStyle(selectedRequest.criticality)}`}
                        >
                          {(selectedRequest.criticality === 'Critical' || selectedRequest.criticality === 'High') && (
                            <Flame className="h-3 w-3" />
                          )}
                          Criticidad {getCriticalityLabel(selectedRequest.criticality)}
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-0.5">
                        {careerPaths.find(p => p.id === selectedRequest.careerPathId)?.name}
                      </h3>
                      {(() => {
                        const activePrj = projects.find(p => p.projectId === selectedRequest.projectId);
                        return (
                          <div className="flex items-center gap-2 flex-wrap mt-0.5">
                            <p className="text-xs text-slate-500">
                              Proyecto: <strong className="text-slate-700">{activePrj?.projectName}</strong>
                            </p>
                            {activePrj?.division && (
                              <span
                                title="Se prioriza ligeramente a colaboradores pertenecientes a esta división"
                                className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200 px-1.5 py-0.5 rounded inline-flex items-center gap-1"
                              >
                                <Building2 className="h-3 w-3" />
                                División: {activePrj.division}
                              </span>
                            )}
                          </div>
                        );
                      })()}
                    </div>
                    <button
                      onClick={() => setSelectedRequest(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 shrink-0"
                    >
                      Cerrar
                    </button>
                  </div>
                </div>

                {isMatchingLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-2" />
                    <p className="text-xs text-slate-500">Calculando compatibilidad técnica, disponibilidad, evaluaciones y autonomía...</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider text-slate-500">
                        Colaboradores Sugeridos (Ordenados por Afinidad Global)
                      </h4>

                      <div className="space-y-3">
                        {matchingCandidates.map((c) => {
                          const reportKey = `${selectedRequest.id}::${c.employeeId}`;
                          const isExplaining = explainingKey === reportKey;
                          const cachedReport = aiExplanations[reportKey];
                          const isReportOpen = Boolean(aiReportOpen[reportKey]);
                          const reportError = aiErrors[reportKey];

                          // color coding global score
                          const scoreColor = 
                            c.globalScore >= 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-200' :
                            c.globalScore >= 60 ? 'text-amber-700 bg-amber-50 border-amber-200' :
                            'text-rose-700 bg-rose-50 border-rose-200';

                          return (
                            <div key={c.employeeId} className="border border-slate-200 rounded-lg p-3 hover:shadow-sm transition bg-slate-50/50">
                              <div className="flex justify-between items-start gap-3">
                                <div className="space-y-0.5">
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <h5 className="text-xs font-bold text-slate-900 inline-flex items-center gap-1.5">
                                      <span>{c.employee.name} {c.employee.surname}</span>
                                      <EmployeeRecognitionIcons employee={c.employee} size="xs" />
                                    </h5>
                                    {(() => {
                                      const candidateDiv = c.candidateDivision || c.employee.division || c.employee.department;
                                      const isDifferentDivision = Boolean(
                                        c.projectDivision &&
                                          c.sameDivision === false &&
                                          candidateDiv
                                      );
                                      if (!isDifferentDivision) return null;
                                      return (
                                        <span
                                          title={
                                            c.crossDivisionGoodMatch
                                              ? `Buen encaje para el rol, pero pertenece a la división "${candidateDiv}" (proyecto en "${c.projectDivision}")`
                                              : `Pertenece a la división "${candidateDiv}" (proyecto en "${c.projectDivision}")`
                                          }
                                          className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300"
                                        >
                                          <AlertTriangle className="h-3 w-3 text-amber-700 shrink-0" />
                                          Otra división: {candidateDiv}
                                        </span>
                                      );
                                    })()}
                                  </div>
                                  <p className="text-[11px] text-slate-500">
                                    Nivel: <strong className="text-slate-700">{careerLevels.find(l => l.id === c.employee.currentLevelId)?.name}</strong>
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
                              <div className="grid grid-cols-5 gap-2 mt-3 pt-2 border-t border-slate-100 text-center">
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
                                <div title="Puntuación de idoneidad para puestos críticos: Alto Potencial, Evaluaciones Anuales y Autonomía">
                                  <span className="text-[9px] font-bold text-slate-400 block uppercase">Auton./Crit.</span>
                                  <span className={`text-xs font-semibold ${
                                    (c.criticalityFitScore ?? 0) >= 75 ? 'text-indigo-700' : 'text-slate-700'
                                  }`}>
                                    {c.criticalityFitScore ?? c.performanceScore}%
                                  </span>
                                </div>
                              </div>

                              {/* Criticality signals */}
                              {Array.isArray(c.criticalitySignals) && c.criticalitySignals.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                  {c.criticalitySignals.map((sig: string) => {
                                    const isWarning = sig.startsWith('Eval. baja');
                                    const isTalent = sig === 'Alto Potencial' || sig === 'Key person';
                                    return (
                                      <span
                                        key={sig}
                                        className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                                          isWarning
                                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                            : isTalent
                                            ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                            : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                                        }`}
                                      >
                                        {sig}
                                      </span>
                                    );
                                  })}
                                </div>
                              )}

                              {/* Action Bar */}
                              <div className="flex justify-end gap-2 mt-4 pt-2 border-t border-slate-100">
                                {cachedReport ? (
                                  <button
                                    type="button"
                                    onClick={() => toggleReportVisibility(reportKey)}
                                    className="flex items-center gap-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold px-2.5 py-1 rounded border border-indigo-200 hover:bg-indigo-100 transition"
                                  >
                                    {isReportOpen ? (
                                      <>
                                        <EyeOff className="h-3 w-3" /> Ocultar Informe (IA)
                                      </>
                                    ) : (
                                      <>
                                        <Eye className="h-3 w-3" /> Ver Informe (IA)
                                      </>
                                    )}
                                  </button>
                                ) : (
                                  <button
                                    type="button"
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
                                )}
                                {isStaffingAuthorized && (
                                  <button
                                    onClick={() => handleAssignCandidate(c)}
                                    className="flex items-center gap-1 bg-indigo-600 text-white text-[10px] font-bold px-2.5 py-1 rounded hover:bg-indigo-700 transition"
                                  >
                                    Asignar a Proyecto
                                  </button>
                                )}
                              </div>

                              {/* Display IA explanation inside candidate card if generated and currently open */}
                              {cachedReport && isReportOpen && (
                                <div className="mt-4 bg-indigo-50/50 border border-indigo-200 rounded-lg p-3 space-y-2">
                                  <div className="flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900">
                                      <Sparkles className="h-4 w-4 text-indigo-600 shrink-0" />
                                      Informe de Idoneidad Generado por Gemini AI
                                    </div>
                                    <div className="flex items-center gap-1 shrink-0">
                                      <button
                                        type="button"
                                        onClick={() => handleRequestAIExplanation(c, true)}
                                        disabled={isExplaining}
                                        title="Regenerar informe con Gemini AI"
                                        className="p-1 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-100 rounded transition disabled:opacity-50"
                                      >
                                        <RefreshCw className={`h-3.5 w-3.5 ${isExplaining ? 'animate-spin' : ''}`} />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => toggleReportVisibility(reportKey, false)}
                                        aria-label="Ocultar informe de idoneidad"
                                        title="Ocultar informe (mantiene el contenido generado)"
                                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 px-1.5 py-0.5 rounded transition"
                                      >
                                        <X className="h-3.5 w-3.5" />
                                        <span>Ocultar</span>
                                      </button>
                                    </div>
                                  </div>
                                  <div className="bg-white border border-slate-200/50 rounded-md p-3 max-h-[250px] overflow-y-auto">
                                    <MarkdownView content={cachedReport} />
                                  </div>
                                </div>
                              )}

                              {reportError && (
                                <div className="mt-3 bg-red-50 text-red-700 border border-red-200 text-xs rounded p-2 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-1.5">
                                    <ShieldAlert className="h-4 w-4 shrink-0" />
                                    <span>{reportError}</span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setAiErrors(prev => {
                                        const next = { ...prev };
                                        delete next[reportKey];
                                        return next;
                                      })
                                    }
                                    aria-label="Cerrar error"
                                    className="text-red-500 hover:text-red-800 p-0.5 rounded"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
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

      {/* Modal Ficha CV del Colaborador */}
      {cvEmployee && (() => {
        const activeCvEmployee =
          employees.find(e => e.employeeId === cvEmployee.employeeId) || cvEmployee;
        return (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Ficha CV de ${activeCvEmployee.name} ${activeCvEmployee.surname}`}
            className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4"
            onClick={() => setCvEmployee(null)}
          >
            <div
              className="w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-xl shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <EmployeeCVPanel
                employee={activeCvEmployee}
                careerPaths={careerPaths}
                careerLevels={careerLevels}
                projects={projects}
                onClose={() => setCvEmployee(null)}
              />
            </div>
          </div>
        );
      })()}
    </div>
  );
}
