import React, { useMemo, useState } from 'react';
import {
  WaterBaseType,
  WaterRecipe,
  WaterConcentrateBatches,
  EspressoShot,
} from '../types/espresso';
import {
  BASE_WATER_MINERALS,
  calculateWaterChemistry,
  ConcentrateStorageStatus,
  DEFAULT_BUFFER_CONCENTRATE,
  DEFAULT_MAGNESIUM_CONCENTRATE,
  getConcentrateStorageStatus,
  getTodayLocalDateInput,
  stepAdjustNumber,
} from '../utils/coffeeCalculations';
import { NumericInput } from './NumericInput';
import {
  Droplets,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  FlaskConical,
  Scale,
  Sliders,
  Copy,
  Coffee,
  X,
  Calendar,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

interface WaterRecipesViewProps {
  waterRecipes: WaterRecipe[];
  shots: EspressoShot[];
  activeWaterRecipeId: string;
  concentrateBatches: WaterConcentrateBatches;
  onUpdateConcentrateBatches: (batches: WaterConcentrateBatches) => void;
  onSetActiveWaterRecipe: (id: string) => void;
  onSaveWaterRecipe: (recipe: WaterRecipe) => void;
  onDeleteWaterRecipe: (id: string) => void;
  onLogShotWithWater: (id: string) => void;
}

const WATER_BASE_OPTIONS: WaterBaseType[] = [
  'Montcalm',
  'Spa Reine',
  'Distilled / RO',
  'Filtered Tap',
  'Other',
];

const QUICK_VOLUMES = [0.5, 1.0, 1.5, 2.0, 5.0];

export const WaterRecipesView: React.FC<WaterRecipesViewProps> = ({
  waterRecipes,
  shots,
  activeWaterRecipeId,
  concentrateBatches,
  onUpdateConcentrateBatches,
  onSetActiveWaterRecipe,
  onSaveWaterRecipe,
  onDeleteWaterRecipe,
  onLogShotWithWater,
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingRecipe, setEditingRecipe] = useState<WaterRecipe | null>(null);

  const todayDateStr = getTodayLocalDateInput();
  const mgStorage = getConcentrateStorageStatus(concentrateBatches.magnesiumPreparedDate);
  const bufStorage = getConcentrateStorageStatus(concentrateBatches.bufferPreparedDate);

  const getStorageBadgeClasses = (level: ConcentrateStorageStatus['level']) => {
    switch (level) {
      case 'safe':
        return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
      case 'caution':
        return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
      case 'replace':
        return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
      default:
        return 'bg-slate-800/80 text-slate-400 border-slate-700';
    }
  };

  const renderStorageIcon = (level: ConcentrateStorageStatus['level']) => {
    if (level === 'safe') return <ShieldCheck className="w-3 h-3 shrink-0" />;
    if (level === 'caution') return <AlertTriangle className="w-3 h-3 shrink-0" />;
    if (level === 'replace') return <ShieldAlert className="w-3 h-3 shrink-0" />;
    return <Calendar className="w-3 h-3 shrink-0" />;
  };

  // Batch Calculator State
  const activeRecipe =
    waterRecipes.find((r) => r.id === activeWaterRecipeId) ?? waterRecipes[0];
  const [calcRecipeId, setCalcRecipeId] = useState<string>(
    activeRecipe?.id ?? ''
  );
  const [calcVolumeLiters, setCalcVolumeLiters] = useState<number>(
    activeRecipe?.batchVolumeLiters ?? 1.5
  );

  const calcRecipe =
    waterRecipes.find((r) => r.id === calcRecipeId) ?? activeRecipe;

  // Form Modal State
  const [name, setName] = useState<string>('');
  const [baseWater, setBaseWater] = useState<WaterBaseType>('Montcalm');
  const [batchVolumeLiters, setBatchVolumeLiters] = useState<number>(1.5);
  const [magnesiumDoseGrams, setMagnesiumDoseGrams] = useState<number>(9.0);
  const [bufferDoseGrams, setBufferDoseGrams] = useState<number>(5.0);
  const [mgSaltName, setMgSaltName] = useState<string>(DEFAULT_MAGNESIUM_CONCENTRATE.salt);
  const [mgSaltGrams, setMgSaltGrams] = useState<number>(DEFAULT_MAGNESIUM_CONCENTRATE.saltGrams);
  const [mgSolutionGrams, setMgSolutionGrams] = useState<number>(
    DEFAULT_MAGNESIUM_CONCENTRATE.totalSolutionGrams
  );
  const [bufSaltName, setBufSaltName] = useState<string>(DEFAULT_BUFFER_CONCENTRATE.salt);
  const [bufSaltGrams, setBufSaltGrams] = useState<number>(DEFAULT_BUFFER_CONCENTRATE.saltGrams);
  const [bufSolutionGrams, setBufSolutionGrams] = useState<number>(
    DEFAULT_BUFFER_CONCENTRATE.totalSolutionGrams
  );
  const [showConcentrateEditor, setShowConcentrateEditor] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');

  const openCreateModal = (fromRecipe?: WaterRecipe) => {
    setEditingRecipe(null);
    if (fromRecipe) {
      setName(`${fromRecipe.name} (Tuned)`);
      setBaseWater(fromRecipe.baseWater);
      setBatchVolumeLiters(fromRecipe.batchVolumeLiters);
      setMagnesiumDoseGrams(fromRecipe.magnesiumDoseGrams);
      setBufferDoseGrams(fromRecipe.bufferDoseGrams);
      setMgSaltName(
        fromRecipe.magnesiumConcentrate?.salt ?? DEFAULT_MAGNESIUM_CONCENTRATE.salt
      );
      setMgSaltGrams(
        fromRecipe.magnesiumConcentrate?.saltGrams ?? DEFAULT_MAGNESIUM_CONCENTRATE.saltGrams
      );
      setMgSolutionGrams(
        fromRecipe.magnesiumConcentrate?.totalSolutionGrams ??
          DEFAULT_MAGNESIUM_CONCENTRATE.totalSolutionGrams
      );
      setBufSaltName(
        fromRecipe.bufferConcentrate?.salt ?? DEFAULT_BUFFER_CONCENTRATE.salt
      );
      setBufSaltGrams(
        fromRecipe.bufferConcentrate?.saltGrams ?? DEFAULT_BUFFER_CONCENTRATE.saltGrams
      );
      setBufSolutionGrams(
        fromRecipe.bufferConcentrate?.totalSolutionGrams ??
          DEFAULT_BUFFER_CONCENTRATE.totalSolutionGrams
      );
      setNotes(fromRecipe.notes ?? '');
    } else {
      setName('');
      setBaseWater('Montcalm');
      setBatchVolumeLiters(1.5);
      setMagnesiumDoseGrams(9.0);
      setBufferDoseGrams(5.0);
      setMgSaltName(DEFAULT_MAGNESIUM_CONCENTRATE.salt);
      setMgSaltGrams(DEFAULT_MAGNESIUM_CONCENTRATE.saltGrams);
      setMgSolutionGrams(DEFAULT_MAGNESIUM_CONCENTRATE.totalSolutionGrams);
      setBufSaltName(DEFAULT_BUFFER_CONCENTRATE.salt);
      setBufSaltGrams(DEFAULT_BUFFER_CONCENTRATE.saltGrams);
      setBufSolutionGrams(DEFAULT_BUFFER_CONCENTRATE.totalSolutionGrams);
      setNotes('');
    }
    setShowConcentrateEditor(false);
    setIsModalOpen(true);
  };

  const openEditModal = (recipe: WaterRecipe) => {
    setEditingRecipe(recipe);
    setName(recipe.name);
    setBaseWater(recipe.baseWater);
    setBatchVolumeLiters(recipe.batchVolumeLiters);
    setMagnesiumDoseGrams(recipe.magnesiumDoseGrams);
    setBufferDoseGrams(recipe.bufferDoseGrams);
    setMgSaltName(
      recipe.magnesiumConcentrate?.salt ?? DEFAULT_MAGNESIUM_CONCENTRATE.salt
    );
    setMgSaltGrams(
      recipe.magnesiumConcentrate?.saltGrams ?? DEFAULT_MAGNESIUM_CONCENTRATE.saltGrams
    );
    setMgSolutionGrams(
      recipe.magnesiumConcentrate?.totalSolutionGrams ??
        DEFAULT_MAGNESIUM_CONCENTRATE.totalSolutionGrams
    );
    setBufSaltName(
      recipe.bufferConcentrate?.salt ?? DEFAULT_BUFFER_CONCENTRATE.salt
    );
    setBufSaltGrams(
      recipe.bufferConcentrate?.saltGrams ?? DEFAULT_BUFFER_CONCENTRATE.saltGrams
    );
    setBufSolutionGrams(
      recipe.bufferConcentrate?.totalSolutionGrams ??
        DEFAULT_BUFFER_CONCENTRATE.totalSolutionGrams
    );
    setNotes(recipe.notes ?? '');
    setShowConcentrateEditor(false);
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload: WaterRecipe = {
      id: editingRecipe?.id ?? `water-${Date.now()}`,
      name: name.trim(),
      baseWater,
      batchVolumeLiters: Math.max(0.1, Number(batchVolumeLiters) || 1.5),
      magnesiumDoseGrams: Math.max(0, Number(magnesiumDoseGrams) || 0),
      bufferDoseGrams: Math.max(0, Number(bufferDoseGrams) || 0),
      magnesiumConcentrate: {
        salt: mgSaltName.trim() || DEFAULT_MAGNESIUM_CONCENTRATE.salt,
        saltGrams: Math.max(0.1, Number(mgSaltGrams) || DEFAULT_MAGNESIUM_CONCENTRATE.saltGrams),
        totalSolutionGrams: Math.max(
          1,
          Number(mgSolutionGrams) || DEFAULT_MAGNESIUM_CONCENTRATE.totalSolutionGrams
        ),
      },
      bufferConcentrate: {
        salt: bufSaltName.trim() || DEFAULT_BUFFER_CONCENTRATE.salt,
        saltGrams: Math.max(0.1, Number(bufSaltGrams) || DEFAULT_BUFFER_CONCENTRATE.saltGrams),
        totalSolutionGrams: Math.max(
          1,
          Number(bufSolutionGrams) || DEFAULT_BUFFER_CONCENTRATE.totalSolutionGrams
        ),
      },
      notes: notes.trim() || undefined,
      isDefault: editingRecipe?.isDefault ?? false,
      createdAt: editingRecipe?.createdAt ?? new Date().toISOString(),
    };

    onSaveWaterRecipe(payload);
    setIsModalOpen(false);
    setEditingRecipe(null);
  };

  const previewChemistry = useMemo(
    () =>
      calculateWaterChemistry({
        baseWater,
        batchVolumeLiters,
        magnesiumDoseGrams,
        bufferDoseGrams,
        magnesiumConcentrate: {
          salt: mgSaltName,
          saltGrams: mgSaltGrams,
          totalSolutionGrams: mgSolutionGrams,
        },
        bufferConcentrate: {
          salt: bufSaltName,
          saltGrams: bufSaltGrams,
          totalSolutionGrams: bufSolutionGrams,
        },
      }),
    [
      baseWater,
      batchVolumeLiters,
      magnesiumDoseGrams,
      bufferDoseGrams,
      mgSaltName,
      mgSaltGrams,
      mgSolutionGrams,
      bufSaltName,
      bufSaltGrams,
      bufSolutionGrams,
    ]
  );

  const scaledMix = useMemo(() => {
    if (!calcRecipe) return null;
    const ratio =
      calcRecipe.batchVolumeLiters > 0
        ? Math.max(0.1, calcVolumeLiters) / calcRecipe.batchVolumeLiters
        : 1;
    const mgDose = Number((calcRecipe.magnesiumDoseGrams * ratio).toFixed(2));
    const bufDose = Number((calcRecipe.bufferDoseGrams * ratio).toFixed(2));
    const chem = calculateWaterChemistry({
      baseWater: calcRecipe.baseWater,
      batchVolumeLiters: calcVolumeLiters,
      magnesiumDoseGrams: mgDose,
      bufferDoseGrams: bufDose,
      magnesiumConcentrate: calcRecipe.magnesiumConcentrate,
      bufferConcentrate: calcRecipe.bufferConcentrate,
    });
    return { mgDose, bufDose, chem };
  }, [calcRecipe, calcVolumeLiters]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-[#141822] border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-medium text-sky-400 uppercase tracking-wider">
            Remineralization & Water Chemistry
          </span>
          <h2 className="text-lg font-bold text-white mt-0.5 flex items-center gap-2">
            <Droplets className="w-5 h-5 text-sky-400" />
            <span>Espresso Water Recipes</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Save custom concentrate doses for ultra-soft water (Montcalm / Spa Reine) and link them directly to shots.
          </p>
        </div>

        <button
          type="button"
          onClick={() => openCreateModal()}
          className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Water Recipe</span>
        </button>
      </div>

      {/* Concentrates, Tuning Rules & Live Bottle Mixing Calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Stock Concentrates & Tuning Rules */}
        <div className="lg:col-span-2 bg-[#141822] border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-semibold text-white">
                DIY Refrigerated Stock Concentrates & Tuning Rules
              </h3>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
              Near-Zero Scale Risk
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {/* Concentrate 1: Magnesium */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3.5 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sky-300">Concentrate 1: Magnesium</span>
                  <span className="text-[10px] font-mono text-slate-400">Extraction / Body</span>
                </div>
                <div className="font-mono text-white text-sm font-bold">
                  12.3 g Epsom Salt → 500 g total
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Kruidvat Bitterzout (MgSO₄·7H₂O) topped up to 500 g with Montcalm or Spa Reine. Store in fridge.
                </p>
                <div className="text-[11px] text-sky-200/90 bg-sky-500/10 border border-sky-500/20 rounded-md px-2.5 py-1.5 leading-snug">
                  <strong className="font-mono text-sky-300">Dissolution:</strong> Shake vigorously for <strong className="text-white">20–30 sec</strong> at room temp until all crystals disappear and the liquid is completely clear.
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label
                    htmlFor="mg-prepared-date"
                    className="text-[11px] font-mono text-slate-300 flex items-center gap-1"
                  >
                    <Calendar className="w-3 h-3 text-sky-400" />
                    <span>Prepared Date</span>
                  </label>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${getStorageBadgeClasses(
                      mgStorage.level
                    )}`}
                  >
                    {renderStorageIcon(mgStorage.level)}
                    <span>{mgStorage.badgeText}</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    id="mg-prepared-date"
                    type="date"
                    max={todayDateStr}
                    value={concentrateBatches.magnesiumPreparedDate}
                    onChange={(e) =>
                      onUpdateConcentrateBatches({
                        ...concentrateBatches,
                        magnesiumPreparedDate: e.target.value,
                      })
                    }
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1 text-[11px] font-mono text-white focus:outline-none focus:border-sky-400"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateConcentrateBatches({
                        ...concentrateBatches,
                        magnesiumPreparedDate: todayDateStr,
                      })
                    }
                    className="px-2.5 py-1 rounded-md bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 text-[11px] font-mono font-medium transition-colors shrink-0"
                  >
                    Today
                  </button>
                  {concentrateBatches.magnesiumPreparedDate && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateConcentrateBatches({
                          ...concentrateBatches,
                          magnesiumPreparedDate: '',
                        })
                      }
                      title="Clear preparation date"
                      aria-label="Clear Magnesium preparation date"
                      className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed">{mgStorage.guidance}</p>
              </div>
            </div>

            {/* Concentrate 2: Buffer */}
            <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-3.5 space-y-2.5 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-amber-300">Concentrate 2: Buffer</span>
                  <span className="text-[10px] font-mono text-slate-400">Acidity Control</span>
                </div>
                <div className="font-mono text-white text-sm font-bold">
                  8.4 g Baking Soda → 500 g total
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Kruidvat Zuiveringszout (NaHCO₃) topped up to 500 g with Montcalm or Spa Reine. Store in fridge.
                </p>
                <div className="text-[11px] text-amber-200/90 bg-amber-500/10 border border-amber-500/20 rounded-md px-2.5 py-1.5 leading-snug">
                  <strong className="font-mono text-amber-300">Dissolution:</strong> Shake vigorously for <strong className="text-white">60–90 sec</strong> at room temp, let settle 15 sec to check bottom, and shake another 15–30 sec until no white powder remains.
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-800/80 space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label
                    htmlFor="buf-prepared-date"
                    className="text-[11px] font-mono text-slate-300 flex items-center gap-1"
                  >
                    <Calendar className="w-3 h-3 text-amber-400" />
                    <span>Prepared Date</span>
                  </label>
                  <span
                    className={`text-[10px] font-mono px-2 py-0.5 rounded border flex items-center gap-1 ${getStorageBadgeClasses(
                      bufStorage.level
                    )}`}
                  >
                    {renderStorageIcon(bufStorage.level)}
                    <span>{bufStorage.badgeText}</span>
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <input
                    id="buf-prepared-date"
                    type="date"
                    max={todayDateStr}
                    value={concentrateBatches.bufferPreparedDate}
                    onChange={(e) =>
                      onUpdateConcentrateBatches({
                        ...concentrateBatches,
                        bufferPreparedDate: e.target.value,
                      })
                    }
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1 text-[11px] font-mono text-white focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateConcentrateBatches({
                        ...concentrateBatches,
                        bufferPreparedDate: todayDateStr,
                      })
                    }
                    className="px-2.5 py-1 rounded-md bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 text-[11px] font-mono font-medium transition-colors shrink-0"
                  >
                    Today
                  </button>
                  {concentrateBatches.bufferPreparedDate && (
                    <button
                      type="button"
                      onClick={() =>
                        onUpdateConcentrateBatches({
                          ...concentrateBatches,
                          bufferPreparedDate: '',
                        })
                      }
                      title="Clear preparation date"
                      aria-label="Clear Buffer preparation date"
                      className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <p className="text-[10px] text-slate-400 leading-relaxed">{bufStorage.guidance}</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800/80 rounded-lg p-3 text-xs space-y-1.5">
            <div className="font-mono text-[11px] uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-400" />
              <span>Tuning Rules (±1.0–1.5 g per 1.5 L bottle)</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-300">
              <div>
                <span className="text-amber-300 font-mono font-semibold">+Buffer</span> reduces sourness/acidity ·{' '}
                <span className="text-sky-300 font-mono font-semibold">−Buffer</span> increases brightness/clarity
              </div>
              <div>
                <span className="text-amber-300 font-mono font-semibold">+Magnesium</span> boosts body/sweetness/extraction ·{' '}
                <span className="text-sky-300 font-mono font-semibold">−Magnesium</span> cuts bitterness/astringency
              </div>
            </div>
          </div>

          {/* Chlorine-Free Cold Storage & Biofilm Prevention Guide */}
          <div className="bg-slate-900/60 border border-amber-500/20 rounded-lg p-3.5 text-xs space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-mono text-[11px] uppercase tracking-wider text-amber-300 flex items-center gap-1.5 font-semibold">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span>Chlorine-Free Fridge Shelf Life & Biofilm Prevention (≤ 4 °C)</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">
                Safe target: 3 weeks (max 30 days)
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Bottled Montcalm and Spa Reine contain <strong className="text-white">zero residual chlorine</strong>, and dilute Epsom salt (~2.5%) or baking soda (~1.7%) are not antimicrobial. Cold-tolerant bacteria introduced from air or dosing tools can gradually colonize bottle walls and form biofilm even in a refrigerator.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px]">
              <div className="bg-emerald-950/20 border border-emerald-500/25 rounded-md p-2">
                <div className="font-mono font-semibold text-emerald-300">0–21 Days · Safe</div>
                <p className="text-slate-400 mt-0.5 leading-snug">
                  Prime window in a clean sealed glass bottle at ≤ 4 °C with clean pouring.
                </p>
              </div>
              <div className="bg-amber-950/20 border border-amber-500/25 rounded-md p-2">
                <div className="font-mono font-semibold text-amber-300">22–30 Days · Caution</div>
                <p className="text-slate-400 mt-0.5 leading-snug">
                  Check against light for faint haze or slickness inside neck; plan a fresh batch.
                </p>
              </div>
              <div className="bg-rose-950/20 border border-rose-500/25 rounded-md p-2">
                <div className="font-mono font-semibold text-rose-300">&gt; 30 Days · Remake</div>
                <p className="text-slate-400 mt-0.5 leading-snug">
                  Biofilm risk rises sharply. Discard leftovers, wash &amp; boil-sanitize bottle, and remix.
                </p>
              </div>
            </div>

            <div className="text-[11px] text-slate-400 space-y-1 pt-0.5">
              <div>
                <strong className="text-slate-200">Hygiene tip:</strong> Store in <strong className="text-slate-300">glass</strong> (not scratched plastic) and <strong className="text-slate-300">pour</strong> into a clean dosing cup on your scale rather than dipping pipettes or spoons into the stock bottle.
              </div>
              <div>
                <strong className="text-slate-200">Batch sizing:</strong> A 500 g bottle yields ~83 L (Mg) / ~150 L (Buffer) at 9 g / 5 g per 1.5 L. If you brew less than ~15 L/month, mixing <strong className="text-slate-300">250 g half-batches</strong> (6.15 g Epsom / 4.2 g baking soda) avoids wasting expired stock.
              </div>
            </div>
          </div>
        </div>

        {/* Live Bottle Mixing Calculator */}
        <div className="bg-[#141822] border border-sky-500/30 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2.5">
              <Scale className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-semibold text-white">Bottle Dose Calculator</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Recipe to Mix</label>
                <select
                  value={calcRecipe?.id ?? ''}
                  onChange={(e) => setCalcRecipeId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
                >
                  {waterRecipes.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] text-slate-400">Bottle Volume (L)</label>
                  <div className="flex items-center gap-1">
                    {QUICK_VOLUMES.map((vol) => (
                      <button
                        key={vol}
                        type="button"
                        onClick={() => setCalcVolumeLiters(vol)}
                        className={`px-1.5 py-0.5 rounded text-[10px] font-mono border transition-colors ${
                          Math.abs(calcVolumeLiters - vol) < 0.01
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {vol}L
                      </button>
                    ))}
                  </div>
                </div>
                <NumericInput
                  step="0.1"
                  min="0.1"
                  value={calcVolumeLiters}
                  onChangeValue={setCalcVolumeLiters}
                  emptyFallback={calcRecipe?.batchVolumeLiters ?? 1.5}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-1.5 text-xs font-mono text-white focus:outline-none focus:border-sky-500"
                />
              </div>
            </div>
          </div>

          {scaledMix && calcRecipe && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3.5 space-y-2.5 font-mono">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Magnesium Conc.</span>
                <strong className="text-sky-300 text-base">{scaledMix.mgDose.toFixed(1)} g</strong>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Buffer Conc.</span>
                <strong className="text-amber-300 text-base">{scaledMix.bufDose.toFixed(1)} g</strong>
              </div>
              <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span>Est. GH: {scaledMix.chem.totalGhPpm.toFixed(0)} ppm</span>
                <span>Est. HCO₃⁻: {scaledMix.chem.totalBicarbonateMgL.toFixed(0)} mg/L</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Saved Water Recipes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {waterRecipes.map((recipe) => {
          const isActive = recipe.id === activeWaterRecipeId;
          const chem = calculateWaterChemistry({
            baseWater: recipe.baseWater,
            batchVolumeLiters: recipe.batchVolumeLiters,
            magnesiumDoseGrams: recipe.magnesiumDoseGrams,
            bufferDoseGrams: recipe.bufferDoseGrams,
            magnesiumConcentrate: recipe.magnesiumConcentrate,
            bufferConcentrate: recipe.bufferConcentrate,
          });
          const recipeShots = shots.filter(
            (s) => s.waterRecipeId === recipe.id || s.waterRecipeName === recipe.name
          );

          return (
            <div
              key={recipe.id}
              className={`bg-[#141822] border rounded-xl p-5 flex flex-col justify-between transition-all ${
                isActive
                  ? 'border-sky-500/60 shadow-[0_0_20px_-6px_rgba(56,189,248,0.25)]'
                  : 'border-slate-800 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-mono font-medium text-sky-400 uppercase tracking-wide">
                        {recipe.baseWater} · {recipe.batchVolumeLiters}L
                      </span>
                      {isActive && (
                        <span className="text-[10px] font-mono bg-sky-500/15 text-sky-300 border border-sky-500/30 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active Default</span>
                        </span>
                      )}
                    </div>
                    <h3 className="font-bold text-sm text-white mt-1">{recipe.name}</h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openCreateModal(recipe)}
                      title="Duplicate & tune this water recipe"
                      className="p-1.5 text-slate-400 hover:text-sky-300 rounded hover:bg-slate-800 transition-colors"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => openEditModal(recipe)}
                      title="Edit water recipe"
                      className="p-1.5 text-slate-400 hover:text-amber-300 rounded hover:bg-slate-800 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {waterRecipes.length > 1 && (
                      <button
                        type="button"
                        onClick={() => onDeleteWaterRecipe(recipe.id)}
                        title="Delete water recipe"
                        className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Dosing Telemetry Grid */}
                <div className="grid grid-cols-2 gap-2 my-3.5 text-center font-mono bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">
                      Mg Conc. / {recipe.batchVolumeLiters}L
                    </span>
                    <strong className="text-sky-300 text-sm font-bold">
                      {recipe.magnesiumDoseGrams.toFixed(1)} g
                    </strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">
                      Buffer Conc. / {recipe.batchVolumeLiters}L
                    </span>
                    <strong className="text-amber-300 text-sm font-bold">
                      {recipe.bufferDoseGrams.toFixed(1)} g
                    </strong>
                  </div>
                  <div className="pt-2 border-t border-slate-800/70">
                    <span className="text-[10px] text-slate-500 block uppercase">Est. Total GH</span>
                    <span className="text-slate-200 text-xs font-semibold">
                      {chem.totalGhPpm.toFixed(0)} ppm CaCO₃
                    </span>
                  </div>
                  <div className="pt-2 border-t border-slate-800/70">
                    <span className="text-[10px] text-slate-500 block uppercase">Est. Buffer (HCO₃⁻)</span>
                    <span className="text-slate-200 text-xs font-semibold">
                      {chem.totalBicarbonateMgL.toFixed(0)} mg/L
                    </span>
                  </div>
                </div>

                {recipe.notes && (
                  <p className="text-xs text-slate-400 leading-relaxed mb-3">{recipe.notes}</p>
                )}

                <div className="text-[11px] font-mono text-slate-500">
                  Logged with this water: <strong className="text-slate-300">{recipeShots.length}</strong>{' '}
                  {recipeShots.length === 1 ? 'shot' : 'shots'}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 mt-4 flex items-center justify-between gap-2 text-xs">
                {!isActive ? (
                  <button
                    type="button"
                    onClick={() => onSetActiveWaterRecipe(recipe.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-medium transition-colors"
                  >
                    Set Default
                  </button>
                ) : (
                  <span className="text-[11px] font-mono text-sky-400">Used for new shots</span>
                )}

                <button
                  type="button"
                  onClick={() => onLogShotWithWater(recipe.id)}
                  className="px-3 py-1.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Log Shot</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Water Recipe Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#141822] border border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4 my-4">
            <div className="pb-3 border-b border-slate-800 flex items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">
                  {editingRecipe ? 'Edit Water Recipe' : 'Create Water Recipe'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Configure your base water, bottle batch size, and Magnesium / Buffer concentrate doses.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">Recipe Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Montcalm Light Roast (9g Mg / 4g Buf)"
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Base Water</label>
                  <select
                    value={baseWater}
                    onChange={(e) => setBaseWater(e.target.value as WaterBaseType)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-2 text-white focus:outline-none focus:border-sky-500"
                  >
                    {WATER_BASE_OPTIONS.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-900/50 border border-slate-800 rounded-lg px-3 py-2">
                <strong className="text-slate-300">{baseWater}:</strong>{' '}
                {BASE_WATER_MINERALS[baseWater].description}
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">
                  Bottle / Batch Volume (L)
                </label>
                <NumericInput
                  step="0.1"
                  min="0.1"
                  required
                  value={batchVolumeLiters}
                  onChangeValue={setBatchVolumeLiters}
                  emptyFallback={editingRecipe?.batchVolumeLiters ?? 1.5}
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white font-mono focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Concentrate Doses with ±0.5g tuning controls */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2">
                  <label className="block text-sky-300 font-semibold">
                    Magnesium Conc. (g)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setMagnesiumDoseGrams((v) => Math.max(0, stepAdjustNumber(v, -0.5)))
                      }
                      className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono font-bold border border-slate-700"
                    >
                      -0.5
                    </button>
                    <NumericInput
                      step="0.1"
                      min="0"
                      required
                      value={magnesiumDoseGrams}
                      onChangeValue={setMagnesiumDoseGrams}
                      emptyFallback={editingRecipe?.magnesiumDoseGrams ?? 9.0}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-center text-sky-300 font-mono font-bold focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setMagnesiumDoseGrams((v) => stepAdjustNumber(v, 0.5))
                      }
                      className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono font-bold border border-slate-700"
                    >
                      +0.5
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    +Mg boosts extraction, sweetness & body
                  </div>
                </div>

                <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 space-y-2">
                  <label className="block text-amber-300 font-semibold">
                    Buffer Conc. (g)
                  </label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() =>
                        setBufferDoseGrams((v) => Math.max(0, stepAdjustNumber(v, -0.5)))
                      }
                      className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono font-bold border border-slate-700"
                    >
                      -0.5
                    </button>
                    <NumericInput
                      step="0.1"
                      min="0"
                      required
                      value={bufferDoseGrams}
                      onChangeValue={setBufferDoseGrams}
                      emptyFallback={editingRecipe?.bufferDoseGrams ?? 5.0}
                      className="w-full bg-slate-950 border border-slate-700 rounded px-2.5 py-1.5 text-center text-amber-300 font-mono font-bold focus:outline-none focus:border-sky-500"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setBufferDoseGrams((v) => stepAdjustNumber(v, 0.5))
                      }
                      className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-mono font-bold border border-slate-700"
                    >
                      +0.5
                    </button>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    +Buffer tames sourness · −Buffer boosts clarity
                  </div>
                </div>
              </div>

              {/* Live Calculated Chemistry Preview */}
              <div className="bg-sky-950/20 border border-sky-500/30 rounded-lg p-3 grid grid-cols-3 gap-2 text-center font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Total GH</span>
                  <strong className="text-sky-300 text-sm">
                    {previewChemistry.totalGhPpm.toFixed(1)} ppm
                  </strong>
                  <span className="text-[10px] text-slate-500 block">
                    (+{previewChemistry.addedGhPpm} added)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Total KH</span>
                  <strong className="text-amber-300 text-sm">
                    {previewChemistry.totalKhPpm.toFixed(1)} ppm
                  </strong>
                  <span className="text-[10px] text-slate-500 block">
                    (+{previewChemistry.addedKhPpm} added)
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Buffer (HCO₃⁻)</span>
                  <strong className="text-emerald-300 text-sm">
                    {previewChemistry.totalBicarbonateMgL.toFixed(1)} mg/L
                  </strong>
                  <span className="text-[10px] text-slate-500 block">
                    (+{previewChemistry.addedBicarbonateMgL} added)
                  </span>
                </div>
              </div>

              {/* Optional Stock Concentrate Formulation Override */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowConcentrateEditor((v) => !v)}
                  className="text-[11px] text-sky-400 hover:text-sky-300 underline font-mono"
                >
                  {showConcentrateEditor
                    ? 'Hide concentrate stock weights'
                    : 'Customize stock concentrate strength (default: 12.3g MgSO₄ / 8.4g NaHCO₃ per 500g)'}
                </button>

                {showConcentrateEditor && (
                  <div className="mt-2.5 p-3 bg-slate-900/70 border border-slate-800 rounded-lg space-y-3">
                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="block text-[10px] text-slate-400 mb-1">Mg Salt (g)</label>
                        <NumericInput
                          value={mgSaltGrams}
                          onChangeValue={setMgSaltGrams}
                          emptyFallback={12.3}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[10px] text-slate-400 mb-1">Total Weight (g)</label>
                        <NumericInput
                          value={mgSolutionGrams}
                          onChangeValue={setMgSolutionGrams}
                          emptyFallback={500}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[10px] text-slate-400 mb-1">Salt Label</label>
                        <input
                          type="text"
                          value={mgSaltName}
                          onChange={(e) => setMgSaltName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-[11px]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <div className="col-span-1">
                        <label className="block text-[10px] text-slate-400 mb-1">Buffer Salt (g)</label>
                        <NumericInput
                          value={bufSaltGrams}
                          onChangeValue={setBufSaltGrams}
                          emptyFallback={8.4}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[10px] text-slate-400 mb-1">Total Weight (g)</label>
                        <NumericInput
                          value={bufSolutionGrams}
                          onChangeValue={setBufSolutionGrams}
                          emptyFallback={500}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white font-mono"
                        />
                      </div>
                      <div className="col-span-1">
                        <label className="block text-[10px] text-slate-400 mb-1">Salt Label</label>
                        <input
                          type="text"
                          value={bufSaltName}
                          onChange={(e) => setBufSaltName(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 rounded px-2 py-1 text-white text-[11px]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Great for Ethiopian washed light roasts, crisp acidity without harshness"
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-sky-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold transition-colors"
                >
                  {editingRecipe ? 'Save Changes' : 'Save Water Recipe'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
