import React, { useRef, useState } from 'react';
import { EspressoShot, BeanBag, BrewPreset, GrinderProfile, MachineProfile, BasketProfile, WaterRecipe, WaterConcentrateBatches } from '../types/espresso';
import { UserEquipment } from '../utils/sampleData';
import { calculateActualFlowRate } from '../utils/coffeeCalculations';
import { importDatabaseFromCsv } from '../utils/csvImport';
import { X, Download, Upload, RotateCcw, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';

interface DataManagementModalProps {
  shots: EspressoShot[];
  beans: BeanBag[];
  presets: BrewPreset[];
  grinders: GrinderProfile[];
  machines: MachineProfile[];
  baskets: BasketProfile[];
  waterRecipes: WaterRecipe[];
  waterConcentrateBatches: WaterConcentrateBatches;
  equipment: UserEquipment;
  onImportData: (data: {
    shots?: EspressoShot[];
    beans?: BeanBag[];
    presets?: BrewPreset[];
    grinders?: GrinderProfile[];
    machines?: MachineProfile[];
    baskets?: BasketProfile[];
    waterRecipes?: WaterRecipe[];
    waterConcentrateBatches?: WaterConcentrateBatches;
    equipment?: UserEquipment;
    notice?: string;
  }) => void;
  onResetDefaults: () => void;
  onClose: () => void;
}

export const DataManagementModal: React.FC<DataManagementModalProps> = ({
  shots,
  beans,
  presets,
  grinders,
  machines,
  baskets,
  waterRecipes,
  waterConcentrateBatches,
  equipment,
  onImportData,
  onResetDefaults,
  onClose,
}) => {
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const csvFileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);

  // CSV Generator
  const handleExportCSV = () => {
    const headers = [
      'Timestamp',
      'Bean Name',
      'Roaster',
      'Dose (g)',
      'Yield (g)',
      'Ratio',
      'Total Time (s)',
      'Pre-infusion (s)',
      'Avg Flow Rate (g/s)',
      'Actual Flow Rate (g/s)',
      'Grinder',
      'Grind Setting (Dial)',
      'Zero Setting',
      'Actual Setting',
      'Machine',
      'Basket',
      'Water Temp (C)',
      'Pressure (bar)',
      'Water Recipe',
      'Channeling',
      'Score (1-5)',
      'Dialed In',
      'Flavor Tags',
      'Notes',
    ];

    const escapeCsv = (val: string | number | undefined | null) =>
      `"${String(val ?? '').replace(/"/g, '""')}"`;

    const rows = shots.map((s) => [
      escapeCsv(s.timestamp),
      escapeCsv(s.beanName),
      escapeCsv(s.roaster),
      s.doseGrams,
      s.yieldGrams,
      s.ratio,
      s.totalTimeSeconds,
      s.preInfusionSeconds,
      s.flowRate,
      s.actualFlowRate ?? calculateActualFlowRate(s.yieldGrams, s.totalTimeSeconds, s.preInfusionSeconds),
      escapeCsv(s.grinder),
      escapeCsv(s.grindSetting),
      s.zeroSetting ?? '',
      s.actualSetting ?? '',
      escapeCsv(s.machine),
      escapeCsv(s.basket),
      s.waterTempC,
      s.peakPressureBars,
      escapeCsv(s.waterRecipeName || ''),
      escapeCsv(s.channeling),
      s.rating,
      s.isDialedIn ? 'YES' : 'NO',
      escapeCsv(s.flavorTags.join('; ')),
      escapeCsv(s.notes || ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `espresso_extraction_telemetry_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // JSON Generator
  const handleExportJSON = () => {
    const data = {
      version: '1.4',
      exportedAt: new Date().toISOString(),
      beans,
      grinders,
      machines,
      baskets,
      waterRecipes,
      waterConcentrateBatches,
      equipment,
      shots,
      presets,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `extractionlab_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleJsonUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setFeedback(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (json.shots || json.beans || json.grinders || json.machines || json.baskets || json.waterRecipes || json.waterConcentrateBatches || json.equipment || json.presets) {
          const shotCount = Array.isArray(json.shots) ? json.shots.length : 0;
          const beanCount = Array.isArray(json.beans) ? json.beans.length : 0;
          onImportData({
            shots: json.shots,
            beans: json.beans,
            presets: json.presets,
            grinders: json.grinders,
            machines: json.machines,
            baskets: json.baskets,
            waterRecipes: json.waterRecipes,
            waterConcentrateBatches: json.waterConcentrateBatches,
            equipment: json.equipment,
            notice: `JSON backup imported (${shotCount} shots, ${beanCount} bean bags)`,
          });
          onClose();
        } else {
          setFeedback({
            type: 'error',
            message: 'Invalid JSON backup format: missing shots, beans, or equipment records.',
          });
        }
      } catch {
        setFeedback({
          type: 'error',
          message: 'Failed to parse JSON file. Please verify the file is valid JSON.',
        });
      }
    };
    reader.readAsText(file);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setFeedback(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const csvText = String(event.target?.result ?? '');
        const result = importDatabaseFromCsv(csvText, {
          beans,
          grinders,
          machines,
          baskets,
          waterRecipes,
        });
        const extras: string[] = [];
        if (result.summary.newBeans > 0) extras.push(`${result.summary.newBeans} new bean(s)`);
        if (result.summary.newGrinders > 0) extras.push(`${result.summary.newGrinders} new grinder(s)`);
        if (result.summary.newMachines > 0) extras.push(`${result.summary.newMachines} new machine(s)`);
        if (result.summary.newBaskets > 0) extras.push(`${result.summary.newBaskets} new basket(s)`);
        if (result.summary.newWaterRecipes > 0) extras.push(`${result.summary.newWaterRecipes} new water recipe(s)`);
        const suffix = extras.length > 0 ? ` · added ${extras.join(', ')}` : '';
        onImportData({
          shots: result.shots,
          beans: result.beans,
          grinders: result.grinders,
          machines: result.machines,
          baskets: result.baskets,
          waterRecipes: result.waterRecipes,
          notice: `Imported ${result.summary.shotCount} shot(s) from CSV${suffix}`,
        });
        onClose();
      } catch (err) {
        setFeedback({
          type: 'error',
          message: err instanceof Error ? err.message : 'Failed to import CSV file.',
        });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#141822] border border-slate-800 rounded-xl max-w-md w-full shadow-2xl space-y-5 p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-base font-bold text-white">Data Backup & Export</h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Export extraction logs or restore from backup files.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          {/* CSV Export */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center justify-between gap-3">
            <div>
              <h4 className="font-semibold text-white flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Export to CSV Spreadsheet</span>
              </h4>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Full telemetry table for Excel, Google Sheets, or coffee analysis notebooks.
              </p>
            </div>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-md shrink-0 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV</span>
            </button>
          </div>

          {/* JSON Backup */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-lg flex items-center justify-between gap-3">
            <div>
              <h4 className="font-semibold text-white flex items-center gap-1.5">
                <Download className="w-4 h-4 text-amber-400" />
                <span>Download Full JSON Backup</span>
              </h4>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Includes all beans, shots, custom recipes, and taste radar archives.
              </p>
            </div>
            <button
              onClick={handleExportJSON}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium rounded-md shrink-0 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
          </div>

          {feedback && (
            <div
              className={`p-3 rounded-lg border flex items-start gap-2 text-xs ${
                feedback.type === 'error'
                  ? 'bg-rose-950/30 border-rose-500/40 text-rose-200'
                  : 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
              }`}
            >
              {feedback.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* CSV / JSON Import */}
          <div className="p-3.5 bg-slate-900/80 border border-slate-800 rounded-lg space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-semibold text-white flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-cyan-400" />
                  <span>Import Database (CSV or JSON)</span>
                </h4>
                <p className="text-slate-400 text-[11px] mt-0.5">
                  Restore a full JSON backup or import an ExtractionLab CSV spreadsheet. CSV imports automatically match or add beans and equipment.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                ref={csvFileInputRef}
                type="file"
                accept=".csv,text/csv"
                onChange={handleCsvUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => csvFileInputRef.current?.click()}
                className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-300 border border-slate-700 font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Import CSV</span>
              </button>

              <input
                ref={jsonFileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleJsonUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => jsonFileInputRef.current?.click()}
                className="flex-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 font-medium rounded-md flex items-center justify-center gap-1.5 transition-colors"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON</span>
              </button>
            </div>
          </div>

          {/* Factory Reset */}
          <div className="p-3.5 bg-rose-950/20 border border-rose-500/20 rounded-lg flex items-center justify-between gap-3">
            <div>
              <h4 className="font-semibold text-rose-300 flex items-center gap-1.5">
                <RotateCcw className="w-4 h-4" />
                <span>Reset to Sample Data</span>
              </h4>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Restores the sample specialty coffees and dial-in progression trials.
              </p>
            </div>
            <button
              onClick={() => {
                if (window.confirm('Reset all shots, beans, and recipes to initial sample data?')) {
                  onResetDefaults();
                  onClose();
                }
              }}
              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border border-rose-500/30 font-medium rounded-md shrink-0"
            >
              Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
