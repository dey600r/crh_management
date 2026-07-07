import {
  CareerFamily,
  CareerPath,
  CareerLevel,
  Competency,
  Employee,
  Project,
  ProjectRoleRequest,
  ProjectAssignment,
  TrainingCatalog,
  CheckpointReview,
  AnnualEvaluation,
  DevelopmentPlan
} from '../types';

export const INITIAL_CAREER_FAMILIES: CareerFamily[] = [
  { id: 'F_ARC', code: 'ARC', name: 'Architecture & Tech Leadership', description: 'Diseño técnico, gobernanza de sistemas y liderazgo tecnológico.', active: true },
  { id: 'F_SWE', code: 'SWE', name: 'Software Engineering', description: 'Construcción, testing y despliegue de soluciones de software.', active: true },
  { id: 'F_MGT', code: 'MGT', name: 'Project & Product Management', description: 'Gestión ágil de proyectos, presupuestos y coordinación de equipos.', active: true },
  { id: 'F_CON', code: 'CON', name: 'Consulting', description: 'Consultoría de negocio, análisis funcional e implantación.', active: true }
];

export const INITIAL_CAREER_PATHS: CareerPath[] = [
  { id: 'P_ARC', careerFamilyId: 'F_ARC', code: 'P_ARC', name: 'Software Architecture', description: 'Especialización en diseño de arquitecturas de software, patrones y cloud.' },
  { id: 'P_SWE', careerFamilyId: 'F_SWE', code: 'P_SWE', name: 'Fullstack Software Development', description: 'Desarrollo extremo a extremo (Frontend, Backend, bases de datos).' },
  { id: 'P_MGT', careerFamilyId: 'F_MGT', code: 'P_MGT', name: 'Technical Project Management', description: 'Liderazgo ágil, Scrum, coordinación de stakeholders.' },
  { id: 'P_CON', careerFamilyId: 'F_CON', code: 'P_CON', name: 'Business & functional Analysis', description: 'Análisis de requisitos funcionales, alineación con negocio.' }
];

export const INITIAL_CAREER_LEVELS: CareerLevel[] = [
  { id: 'L1', levelCode: 'T1', levelNumber: 1, name: 'Technician (Junior Dev)', experienceFrom: 0, experienceTo: 2 },
  { id: 'L2', levelCode: 'E1', levelNumber: 2, name: 'Engineer (Mid Dev)', experienceFrom: 2, experienceTo: 4 },
  { id: 'L3', levelCode: 'E2', levelNumber: 3, name: 'Senior Engineer', experienceFrom: 4, experienceTo: 7 },
  { id: 'L4', levelCode: 'M1', levelNumber: 4, name: 'Manager / Lead Architect', experienceFrom: 7, experienceTo: 10 },
  { id: 'L5', levelCode: 'M2', levelNumber: 5, name: 'Senior Manager', experienceFrom: 10, experienceTo: 15 },
  { id: 'L6', levelCode: 'D1', levelNumber: 6, name: 'Director', experienceFrom: 15, experienceTo: 99 }
];

export const INITIAL_COMPETENCIES: Competency[] = [
  { id: 'CLIENT_ORIENTATION', code: 'CLIENT_ORIENTATION', name: 'Orientación al Cliente', type: 'Business', description: 'Capacidad para alinear el desarrollo con necesidades del cliente y aportar valor.' },
  { id: 'INNOVATION', code: 'INNOVATION', name: 'Innovación Tecnológica', type: 'Technical', description: 'Adopción proactiva de nuevos stacks, optimización y creatividad técnica.' },
  { id: 'HUMAN_RELATIONS', code: 'HUMAN_RELATIONS', name: 'Relaciones Humanas & Empatía', type: 'Behavioral', description: 'Comunicación fluida, asertividad, resolución de conflictos internos.' },
  { id: 'TEAM_LEADERSHIP', code: 'TEAM_LEADERSHIP', name: 'Liderazgo & Mentoría', type: 'Leadership', description: 'Capacidad de guiar al equipo, delegar eficientemente y formar a juniors.' },
  { id: 'ORGANIZATION_RESULTS', code: 'ORGANIZATION_RESULTS', name: 'Orientación a Resultados', type: 'Business', description: 'Foco en entregables de alta calidad, control de plazos y proactividad.' },
  { id: 'PROFESSIONAL_OPENNESS', code: 'PROFESSIONAL_OPENNESS', name: 'Apertura Profesional', type: 'Behavioral', description: 'Autoaprendizaje continuo, generosidad para compartir conocimiento.' }
];

export const INITIAL_TRAINING_CATALOG: TrainingCatalog[] = [
  { trainingId: 'TR1', name: 'Arquitectura Enterprise con Clean Architecture y DDD', provider: 'Sopra Academies', durationHours: 40, level: 'Advanced', cost: 1200, coveredCompetencies: ['INNOVATION', 'ORGANIZATION_RESULTS'] },
  { trainingId: 'TR2', name: 'React 19, Next.js Masterclass & Tailwind Enterprise', provider: 'Frontend Experts', durationHours: 25, level: 'Intermediate', cost: 600, coveredCompetencies: ['INNOVATION'] },
  { trainingId: 'TR3', name: 'Certificación Oficial AWS Solutions Architect Associate', provider: 'AWS Training', durationHours: 50, level: 'Advanced', cost: 1500, coveredCompetencies: ['INNOVATION', 'ORGANIZATION_RESULTS'] },
  { trainingId: 'TR4', name: 'Liderazgo Ágil, Gestión de Conflictos y Facilitación', provider: 'Agile Alliance', durationHours: 20, level: 'Intermediate', cost: 800, coveredCompetencies: ['TEAM_LEADERSHIP', 'HUMAN_RELATIONS'] },
  { trainingId: 'TR5', name: 'Comunicación Asertiva y Relación de Alta Fidelidad con Clientes', provider: 'Soft Skills Corp', durationHours: 16, level: 'Beginner', cost: 400, coveredCompetencies: ['CLIENT_ORIENTATION', 'HUMAN_RELATIONS'] }
];

export const INITIAL_EMPLOYEES: Employee[] = [
  {
    employeeId: 'E001',
    name: 'Alejandro',
    surname: 'Sanz Guerrero',
    email: 'alejandro.sanz@itconsulting.com',
    country: 'España',
    office: 'Madrid',
    department: 'Software Engineering',
    managerId: 'E004',
    careerManagerId: 'E004',
    currentCareerPathId: 'P_SWE',
    currentLevelId: 'L3', // Senior Engineer
    hireDate: '2022-03-15',
    status: 'Active',
    availabilityPercent: 100, // Fully available on bench!
    skills: [
      { skillId: 's1', name: 'React', category: 'Frontend', level: 5, validatedDate: '2025-01-10', source: 'Project' },
      { skillId: 's2', name: 'Node.js', category: 'Backend', level: 4, validatedDate: '2025-02-15', source: 'Project' },
      { skillId: 's3', name: 'TypeScript', category: 'Languages', level: 5, validatedDate: '2025-03-01', source: 'Self' },
      { skillId: 's4', name: 'PostgreSQL', category: 'Databases', level: 4, validatedDate: '2024-11-20', source: 'Project' },
      { skillId: 's5', name: 'AWS', category: 'Cloud', level: 3, validatedDate: '2024-06-10', source: 'Self' }
    ],
    certifications: [
      { id: 'c1', certificationName: 'AWS Certified Cloud Practitioner', provider: 'AWS', issueDate: '2024-05-12', expiryDate: '2027-05-12' }
    ],
    projectHistory: [
      { projectId: 'PRJ003', role: 'Senior React Developer', performance: 4.5 }
    ]
  },
  {
    employeeId: 'E002',
    name: 'Beatriz',
    surname: 'Ortiz Calvo',
    email: 'beatriz.ortiz@itconsulting.com',
    country: 'España',
    office: 'Barcelona',
    department: 'Architecture & Tech Leadership',
    managerId: 'E006',
    careerManagerId: 'E006',
    currentCareerPathId: 'P_ARC',
    currentLevelId: 'L4', // Lead Architect
    hireDate: '2020-09-01',
    status: 'Active',
    availabilityPercent: 20, // Low availability, freeing up soon
    skills: [
      { skillId: 's6', name: 'Enterprise Architect', category: 'Architecture', level: 5, validatedDate: '2024-10-15', source: 'Project' },
      { skillId: 's7', name: 'Kubernetes', category: 'DevOps', level: 5, validatedDate: '2025-01-20', source: 'Project' },
      { skillId: 's8', name: 'Java', category: 'Backend', level: 5, validatedDate: '2023-08-11', source: 'Project' },
      { skillId: 's9', name: 'Spring Boot', category: 'Backend', level: 5, validatedDate: '2024-02-14', source: 'Project' },
      { skillId: 's10', name: 'Terraform', category: 'Cloud', level: 4, validatedDate: '2024-12-01', source: 'Self' },
      { skillId: 's5', name: 'AWS', category: 'Cloud', level: 5, validatedDate: '2024-05-01', source: 'Project' }
    ],
    certifications: [
      { id: 'c2', certificationName: 'TOGAF 9 Certified', provider: 'The Open Group', issueDate: '2021-02-18', expiryDate: '2030-01-01' },
      { id: 'c3', certificationName: 'Certified Kubernetes Administrator (CKA)', provider: 'CNCF', issueDate: '2023-11-05', expiryDate: '2026-11-05' }
    ],
    projectHistory: [
      { projectId: 'PRJ001', role: 'Lead Architect', performance: 4.8 }
    ]
  },
  {
    employeeId: 'E003',
    name: 'Carlos',
    surname: 'Méndez Ruiz',
    email: 'carlos.mendez@itconsulting.com',
    country: 'España',
    office: 'Madrid',
    department: 'Software Engineering',
    managerId: 'E001',
    careerManagerId: 'E001',
    currentCareerPathId: 'P_SWE',
    currentLevelId: 'L1', // Junior Dev
    hireDate: '2024-06-01',
    status: 'Active',
    availabilityPercent: 100, // Fully available
    skills: [
      { skillId: 's1', name: 'React', category: 'Frontend', level: 3, validatedDate: '2025-04-01', source: 'Self' },
      { skillId: 's11', name: 'JavaScript', category: 'Languages', level: 4, validatedDate: '2024-07-15', source: 'Self' },
      { skillId: 's12', name: 'HTML & CSS', category: 'Frontend', level: 4, validatedDate: '2024-06-15', source: 'Self' }
    ],
    certifications: [],
    projectHistory: []
  },
  {
    employeeId: 'E004',
    name: 'Daniela',
    surname: 'Vega Soler',
    email: 'daniela.vega@itconsulting.com',
    country: 'España',
    office: 'Valencia',
    department: 'Project & Product Management',
    managerId: 'E006',
    careerManagerId: 'E006',
    currentCareerPathId: 'P_MGT',
    currentLevelId: 'L4', // Manager
    hireDate: '2021-01-15',
    status: 'Active',
    availabilityPercent: 0, // Fully allocated
    skills: [
      { skillId: 's13', name: 'Agile Management', category: 'Agile', level: 5, validatedDate: '2024-09-10', source: 'Project' },
      { skillId: 's14', name: 'Scrum Master', category: 'Agile', level: 5, validatedDate: '2024-08-11', source: 'Project' },
      { skillId: 's15', name: 'Risk Management', category: 'Management', level: 4, validatedDate: '2023-12-05', source: 'Project' }
    ],
    certifications: [
      { id: 'c4', certificationName: 'Project Management Professional (PMP)', provider: 'PMI', issueDate: '2022-04-20', expiryDate: '2025-04-20' },
      { id: 'c5', certificationName: 'Certified ScrumMaster (CSM)', provider: 'Scrum Alliance', issueDate: '2021-06-10', expiryDate: '2024-06-10' }
    ],
    projectHistory: [
      { projectId: 'PRJ001', role: 'Project Manager', performance: 4.6 }
    ]
  },
  {
    employeeId: 'E005',
    name: 'Eduardo',
    surname: 'García Lorca',
    email: 'eduardo.garcia@itconsulting.com',
    country: 'Colombia',
    office: 'Bogotá',
    department: 'Software Engineering',
    managerId: 'E001',
    careerManagerId: 'E004',
    currentCareerPathId: 'P_SWE',
    currentLevelId: 'L2', // Engineer (Mid)
    hireDate: '2023-11-01',
    status: 'Active',
    availabilityPercent: 50, // Partly busy
    skills: [
      { skillId: 's16', name: 'Vue', category: 'Frontend', level: 4, validatedDate: '2024-08-10', source: 'Project' },
      { skillId: 's2', name: 'Node.js', category: 'Backend', level: 3, validatedDate: '2024-11-15', source: 'Self' },
      { skillId: 's17', name: 'MongoDB', category: 'Databases', level: 4, validatedDate: '2024-09-20', source: 'Project' }
    ],
    certifications: [],
    projectHistory: [
      { projectId: 'PRJ002', role: 'Vue Developer', performance: 4.0 }
    ]
  },
  {
    employeeId: 'E006',
    name: 'Sofia',
    surname: 'Alarcón Torres',
    email: 'sofia.alarcon@itconsulting.com',
    country: 'España',
    office: 'Madrid',
    department: 'Architecture & Tech Leadership',
    managerId: 'HR_ROOT',
    careerManagerId: 'HR_ROOT',
    currentCareerPathId: 'P_ARC',
    currentLevelId: 'L5', // Senior Manager / Director
    hireDate: '2018-05-10',
    status: 'Active',
    availabilityPercent: 10,
    skills: [
      { skillId: 's6', name: 'Enterprise Architect', category: 'Architecture', level: 5, validatedDate: '2023-10-10', source: 'Project' },
      { skillId: 's18', name: 'Solution Blueprint', category: 'Architecture', level: 5, validatedDate: '2024-01-11', source: 'Project' },
      { skillId: 's10', name: 'Terraform', category: 'Cloud', level: 5, validatedDate: '2024-06-01', source: 'Project' }
    ],
    certifications: [
      { id: 'c6', certificationName: 'AWS Certified Solutions Architect Professional', provider: 'AWS', issueDate: '2022-11-15', expiryDate: '2025-11-15' }
    ],
    projectHistory: [
      { projectId: 'PRJ001', role: 'Principal Director', performance: 4.9 }
    ]
  }
];

export const INITIAL_PROJECTS: Project[] = [
  {
    projectId: 'PRJ001',
    clientName: 'Banco Santander',
    projectName: 'Cloud Migration & Core Modernization',
    businessUnit: 'Banca y Seguros',
    status: 'Active',
    startDate: '2025-01-10',
    endDate: '2026-12-31',
    budget: 850000,
    technologies: ['AWS', 'Kubernetes', 'Terraform', 'Spring Boot', 'Java']
  },
  {
    projectId: 'PRJ002',
    clientName: 'Mercadona',
    projectName: 'E-Commerce Redesign & Microservices',
    businessUnit: 'Retail & Logística',
    status: 'InPreparation',
    startDate: '2026-08-01',
    endDate: '2027-05-31',
    budget: 420000,
    technologies: ['Vue', 'Node.js', 'React', 'MongoDB', 'TypeScript', 'Docker']
  },
  {
    projectId: 'PRJ003',
    clientName: 'Telefónica',
    projectName: 'IoT Device Analytics Platform',
    businessUnit: 'Telecomunicaciones',
    status: 'Active',
    startDate: '2025-06-01',
    endDate: '2026-06-01',
    budget: 310000,
    technologies: ['React', 'TypeScript', 'Node.js', 'PostgreSQL', 'AWS']
  }
];

export const INITIAL_ROLE_REQUESTS: ProjectRoleRequest[] = [
  {
    id: 'REQ001',
    projectId: 'PRJ002', // Mercadona Redesign
    careerPathId: 'P_SWE',
    requiredLevelId: 'L3', // Senior Dev
    requiredSkills: ['React', 'Node.js', 'TypeScript'],
    startDate: '2026-08-01',
    allocation: 100,
    priority: 'High'
  },
  {
    id: 'REQ002',
    projectId: 'PRJ001', // Cloud Migration Santander
    careerPathId: 'P_ARC',
    requiredLevelId: 'L4', // Lead Architect
    requiredSkills: ['Kubernetes', 'AWS', 'Terraform'],
    startDate: '2026-07-20',
    allocation: 100,
    priority: 'High'
  },
  {
    id: 'REQ003',
    projectId: 'PRJ002', // Mercadona Redesign
    careerPathId: 'P_SWE',
    requiredLevelId: 'L2', // Mid Dev
    requiredSkills: ['Vue', 'MongoDB'],
    startDate: '2026-08-15',
    allocation: 50,
    priority: 'Medium'
  }
];

export const INITIAL_ASSIGNMENTS: ProjectAssignment[] = [
  { assignmentId: 'A001', employeeId: 'E002', projectId: 'PRJ001', role: 'Lead Architect', allocationPercent: 80, startDate: '2025-01-10', endDate: '2026-12-31' },
  { assignmentId: 'A002', employeeId: 'E004', projectId: 'PRJ001', role: 'Project Manager', allocationPercent: 100, startDate: '2025-01-10', endDate: '2026-12-31' },
  { assignmentId: 'A003', employeeId: 'E005', projectId: 'PRJ002', role: 'Vue Developer', allocationPercent: 50, startDate: '2025-08-01', endDate: '2026-05-31' }
];

export const INITIAL_CHECKPOINTS: CheckpointReview[] = [
  {
    id: 'CK001',
    employeeId: 'E005', // Eduardo Mid Vue Dev
    projectId: 'PRJ002',
    reviewerId: 'E004', // Daniela Vega (Project Manager)
    reviewDate: '2025-12-15',
    reviewType: 'Quarterly',
    comments: 'Eduardo se ha adaptado muy bien al equipo de Mercadona. Su trabajo con Vue es de alta calidad, aunque necesitamos que asuma más liderazgo en backend con Node.',
    scores: [
      { competencyId: 'ORGANIZATION_RESULTS', score: 4, comments: 'Entregas a tiempo y limpias.' },
      { competencyId: 'HUMAN_RELATIONS', score: 4, comments: 'Excelente colaboración con su par en frontend.' },
      { competencyId: 'INNOVATION', score: 3, comments: 'Se limita al patrón establecido, correcto pero sin proponer alternativas.' }
    ],
    kpis: [
      { id: 'k1', kpi: 'Quality', weight: 30, targetValue: 4, currentValue: 4.2 },
      { id: 'k2', kpi: 'Delivery', weight: 30, targetValue: 4, currentValue: 4.0 },
      { id: 'k3', kpi: 'Customer Satisfaction', weight: 40, targetValue: 4, currentValue: 4.5 }
    ]
  },
  {
    id: 'CK002',
    employeeId: 'E001', // Alejandro (Sanz)
    projectId: 'PRJ003', // IoT Analytics Platform
    reviewerId: 'E004', // Daniela PM
    reviewDate: '2025-11-30',
    reviewType: 'Monthly',
    comments: 'Alejandro es un recurso excepcional en React. Ayudó a estructurar la base de código del proyecto Telefónica IoT de manera óptima.',
    scores: [
      { competencyId: 'INNOVATION', score: 5, comments: 'Propuso arquitectura modular excelente.' },
      { competencyId: 'ORGANIZATION_RESULTS', score: 5, comments: 'Superó los objetivos de rendimiento del dashboard.' },
      { competencyId: 'TEAM_LEADERSHIP', score: 4, comments: 'Ayudó a mentorizar a Carlos en React.' }
    ],
    kpis: [
      { id: 'k4', kpi: 'Productivity', weight: 40, targetValue: 4, currentValue: 4.8 },
      { id: 'k5', kpi: 'Quality', weight: 30, targetValue: 4, currentValue: 4.7 },
      { id: 'k6', kpi: 'Innovation', weight: 30, targetValue: 4, currentValue: 5.0 }
    ]
  }
];

export const INITIAL_DEVELOPMENT_PLANS: DevelopmentPlan[] = [
  {
    id: 'DP001',
    employeeId: 'E001', // Alejandro
    year: 2026,
    status: 'Active',
    actions: [
      { id: 'DA001', type: 'Training', description: 'Realizar curso avanzado clean architecture', targetDate: '2026-09-01', status: 'InProgress', trainingId: 'TR1' },
      { id: 'DA002', type: 'Certification', description: 'Obtener certificación AWS Certified Solutions Architect Associate', targetDate: '2026-11-15', status: 'Pending' }
    ]
  },
  {
    id: 'DP002',
    employeeId: 'E003', // Carlos (Junior)
    year: 2026,
    status: 'Active',
    actions: [
      { id: 'DA003', type: 'Training', description: 'React 19, Next.js Masterclass & Tailwind Enterprise', targetDate: '2026-08-01', status: 'Pending', trainingId: 'TR2' },
      { id: 'DA004', type: 'Mentoring', description: 'Mentoría semanal con Alejandro Sanz sobre buenas prácticas Frontend', targetDate: '2026-12-01', status: 'InProgress' }
    ]
  }
];

export const INITIAL_ANNUAL_EVALUATIONS: AnnualEvaluation[] = [
  {
    evaluationId: 'EV001',
    employeeId: 'E001', // Alejandro Sanz
    year: 2025,
    currentLevelId: 'L3', // Senior Engineer
    targetLevelId: 'L4', // Manager / Lead Architect (Goal)
    status: 'Calibration', // In calibration phase! Perfect for manager/HR coordination
    finalScore: 4.4,
    evaluationResult: 'ExceedsExpectations',
    dimensions: [
      { id: 'd1', dimension: 'Competencies', weight: 40, score: 4.5 },
      { id: 'd2', dimension: 'ProjectPerformance', weight: 30, score: 4.6 },
      { id: 'd3', dimension: 'Training', weight: 15, score: 4.0 },
      { id: 'd4', dimension: 'Feedback360', weight: 10, score: 4.2 },
      { id: 'd5', dimension: 'CorporateContribution', weight: 5, score: 4.0 }
    ],
    competencies: [
      { id: 'c1', competencyId: 'CLIENT_ORIENTATION', expectedStage: 'C', actualStage: 'C', score: 4, gap: 0 },
      { id: 'c2', competencyId: 'INNOVATION', expectedStage: 'C', actualStage: 'D', score: 5, gap: 1 },
      { id: 'c3', competencyId: 'HUMAN_RELATIONS', expectedStage: 'C', actualStage: 'D', score: 4.5, gap: 1 },
      { id: 'c4', competencyId: 'TEAM_LEADERSHIP', expectedStage: 'B', actualStage: 'C', score: 4.5, gap: 1 },
      { id: 'c5', competencyId: 'ORGANIZATION_RESULTS', expectedStage: 'C', actualStage: 'C', score: 4.2, gap: 0 },
      { id: 'c6', competencyId: 'PROFESSIONAL_OPENNESS', expectedStage: 'C', actualStage: 'D', score: 5, gap: 1 }
    ],
    commentsManager: 'Alejandro ha tenido un año estelar. Lideró con éxito la entrega técnica de la plataforma IoT de Telefónica. Cumple holgadamente con todos los requisitos para ascender a Arquitecto / Manager L4.',
    commentsHR: 'Perfil sólido con feedback 360 excelente de peers y clientes. Se alinea con los criterios de calibración grupal de la línea de desarrollo.',
    promotionRecommendation: {
      ready: true,
      reason: 'Score global de 4.4/5. Todas las competencias mínimas requeridas para L4 (Manager / Lead Architect) están cumplidas con creces. Fuerte liderazgo técnico.'
    }
  },
  {
    evaluationId: 'EV002',
    employeeId: 'E005', // Eduardo García
    year: 2025,
    currentLevelId: 'L2', // Mid
    targetLevelId: 'L3', // Senior
    status: 'Draft',
    finalScore: 3.8,
    evaluationResult: 'MeetsExpectations',
    dimensions: [
      { id: 'd6', dimension: 'Competencies', weight: 40, score: 3.5 },
      { id: 'd7', dimension: 'ProjectPerformance', weight: 30, score: 4.0 },
      { id: 'd8', dimension: 'Training', weight: 15, score: 3.5 },
      { id: 'd9', dimension: 'Feedback360', weight: 10, score: 4.0 },
      { id: 'd10', dimension: 'CorporateContribution', weight: 5, score: 3.0 }
    ],
    competencies: [
      { id: 'c7', competencyId: 'CLIENT_ORIENTATION', expectedStage: 'B', actualStage: 'B', score: 4, gap: 0 },
      { id: 'c8', competencyId: 'INNOVATION', expectedStage: 'B', actualStage: 'B', score: 3.5, gap: 0 },
      { id: 'c9', competencyId: 'HUMAN_RELATIONS', expectedStage: 'B', actualStage: 'B', score: 4, gap: 0 },
      { id: 'c10', competencyId: 'TEAM_LEADERSHIP', expectedStage: 'A', actualStage: 'B', score: 4, gap: 1 },
      { id: 'c11', competencyId: 'ORGANIZATION_RESULTS', expectedStage: 'B', actualStage: 'B', score: 4.2, gap: 0 },
      { id: 'c12', competencyId: 'PROFESSIONAL_OPENNESS', expectedStage: 'B', actualStage: 'B', score: 3.5, gap: 0 }
    ],
    commentsManager: 'Eduardo cumple bien con las metas en su proyecto asignado (Mercadona). Sigue progresando adecuadamente hacia el nivel Senior, pero consideramos que requiere al menos 6 meses adicionales consolidándose en proyectos de alta complejidad técnica.',
    commentsHR: 'Mantener en el nivel actual para consolidar habilidades fullstack en el plan de desarrollo de 2026.',
    promotionRecommendation: {
      ready: false,
      reason: 'Aunque el rendimiento es bueno, aún tiene pequeños gaps técnicos y necesita liderar células de desarrollo autónomas para calificar como Senior L3.'
    }
  }
];

// Persistent state class in server
export class DatabaseStore {
  careerFamilies = [...INITIAL_CAREER_FAMILIES];
  careerPaths = [...INITIAL_CAREER_PATHS];
  careerLevels = [...INITIAL_CAREER_LEVELS];
  competencies = [...INITIAL_COMPETENCIES];
  trainings = [...INITIAL_TRAINING_CATALOG];
  employees = [...INITIAL_EMPLOYEES];
  projects = [...INITIAL_PROJECTS];
  roleRequests = [...INITIAL_ROLE_REQUESTS];
  assignments = [...INITIAL_ASSIGNMENTS];
  checkpoints = [...INITIAL_CHECKPOINTS];
  devPlans = [...INITIAL_DEVELOPMENT_PLANS];
  annualEvaluations = [...INITIAL_ANNUAL_EVALUATIONS];

  constructor() {}

  // Basic CRUD utilities
  getEmployee(id: string) {
    return this.employees.find(e => e.employeeId === id);
  }

  updateEmployee(id: string, updated: Partial<Employee>) {
    const idx = this.employees.findIndex(e => e.employeeId === id);
    if (idx !== -1) {
      this.employees[idx] = { ...this.employees[idx], ...updated };
      return this.employees[idx];
    }
    return null;
  }

  getProject(id: string) {
    return this.projects.find(p => p.projectId === id);
  }

  addProjectRoleRequest(req: ProjectRoleRequest) {
    this.roleRequests.push(req);
    return req;
  }

  addProjectAssignment(asg: ProjectAssignment) {
    this.assignments.push(asg);
    // reduce employee availability when assigned
    const emp = this.employees.find(e => e.employeeId === asg.employeeId);
    if (emp) {
      emp.availabilityPercent = Math.max(0, emp.availabilityPercent - asg.allocationPercent);
    }
    return asg;
  }

  addCheckpoint(chk: CheckpointReview) {
    this.checkpoints.push(chk);
    return chk;
  }

  updateAnnualEvaluation(id: string, updated: Partial<AnnualEvaluation>) {
    const idx = this.annualEvaluations.findIndex(e => e.evaluationId === id);
    if (idx !== -1) {
      this.annualEvaluations[idx] = { ...this.annualEvaluations[idx], ...updated } as AnnualEvaluation;
      return this.annualEvaluations[idx];
    }
    return null;
  }

  // Matching Engine calculation
  getMatchingResults(requestId: string) {
    const req = this.roleRequests.find(r => r.id === requestId);
    if (!req) return [];

    return this.employees.map(emp => {
      // 1. Skill Match Score: fraction of requiredSkills present in employee skills
      let skillScore = 0;
      if (req.requiredSkills.length > 0) {
        let matches = 0;
        req.requiredSkills.forEach(reqSkillName => {
          const hasSkill = emp.skills.find(s => s.name.toLowerCase() === reqSkillName.toLowerCase());
          if (hasSkill) {
            // factor in the skill level (1-5)
            matches += (hasSkill.level / 5);
          }
        });
        skillScore = Math.round((matches / req.requiredSkills.length) * 100);
      } else {
        skillScore = 100;
      }

      // 2. Level Score: matches target level L1-L6
      // Let's parse L1 -> 1, L2 -> 2, etc.
      const getNum = (lid: string) => parseInt(lid.replace('L', '')) || 1;
      const reqNum = getNum(req.requiredLevelId);
      const empNum = getNum(emp.currentLevelId);
      
      let levelScore = 100;
      if (empNum < reqNum) {
        // under-qualified
        levelScore = Math.max(0, 100 - (reqNum - empNum) * 30);
      } else if (empNum > reqNum) {
        // over-qualified
        levelScore = Math.max(50, 100 - (empNum - reqNum) * 15);
      }

      // 3. Availability Score: if emp has enough availability for the project allocation
      let availabilityScore = 0;
      if (emp.availabilityPercent >= req.allocation) {
        availabilityScore = 100;
      } else {
        // partial score proportional to available %
        availabilityScore = Math.round((emp.availabilityPercent / req.allocation) * 100);
      }

      // 4. Performance Score: based on history
      let performanceScore = 80; // default average
      if (emp.projectHistory.length > 0) {
        const sum = emp.projectHistory.reduce((acc, curr) => acc + curr.performance, 0);
        const avg = sum / emp.projectHistory.length; // 1-5
        performanceScore = Math.round((avg / 5) * 100);
      }

      const globalScore = Math.round((skillScore * 0.40) + (levelScore * 0.20) + (availabilityScore * 0.25) + (performanceScore * 0.15));

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
}

export const dbStoreInstance = new DatabaseStore();
