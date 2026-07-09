import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { dbStoreInstance } from './src/data/dbStore';
import { GoogleGenAI } from '@google/genai';
import { ProjectRoleRequest, CheckpointReview, AnnualEvaluation } from './src/types';

// Lazy-initialized Gemini AI client
let aiInstance: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is required but missing. Please add it via the Secrets Panel.');
    }
    aiInstance = new GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Enable CORS manually for cross-origin hosting (e.g. GitHub Pages)
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Initialize and seed Firestore database if empty
  await dbStoreInstance.initialize();

  // ----------------------------------------------------
  // API ENDPOINTS - DATA CRUD
  // ----------------------------------------------------

  // 1. Career Framework Info
  app.get('/api/career-framework', async (req, res) => {
    try {
      const [families, paths, levels, competencies, trainings] = await Promise.all([
        dbStoreInstance.getCareerFamilies(),
        dbStoreInstance.getCareerPaths(),
        dbStoreInstance.getCareerLevels(),
        dbStoreInstance.getCompetencies(),
        dbStoreInstance.getTrainings()
      ]);
      res.json({
        families,
        paths,
        levels,
        competencies,
        trainings
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 2. Employees Endpoints
  app.get('/api/employees', async (req, res) => {
    try {
      const emps = await dbStoreInstance.getEmployees();
      res.json(emps);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/employees/:id', async (req, res) => {
    try {
      const emp = await dbStoreInstance.getEmployee(req.params.id);
      if (!emp) return res.status(404).json({ error: 'Employee not found' });
      res.json(emp);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/employees', async (req, res) => {
    try {
      const newEmp = req.body;
      if (!newEmp.employeeId || !newEmp.name || !newEmp.surname) {
        return res.status(400).json({ error: 'Missing employee identifier or name properties' });
      }
      const added = await dbStoreInstance.addEmployee({
        ...newEmp,
        skills: newEmp.skills || [],
        certifications: newEmp.certifications || [],
        projectHistory: newEmp.projectHistory || []
      });
      res.status(201).json(added);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/employees/:id/skills', async (req, res) => {
    try {
      const emp = await dbStoreInstance.addEmployeeSkill(req.params.id, req.body);
      if (!emp) return res.status(404).json({ error: 'Employee not found' });
      res.status(201).json(emp);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 3. Projects Endpoints
  app.get('/api/projects', async (req, res) => {
    try {
      const prjs = await dbStoreInstance.getProjects();
      res.json(prjs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/projects', async (req, res) => {
    try {
      const prj = req.body;
      if (!prj.projectId || !prj.projectName) {
        return res.status(400).json({ error: 'Missing projectId or projectName' });
      }
      const added = await dbStoreInstance.addProject({
        projectId: prj.projectId,
        clientName: prj.clientName || 'Cliente Genérico',
        projectName: prj.projectName,
        businessUnit: prj.businessUnit || 'IT Consulting',
        status: prj.status || 'InPreparation',
        startDate: prj.startDate || new Date().toISOString().split('T')[0],
        endDate: prj.endDate || '',
        budget: Number(prj.budget) || 0,
        technologies: prj.technologies || []
      });
      res.status(201).json(added);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 4. Project Role Requests (Staffing Needs)
  app.get('/api/role-requests', async (req, res) => {
    try {
      const rrs = await dbStoreInstance.getRoleRequests();
      res.json(rrs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/role-requests', async (req, res) => {
    try {
      const roleReq: ProjectRoleRequest = req.body;
      if (!roleReq.projectId || !roleReq.careerPathId || !roleReq.requiredLevelId) {
        return res.status(400).json({ error: 'Missing required role request fields' });
      }
      const newReq = {
        ...roleReq,
        id: `REQ_${Date.now()}`
      };
      const added = await dbStoreInstance.addProjectRoleRequest(newReq);
      res.status(201).json(added);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 5. Staffing Assignments
  app.get('/api/assignments', async (req, res) => {
    try {
      const asgs = await dbStoreInstance.getAssignments();
      res.json(asgs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/assignments', async (req, res) => {
    try {
      const asg = req.body;
      if (!asg.employeeId || !asg.projectId) {
        return res.status(400).json({ error: 'Missing employeeId or projectId' });
      }
      const newAsg = {
        assignmentId: `ASG_${Date.now()}`,
        employeeId: asg.employeeId,
        projectId: asg.projectId,
        role: asg.role || 'Consultant',
        allocationPercent: Number(asg.allocationPercent) || 100,
        startDate: asg.startDate || new Date().toISOString().split('T')[0],
        endDate: asg.endDate || ''
      };
      const added = await dbStoreInstance.addProjectAssignment(newAsg);
      res.status(201).json(added);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 6. Matching Results (Staffing Algorithm)
  app.get('/api/matching/:requestId', async (req, res) => {
    try {
      const results = await dbStoreInstance.getMatchingResults(req.params.requestId);
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 7. Checkpoints (Performance Reviews)
  app.get('/api/checkpoints', async (req, res) => {
    try {
      const chks = await dbStoreInstance.getCheckpoints();
      res.json(chks);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/checkpoints', async (req, res) => {
    try {
      const cp: CheckpointReview = req.body;
      if (!cp.employeeId || !cp.projectId || !cp.reviewerId) {
        return res.status(400).json({ error: 'Missing employee, project, or reviewer ID' });
      }
      const newCp = {
        ...cp,
        id: `CK_${Date.now()}`
      };
      const added = await dbStoreInstance.addCheckpoint(newCp);

      // Auto-create an annual evaluation draft if none exists for this employee for 2025
      try {
        const evs = await dbStoreInstance.getAnnualEvaluations();
        const existingEv = evs.find(e => e.employeeId === cp.employeeId);
        if (!existingEv) {
          const emp = await dbStoreInstance.getEmployee(cp.employeeId);
          if (emp) {
            const newLvlNum = parseInt(emp.currentLevelId.replace('L', '')) || 1;
            const nextLvlNum = Math.min(6, newLvlNum + 1);
            const targetLevelId = `L${nextLvlNum}`;
            
            const newEval: AnnualEvaluation = {
              evaluationId: `EV_${Date.now()}`,
              employeeId: cp.employeeId,
              year: 2025,
              currentLevelId: emp.currentLevelId,
              targetLevelId: targetLevelId,
              status: 'Draft',
              finalScore: 3.0,
              evaluationResult: 'MeetsExpectations',
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
              commentsManager: 'Evaluación inicial auto-generada tras registro de checkpoint continuo.',
              commentsHR: '',
              promotionRecommendation: {
                ready: false,
                reason: 'Pendiente de calibración.'
              }
            };
            await dbStoreInstance.addAnnualEvaluation(newEval);
          }
        }
      } catch (err) {
        console.error('Error auto-creating evaluation draft on checkpoint:', err);
      }

      res.status(201).json(added);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/checkpoints/:id', async (req, res) => {
    try {
      const id = req.params.id;
      const updated = await dbStoreInstance.updateCheckpoint(id, req.body);
      if (!updated) {
        return res.status(404).json({ error: 'Checkpoint not found' });
      }
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 8. Annual Evaluations
  app.get('/api/annual-evaluations', async (req, res) => {
    try {
      const evs = await dbStoreInstance.getAnnualEvaluations();
      res.json(evs);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/annual-evaluations/:id', async (req, res) => {
    try {
      const updated = await dbStoreInstance.updateAnnualEvaluation(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Evaluation not found' });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/annual-evaluations', async (req, res) => {
    try {
      const val: AnnualEvaluation = req.body;
      if (!val.employeeId) {
        return res.status(400).json({ error: 'Missing employeeId' });
      }
      const newVal: AnnualEvaluation = {
        ...val,
        evaluationId: `EV_${Date.now()}`
      };
      const added = await dbStoreInstance.addAnnualEvaluation(newVal);
      res.status(201).json(added);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 9. Development Plans
  app.get('/api/dev-plans', async (req, res) => {
    try {
      const plans = await dbStoreInstance.getDevPlans();
      res.json(plans);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/dev-plans/:employeeId/actions', async (req, res) => {
    try {
      const empId = req.params.employeeId;
      const plan = await dbStoreInstance.addDevPlanAction(empId, req.body);
      res.status(201).json(plan);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // ----------------------------------------------------
  // SERVER-SIDE GEMINI AI ENDPOINTS
  // ----------------------------------------------------

  // A. IA MATCH EXPLANATION (Staffing Module)
  app.post('/api/ai/match-explanation', async (req, res) => {
    try {
      const { employee, request, scoreBreakdown } = req.body;
      if (!employee || !request) {
        return res.status(400).json({ error: 'Missing employee or role request parameters' });
      }

      const prompt = `
        Analiza detalladamente por qué el colaborador ${employee.name} ${employee.surname} (Nivel: ${employee.currentLevelId}, Especialidad: ${employee.currentCareerPathId}) encaja en el rol de proyecto solicitado.

        Requisitos de la solicitud de Staffing:
        - Especialidad de carrera: ${request.careerPathId}
        - Nivel de experiencia requerido: ${request.requiredLevelId}
        - Skills Técnicos requeridos: ${request.requiredSkills ? request.requiredSkills.join(', ') : 'Ninguno especificado'}
        - Dedicación/Asignación esperada: ${request.allocation}%

        Skills actuales del colaborador:
        ${JSON.stringify(employee.skills)}

        Certificaciones actuales:
        ${JSON.stringify(employee.certifications)}

        Scores de matching calculados por el algoritmo:
        - Compatibilidad de Skills: ${scoreBreakdown.skillScore}%
        - Compatibilidad de Nivel Corporativo: ${scoreBreakdown.levelScore}%
        - Compatibilidad de Disponibilidad: ${scoreBreakdown.availabilityScore}%
        - Desempeño Histórico: ${scoreBreakdown.performanceScore}%
        - Score Global: ${scoreBreakdown.globalScore}%

        Por favor, actúa como el agente experto "HR PROJECT TALENT ORCHESTRATOR" y genera un informe estructurado que contenga:
        1. **Resumen de Idoneidad**: Breve análisis de fortalezas técnicas y funcionales que lo hacen adecuado.
        2. **Gaps Identificados**: Qué tecnologías requeridas le faltan o qué skills debería reforzar antes/durante la incorporación.
        3. **Plan de Reskilling Rápido Recomendado**: Sugiere acciones de formación específicas o mentoría técnica basándote en la solicitud de staffing.
        4. **Riesgos de Asignación**: Analiza riesgos (por ejemplo, si tiene poca disponibilidad o si está sobre-calificado y puede aburrirse, o sub-calificado).

        Escribe tu respuesta en un formato markdown elegante en español. Sé sumamente profesional, constructivo y útil para el Project Manager.
      `;

      const ai = getAI();
      const result = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Eres el copiloto de staffing de IT Consulting "Talent Orchestrator AI", tu meta es guiar decisiones objetivas de asignación técnica.'
        }
      });

      res.json({ explanation: result.text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // B. IA GAP ANALYSIS & DEVELOPMENT PLANNER (Learning & Career Module)
  app.post('/api/ai/career-gap-analysis', async (req, res) => {
    try {
      const { employee, targetLevelId } = req.body;
      if (!employee || !targetLevelId) {
        return res.status(400).json({ error: 'Missing employee or targetLevelId parameters' });
      }

      const trainings = await dbStoreInstance.getTrainings();

      const prompt = `
        Colaborador: ${employee.name} ${employee.surname}
        Especialidad actual: ${employee.currentCareerPathId}
        Nivel actual: ${employee.currentLevelId}
        Nivel objetivo para promoción: ${targetLevelId}

        Skills actuales:
        ${JSON.stringify(employee.skills)}

        Certificaciones actuales:
        ${JSON.stringify(employee.certifications)}

        Catálogo de formaciones disponibles en la empresa:
        ${JSON.stringify(trainings)}

        Por favor, actúa como el "HR PROJECT TALENT ORCHESTRATOR". Analiza las brechas de competencias (skills/seniority) que impiden a este colaborador promocionar al nivel ${targetLevelId} (según el Career Framework de IT Consulting).
        
        Tu informe estructurado en markdown debe contener:
        1. **Diagnóstico de Seniority**: Comparación de sus habilidades actuales contra las expectativas del nivel objetivo.
        2. **Brechas Críticas (Gaps)**: Principales competencias técnicas, de liderazgo o de negocio que debe mejorar.
        3. **Itinerario Formativo Recomendado**: Selecciona y mapea específicamente los cursos disponibles en el catálogo de formaciones de la empresa (menciona su ID, nombre y por qué le ayudará).
        4. **Acciones de Desarrollo On-the-Job**: Sugiere asignaciones prácticas o roles en su proyecto actual para entrenar estas competencias de manera práctica.

        Escribe en español, manteniendo un tono de mentoría técnica y de carrera inspirador y objetivo.
      `;

      const ai = getAI();
      const result = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Eres un Career Manager virtual experto de Sopra Steria / Consultoría IT, guiando el upskilling alineado a proyectos.'
        }
      });

      res.json({ analysis: result.text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // C. IA ANNUAL EVALUATION FEEDBACK CO-DRAFTER (Performance Module)
  app.post('/api/ai/draft-evaluation', async (req, res) => {
    try {
      const { employee, evaluation, checkpoints } = req.body;
      if (!employee || !evaluation) {
        return res.status(400).json({ error: 'Missing employee or evaluation details' });
      }

      const prompt = `
        Colaborador: ${employee.name} ${employee.surname} (Nivel actual: ${employee.currentLevelId}, Objetivo: ${evaluation.targetLevelId})
        Scores por dimensión en evaluación (escala 1-5):
        ${JSON.stringify(evaluation.dimensions)}

        Calificaciones de competencias (esperado vs real):
        ${JSON.stringify(evaluation.competencies)}

        Histórico de checkpoints mensuales/trimestrales en proyecto:
        ${JSON.stringify(checkpoints)}

        Por favor, actúa como el "HR PROJECT TALENT ORCHESTRATOR" y ayuda al Project Manager a redactar un borrador formal, profesional, empático y estructurado de la evaluación anual de desempeño de este colaborador.
        El borrador debe contener:
        1. **Resumen de Desempeño Global**: Destacando los logros clave en proyectos y KPIs alcanzados.
        2. **Valoración de Competencias Corporativas**: Análisis de su orientación al cliente, liderazgo, innovación y relación con el equipo basándote en los datos provistos.
        3. **Fortalezas Principales**: 3 fortalezas que lo diferencian.
        4. **Áreas de Desarrollo / Mejora Continua**: Consejos prácticos y constructivos de cara al ciclo de carrera del próximo año.
        5. **Criterio de Promoción**: Justificación objetiva sobre si está listo o no para promocionar de ${employee.currentLevelId} a ${evaluation.targetLevelId}.

        Usa un lenguaje formal de RRHH en español, extremadamente objetivo y libre de sesgos, ideal para el comité de calibración anual.
      `;

      const ai = getAI();
      const result = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          systemInstruction: 'Eres un calibrador experto de RRHH en comités de evaluación corporativa IT. Tu objetivo es asegurar objetividad, rigor técnico y un plan de acción constructivo.'
        }
      });

      res.json({ draft: result.text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // D. COPILOTO GENERAL DE TALENTO (HR COPILOT CHAT)
  app.post('/api/ai/copilot', async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: 'Missing chat messages array' });
      }

      const [employees, projects, roleRequests, trainings, annualEvaluations] = await Promise.all([
        dbStoreInstance.getEmployees(),
        dbStoreInstance.getProjects(),
        dbStoreInstance.getRoleRequests(),
        dbStoreInstance.getTrainings(),
        dbStoreInstance.getAnnualEvaluations()
      ]);

      // We inject the whole system context into the conversation instruction
      const systemInstruction = `
        Eres "Talent Orchestrator AI", el copiloto inteligente de RRHH, staffing y desarrollo profesional dentro de la plataforma CRH Management.
        Tienes acceso a los datos completos de la empresa:
        
        Colaboradores actuales:
        ${JSON.stringify(employees.map(e => ({ id: e.employeeId, nombre: `${e.name} ${e.surname}`, nivel: e.currentLevelId, path: e.currentCareerPathId, skills: e.skills.map(s => `${s.name} (Lvl ${s.level})`), availability: e.availabilityPercent, certificaciones: e.certifications.map(c => c.certificationName) })))}

        Proyectos activos y planificados:
        ${JSON.stringify(projects)}

        Solicitudes de staffing vigentes (necesidades de recursos):
        ${JSON.stringify(roleRequests)}

        Catálogo de formaciones:
        ${JSON.stringify(trainings)}

        Evaluaciones de desempeño anuales del ciclo actual:
        ${JSON.stringify(annualEvaluations.map(ev => ({ id: ev.evaluationId, employeeId: ev.employeeId, score: ev.finalScore, result: ev.evaluationResult, status: ev.status, readyForPromotion: ev.promotionRecommendation })))}

        Tus responsabilidades son:
        1. Analizar necesidades de proyectos y proponer el mejor matching.
        2. Identificar qué personas quedarán libres o en bench para optimizar la utilización de la plantilla.
        3. Detectar gaps de skills grupales o individuales y recomendar cursos del catálogo.
        4. Ayudar a Managers y a RRHH a resolver dudas objetivas sobre si un colaborador califica para promoción.
        5. Proponer planes de acción y mitigar riesgos de asignación.

        Reglas:
        - Fundamenta todas las recomendaciones en los datos proporcionados arriba.
        - Explica tu razonamiento de forma numérica u objetiva cuando hables de scores.
        - Evita sesgos subjetivos. Prioriza méritos del framework.
        - Sé conciso, profesional y directo. Escribe siempre en español.
      `;

      // Structure contents for @google/genai SDK format
      // Maps roles to appropriate model roles: user/model
      const apiContents = messages.map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const ai = getAI();
      const result = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: apiContents,
        config: {
          systemInstruction,
        }
      });

      res.json({ response: result.text });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // ----------------------------------------------------
  // VITE & STATIC FILES SERVING MIDDLEWARE
  // ----------------------------------------------------
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CRH Management Server] running on http://localhost:${PORT}`);
  });
}

startServer();
