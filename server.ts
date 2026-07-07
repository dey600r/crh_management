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

  // ----------------------------------------------------
  // API ENDPOINTS - DATA CRUD
  // ----------------------------------------------------

  // 1. Career Framework Info
  app.get('/api/career-framework', (req, res) => {
    try {
      res.json({
        families: dbStoreInstance.careerFamilies,
        paths: dbStoreInstance.careerPaths,
        levels: dbStoreInstance.careerLevels,
        competencies: dbStoreInstance.competencies,
        trainings: dbStoreInstance.trainings
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 2. Employees Endpoints
  app.get('/api/employees', (req, res) => {
    try {
      res.json(dbStoreInstance.employees);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/employees/:id', (req, res) => {
    try {
      const emp = dbStoreInstance.getEmployee(req.params.id);
      if (!emp) return res.status(404).json({ error: 'Employee not found' });
      res.json(emp);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/employees', (req, res) => {
    try {
      const newEmp = req.body;
      if (!newEmp.employeeId || !newEmp.name || !newEmp.surname) {
        return res.status(400).json({ error: 'Missing employee identifier or name properties' });
      }
      dbStoreInstance.employees.push({
        ...newEmp,
        skills: newEmp.skills || [],
        certifications: newEmp.certifications || [],
        projectHistory: newEmp.projectHistory || []
      });
      res.status(201).json(newEmp);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/employees/:id/skills', (req, res) => {
    try {
      const emp = dbStoreInstance.getEmployee(req.params.id);
      if (!emp) return res.status(404).json({ error: 'Employee not found' });
      const skill = req.body;
      emp.skills.push({
        skillId: `s_${Date.now()}`,
        name: skill.name,
        category: skill.category || 'General',
        level: Number(skill.level) || 3,
        validatedDate: new Date().toISOString().split('T')[0],
        source: skill.source || 'Self'
      });
      res.status(201).json(emp);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 3. Projects Endpoints
  app.get('/api/projects', (req, res) => {
    try {
      res.json(dbStoreInstance.projects);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/projects', (req, res) => {
    try {
      const prj = req.body;
      if (!prj.projectId || !prj.projectName) {
        return res.status(400).json({ error: 'Missing projectId or projectName' });
      }
      dbStoreInstance.projects.push({
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
      res.status(201).json(prj);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 4. Project Role Requests (Staffing Needs)
  app.get('/api/role-requests', (req, res) => {
    try {
      res.json(dbStoreInstance.roleRequests);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/role-requests', (req, res) => {
    try {
      const roleReq: ProjectRoleRequest = req.body;
      if (!roleReq.projectId || !roleReq.careerPathId || !roleReq.requiredLevelId) {
        return res.status(400).json({ error: 'Missing required role request fields' });
      }
      const newReq = {
        ...roleReq,
        id: `REQ_${Date.now()}`
      };
      dbStoreInstance.addProjectRoleRequest(newReq);
      res.status(201).json(newReq);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 5. Staffing Assignments
  app.get('/api/assignments', (req, res) => {
    try {
      res.json(dbStoreInstance.assignments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/assignments', (req, res) => {
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
      dbStoreInstance.addProjectAssignment(newAsg);
      res.status(201).json(newAsg);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 6. Matching Results (Staffing Algorithm)
  app.get('/api/matching/:requestId', (req, res) => {
    try {
      const results = dbStoreInstance.getMatchingResults(req.params.requestId);
      res.json(results);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 7. Checkpoints (Performance Reviews)
  app.get('/api/checkpoints', (req, res) => {
    try {
      res.json(dbStoreInstance.checkpoints);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/checkpoints', (req, res) => {
    try {
      const cp: CheckpointReview = req.body;
      if (!cp.employeeId || !cp.projectId || !cp.reviewerId) {
        return res.status(400).json({ error: 'Missing employee, project, or reviewer ID' });
      }
      const newCp = {
        ...cp,
        id: `CK_${Date.now()}`
      };
      dbStoreInstance.addCheckpoint(newCp);
      res.status(201).json(newCp);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 8. Annual Evaluations
  app.get('/api/annual-evaluations', (req, res) => {
    try {
      res.json(dbStoreInstance.annualEvaluations);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/annual-evaluations/:id', (req, res) => {
    try {
      const updated = dbStoreInstance.updateAnnualEvaluation(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: 'Evaluation not found' });
      res.json(updated);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/annual-evaluations', (req, res) => {
    try {
      const val: AnnualEvaluation = req.body;
      if (!val.employeeId) {
        return res.status(400).json({ error: 'Missing employeeId' });
      }
      const newVal: AnnualEvaluation = {
        ...val,
        evaluationId: `EV_${Date.now()}`
      };
      dbStoreInstance.annualEvaluations.push(newVal);
      res.status(201).json(newVal);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // 9. Development Plans
  app.get('/api/dev-plans', (req, res) => {
    try {
      res.json(dbStoreInstance.devPlans);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/dev-plans/:employeeId/actions', (req, res) => {
    try {
      const empId = req.params.employeeId;
      let plan = dbStoreInstance.devPlans.find(d => d.employeeId === empId);
      if (!plan) {
        plan = {
          id: `DP_${Date.now()}`,
          employeeId: empId,
          year: 2026,
          status: 'Active',
          actions: []
        };
        dbStoreInstance.devPlans.push(plan);
      }
      const action = req.body;
      const newAction = {
        id: `DA_${Date.now()}`,
        type: action.type || 'Training',
        description: action.description,
        targetDate: action.targetDate || new Date().toISOString().split('T')[0],
        status: action.status || 'Pending',
        trainingId: action.trainingId
      };
      plan.actions.push(newAction);
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
        ${JSON.stringify(dbStoreInstance.trainings)}

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

      // We inject the whole system context into the conversation instruction
      const systemInstruction = `
        Eres "Talent Orchestrator AI", el copiloto inteligente de RRHH, staffing y desarrollo profesional dentro de la plataforma CRH Management.
        Tienes acceso a los datos completos de la empresa:
        
        Colaboradores actuales:
        ${JSON.stringify(dbStoreInstance.employees.map(e => ({ id: e.employeeId, nombre: `${e.name} ${e.surname}`, nivel: e.currentLevelId, path: e.currentCareerPathId, skills: e.skills.map(s => `${s.name} (Lvl ${s.level})`), availability: e.availabilityPercent, certificaciones: e.certifications.map(c => c.certificationName) })))}

        Proyectos activos y planificados:
        ${JSON.stringify(dbStoreInstance.projects)}

        Solicitudes de staffing vigentes (necesidades de recursos):
        ${JSON.stringify(dbStoreInstance.roleRequests)}

        Catálogo de formaciones:
        ${JSON.stringify(dbStoreInstance.trainings)}

        Evaluaciones de desempeño anuales del ciclo actual:
        ${JSON.stringify(dbStoreInstance.annualEvaluations.map(ev => ({ id: ev.evaluationId, employeeId: ev.employeeId, score: ev.finalScore, result: ev.evaluationResult, status: ev.status, readyForPromotion: ev.promotionRecommendation })))}

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
