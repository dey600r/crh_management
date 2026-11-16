import { AnnualEvaluation, DivisionBudget, Employee } from '../types';

export const SALARY_RAISE_STEP_EUR = 50;

export interface SalaryRaiseAllocationItem {
  employee: Employee;
  evaluation: AnnualEvaluation;
  finalScore: number;
  evaluationResult: AnnualEvaluation['evaluationResult'];
  isPromoted: boolean;
  weight: number;
  sharePercent: number;
  recommendedRaiseEur: number;
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

  if (!isDivisionClosed || budgetEur === null || budgetEur < SALARY_RAISE_STEP_EUR) {
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
      items: []
    };
  }

  // Compute weights factoring in final score, result tier, and mandatory promotion raise rule
  const scoredRows = divisionEmployees.map(emp => {
    const ev = evalByEmployee.get(emp.employeeId)!;
    const score = Number(ev.finalScore) || 0;
    const isPromoted =
      Boolean(ev.promotionRecommendation?.ready) || ev.evaluationResult === 'Promoted';

    let weight = 0;
    let rationale = '';

    if (score < 3.0 && !isPromoted) {
      weight = 0;
      rationale = 'Nota < 3,0 sin promoción';
    } else {
      const scoreComponent = Math.max(0.5, score - 2.2);
      const resultMult = getResultMultiplier(ev.evaluationResult);
      if (isPromoted) {
        weight = (scoreComponent * resultMult + 1.8) * 1.35;
        rationale = 'Promoción (subida obligatoria) + desempeño';
      } else {
        weight = scoreComponent * resultMult;
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
      evaluationResult: ev.evaluationResult,
      isPromoted,
      weight,
      rationale
    };
  });

  const promotedCount = scoredRows.filter(r => r.isPromoted).length;
  let totalWeight = scoredRows.reduce((sum, r) => sum + r.weight, 0);

  // Fallback if all employees scored < 3.0 without promotion while budget >= 50 EUR
  if (totalWeight <= 0 && budgetEur >= SALARY_RAISE_STEP_EUR) {
    scoredRows.forEach(r => {
      r.weight = Math.max(0.5, r.finalScore);
      r.rationale = 'Reparto proporcional base';
    });
    totalWeight = scoredRows.reduce((sum, r) => sum + r.weight, 0);
  }

  // Discretize into minimum 50 EUR increments (no decimals)
  const totalUnits = Math.floor(budgetEur / SALARY_RAISE_STEP_EUR);
  const rawUnits = scoredRows.map(r =>
    totalWeight > 0 ? (r.weight / totalWeight) * totalUnits : 0
  );
  const unitsList = rawUnits.map(u => Math.floor(u));

  // Guarantee at least 1 unit (50 EUR) for every promoted employee when totalUnits allows
  if (promotedCount > 0 && totalUnits >= promotedCount) {
    let deficit = 0;
    for (let i = 0; i < scoredRows.length; i++) {
      if (scoredRows[i].isPromoted && unitsList[i] < 1) {
        deficit += 1 - unitsList[i];
        unitsList[i] = 1;
      }
    }
    if (deficit > 0) {
      const donors = scoredRows
        .map((r, idx) => ({
          idx,
          avail: unitsList[idx] - (r.isPromoted ? 1 : 0)
        }))
        .filter(d => d.avail > 0)
        .sort((a, b) => b.avail - a.avail);

      for (const donor of donors) {
        if (deficit <= 0) break;
        const take = Math.min(deficit, donor.avail);
        unitsList[donor.idx] -= take;
        deficit -= take;
      }
    }
  }

  // Distribute remaining 50 EUR units by largest fractional remainder (Hamilton method)
  let allocatedUnits = unitsList.reduce((sum, u) => sum + u, 0);
  let remainderUnits = totalUnits - allocatedUnits;

  if (remainderUnits > 0 && scoredRows.length > 0) {
    const orderedByRemainder = scoredRows
      .map((r, idx) => ({
        idx,
        rem: rawUnits[idx] - Math.floor(rawUnits[idx]),
        weight: r.weight,
        score: r.finalScore
      }))
      .filter(x => x.weight > 0 || totalWeight <= 0)
      .sort((a, b) => b.rem - a.rem || b.weight - a.weight || b.score - a.score);

    let cursor = 0;
    while (remainderUnits > 0 && orderedByRemainder.length > 0) {
      const targetIdx = orderedByRemainder[cursor % orderedByRemainder.length].idx;
      unitsList[targetIdx] += 1;
      remainderUnits -= 1;
      cursor += 1;
    }
  } else if (remainderUnits < 0 && scoredRows.length > 0) {
    // Safety guard in case allocatedUnits exceeded totalUnits
    const donors = scoredRows
      .map((r, idx) => ({
        idx,
        avail: unitsList[idx] - (r.isPromoted ? 1 : 0)
      }))
      .filter(d => d.avail > 0)
      .sort((a, b) => b.avail - a.avail);

    let excess = -remainderUnits;
    for (const donor of donors) {
      if (excess <= 0) break;
      const take = Math.min(excess, donor.avail);
      unitsList[donor.idx] -= take;
      excess -= take;
    }
  }

  allocatedUnits = unitsList.reduce((sum, u) => sum + u, 0);
  const totalAllocatedEur = allocatedUnits * SALARY_RAISE_STEP_EUR;
  const unallocatedRemainderEur = Number((budgetEur - totalAllocatedEur).toFixed(2));

  const items: SalaryRaiseAllocationItem[] = scoredRows
    .map((row, idx) => {
      const raiseEur = unitsList[idx] * SALARY_RAISE_STEP_EUR;
      const shareBase = totalAllocatedEur > 0 ? totalAllocatedEur : budgetEur;
      const sharePercent = shareBase > 0 ? Number(((raiseEur / shareBase) * 100).toFixed(1)) : 0;
      return {
        employee: row.employee,
        evaluation: row.evaluation,
        finalScore: row.finalScore,
        evaluationResult: row.evaluationResult,
        isPromoted: row.isPromoted,
        weight: row.weight,
        sharePercent,
        recommendedRaiseEur: raiseEur,
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
