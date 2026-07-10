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
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, setDoc, updateDoc, query, limit } from 'firebase/firestore';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Firebase Firestore dynamic configuration
const configPath = join(process.cwd(), 'firebase-applet-config.json');
let db: any = null;

if (existsSync(configPath)) {
  try {
    const configContent = readFileSync(configPath, 'utf8');
    const config = JSON.parse(configContent);
    let app;
    if (getApps().length === 0) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    
    if (config.firestoreDatabaseId) {
      db = getFirestore(app, config.firestoreDatabaseId);
    } else {
      db = getFirestore(app);
    }
    console.log('[Firestore] Successfully initialized connection to database:', config.firestoreDatabaseId || '(default)');
  } catch (error) {
    console.error('[Firestore] Failed to initialize Firebase in dbStore:', error);
  }
}

export const INITIAL_CAREER_FAMILIES: CareerFamily[] = [
  { id: 'F_ARC', code: 'ARC', name: 'Architecture & Tech Leadership', description: 'Diseño técnico, gobernanza de sistemas y liderazgo tecnológico.', active: true },
  { id: 'F_SWE', code: 'SWE', name: 'Software Engineering', description: 'Construcción, testing y despliegue de soluciones de software.', active: true },
  { id: 'F_MGT', code: 'MGT', name: 'Project & Product Management', description: 'Gestión ágil de proyectos, presupuestos y coordinación de equipos.', active: true },
  { id: 'F_CON', code: 'CON', name: 'Consulting', description: 'Consultoría de negocio, análisis funcional e implantación.', active: true }
];

export const INITIAL_CAREER_PATHS: CareerPath[] = [
  {
    id: 'P_MGT',
    careerFamilyId: 'F_MGT',
    code: 'P_MGT',
    name: 'Project Management',
    description: 'Dirección integral de proyectos, programas, operaciones y preventas.',
    finality: 'Dirección integral de proyectos, programas, operaciones y preventas. Equilibrio entre objetivos financieros, comerciales, humanos y productivos. Optimización continua del delivery y de la dinámica de equipo.',
    toEvaluate: 'Delivery, rentabilidad, gestión de riesgos, liderazgo, satisfacción cliente.'
  },
  {
    id: 'P_CON',
    careerFamilyId: 'F_CON',
    code: 'P_CON',
    name: 'Business Analysis',
    description: 'Transformar necesidades de negocio en soluciones funcionales.',
    finality: 'Transformar necesidades de negocio en soluciones funcionales. Modelado de procesos, datos y experiencia de usuario. Facilitación de talleres y validaciones.',
    toEvaluate: 'Análisis funcional, gestión requisitos, diseño, facilitación, comunicación.'
  },
  {
    id: 'P_CON_PE',
    careerFamilyId: 'F_CON',
    code: 'P_CON_PE',
    name: 'Product Expertise',
    description: 'Implantación y parametrización de productos.',
    finality: 'Implantación y parametrización de productos. Maximizar el valor funcional para el cliente. Formación y acompañamiento.',
    toEvaluate: 'Expertise funcional, parametrización, adopción cliente, formación.'
  },
  {
    id: 'P_CON_CA',
    careerFamilyId: 'F_CON',
    code: 'P_CON_CA',
    name: 'Ciberanálisis',
    description: 'Prevención, protección, detección y respuesta ante incidentes.',
    finality: 'Prevención, protección, detección y respuesta. Gestión de riesgos y resiliencia. Gestión de crisis y cultura de ciberseguridad.',
    toEvaluate: 'Gestión de riesgos, cumplimiento, protección, respuesta a incidentes.'
  },
  {
    id: 'P_ARC',
    careerFamilyId: 'F_ARC',
    code: 'P_ARC',
    name: 'Arquitectura',
    description: 'Diseñar arquitecturas sostenibles y seguras.',
    finality: 'Diseñar arquitecturas sostenibles y seguras. Garantizar viabilidad técnica y económica. Liderar decisiones tecnológicas.',
    toEvaluate: 'Diseño, visión global, gobierno tecnológico, innovación.'
  },
  {
    id: 'P_SWE',
    careerFamilyId: 'F_SWE',
    code: 'P_SWE',
    name: 'Solution Building',
    description: 'Construcción técnica de soluciones.',
    finality: 'Construcción técnica de soluciones. Desarrollo, integración, industrialización y calidad.',
    toEvaluate: 'Calidad de código, diseño técnico, automatización, productividad.'
  },
  {
    id: 'P_SWE_TS',
    careerFamilyId: 'F_SWE',
    code: 'P_SWE_TS',
    name: 'Testing',
    description: 'Definir estrategia y política de pruebas.',
    finality: 'Definir estrategia y política de pruebas. Garantizar calidad y cobertura.',
    toEvaluate: 'Cobertura, automatización, defectos detectados, calidad.'
  },
  {
    id: 'P_CON_PR',
    careerFamilyId: 'F_CON',
    code: 'P_CON_PR',
    name: 'Producción',
    description: 'Operación y optimización de infraestructuras y plataformas.',
    finality: 'Operación y optimización de infraestructuras y plataformas. Garantizar disponibilidad y continuidad.',
    toEvaluate: 'SLA, operación, monitorización, estabilidad.'
  },
  {
    id: 'P_CON_SP',
    careerFamilyId: 'F_CON',
    code: 'P_CON_SP',
    name: 'Soporte',
    description: 'Garantizar soporte y calidad de servicio.',
    finality: 'Garantizar soporte y calidad de servicio. Optimizar procesos y experiencia del usuario.',
    toEvaluate: 'Incidencias, satisfacción cliente, tiempos de resolución.'
  },
  {
    id: 'P_MGT_RD',
    careerFamilyId: 'F_MGT',
    code: 'P_MGT_RD',
    name: 'I+D Project Management',
    description: 'Gestión de proyectos de I+D.',
    finality: 'Gestión de proyectos de I+D. Roadmap, industrialización y evolución de producto.',
    toEvaluate: 'Cumplimiento roadmap, productividad, liderazgo técnico.'
  },
  {
    id: 'P_MGT_PD',
    careerFamilyId: 'F_MGT',
    code: 'P_MGT_PD',
    name: 'Product Management',
    description: 'Gestión integral de oferta y producto.',
    finality: 'Gestión integral de oferta y producto. Roadmap, rentabilidad y ciclo de vida.',
    toEvaluate: 'Estrategia, negocio, rentabilidad, adopción.'
  },
  {
    id: 'P_CON_MK',
    careerFamilyId: 'F_CON',
    code: 'P_CON_MK',
    name: 'Marketing',
    description: 'Impulsar crecimiento y posicionamiento.',
    finality: 'Impulsar crecimiento y posicionamiento. Marketing de producto, demanda e inteligencia de mercado.',
    toEvaluate: 'Generación demanda, posicionamiento, impacto comercial.'
  }
];

export const INITIAL_CAREER_LEVELS: CareerLevel[] = [
  {
    id: 'L1',
    levelCode: "Nivel 1'",
    levelNumber: 1,
    name: "Technician (Nivel 1')",
    experienceFrom: 0,
    experienceTo: 2,
    mission: 'Aprendizaje supervisado. Ejecución siguiendo procesos definidos.',
    evaluationIndicators: 'Aprendizaje, Calidad básica, Trabajo en equipo, Autonomía inicial.'
  },
  {
    id: 'L2',
    levelCode: "Nivel 1",
    levelNumber: 2,
    name: "Engineer (Nivel 1)",
    experienceFrom: 2,
    experienceTo: 4,
    mission: 'Ejecución autónoma inicial. Participación activa en proyectos.',
    evaluationIndicators: 'Productividad, Calidad, Capacidad de entrega, Comunicación.'
  },
  {
    id: 'L3',
    levelCode: "Nivel 2",
    levelNumber: 3,
    name: "Senior Engineer (Nivel 2)",
    experienceFrom: 4,
    experienceTo: 7,
    mission: 'Especialización y autonomía. Referente técnico o funcional.',
    evaluationIndicators: 'Expertise, Resolución compleja, Mentoring, Valor añadido, Relación cliente.'
  },
  {
    id: 'L4',
    levelCode: "Nivel 3",
    levelNumber: 4,
    name: "Manager (Nivel 3)",
    experienceFrom: 7,
    experienceTo: 10,
    mission: 'Responsabilidad de proyectos, operaciones o equipos. Desarrollo de personas.',
    evaluationIndicators: 'Liderazgo, Gestión económica, Gestión riesgos, Satisfacción cliente, Desarrollo de colaboradores.'
  },
  {
    id: 'L5',
    levelCode: "Nivel 4",
    levelNumber: 5,
    name: "Senior Manager (Nivel 4)",
    experienceFrom: 10,
    experienceTo: 15,
    mission: 'Dirección de actividades complejas multiárea. Desarrollo de negocio.',
    evaluationIndicators: 'Estrategia, Gestión de cartera, Rentabilidad, Influencia, Desarrollo organizativo.'
  },
  {
    id: 'L6',
    levelCode: "Nivel 5",
    levelNumber: 6,
    name: "Director (Nivel 5)",
    experienceFrom: 15,
    experienceTo: 20,
    mission: 'Dirección de proyectos, programas o áreas críticas. Liderazgo organizativo.',
    evaluationIndicators: 'Crecimiento negocio, Transformación, Gestión financiera, Desarrollo talento, Relación cliente alto nivel.'
  },
  {
    id: 'L7',
    levelCode: "Nivel 6",
    levelNumber: 7,
    name: "Senior Director (Nivel 6)",
    experienceFrom: 20,
    experienceTo: 99,
    mission: 'Dirección estratégica y representación corporativa corporativa.',
    evaluationIndicators: 'Impacto estratégico, Desarrollo corporativo, Influencia de mercado, Gestión del capital humano.'
  }
];

export const INITIAL_COMPETENCIES: Competency[] = [
  {
    id: 'CLIENT_ORIENTATION',
    code: 'CLIENT_ORIENTATION',
    name: 'Orientación al Cliente',
    type: 'Business',
    description: 'Capacidad para desarrollar relaciones y servicios con el cliente, acompañándolo en su actividad y transformación.',
    stages: {
      A: [
        'Establece relaciones con clientes internos y externos.',
        'Recopila información necesaria para desempeñar su trabajo.',
        'Representa a la empresa con profesionalidad.',
        'Escucha y transmite necesidades detectadas.'
      ],
      B: [
        'Mantiene relaciones de proximidad.',
        'Comprende expectativas del cliente.',
        'Integra dichas expectativas en sus decisiones.',
        'Contribuye a la mejora continua del servicio.'
      ],
      C: [
        'Garantiza que las necesidades reales y percibidas sean consideradas.',
        'Genera valor añadido.',
        'Anticipa necesidades.',
        'Propone soluciones.',
        'Promueve cultura de servicio.'
      ],
      D: [
        'Negocia y presenta soluciones a alto nivel.',
        'Influye en ecosistemas complejos.',
        'Gestiona relaciones duraderas.'
      ],
      E: [
        'Desarrolla visión estratégica con clientes.',
        'Construye relaciones de confianza de largo plazo.',
        'Representa al Grupo.'
      ]
    }
  },
  {
    id: 'INNOVATION',
    code: 'INNOVATION',
    name: 'Búsqueda de Soluciones e Innovación',
    type: 'Technical',
    description: 'Capacidad para analizar situaciones y desarrollar soluciones adecuadas e innovadoras.',
    stages: {
      A: [
        'Trabaja con rigor y método.',
        'Aplica calidad.',
        'Identifica carencias de información.',
        'Busca soluciones.'
      ],
      B: [
        'Integra nueva información.',
        'Analiza desde distintas perspectivas.',
        'Detecta oportunidades.',
        'Capitaliza experiencias.'
      ],
      C: [
        'Gestiona situaciones complejas.',
        'Relaciona experiencias previas.',
        'Aplica creatividad.',
        'Desarrolla soluciones innovadoras.'
      ],
      D: [
        'Evalúa problemas complejos con objetividad.',
        'Analiza impacto de innovaciones.',
        'Impulsa reutilización y capitalización.'
      ],
      E: [
        'Diseña estrategias y organizaciones complejas.',
        'Aprovecha tendencias y ecosistemas innovadores.',
        'Genera nuevas ofertas y soluciones.'
      ]
    }
  },
  {
    id: 'HUMAN_RELATIONS',
    code: 'HUMAN_RELATIONS',
    name: 'Sentido de las Relaciones Humanas',
    type: 'Behavioral',
    description: 'Capacidad para desarrollar relaciones y comunicarse eficazmente.',
    stages: {
      A: [
        'Comunicación eficaz.',
        'Escucha activa.',
        'Relaciones con perfiles diversos.'
      ],
      B: [
        'Comprende distintos puntos de vista.',
        'Gestiona estrés.',
        'Anticipa conflictos.'
      ],
      C: [
        'Influye en otros.',
        'Trabaja en entornos multiculturales.',
        'Comprende motivaciones.'
      ],
      D: [
        'Gestiona relaciones complejas.',
        'Convence y moviliza.',
        'Genera consensos.',
        'Construye confianza.'
      ],
      E: [
        'Desarrolla autonomía.',
        'Facilita iniciativas.',
        'Acompaña transformaciones.'
      ]
    }
  },
  {
    id: 'ORGANIZATION_RESULTS',
    code: 'ORGANIZATION_RESULTS',
    name: 'Organización y Sentido del Resultado',
    type: 'Business',
    description: 'Capacidad para organizarse y alcanzar objetivos.',
    stages: {
      A: [
        'Planifica tareas.',
        'Gestiona prioridades.',
        'Cumple plazos.',
        'Finaliza actividades correctamente.'
      ],
      B: [
        'Planifica acciones complejas.',
        'Asigna recursos.',
        'Prioriza correctamente.',
        'Optimiza resultados.'
      ],
      C: [
        'Coordina múltiples dependencias.',
        'Toma decisiones oportunas.',
        'Delega y supervisa.'
      ],
      D: [
        'Anticipa riesgos.',
        'Facilita autonomía.',
        'Mantiene objetivos en entornos complejos.'
      ],
      E: [
        'Asume arbitrajes complejos.',
        'Gestiona incertidumbre.',
        'Lidera transformaciones.'
      ]
    }
  },
  {
    id: 'TEAM_LEADERSHIP',
    code: 'TEAM_LEADERSHIP',
    name: 'Dinámica de Equipo y Liderazgo',
    type: 'Leadership',
    description: 'Capacidad para colaborar, motivar y desarrollar personas.',
    stages: {
      A: [
        'Coopera con el equipo.',
        'Comparte conocimientos.',
        'Entiende la cadena de valor.'
      ],
      B: [
        'Contribuye activamente a la dinámica del equipo.',
        'Integra diversidad.',
        'Ayuda a nuevos compañeros.'
      ],
      C: [
        'Motiva equipos.',
        'Gestiona conflictos.',
        'Da feedback constructivo.',
        'Desarrolla competencias.',
        'Impulsa iniciativas.'
      ],
      D: [
        'Define dirección clara.',
        'Desarrolla líderes.',
        'Fomenta colaboración y confianza.',
        'Optimiza transmisión de conocimiento.'
      ],
      E: [
        'Comunica visión estratégica.',
        'Moviliza grandes organizaciones.',
        'Identifica y desarrolla futuros líderes.'
      ]
    }
  },
  {
    id: 'PROFESSIONAL_OPENNESS',
    code: 'PROFESSIONAL_OPENNESS',
    name: 'Apertura Profesional',
    type: 'Behavioral',
    description: 'Capacidad para adaptarse, aprender y compartir conocimiento.',
    stages: {
      A: [
        'Adapta comportamientos a contextos.',
        'Integra cambios.',
        'Actualiza conocimientos.'
      ],
      B: [
        'Toma iniciativas.',
        'Explora nuevos temas.',
        'Desarrolla aprendizaje continuo.'
      ],
      C: [
        'Explora nuevos contextos.',
        'Desarrolla sinergias.',
        'Comparte experiencias.'
      ],
      D: [
        'Mantiene vigilancia tecnológica.',
        'Desarrolla redes profesionales.',
        'Capitaliza experiencias.'
      ],
      E: [
        'Difunde innovación.',
        'Contribuye a la notoriedad del Grupo.',
        'Facilita transmisión global del conocimiento.'
      ]
    }
  }
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

// Persistent state class in server using Firestore and memory fallbacks
export class DatabaseStore {
  // Fallbacks in-memory (just in case)
  private memCareerFamilies = [...INITIAL_CAREER_FAMILIES];
  private memCareerPaths = [...INITIAL_CAREER_PATHS];
  private memCareerLevels = [...INITIAL_CAREER_LEVELS];
  private memCompetencies = [...INITIAL_COMPETENCIES];
  private memTrainings = [...INITIAL_TRAINING_CATALOG];
  private memEmployees = [...INITIAL_EMPLOYEES];
  private memProjects = [...INITIAL_PROJECTS];
  private memRoleRequests = [...INITIAL_ROLE_REQUESTS];
  private memAssignments = [...INITIAL_ASSIGNMENTS];
  private memCheckpoints = [...INITIAL_CHECKPOINTS];
  private memDevPlans = [...INITIAL_DEVELOPMENT_PLANS];
  private memAnnualEvaluations = [...INITIAL_ANNUAL_EVALUATIONS];

  constructor() {}

  async initialize() {
    if (!db) {
      console.log('[Firestore] No active database connection. Operating in memory-only mode.');
      return;
    }
    try {
      // Always update static reference specifications to match latest Guia de Carreras in DB
      console.log('[Firestore] Synchronizing static career specs...');
      for (const item of INITIAL_CAREER_PATHS) {
        await setDoc(doc(db, 'careerPaths', item.id), item);
      }
      for (const item of INITIAL_CAREER_LEVELS) {
        await setDoc(doc(db, 'careerLevels', item.id), item);
      }
      for (const item of INITIAL_COMPETENCIES) {
        await setDoc(doc(db, 'competencies', item.id), item);
      }
      
      const snapshot = await getDocs(query(collection(db, 'employees'), limit(1)));
      if (snapshot.empty) {
        console.log('[Firestore] Seeding initial data...');
        // Seed career families
        for (const item of INITIAL_CAREER_FAMILIES) {
          await setDoc(doc(db, 'careerFamilies', item.id), item);
        }
        // Seed trainings
        for (const item of INITIAL_TRAINING_CATALOG) {
          await setDoc(doc(db, 'trainings', item.trainingId), item);
        }
        // Seed employees
        for (const item of INITIAL_EMPLOYEES) {
          await setDoc(doc(db, 'employees', item.employeeId), item);
        }
        // Seed projects
        for (const item of INITIAL_PROJECTS) {
          await setDoc(doc(db, 'projects', item.projectId), item);
        }
        // Seed role requests
        for (const item of INITIAL_ROLE_REQUESTS) {
          await setDoc(doc(db, 'roleRequests', item.id), item);
        }
        // Seed assignments
        for (const item of INITIAL_ASSIGNMENTS) {
          await setDoc(doc(db, 'assignments', item.assignmentId), item);
        }
        // Seed checkpoints
        for (const item of INITIAL_CHECKPOINTS) {
          await setDoc(doc(db, 'checkpoints', item.id), item);
        }
        // Seed dev plans
        for (const item of INITIAL_DEVELOPMENT_PLANS) {
          await setDoc(doc(db, 'devPlans', item.id), item);
        }
        // Seed annual evaluations
        for (const item of INITIAL_ANNUAL_EVALUATIONS) {
          await setDoc(doc(db, 'annualEvaluations', item.evaluationId), item);
        }
        console.log('[Firestore] Data seeding completed.');
      } else {
        console.log('[Firestore] Database is already seeded.');
      }
    } catch (err) {
      console.error('[Firestore] Failed to seed database:', err);
    }
  }

  // Helper to fetch all docs in a collection
  private async getAllDocs<T>(collectionName: string, fallback: T[]): Promise<T[]> {
    if (!db) return fallback;
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      const list: T[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as T);
      });
      return list;
    } catch (err) {
      console.error(`[Firestore] Error fetching collection ${collectionName}:`, err);
      return fallback;
    }
  }

  // Getters for individual components
  async getCareerFamilies() {
    return this.getAllDocs<CareerFamily>('careerFamilies', this.memCareerFamilies);
  }

  async getCareerPaths() {
    return this.getAllDocs<CareerPath>('careerPaths', this.memCareerPaths);
  }

  async getCareerLevels() {
    return this.getAllDocs<CareerLevel>('careerLevels', this.memCareerLevels);
  }

  async getCompetencies() {
    return this.getAllDocs<Competency>('competencies', this.memCompetencies);
  }

  async getTrainings() {
    return this.getAllDocs<TrainingCatalog>('trainings', this.memTrainings);
  }

  async getEmployees() {
    return this.getAllDocs<Employee>('employees', this.memEmployees);
  }

  async getProjects() {
    return this.getAllDocs<Project>('projects', this.memProjects);
  }

  async getRoleRequests() {
    return this.getAllDocs<ProjectRoleRequest>('roleRequests', this.memRoleRequests);
  }

  async getAssignments() {
    return this.getAllDocs<ProjectAssignment>('assignments', this.memAssignments);
  }

  async getCheckpoints() {
    return this.getAllDocs<CheckpointReview>('checkpoints', this.memCheckpoints);
  }

  async getDevPlans() {
    return this.getAllDocs<DevelopmentPlan>('devPlans', this.memDevPlans);
  }

  async getAnnualEvaluations() {
    return this.getAllDocs<AnnualEvaluation>('annualEvaluations', this.memAnnualEvaluations);
  }

  // CRUD utilities
  async getEmployee(id: string): Promise<Employee | null> {
    if (!db) {
      return this.memEmployees.find(e => e.employeeId === id) || null;
    }
    try {
      const docSnap = await getDoc(doc(db, 'employees', id));
      if (docSnap.exists()) {
        return docSnap.data() as Employee;
      }
      return null;
    } catch (err) {
      console.error(`[Firestore] Error getting employee ${id}:`, err);
      return this.memEmployees.find(e => e.employeeId === id) || null;
    }
  }

  async updateEmployee(id: string, updated: Partial<Employee>): Promise<Employee | null> {
    if (!db) {
      const idx = this.memEmployees.findIndex(e => e.employeeId === id);
      if (idx !== -1) {
        this.memEmployees[idx] = { ...this.memEmployees[idx], ...updated };
        return this.memEmployees[idx];
      }
      return null;
    }
    try {
      await updateDoc(doc(db, 'employees', id), updated);
      return this.getEmployee(id);
    } catch (err) {
      console.error(`[Firestore] Error updating employee ${id}:`, err);
      return null;
    }
  }

  async addEmployee(emp: Employee): Promise<Employee> {
    if (!db) {
      this.memEmployees.push(emp);
      return emp;
    }
    try {
      await setDoc(doc(db, 'employees', emp.employeeId), emp);
      return emp;
    } catch (err) {
      console.error('[Firestore] Error adding employee:', err);
      this.memEmployees.push(emp);
      return emp;
    }
  }

  async addEmployeeSkill(id: string, skill: any): Promise<Employee | null> {
    const emp = await this.getEmployee(id);
    if (!emp) return null;
    
    const newSkill = {
      skillId: `s_${Date.now()}`,
      name: skill.name,
      category: skill.category || 'General',
      level: Number(skill.level) || 3,
      validatedDate: new Date().toISOString().split('T')[0],
      source: skill.source || 'Self'
    };
    
    const updatedSkills = [...(emp.skills || []), newSkill];
    return this.updateEmployee(id, { skills: updatedSkills });
  }

  async getProject(id: string): Promise<Project | null> {
    if (!db) {
      return this.memProjects.find(p => p.projectId === id) || null;
    }
    try {
      const docSnap = await getDoc(doc(db, 'projects', id));
      if (docSnap.exists()) {
        return docSnap.data() as Project;
      }
      return null;
    } catch (err) {
      console.error(`[Firestore] Error getting project ${id}:`, err);
      return this.memProjects.find(p => p.projectId === id) || null;
    }
  }

  async addProject(prj: Project): Promise<Project> {
    if (!db) {
      this.memProjects.push(prj);
      return prj;
    }
    try {
      await setDoc(doc(db, 'projects', prj.projectId), prj);
      return prj;
    } catch (err) {
      console.error('[Firestore] Error adding project:', err);
      this.memProjects.push(prj);
      return prj;
    }
  }

  async addProjectRoleRequest(req: ProjectRoleRequest): Promise<ProjectRoleRequest> {
    if (!db) {
      this.memRoleRequests.push(req);
      return req;
    }
    try {
      await setDoc(doc(db, 'roleRequests', req.id), req);
      return req;
    } catch (err) {
      console.error('[Firestore] Error adding role request:', err);
      this.memRoleRequests.push(req);
      return req;
    }
  }

  async addProjectAssignment(asg: ProjectAssignment): Promise<ProjectAssignment> {
    if (!db) {
      this.memAssignments.push(asg);
      const emp = this.memEmployees.find(e => e.employeeId === asg.employeeId);
      if (emp) {
        emp.availabilityPercent = Math.max(0, emp.availabilityPercent - asg.allocationPercent);
      }
      return asg;
    }
    try {
      await setDoc(doc(db, 'assignments', asg.assignmentId), asg);
      const emp = await this.getEmployee(asg.employeeId);
      if (emp) {
        const newAvailability = Math.max(0, emp.availabilityPercent - asg.allocationPercent);
        await this.updateEmployee(asg.employeeId, { availabilityPercent: newAvailability });
      }
      return asg;
    } catch (err) {
      console.error('[Firestore] Error adding project assignment:', err);
      this.memAssignments.push(asg);
      return asg;
    }
  }

  async addCheckpoint(chk: CheckpointReview): Promise<CheckpointReview> {
    if (!db) {
      this.memCheckpoints.push(chk);
      return chk;
    }
    try {
      await setDoc(doc(db, 'checkpoints', chk.id), chk);
      return chk;
    } catch (err) {
      console.error('[Firestore] Error adding checkpoint:', err);
      this.memCheckpoints.push(chk);
      return chk;
    }
  }

  async updateCheckpoint(id: string, updated: Partial<CheckpointReview>): Promise<CheckpointReview | null> {
    if (!db) {
      const idx = this.memCheckpoints.findIndex(e => e.id === id);
      if (idx !== -1) {
        this.memCheckpoints[idx] = { ...this.memCheckpoints[idx], ...updated } as CheckpointReview;
        return this.memCheckpoints[idx];
      }
      return null;
    }
    try {
      await updateDoc(doc(db, 'checkpoints', id), updated);
      const docSnap = await getDoc(doc(db, 'checkpoints', id));
      return docSnap.exists() ? (docSnap.data() as CheckpointReview) : null;
    } catch (err) {
      console.error(`[Firestore] Error updating checkpoint ${id}:`, err);
      return null;
    }
  }

  async updateAnnualEvaluation(id: string, updated: Partial<AnnualEvaluation>): Promise<AnnualEvaluation | null> {
    if (!db) {
      const idx = this.memAnnualEvaluations.findIndex(e => e.evaluationId === id);
      if (idx !== -1) {
        this.memAnnualEvaluations[idx] = { ...this.memAnnualEvaluations[idx], ...updated } as AnnualEvaluation;
        return this.memAnnualEvaluations[idx];
      }
      return null;
    }
    try {
      await updateDoc(doc(db, 'annualEvaluations', id), updated);
      const docSnap = await getDoc(doc(db, 'annualEvaluations', id));
      return docSnap.exists() ? (docSnap.data() as AnnualEvaluation) : null;
    } catch (err) {
      console.error(`[Firestore] Error updating evaluation ${id}:`, err);
      return null;
    }
  }

  async addAnnualEvaluation(val: AnnualEvaluation): Promise<AnnualEvaluation> {
    if (!db) {
      this.memAnnualEvaluations.push(val);
      return val;
    }
    try {
      await setDoc(doc(db, 'annualEvaluations', val.evaluationId), val);
      return val;
    } catch (err) {
      console.error('[Firestore] Error adding evaluation:', err);
      this.memAnnualEvaluations.push(val);
      return val;
    }
  }

  async addDevPlanAction(employeeId: string, action: any): Promise<DevelopmentPlan | null> {
    const plans = await this.getDevPlans();
    let plan = plans.find(d => d.employeeId === employeeId);
    const newAction = {
      id: `DA_${Date.now()}`,
      type: action.type || 'Training',
      description: action.description,
      targetDate: action.targetDate || new Date().toISOString().split('T')[0],
      status: action.status || 'Pending',
      trainingId: action.trainingId
    };

    if (!plan) {
      const newPlan: DevelopmentPlan = {
        id: `DP_${Date.now()}`,
        employeeId: employeeId,
        year: 2026,
        status: 'Active',
        actions: [newAction]
      };
      if (!db) {
        this.memDevPlans.push(newPlan);
      } else {
        await setDoc(doc(db, 'devPlans', newPlan.id), newPlan);
      }
      return newPlan;
    } else {
      const updatedActions = [...(plan.actions || []), newAction];
      if (!db) {
        plan.actions = updatedActions;
      } else {
        await updateDoc(doc(db, 'devPlans', plan.id), { actions: updatedActions });
        const docSnap = await getDoc(doc(db, 'devPlans', plan.id));
        plan = docSnap.data() as DevelopmentPlan;
      }
      return plan;
    }
  }

  // Matching Engine calculation
  async getMatchingResults(requestId: string) {
    const roleReqs = await this.getRoleRequests();
    const req = roleReqs.find(r => r.id === requestId);
    if (!req) return [];

    const emps = await this.getEmployees();

    return emps.map(emp => {
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

