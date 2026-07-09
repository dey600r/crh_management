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
}

export interface CareerLevel {
  id: string;
  levelCode: string;
  levelNumber: number;
  name: string;
  experienceFrom: number; // in years
  experienceTo: number; // in years
}

export type CompetencyType = 'Behavioral' | 'Technical' | 'Functional' | 'Leadership' | 'Business';

export interface Competency {
  id: string;
  code: string;
  name: string;
  type: CompetencyType;
  description: string;
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
  scores: { competencyId: string; score: number; comments: string }[]; // score 1-5
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

