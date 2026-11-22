import { AnnualEvaluation, DivisionBudget, Employee, getDefaultSalaryForLevel } from '../types';

export const SALARY_RAISE_STEP_EUR = 50;
export const MIN_SALARY_RAISE_EUR = 500;
export const MIN_RAISE_UNITS = MIN_SALARY_RAISE_EUR / SALARY_RAISE_STEP_EUR;

export const HIGH_POTENTIAL_WEIGHT_MULTIPLIER = 1.2;
export const REFERENCE_SALARY_EUR = 35000;
export const SALARY_WEIGHT_EXPONENT = 0.25;

export interface SalaryRaiseAllocationItem {
  employee: Employee;
  evaluation: AnnualEvaluation;
  finalScore: number;
  evaluationResult: AnnualEvaluation['evaluationResult'];
  isPromoted: boolean;
  isHighPotential: boolean;
  isKeyPerson: boolean;
  weight: number;
  sharePercent: number;
  recommendedRaiseEur: number;
  salaryRaisePercent: number;
  rationale: string;
}

export interface PendingDivisionEmployee {
  employeeId: string;
  fullName: string;
  statusLabel: string;
}

export interface DivisionSalaryRecommendation {
  division: string;
  budgetEur: number | null;
  totalEmployees: number;
  closedCount: number;
  pendingEmployees: PendingDivisionEmployee[];
  isDivisionClosed: boolean;
  canRecommend: boolean;
  totalAllocatedEur: number;
  unallocatedRemainderEur: number;
  promotedCount: number;
  highPotentialCount: number;
  keyPersonCount: number;
  items: SalaryRaiseAllocationItem[];
}

export const getEmployeeDivision = (emp: Pick<Employee, 'division' | 'department'>): string =>
  (emp.division || emp.department || 'Sin asignar').trim();

export const formatWholeEur = (amount: number): string =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(Math.round(amount));

export const formatEvalResultLabel = (res: AnnualEvaluation['evaluationResult']): string => {
  switch (res) {
    case 'Promoted':
      return 'Promocionado';
    case 'Outstanding':
      return 'Sobresaliente';
    case 'ExceedsExpectations':
      return 'Supera Expectativas';
    case 'MeetsExpectations':
      return 'Cumple Expectativas';
    case 'Unsatisfactory':
      return 'Por Debajo';
    default:
      return res;
  }
};

const normalizeDivisionKey = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();

const getResultMultiplier = (result: AnnualEvaluation['evaluationResult']): number => {
  switch (result) {
    case 'Promoted':
      return 1.3;
    case 'Outstanding':
      return 1.25;
    case 'ExceedsExpectations':
      return 1.1;
    case 'MeetsExpectations':
      return 1.0;
    case 'Unsatisfactory':
      return 0.6;
    default:
      return 1.0;
  }
};

export const getEffectiveEmployeeSalary = (emp: Pick<Employee, 'salaryEur' | 'currentLevelId'>): number => {
  if (typeof emp.salaryEur === 'number' && Number.isFinite(emp.salaryEur) && emp.salaryEur > 0) {
    return emp.salaryEur;
  }
  return getDefaultSalaryForLevel(emp.currentLevelId);
};

export const getSalaryWeightFactor = (salaryEur: number): number => {
  const ratio = Math.min(2.5, Math.max(0.5, salaryEur / REFERENCE_SALARY_EUR));
  return Math.pow(ratio, SALARY_WEIGHT_EXPONENT);
};

export function computeDivisionSalaryRecommendationByName(
  divisionName: string,
  allEmployees: Employee[],
  allEvaluations: AnnualEvaluation[],
  divisionBudgets: DivisionBudget[],
  activeEvaluation?: AnnualEvaluation | null
): DivisionSalaryRecommendation {
  const division = divisionName.trim() || 'Sin asignar';
  const divisionKey = normalizeDivisionKey(division);

  const divisionEmployees = allEmployees
    .filter(emp => normalizeDivisionKey(getEmployeeDivision(emp)) === divisionKey)
    .sort((a, b) => a.employeeId.localeCompare(b.employeeId));

  const matchedBudget = divisionBudgets.find(
    b => normalizeDivisionKey(b.division) === divisionKey
  );
  const budgetEur = matchedBudget ? Number(matchedBudget.raiseBudgetEur) : null;

  const evalByEmployee = new Map<string, AnnualEvaluation>();
  for (const emp of divisionEmployees) {
    if (activeEvaluation && activeEvaluation.employeeId === emp.employeeId) {
      evalByEmployee.set(emp.employeeId, activeEvaluation);
      continue;
    }
    const empEvals = allEvaluations
      .filter(ev => ev.employeeId === emp.employeeId)
      .sort((a, b) => b.year - a.year);
    if (empEvals.length > 0) {
      evalByEmployee.set(emp.employeeId, empEvals[0]);
    }
  }

  const pendingEmployees: PendingDivisionEmployee[] = [];
  let closedCount = 0;

  for (const emp of divisionEmployees) {
    const ev = evalByEmployee.get(emp.employeeId);
    if (!ev) {
      pendingEmployees.push({
        employeeId: emp.employeeId,
        fullName: `${emp.name} ${emp.surname}`,
        statusLabel: 'Sin evaluación iniciada'
      });
    } else if (ev.status !== 'Closed') {
      pendingEmployees.push({
        employeeId: emp.employeeId,
        fullName: `${emp.name} ${emp.surname}`,
        statusLabel: `En fase ${ev.status}`
      });
    } else {
      closedCount += 1;
    }
  }

  const totalEmployees = divisionEmployees.length;
  const isDivisionClosed = totalEmployees > 0 && pendingEmployees.length === 0;

  if (!isDivisionClosed || budgetEur === null || budgetEur < MIN_SALARY_RAISE_EUR) {
    return {
      division,
      budgetEur,
      totalEmployees,
      closedCount,
      pendingEmployees,
      isDivisionClosed,
      canRecommend: false,
      totalAllocatedEur: 0,
      unallocatedRemainderEur: budgetEur !== null ? Number(budgetEur.toFixed(2)) : 0,
      promotedCount: 0,
      highPotentialCount: 0,
      keyPersonCount: 0,
      items: []
    };
  }

  // Compute weights factoring in final score, result tier, promotion, High Potential / Key person, and mild salary scale
  const scoredRows = divisionEmployees.map(emp => {
    const ev = evalByEmployee.get(emp.employeeId)!;
    const score = Number(ev.finalScore) || 0;
    const effectiveSalary = getEffectiveEmployeeSalary(emp);
    const salaryFactor = getSalaryWeightFactor(effectiveSalary);
    const isPromoted =
      Boolean(ev.promotionRecommendation?.ready) || ev.evaluationResult === 'Promoted';
    const isHighPotential =
      Array.isArray(emp.recognitions) && emp.recognitions.includes('high_potential');
    const isKeyPerson =
      Array.isArray(emp.recognitions) && emp.recognitions.includes('key_person');
    const hasPriorityRecognition = isHighPotential || isKeyPerson;
    const minUnits = isPromoted || hasPriorityRecognition ? 1 : 0;

    let weight = 0;
    let rationale = '';

    if (score < 3.0 && !isPromoted && !hasPriorityRecognition) {
      weight = 0;
      rationale = 'Nota < 3,0 sin promoción, Alto Potencial ni Key person';
    } else {
      const scoreComponent = Math.max(0.5, score - 2.2);
      const resultMult = getResultMultiplier(ev.evaluationResult);
      if (isPromoted) {
        weight = (scoreComponent * resultMult + 1.8) * 1.35;
      } else {
        weight = scoreComponent * resultMult;
      }

      if (hasPriorityRecognition) {
        weight *= HIGH_POTENTIAL_WEIGHT_MULTIPLIER;
      }

      weight *= salaryFactor;

      const recognitionLabels = [
        isHighPotential ? 'Alto Potencial' : null,
        isKeyPerson ? 'Key person' : null
      ]
        .filter(Boolean)
        .join(' + ');

      if (isPromoted && recognitionLabels) {
        rationale = `Promoción + ${recognitionLabels} (subida mínima garantizada)`;
      } else if (isPromoted) {
        rationale = 'Promoción (subida obligatoria) + desempeño';
      } else if (recognitionLabels) {
        rationale = `${recognitionLabels} (subida mínima garantizada) + desempeño`;
      } else {
        rationale =
          ev.evaluationResult === 'Outstanding'
            ? 'Desempeño sobresaliente'
            : ev.evaluationResult === 'ExceedsExpectations'
              ? 'Supera expectativas'
              : 'Cumple expectativas';
      }
    }

    return {
      employee: emp,
      evaluation: ev,
      finalScore: score,
      effectiveSalary,
      evaluationResult: ev.evaluationResult,
      isPromoted,
      isHighPotential,
      isKeyPerson,
      hasPriorityRecognition,
      minUnits,
      weight,
      rationale
    };
  });

  const promotedCount = scoredRows.filter(r => r.isPromoted).length;
  const highPotentialCount = scoredRows.filter(r => r.isHighPotential).length;
  const keyPersonCount = scoredRows.filter(r => r.isKeyPerson).length;
  let totalWeight = scoredRows.reduce((sum, r) => sum + r.weight, 0);

  // Fallback if all employees scored < 3.0 without promotion/high potential while budget >= 500 EUR
  if (totalWeight <= 0 && budgetEur >= MIN_SALARY_RAISE_EUR) {
    scoredRows.forEach(r => {
      r.weight = Math.max(0.5, r.finalScore) * getSalaryWeightFactor(r.effectiveSalary);
      r.rationale = 'Reparto proporcional base';
    });
    totalWeight = scoredRows.reduce((sum, r) => sum + r.weight, 0);
  }

  // Discretize into minimum 50 EUR increments with a mandatory 500 EUR minimum raise per recipient
  const totalUnits = Math.floor(budgetEur / SALARY_RAISE_STEP_EUR);
  const unitsList = Array<number>(scoredRows.length).fill(0);
  const rawUnits = Array<number>(scoredRows.length).fill(0);

  const eligibleIndices = scoredRows
    .map((r, idx) => ({ idx, r }))
    .filter(x => x.r.weight > 0)
    .sort(
      (a, b) =>
        Number(b.r.isPromoted) - Number(a.r.isPromoted) ||
        Number(b.r.hasPriorityRecognition) - Number(a.r.hasPriorityRecognition) ||
        b.r.weight - a.r.weight ||
        b.r.finalScore - a.r.finalScore
    );

  const maxRecipients = Math.floor(totalUnits / MIN_RAISE_UNITS);
  const fundedIndices = eligibleIndices.slice(0, maxRecipients).map(x => x.idx);

  if (eligibleIndices.length > maxRecipients) {
    for (const excluded of eligibleIndices.slice(maxRecipients)) {
      scoredRows[excluded.idx].rationale = `Presupuesto insuficiente para subida mínima de ${MIN_SALARY_RAISE_EUR} €`;
    }
  }

  if (fundedIndices.length > 0 && totalUnits >= MIN_RAISE_UNITS) {
    const unlocked = new Set<number>(fundedIndices);
    let remainingUnits = totalUnits;

    // Iterative floor locking: guarantee >= 500 EUR (10 x 50 EUR) for every funded employee
    while (unlocked.size > 0) {
      let unlockedWeight = 0;
      for (const idx of unlocked) {
        unlockedWeight += scoredRows[idx].weight;
      }

      const toLock: number[] = [];
      for (const idx of unlocked) {
        const share =
          unlockedWeight > 0
            ? (scoredRows[idx].weight / unlockedWeight) * remainingUnits
            : remainingUnits / unlocked.size;
        rawUnits[idx] = share;
        if (share < MIN_RAISE_UNITS) {
          toLock.push(idx);
        }
      }

      if (toLock.length === 0) {
        break;
      }

      for (const idx of toLock) {
        unitsList[idx] = MIN_RAISE_UNITS;
        unlocked.delete(idx);
        remainingUnits -= MIN_RAISE_UNITS;
      }
    }

    if (unlocked.size > 0) {
      let allocatedUnlocked = 0;
      for (const idx of unlocked) {
        const floorVal = Math.max(MIN_RAISE_UNITS, Math.floor(rawUnits[idx]));
        unitsList[idx] = floorVal;
        allocatedUnlocked += floorVal;
      }

      let remainderUnits = remainingUnits - allocatedUnlocked;
      if (remainderUnits > 0) {
        const orderedByRemainder = Array.from(unlocked)
          .map(idx => ({
            idx,
            rem: rawUnits[idx] - Math.floor(rawUnits[idx]),
            weight: scoredRows[idx].weight,
            score: scoredRows[idx].finalScore
          }))
          .sort((a, b) => b.rem - a.rem || b.weight - a.weight || b.score - a.score);

        let cursor = 0;
        while (remainderUnits > 0 && orderedByRemainder.length > 0) {
          const targetIdx = orderedByRemainder[cursor % orderedByRemainder.length].idx;
          unitsList[targetIdx] += 1;
          remainderUnits -= 1;
          cursor += 1;
        }
      }
    } else if (remainingUnits > 0) {
      const orderedFunded = [...fundedIndices].sort(
        (a, b) =>
          scoredRows[b].weight - scoredRows[a].weight ||
          scoredRows[b].finalScore - scoredRows[a].finalScore
      );
      let cursor = 0;
      while (remainingUnits > 0 && orderedFunded.length > 0) {
        unitsList[orderedFunded[cursor % orderedFunded.length]] += 1;
        remainingUnits -= 1;
        cursor += 1;
      }
    }
  }

  const allocatedUnits = unitsList.reduce((sum, u) => sum + u, 0);
  const totalAllocatedEur = allocatedUnits * SALARY_RAISE_STEP_EUR;
  const unallocatedRemainderEur = Number((budgetEur - totalAllocatedEur).toFixed(2));

  const items: SalaryRaiseAllocationItem[] = scoredRows
    .map((row, idx) => {
      const raiseEur = unitsList[idx] * SALARY_RAISE_STEP_EUR;
      const shareBase = totalAllocatedEur > 0 ? totalAllocatedEur : budgetEur;
      const sharePercent = shareBase > 0 ? Number(((raiseEur / shareBase) * 100).toFixed(1)) : 0;
      const salaryRaisePercent =
        row.effectiveSalary > 0 ? Number(((raiseEur / row.effectiveSalary) * 100).toFixed(1)) : 0;
      return {
        employee: row.employee,
        evaluation: row.evaluation,
        finalScore: row.finalScore,
        evaluationResult: row.evaluationResult,
        isPromoted: row.isPromoted,
        isHighPotential: row.isHighPotential,
        isKeyPerson: row.isKeyPerson,
        weight: row.weight,
        sharePercent,
        recommendedRaiseEur: raiseEur,
        salaryRaisePercent,
        rationale: row.rationale
      };
    })
    .sort((a, b) => b.recommendedRaiseEur - a.recommendedRaiseEur || b.finalScore - a.finalScore);

  return {
    division,
    budgetEur,
    totalEmployees,
    closedCount,
    pendingEmployees,
    isDivisionClosed,
    canRecommend: totalAllocatedEur > 0,
    totalAllocatedEur,
    unallocatedRemainderEur,
    promotedCount,
    highPotentialCount,
    keyPersonCount,
    items
  };
}

export function computeDivisionSalaryRecommendation(
  targetEmployee: Employee,
  allEmployees: Employee[],
  allEvaluations: AnnualEvaluation[],
  divisionBudgets: DivisionBudget[],
  activeEvaluation?: AnnualEvaluation | null
): DivisionSalaryRecommendation {
  return computeDivisionSalaryRecommendationByName(
    getEmployeeDivision(targetEmployee),
    allEmployees,
    allEvaluations,
    divisionBudgets,
    activeEvaluation
  );
}
