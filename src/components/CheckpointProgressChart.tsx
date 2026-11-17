import { useState } from 'react';
import { Activity, TrendingUp } from 'lucide-react';
import { CheckpointReview, getRequiredStage, stageToScore } from '../types';
import TruncatedTooltip from './TruncatedTooltip';

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
  const sortedChronological = [...checkpoints].sort(
    (a, b) => new Date(a.reviewDate).getTime() - new Date(b.reviewDate).getTime()
  );

  if (sortedChronological.length <= 1) {
    return null;
  }

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
  const selectedCompTarget = selectedCompStage
    ? stageToScore(selectedCompStage)
    : null;

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
                Meta {levelLabel}: <span className="font-mono tabular-nums font-semibold text-slate-700">{requiredScore.toFixed(2)}/5</span>
              </>
            ) : selectedCompMeta && selectedCompTarget !== null && selectedCompStage ? (
              <>
                Meta {selectedCompMeta.name} (Etapa {selectedCompStage.toLowerCase()}):{' '}
                <span className="font-mono tabular-nums font-semibold text-slate-700">{selectedCompTarget.toFixed(2)}/5</span>
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
                idx: i
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
                    return (
                      <g
                        key={`media-pt-${c.idx}`}
                        onMouseEnter={() => setHoveredIdx(c.idx)}
                        onMouseLeave={() => setHoveredIdx(null)}
                        className="cursor-pointer"
                      >
                        <circle
                          cx={c.x}
                          cy={c.y}
                          r={isHovered ? 5.5 : 4}
                          fill="#ffffff"
                          stroke="#4f46e5"
                          strokeWidth={2.5}
                        />
                        <text
                          x={c.x}
                          y={c.y - 9}
                          textAnchor="middle"
                          className="fill-indigo-700 text-[10px] font-mono font-bold"
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
                    x: xForIndex(i),
                    y: yForValue(scoreItem.score),
                    score: scoreItem.score,
                    idx: i
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
                    return (
                      <g key={`${compMeta.id}-${c.idx}`}>
                        <circle
                          cx={c.x}
                          cy={c.y}
                          r={hoveredIdx === c.idx || isHighlighted ? 4.5 : 3.2}
                          fill="#ffffff"
                          stroke={compMeta.color}
                          strokeWidth={2}
                        />
                        {showPointValue && (
                          <text
                            x={c.x}
                            y={c.y - 8}
                            textAnchor="middle"
                            className="text-[9.5px] font-mono font-bold"
                            fill={compMeta.color}
                          >
                            {c.score.toFixed(1)}
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
          <div className="flex items-center gap-4 text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 bg-indigo-600 inline-block" />
              Media conseguida
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-3.5 h-0.5 border-t-2 border-dashed border-slate-400 inline-block" />
              Meta requerida
            </span>
          </div>

          {activePoint && (
            <div className="text-slate-600 font-mono tabular-nums">
              {activePoint.cp.reviewDate}:{' '}
              <strong className="text-indigo-700">{activePoint.avgAchieved.toFixed(2)}</strong>
              {' / '}
              <span>{activePoint.required.toFixed(2)}</span>
              {' '}
              <span className={activePoint.avgAchieved >= activePoint.required ? 'text-emerald-700' : 'text-amber-700'}>
                ({activePoint.avgAchieved >= activePoint.required ? '+' : ''}
                {(activePoint.avgAchieved - activePoint.required).toFixed(2)})
              </span>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {compMetaList.map((comp) => {
              const isSelected = selectedCompId === comp.id;
              const scoreAtActive = activePoint?.cp.scores?.find(s => s.competencyId === comp.id)?.score;
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
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: comp.color }}
                      />
                      <span data-truncate-target className="truncate max-w-[160px]">{comp.name}</span>
                      {scoreAtActive !== undefined && (
                        <span className="font-mono tabular-nums font-semibold opacity-80">
                          {scoreAtActive.toFixed(1)}
                        </span>
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
