import { CheckpointReview } from '../types';

export interface CompetencyScoreDrop {
  checkpointId: string;
  reviewDate: string;
  competencyId: string;
  previousScore: number;
  currentScore: number;
  delta: number;
  previousCheckpointId: string;
  previousReviewDate: string;
  recovered: boolean;
  recoveredCheckpointId?: string;
  recoveredReviewDate?: string;
  recoveredScore?: number;
}

export const sortCheckpointsChronological = (
  checkpoints: CheckpointReview[]
): CheckpointReview[] =>
  [...checkpoints].sort((a, b) => {
    const timeDiff = new Date(a.reviewDate).getTime() - new Date(b.reviewDate).getTime();
    if (timeDiff !== 0) return timeDiff;
    return a.id.localeCompare(b.id);
  });

export const sortCheckpointsNewestFirst = (
  checkpoints: CheckpointReview[]
): CheckpointReview[] => [...sortCheckpointsChronological(checkpoints)].reverse();

export const computeCompetencyScoreDrops = (
  checkpoints: CheckpointReview[]
): CompetencyScoreDrop[] => {
  const chronological = sortCheckpointsChronological(checkpoints);
  const lastByComp = new Map<
    string,
    { score: number; checkpointId: string; reviewDate: string }
  >();
  const dropsWithIndex: { drop: CompetencyScoreDrop; cpIdx: number }[] = [];

  for (let cpIdx = 0; cpIdx < chronological.length; cpIdx++) {
    const cp = chronological[cpIdx];
    for (const item of cp.scores || []) {
      const prev = lastByComp.get(item.competencyId);
      if (prev) {
        const delta = Number((item.score - prev.score).toFixed(2));
        if (delta < 0) {
          dropsWithIndex.push({
            cpIdx,
            drop: {
              checkpointId: cp.id,
              reviewDate: cp.reviewDate,
              competencyId: item.competencyId,
              previousScore: prev.score,
              currentScore: item.score,
              delta,
              previousCheckpointId: prev.checkpointId,
              previousReviewDate: prev.reviewDate,
              recovered: false
            }
          });
        }
      }
      lastByComp.set(item.competencyId, {
        score: item.score,
        checkpointId: cp.id,
        reviewDate: cp.reviewDate
      });
    }
  }

  // Mark drops as recovered when a subsequent checkpoint reaches >= previousScore
  for (const entry of dropsWithIndex) {
    const { drop, cpIdx } = entry;
    for (let nextIdx = cpIdx + 1; nextIdx < chronological.length; nextIdx++) {
      const laterCp = chronological[nextIdx];
      const laterItem = (laterCp.scores || []).find(s => s.competencyId === drop.competencyId);
      if (laterItem && laterItem.score >= drop.previousScore) {
        drop.recovered = true;
        drop.recoveredCheckpointId = laterCp.id;
        drop.recoveredReviewDate = laterCp.reviewDate;
        drop.recoveredScore = laterItem.score;
        break;
      }
    }
  }

  return dropsWithIndex.map(e => e.drop);
};

export const getUnrecoveredCompetencyScoreDrops = (
  drops: CompetencyScoreDrop[]
): CompetencyScoreDrop[] => drops.filter(d => !d.recovered);

export const getGlobalUnrecoveredCompetencyDrops = (
  checkpoints: CheckpointReview[]
): CompetencyScoreDrop[] => {
  const chronological = sortCheckpointsChronological(checkpoints);
  const allDrops = computeCompetencyScoreDrops(chronological);
  const unrecovered = getUnrecoveredCompetencyScoreDrops(allDrops);

  // Find latest recorded checkpoint entry for each competency
  const latestByComp = new Map<
    string,
    { score: number; checkpointId: string; reviewDate: string }
  >();
  for (const cp of chronological) {
    for (const item of cp.scores || []) {
      latestByComp.set(item.competencyId, {
        score: item.score,
        checkpointId: cp.id,
        reviewDate: cp.reviewDate
      });
    }
  }

  // Group by competency keeping earliest unrecovered drop's pre-drop score vs latest score
  const globalByComp = new Map<string, CompetencyScoreDrop>();
  for (const drop of unrecovered) {
    if (globalByComp.has(drop.competencyId)) continue;
    const latest = latestByComp.get(drop.competencyId);
    const currentScore = latest ? latest.score : drop.currentScore;
    const delta = Number((currentScore - drop.previousScore).toFixed(2));
    globalByComp.set(drop.competencyId, {
      checkpointId: latest ? latest.checkpointId : drop.checkpointId,
      reviewDate: latest ? latest.reviewDate : drop.reviewDate,
      competencyId: drop.competencyId,
      previousScore: drop.previousScore,
      currentScore,
      delta,
      previousCheckpointId: drop.previousCheckpointId,
      previousReviewDate: drop.previousReviewDate,
      recovered: false
    });
  }

  return Array.from(globalByComp.values());
};

export const groupDropsByCheckpoint = (
  drops: CompetencyScoreDrop[]
): Map<string, CompetencyScoreDrop[]> => {
  const map = new Map<string, CompetencyScoreDrop[]>();
  for (const drop of drops) {
    const existing = map.get(drop.checkpointId);
    if (existing) {
      existing.push(drop);
    } else {
      map.set(drop.checkpointId, [drop]);
    }
  }
  return map;
};

export const indexDropsByCheckpointAndCompetency = (
  drops: CompetencyScoreDrop[]
): Map<string, CompetencyScoreDrop> => {
  const map = new Map<string, CompetencyScoreDrop>();
  for (const drop of drops) {
    map.set(`${drop.checkpointId}::${drop.competencyId}`, drop);
  }
  return map;
};


