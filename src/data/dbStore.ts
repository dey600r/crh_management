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
  DevelopmentPlan,
  DivisionBudget
} from '../types';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, getDoc, getDocFromServer, setDoc, updateDoc, deleteDoc, query, limit } from 'firebase/firestore';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

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

async function testConnection() {
  if (!db) return;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
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
    division: 'Software Engineering',
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
    division: 'Architecture & Tech Leadership',
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
    division: 'Consulting',
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
    division: 'Project & Product Management',
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
    division: 'Consulting',
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
    division: 'Architecture & Tech Leadership',
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
  },
  {
    employeeId: 'E007',
    name: 'Samsagaz',
    surname: 'Gamyi',
    email: 'samsagaz.gamyi@itconsulting.com',
    country: 'España',
    office: 'Madrid',
    department: 'Software Engineering',
    division: 'Software Engineering',
    managerId: 'E004',
    careerManagerId: 'E004',
    currentCareerPathId: 'P_SWE',
    currentLevelId: 'L3', // Senior Engineer (Nivel 2), iniciando año en Etapa A
    hireDate: '2023-02-01',
    status: 'Active',
    availabilityPercent: 50,
    bio: 'Ingeniero Full-Stack con más de 5 años de experiencia en diseño y desarrollo de aplicaciones web escalables con React, TypeScript, Node.js y arquitectura cloud en AWS. Especializado en modernización de plataformas e-commerce, diseño modular e integración continua. Durante 2026 ha evolucionado de Etapa A hacia la consolidación plena de Nivel 2 (Etapa B/C).',
    education: [
      'Grado en Ingeniería Informática — Universidad Politécnica de Madrid (2017–2021)',
      'Máster en Cloud Computing & Arquitectura Software — UPM (2022)'
    ],
    languages: [
      'Español (Nativo)',
      'Inglés (C1 Advanced)'
    ],
    skills: [
      { skillId: 's19', name: 'React', category: 'Frontend', level: 5, validatedDate: '2026-10-15', source: 'Project' },
      { skillId: 's20', name: 'TypeScript', category: 'Languages', level: 5, validatedDate: '2026-10-15', source: 'Project' },
      { skillId: 's21', name: 'Node.js', category: 'Backend', level: 4, validatedDate: '2026-09-20', source: 'Project' },
      { skillId: 's22', name: 'AWS', category: 'Cloud', level: 4, validatedDate: '2026-08-12', source: 'Training' },
      { skillId: 's23', name: 'PostgreSQL', category: 'Databases', level: 4, validatedDate: '2026-06-30', source: 'Project' },
      { skillId: 's24', name: 'Docker', category: 'DevOps', level: 3, validatedDate: '2026-05-15', source: 'Project' }
    ],
    certifications: [
      { id: 'c7', certificationName: 'AWS Certified Developer - Associate', provider: 'AWS', issueDate: '2025-04-10', expiryDate: '2028-04-10' },
      { id: 'c8', certificationName: 'Professional Scrum Developer I (PSD I)', provider: 'Scrum.org', issueDate: '2024-09-20', expiryDate: '2030-01-01' }
    ],
    projectHistory: [
      { projectId: 'PRJ003', role: 'Full-Stack React/Node Engineer', performance: 4.1 },
      { projectId: 'PRJ002', role: 'Senior Full-Stack Engineer', performance: 4.5 }
    ]
  },
  {
    employeeId: 'E008',
    name: 'Elena',
    surname: 'Navarro Prado',
    email: 'elena.navarro@itconsulting.com',
    country: 'España',
    office: 'Madrid',
    department: 'Data & AI',
    division: 'Data & AI',
    managerId: 'E006',
    careerManagerId: 'E006',
    currentCareerPathId: 'P_ARC',
    currentLevelId: 'L4',
    hireDate: '2020-04-10',
    status: 'Active',
    availabilityPercent: 25,
    bio: 'Arquitecta de Plataformas de Datos e IA Generativa con experiencia liderando equipos multi-squad en banca y telecomunicaciones.',
    education: [
      'Máster en Ciencia de Datos e Inteligencia Artificial — Universidad Carlos III (2018)'
    ],
    languages: ['Español (Nativo)', 'Inglés (C1)'],
    skills: [
      { skillId: 's25', name: 'Python', category: 'Data & AI', level: 5, validatedDate: '2026-09-10', source: 'Project' },
      { skillId: 's26', name: 'Data Architecture', category: 'Architecture', level: 5, validatedDate: '2026-10-01', source: 'Project' },
      { skillId: 's27', name: 'AWS', category: 'Cloud', level: 4, validatedDate: '2026-08-20', source: 'Project' }
    ],
    certifications: [
      { id: 'c9', certificationName: 'AWS Certified Machine Learning - Specialty', provider: 'AWS', issueDate: '2025-06-15', expiryDate: '2028-06-15' }
    ],
    projectHistory: [
      { projectId: 'PRJ001', role: 'AI Platform Architect', performance: 4.8 }
    ]
  },
  {
    employeeId: 'E009',
    name: 'Hugo',
    surname: 'Serrano Blanco',
    email: 'hugo.serrano@itconsulting.com',
    country: 'España',
    office: 'Barcelona',
    department: 'Data & AI',
    division: 'Data & AI',
    managerId: 'E008',
    careerManagerId: 'E008',
    currentCareerPathId: 'P_SWE',
    currentLevelId: 'L3',
    hireDate: '2022-09-01',
    status: 'Active',
    availabilityPercent: 40,
    bio: 'Ingeniero Senior de MLOps y pipelines de datos en tiempo real especializado en Spark, Kubernetes y observabilidad de modelos.',
    skills: [
      { skillId: 's28', name: 'Python', category: 'Data & AI', level: 5, validatedDate: '2026-09-12', source: 'Project' },
      { skillId: 's29', name: 'Kubernetes', category: 'DevOps', level: 4, validatedDate: '2026-09-30', source: 'Project' },
      { skillId: 's30', name: 'Apache Spark', category: 'Data & AI', level: 4, validatedDate: '2026-07-15', source: 'Project' }
    ],
    certifications: [
      { id: 'c10', certificationName: 'Databricks Certified Data Engineer Professional', provider: 'Databricks', issueDate: '2025-03-10', expiryDate: '2027-03-10' }
    ],
    projectHistory: [
      { projectId: 'PRJ003', role: 'Senior MLOps Engineer', performance: 4.4 }
    ]
  },
  {
    employeeId: 'E010',
    name: 'Lucía',
    surname: 'Campos Herrera',
    email: 'lucia.campos@itconsulting.com',
    country: 'España',
    office: 'Madrid',
    department: 'Data & AI',
    division: 'Data & AI',
    managerId: 'E008',
    careerManagerId: 'E008',
    currentCareerPathId: 'P_SWE',
    currentLevelId: 'L2',
    hireDate: '2024-02-15',
    status: 'Active',
    availabilityPercent: 50,
    bio: 'Data Engineer enfocada en ETL cloud, calidad del dato y APIs analíticas con Python y PostgreSQL.',
    skills: [
      { skillId: 's31', name: 'Python', category: 'Data & AI', level: 4, validatedDate: '2026-08-10', source: 'Project' },
      { skillId: 's32', name: 'PostgreSQL', category: 'Databases', level: 4, validatedDate: '2026-09-01', source: 'Project' },
      { skillId: 's33', name: 'TypeScript', category: 'Languages', level: 3, validatedDate: '2026-06-15', source: 'Self' }
    ],
    certifications: [],
    projectHistory: [
      { projectId: 'PRJ003', role: 'Data Engineer', performance: 3.9 }
    ]
  },
  {
    employeeId: 'E011',
    name: 'Marcos',
    surname: 'Ibáñez León',
    email: 'marcos.ibanez@itconsulting.com',
    country: 'España',
    office: 'Valencia',
    department: 'Data & AI',
    division: 'Data & AI',
    managerId: 'E008',
    careerManagerId: 'E008',
    currentCareerPathId: 'P_CON',
    currentLevelId: 'L1',
    hireDate: '2025-05-01',
    status: 'Active',
    availabilityPercent: 100,
    bio: 'Analista funcional junior de BI y visualización orientado a definición de KPIs de negocio y gobierno del dato.',
    skills: [
      { skillId: 's34', name: 'Power BI', category: 'Data & AI', level: 4, validatedDate: '2026-07-20', source: 'Project' },
      { skillId: 's35', name: 'SQL', category: 'Databases', level: 3, validatedDate: '2026-08-05', source: 'Self' }
    ],
    certifications: [],
    projectHistory: [
      { projectId: 'PRJ002', role: 'Junior BI Analyst', performance: 3.3 }
    ]
  },
  {
    employeeId: 'E012',
    name: 'Patricia',
    surname: 'Morales Díez',
    email: 'patricia.morales@itconsulting.com',
    country: 'España',
    office: 'Madrid',
    department: 'Data & AI',
    division: 'Data & AI',
    managerId: 'E006',
    careerManagerId: 'E006',
    currentCareerPathId: 'P_MGT',
    currentLevelId: 'L5',
    hireDate: '2017-10-01',
    status: 'Active',
    availabilityPercent: 20,
    bio: 'Senior Manager de programas de Analítica Avanzada encargada de coordinación de cuentas y seguimiento de entregas multi-país.',
    skills: [
      { skillId: 's36', name: 'Program Management', category: 'Management', level: 4, validatedDate: '2026-05-20', source: 'Project' },
      { skillId: 's37', name: 'Risk Management', category: 'Management', level: 3, validatedDate: '2026-06-01', source: 'Project' }
    ],
    certifications: [
      { id: 'c11', certificationName: 'Project Management Professional (PMP)', provider: 'PMI', issueDate: '2020-11-10', expiryDate: '2026-11-10' }
    ],
    projectHistory: [
      { projectId: 'PRJ001', role: 'Data Program Manager', performance: 2.7 }
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
  },
  {
    id: 'CK003',
    employeeId: 'E007',
    projectId: 'PRJ002',
    reviewerId: 'E004',
    reviewDate: '2026-03-15',
    reviewType: 'Quarterly',
    comments: 'Q1 — Arranque en Nivel 2 (Etapa A). Samsagaz demuestra buena base técnica en React y TypeScript, aunque requiere mayor autonomía en el desglose de requisitos con cliente y en la coordinación técnica del equipo.',
    scores: [
      { competencyId: 'CLIENT_ORIENTATION', score: 2.6, stage: 'A', comments: 'Recoge requerimientos con apoyo del PM; en proceso de ganar proximidad directa.' },
      { competencyId: 'INNOVATION', score: 2.8, stage: 'A', comments: 'Trabaja con método y calidad, aplicando estándares existentes.' },
      { competencyId: 'HUMAN_RELATIONS', score: 2.5, stage: 'A', comments: 'Comunicación clara con compañeros directos; margen de mejora ante presión.' },
      { competencyId: 'ORGANIZATION_RESULTS', score: 2.4, stage: 'A', comments: 'Cumple tareas asignadas, aunque necesita mejorar la estimación de dependencias.' },
      { competencyId: 'TEAM_LEADERSHIP', score: 2.2, stage: 'A', comments: 'Coopera bien en el equipo pero aún no ejerce mentoría activa.' },
      { competencyId: 'PROFESSIONAL_OPENNESS', score: 2.7, stage: 'A', comments: 'Actitud receptiva al feedback y actualización técnica continua.' }
    ],
    kpis: [
      { id: 'k7', kpi: 'Quality', weight: 35, targetValue: 4.0, currentValue: 3.2 },
      { id: 'k8', kpi: 'Delivery', weight: 35, targetValue: 4.0, currentValue: 3.1 },
      { id: 'k9', kpi: 'Customer Satisfaction', weight: 30, targetValue: 4.0, currentValue: 3.3 }
    ]
  },
  {
    id: 'CK004',
    employeeId: 'E007',
    projectId: 'PRJ002',
    reviewerId: 'E004',
    reviewDate: '2026-06-15',
    reviewType: 'Quarterly',
    comments: 'Q2 — Progresión sostenida tras completar la formación en React 19 y Next.js. Empieza a proponer mejoras técnicas en los microservicios Node.js y gana seguridad en las demos con Mercadona.',
    scores: [
      { competencyId: 'CLIENT_ORIENTATION', score: 3.1, stage: 'B', comments: 'Comprende expectativas funcionales del cliente e integra mejoras en sus entregas.' },
      { competencyId: 'INNOVATION', score: 3.4, stage: 'B', comments: 'Analiza alternativas de rendimiento y propone caché distribuida en APIs.' },
      { competencyId: 'HUMAN_RELATIONS', score: 3.0, stage: 'B', comments: 'Gestiona mejor los picos de sprint y facilita acuerdos entre front y back.' },
      { competencyId: 'ORGANIZATION_RESULTS', score: 3.0, stage: 'B', comments: 'Planifica sus módulos con autonomía y cumple hitos sin desviaciones.' },
      { competencyId: 'TEAM_LEADERSHIP', score: 2.7, stage: 'A', comments: 'Comienza a hacer code reviews constructivas para perfiles junior.' },
      { competencyId: 'PROFESSIONAL_OPENNESS', score: 3.2, stage: 'B', comments: 'Comparte aprendizajes de AWS y arquitectura en sesiones internas.' }
    ],
    kpis: [
      { id: 'k10', kpi: 'Quality', weight: 35, targetValue: 4.0, currentValue: 3.7 },
      { id: 'k11', kpi: 'Delivery', weight: 35, targetValue: 4.0, currentValue: 3.6 },
      { id: 'k12', kpi: 'Customer Satisfaction', weight: 30, targetValue: 4.0, currentValue: 3.8 }
    ]
  },
  {
    id: 'CK005',
    employeeId: 'E007',
    projectId: 'PRJ002',
    reviewerId: 'E004',
    reviewDate: '2026-09-15',
    reviewType: 'Quarterly',
    comments: 'Q3 — Consolidación plena de Nivel 2 (Etapa B). Ha liderado la refactorización del checkout con Clean Architecture y DDD, reduciendo la latencia un 35% y acompañando a perfiles L1/L2.',
    scores: [
      { competencyId: 'CLIENT_ORIENTATION', score: 3.6, stage: 'B', comments: 'Participa directamente en talleres funcionales anticipando riesgos de UX.' },
      { competencyId: 'INNOVATION', score: 3.9, stage: 'B', comments: 'Aplica Clean Architecture en Node.js/TypeScript con cobertura de tests >85%.' },
      { competencyId: 'HUMAN_RELATIONS', score: 3.5, stage: 'B', comments: 'Colaboración fluida con QA, Producto y el equipo técnico de cliente.' },
      { competencyId: 'ORGANIZATION_RESULTS', score: 3.7, stage: 'B', comments: 'Optimiza prioridades de entrega y desbloquea dependencias críticas del sprint.' },
      { competencyId: 'TEAM_LEADERSHIP', score: 3.3, stage: 'B', comments: 'Mentoriza activamente a dos desarrolladores junior en buenas prácticas React.' },
      { competencyId: 'PROFESSIONAL_OPENNESS', score: 3.7, stage: 'B', comments: 'Iniciativa constante para explorar observabilidad y automatización CI/CD.' }
    ],
    kpis: [
      { id: 'k13', kpi: 'Quality', weight: 35, targetValue: 4.0, currentValue: 4.1 },
      { id: 'k14', kpi: 'Delivery', weight: 35, targetValue: 4.0, currentValue: 4.0 },
      { id: 'k15', kpi: 'Customer Satisfaction', weight: 30, targetValue: 4.0, currentValue: 4.2 }
    ]
  },
  {
    id: 'CK006',
    employeeId: 'E007',
    projectId: 'PRJ002',
    reviewerId: 'E004',
    reviewDate: '2026-11-10',
    reviewType: 'Quarterly',
    comments: 'Q4 — Cierre de año sobresaliente. Supera consistentemente las metas del Nivel 2, alcanzando Etapa C en Innovación y Organización. Referente técnico del squad Full-Stack de Mercadona.',
    scores: [
      { competencyId: 'CLIENT_ORIENTATION', score: 4.1, stage: 'B', comments: 'Muy valorado por el Product Owner de Mercadona; aporta soluciones proactivas.' },
      { competencyId: 'INNOVATION', score: 4.5, stage: 'C', comments: 'Diseñó la librería común de componentes y el patrón BFF serverless en AWS.' },
      { competencyId: 'HUMAN_RELATIONS', score: 4.0, stage: 'B', comments: 'Gran madurez en gestión de conflictos técnicos y alineación de equipo.' },
      { competencyId: 'ORGANIZATION_RESULTS', score: 4.2, stage: 'C', comments: 'Coordina entregas complejas entre múltiples squads cumpliendo al 100% los SLA.' },
      { competencyId: 'TEAM_LEADERSHIP', score: 3.8, stage: 'B', comments: 'Dinamiza las ceremonias técnicas y eleva el estándar de calidad del equipo.' },
      { competencyId: 'PROFESSIONAL_OPENNESS', score: 4.2, stage: 'B', comments: 'Referente en comunidades internas de TypeScript y AWS.' }
    ],
    kpis: [
      { id: 'k16', kpi: 'Quality', weight: 35, targetValue: 4.0, currentValue: 4.5 },
      { id: 'k17', kpi: 'Delivery', weight: 35, targetValue: 4.0, currentValue: 4.4 },
      { id: 'k18', kpi: 'Customer Satisfaction', weight: 30, targetValue: 4.0, currentValue: 4.6 }
    ]
  },
  {
    id: 'CK007',
    employeeId: 'E008',
    projectId: 'PRJ001',
    reviewerId: 'E006',
    reviewDate: '2026-05-20',
    reviewType: 'Quarterly',
    comments: 'Q2 — Elena ha diseñado el blueprint de plataforma IA multi-tenant con excelente adopción en cliente y liderazgo técnico sobre tres squads.',
    scores: [
      { competencyId: 'CLIENT_ORIENTATION', score: 4.5, stage: 'C', comments: 'Interlocución directa con dirección de arquitectura del cliente.' },
      { competencyId: 'INNOVATION', score: 4.7, stage: 'D', comments: 'Introdujo arquitectura RAG evaluable y reutilizable.' },
      { competencyId: 'HUMAN_RELATIONS', score: 4.1, stage: 'C', comments: 'Genera consenso sólido entre negocio y tecnología.' },
      { competencyId: 'ORGANIZATION_RESULTS', score: 4.2, stage: 'C', comments: 'Cumplimiento íntegro de hitos de arquitectura.' },
      { competencyId: 'TEAM_LEADERSHIP', score: 4.3, stage: 'C', comments: 'Mentoría activa a tech leads de Data & AI.' },
      { competencyId: 'PROFESSIONAL_OPENNESS', score: 4.6, stage: 'D', comments: 'Impulsa la comunidad interna de GenAI.' }
    ],
    kpis: [
      { id: 'k19', kpi: 'Quality', weight: 40, targetValue: 4.5, currentValue: 4.7 },
      { id: 'k20', kpi: 'Innovation', weight: 30, targetValue: 4.5, currentValue: 4.8 },
      { id: 'k21', kpi: 'Customer Satisfaction', weight: 30, targetValue: 4.5, currentValue: 4.6 }
    ]
  },
  {
    id: 'CK008',
    employeeId: 'E008',
    projectId: 'PRJ001',
    reviewerId: 'E006',
    reviewDate: '2026-10-28',
    reviewType: 'Quarterly',
    comments: 'Q4 — Consolidación completa de etapas de Senior Manager (L5) con impacto directo en nuevas cuentas de IA.',
    scores: [
      { competencyId: 'CLIENT_ORIENTATION', score: 4.8, stage: 'D', comments: 'Visión estratégica y relación de confianza ejecutiva.' },
      { competencyId: 'INNOVATION', score: 4.9, stage: 'D', comments: 'Referente corporativo en soluciones IA industrializadas.' },
      { competencyId: 'HUMAN_RELATIONS', score: 4.4, stage: 'C', comments: 'Excelente gestión de comités complejos.' },
      { competencyId: 'ORGANIZATION_RESULTS', score: 4.5, stage: 'C', comments: 'Optimiza entrega y márgenes en entornos críticos.' },
      { competencyId: 'TEAM_LEADERSHIP', score: 4.5, stage: 'C', comments: 'Desarrolla nuevos líderes técnicos en la división.' },
      { competencyId: 'PROFESSIONAL_OPENNESS', score: 4.8, stage: 'D', comments: 'Vigilancia tecnológica y publicación de activos internos.' }
    ],
    kpis: [
      { id: 'k22', kpi: 'Quality', weight: 40, targetValue: 4.5, currentValue: 4.8 },
      { id: 'k23', kpi: 'Innovation', weight: 30, targetValue: 4.5, currentValue: 4.9 },
      { id: 'k24', kpi: 'Customer Satisfaction', weight: 30, targetValue: 4.5, currentValue: 4.8 }
    ]
  },
  {
    id: 'CK009',
    employeeId: 'E009',
    projectId: 'PRJ003',
    reviewerId: 'E008',
    reviewDate: '2026-05-18',
    reviewType: 'Quarterly',
    comments: 'Q2 — Hugo ha estandarizado el despliegue automatizado de pipelines MLOps reduciendo incidencias en producción.',
    scores: [
      { competencyId: 'CLIENT_ORIENTATION', score: 3.9, stage: 'B', comments: 'Anticipa necesidades operativas del equipo de datos.' },
      { competencyId: 'INNOVATION', score: 4.3, stage: 'C', comments: 'Automatización avanzada de feature store.' },
      { competencyId: 'HUMAN_RELATIONS', score: 3.8, stage: 'B', comments: 'Buena coordinación transversal con DevOps.' },
      { competencyId: 'ORGANIZATION_RESULTS', score: 4.1, stage: 'B', comments: 'Entregas previsibles con alta cobertura de pruebas.' },
      { competencyId: 'TEAM_LEADERSHIP', score: 3.9, stage: 'B', comments: 'Acompaña a perfiles L1/L2 en buenas prácticas.' },
      { competencyId: 'PROFESSIONAL_OPENNESS', score: 4.2, stage: 'C', comments: 'Lidera charlas técnicas sobre Kubernetes y ML.' }
    ],
    kpis: [
      { id: 'k25', kpi: 'Quality', weight: 35, targetValue: 4.0, currentValue: 4.3 },
      { id: 'k26', kpi: 'Delivery', weight: 35, targetValue: 4.0, currentValue: 4.2 },
      { id: 'k27', kpi: 'Productivity', weight: 30, targetValue: 4.0, currentValue: 4.3 }
    ]
  },
  {
    id: 'CK010',
    employeeId: 'E009',
    projectId: 'PRJ003',
    reviewerId: 'E008',
    reviewDate: '2026-10-25',
    reviewType: 'Quarterly',
    comments: 'Q4 — Cumple íntegramente los criterios SSTD del nivel Manager (L4) tras asumir coordinación técnica de célula.',
    scores: [
      { competencyId: 'CLIENT_ORIENTATION', score: 4.1, stage: 'B', comments: 'Excelente interlocución técnica con el cliente.' },
      { competencyId: 'INNOVATION', score: 4.5, stage: 'C', comments: 'Aplica creatividad técnica en optimización de costes cloud.' },
      { competencyId: 'HUMAN_RELATIONS', score: 4.0, stage: 'B', comments: 'Resuelve bloqueos técnicos con madurez.' },
      { competencyId: 'ORGANIZATION_RESULTS', score: 4.3, stage: 'C', comments: 'Coordina múltiples dependencias entre squads.' },
      { competencyId: 'TEAM_LEADERSHIP', score: 4.1, stage: 'B', comments: 'Motiva y mentoriza eficazmente al equipo.' },
      { competencyId: 'PROFESSIONAL_OPENNESS', score: 4.4, stage: 'C', comments: 'Comparte estándares en toda la división Data & AI.' }
    ],
    kpis: [
      { id: 'k28', kpi: 'Quality', weight: 35, targetValue: 4.0, currentValue: 4.4 },
      { id: 'k29', kpi: 'Delivery', weight: 35, targetValue: 4.0, currentValue: 4.3 },
      { id: 'k30', kpi: 'Productivity', weight: 30, targetValue: 4.0, currentValue: 4.4 }
    ]
  },
  {
    id: 'CK011',
    employeeId: 'E010',
    projectId: 'PRJ003',
    reviewerId: 'E008',
    reviewDate: '2026-05-15',
    reviewType: 'Quarterly',
    comments: 'Q2 — Lucía ejecuta con fiabilidad los pipelines Python/SQL asignados y muestra gran iniciativa de aprendizaje.',
    scores: [
      { competencyId: 'CLIENT_ORIENTATION', score: 3.4, stage: 'A', comments: 'Documenta requisitos con apoyo del tech lead.' },
      { competencyId: 'INNOVATION', score: 3.8, stage: 'B', comments: 'Mejora scripts de validación automática de esquemas.' },
      { competencyId: 'HUMAN_RELATIONS', score: 3.6, stage: 'B', comments: 'Colaboración muy fluida con QA y analistas.' },
      { competencyId: 'ORGANIZATION_RESULTS', score: 3.5, stage: 'A', comments: 'Cumple plazos en tareas acotadas.' },
      { competencyId: 'TEAM_LEADERSHIP', score: 3.2, stage: 'A', comments: 'Coopera activamente en revisiones de código.' },
      { competencyId: 'PROFESSIONAL_OPENNESS', score: 3.9, stage: 'B', comments: 'Rápida adopción de herramientas de calidad de datos.' }
    ],
    kpis: [
      { id: 'k31', kpi: 'Quality', weight: 40, targetValue: 3.5, currentValue: 3.8 },
      { id: 'k32', kpi: 'Delivery', weight: 30, targetValue: 3.5, currentValue: 3.7 },
      { id: 'k33', kpi: 'Customer Satisfaction', weight: 30, targetValue: 3.5, currentValue: 3.9 }
    ]
  },
  {
    id: 'CK012',
    employeeId: 'E010',
    projectId: 'PRJ003',
    reviewerId: 'E008',
    reviewDate: '2026-10-20',
    reviewType: 'Quarterly',
    comments: 'Q4 — Sólido rendimiento en Nivel 1 (L2) superando expectativas de calidad; en ruta para L3 cuando consolide autonomía en cliente.',
    scores: [
      { competencyId: 'CLIENT_ORIENTATION', score: 3.6, stage: 'A', comments: 'Participa en demos técnicas con buena claridad.' },
      { competencyId: 'INNOVATION', score: 4.0, stage: 'B', comments: 'Propone refactorizaciones limpias en módulos ETL.' },
      { competencyId: 'HUMAN_RELATIONS', score: 3.8, stage: 'B', comments: 'Empatía y comunicación constructiva en el squad.' },
      { competencyId: 'ORGANIZATION_RESULTS', score: 3.7, stage: 'A', comments: 'Mejora en estimación de subtareas.' },
      { competencyId: 'TEAM_LEADERSHIP', score: 3.5, stage: 'A', comments: 'Apoya la incorporación de analistas junior.' },
      { competencyId: 'PROFESSIONAL_OPENNESS', score: 4.0, stage: 'B', comments: 'Completado itinerario formativo interno.' }
    ],
    kpis: [
      { id: 'k34', kpi: 'Quality', weight: 40, targetValue: 3.5, currentValue: 4.0 },
      { id: 'k35', kpi: 'Delivery', weight: 30, targetValue: 3.5, currentValue: 3.8 },
      { id: 'k36', kpi: 'Customer Satisfaction', weight: 30, targetValue: 3.5, currentValue: 3.9 }
    ]
  },
  {
    id: 'CK013',
    employeeId: 'E011',
    projectId: 'PRJ002',
    reviewerId: 'E008',
    reviewDate: '2026-05-12',
    reviewType: 'Quarterly',
    comments: 'Q2 — Marcos se adapta adecuadamente a los estándares de visualización y reporting bajo supervisión.',
    scores: [
      { competencyId: 'CLIENT_ORIENTATION', score: 3.0, stage: 'A', comments: 'Recoge incidencias de cuadros de mando con apoyo.' },
      { competencyId: 'INNOVATION', score: 3.1, stage: 'A', comments: 'Sigue plantillas establecidas con rigor.' },
      { competencyId: 'HUMAN_RELATIONS', score: 3.2, stage: 'A', comments: 'Escucha activa y trato cordial.' },
      { competencyId: 'ORGANIZATION_RESULTS', score: 3.0, stage: 'A', comments: 'Cumple entregas planificadas.' },
      { competencyId: 'TEAM_LEADERSHIP', score: 2.9, stage: 'A', comments: 'Colabora en equipo según lo esperado en L1.' },
      { competencyId: 'PROFESSIONAL_OPENNESS', score: 3.2, stage: 'A', comments: 'Receptivo al feedback continuo.' }
    ],
    kpis: [
      { id: 'k37', kpi: 'Quality', weight: 35, targetValue: 3.0, currentValue: 3.1 },
      { id: 'k38', kpi: 'Delivery', weight: 35, targetValue: 3.0, currentValue: 3.2 },
      { id: 'k39', kpi: 'Customer Satisfaction', weight: 30, targetValue: 3.0, currentValue: 3.2 }
    ]
  },
  {
    id: 'CK014',
    employeeId: 'E011',
    projectId: 'PRJ002',
    reviewerId: 'E008',
    reviewDate: '2026-10-18',
    reviewType: 'Quarterly',
    comments: 'Q4 — Cumple correctamente los objetivos del Nivel 1 prima (L1) con estabilidad y buena actitud de equipo.',
    scores: [
      { competencyId: 'CLIENT_ORIENTATION', score: 3.3, stage: 'A', comments: 'Mejora la precisión al documentar KPIs.' },
      { competencyId: 'INNOVATION', score: 3.2, stage: 'A', comments: 'Aplica buenas prácticas de modelado Power BI.' },
      { competencyId: 'HUMAN_RELATIONS', score: 3.4, stage: 'A', comments: 'Comunicación fluida con el equipo de desarrollo.' },
      { competencyId: 'ORGANIZATION_RESULTS', score: 3.2, stage: 'A', comments: 'Cumple fechas comprometidas en sprint.' },
      { competencyId: 'TEAM_LEADERSHIP', score: 3.1, stage: 'A', comments: 'Comparte documentación funcional del proyecto.' },
      { competencyId: 'PROFESSIONAL_OPENNESS', score: 3.4, stage: 'A', comments: 'Constante en formación SQL.' }
    ],
    kpis: [
      { id: 'k40', kpi: 'Quality', weight: 35, targetValue: 3.0, currentValue: 3.3 },
      { id: 'k41', kpi: 'Delivery', weight: 35, targetValue: 3.0, currentValue: 3.2 },
      { id: 'k42', kpi: 'Customer Satisfaction', weight: 30, targetValue: 3.0, currentValue: 3.3 }
    ]
  },
  {
    id: 'CK015',
    employeeId: 'E012',
    projectId: 'PRJ001',
    reviewerId: 'E006',
    reviewDate: '2026-05-22',
    reviewType: 'Quarterly',
    comments: 'Q2 — Se detectan desviaciones de seguimiento presupuestario y falta de anticipación de riesgos en la cartera asignada.',
    scores: [
      { competencyId: 'CLIENT_ORIENTATION', score: 2.8, stage: 'B', comments: 'Gestión reactiva ante escalados de cliente.' },
      { competencyId: 'INNOVATION', score: 2.6, stage: 'B', comments: 'Poca adopción de métricas automatizadas de delivery.' },
      { competencyId: 'HUMAN_RELATIONS', score: 2.7, stage: 'C', comments: 'Fricciones puntuales en la coordinación entre equipos.' },
      { competencyId: 'ORGANIZATION_RESULTS', score: 2.4, stage: 'C', comments: 'Desvíos de planificación en dos entregas clave.' },
      { competencyId: 'TEAM_LEADERSHIP', score: 2.5, stage: 'C', comments: 'Necesita mayor acompañamiento y claridad de prioridades.' },
      { competencyId: 'PROFESSIONAL_OPENNESS', score: 2.6, stage: 'B', comments: 'Baja participación en iniciativas de mejora.' }
    ],
    kpis: [
      { id: 'k43', kpi: 'Delivery', weight: 40, targetValue: 4.5, currentValue: 2.6 },
      { id: 'k44', kpi: 'Customer Satisfaction', weight: 30, targetValue: 4.5, currentValue: 2.8 },
      { id: 'k45', kpi: 'Quality', weight: 30, targetValue: 4.5, currentValue: 2.7 }
    ]
  },
  {
    id: 'CK016',
    employeeId: 'E012',
    projectId: 'PRJ001',
    reviewerId: 'E006',
    reviewDate: '2026-10-30',
    reviewType: 'Quarterly',
    comments: 'Q4 — Persisten brechas respecto al estándar de Senior Manager (L5) en liderazgo, organización y relación ejecutiva.',
    scores: [
      { competencyId: 'CLIENT_ORIENTATION', score: 2.7, stage: 'B', comments: 'Requiere apoyo directivo para reconducir expectativas.' },
      { competencyId: 'INNOVATION', score: 2.5, stage: 'B', comments: 'No impulsa estandarización de procesos.' },
      { competencyId: 'HUMAN_RELATIONS', score: 2.6, stage: 'C', comments: 'Margen de mejora en generación de consensos.' },
      { competencyId: 'ORGANIZATION_RESULTS', score: 2.4, stage: 'C', comments: 'Requiere plan de choque en control de riesgos y SLA.' },
      { competencyId: 'TEAM_LEADERSHIP', score: 2.6, stage: 'C', comments: 'Delegación incompleta en responsables de squad.' },
      { competencyId: 'PROFESSIONAL_OPENNESS', score: 2.5, stage: 'B', comments: 'Pendiente actualizar certificación de gestión.' }
    ],
    kpis: [
      { id: 'k46', kpi: 'Delivery', weight: 40, targetValue: 4.5, currentValue: 2.5 },
      { id: 'k47', kpi: 'Customer Satisfaction', weight: 30, targetValue: 4.5, currentValue: 2.7 },
      { id: 'k48', kpi: 'Quality', weight: 30, targetValue: 4.5, currentValue: 2.6 }
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
  },
  {
    id: 'DP003',
    employeeId: 'E007', // Samsagaz Gamyi
    year: 2026,
    status: 'Active',
    actions: [
      { id: 'DA005', type: 'Training', description: 'React 19, Next.js Masterclass & Tailwind Enterprise', targetDate: '2026-04-30', status: 'Completed', trainingId: 'TR2' },
      { id: 'DA006', type: 'Training', description: 'Arquitectura Enterprise con Clean Architecture y DDD', targetDate: '2026-08-30', status: 'Completed', trainingId: 'TR1' },
      { id: 'DA007', type: 'Certification', description: 'Certificación Oficial AWS Solutions Architect Associate', targetDate: '2026-12-15', status: 'InProgress', trainingId: 'TR3' },
      { id: 'DA008', type: 'Mentoring', description: 'Mentoría de liderazgo técnico y diseño de sistemas con Beatriz Ortiz', targetDate: '2026-12-20', status: 'InProgress' }
    ]
  },
  {
    id: 'DP004',
    employeeId: 'E008',
    year: 2026,
    status: 'Completed',
    actions: [
      { id: 'DA009', type: 'Certification', description: 'Especialización ejecutiva en Gobierno de IA y Arquitectura Multi-Cloud', targetDate: '2026-09-30', status: 'Completed' }
    ]
  },
  {
    id: 'DP005',
    employeeId: 'E009',
    year: 2026,
    status: 'Completed',
    actions: [
      { id: 'DA010', type: 'Training', description: 'Liderazgo Ágil, Gestión de Conflictos y Facilitación', targetDate: '2026-07-15', status: 'Completed', trainingId: 'TR4' }
    ]
  },
  {
    id: 'DP006',
    employeeId: 'E012',
    year: 2026,
    status: 'Active',
    actions: [
      { id: 'DA011', type: 'Coaching', description: 'Plan intensivo de control de riesgos y gobernanza de entregas multi-squad', targetDate: '2027-03-31', status: 'InProgress' }
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
  },
  {
    evaluationId: 'EV003',
    employeeId: 'E007', // Samsagaz Gamyi
    year: 2026,
    currentLevelId: 'L3', // Senior Engineer (Nivel 2)
    targetLevelId: 'L4', // Manager / Tech Lead (Nivel 3)
    status: 'Calibration',
    finalScore: 4.18,
    evaluationResult: 'ExceedsExpectations',
    dimensions: [
      { id: 'd11', dimension: 'Competencies', weight: 40, score: 4.1 },
      { id: 'd12', dimension: 'ProjectPerformance', weight: 30, score: 4.4 },
      { id: 'd13', dimension: 'Training', weight: 15, score: 4.2 },
      { id: 'd14', dimension: 'Feedback360', weight: 10, score: 4.0 },
      { id: 'd15', dimension: 'CorporateContribution', weight: 5, score: 3.8 }
    ],
    competencies: [
      { id: 'c13', competencyId: 'CLIENT_ORIENTATION', expectedStage: 'B', actualStage: 'B', score: 4.1, gap: 0 },
      { id: 'c14', competencyId: 'INNOVATION', expectedStage: 'B', actualStage: 'C', score: 4.5, gap: 1 },
      { id: 'c15', competencyId: 'HUMAN_RELATIONS', expectedStage: 'A', actualStage: 'B', score: 4.0, gap: 1 },
      { id: 'c16', competencyId: 'TEAM_LEADERSHIP', expectedStage: 'A', actualStage: 'B', score: 3.8, gap: 1 },
      { id: 'c17', competencyId: 'ORGANIZATION_RESULTS', expectedStage: 'B', actualStage: 'C', score: 4.2, gap: 1 },
      { id: 'c18', competencyId: 'PROFESSIONAL_OPENNESS', expectedStage: 'B', actualStage: 'B', score: 4.2, gap: 0 }
    ],
    commentsManager: 'Evolución ejemplar a lo largo de los 4 checkpoints de 2026. Samsagaz arrancó el año en Etapa A de Nivel 2 y ha cerrado Q4 consolidando Etapa B en todas las competencias y Etapa C en Innovación y Organización. Pieza clave en el rediseño E-Commerce de Mercadona.',
    commentsHR: 'Caso de referencia en la calibración de Software Engineering: progresión medible del +1.64 pts en promedio de competencias entre Q1 y Q4 y dos formaciones clave completadas. Listo para asumir responsabilidades de Tech Lead en Q1 2027 como paso previo a L4.',
    promotionRecommendation: {
      ready: false,
      reason: 'Progresión sobresaliente de Etapa A a B/C durante 2026 (score global 4.18/5). Consolida plenamente Nivel 2; se recomienda reforzar liderazgo de equipo y gestión de clientes (Etapa C) en H1 2027 para optar a promoción L4.'
    }
  },
  {
    evaluationId: 'EV004',
    employeeId: 'E008',
    year: 2026,
    currentLevelId: 'L4',
    targetLevelId: 'L5',
    status: 'Closed',
    finalScore: 4.7,
    evaluationResult: 'Promoted',
    dimensions: [
      { id: 'd16', dimension: 'Competencies', weight: 40, score: 4.7 },
      { id: 'd17', dimension: 'ProjectPerformance', weight: 30, score: 4.8 },
      { id: 'd18', dimension: 'Training', weight: 15, score: 4.6 },
      { id: 'd19', dimension: 'Feedback360', weight: 10, score: 4.6 },
      { id: 'd20', dimension: 'CorporateContribution', weight: 5, score: 4.5 }
    ],
    competencies: [
      { id: 'c19', competencyId: 'CLIENT_ORIENTATION', expectedStage: 'D', actualStage: 'D', score: 4.8, gap: 0 },
      { id: 'c20', competencyId: 'INNOVATION', expectedStage: 'D', actualStage: 'D', score: 4.9, gap: 0 },
      { id: 'c21', competencyId: 'HUMAN_RELATIONS', expectedStage: 'C', actualStage: 'C', score: 4.4, gap: 0 },
      { id: 'c22', competencyId: 'TEAM_LEADERSHIP', expectedStage: 'C', actualStage: 'C', score: 4.5, gap: 0 },
      { id: 'c23', competencyId: 'ORGANIZATION_RESULTS', expectedStage: 'C', actualStage: 'C', score: 4.5, gap: 0 },
      { id: 'c24', competencyId: 'PROFESSIONAL_OPENNESS', expectedStage: 'D', actualStage: 'D', score: 4.8, gap: 0 }
    ],
    commentsManager: 'Desempeño excepcional liderando la arquitectura de IA Generativa en Data & AI. Supera todos los objetivos de nivel L5.',
    commentsHR: 'Promoción a Senior Manager (L5) ratificada en comité de calibración con revisión salarial asociada.',
    promotionRecommendation: {
      ready: true,
      reason: 'Score global de 4.70/5. Cumple todas las etapas SSTD requeridas para L5 en Arquitectura y lidera cuentas estratégicas.'
    }
  },
  {
    evaluationId: 'EV005',
    employeeId: 'E009',
    year: 2026,
    currentLevelId: 'L3',
    targetLevelId: 'L4',
    status: 'Closed',
    finalScore: 4.25,
    evaluationResult: 'ExceedsExpectations',
    dimensions: [
      { id: 'd21', dimension: 'Competencies', weight: 40, score: 4.2 },
      { id: 'd22', dimension: 'ProjectPerformance', weight: 30, score: 4.4 },
      { id: 'd23', dimension: 'Training', weight: 15, score: 4.3 },
      { id: 'd24', dimension: 'Feedback360', weight: 10, score: 4.0 },
      { id: 'd25', dimension: 'CorporateContribution', weight: 5, score: 4.1 }
    ],
    competencies: [
      { id: 'c25', competencyId: 'CLIENT_ORIENTATION', expectedStage: 'B', actualStage: 'B', score: 4.1, gap: 0 },
      { id: 'c26', competencyId: 'INNOVATION', expectedStage: 'C', actualStage: 'C', score: 4.5, gap: 0 },
      { id: 'c27', competencyId: 'HUMAN_RELATIONS', expectedStage: 'B', actualStage: 'B', score: 4.0, gap: 0 },
      { id: 'c28', competencyId: 'TEAM_LEADERSHIP', expectedStage: 'B', actualStage: 'B', score: 4.1, gap: 0 },
      { id: 'c29', competencyId: 'ORGANIZATION_RESULTS', expectedStage: 'C', actualStage: 'C', score: 4.3, gap: 0 },
      { id: 'c30', competencyId: 'PROFESSIONAL_OPENNESS', expectedStage: 'C', actualStage: 'C', score: 4.4, gap: 0 }
    ],
    commentsManager: 'Hugo ha asumido con éxito la coordinación técnica del equipo MLOps alcanzando todas las etapas SSTD del nivel Manager L4.',
    commentsHR: 'Calibrado positivamente para promoción a Manager (L4) dentro del presupuesto de Data & AI.',
    promotionRecommendation: {
      ready: true,
      reason: 'Score global de 4.25/5 y cumplimiento pleno de etapas B/C exigidas para Manager (L4) en Solution Building.'
    }
  },
  {
    evaluationId: 'EV006',
    employeeId: 'E010',
    year: 2026,
    currentLevelId: 'L2',
    targetLevelId: 'L3',
    status: 'Closed',
    finalScore: 3.85,
    evaluationResult: 'ExceedsExpectations',
    dimensions: [
      { id: 'd26', dimension: 'Competencies', weight: 40, score: 3.8 },
      { id: 'd27', dimension: 'ProjectPerformance', weight: 30, score: 3.9 },
      { id: 'd28', dimension: 'Training', weight: 15, score: 4.0 },
      { id: 'd29', dimension: 'Feedback360', weight: 10, score: 3.8 },
      { id: 'd30', dimension: 'CorporateContribution', weight: 5, score: 3.6 }
    ],
    competencies: [
      { id: 'c31', competencyId: 'CLIENT_ORIENTATION', expectedStage: 'B', actualStage: 'A', score: 3.6, gap: -1 },
      { id: 'c32', competencyId: 'INNOVATION', expectedStage: 'B', actualStage: 'B', score: 4.0, gap: 0 },
      { id: 'c33', competencyId: 'HUMAN_RELATIONS', expectedStage: 'A', actualStage: 'B', score: 3.8, gap: 1 },
      { id: 'c34', competencyId: 'TEAM_LEADERSHIP', expectedStage: 'A', actualStage: 'A', score: 3.5, gap: 0 },
      { id: 'c35', competencyId: 'ORGANIZATION_RESULTS', expectedStage: 'B', actualStage: 'A', score: 3.7, gap: -1 },
      { id: 'c36', competencyId: 'PROFESSIONAL_OPENNESS', expectedStage: 'B', actualStage: 'B', score: 4.0, gap: 0 }
    ],
    commentsManager: 'Excelente año en entrega técnica de pipelines de datos. Aún necesita consolidar exposición directa con cliente para dar el salto a L3.',
    commentsHR: 'Reconocimiento salarial por rendimiento superior a las expectativas en su nivel actual L2.',
    promotionRecommendation: {
      ready: false,
      reason: 'Supera expectativas en L2 (3.85/5), pero tiene pendiente alcanzar Etapa B en Orientación al Cliente y Organización para optar a Senior Engineer L3.'
    }
  },
  {
    evaluationId: 'EV007',
    employeeId: 'E011',
    year: 2026,
    currentLevelId: 'L1',
    targetLevelId: 'L2',
    status: 'Closed',
    finalScore: 3.25,
    evaluationResult: 'MeetsExpectations',
    dimensions: [
      { id: 'd31', dimension: 'Competencies', weight: 40, score: 3.2 },
      { id: 'd32', dimension: 'ProjectPerformance', weight: 30, score: 3.3 },
      { id: 'd33', dimension: 'Training', weight: 15, score: 3.4 },
      { id: 'd34', dimension: 'Feedback360', weight: 10, score: 3.2 },
      { id: 'd35', dimension: 'CorporateContribution', weight: 5, score: 3.0 }
    ],
    competencies: [
      { id: 'c37', competencyId: 'CLIENT_ORIENTATION', expectedStage: 'A', actualStage: 'A', score: 3.3, gap: 0 },
      { id: 'c38', competencyId: 'INNOVATION', expectedStage: 'A', actualStage: 'A', score: 3.2, gap: 0 },
      { id: 'c39', competencyId: 'HUMAN_RELATIONS', expectedStage: 'A', actualStage: 'A', score: 3.4, gap: 0 },
      { id: 'c40', competencyId: 'TEAM_LEADERSHIP', expectedStage: 'A', actualStage: 'A', score: 3.1, gap: 0 },
      { id: 'c41', competencyId: 'ORGANIZATION_RESULTS', expectedStage: 'A', actualStage: 'A', score: 3.2, gap: 0 },
      { id: 'c42', competencyId: 'PROFESSIONAL_OPENNESS', expectedStage: 'A', actualStage: 'A', score: 3.4, gap: 0 }
    ],
    commentsManager: 'Marcos cumple adecuadamente con los objetivos esperados para su primer año en Data & AI.',
    commentsHR: 'Alineado con su nivel L1. Mantener acompañamiento técnico para ganar autonomía en SQL y modelado BI.',
    promotionRecommendation: {
      ready: false,
      reason: 'Cumple expectativas en L1 (3.25/5); continúa ganando autonomía operativa antes de pasar a L2.'
    }
  },
  {
    evaluationId: 'EV008',
    employeeId: 'E012',
    year: 2026,
    currentLevelId: 'L5',
    targetLevelId: 'L6',
    status: 'Closed',
    finalScore: 2.6,
    evaluationResult: 'Unsatisfactory',
    dimensions: [
      { id: 'd36', dimension: 'Competencies', weight: 40, score: 2.5 },
      { id: 'd37', dimension: 'ProjectPerformance', weight: 30, score: 2.6 },
      { id: 'd38', dimension: 'Training', weight: 15, score: 2.7 },
      { id: 'd39', dimension: 'Feedback360', weight: 10, score: 2.7 },
      { id: 'd40', dimension: 'CorporateContribution', weight: 5, score: 2.8 }
    ],
    competencies: [
      { id: 'c43', competencyId: 'CLIENT_ORIENTATION', expectedStage: 'C', actualStage: 'B', score: 2.7, gap: -1 },
      { id: 'c44', competencyId: 'INNOVATION', expectedStage: 'C', actualStage: 'B', score: 2.5, gap: -1 },
      { id: 'c45', competencyId: 'HUMAN_RELATIONS', expectedStage: 'D', actualStage: 'C', score: 2.6, gap: -1 },
      { id: 'c46', competencyId: 'TEAM_LEADERSHIP', expectedStage: 'D', actualStage: 'C', score: 2.6, gap: -1 },
      { id: 'c47', competencyId: 'ORGANIZATION_RESULTS', expectedStage: 'D', actualStage: 'C', score: 2.4, gap: -1 },
      { id: 'c48', competencyId: 'PROFESSIONAL_OPENNESS', expectedStage: 'C', actualStage: 'B', score: 2.5, gap: -1 }
    ],
    commentsManager: 'El rendimiento en gestión de riesgos y cumplimiento de entregas ha estado por debajo del estándar esperado para Senior Manager (L5).',
    commentsHR: 'Se activa plan de seguimiento y mejora en gobernanza; sin incremento salarial en este ciclo.',
    promotionRecommendation: {
      ready: false,
      reason: 'Nota global 2.60/5 (Por debajo de expectativas). Presenta brechas en todas las competencias exigidas para su nivel actual L5.'
    }
  }
];

export const INITIAL_DIVISION_BUDGETS: DivisionBudget[] = [
  {
    id: 'DIV_software_engineering',
    division: 'Software Engineering',
    raiseBudgetEur: 68500,
    updatedAt: '2026-11-16T09:00:00.000Z'
  },
  {
    id: 'DIV_architecture_tech_leadership',
    division: 'Architecture & Tech Leadership',
    raiseBudgetEur: 54000,
    updatedAt: '2026-11-16T09:00:00.000Z'
  },
  {
    id: 'DIV_project_product_management',
    division: 'Project & Product Management',
    raiseBudgetEur: 42000,
    updatedAt: '2026-11-16T09:00:00.000Z'
  },
  {
    id: 'DIV_consulting',
    division: 'Consulting',
    raiseBudgetEur: 38500,
    updatedAt: '2026-11-16T09:00:00.000Z'
  },
  {
    id: 'DIV_data_ai',
    division: 'Data & AI',
    raiseBudgetEur: 15000,
    updatedAt: '2026-11-16T12:00:00.000Z'
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
  private memDivisionBudgets: DivisionBudget[] = [...INITIAL_DIVISION_BUDGETS];

  constructor() {}

  async initialize() {
    if (!db) {
      console.log('[Firestore] No active database connection. Operating in memory-only mode.');
      return;
    }
    await testConnection();
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
        // Seed division budgets
        for (const item of INITIAL_DIVISION_BUDGETS) {
          await setDoc(doc(db, 'divisionBudgets', item.id), item);
        }
        await setDoc(doc(db, 'systemMeta', 'divisionBudgetsSeeded'), { seeded: true, seededAt: new Date().toISOString() });
        await setDoc(doc(db, 'systemMeta', 'dataAiDivisionSeeded'), { seeded: true, seededAt: new Date().toISOString() });
        console.log('[Firestore] Data seeding completed.');
      } else {
        console.log('[Firestore] Database is already seeded. Checking idempotent additions...');
        await this.ensureRecordExists('employees', 'E007', INITIAL_EMPLOYEES.find(e => e.employeeId === 'E007'));
        await this.ensureRecordExists('devPlans', 'DP003', INITIAL_DEVELOPMENT_PLANS.find(d => d.id === 'DP003'));
        for (const ckId of ['CK003', 'CK004', 'CK005', 'CK006']) {
          await this.ensureRecordExists('checkpoints', ckId, INITIAL_CHECKPOINTS.find(c => c.id === ckId));
        }
        await this.ensureRecordExists('annualEvaluations', 'EV003', INITIAL_ANNUAL_EVALUATIONS.find(ev => ev.evaluationId === 'EV003'));

        // Ensure every seeded employee has their assigned division in Firestore
        for (const emp of INITIAL_EMPLOYEES) {
          if (emp.division) {
            const empRef = doc(db, 'employees', emp.employeeId);
            const empSnap = await getDoc(empRef);
            if (empSnap.exists() && !empSnap.data()?.division) {
              await updateDoc(empRef, { division: emp.division });
            }
          }
        }

        // Seed 4 initial division budgets once if not yet seeded
        const seedMetaRef = doc(db, 'systemMeta', 'divisionBudgetsSeeded');
        const seedMetaSnap = await getDoc(seedMetaRef);
        if (!seedMetaSnap.exists()) {
          const existingDivSnap = await getDocs(query(collection(db, 'divisionBudgets'), limit(1)));
          if (existingDivSnap.empty) {
            for (const item of INITIAL_DIVISION_BUDGETS) {
              await setDoc(doc(db, 'divisionBudgets', item.id), item);
            }
          }
          await setDoc(seedMetaRef, { seeded: true, seededAt: new Date().toISOString() });
        }

        // Idempotent seed for new Data & AI division (15,000 EUR) + 5 employees + checkpoints + closed evaluations
        const dataAiMetaRef = doc(db, 'systemMeta', 'dataAiDivisionSeeded');
        const dataAiMetaSnap = await getDoc(dataAiMetaRef);
        if (!dataAiMetaSnap.exists()) {
          for (const empId of ['E008', 'E009', 'E010', 'E011', 'E012']) {
            await this.ensureRecordExists('employees', empId, INITIAL_EMPLOYEES.find(e => e.employeeId === empId));
          }
          for (const ckId of ['CK007', 'CK008', 'CK009', 'CK010', 'CK011', 'CK012', 'CK013', 'CK014', 'CK015', 'CK016']) {
            await this.ensureRecordExists('checkpoints', ckId, INITIAL_CHECKPOINTS.find(c => c.id === ckId));
          }
          for (const dpId of ['DP004', 'DP005', 'DP006']) {
            await this.ensureRecordExists('devPlans', dpId, INITIAL_DEVELOPMENT_PLANS.find(d => d.id === dpId));
          }
          for (const evId of ['EV004', 'EV005', 'EV006', 'EV007', 'EV008']) {
            await this.ensureRecordExists('annualEvaluations', evId, INITIAL_ANNUAL_EVALUATIONS.find(ev => ev.evaluationId === evId));
          }
          await this.ensureRecordExists(
            'divisionBudgets',
            'DIV_data_ai',
            INITIAL_DIVISION_BUDGETS.find(b => b.id === 'DIV_data_ai')
          );
          await setDoc(dataAiMetaRef, { seeded: true, seededAt: new Date().toISOString() });
        }
      }
    } catch (err) {
      console.error('[Firestore] Failed to seed database:', err);
    }
  }

  private async ensureRecordExists(collectionName: string, docId: string, data: any) {
    if (!db || !data) return;
    try {
      const ref = doc(db, collectionName, docId);
      const snap = await getDoc(ref);
      if (!snap.exists()) {
        await setDoc(ref, data);
        console.log(`[Firestore] Seeded missing record ${collectionName}/${docId}`);
      }
    } catch (err) {
      console.error(`[Firestore] Error checking/seeding ${collectionName}/${docId}:`, err);
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
      handleFirestoreError(err, OperationType.LIST, collectionName);
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

  async getDivisionBudgets(): Promise<DivisionBudget[]> {
    const list = await this.getAllDocs<DivisionBudget>('divisionBudgets', this.memDivisionBudgets);
    return [...list].sort((a, b) => a.division.localeCompare(b.division, 'es'));
  }

  async replaceDivisionBudgets(items: DivisionBudget[]): Promise<DivisionBudget[]> {
    this.memDivisionBudgets = [...items];
    if (!db) {
      return this.getDivisionBudgets();
    }
    try {
      const existingSnap = await getDocs(collection(db, 'divisionBudgets'));
      const incomingIds = new Set(items.map(i => i.id));
      for (const docSnap of existingSnap.docs) {
        if (!incomingIds.has(docSnap.id)) {
          await deleteDoc(doc(db, 'divisionBudgets', docSnap.id));
        }
      }
      for (const item of items) {
        await setDoc(doc(db, 'divisionBudgets', item.id), item);
      }
      return this.getDivisionBudgets();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'divisionBudgets');
    }
  }

  async clearDivisionBudgets(): Promise<void> {
    this.memDivisionBudgets = [];
    if (!db) return;
    try {
      const existingSnap = await getDocs(collection(db, 'divisionBudgets'));
      for (const docSnap of existingSnap.docs) {
        await deleteDoc(doc(db, 'divisionBudgets', docSnap.id));
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'divisionBudgets');
    }
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
      handleFirestoreError(err, OperationType.GET, `employees/${id}`);
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
      handleFirestoreError(err, OperationType.UPDATE, `employees/${id}`);
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
      handleFirestoreError(err, OperationType.CREATE, `employees/${emp.employeeId}`);
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
      handleFirestoreError(err, OperationType.GET, `projects/${id}`);
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
      handleFirestoreError(err, OperationType.CREATE, `projects/${prj.projectId}`);
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
      handleFirestoreError(err, OperationType.CREATE, `roleRequests/${req.id}`);
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
      handleFirestoreError(err, OperationType.CREATE, `assignments/${asg.assignmentId}`);
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
      handleFirestoreError(err, OperationType.CREATE, `checkpoints/${chk.id}`);
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
      handleFirestoreError(err, OperationType.UPDATE, `checkpoints/${id}`);
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
      handleFirestoreError(err, OperationType.UPDATE, `annualEvaluations/${id}`);
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
      handleFirestoreError(err, OperationType.CREATE, `annualEvaluations/${val.evaluationId}`);
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
      ...(action.trainingId ? { trainingId: action.trainingId } : {})
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
        try {
          await setDoc(doc(db, 'devPlans', newPlan.id), newPlan);
        } catch (err) {
          handleFirestoreError(err, OperationType.CREATE, `devPlans/${newPlan.id}`);
        }
      }
      return newPlan;
    } else {
      const updatedActions = [...(plan.actions || []), newAction];
      if (!db) {
        plan.actions = updatedActions;
      } else {
        try {
          await updateDoc(doc(db, 'devPlans', plan.id), { actions: updatedActions });
          const docSnap = await getDoc(doc(db, 'devPlans', plan.id));
          plan = docSnap.data() as DevelopmentPlan;
        } catch (err) {
          handleFirestoreError(err, OperationType.UPDATE, `devPlans/${plan.id}`);
        }
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

