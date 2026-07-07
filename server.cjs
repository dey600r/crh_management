var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_vite = require("vite");

// src/data/dbStore.ts
var import_app = require("firebase/app");
var import_firestore = require("firebase/firestore");
var import_fs = require("fs");
var import_path = require("path");
var configPath = (0, import_path.join)(process.cwd(), "firebase-applet-config.json");
var db = null;
if ((0, import_fs.existsSync)(configPath)) {
  try {
    const configContent = (0, import_fs.readFileSync)(configPath, "utf8");
    const config = JSON.parse(configContent);
    let app;
    if ((0, import_app.getApps)().length === 0) {
      app = (0, import_app.initializeApp)(config);
    } else {
      app = (0, import_app.getApp)();
    }
    if (config.firestoreDatabaseId) {
      db = (0, import_firestore.getFirestore)(app, config.firestoreDatabaseId);
    } else {
      db = (0, import_firestore.getFirestore)(app);
    }
    console.log("[Firestore] Successfully initialized connection to database:", config.firestoreDatabaseId || "(default)");
  } catch (error) {
    console.error("[Firestore] Failed to initialize Firebase in dbStore:", error);
  }
}
var INITIAL_CAREER_FAMILIES = [
  { id: "F_ARC", code: "ARC", name: "Architecture & Tech Leadership", description: "Dise\xF1o t\xE9cnico, gobernanza de sistemas y liderazgo tecnol\xF3gico.", active: true },
  { id: "F_SWE", code: "SWE", name: "Software Engineering", description: "Construcci\xF3n, testing y despliegue de soluciones de software.", active: true },
  { id: "F_MGT", code: "MGT", name: "Project & Product Management", description: "Gesti\xF3n \xE1gil de proyectos, presupuestos y coordinaci\xF3n de equipos.", active: true },
  { id: "F_CON", code: "CON", name: "Consulting", description: "Consultor\xEDa de negocio, an\xE1lisis funcional e implantaci\xF3n.", active: true }
];
var INITIAL_CAREER_PATHS = [
  { id: "P_ARC", careerFamilyId: "F_ARC", code: "P_ARC", name: "Software Architecture", description: "Especializaci\xF3n en dise\xF1o de arquitecturas de software, patrones y cloud." },
  { id: "P_SWE", careerFamilyId: "F_SWE", code: "P_SWE", name: "Fullstack Software Development", description: "Desarrollo extremo a extremo (Frontend, Backend, bases de datos)." },
  { id: "P_MGT", careerFamilyId: "F_MGT", code: "P_MGT", name: "Technical Project Management", description: "Liderazgo \xE1gil, Scrum, coordinaci\xF3n de stakeholders." },
  { id: "P_CON", careerFamilyId: "F_CON", code: "P_CON", name: "Business & functional Analysis", description: "An\xE1lisis de requisitos funcionales, alineaci\xF3n con negocio." }
];
var INITIAL_CAREER_LEVELS = [
  { id: "L1", levelCode: "T1", levelNumber: 1, name: "Technician (Junior Dev)", experienceFrom: 0, experienceTo: 2 },
  { id: "L2", levelCode: "E1", levelNumber: 2, name: "Engineer (Mid Dev)", experienceFrom: 2, experienceTo: 4 },
  { id: "L3", levelCode: "E2", levelNumber: 3, name: "Senior Engineer", experienceFrom: 4, experienceTo: 7 },
  { id: "L4", levelCode: "M1", levelNumber: 4, name: "Manager / Lead Architect", experienceFrom: 7, experienceTo: 10 },
  { id: "L5", levelCode: "M2", levelNumber: 5, name: "Senior Manager", experienceFrom: 10, experienceTo: 15 },
  { id: "L6", levelCode: "D1", levelNumber: 6, name: "Director", experienceFrom: 15, experienceTo: 99 }
];
var INITIAL_COMPETENCIES = [
  { id: "CLIENT_ORIENTATION", code: "CLIENT_ORIENTATION", name: "Orientaci\xF3n al Cliente", type: "Business", description: "Capacidad para alinear el desarrollo con necesidades del cliente y aportar valor." },
  { id: "INNOVATION", code: "INNOVATION", name: "Innovaci\xF3n Tecnol\xF3gica", type: "Technical", description: "Adopci\xF3n proactiva de nuevos stacks, optimizaci\xF3n y creatividad t\xE9cnica." },
  { id: "HUMAN_RELATIONS", code: "HUMAN_RELATIONS", name: "Relaciones Humanas & Empat\xEDa", type: "Behavioral", description: "Comunicaci\xF3n fluida, asertividad, resoluci\xF3n de conflictos internos." },
  { id: "TEAM_LEADERSHIP", code: "TEAM_LEADERSHIP", name: "Liderazgo & Mentor\xEDa", type: "Leadership", description: "Capacidad de guiar al equipo, delegar eficientemente y formar a juniors." },
  { id: "ORGANIZATION_RESULTS", code: "ORGANIZATION_RESULTS", name: "Orientaci\xF3n a Resultados", type: "Business", description: "Foco en entregables de alta calidad, control de plazos y proactividad." },
  { id: "PROFESSIONAL_OPENNESS", code: "PROFESSIONAL_OPENNESS", name: "Apertura Profesional", type: "Behavioral", description: "Autoaprendizaje continuo, generosidad para compartir conocimiento." }
];
var INITIAL_TRAINING_CATALOG = [
  { trainingId: "TR1", name: "Arquitectura Enterprise con Clean Architecture y DDD", provider: "Sopra Academies", durationHours: 40, level: "Advanced", cost: 1200, coveredCompetencies: ["INNOVATION", "ORGANIZATION_RESULTS"] },
  { trainingId: "TR2", name: "React 19, Next.js Masterclass & Tailwind Enterprise", provider: "Frontend Experts", durationHours: 25, level: "Intermediate", cost: 600, coveredCompetencies: ["INNOVATION"] },
  { trainingId: "TR3", name: "Certificaci\xF3n Oficial AWS Solutions Architect Associate", provider: "AWS Training", durationHours: 50, level: "Advanced", cost: 1500, coveredCompetencies: ["INNOVATION", "ORGANIZATION_RESULTS"] },
  { trainingId: "TR4", name: "Liderazgo \xC1gil, Gesti\xF3n de Conflictos y Facilitaci\xF3n", provider: "Agile Alliance", durationHours: 20, level: "Intermediate", cost: 800, coveredCompetencies: ["TEAM_LEADERSHIP", "HUMAN_RELATIONS"] },
  { trainingId: "TR5", name: "Comunicaci\xF3n Asertiva y Relaci\xF3n de Alta Fidelidad con Clientes", provider: "Soft Skills Corp", durationHours: 16, level: "Beginner", cost: 400, coveredCompetencies: ["CLIENT_ORIENTATION", "HUMAN_RELATIONS"] }
];
var INITIAL_EMPLOYEES = [
  {
    employeeId: "E001",
    name: "Alejandro",
    surname: "Sanz Guerrero",
    email: "alejandro.sanz@itconsulting.com",
    country: "Espa\xF1a",
    office: "Madrid",
    department: "Software Engineering",
    managerId: "E004",
    careerManagerId: "E004",
    currentCareerPathId: "P_SWE",
    currentLevelId: "L3",
    // Senior Engineer
    hireDate: "2022-03-15",
    status: "Active",
    availabilityPercent: 100,
    // Fully available on bench!
    skills: [
      { skillId: "s1", name: "React", category: "Frontend", level: 5, validatedDate: "2025-01-10", source: "Project" },
      { skillId: "s2", name: "Node.js", category: "Backend", level: 4, validatedDate: "2025-02-15", source: "Project" },
      { skillId: "s3", name: "TypeScript", category: "Languages", level: 5, validatedDate: "2025-03-01", source: "Self" },
      { skillId: "s4", name: "PostgreSQL", category: "Databases", level: 4, validatedDate: "2024-11-20", source: "Project" },
      { skillId: "s5", name: "AWS", category: "Cloud", level: 3, validatedDate: "2024-06-10", source: "Self" }
    ],
    certifications: [
      { id: "c1", certificationName: "AWS Certified Cloud Practitioner", provider: "AWS", issueDate: "2024-05-12", expiryDate: "2027-05-12" }
    ],
    projectHistory: [
      { projectId: "PRJ003", role: "Senior React Developer", performance: 4.5 }
    ]
  },
  {
    employeeId: "E002",
    name: "Beatriz",
    surname: "Ortiz Calvo",
    email: "beatriz.ortiz@itconsulting.com",
    country: "Espa\xF1a",
    office: "Barcelona",
    department: "Architecture & Tech Leadership",
    managerId: "E006",
    careerManagerId: "E006",
    currentCareerPathId: "P_ARC",
    currentLevelId: "L4",
    // Lead Architect
    hireDate: "2020-09-01",
    status: "Active",
    availabilityPercent: 20,
    // Low availability, freeing up soon
    skills: [
      { skillId: "s6", name: "Enterprise Architect", category: "Architecture", level: 5, validatedDate: "2024-10-15", source: "Project" },
      { skillId: "s7", name: "Kubernetes", category: "DevOps", level: 5, validatedDate: "2025-01-20", source: "Project" },
      { skillId: "s8", name: "Java", category: "Backend", level: 5, validatedDate: "2023-08-11", source: "Project" },
      { skillId: "s9", name: "Spring Boot", category: "Backend", level: 5, validatedDate: "2024-02-14", source: "Project" },
      { skillId: "s10", name: "Terraform", category: "Cloud", level: 4, validatedDate: "2024-12-01", source: "Self" },
      { skillId: "s5", name: "AWS", category: "Cloud", level: 5, validatedDate: "2024-05-01", source: "Project" }
    ],
    certifications: [
      { id: "c2", certificationName: "TOGAF 9 Certified", provider: "The Open Group", issueDate: "2021-02-18", expiryDate: "2030-01-01" },
      { id: "c3", certificationName: "Certified Kubernetes Administrator (CKA)", provider: "CNCF", issueDate: "2023-11-05", expiryDate: "2026-11-05" }
    ],
    projectHistory: [
      { projectId: "PRJ001", role: "Lead Architect", performance: 4.8 }
    ]
  },
  {
    employeeId: "E003",
    name: "Carlos",
    surname: "M\xE9ndez Ruiz",
    email: "carlos.mendez@itconsulting.com",
    country: "Espa\xF1a",
    office: "Madrid",
    department: "Software Engineering",
    managerId: "E001",
    careerManagerId: "E001",
    currentCareerPathId: "P_SWE",
    currentLevelId: "L1",
    // Junior Dev
    hireDate: "2024-06-01",
    status: "Active",
    availabilityPercent: 100,
    // Fully available
    skills: [
      { skillId: "s1", name: "React", category: "Frontend", level: 3, validatedDate: "2025-04-01", source: "Self" },
      { skillId: "s11", name: "JavaScript", category: "Languages", level: 4, validatedDate: "2024-07-15", source: "Self" },
      { skillId: "s12", name: "HTML & CSS", category: "Frontend", level: 4, validatedDate: "2024-06-15", source: "Self" }
    ],
    certifications: [],
    projectHistory: []
  },
  {
    employeeId: "E004",
    name: "Daniela",
    surname: "Vega Soler",
    email: "daniela.vega@itconsulting.com",
    country: "Espa\xF1a",
    office: "Valencia",
    department: "Project & Product Management",
    managerId: "E006",
    careerManagerId: "E006",
    currentCareerPathId: "P_MGT",
    currentLevelId: "L4",
    // Manager
    hireDate: "2021-01-15",
    status: "Active",
    availabilityPercent: 0,
    // Fully allocated
    skills: [
      { skillId: "s13", name: "Agile Management", category: "Agile", level: 5, validatedDate: "2024-09-10", source: "Project" },
      { skillId: "s14", name: "Scrum Master", category: "Agile", level: 5, validatedDate: "2024-08-11", source: "Project" },
      { skillId: "s15", name: "Risk Management", category: "Management", level: 4, validatedDate: "2023-12-05", source: "Project" }
    ],
    certifications: [
      { id: "c4", certificationName: "Project Management Professional (PMP)", provider: "PMI", issueDate: "2022-04-20", expiryDate: "2025-04-20" },
      { id: "c5", certificationName: "Certified ScrumMaster (CSM)", provider: "Scrum Alliance", issueDate: "2021-06-10", expiryDate: "2024-06-10" }
    ],
    projectHistory: [
      { projectId: "PRJ001", role: "Project Manager", performance: 4.6 }
    ]
  },
  {
    employeeId: "E005",
    name: "Eduardo",
    surname: "Garc\xEDa Lorca",
    email: "eduardo.garcia@itconsulting.com",
    country: "Colombia",
    office: "Bogot\xE1",
    department: "Software Engineering",
    managerId: "E001",
    careerManagerId: "E004",
    currentCareerPathId: "P_SWE",
    currentLevelId: "L2",
    // Engineer (Mid)
    hireDate: "2023-11-01",
    status: "Active",
    availabilityPercent: 50,
    // Partly busy
    skills: [
      { skillId: "s16", name: "Vue", category: "Frontend", level: 4, validatedDate: "2024-08-10", source: "Project" },
      { skillId: "s2", name: "Node.js", category: "Backend", level: 3, validatedDate: "2024-11-15", source: "Self" },
      { skillId: "s17", name: "MongoDB", category: "Databases", level: 4, validatedDate: "2024-09-20", source: "Project" }
    ],
    certifications: [],
    projectHistory: [
      { projectId: "PRJ002", role: "Vue Developer", performance: 4 }
    ]
  },
  {
    employeeId: "E006",
    name: "Sofia",
    surname: "Alarc\xF3n Torres",
    email: "sofia.alarcon@itconsulting.com",
    country: "Espa\xF1a",
    office: "Madrid",
    department: "Architecture & Tech Leadership",
    managerId: "HR_ROOT",
    careerManagerId: "HR_ROOT",
    currentCareerPathId: "P_ARC",
    currentLevelId: "L5",
    // Senior Manager / Director
    hireDate: "2018-05-10",
    status: "Active",
    availabilityPercent: 10,
    skills: [
      { skillId: "s6", name: "Enterprise Architect", category: "Architecture", level: 5, validatedDate: "2023-10-10", source: "Project" },
      { skillId: "s18", name: "Solution Blueprint", category: "Architecture", level: 5, validatedDate: "2024-01-11", source: "Project" },
      { skillId: "s10", name: "Terraform", category: "Cloud", level: 5, validatedDate: "2024-06-01", source: "Project" }
    ],
    certifications: [
      { id: "c6", certificationName: "AWS Certified Solutions Architect Professional", provider: "AWS", issueDate: "2022-11-15", expiryDate: "2025-11-15" }
    ],
    projectHistory: [
      { projectId: "PRJ001", role: "Principal Director", performance: 4.9 }
    ]
  }
];
var INITIAL_PROJECTS = [
  {
    projectId: "PRJ001",
    clientName: "Banco Santander",
    projectName: "Cloud Migration & Core Modernization",
    businessUnit: "Banca y Seguros",
    status: "Active",
    startDate: "2025-01-10",
    endDate: "2026-12-31",
    budget: 85e4,
    technologies: ["AWS", "Kubernetes", "Terraform", "Spring Boot", "Java"]
  },
  {
    projectId: "PRJ002",
    clientName: "Mercadona",
    projectName: "E-Commerce Redesign & Microservices",
    businessUnit: "Retail & Log\xEDstica",
    status: "InPreparation",
    startDate: "2026-08-01",
    endDate: "2027-05-31",
    budget: 42e4,
    technologies: ["Vue", "Node.js", "React", "MongoDB", "TypeScript", "Docker"]
  },
  {
    projectId: "PRJ003",
    clientName: "Telef\xF3nica",
    projectName: "IoT Device Analytics Platform",
    businessUnit: "Telecomunicaciones",
    status: "Active",
    startDate: "2025-06-01",
    endDate: "2026-06-01",
    budget: 31e4,
    technologies: ["React", "TypeScript", "Node.js", "PostgreSQL", "AWS"]
  }
];
var INITIAL_ROLE_REQUESTS = [
  {
    id: "REQ001",
    projectId: "PRJ002",
    // Mercadona Redesign
    careerPathId: "P_SWE",
    requiredLevelId: "L3",
    // Senior Dev
    requiredSkills: ["React", "Node.js", "TypeScript"],
    startDate: "2026-08-01",
    allocation: 100,
    priority: "High"
  },
  {
    id: "REQ002",
    projectId: "PRJ001",
    // Cloud Migration Santander
    careerPathId: "P_ARC",
    requiredLevelId: "L4",
    // Lead Architect
    requiredSkills: ["Kubernetes", "AWS", "Terraform"],
    startDate: "2026-07-20",
    allocation: 100,
    priority: "High"
  },
  {
    id: "REQ003",
    projectId: "PRJ002",
    // Mercadona Redesign
    careerPathId: "P_SWE",
    requiredLevelId: "L2",
    // Mid Dev
    requiredSkills: ["Vue", "MongoDB"],
    startDate: "2026-08-15",
    allocation: 50,
    priority: "Medium"
  }
];
var INITIAL_ASSIGNMENTS = [
  { assignmentId: "A001", employeeId: "E002", projectId: "PRJ001", role: "Lead Architect", allocationPercent: 80, startDate: "2025-01-10", endDate: "2026-12-31" },
  { assignmentId: "A002", employeeId: "E004", projectId: "PRJ001", role: "Project Manager", allocationPercent: 100, startDate: "2025-01-10", endDate: "2026-12-31" },
  { assignmentId: "A003", employeeId: "E005", projectId: "PRJ002", role: "Vue Developer", allocationPercent: 50, startDate: "2025-08-01", endDate: "2026-05-31" }
];
var INITIAL_CHECKPOINTS = [
  {
    id: "CK001",
    employeeId: "E005",
    // Eduardo Mid Vue Dev
    projectId: "PRJ002",
    reviewerId: "E004",
    // Daniela Vega (Project Manager)
    reviewDate: "2025-12-15",
    reviewType: "Quarterly",
    comments: "Eduardo se ha adaptado muy bien al equipo de Mercadona. Su trabajo con Vue es de alta calidad, aunque necesitamos que asuma m\xE1s liderazgo en backend con Node.",
    scores: [
      { competencyId: "ORGANIZATION_RESULTS", score: 4, comments: "Entregas a tiempo y limpias." },
      { competencyId: "HUMAN_RELATIONS", score: 4, comments: "Excelente colaboraci\xF3n con su par en frontend." },
      { competencyId: "INNOVATION", score: 3, comments: "Se limita al patr\xF3n establecido, correcto pero sin proponer alternativas." }
    ],
    kpis: [
      { id: "k1", kpi: "Quality", weight: 30, targetValue: 4, currentValue: 4.2 },
      { id: "k2", kpi: "Delivery", weight: 30, targetValue: 4, currentValue: 4 },
      { id: "k3", kpi: "Customer Satisfaction", weight: 40, targetValue: 4, currentValue: 4.5 }
    ]
  },
  {
    id: "CK002",
    employeeId: "E001",
    // Alejandro (Sanz)
    projectId: "PRJ003",
    // IoT Analytics Platform
    reviewerId: "E004",
    // Daniela PM
    reviewDate: "2025-11-30",
    reviewType: "Monthly",
    comments: "Alejandro es un recurso excepcional en React. Ayud\xF3 a estructurar la base de c\xF3digo del proyecto Telef\xF3nica IoT de manera \xF3ptima.",
    scores: [
      { competencyId: "INNOVATION", score: 5, comments: "Propuso arquitectura modular excelente." },
      { competencyId: "ORGANIZATION_RESULTS", score: 5, comments: "Super\xF3 los objetivos de rendimiento del dashboard." },
      { competencyId: "TEAM_LEADERSHIP", score: 4, comments: "Ayud\xF3 a mentorizar a Carlos en React." }
    ],
    kpis: [
      { id: "k4", kpi: "Productivity", weight: 40, targetValue: 4, currentValue: 4.8 },
      { id: "k5", kpi: "Quality", weight: 30, targetValue: 4, currentValue: 4.7 },
      { id: "k6", kpi: "Innovation", weight: 30, targetValue: 4, currentValue: 5 }
    ]
  }
];
var INITIAL_DEVELOPMENT_PLANS = [
  {
    id: "DP001",
    employeeId: "E001",
    // Alejandro
    year: 2026,
    status: "Active",
    actions: [
      { id: "DA001", type: "Training", description: "Realizar curso avanzado clean architecture", targetDate: "2026-09-01", status: "InProgress", trainingId: "TR1" },
      { id: "DA002", type: "Certification", description: "Obtener certificaci\xF3n AWS Certified Solutions Architect Associate", targetDate: "2026-11-15", status: "Pending" }
    ]
  },
  {
    id: "DP002",
    employeeId: "E003",
    // Carlos (Junior)
    year: 2026,
    status: "Active",
    actions: [
      { id: "DA003", type: "Training", description: "React 19, Next.js Masterclass & Tailwind Enterprise", targetDate: "2026-08-01", status: "Pending", trainingId: "TR2" },
      { id: "DA004", type: "Mentoring", description: "Mentor\xEDa semanal con Alejandro Sanz sobre buenas pr\xE1cticas Frontend", targetDate: "2026-12-01", status: "InProgress" }
    ]
  }
];
var INITIAL_ANNUAL_EVALUATIONS = [
  {
    evaluationId: "EV001",
    employeeId: "E001",
    // Alejandro Sanz
    year: 2025,
    currentLevelId: "L3",
    // Senior Engineer
    targetLevelId: "L4",
    // Manager / Lead Architect (Goal)
    status: "Calibration",
    // In calibration phase! Perfect for manager/HR coordination
    finalScore: 4.4,
    evaluationResult: "ExceedsExpectations",
    dimensions: [
      { id: "d1", dimension: "Competencies", weight: 40, score: 4.5 },
      { id: "d2", dimension: "ProjectPerformance", weight: 30, score: 4.6 },
      { id: "d3", dimension: "Training", weight: 15, score: 4 },
      { id: "d4", dimension: "Feedback360", weight: 10, score: 4.2 },
      { id: "d5", dimension: "CorporateContribution", weight: 5, score: 4 }
    ],
    competencies: [
      { id: "c1", competencyId: "CLIENT_ORIENTATION", expectedStage: "C", actualStage: "C", score: 4, gap: 0 },
      { id: "c2", competencyId: "INNOVATION", expectedStage: "C", actualStage: "D", score: 5, gap: 1 },
      { id: "c3", competencyId: "HUMAN_RELATIONS", expectedStage: "C", actualStage: "D", score: 4.5, gap: 1 },
      { id: "c4", competencyId: "TEAM_LEADERSHIP", expectedStage: "B", actualStage: "C", score: 4.5, gap: 1 },
      { id: "c5", competencyId: "ORGANIZATION_RESULTS", expectedStage: "C", actualStage: "C", score: 4.2, gap: 0 },
      { id: "c6", competencyId: "PROFESSIONAL_OPENNESS", expectedStage: "C", actualStage: "D", score: 5, gap: 1 }
    ],
    commentsManager: "Alejandro ha tenido un a\xF1o estelar. Lider\xF3 con \xE9xito la entrega t\xE9cnica de la plataforma IoT de Telef\xF3nica. Cumple holgadamente con todos los requisitos para ascender a Arquitecto / Manager L4.",
    commentsHR: "Perfil s\xF3lido con feedback 360 excelente de peers y clientes. Se alinea con los criterios de calibraci\xF3n grupal de la l\xEDnea de desarrollo.",
    promotionRecommendation: {
      ready: true,
      reason: "Score global de 4.4/5. Todas las competencias m\xEDnimas requeridas para L4 (Manager / Lead Architect) est\xE1n cumplidas con creces. Fuerte liderazgo t\xE9cnico."
    }
  },
  {
    evaluationId: "EV002",
    employeeId: "E005",
    // Eduardo García
    year: 2025,
    currentLevelId: "L2",
    // Mid
    targetLevelId: "L3",
    // Senior
    status: "Draft",
    finalScore: 3.8,
    evaluationResult: "MeetsExpectations",
    dimensions: [
      { id: "d6", dimension: "Competencies", weight: 40, score: 3.5 },
      { id: "d7", dimension: "ProjectPerformance", weight: 30, score: 4 },
      { id: "d8", dimension: "Training", weight: 15, score: 3.5 },
      { id: "d9", dimension: "Feedback360", weight: 10, score: 4 },
      { id: "d10", dimension: "CorporateContribution", weight: 5, score: 3 }
    ],
    competencies: [
      { id: "c7", competencyId: "CLIENT_ORIENTATION", expectedStage: "B", actualStage: "B", score: 4, gap: 0 },
      { id: "c8", competencyId: "INNOVATION", expectedStage: "B", actualStage: "B", score: 3.5, gap: 0 },
      { id: "c9", competencyId: "HUMAN_RELATIONS", expectedStage: "B", actualStage: "B", score: 4, gap: 0 },
      { id: "c10", competencyId: "TEAM_LEADERSHIP", expectedStage: "A", actualStage: "B", score: 4, gap: 1 },
      { id: "c11", competencyId: "ORGANIZATION_RESULTS", expectedStage: "B", actualStage: "B", score: 4.2, gap: 0 },
      { id: "c12", competencyId: "PROFESSIONAL_OPENNESS", expectedStage: "B", actualStage: "B", score: 3.5, gap: 0 }
    ],
    commentsManager: "Eduardo cumple bien con las metas en su proyecto asignado (Mercadona). Sigue progresando adecuadamente hacia el nivel Senior, pero consideramos que requiere al menos 6 meses adicionales consolid\xE1ndose en proyectos de alta complejidad t\xE9cnica.",
    commentsHR: "Mantener en el nivel actual para consolidar habilidades fullstack en el plan de desarrollo de 2026.",
    promotionRecommendation: {
      ready: false,
      reason: "Aunque el rendimiento es bueno, a\xFAn tiene peque\xF1os gaps t\xE9cnicos y necesita liderar c\xE9lulas de desarrollo aut\xF3nomas para calificar como Senior L3."
    }
  }
];
var DatabaseStore = class {
  constructor() {
    // Fallbacks in-memory (just in case)
    this.memCareerFamilies = [...INITIAL_CAREER_FAMILIES];
    this.memCareerPaths = [...INITIAL_CAREER_PATHS];
    this.memCareerLevels = [...INITIAL_CAREER_LEVELS];
    this.memCompetencies = [...INITIAL_COMPETENCIES];
    this.memTrainings = [...INITIAL_TRAINING_CATALOG];
    this.memEmployees = [...INITIAL_EMPLOYEES];
    this.memProjects = [...INITIAL_PROJECTS];
    this.memRoleRequests = [...INITIAL_ROLE_REQUESTS];
    this.memAssignments = [...INITIAL_ASSIGNMENTS];
    this.memCheckpoints = [...INITIAL_CHECKPOINTS];
    this.memDevPlans = [...INITIAL_DEVELOPMENT_PLANS];
    this.memAnnualEvaluations = [...INITIAL_ANNUAL_EVALUATIONS];
  }
  async initialize() {
    if (!db) {
      console.log("[Firestore] No active database connection. Operating in memory-only mode.");
      return;
    }
    try {
      const snapshot = await (0, import_firestore.getDocs)((0, import_firestore.query)((0, import_firestore.collection)(db, "employees"), (0, import_firestore.limit)(1)));
      if (snapshot.empty) {
        console.log("[Firestore] Seeding initial data...");
        for (const item of INITIAL_CAREER_FAMILIES) {
          await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "careerFamilies", item.id), item);
        }
        for (const item of INITIAL_CAREER_PATHS) {
          await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "careerPaths", item.id), item);
        }
        for (const item of INITIAL_CAREER_LEVELS) {
          await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "careerLevels", item.id), item);
        }
        for (const item of INITIAL_COMPETENCIES) {
          await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "competencies", item.id), item);
        }
        for (const item of INITIAL_TRAINING_CATALOG) {
          await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "trainings", item.trainingId), item);
        }
        for (const item of INITIAL_EMPLOYEES) {
          await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "employees", item.employeeId), item);
        }
        for (const item of INITIAL_PROJECTS) {
          await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "projects", item.projectId), item);
        }
        for (const item of INITIAL_ROLE_REQUESTS) {
          await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "roleRequests", item.id), item);
        }
        for (const item of INITIAL_ASSIGNMENTS) {
          await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "assignments", item.assignmentId), item);
        }
        for (const item of INITIAL_CHECKPOINTS) {
          await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "checkpoints", item.id), item);
        }
        for (const item of INITIAL_DEVELOPMENT_PLANS) {
          await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "devPlans", item.id), item);
        }
        for (const item of INITIAL_ANNUAL_EVALUATIONS) {
          await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "annualEvaluations", item.evaluationId), item);
        }
        console.log("[Firestore] Data seeding completed.");
      } else {
        console.log("[Firestore] Database is already seeded.");
      }
    } catch (err) {
      console.error("[Firestore] Failed to seed database:", err);
    }
  }
  // Helper to fetch all docs in a collection
  async getAllDocs(collectionName, fallback) {
    if (!db) return fallback;
    try {
      const snapshot = await (0, import_firestore.getDocs)((0, import_firestore.collection)(db, collectionName));
      const list = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data());
      });
      return list;
    } catch (err) {
      console.error(`[Firestore] Error fetching collection ${collectionName}:`, err);
      return fallback;
    }
  }
  // Getters for individual components
  async getCareerFamilies() {
    return this.getAllDocs("careerFamilies", this.memCareerFamilies);
  }
  async getCareerPaths() {
    return this.getAllDocs("careerPaths", this.memCareerPaths);
  }
  async getCareerLevels() {
    return this.getAllDocs("careerLevels", this.memCareerLevels);
  }
  async getCompetencies() {
    return this.getAllDocs("competencies", this.memCompetencies);
  }
  async getTrainings() {
    return this.getAllDocs("trainings", this.memTrainings);
  }
  async getEmployees() {
    return this.getAllDocs("employees", this.memEmployees);
  }
  async getProjects() {
    return this.getAllDocs("projects", this.memProjects);
  }
  async getRoleRequests() {
    return this.getAllDocs("roleRequests", this.memRoleRequests);
  }
  async getAssignments() {
    return this.getAllDocs("assignments", this.memAssignments);
  }
  async getCheckpoints() {
    return this.getAllDocs("checkpoints", this.memCheckpoints);
  }
  async getDevPlans() {
    return this.getAllDocs("devPlans", this.memDevPlans);
  }
  async getAnnualEvaluations() {
    return this.getAllDocs("annualEvaluations", this.memAnnualEvaluations);
  }
  // CRUD utilities
  async getEmployee(id) {
    if (!db) {
      return this.memEmployees.find((e) => e.employeeId === id) || null;
    }
    try {
      const docSnap = await (0, import_firestore.getDoc)((0, import_firestore.doc)(db, "employees", id));
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (err) {
      console.error(`[Firestore] Error getting employee ${id}:`, err);
      return this.memEmployees.find((e) => e.employeeId === id) || null;
    }
  }
  async updateEmployee(id, updated) {
    if (!db) {
      const idx = this.memEmployees.findIndex((e) => e.employeeId === id);
      if (idx !== -1) {
        this.memEmployees[idx] = { ...this.memEmployees[idx], ...updated };
        return this.memEmployees[idx];
      }
      return null;
    }
    try {
      await (0, import_firestore.updateDoc)((0, import_firestore.doc)(db, "employees", id), updated);
      return this.getEmployee(id);
    } catch (err) {
      console.error(`[Firestore] Error updating employee ${id}:`, err);
      return null;
    }
  }
  async addEmployee(emp) {
    if (!db) {
      this.memEmployees.push(emp);
      return emp;
    }
    try {
      await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "employees", emp.employeeId), emp);
      return emp;
    } catch (err) {
      console.error("[Firestore] Error adding employee:", err);
      this.memEmployees.push(emp);
      return emp;
    }
  }
  async addEmployeeSkill(id, skill) {
    const emp = await this.getEmployee(id);
    if (!emp) return null;
    const newSkill = {
      skillId: `s_${Date.now()}`,
      name: skill.name,
      category: skill.category || "General",
      level: Number(skill.level) || 3,
      validatedDate: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      source: skill.source || "Self"
    };
    const updatedSkills = [...emp.skills || [], newSkill];
    return this.updateEmployee(id, { skills: updatedSkills });
  }
  async getProject(id) {
    if (!db) {
      return this.memProjects.find((p) => p.projectId === id) || null;
    }
    try {
      const docSnap = await (0, import_firestore.getDoc)((0, import_firestore.doc)(db, "projects", id));
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (err) {
      console.error(`[Firestore] Error getting project ${id}:`, err);
      return this.memProjects.find((p) => p.projectId === id) || null;
    }
  }
  async addProject(prj) {
    if (!db) {
      this.memProjects.push(prj);
      return prj;
    }
    try {
      await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "projects", prj.projectId), prj);
      return prj;
    } catch (err) {
      console.error("[Firestore] Error adding project:", err);
      this.memProjects.push(prj);
      return prj;
    }
  }
  async addProjectRoleRequest(req) {
    if (!db) {
      this.memRoleRequests.push(req);
      return req;
    }
    try {
      await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "roleRequests", req.id), req);
      return req;
    } catch (err) {
      console.error("[Firestore] Error adding role request:", err);
      this.memRoleRequests.push(req);
      return req;
    }
  }
  async addProjectAssignment(asg) {
    if (!db) {
      this.memAssignments.push(asg);
      const emp = this.memEmployees.find((e) => e.employeeId === asg.employeeId);
      if (emp) {
        emp.availabilityPercent = Math.max(0, emp.availabilityPercent - asg.allocationPercent);
      }
      return asg;
    }
    try {
      await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "assignments", asg.assignmentId), asg);
      const emp = await this.getEmployee(asg.employeeId);
      if (emp) {
        const newAvailability = Math.max(0, emp.availabilityPercent - asg.allocationPercent);
        await this.updateEmployee(asg.employeeId, { availabilityPercent: newAvailability });
      }
      return asg;
    } catch (err) {
      console.error("[Firestore] Error adding project assignment:", err);
      this.memAssignments.push(asg);
      return asg;
    }
  }
  async addCheckpoint(chk) {
    if (!db) {
      this.memCheckpoints.push(chk);
      return chk;
    }
    try {
      await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "checkpoints", chk.id), chk);
      return chk;
    } catch (err) {
      console.error("[Firestore] Error adding checkpoint:", err);
      this.memCheckpoints.push(chk);
      return chk;
    }
  }
  async updateAnnualEvaluation(id, updated) {
    if (!db) {
      const idx = this.memAnnualEvaluations.findIndex((e) => e.evaluationId === id);
      if (idx !== -1) {
        this.memAnnualEvaluations[idx] = { ...this.memAnnualEvaluations[idx], ...updated };
        return this.memAnnualEvaluations[idx];
      }
      return null;
    }
    try {
      await (0, import_firestore.updateDoc)((0, import_firestore.doc)(db, "annualEvaluations", id), updated);
      const docSnap = await (0, import_firestore.getDoc)((0, import_firestore.doc)(db, "annualEvaluations", id));
      return docSnap.exists() ? docSnap.data() : null;
    } catch (err) {
      console.error(`[Firestore] Error updating evaluation ${id}:`, err);
      return null;
    }
  }
  async addAnnualEvaluation(val) {
    if (!db) {
      this.memAnnualEvaluations.push(val);
      return val;
    }
    try {
      await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "annualEvaluations", val.evaluationId), val);
      return val;
    } catch (err) {
      console.error("[Firestore] Error adding evaluation:", err);
      this.memAnnualEvaluations.push(val);
      return val;
    }
  }
  async addDevPlanAction(employeeId, action) {
    const plans = await this.getDevPlans();
    let plan = plans.find((d) => d.employeeId === employeeId);
    const newAction = {
      id: `DA_${Date.now()}`,
      type: action.type || "Training",
      description: action.description,
      targetDate: action.targetDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      status: action.status || "Pending",
      trainingId: action.trainingId
    };
    if (!plan) {
      const newPlan = {
        id: `DP_${Date.now()}`,
        employeeId,
        year: 2026,
        status: "Active",
        actions: [newAction]
      };
      if (!db) {
        this.memDevPlans.push(newPlan);
      } else {
        await (0, import_firestore.setDoc)((0, import_firestore.doc)(db, "devPlans", newPlan.id), newPlan);
      }
      return newPlan;
    } else {
      const updatedActions = [...plan.actions || [], newAction];
      if (!db) {
        plan.actions = updatedActions;
      } else {
        await (0, import_firestore.updateDoc)((0, import_firestore.doc)(db, "devPlans", plan.id), { actions: updatedActions });
        const docSnap = await (0, import_firestore.getDoc)((0, import_firestore.doc)(db, "devPlans", plan.id));
        plan = docSnap.data();
      }
      return plan;
    }
  }
  // Matching Engine calculation
  async getMatchingResults(requestId) {
    const roleReqs = await this.getRoleRequests();
    const req = roleReqs.find((r) => r.id === requestId);
    if (!req) return [];
    const emps = await this.getEmployees();
    return emps.map((emp) => {
      let skillScore = 0;
      if (req.requiredSkills.length > 0) {
        let matches = 0;
        req.requiredSkills.forEach((reqSkillName) => {
          const hasSkill = emp.skills.find((s) => s.name.toLowerCase() === reqSkillName.toLowerCase());
          if (hasSkill) {
            matches += hasSkill.level / 5;
          }
        });
        skillScore = Math.round(matches / req.requiredSkills.length * 100);
      } else {
        skillScore = 100;
      }
      const getNum = (lid) => parseInt(lid.replace("L", "")) || 1;
      const reqNum = getNum(req.requiredLevelId);
      const empNum = getNum(emp.currentLevelId);
      let levelScore = 100;
      if (empNum < reqNum) {
        levelScore = Math.max(0, 100 - (reqNum - empNum) * 30);
      } else if (empNum > reqNum) {
        levelScore = Math.max(50, 100 - (empNum - reqNum) * 15);
      }
      let availabilityScore = 0;
      if (emp.availabilityPercent >= req.allocation) {
        availabilityScore = 100;
      } else {
        availabilityScore = Math.round(emp.availabilityPercent / req.allocation * 100);
      }
      let performanceScore = 80;
      if (emp.projectHistory.length > 0) {
        const sum = emp.projectHistory.reduce((acc, curr) => acc + curr.performance, 0);
        const avg = sum / emp.projectHistory.length;
        performanceScore = Math.round(avg / 5 * 100);
      }
      const globalScore = Math.round(skillScore * 0.4 + levelScore * 0.2 + availabilityScore * 0.25 + performanceScore * 0.15);
      return {
        id: `M_${req.id}_${emp.employeeId}`,
        employeeId: emp.employeeId,
        projectRoleRequestId: req.id,
        skillScore,
        levelScore,
        availabilityScore,
        performanceScore,
        globalScore,
        employee: emp
      };
    }).sort((a, b) => b.globalScore - a.globalScore);
  }
};
var dbStoreInstance = new DatabaseStore();

// server.ts
var import_genai = require("@google/genai");
var aiInstance = null;
function getAI() {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is required but missing. Please add it via the Secrets Panel.");
    }
    aiInstance = new import_genai.GoogleGenAI({
      apiKey: key,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiInstance;
}
async function startServer() {
  const app = (0, import_express.default)();
  const PORT = 3e3;
  app.use(import_express.default.json());
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    if (req.method === "OPTIONS") {
      return res.sendStatus(200);
    }
    next();
  });
  await dbStoreInstance.initialize();
  app.get("/api/career-framework", async (req, res) => {
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
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/api/employees", async (req, res) => {
    try {
      const emps = await dbStoreInstance.getEmployees();
      res.json(emps);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/api/employees/:id", async (req, res) => {
    try {
      const emp = await dbStoreInstance.getEmployee(req.params.id);
      if (!emp) return res.status(404).json({ error: "Employee not found" });
      res.json(emp);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/employees", async (req, res) => {
    try {
      const newEmp = req.body;
      if (!newEmp.employeeId || !newEmp.name || !newEmp.surname) {
        return res.status(400).json({ error: "Missing employee identifier or name properties" });
      }
      const added = await dbStoreInstance.addEmployee({
        ...newEmp,
        skills: newEmp.skills || [],
        certifications: newEmp.certifications || [],
        projectHistory: newEmp.projectHistory || []
      });
      res.status(201).json(added);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/employees/:id/skills", async (req, res) => {
    try {
      const emp = await dbStoreInstance.addEmployeeSkill(req.params.id, req.body);
      if (!emp) return res.status(404).json({ error: "Employee not found" });
      res.status(201).json(emp);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/api/projects", async (req, res) => {
    try {
      const prjs = await dbStoreInstance.getProjects();
      res.json(prjs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/projects", async (req, res) => {
    try {
      const prj = req.body;
      if (!prj.projectId || !prj.projectName) {
        return res.status(400).json({ error: "Missing projectId or projectName" });
      }
      const added = await dbStoreInstance.addProject({
        projectId: prj.projectId,
        clientName: prj.clientName || "Cliente Gen\xE9rico",
        projectName: prj.projectName,
        businessUnit: prj.businessUnit || "IT Consulting",
        status: prj.status || "InPreparation",
        startDate: prj.startDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        endDate: prj.endDate || "",
        budget: Number(prj.budget) || 0,
        technologies: prj.technologies || []
      });
      res.status(201).json(added);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/api/role-requests", async (req, res) => {
    try {
      const rrs = await dbStoreInstance.getRoleRequests();
      res.json(rrs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/role-requests", async (req, res) => {
    try {
      const roleReq = req.body;
      if (!roleReq.projectId || !roleReq.careerPathId || !roleReq.requiredLevelId) {
        return res.status(400).json({ error: "Missing required role request fields" });
      }
      const newReq = {
        ...roleReq,
        id: `REQ_${Date.now()}`
      };
      const added = await dbStoreInstance.addProjectRoleRequest(newReq);
      res.status(201).json(added);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/api/assignments", async (req, res) => {
    try {
      const asgs = await dbStoreInstance.getAssignments();
      res.json(asgs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/assignments", async (req, res) => {
    try {
      const asg = req.body;
      if (!asg.employeeId || !asg.projectId) {
        return res.status(400).json({ error: "Missing employeeId or projectId" });
      }
      const newAsg = {
        assignmentId: `ASG_${Date.now()}`,
        employeeId: asg.employeeId,
        projectId: asg.projectId,
        role: asg.role || "Consultant",
        allocationPercent: Number(asg.allocationPercent) || 100,
        startDate: asg.startDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
        endDate: asg.endDate || ""
      };
      const added = await dbStoreInstance.addProjectAssignment(newAsg);
      res.status(201).json(added);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/api/matching/:requestId", async (req, res) => {
    try {
      const results = await dbStoreInstance.getMatchingResults(req.params.requestId);
      res.json(results);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/api/checkpoints", async (req, res) => {
    try {
      const chks = await dbStoreInstance.getCheckpoints();
      res.json(chks);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/checkpoints", async (req, res) => {
    try {
      const cp = req.body;
      if (!cp.employeeId || !cp.projectId || !cp.reviewerId) {
        return res.status(400).json({ error: "Missing employee, project, or reviewer ID" });
      }
      const newCp = {
        ...cp,
        id: `CK_${Date.now()}`
      };
      const added = await dbStoreInstance.addCheckpoint(newCp);
      res.status(201).json(added);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/api/annual-evaluations", async (req, res) => {
    try {
      const evs = await dbStoreInstance.getAnnualEvaluations();
      res.json(evs);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.put("/api/annual-evaluations/:id", async (req, res) => {
    try {
      const updated = await dbStoreInstance.updateAnnualEvaluation(req.params.id, req.body);
      if (!updated) return res.status(404).json({ error: "Evaluation not found" });
      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/annual-evaluations", async (req, res) => {
    try {
      const val = req.body;
      if (!val.employeeId) {
        return res.status(400).json({ error: "Missing employeeId" });
      }
      const newVal = {
        ...val,
        evaluationId: `EV_${Date.now()}`
      };
      const added = await dbStoreInstance.addAnnualEvaluation(newVal);
      res.status(201).json(added);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.get("/api/dev-plans", async (req, res) => {
    try {
      const plans = await dbStoreInstance.getDevPlans();
      res.json(plans);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/dev-plans/:employeeId/actions", async (req, res) => {
    try {
      const empId = req.params.employeeId;
      const plan = await dbStoreInstance.addDevPlanAction(empId, req.body);
      res.status(201).json(plan);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/ai/match-explanation", async (req, res) => {
    try {
      const { employee, request, scoreBreakdown } = req.body;
      if (!employee || !request) {
        return res.status(400).json({ error: "Missing employee or role request parameters" });
      }
      const prompt = `
        Analiza detalladamente por qu\xE9 el colaborador ${employee.name} ${employee.surname} (Nivel: ${employee.currentLevelId}, Especialidad: ${employee.currentCareerPathId}) encaja en el rol de proyecto solicitado.

        Requisitos de la solicitud de Staffing:
        - Especialidad de carrera: ${request.careerPathId}
        - Nivel de experiencia requerido: ${request.requiredLevelId}
        - Skills T\xE9cnicos requeridos: ${request.requiredSkills ? request.requiredSkills.join(", ") : "Ninguno especificado"}
        - Dedicaci\xF3n/Asignaci\xF3n esperada: ${request.allocation}%

        Skills actuales del colaborador:
        ${JSON.stringify(employee.skills)}

        Certificaciones actuales:
        ${JSON.stringify(employee.certifications)}

        Scores de matching calculados por el algoritmo:
        - Compatibilidad de Skills: ${scoreBreakdown.skillScore}%
        - Compatibilidad de Nivel Corporativo: ${scoreBreakdown.levelScore}%
        - Compatibilidad de Disponibilidad: ${scoreBreakdown.availabilityScore}%
        - Desempe\xF1o Hist\xF3rico: ${scoreBreakdown.performanceScore}%
        - Score Global: ${scoreBreakdown.globalScore}%

        Por favor, act\xFAa como el agente experto "HR PROJECT TALENT ORCHESTRATOR" y genera un informe estructurado que contenga:
        1. **Resumen de Idoneidad**: Breve an\xE1lisis de fortalezas t\xE9cnicas y funcionales que lo hacen adecuado.
        2. **Gaps Identificados**: Qu\xE9 tecnolog\xEDas requeridas le faltan o qu\xE9 skills deber\xEDa reforzar antes/durante la incorporaci\xF3n.
        3. **Plan de Reskilling R\xE1pido Recomendado**: Sugiere acciones de formaci\xF3n espec\xEDficas o mentor\xEDa t\xE9cnica bas\xE1ndote en la solicitud de staffing.
        4. **Riesgos de Asignaci\xF3n**: Analiza riesgos (por ejemplo, si tiene poca disponibilidad o si est\xE1 sobre-calificado y puede aburrirse, o sub-calificado).

        Escribe tu respuesta en un formato markdown elegante en espa\xF1ol. S\xE9 sumamente profesional, constructivo y \xFAtil para el Project Manager.
      `;
      const ai = getAI();
      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: 'Eres el copiloto de staffing de IT Consulting "Talent Orchestrator AI", tu meta es guiar decisiones objetivas de asignaci\xF3n t\xE9cnica.'
        }
      });
      res.json({ explanation: result.text });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/ai/career-gap-analysis", async (req, res) => {
    try {
      const { employee, targetLevelId } = req.body;
      if (!employee || !targetLevelId) {
        return res.status(400).json({ error: "Missing employee or targetLevelId parameters" });
      }
      const trainings = await dbStoreInstance.getTrainings();
      const prompt = `
        Colaborador: ${employee.name} ${employee.surname}
        Especialidad actual: ${employee.currentCareerPathId}
        Nivel actual: ${employee.currentLevelId}
        Nivel objetivo para promoci\xF3n: ${targetLevelId}

        Skills actuales:
        ${JSON.stringify(employee.skills)}

        Certificaciones actuales:
        ${JSON.stringify(employee.certifications)}

        Cat\xE1logo de formaciones disponibles en la empresa:
        ${JSON.stringify(trainings)}

        Por favor, act\xFAa como el "HR PROJECT TALENT ORCHESTRATOR". Analiza las brechas de competencias (skills/seniority) que impiden a este colaborador promocionar al nivel ${targetLevelId} (seg\xFAn el Career Framework de IT Consulting).
        
        Tu informe estructurado en markdown debe contener:
        1. **Diagn\xF3stico de Seniority**: Comparaci\xF3n de sus habilidades actuales contra las expectativas del nivel objetivo.
        2. **Brechas Cr\xEDticas (Gaps)**: Principales competencias t\xE9cnicas, de liderazgo o de negocio que debe mejorar.
        3. **Itinerario Formativo Recomendado**: Selecciona y mapea espec\xEDficamente los cursos disponibles en el cat\xE1logo de formaciones de la empresa (menciona su ID, nombre y por qu\xE9 le ayudar\xE1).
        4. **Acciones de Desarrollo On-the-Job**: Sugiere asignaciones pr\xE1cticas o roles en su proyecto actual para entrenar estas competencias de manera pr\xE1ctica.

        Escribe en espa\xF1ol, manteniendo un tono de mentor\xEDa t\xE9cnica y de carrera inspirador y objetivo.
      `;
      const ai = getAI();
      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Eres un Career Manager virtual experto de Sopra Steria / Consultor\xEDa IT, guiando el upskilling alineado a proyectos."
        }
      });
      res.json({ analysis: result.text });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/ai/draft-evaluation", async (req, res) => {
    try {
      const { employee, evaluation, checkpoints } = req.body;
      if (!employee || !evaluation) {
        return res.status(400).json({ error: "Missing employee or evaluation details" });
      }
      const prompt = `
        Colaborador: ${employee.name} ${employee.surname} (Nivel actual: ${employee.currentLevelId}, Objetivo: ${evaluation.targetLevelId})
        Scores por dimensi\xF3n en evaluaci\xF3n (escala 1-5):
        ${JSON.stringify(evaluation.dimensions)}

        Calificaciones de competencias (esperado vs real):
        ${JSON.stringify(evaluation.competencies)}

        Hist\xF3rico de checkpoints mensuales/trimestrales en proyecto:
        ${JSON.stringify(checkpoints)}

        Por favor, act\xFAa como el "HR PROJECT TALENT ORCHESTRATOR" y ayuda al Project Manager a redactar un borrador formal, profesional, emp\xE1tico y estructurado de la evaluaci\xF3n anual de desempe\xF1o de este colaborador.
        El borrador debe contener:
        1. **Resumen de Desempe\xF1o Global**: Destacando los logros clave en proyectos y KPIs alcanzados.
        2. **Valoraci\xF3n de Competencias Corporativas**: An\xE1lisis de su orientaci\xF3n al cliente, liderazgo, innovaci\xF3n y relaci\xF3n con el equipo bas\xE1ndote en los datos provistos.
        3. **Fortalezas Principales**: 3 fortalezas que lo diferencian.
        4. **\xC1reas de Desarrollo / Mejora Continua**: Consejos pr\xE1cticos y constructivos de cara al ciclo de carrera del pr\xF3ximo a\xF1o.
        5. **Criterio de Promoci\xF3n**: Justificaci\xF3n objetiva sobre si est\xE1 listo o no para promocionar de ${employee.currentLevelId} a ${evaluation.targetLevelId}.

        Usa un lenguaje formal de RRHH en espa\xF1ol, extremadamente objetivo y libre de sesgos, ideal para el comit\xE9 de calibraci\xF3n anual.
      `;
      const ai = getAI();
      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          systemInstruction: "Eres un calibrador experto de RRHH en comit\xE9s de evaluaci\xF3n corporativa IT. Tu objetivo es asegurar objetividad, rigor t\xE9cnico y un plan de acci\xF3n constructivo."
        }
      });
      res.json({ draft: result.text });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  app.post("/api/ai/copilot", async (req, res) => {
    try {
      const { messages } = req.body;
      if (!messages || !Array.isArray(messages)) {
        return res.status(400).json({ error: "Missing chat messages array" });
      }
      const [employees, projects, roleRequests, trainings, annualEvaluations] = await Promise.all([
        dbStoreInstance.getEmployees(),
        dbStoreInstance.getProjects(),
        dbStoreInstance.getRoleRequests(),
        dbStoreInstance.getTrainings(),
        dbStoreInstance.getAnnualEvaluations()
      ]);
      const systemInstruction = `
        Eres "Talent Orchestrator AI", el copiloto inteligente de RRHH, staffing y desarrollo profesional dentro de la plataforma CRH Management.
        Tienes acceso a los datos completos de la empresa:
        
        Colaboradores actuales:
        ${JSON.stringify(employees.map((e) => ({ id: e.employeeId, nombre: `${e.name} ${e.surname}`, nivel: e.currentLevelId, path: e.currentCareerPathId, skills: e.skills.map((s) => `${s.name} (Lvl ${s.level})`), availability: e.availabilityPercent, certificaciones: e.certifications.map((c) => c.certificationName) })))}

        Proyectos activos y planificados:
        ${JSON.stringify(projects)}

        Solicitudes de staffing vigentes (necesidades de recursos):
        ${JSON.stringify(roleRequests)}

        Cat\xE1logo de formaciones:
        ${JSON.stringify(trainings)}

        Evaluaciones de desempe\xF1o anuales del ciclo actual:
        ${JSON.stringify(annualEvaluations.map((ev) => ({ id: ev.evaluationId, employeeId: ev.employeeId, score: ev.finalScore, result: ev.evaluationResult, status: ev.status, readyForPromotion: ev.promotionRecommendation })))}

        Tus responsabilidades son:
        1. Analizar necesidades de proyectos y proponer el mejor matching.
        2. Identificar qu\xE9 personas quedar\xE1n libres o en bench para optimizar la utilizaci\xF3n de la plantilla.
        3. Detectar gaps de skills grupales o individuales y recomendar cursos del cat\xE1logo.
        4. Ayudar a Managers y a RRHH a resolver dudas objetivas sobre si un colaborador califica para promoci\xF3n.
        5. Proponer planes de acci\xF3n y mitigar riesgos de asignaci\xF3n.

        Reglas:
        - Fundamenta todas las recomendaciones en los datos proporcionados arriba.
        - Explica tu razonamiento de forma num\xE9rica u objetiva cuando hables de scores.
        - Evita sesgos subjetivos. Prioriza m\xE9ritos del framework.
        - S\xE9 conciso, profesional y directo. Escribe siempre en espa\xF1ol.
      `;
      const apiContents = messages.map((m) => ({
        role: m.role === "user" ? "user" : "model",
        parts: [{ text: m.text }]
      }));
      const ai = getAI();
      const result = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: apiContents,
        config: {
          systemInstruction
        }
      });
      res.json({ response: result.text });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[CRH Management Server] running on http://localhost:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
