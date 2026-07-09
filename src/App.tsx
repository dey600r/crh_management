/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  Briefcase, Users, Award, Brain, RefreshCw, Layers, MapPin, Building, Globe 
} from 'lucide-react';
import { 
  Employee, Project, ProjectRoleRequest, ProjectAssignment, CheckpointReview, AnnualEvaluation, DevelopmentPlan, UserRole 
} from './types';
import RoleSwitcher from './components/RoleSwitcher';
import StaffingModule from './components/StaffingModule';
import LearningModule from './components/LearningModule';
import PerformanceModule from './components/PerformanceModule';
import CopilotModule from './components/CopilotModule';

export default function App() {
  const [currentRole, setCurrentRole] = useState<UserRole>('RRHH');
  const [activeTab, setActiveTab] = useState<'staffing' | 'learning' | 'performance' | 'copilot'>('staffing');

  // Unified State
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [roleRequests, setRoleRequests] = useState<ProjectRoleRequest[]>([]);
  const [assignments, setAssignments] = useState<ProjectAssignment[]>([]);
  const [checkpoints, setCheckpoints] = useState<CheckpointReview[]>([]);
  const [annualEvaluations, setAnnualEvaluations] = useState<AnnualEvaluation[]>([]);
  const [devPlans, setDevPlans] = useState<DevelopmentPlan[]>([]);

  // Career framework details
  const [careerPaths, setCareerPaths] = useState<any[]>([]);
  const [careerLevels, setCareerLevels] = useState<any[]>([]);
  const [competencies, setCompetencies] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);

  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Synchronize state from server
  const fetchAllData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [frameworkRes, empRes, prjRes, reqRes, asgRes, chkRes, evalRes, devRes] = await Promise.all([
        fetch('/api/career-framework'),
        fetch('/api/employees'),
        fetch('/api/projects'),
        fetch('/api/role-requests'),
        fetch('/api/assignments'),
        fetch('/api/checkpoints'),
        fetch('/api/annual-evaluations'),
        fetch('/api/dev-plans')
      ]);

      if (frameworkRes.ok && empRes.ok && prjRes.ok && reqRes.ok && asgRes.ok && chkRes.ok && evalRes.ok && devRes.ok) {
        const framework = await frameworkRes.json();
        setCareerPaths(framework.paths);
        setCareerLevels(framework.levels);
        setCompetencies(framework.competencies);
        setTrainings(framework.trainings);

        setEmployees(await empRes.json());
        setProjects(await prjRes.json());
        setRoleRequests(await reqRes.json());
        setAssignments(await asgRes.json());
        setCheckpoints(await chkRes.json());
        setAnnualEvaluations(await evalRes.json());
        setDevPlans(await devRes.json());
      } else {
        setError('Error al recuperar datos del servidor de IT Consulting.');
      }
    } catch (e) {
      setError('No se pudo conectar con el servidor Express backend de CRH Management.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div className="flex h-screen w-screen bg-slate-50 text-slate-900 font-sans overflow-hidden select-none">
      
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 flex flex-col border-r border-slate-800 shrink-0">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3 text-white">
          <div className="bg-blue-600 text-white p-1.5 rounded-lg flex items-center justify-center shadow-md">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-base font-bold tracking-tight text-white">CRH Management</h1>
            <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Talent & Performance Hub</p>
          </div>
        </div>
        
        <nav className="flex-1 py-4 space-y-1">
          <div className="px-6 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Módulos de Talento</div>
          
          <button
            id="tab-staffing"
            onClick={() => setActiveTab('staffing')}
            className={`w-full flex items-center px-6 py-3 text-xs font-semibold transition-all border-l-4 text-left ${
              activeTab === 'staffing'
                ? 'bg-blue-600/10 text-blue-400 border-blue-500'
                : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Briefcase className="h-4 w-4 mr-3" />
            1. Staffing & Matching
          </button>

          <button
            id="tab-learning"
            onClick={() => setActiveTab('learning')}
            className={`w-full flex items-center px-6 py-3 text-xs font-semibold transition-all border-l-4 text-left ${
              activeTab === 'learning'
                ? 'bg-blue-600/10 text-blue-400 border-blue-500'
                : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users className="h-4 w-4 mr-3" />
            2. Desarrollo y Checkpoints
          </button>

          <button
            id="tab-performance"
            onClick={() => setActiveTab('performance')}
            className={`w-full flex items-center px-6 py-3 text-xs font-semibold transition-all border-l-4 text-left ${
              activeTab === 'performance'
                ? 'bg-blue-600/10 text-blue-400 border-blue-500'
                : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Award className="h-4 w-4 mr-3" />
            3. Evaluación y Calibración
          </button>

          <button
            id="tab-copilot"
            onClick={() => setActiveTab('copilot')}
            className={`w-full flex items-center px-6 py-3 text-xs font-semibold transition-all border-l-4 text-left ${
              activeTab === 'copilot'
                ? 'bg-blue-600/10 text-blue-400 border-blue-500'
                : 'border-transparent text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Brain className="h-4 w-4 mr-3 text-indigo-400 animate-pulse" />
            Copiloto de Talento (Chat IA)
          </button>
        </nav>
        
        <div className="p-6 bg-slate-950/50 text-slate-300">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
              {currentRole.substring(0, 2).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-[11px] font-medium leading-tight text-slate-300">Simulador de Rol</span>
              <span className="text-[10px] text-slate-500 font-bold">{currentRole}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Workspace Frame */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 px-8 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center space-x-4">
            <h2 className="text-sm font-semibold text-slate-800">
              {activeTab === 'staffing' && 'Matching Inteligente de Staffing & Bench'}
              {activeTab === 'learning' && 'Desarrollo Profesional & Checkpoints continuos'}
              {activeTab === 'performance' && 'Ciclo de Calibración de Evaluaciones Anuales'}
              {activeTab === 'copilot' && 'Talent Orchestrator (Copiloto IA)'}
            </h2>
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 border-l border-slate-200 pl-4">
              <span className="flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded">
                <Globe className="h-3 w-3 text-slate-400" /> IT Consulting Corp
              </span>
              <span className="flex items-center gap-1 font-medium bg-slate-100 px-2 py-0.5 rounded">
                <Building className="h-3 w-3 text-slate-400" /> Madrid, ES
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-xs text-slate-500 hidden sm:block">
              Ciclo de Calibración: <span className="font-semibold text-blue-600">Q4 2026 - Abierto</span>
            </div>
            <button
              onClick={fetchAllData}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-4 py-2 rounded transition active:scale-95 shadow-sm"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              Sincronizar
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 bg-slate-50">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Simulator role switcher */}
            <RoleSwitcher currentRole={currentRole} onRoleChange={setCurrentRole} />

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-xs text-red-700 flex items-center gap-2">
                <span className="h-2 w-2 bg-red-600 rounded-full animate-pulse shrink-0" />
                {error}
              </div>
            )}

            {/* Content Area */}
            {isLoading && employees.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-200 rounded-2xl shadow-sm text-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 mb-3" />
                <p className="text-xs text-slate-600 font-semibold">Cargando ecosistema de talento corporativo...</p>
                <p className="text-[11px] text-slate-400">Pre-sembrando base de datos en memoria...</p>
              </div>
            ) : (
              <div className="transition-all duration-200">
                {activeTab === 'staffing' && (
                  <StaffingModule
                    userRole={currentRole}
                    employees={employees}
                    projects={projects}
                    roleRequests={roleRequests}
                    careerPaths={careerPaths}
                    careerLevels={careerLevels}
                    onDataRefresh={fetchAllData}
                  />
                )}

                {activeTab === 'learning' && (
                  <LearningModule
                    userRole={currentRole}
                    employees={employees}
                    trainings={trainings}
                    devPlans={devPlans}
                    checkpoints={checkpoints}
                    careerLevels={careerLevels}
                    careerPaths={careerPaths}
                    competencies={competencies}
                    onDataRefresh={fetchAllData}
                  />
                )}

                {activeTab === 'performance' && (
                  <PerformanceModule
                    userRole={currentRole}
                    employees={employees}
                    evaluations={annualEvaluations}
                    checkpoints={checkpoints}
                    careerLevels={careerLevels}
                    careerPaths={careerPaths}
                    competencies={competencies}
                    onDataRefresh={fetchAllData}
                  />
                )}

                {activeTab === 'copilot' && (
                  <CopilotModule />
                )}
              </div>
            )}

          </div>
        </div>
      </main>

    </div>
  );
}
