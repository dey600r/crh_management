import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import XLSXStyle from 'xlsx-js-style';
import {
  FileSpreadsheet,
  Upload,
  Download,
  Trash2,
  Pencil,
  Check,
  X,
  AlertCircle,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  ArrowUpCircle,
  Award,
  Star,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { AnnualEvaluation, DivisionBudget, Employee } from '../types';
import TruncatedTooltip from './TruncatedTooltip';
import EmployeeRecognitionIcons from './EmployeeRecognitionIcons';
import {
  MIN_SALARY_RAISE_EUR,
  SALARY_RAISE_STEP_EUR,
  computeDivisionSalaryRecommendationByName,
  formatEvalResultLabel,
  formatWholeEur
} from '../utils/salaryRecommendation';

interface DivisionBudgetSectionProps {
  budgets: DivisionBudget[];
  divisionsHint?: string[];
  employees?: Employee[];
  evaluations?: AnnualEvaluation[];
  careerLevels?: any[];
  onBudgetsUpdated: (nextBudgets: DivisionBudget[]) => void;
}

const formatEur = (amount: number) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2
  }).format(amount);

const normalizeHeader = (value: unknown): string =>
  String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

const parseEuroAmount = (raw: unknown): number | null => {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) && raw >= 0 ? Number(raw.toFixed(2)) : null;
  }
  const str = String(raw ?? '')
    .replace(/eur/gi, '')
    .replace(/€/g, '')
    .replace(/\s+/g, '')
    .trim();

  if (!str) return null;

  const cleaned = str.replace(/[^0-9.,-]/g, '');
  if (!cleaned || cleaned.startsWith('-')) return null;

  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  let normalized = cleaned;
  if (lastComma !== -1 && lastDot !== -1) {
    if (lastComma > lastDot) {
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = cleaned.replace(/,/g, '');
    }
  } else if (lastComma !== -1) {
    if (/^\d{1,3}(,\d{3})+$/.test(cleaned)) {
      normalized = cleaned.replace(/,/g, '');
    } else {
      normalized = cleaned.replace(/,/g, '.');
    }
  } else if (lastDot !== -1) {
    if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
      normalized = cleaned.replace(/\./g, '');
    }
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed >= 0 ? Number(parsed.toFixed(2)) : null;
};

const renderEvalResultIcon = (res: AnnualEvaluation['evaluationResult']) => {
  switch (res) {
    case 'Promoted':
      return <ArrowUpCircle className="h-4 w-4 text-emerald-600" />;
    case 'Outstanding':
      return <Award className="h-4 w-4 text-amber-500" />;
    case 'ExceedsExpectations':
      return <Star className="h-4 w-4 text-indigo-600" />;
    case 'MeetsExpectations':
      return <CheckCircle2 className="h-4 w-4 text-sky-600" />;
    case 'Unsatisfactory':
      return <AlertTriangle className="h-4 w-4 text-rose-600" />;
    default:
      return <CheckCircle2 className="h-4 w-4 text-slate-400" />;
  }
};

export default function DivisionBudgetSection({
  budgets,
  divisionsHint = [],
  employees = [],
  evaluations = [],
  careerLevels = [],
  onBudgetsUpdated
}: DivisionBudgetSectionProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingAmount, setEditingAmount] = useState<string>('');
  const [selectedDivisionId, setSelectedDivisionId] = useState<string | null>(null);

  const persistBudgets = async (nextItems: DivisionBudget[], successText: string) => {
    setIsSaving(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/division-budgets', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ budgets: nextItems })
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'No se pudieron guardar los presupuestos en Firestore.');
        return;
      }
      onBudgetsUpdated(data);
      setStatusMsg(successText);
    } catch {
      setErrorMsg('Error de conexión al guardar los presupuestos por división.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setErrorMsg(null);
    setStatusMsg(null);

    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        setErrorMsg('El archivo seleccionado no contiene ninguna hoja de cálculo.');
        return;
      }

      const sheet = workbook.Sheets[firstSheetName];
      const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '' });
      const nonEmptyRows = rows.filter(
        row => Array.isArray(row) && row.some(cell => String(cell ?? '').trim() !== '')
      );

      if (nonEmptyRows.length < 2) {
        setErrorMsg('El archivo debe contener la fila de cabeceras y al menos una división con su presupuesto.');
        return;
      }

      const headerRow = nonEmptyRows[0];
      const divisionColIdx = headerRow.findIndex(cell => {
        const h = normalizeHeader(cell);
        return h === 'division' || h.includes('division');
      });
      const budgetColIdx = headerRow.findIndex(cell => {
        const h = normalizeHeader(cell);
        return (
          h === 'presupuesto de subidas' ||
          h.includes('presupuesto') ||
          h.includes('subida')
        );
      });

      if (divisionColIdx === -1 || budgetColIdx === -1) {
        setErrorMsg(
          'Columnas no válidas. Asegúrate de incluir las cabeceras "Division" y "Presupuesto de subidas".'
        );
        return;
      }

      const now = new Date().toISOString();
      const parsedMap = new Map<string, DivisionBudget>();

      for (let i = 1; i < nonEmptyRows.length; i++) {
        const row = nonEmptyRows[i];
        const rawDiv = String(row[divisionColIdx] ?? '').trim();
        const rawBudget = row[budgetColIdx];

        if (!rawDiv && String(rawBudget ?? '').trim() === '') continue;

        if (!rawDiv) {
          setErrorMsg(`Fila ${i + 1}: falta el nombre de la división.`);
          return;
        }

        const amount = parseEuroAmount(rawBudget);
        if (amount === null) {
          setErrorMsg(
            `Fila ${i + 1} (${rawDiv}): el valor "${String(rawBudget)}" no es un importe válido en euros.`
          );
          return;
        }

        const key = rawDiv.toLowerCase();
        const existing = parsedMap.get(key);
        if (existing) {
          existing.raiseBudgetEur = Number((existing.raiseBudgetEur + amount).toFixed(2));
        } else {
          const slug = rawDiv
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '_')
            .replace(/^_+|_+$/g, '') || `div_${i}`;

          parsedMap.set(key, {
            id: `DIV_${slug}`,
            division: rawDiv,
            raiseBudgetEur: amount,
            updatedAt: now
          });
        }
      }

      const importedList = Array.from(parsedMap.values());
      if (importedList.length === 0) {
        setErrorMsg('No se encontraron registros válidos en el archivo importado.');
        return;
      }

      await persistBudgets(
        importedList,
        `Importadas ${importedList.length} ${importedList.length === 1 ? 'división' : 'divisiones'} desde ${file.name}.`
      );
    } catch {
      setErrorMsg('No se pudo leer el archivo. Comprueba que sea un Excel (.xlsx/.xls) o CSV válido.');
    }
  };

  const handleDownloadTemplate = () => {
    const sampleDivisions =
      divisionsHint.length > 0
        ? Array.from(new Set(divisionsHint.filter(Boolean)))
        : [
            'Software Engineering',
            'Architecture & Tech Leadership',
            'Project & Product Management',
            'Consulting'
          ];

    const sampleRows = sampleDivisions.map((div, index) => ({
      Division: div,
      'Presupuesto de subidas': (4 - (index % 3)) * 15000 + 25000
    }));

    const worksheet = XLSX.utils.json_to_sheet(sampleRows);
    worksheet['!cols'] = [{ wch: 32 }, { wch: 24 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Presupuestos');
    XLSX.writeFile(workbook, 'plantilla_presupuesto_divisiones.xlsx');
  };

  const handleStartEdit = (e: React.MouseEvent, item: DivisionBudget) => {
    e.stopPropagation();
    setEditingId(item.id);
    setEditingAmount(String(item.raiseBudgetEur));
    setErrorMsg(null);
  };

  const handleSaveEdit = async (e: React.MouseEvent | React.KeyboardEvent, item: DivisionBudget) => {
    e.stopPropagation();
    const parsed = parseEuroAmount(editingAmount);
    if (parsed === null) {
      setErrorMsg(`Introduce un importe válido en euros para "${item.division}".`);
      return;
    }
    const now = new Date().toISOString();
    const updated = budgets.map(b =>
      b.id === item.id ? { ...b, raiseBudgetEur: parsed, updatedAt: now } : b
    );
    setEditingId(null);
    await persistBudgets(updated, `Presupuesto de "${item.division}" actualizado.`);
  };

  const handleDeleteRow = async (e: React.MouseEvent, item: DivisionBudget) => {
    e.stopPropagation();
    if (selectedDivisionId === item.id) {
      setSelectedDivisionId(null);
    }
    const remaining = budgets.filter(b => b.id !== item.id);
    await persistBudgets(remaining, `División "${item.division}" eliminada.`);
  };

  const handleClearAll = async () => {
    setIsSaving(true);
    setErrorMsg(null);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/division-budgets', { method: 'DELETE' });
      if (!res.ok) {
        setErrorMsg('Error al limpiar los presupuestos guardados.');
        return;
      }
      setEditingId(null);
      setSelectedDivisionId(null);
      onBudgetsUpdated([]);
      setStatusMsg('Listado de presupuestos limpiado.');
    } catch {
      setErrorMsg('Error de conexión al limpiar los presupuestos.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadBreakdownExcel = () => {
    if (!selectedRecommendation || !selectedRecommendation.canRecommend) return;

    const headers = ['Colaborador', 'Nivel', 'Evaluación', 'Nota', '% Presup.', 'Subida (EUR)', '% Subida'];
    const dataRows = selectedRecommendation.items.map(item => {
      const curLvl =
        careerLevels.find(l => l.id === item.evaluation.currentLevelId)?.levelCode ||
        item.evaluation.currentLevelId;
      const tgtLvl =
        careerLevels.find(l => l.id === item.evaluation.targetLevelId)?.levelCode ||
        item.evaluation.targetLevelId;

      return [
        `${item.employee.name} ${item.employee.surname}`,
        item.isPromoted ? `${curLvl} → ${tgtLvl} (Promoción)` : curLvl,
        formatEvalResultLabel(item.evaluationResult),
        Number(item.finalScore.toFixed(2)),
        Number(item.sharePercent.toFixed(1)),
        item.recommendedRaiseEur,
        Number(item.salaryRaisePercent.toFixed(1))
      ];
    });

    const totalRow = [
      `Total (${selectedRecommendation.totalEmployees} colab. · ${selectedRecommendation.promotedCount} prom.)`,
      '',
      '',
      '',
      100,
      selectedRecommendation.totalAllocatedEur,
      ''
    ];

    const aoa = [headers, ...dataRows, totalRow];
    const worksheet = XLSXStyle.utils.aoa_to_sheet(aoa);

    const headerStyle = {
      fill: { patternType: 'solid', fgColor: { rgb: '3730A3' } },
      font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: 'FFFFFF' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: {
        top: { style: 'thin', color: { rgb: '312E81' } },
        bottom: { style: 'medium', color: { rgb: '312E81' } },
        left: { style: 'thin', color: { rgb: '4338CA' } },
        right: { style: 'thin', color: { rgb: '4338CA' } }
      }
    };

    const rowBorder = {
      bottom: { style: 'thin', color: { rgb: 'E2E8F0' } },
      left: { style: 'thin', color: { rgb: 'F1F5F9' } },
      right: { style: 'thin', color: { rgb: 'F1F5F9' } }
    };

    const totalStyleBase = {
      fill: { patternType: 'solid', fgColor: { rgb: 'F1F5F9' } },
      font: { name: 'Calibri', sz: 11, bold: true, color: { rgb: '0F172A' } },
      border: {
        top: { style: 'medium', color: { rgb: 'CBD5E1' } },
        bottom: { style: 'thin', color: { rgb: 'CBD5E1' } }
      }
    };

    // Style header row
    for (let c = 0; c < headers.length; c++) {
      const addr = XLSXStyle.utils.encode_cell({ r: 0, c });
      if (worksheet[addr]) {
        worksheet[addr].s = headerStyle;
      }
    }

    // Style data rows (center Evaluación [2], Nota [3], % [4], Subida [5])
    for (let r = 1; r <= dataRows.length; r++) {
      const item = selectedRecommendation.items[r - 1];
      for (let c = 0; c < headers.length; c++) {
        const addr = XLSXStyle.utils.encode_cell({ r, c });
        const cell = worksheet[addr];
        if (!cell) continue;

        const isCenteredCol = c >= 2;
        const baseStyle: Record<string, unknown> = {
          font: { name: 'Calibri', sz: 10.5, color: { rgb: '1E293B' } },
          alignment: {
            horizontal: isCenteredCol ? 'center' : 'left',
            vertical: 'center'
          },
          border: rowBorder
        };

        if (c === 3) {
          cell.z = '0.00';
        } else if (c === 4) {
          cell.z = '0.0"%"';
        } else if (c === 5) {
          cell.z = '#,##0" €"';
          baseStyle.font = {
            name: 'Calibri',
            sz: 10.5,
            bold: true,
            color: { rgb: item.recommendedRaiseEur > 0 ? '047857' : '64748B' }
          };
        } else if (c === 6) {
          cell.z = '+0.0"%";0.0"%";0.0"%"';
          baseStyle.font = {
            name: 'Calibri',
            sz: 10.5,
            bold: item.recommendedRaiseEur > 0,
            color: { rgb: item.recommendedRaiseEur > 0 ? '047857' : '64748B' }
          };
        }

        cell.s = baseStyle;
      }
    }

    // Style total row
    const totalRowIdx = dataRows.length + 1;
    for (let c = 0; c < headers.length; c++) {
      const addr = XLSXStyle.utils.encode_cell({ r: totalRowIdx, c });
      const cell = worksheet[addr];
      if (!cell) continue;

      const isCenteredCol = c >= 2;
      const cellStyle: Record<string, unknown> = {
        ...totalStyleBase,
        alignment: {
          horizontal: isCenteredCol ? 'center' : 'left',
          vertical: 'center'
        }
      };

      if (c === 4) {
        cell.z = '0.0"%"';
      } else if (c === 5) {
        cell.z = '#,##0" €"';
        cellStyle.font = {
          name: 'Calibri',
          sz: 11,
          bold: true,
          color: { rgb: '3730A3' }
        };
      }

      cell.s = cellStyle;
    }

    worksheet['!cols'] = [
      { wch: 26 },
      { wch: 22 },
      { wch: 22 },
      { wch: 10 },
      { wch: 12 },
      { wch: 16 },
      { wch: 12 }
    ];
    worksheet['!rows'] = [
      { hpt: 24 },
      ...dataRows.map(() => ({ hpt: 20 })),
      { hpt: 22 }
    ];

    const workbook = XLSXStyle.utils.book_new();
    XLSXStyle.utils.book_append_sheet(workbook, worksheet, 'Reparto Subidas');

    const slug =
      selectedRecommendation.division
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '') || 'division';

    XLSXStyle.writeFile(workbook, `reparto_subidas_${slug}.xlsx`);
  };

  const totalBudgetEur = budgets.reduce((sum, b) => sum + b.raiseBudgetEur, 0);
  const selectedBudget = budgets.find(b => b.id === selectedDivisionId) || null;
  const selectedRecommendation = selectedBudget
    ? computeDivisionSalaryRecommendationByName(
        selectedBudget.division,
        employees,
        evaluations,
        budgets
      )
    : null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4 text-emerald-600 shrink-0" />
            Presupuesto de Subidas por División
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Importa un archivo Excel o CSV con{' '}
            <span className="font-semibold text-slate-700">Division</span> y{' '}
            <span className="font-semibold text-slate-700">Presupuesto de subidas</span> (EUR). Haz clic en una división para ver su reparto.
          </p>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileSelected}
          className="hidden"
        />
        <button
          type="button"
          disabled={isSaving}
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs px-3 py-1.5 rounded-lg transition disabled:opacity-50 whitespace-nowrap shrink-0"
        >
          <Upload className="h-3.5 w-3.5" />
          {budgets.length > 0 ? 'Reimportar Excel / CSV' : 'Importar Excel / CSV'}
        </button>

        <button
          type="button"
          disabled={isSaving}
          onClick={handleDownloadTemplate}
          className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 transition disabled:opacity-50 whitespace-nowrap shrink-0"
        >
          <Download className="h-3.5 w-3.5" />
          Plantilla (.xlsx)
        </button>

        {budgets.length > 0 && (
          <button
            type="button"
            disabled={isSaving}
            onClick={handleClearAll}
            className="inline-flex items-center gap-1 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1.5 rounded-lg transition disabled:opacity-50 ml-auto whitespace-nowrap shrink-0"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Limpiar
          </button>
        )}
      </div>

      {/* Feedback messages */}
      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg p-2.5 text-xs flex items-start gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {statusMsg && !errorMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-2.5 py-1.5 text-[11px] font-medium">
          {statusMsg}
        </div>
      )}

      {/* Empty or Populated Summary Table */}
      {budgets.length === 0 ? (
        <div className="bg-slate-50 border border-slate-200 border-dashed rounded-lg p-3.5 text-xs text-slate-500">
          No hay presupuestos importados todavía. Sube un archivo <span className="font-mono">.xlsx</span>,{' '}
          <span className="font-mono">.xls</span> o <span className="font-mono">.csv</span> o descarga la
          plantilla de ejemplo para comenzar.
        </div>
      ) : (
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-xs border-collapse">
            <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                <tr>
                  <th className="text-left px-3 py-2">División</th>
                  <th className="text-right px-3 py-2">Presupuesto</th>
                  <th className="text-right px-2 py-2 w-16">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {budgets.map((item) => {
                  const isEditing = editingId === item.id;
                  const isSelected = selectedDivisionId === item.id;
                  return (
                    <tr
                      key={item.id}
                      onClick={() =>
                        setSelectedDivisionId(prev => (prev === item.id ? null : item.id))
                      }
                      className={`cursor-pointer transition-colors ${
                        isSelected ? 'bg-indigo-50/75' : 'hover:bg-slate-50/80'
                      }`}
                    >
                      <td className="px-3 py-2 font-medium text-slate-800 max-w-[165px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          {isSelected ? (
                            <ChevronDown className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                          ) : (
                            <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          )}
                          <TruncatedTooltip
                            text={item.division}
                            className={`truncate block min-w-0 ${
                              isSelected ? 'font-semibold text-indigo-800' : ''
                            }`}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right font-mono tabular-nums text-slate-900 font-semibold whitespace-nowrap">
                        {isEditing ? (
                          <input
                            type="number"
                            min="0"
                            step="50"
                            value={editingAmount}
                            onClick={e => e.stopPropagation()}
                            onChange={e => setEditingAmount(e.target.value)}
                            onKeyDown={e => {
                              if (e.key === 'Enter') handleSaveEdit(e, item);
                              if (e.key === 'Escape') {
                                e.stopPropagation();
                                setEditingId(null);
                              }
                            }}
                            aria-label={`Editar presupuesto de ${item.division}`}
                            className="w-24 text-right text-xs font-mono bg-white border border-indigo-400 rounded px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            autoFocus
                          />
                        ) : (
                          formatEur(item.raiseBudgetEur)
                        )}
                      </td>
                      <td className="px-2 py-2 text-right whitespace-nowrap">
                        {isEditing ? (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={e => handleSaveEdit(e, item)}
                              title="Guardar importe"
                              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded transition"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={e => {
                                e.stopPropagation();
                                setEditingId(null);
                              }}
                              title="Cancelar edición"
                              className="p-1 text-slate-400 hover:bg-slate-100 rounded transition"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={e => handleStartEdit(e, item)}
                              title={`Editar presupuesto de ${item.division}`}
                              className="p-1 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={e => handleDeleteRow(e, item)}
                              title={`Eliminar ${item.division}`}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td className="px-3 py-2 text-[11px] font-bold text-slate-700">
                    Total ({budgets.length} {budgets.length === 1 ? 'división' : 'divisiones'})
                  </td>
                  <td className="px-3 py-2 text-right font-mono tabular-nums text-xs font-extrabold text-indigo-700 whitespace-nowrap">
                    {formatEur(totalBudgetEur)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
        </div>
      )}

      {/* Selected Division Salary Raise Breakdown Panel */}
      {selectedBudget && selectedRecommendation && (
        <div className="border border-slate-200 rounded-lg bg-slate-50/60 p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0 flex items-center">
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">Reparto de Subidas — {selectedRecommendation.division}</span>
              </h4>
            </div>
            <div className="inline-flex items-center gap-1 shrink-0">
              {selectedRecommendation.canRecommend && (
                <TruncatedTooltip
                  text="Descargar Excel (.xlsx)"
                  onlyWhenTruncated={false}
                  className="inline-flex"
                >
                  <button
                    type="button"
                    onClick={handleDownloadBreakdownExcel}
                    aria-label="Descargar reparto en Excel (.xlsx)"
                    className="p-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded transition shrink-0"
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </TruncatedTooltip>
              )}
              <button
                type="button"
                onClick={() => setSelectedDivisionId(null)}
                title="Cerrar desglose"
                aria-label="Cerrar desglose"
                className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 rounded transition shrink-0"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {selectedRecommendation.totalEmployees === 0 ? (
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-500">
              No hay colaboradores asignados actualmente a <strong>{selectedRecommendation.division}</strong>.
            </div>
          ) : !selectedRecommendation.isDivisionClosed ? (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-900 space-y-1.5">
              <div className="font-semibold">
                Evaluaciones pendientes ({selectedRecommendation.closedCount}/{selectedRecommendation.totalEmployees} cerradas)
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Para calcular el reparto completo de la división, todas las evaluaciones deben estar en estado <strong>Closed</strong>.
              </p>
              <div className="pt-1 border-t border-amber-200/70 space-y-0.5 text-[11px]">
                {selectedRecommendation.pendingEmployees.map(p => (
                  <div key={p.employeeId} className="flex items-center justify-between gap-2">
                    <span className="font-medium truncate">{p.fullName} ({p.employeeId})</span>
                    <span className="text-amber-700 font-mono text-[10px] shrink-0">{p.statusLabel}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : !selectedRecommendation.canRecommend ? (
            <div className="bg-white border border-slate-200 rounded-lg p-3 text-xs text-slate-600">
              Todas las evaluaciones están cerradas, pero el presupuesto debe ser de al menos{' '}
              <span className="font-mono font-semibold">{MIN_SALARY_RAISE_EUR} €</span> para generar el reparto.
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
                <table className="w-full text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    <tr>
                      <th className="text-left px-2.5 py-1.5">Colaborador</th>
                      <th className="text-center px-1.5 py-1.5 w-10">Eval.</th>
                      <th className="text-right px-2 py-1.5 w-12">Nota</th>
                      <th className="text-right px-2.5 py-1.5 w-20">Subida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedRecommendation.items.map(item => {
                      const curLvl =
                        careerLevels.find(l => l.id === item.evaluation.currentLevelId)?.levelCode ||
                        item.evaluation.currentLevelId;
                      const tgtLvl =
                        careerLevels.find(l => l.id === item.evaluation.targetLevelId)?.levelCode ||
                        item.evaluation.targetLevelId;
                      const evalLabel = formatEvalResultLabel(item.evaluationResult);

                      return (
                        <tr key={item.employee.employeeId} className="hover:bg-slate-50/80">
                          <td className="px-2.5 py-1.5 min-w-0">
                            <div className="font-semibold text-slate-900 flex items-center gap-1 min-w-0">
                              <span className="truncate max-w-[140px]">
                                {item.employee.name} {item.employee.surname}
                              </span>
                              <EmployeeRecognitionIcons employee={item.employee} size="xs" />
                            </div>
                            <div className="text-[10px] text-slate-500 truncate">
                              {curLvl}
                              {item.isPromoted ? ` → ${tgtLvl} · Prom.` : ''}
                            </div>
                          </td>
                          <td className="px-1.5 py-1.5 text-center">
                            <TruncatedTooltip
                              text={evalLabel}
                              onlyWhenTruncated={false}
                              className="inline-flex items-center justify-center align-middle"
                            >
                              <span
                                tabIndex={0}
                                aria-label={evalLabel}
                                className="inline-flex items-center justify-center p-1 rounded hover:bg-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                              >
                                {renderEvalResultIcon(item.evaluationResult)}
                              </span>
                            </TruncatedTooltip>
                          </td>
                          <td className="px-2 py-1.5 text-right font-mono tabular-nums font-semibold text-slate-800 whitespace-nowrap">
                            {item.finalScore.toFixed(2)}
                          </td>
                          <td
                            className={`px-2.5 py-1.5 text-right font-mono tabular-nums whitespace-nowrap ${
                              item.recommendedRaiseEur > 0 ? 'text-emerald-700' : 'text-slate-400'
                            }`}
                          >
                            <div className="font-bold leading-tight">
                              {formatWholeEur(item.recommendedRaiseEur)}
                            </div>
                            <div
                              className={`text-[10px] font-semibold leading-tight ${
                                item.recommendedRaiseEur > 0 ? 'text-emerald-600/85' : 'text-slate-400'
                              }`}
                            >
                              {item.recommendedRaiseEur > 0
                                ? `+${item.salaryRaisePercent.toFixed(1)}%`
                                : '0.0%'}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200">
                    <tr>
                      <td colSpan={3} className="px-2.5 py-1.5 text-[11px] font-bold text-slate-700">
                        Total ({selectedRecommendation.totalEmployees} colab. · {selectedRecommendation.promotedCount} prom.)
                      </td>
                      <td className="px-2.5 py-1.5 text-right font-mono tabular-nums text-xs font-extrabold text-indigo-700 whitespace-nowrap">
                        {formatWholeEur(selectedRecommendation.totalAllocatedEur)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              {selectedRecommendation.unallocatedRemainderEur > 0 && (
                <p className="text-[10px] text-slate-500">
                  Remanente no asignable en bloques de {SALARY_RAISE_STEP_EUR} €:{' '}
                  <span className="font-mono font-semibold">
                    {formatEur(selectedRecommendation.unallocatedRemainderEur)}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
