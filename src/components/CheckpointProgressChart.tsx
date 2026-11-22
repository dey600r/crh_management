import { useState } from 'react';
import { Activity, AlertTriangle, TrendingUp } from 'lucide-react';
import { CheckpointReview, getRequiredStage } from '../types';
import TruncatedTooltip from './TruncatedTooltip';
import {
  computeCompetencyScoreDrops,
  getGlobalUnrecoveredCompetencyDrops,
  groupDropsByCheckpoint,
  indexDropsByCheckpointAndCompetency,
  sortCheckpointsChronological
} from '../utils/checkpointAlerts';

interface CheckpointProgressChartProps {
  checkpoints: CheckpointReview[];
  competencies: any[];
  requiredScore: number;
  levelLabel: string;
  careerPathId: string;
  levelId: string;
}

const COMPETENCY_COLORS = [
  '#4f46e5', // indigo-600
  '#059669', // emerald-600
  '#d97706', // amber-600
  '#e11d48', // rose-600
  '#0284c7', // sky-600
  '#7c3aed'  // violet-600
];

export default function CheckpointProgressChart({
  checkpoints,
  competencies,
  requiredScore,
  levelLabel,
  careerPathId,
  levelId
}: CheckpointProgressChartProps) {
  const [chartMode, setChartMode] = useState<'media' | 'competencies'>('media');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [selectedCompId, setSelectedCompId] = useState<string | null>(null);

  // Chronological order (oldest -> newest) for left-to-right progression
  const sortedChronological = sortCheckpointsChronological(checkpoints);

  if (sortedChronological.length <= 1) {
    return null;
  }

  const scoreDrops = computeCompetencyScoreDrops(sortedChronological);
  const unrecoveredDrops = getGlobalUnrecoveredCompetencyDrops(sortedChronological);
  const dropsByCheckpoint = groupDropsByCheckpoint(scoreDrops);
  const dropByCpAndComp = indexDropsByCheckpointAndCompetency(scoreDrops);
  const compIdsWithActiveDrop = new Set(unrecoveredDrops.map(d => d.competencyId));

  // Compute achieved average (competencies only, 1-5 scale) per checkpoint
  const points = sortedChronological.map((cp, idx) => {
    const avgAchieved =
      cp.scores && cp.scores.length > 0
        ? cp.scores.reduce((sum, s) => sum + s.score, 0) / cp.scores.length
        : 0;
    return {
      cp,
      idx,
      avgAchieved: Number(avgAchieved.toFixed(2)),
      required: requiredScore
    };
  });

  // Collect all competency IDs present in these checkpoints
  const presentCompIds = Array.from(
    new Set(
      sortedChronological.flatMap(cp => (cp.scores || []).map(s => s.competencyId))
    )
  );

  const compMetaList = presentCompIds.map((compId, idx) => {
    const found = competencies.find(c => c.id === compId);
    return {
      id: compId,
      name: found ? found.name : compId,
      color: COMPETENCY_COLORS[idx % COMPETENCY_COLORS.length]
    };
  });

  // Compute required stage & score for the currently selected competency (when in competencies view)
  const selectedCompMeta = selectedCompId
    ? compMetaList.find(c => c.id === selectedCompId) || null
    : null;
  const selectedCompStage = selectedCompId
    ? getRequiredStage(careerPathId, levelId, selectedCompId)
    : null;
  const selectedCompTarget = selectedCompId ? requiredScore : null;

  // Determine active view values to compute piecewise compressed Y-axis (10% / 80% / 10%)
  const activeValues =
    chartMode === 'media'
      ? [...points.map(p => p.avgAchieved), requiredScore]
      : [
          ...sortedChronological.flatMap(cp => (cp.scores || []).map(s => s.score)),
          ...(selectedCompTarget !== null ? [selectedCompTarget] : [])
        ];

  const rawMin = activeValues.length > 0 ? Math.min(...activeValues) : 0;
  const rawMax = activeValues.length > 0 ? Math.max(...activeValues) : 5;

  let minVal = Math.max(0, Math.floor(rawMin * 10) / 10);
  let maxVal = Math.min(5, Math.ceil(rawMax * 10) / 10);
  if (maxVal - minVal < 0.4) {
    minVal = Math.max(0, Number((rawMin - 0.3).toFixed(1)));
    maxVal = Math.min(5, Number((rawMax + 0.3).toFixed(1)));
  }

  // SVG Layout constants
  const width = 640;
  const height = 250;
  const padLeft = 44;
  const padRight = 28;
  const padTop = 24;
  const padBottom = 42;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  // Piecewise Y-scale:
  // [0 .. minVal] -> 10% bottom height (if minVal > 0)
  // [minVal .. maxVal] -> 80% center height
  // [maxVal .. 5] -> 10% top height (if maxVal < 5)
  const bottomShare = minVal > 0 ? 0.10 : 0;
  const topShare = maxVal < 5 ? 0.10 : 0;
  const midShare = 1 - bottomShare - topShare;

  const yFive = padTop;
  const yMax = padTop + topShare * plotH;
  const yMin = padTop + (topShare + midShare) * plotH;
  const yZero = padTop + plotH;

  const yForValue = (val: number) => {
    const v = Math.max(0, Math.min(5, val));
    if (v <= minVal && minVal > 0) {
      const t = v / minVal;
      return yZero - t * (yZero - yMin);
    }
    if (v >= maxVal && maxVal < 5) {
      const t = (v - maxVal) / (5 - maxVal);
      return yMax - t * (yMax - yFive);
    }
    const t = maxVal > minVal ? (v - minVal) / (maxVal - minVal) : 0.5;
    return yMin - t * (yMin - yMax);
  };

  // Build crisp non-overlapping Y ticks
  const yTicks: { val: number; isCompressedBoundary?: boolean }[] = [];
  if (bottomShare > 0) {
    yTicks.push({ val: 0 });
  }
  yTicks.push({ val: minVal, isCompressedBoundary: bottomShare > 0 });

  const midStepCount = 3;
  for (let s = 1; s < midStepCount; s++) {
    const tickVal = Number((minVal + ((maxVal - minVal) * s) / midStepCount).toFixed(2));
    if (tickVal > minVal + 0.05 && tickVal < maxVal - 0.05) {
      yTicks.push({ val: tickVal });
    }
  }
  yTicks.push({ val: maxVal, isCompressedBoundary: topShare > 0 });
  if (topShare > 0) {
    yTicks.push({ val: 5 });
  }

  const xForIndex = (i: number) => {
    if (points.length <= 1) return padLeft + plotW / 2;
    const marginX = 38;
    const usableW = Math.max(40, plotW - marginX * 2);
    return padLeft + marginX + (i / (points.length - 1)) * usableW;
  };

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : points[points.length - 1];

  return (
    <div className="border border-slate-200 rounded-xl bg-white p-4 space-y-3">
      {/* Header + Segmented View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h5 className="text-xs font-bold text-slate-900">
            Progreso del Colaborador en Checkpoints
          </h5>
          <p className="text-[11px] text-slate-500 mt-0.5">
            <span className="font-mono tabular-nums">{points.length}</span> revisiones (orden cronológico)
            <span aria-hidden="true" className="mx-1.5">·</span>
            {chartMode === 'media' ? (
              <>
                Meta {levelLabel}: <span className="font-mono tabular-nums font-semibold text-slate-700">{requiredScore.toFixed(2)}</span>
              </>
            ) : selectedCompMeta && selectedCompTarget !== null && selectedCompStage ? (
              <>
                Meta {selectedCompMeta.name} (Etapa {selectedCompStage.toLowerCase()}):{' '}
                <span className="font-mono tabular-nums font-semibold text-slate-700">{selectedCompTarget.toFixed(2)}</span>
              </>
            ) : (
              <span>Selecciona una competencia para ver su meta</span>
            )}
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Tipo de gráfico de progreso"
          className="inline-flex items-center p-0.5 bg-slate-100 rounded-lg border border-slate-200 self-start sm:self-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={chartMode === 'media'}
            onClick={() => setChartMode('media')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              chartMode === 'media'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            Media
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={chartMode === 'competencies'}
            onClick={() => setChartMode('competencies')}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors whitespace-nowrap shrink-0 ${
              chartMode === 'competencies'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5" />
            Por Competencia
          </button>
        </div>
      </div>

      {/* Competency Score Drop Alert Strip (one global entry per unrecovered competency) */}
      {unrecoveredDrops.length > 0 && (
        <div
          role="alert"
          className="bg-rose-50 border border-rose-200 rounded-lg px-3 py-2 text-xs text-rose-900 space-y-1.5"
        >
          <div className="flex items-center gap-1.5 font-bold text-rose-800">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
            <span>
              Alerta: descenso global en {unrecoveredDrops.length}{' '}
              {unrecoveredDrops.length === 1 ? 'competencia' : 'competencias'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {unrecoveredDrops.map(drop => {
              const compName =
                compMetaList.find(c => c.id === drop.competencyId)?.name || drop.competencyId;
              const isSelectedComp =
                chartMode === 'competencies' && selectedCompId === drop.competencyId;
              return (
                <button
                  key={drop.competencyId}
                  type="button"
                  onClick={() => {
                    setChartMode('competencies');
                    setSelectedCompId(drop.competencyId);
                  }}
                  title={`Ver ${compName} en gráfica (${drop.previousReviewDate} → ${drop.reviewDate})`}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium border transition-colors ${
                    isSelectedComp
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-100'
                  }`}
                >
                  <span>{compName}:</span>
                  <span className="font-mono font-bold tabular-nums">
                    {drop.previousScore.toFixed(1)} → {drop.currentScore.toFixed(1)}
                  </span>
                  <span className="font-mono text-[10px] opacity-85">
                    ({drop.delta.toFixed(1)})
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* SVG Plot */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full min-w-[460px] h-auto select-none"
          role="img"
          aria-label={
            chartMode === 'media'
              ? 'Gráfico de líneas comparando la media conseguida y la meta requerida por checkpoint'
              : 'Gráfico de líneas mostrando la evolución de cada competencia por checkpoint'
          }
        >
          {/* Compressed 10% lower and upper band shading */}
          {bottomShare > 0 && (
            <rect
              x={padLeft}
              y={yMin}
              width={plotW}
              height={yZero - yMin}
              fill="#f8fafc"
            />
          )}
          {topShare > 0 && (
            <rect
              x={padLeft}
              y={yFive}
              width={plotW}
              height={yMax - yFive}
              fill="#f8fafc"
            />
          )}

          {/* Horizontal Y-axis gridlines & labels */}
          {yTicks.map((tick, idx) => {
            const y = yForValue(tick.val);
            return (
              <g key={`ytick-${idx}-${tick.val}`}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke={tick.val === 0 ? '#cbd5e1' : tick.isCompressedBoundary ? '#e2e8f0' : '#f1f5f9'}
                  strokeWidth={1}
                  strokeDasharray={tick.isCompressedBoundary ? '2 2' : undefined}
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className={`text-[9.5px] font-mono ${
                    tick.isCompressedBoundary ? 'fill-slate-600 font-semibold' : 'fill-slate-400'
                  }`}
                >
                  {tick.val.toFixed(1)}
                </text>
              </g>
            );
          })}

          {/* Required target dashed reference line:
              - In "Media" view: always show level target (requiredScore)
              - In "Por Competencia" view: ONLY show when a competency is selected, using that competency's target */}
          {chartMode === 'media' && (
            <>
              <line
                x1={padLeft}
                y1={yForValue(requiredScore)}
                x2={width - padRight}
                y2={yForValue(requiredScore)}
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
              <text
                x={width - padRight - 2}
                y={yForValue(requiredScore) - 5}
                textAnchor="end"
                className="fill-slate-500 text-[9.5px] font-mono font-semibold"
              >
                Meta requerida ({requiredScore.toFixed(2)})
              </text>
            </>
          )}

          {chartMode === 'competencies' && selectedCompTarget !== null && selectedCompMeta && selectedCompStage && (
            <>
              <line
                x1={padLeft}
                y1={yForValue(selectedCompTarget)}
                x2={width - padRight}
                y2={yForValue(selectedCompTarget)}
                stroke={selectedCompMeta.color}
                strokeOpacity={0.7}
                strokeWidth={1.5}
                strokeDasharray="4 4"
              />
              <text
                x={width - padRight - 2}
                y={yForValue(selectedCompTarget) - 5}
                textAnchor="end"
                className="text-[9.5px] font-mono font-semibold"
                fill={selectedCompMeta.color}
              >
                <title>
                  {`Meta ${selectedCompMeta.name} · Etapa ${selectedCompStage.toLowerCase()} (${selectedCompTarget.toFixed(2)})`}
                </title>
                Meta {selectedCompMeta.name} · Etapa {selectedCompStage.toLowerCase()} ({selectedCompTarget.toFixed(2)})
              </text>
            </>
          )}

          {/* Vertical hover columns & X-axis labels */}
          {points.map((pt, i) => {
            const x = xForIndex(i);
            const isHovered = hoveredIdx === i;
            return (
              <g
                key={`col-${pt.cp.id}`}
                onMouseEnter={() => setHoveredIdx(i)}
                onMouseLeave={() => setHoveredIdx(null)}
                className="cursor-pointer"
              >
                <line
                  x1={x}
                  y1={padTop}
                  x2={x}
                  y2={yZero}
                  stroke={isHovered ? '#cbd5e1' : 'transparent'}
                  strokeWidth={1}
                  strokeDasharray="2 2"
                />
                <rect
                  x={x - 28}
                  y={padTop}
                  width={56}
                  height={plotH + 34}
                  fill="transparent"
                />
                <text
                  x={x}
                  y={height - 20}
                  textAnchor="middle"
                  className={`text-[10px] font-mono ${
                    isHovered ? 'fill-slate-900 font-bold' : 'fill-slate-600'
                  }`}
                >
                  {pt.cp.reviewDate}
                </text>
                <text
                  x={x}
                  y={height - 7}
                  textAnchor="middle"
                  className="fill-slate-400 text-[9px]"
                >
                  #{i + 1} · {pt.cp.reviewType}
                </text>
              </g>
            );
          })}

          {chartMode === 'media' ? (
            /* MODE 1: Line chart of Achieved Average vs Dashed Required Threshold */
            (() => {
              const coords = points.map((pt, i) => ({
                x: xForIndex(i),
                y: yForValue(pt.avgAchieved),
                val: pt.avgAchieved,
                idx: i,
                drops: dropsByCheckpoint.get(pt.cp.id) || []
              }));

              const linePath = coords
                .map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x} ${c.y}`)
                .join(' ');

              return (
                <g>
                  <path
                    d={linePath}
                    fill="none"
                    stroke="#4f46e5"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {coords.map((c) => {
                    const isHovered = hoveredIdx === c.idx;
                    const hasDrop = c.drops.length > 0;
                    const dropSummary = hasDrop
                      ? c.drops
                          .map(d => {
                            const cName =
                              compMetaList.find(m => m.id === d.competencyId)?.name || d.competencyId;
                            return `${cName}: ${d.previousScore.toFixed(1)} → ${d.currentScore.toFixed(1)}${d.recovered ? ' (recuperado)' : ''}`;
                          })
                          .join(' | ')
                      : '';
                    return (
                      <g
                        key={`media-pt-${c.idx}`}
                        onMouseEnter={() => setHoveredIdx(c.idx)}
                        onMouseLeave={() => setHoveredIdx(null)}
                        className="cursor-pointer"
                      >
                        {hasDrop && (
                          <title>{`Descenso en checkpoint: ${dropSummary}`}</title>
                        )}
                        {hasDrop && (
                          <circle
                            cx={c.x}
                            cy={c.y}
                            r={isHovered ? 8.5 : 7}
                            fill="none"
                            stroke="#e11d48"
                            strokeWidth={1.5}
                            strokeDasharray="2.5 2"
                          />
                        )}
                        <circle
                          cx={c.x}
                          cy={c.y}
                          r={isHovered ? 5.5 : 4}
                          fill="#ffffff"
                          stroke={hasDrop ? '#e11d48' : '#4f46e5'}
                          strokeWidth={2.5}
                        />
                        {hasDrop && (
                          <circle
                            cx={c.x + 6}
                            cy={c.y - 6}
                            r={3}
                            fill="#e11d48"
                            stroke="#ffffff"
                            strokeWidth={1}
                          />
                        )}
                        <text
                          x={c.x}
                          y={c.y - 10}
                          textAnchor="middle"
                          className={`text-[10px] font-mono font-bold ${
                            hasDrop ? 'fill-rose-700' : 'fill-indigo-700'
                          }`}
                        >
                          {c.val.toFixed(2)}
                        </text>
                      </g>
                    );
                  })}
                </g>
              );
            })()
          ) : (
            /* MODE 2: Multi-line per Competency */
            compMetaList.map((compMeta) => {
              const isMuted = selectedCompId !== null && selectedCompId !== compMeta.id;
              const isHighlighted = selectedCompId === compMeta.id;

              const coords = points
                .map((pt, i) => {
                  const scoreItem = pt.cp.scores?.find(s => s.competencyId === compMeta.id);
                  if (!scoreItem) return null;
                  return {
                    checkpointId: pt.cp.id,
                    x: xForIndex(i),
                    y: yForValue(scoreItem.score),
                    score: scoreItem.score,
                    idx: i,
                    drop: dropByCpAndComp.get(`${pt.cp.id}::${compMeta.id}`) || null
                  };
                })
                .filter((c): c is NonNullable<typeof c> => c !== null);

              if (coords.length === 0) return null;

              const pathD = coords
                .map((c, idx) => `${idx === 0 ? 'M' : 'L'} ${c.x} ${c.y}`)
                .join(' ');

              return (
                <g key={compMeta.id} opacity={isMuted ? 0.18 : 1}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={compMeta.color}
                    strokeWidth={isHighlighted ? 2.75 : 2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {coords.map((c) => {
                    const showPointValue = isHighlighted || hoveredIdx === c.idx;
                    const hasDrop = Boolean(c.drop);
                    return (
                      <g key={`${compMeta.id}-${c.idx}`}>
                        {c.drop && (
                          <title>
                            {`Descenso en ${compMeta.name}: ${c.drop.previousScore.toFixed(1)} → ${c.drop.currentScore.toFixed(1)} (${c.drop.delta.toFixed(1)})${c.drop.recovered ? ` · Recuperado el ${c.drop.recoveredReviewDate}` : ''}`}
                          </title>
                        )}
                        {hasDrop && (
                          <circle
                            cx={c.x}
                            cy={c.y}
                            r={hoveredIdx === c.idx || isHighlighted ? 7.5 : 6}
                            fill="#fff1f2"
                            stroke="#e11d48"
                            strokeWidth={1.75}
                          />
                        )}
                        <circle
                          cx={c.x}
                          cy={c.y}
                          r={hoveredIdx === c.idx || isHighlighted ? 4.5 : 3.2}
                          fill={hasDrop ? '#e11d48' : '#ffffff'}
                          stroke={hasDrop ? '#ffffff' : compMeta.color}
                          strokeWidth={hasDrop ? 1.5 : 2}
                        />
                        {showPointValue && (
                          <text
                            x={c.x}
                            y={c.y - 9}
                            textAnchor="middle"
                            className="text-[9.5px] font-mono font-bold"
                            fill={hasDrop ? '#e11d48' : compMeta.color}
                          >
                            {c.score.toFixed(1)}{hasDrop ? ' ↓' : ''}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </g>
              );
            })
          )}
        </svg>
      </div>

      {/* Legend & Interactive Readout */}
      {chartMode === 'media' ? (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-[11px]">
          <div className="flex flex-wrap items-center gap-4 text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-indigo-600 inline-block" />
              Media conseguida
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 border-t-2 border-dashed border-slate-400 inline-block" />
              Meta requerida
            </span>
            {scoreDrops.length > 0 && (
              <span className="inline-flex items-center gap-1 text-rose-700 font-semibold">
                <span className="w-2.5 h-2.5 rounded-full border-2 border-rose-600 bg-rose-100 inline-block" />
                Descenso en checkpoint
              </span>
            )}
          </div>

          {activePoint && (() => {
            const activeDrops = dropsByCheckpoint.get(activePoint.cp.id) || [];
            return (
              <div className="text-slate-600 font-mono tabular-nums flex items-center gap-1.5 flex-wrap">
                <span>
                  {activePoint.cp.reviewDate}:{' '}
                  <strong className="text-indigo-700">{activePoint.avgAchieved.toFixed(2)}</strong>
                  {' / '}
                  <span>{activePoint.required.toFixed(2)}</span>{' '}
                  <span className={activePoint.avgAchieved >= activePoint.required ? 'text-emerald-700' : 'text-amber-700'}>
                    ({activePoint.avgAchieved >= activePoint.required ? '+' : ''}
                    {(activePoint.avgAchieved - activePoint.required).toFixed(2)})
                  </span>
                </span>
                {activeDrops.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setChartMode('competencies');
                      setSelectedCompId(activeDrops[0].competencyId);
                    }}
                    className="inline-flex items-center gap-1 text-[10px] font-sans font-bold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.5 rounded hover:bg-rose-100 transition-colors"
                  >
                    <AlertTriangle className="h-3 w-3 shrink-0" />
                    {activeDrops.length} {activeDrops.length === 1 ? 'bajada' : 'bajadas'}
                  </button>
                )}
              </div>
            );
          })()}
        </div>
      ) : (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {compMetaList.map((comp) => {
              const isSelected = selectedCompId === comp.id;
              const scoreAtActive = activePoint?.cp.scores?.find(s => s.competencyId === comp.id)?.score;
              const hasCompActiveDrop = compIdsWithActiveDrop.has(comp.id);
              const activeCompDrop = activePoint
                ? dropByCpAndComp.get(`${activePoint.cp.id}::${comp.id}`)
                : undefined;
              return (
                <div key={comp.id} className="inline-flex">
                  <TruncatedTooltip text={comp.name} className="inline-flex">
                    <button
                      type="button"
                      onClick={() => setSelectedCompId(isSelected ? null : comp.id)}
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] border transition-colors whitespace-nowrap shrink-0 ${
                        isSelected
                          ? 'bg-slate-100 text-slate-900 border-slate-400 font-semibold shadow-2xs'
                          : selectedCompId !== null
                          ? 'bg-slate-50 text-slate-400 border-slate-200 hover:text-slate-700'
                          : hasCompActiveDrop
                          ? 'bg-rose-50/50 text-slate-800 border-rose-200 hover:bg-rose-50'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: comp.color }}
                      />
                      <span data-truncate-target className="truncate max-w-[160px]">{comp.name}</span>
                      {scoreAtActive !== undefined && (
                        <span className={`font-mono tabular-nums font-semibold ${
                          activeCompDrop ? 'text-rose-700' : 'opacity-80'
                        }`}>
                          {scoreAtActive.toFixed(1)}
                        </span>
                      )}
                      {hasCompActiveDrop && (
                        <AlertTriangle className="h-3 w-3 text-rose-600 shrink-0" />
                      )}
                    </button>
                  </TruncatedTooltip>
                </div>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-400">
            Escala vertical ajustada (10% inferior 0–{minVal.toFixed(1)} · 80% rango útil · 10% superior {maxVal.toFixed(1)}–5). Clic en una competencia para aislarla y mostrar su meta requerida.
          </p>
        </div>
      )}
    </div>
  );
}
