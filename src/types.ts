/**
 * Unified Data Model Types for CRH Management
 */

export interface CareerFamily {
  id: string;
  code: string;
  name: string;
  description: string;
  active: boolean;
}

export interface CareerPath {
  id: string;
  careerFamilyId: string;
  code: string;
  name: string;
  description: string;
  finality?: string; // Finalidad (sección 3.4.2)
  toEvaluate?: string; // Evaluar (sección 3.4.2)
}

export interface CareerLevel {
  id: string;
  levelCode: string;
  levelNumber: number;
  name: string;
  experienceFrom: number; // in years
  experienceTo: number; // in years
  mission?: string; // Misión (sección 3.4.3)
  evaluationIndicators?: string; // Indicadores de evaluación (sección 3.4.3)
}

export type CompetencyType = 'Behavioral' | 'Technical' | 'Functional' | 'Leadership' | 'Business';

export interface Competency {
  id: string;
  code: string;
  name: string;
  type: CompetencyType;
  description: string;
  stages?: {
    A: string[];
    B: string[];
    C: string[];
    D: string[];
    E: string[];
  };
}

export type CompetencyStage = 'A' | 'B' | 'C' | 'D' | 'E';

export interface LevelExpectedCompetency {
  id: string;
  careerPathId: string;
  careerLevelId: string;
  competencyId: string;
  expectedStage: CompetencyStage;
  weight: number;
  mandatory: boolean;
}

export interface EmployeeSkill {
  skillId: string;
  name: string;
  category: string;
  level: number; // 1 to 5
  validatedDate: string;
  source: string; // e.g., 'Project', 'Self', 'Training'
}

export interface EmployeeCertification {
  id: string;
  certificationName: string;
  provider: string;
  issueDate: string;
  expiryDate: string;
}

export interface Employee {
  employeeId: string;
  name: string;
  surname: string;
  email: string;
  country: string;
  office: string;
  department: string;
  managerId: string; // supervisor
  careerManagerId: string; // career advisor
  currentCareerPathId: string;
  currentLevelId: string;
  hireDate: string;
  status: 'Active' | 'OnLeave' | 'Terminated';
  availabilityPercent: number; // 0 to 100
  skills: EmployeeSkill[];
  certifications: EmployeeCertification[];
  projectHistory: { projectId: string; role: string; performance: number }[];
}

export interface Project {
  projectId: string;
  clientName: string;
  projectName: string;
  businessUnit: string;
  status: 'InPreparation' | 'Active' | 'OnHold' | 'Completed';
  startDate: string;
  endDate: string;
  budget: number;
  technologies: string[];
}

export interface ProjectRoleRequest {
  id: string;
  projectId: string;
  careerPathId: string;
  requiredLevelId: string;
  requiredSkills: string[]; // skill names
  startDate: string;
  allocation: number; // expected % dedication
  priority: 'High' | 'Medium' | 'Low';
}

export interface ProjectAssignment {
  assignmentId: string;
  employeeId: string;
  projectId: string;
  role: string;
  allocationPercent: number;
  startDate: string;
  endDate: string;
}

export interface MatchingResult {
  id: string;
  employeeId: string;
  projectRoleRequestId: string;
  skillScore: number; // 0-100
  levelScore: number; // 0-100
  availabilityScore: number; // 0-100
  performanceScore: number; // 0-100
  globalScore: number; // 0-100
}

export interface TrainingCatalog {
  trainingId: string;
  name: string;
  provider: string;
  durationHours: number;
  level: string; // e.g. 'Beginner', 'Intermediate', 'Advanced'
  cost: number;
  coveredCompetencies: string[]; // competency codes
}

export interface CompetencyGap {
  id: string;
  employeeId: string;
  competencyId: string;
  currentStage: CompetencyStage;
  expectedStage: CompetencyStage;
  gap: number; // expected - current representation
  priority: 'High' | 'Medium' | 'Low';
}

export interface DevelopmentPlan {
  id: string;
  employeeId: string;
  year: number;
  status: 'Draft' | 'Active' | 'Completed';
  actions: DevelopmentAction[];
}

export interface DevelopmentAction {
  id: string;
  type: 'Training' | 'Mentoring' | 'Certification' | 'ProjectAssignment' | 'Coaching' | 'Community';
  description: string;
  targetDate: string;
  status: 'Pending' | 'InProgress' | 'Completed' | 'Cancelled';
  trainingId?: string; // link to catalog if applicable
}

export type CheckpointReviewType = 'Monthly' | 'Quarterly' | 'MidProject' | 'EndProject';

export interface ProjectPerformanceKPI {
  id: string;
  kpi: 'Quality' | 'Delivery' | 'Productivity' | 'Customer Satisfaction' | 'Innovation' | 'Leadership';
  weight: number;
  targetValue: number;
  currentValue: number;
}

export interface CheckpointReview {
  id: string;
  employeeId: string;
  projectId: string;
  reviewerId: string;
  reviewDate: string;
  reviewType: CheckpointReviewType;
  comments: string;
  scores: { competencyId: string; score: number; stage?: CompetencyStage; comments: string }[]; // score 1-5
  kpis: ProjectPerformanceKPI[];
}

export interface FeedbackResponse {
  id: string;
  competencyId: string;
  score: number; // 1-5
  comment: string;
}

export interface FeedbackParticipant {
  id: string;
  reviewerId: string;
  reviewerName: string;
  reviewerType: 'Manager' | 'ProjectManager' | 'Peer' | 'Self' | 'CareerManager';
  responses: FeedbackResponse[];
}

export interface FeedbackCycle {
  id: string;
  employeeId: string;
  year: number;
  status: 'Pending' | 'InProgress' | 'Collected';
  participants: FeedbackParticipant[];
}

export interface AnnualEvaluationDimension {
  id: string;
  dimension: 'Competencies' | 'ProjectPerformance' | 'Training' | 'Feedback360' | 'CorporateContribution';
  weight: number; // formula percentage
  score: number; // 1-5
}

export interface AnnualEvaluationCompetency {
  id: string;
  competencyId: string;
  expectedStage: CompetencyStage;
  actualStage: CompetencyStage;
  score: number; // 1-5
  gap: number; // quantitative gap
}

export interface AnnualEvaluation {
  evaluationId: string;
  employeeId: string;
  year: number;
  currentLevelId: string;
  targetLevelId: string;
  status: 'Draft' | 'ManagerReview' | 'Calibration' | 'HRReview' | 'Approved' | 'Closed';
  finalScore: number; // 1-5 based on weighted dimension formulas
  evaluationResult: 'Unsatisfactory' | 'MeetsExpectations' | 'ExceedsExpectations' | 'Outstanding' | 'Promoted';
  dimensions: AnnualEvaluationDimension[];
  competencies: AnnualEvaluationCompetency[];
  commentsManager: string;
  commentsHR: string;
  promotionRecommendation: {
    ready: boolean;
    reason: string;
  };
}

export interface PromotionCriteria {
  id: string;
  careerPathId: string;
  targetLevelId: string;
  requirement: string;
  weight: number;
  mandatory: boolean;
}

export interface PromotionReadiness {
  id: string;
  employeeId: string;
  currentLevelId: string;
  targetLevelId: string;
  readinessScore: number; // 0-100
  readyForPromotion: boolean;
  generatedDate: string;
}

// Interactive chat interfaces
export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export type UserRole = 'RRHH' | 'ProjectManager' | 'Colaborador';

/**
 * Helper to get expected competency stage based on career path and level
 */
export const getRequiredStage = (careerPathId: string, levelId: string, competencyId: string): CompetencyStage => {
  // L1 = Technician (Nivel 1')
  // L2 = Engineer (Nivel 1)
  // L3 = Senior Engineer (Nivel 2)
  // L4 = Manager (Nivel 3)
  // L5 = Senior Manager (Nivel 4)
  // L6 = Director (Nivel 5)
  // L7 = Senior Director (Nivel 6)

  // Fallbacks for lower levels:
  if (levelId === 'L1') return 'A';
  if (levelId === 'L2') return 'A'; // Stage a: levels 1' to 2

  const levelNum = parseInt(levelId.replace('L', '')) || 3;
  const comp = competencyId.toUpperCase();

  const isPM = careerPathId === 'P_MGT' || careerPathId === 'P_MGT_RD';
  const isBA = careerPathId === 'P_CON';
  const isCA = careerPathId === 'P_CON_CA';
  const isPE = careerPathId === 'P_CON_PE';
  const isARC = careerPathId === 'P_ARC';
  const isSWE = careerPathId === 'P_SWE';
  const isTS = careerPathId === 'P_SWE_TS';
  const isPR = careerPathId === 'P_CON_PR';
  const isSP = careerPathId === 'P_CON_SP';
  const isPD = careerPathId === 'P_MGT_PD';
  const isMK = careerPathId === 'P_CON_MK';

  if (isPM) {
    if (careerPathId === 'P_MGT_RD') { // I+D Project Management
      if (levelNum === 3) {
        if (comp === 'CLIENT_ORIENTATION' || comp === 'PROFESSIONAL_OPENNESS') return 'A';
        return 'B';
      }
      if (levelNum === 4) {
        if (comp === 'CLIENT_ORIENTATION' || comp === 'PROFESSIONAL_OPENNESS') return 'B';
        return 'C';
      }
      if (levelNum === 5) {
        if (comp === 'CLIENT_ORIENTATION' || comp === 'PROFESSIONAL_OPENNESS') return 'C';
        return 'D';
      }
      if (levelNum >= 6) {
        if (comp === 'CLIENT_ORIENTATION' || comp === 'PROFESSIONAL_OPENNESS') return 'D';
        return 'E';
      }
    } else { // Project Management
      if (levelNum === 3) {
        if (comp === 'INNOVATION' || comp === 'PROFESSIONAL_OPENNESS') return 'A';
        return 'B';
      }
      if (levelNum === 4) {
        if (comp === 'HUMAN_RELATIONS' || comp === 'TEAM_LEADERSHIP' || comp === 'ORGANIZATION_RESULTS') return 'C';
        return 'B';
      }
      if (levelNum === 5) {
        if (comp === 'HUMAN_RELATIONS' || comp === 'TEAM_LEADERSHIP' || comp === 'ORGANIZATION_RESULTS') return 'D';
        return 'C';
      }
      if (levelNum >= 6) {
        if (comp === 'HUMAN_RELATIONS' || comp === 'TEAM_LEADERSHIP' || comp === 'ORGANIZATION_RESULTS') return 'E';
        return 'D';
      }
    }
  }

  if (isBA) {
    if (levelNum === 3) {
      if (comp === 'TEAM_LEADERSHIP' || comp === 'PROFESSIONAL_OPENNESS') return 'A';
      return 'B';
    }
    if (levelNum === 4) {
      if (comp === 'CLIENT_ORIENTATION' || comp === 'INNOVATION' || comp === 'HUMAN_RELATIONS') return 'C';
      return 'B';
    }
    if (levelNum === 5) {
      if (comp === 'CLIENT_ORIENTATION' || comp === 'INNOVATION' || comp === 'HUMAN_RELATIONS') return 'D';
      return 'C';
    }
    if (levelNum >= 6) {
      if (comp === 'CLIENT_ORIENTATION' || comp === 'INNOVATION' || comp === 'HUMAN_RELATIONS') return 'E';
      return 'D';
    }
  }

  if (isCA) {
    if (levelNum === 3) return 'B';
    if (levelNum === 4) return 'C';
    if (levelNum === 5) {
      if (comp === 'PROFESSIONAL_OPENNESS') return 'C';
      return 'D';
    }
    if (levelNum >= 6) return 'E';
  }

  if (isPE) {
    if (levelNum === 3) {
      if (comp === 'TEAM_LEADERSHIP' || comp === 'PROFESSIONAL_OPENNESS') return 'A';
      return 'B';
    }
    if (levelNum === 4) {
      if (comp === 'CLIENT_ORIENTATION' || comp === 'INNOVATION' || comp === 'HUMAN_RELATIONS') return 'C';
      return 'B';
    }
    if (levelNum === 5) {
      if (comp === 'CLIENT_ORIENTATION' || comp === 'INNOVATION' || comp === 'HUMAN_RELATIONS') return 'D';
      return 'C';
    }
    if (levelNum >= 6) {
      if (comp === 'CLIENT_ORIENTATION' || comp === 'INNOVATION' || comp === 'HUMAN_RELATIONS') return 'E';
      return 'D';
    }
  }

  if (isARC) {
    if (levelNum === 3) {
      if (comp === 'HUMAN_RELATIONS' || comp === 'TEAM_LEADERSHIP') return 'A';
      return 'B';
    }
    if (levelNum === 4) {
      if (comp === 'CLIENT_ORIENTATION' || comp === 'INNOVATION' || comp === 'PROFESSIONAL_OPENNESS') return 'C';
      return 'B';
    }
    if (levelNum === 5) {
      if (comp === 'CLIENT_ORIENTATION' || comp === 'INNOVATION' || comp === 'PROFESSIONAL_OPENNESS') return 'D';
      return 'C';
    }
    if (levelNum >= 6) {
      if (comp === 'CLIENT_ORIENTATION' || comp === 'INNOVATION' || comp === 'PROFESSIONAL_OPENNESS') return 'E';
      return 'D';
    }
  }

  if (isSWE) {
    if (levelNum === 3) {
      if (comp === 'HUMAN_RELATIONS' || comp === 'TEAM_LEADERSHIP') return 'A';
      return 'B';
    }
    if (levelNum === 4) {
      if (comp === 'INNOVATION' || comp === 'ORGANIZATION_RESULTS' || comp === 'PROFESSIONAL_OPENNESS') return 'C';
      return 'B';
    }
    if (levelNum === 5) {
      if (comp === 'INNOVATION' || comp === 'ORGANIZATION_RESULTS' || comp === 'PROFESSIONAL_OPENNESS') return 'D';
      return 'C';
    }
    if (levelNum >= 6) {
      if (comp === 'INNOVATION' || comp === 'ORGANIZATION_RESULTS' || comp === 'PROFESSIONAL_OPENNESS') return 'E';
      return 'D';
    }
  }

  if (isTS) {
    if (levelNum === 3) {
      if (comp === 'CLIENT_ORIENTATION' || comp === 'HUMAN_RELATIONS') return 'A';
      return 'B';
    }
    if (levelNum === 4) {
      if (comp === 'INNOVATION' || comp === 'TEAM_LEADERSHIP' || comp === 'ORGANIZATION_RESULTS') return 'C';
      return 'B';
    }
    if (levelNum === 5) {
      if (comp === 'INNOVATION' || comp === 'TEAM_LEADERSHIP' || comp === 'ORGANIZATION_RESULTS') return 'D';
      return 'C';
    }
    if (levelNum >= 6) {
      if (comp === 'INNOVATION' || comp === 'TEAM_LEADERSHIP' || comp === 'ORGANIZATION_RESULTS') return 'E';
      return 'D';
    }
  }

  if (isPR || isSP) {
    if (levelNum === 3) {
      if (comp === 'INNOVATION' || comp === 'PROFESSIONAL_OPENNESS') return 'A';
      return 'B';
    }
    if (levelNum === 4) {
      if (comp === 'CLIENT_ORIENTATION' || comp === 'TEAM_LEADERSHIP' || comp === 'ORGANIZATION_RESULTS') return 'C';
      return 'B';
    }
    if (levelNum === 5) {
      if (comp === 'CLIENT_ORIENTATION' || comp === 'TEAM_LEADERSHIP' || comp === 'ORGANIZATION_RESULTS') return 'D';
      return 'C';
    }
    if (levelNum >= 6) {
      if (comp === 'CLIENT_ORIENTATION' || comp === 'TEAM_LEADERSHIP' || comp === 'ORGANIZATION_RESULTS') return 'E';
      return 'D';
    }
  }

  if (isPD) {
    if (levelNum === 3) {
      if (comp === 'TEAM_LEADERSHIP' || comp === 'PROFESSIONAL_OPENNESS') return 'A';
      return 'B';
    }
    if (levelNum === 4) {
      if (comp === 'CLIENT_ORIENTATION' || comp === 'INNOVATION' || comp === 'HUMAN_RELATIONS') return 'C';
      return 'B';
    }
    if (levelNum === 5) {
      if (comp === 'CLIENT_ORIENTATION' || comp === 'INNOVATION' || comp === 'HUMAN_RELATIONS') return 'D';
      return 'C';
    }
    if (levelNum >= 6) {
      if (comp === 'CLIENT_ORIENTATION' || comp === 'INNOVATION' || comp === 'HUMAN_RELATIONS') return 'E';
      return 'D';
    }
  }

  if (isMK) {
    if (levelNum === 3) {
      if (comp === 'TEAM_LEADERSHIP') return 'A';
      return 'B';
    }
    if (levelNum === 4) {
      if (comp === 'CLIENT_ORIENTATION' || comp === 'INNOVATION' || comp === 'HUMAN_RELATIONS' || comp === 'ORGANIZATION_RESULTS') return 'C';
      return 'B';
    }
    if (levelNum === 5) {
      if (comp === 'CLIENT_ORIENTATION' || comp === 'INNOVATION' || comp === 'HUMAN_RELATIONS' || comp === 'ORGANIZATION_RESULTS') return 'D';
      return 'C';
    }
    if (levelNum >= 6) {
      if (comp === 'CLIENT_ORIENTATION' || comp === 'INNOVATION' || comp === 'HUMAN_RELATIONS' || comp === 'ORGANIZATION_RESULTS') return 'E';
      return 'D';
    }
  }

  // General fallback by level
  if (levelNum <= 2) return 'A'; // Stage a for 1' and 2
  if (levelNum === 3) return 'B'; // Stage b for 3
  if (levelNum === 4) return 'C'; // Stage c for 4
  if (levelNum === 5) return 'D'; // Stage d for 5
  return 'E'; // Stage e for 6/7
};

export const scoreToStage = (score: number): CompetencyStage => {
  if (score >= 4.5) return 'E';
  if (score >= 3.8) return 'D';
  if (score >= 3.0) return 'C';
  if (score >= 2.0) return 'B';
  return 'A';
};

export const stageToScore = (stage: CompetencyStage): number => {
  switch (stage) {
    case 'A': return 2.0;
    case 'B': return 3.0;
    case 'C': return 3.8;
    case 'D': return 4.5;
    case 'E': return 5.0;
  }
};


