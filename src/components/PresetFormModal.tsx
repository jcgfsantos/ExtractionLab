import React, { useState } from 'react';
import { BrewPreset, EspressoShot } from '../types/espresso';
import { X } from 'lucide-react';
import { NumericInput } from './NumericInput';

export const PRESET_STYLES: BrewPreset['style'][] = [
  'Classic Italian',
  'Modern Light Roast',
  'Turbo Shot',
  'Ristretto',
  'Lungo',
  'Custom',
];

function inferStyleFromShot(shot: EspressoShot): BrewPreset['style'] {
  if (shot.ratio <= 1.6) return 'Ristretto';
  if (shot.ratio >= 2.6) return 'Lungo';
  if (shot.totalTimeSeconds <= 20) return 'Turbo Shot';
  return 'Custom';
}

function buildInitialValues(editingPreset?: BrewPreset | null, sourceShot?: EspressoShot | null) {
  if (editingPreset) {
    return {
      name: editingPreset.name,
      style: editingPreset.style,
      description: editingPreset.description,
      targetDose: editingPreset.targetDose,
      targetYield: editingPreset.targetYield,
      targetTime: editingPreset.targetTime,
      targetPreInfusion: editingPreset.targetPreInfusion,
      targetTempC: editingPreset.targetTempC,
      targetPressureBar: editingPreset.targetPressureBar,
      targetGrindSetting: editingPreset.targetGrindSetting ?? '',
      grindRecommendation: editingPreset.grindRecommendation,
    };
  }

  if (sourceShot) {
    const actualSuffix =
      sourceShot.actualSetting !== undefined
        ? ` (Actual ${sourceShot.actualSetting.toFixed(1)})`
        : '';
    const basketSuffix = sourceShot.basket ? ` · ${sourceShot.basket}` : '';

    return {
      name: `${sourceShot.beanName} (${sourceShot.doseGrams.toFixed(1)}g → ${sourceShot.yieldGrams.toFixed(1)}g)`,
      style: inferStyleFromShot(sourceShot),
      description: sourceShot.notes?.trim()
        ? sourceShot.notes.trim()
        : `${sourceShot.beanName} (${sourceShot.roaster}) · 1:${sourceShot.ratio.toFixed(2)} in ${sourceShot.totalTimeSeconds.toFixed(1)}s`,
      targetDose: sourceShot.doseGrams,
      targetYield: sourceShot.yieldGrams,
      targetTime: sourceShot.totalTimeSeconds,
      targetPreInfusion: sourceShot.preInfusionSeconds,
      targetTempC: sourceShot.waterTempC,
      targetPressureBar: sourceShot.peakPressureBars,
      targetGrindSetting: sourceShot.grindSetting,
      grindRecommendation: `${sourceShot.grinder} @ ${sourceShot.grindSetting}${actualSuffix}${basketSuffix}`,
    };
  }

  return {
    name: '',
    style: 'Custom' as BrewPreset['style'],
    description: '',
    targetDose: 18.0,
    targetYield: 36.0,
    targetTime: 28,
    targetPreInfusion: 4,
    targetTempC: 93.5,
    targetPressureBar: 9.0,
    targetGrindSetting: '15.5',
    grindRecommendation: 'Standard espresso fine',
  };
}

interface PresetFormModalProps {
  editingPreset?: BrewPreset | null;
  sourceShot?: EspressoShot | null;
  onSave: (preset: BrewPreset) => void;
  onClose: () => void;
}

export const PresetFormModal: React.FC<PresetFormModalProps> = ({
  editingPreset,
  sourceShot,
  onSave,
  onClose,
}) => {
  const initial = buildInitialValues(editingPreset, sourceShot);

  const [name, setName] = useState<string>(initial.name);
  const [style, setStyle] = useState<BrewPreset['style']>(initial.style);
  const [description, setDescription] = useState<string>(initial.description);
  const [targetDose, setTargetDose] = useState<number>(initial.targetDose);
  const [targetYield, setTargetYield] = useState<number>(initial.targetYield);
  const [targetTime, setTargetTime] = useState<number>(initial.targetTime);
  const [targetPreInfusion, setTargetPreInfusion] = useState<number>(initial.targetPreInfusion);
  const [targetTempC, setTargetTempC] = useState<number>(initial.targetTempC);
  const [targetPressureBar, setTargetPressureBar] = useState<number>(initial.targetPressureBar);
  const [targetGrindSetting, setTargetGrindSetting] = useState<string>(initial.targetGrindSetting);
  const [grindRecommendation, setGrindRecommendation] = useState<string>(initial.grindRecommendation);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const savedPreset: BrewPreset = {
      id: editingPreset?.id ?? `preset-${Date.now()}`,
      name: name.trim(),
      description: description.trim(),
      targetDose: Number(targetDose) || initial.targetDose,
      targetYield: Number(targetYield) || initial.targetYield,
      targetTime: Number(targetTime) || initial.targetTime,
      targetPreInfusion: Number.isFinite(Number(targetPreInfusion)) ? Number(targetPreInfusion) : 0,
      targetTempC: Number(targetTempC) || initial.targetTempC,
      targetPressureBar: Number(targetPressureBar) || initial.targetPressureBar,
      targetGrindSetting: targetGrindSetting.trim(),
      grindRecommendation: grindRecommendation.trim(),
      style,
    };

    onSave(savedPreset);
    onClose();
  };

  const previewRatio = targetDose > 0 ? (targetYield / targetDose).toFixed(2) : '—';

  const modalTitle = editingPreset
    ? 'Edit Recipe Preset'
    : sourceShot
    ? 'Create Preset Recipe from Shot'
    : 'Create Custom Recipe Preset';

  const modalSubtitle = editingPreset
    ? 'Update target parameters for this espresso extraction recipe.'
    : sourceShot
    ? `Pre-filled from ${sourceShot.beanName} (1:${sourceShot.ratio.toFixed(2)} · ${sourceShot.doseGrams.toFixed(1)}g → ${sourceShot.yieldGrams.toFixed(1)}g in ${sourceShot.totalTimeSeconds.toFixed(1)}s).`
    : 'Save target parameters for quick 1-click loading into the shot logger.';

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#141822] border border-slate-800 rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4 my-4">
        <div className="pb-3 border-b border-slate-800 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-white">{modalTitle}</h3>
            <p className="text-xs text-slate-400 mt-0.5">{modalSubtitle}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
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
                placeholder="e.g. Geisha Extended Pre-Infusion"
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Style</label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as BrewPreset['style'])}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-2.5 py-2 text-white focus:outline-none focus:border-amber-500"
              >
                {PRESET_STYLES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Description / Goal</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. 10s blooming pre-infusion for dense Ethiopian washed coffees"
              className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-amber-500 resize-none"
            />
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-lg px-3 py-2 flex items-center justify-between font-mono">
            <span className="text-slate-400 uppercase text-[11px]">Target Brew Ratio</span>
            <strong className="text-amber-400 text-sm">1:{previewRatio}</strong>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Target Dose (g)</label>
              <NumericInput
                step="0.1"
                min="0.1"
                required
                value={targetDose}
                onChangeValue={setTargetDose}
                emptyFallback={initial.targetDose}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Target Yield (g)</label>
              <NumericInput
                step="0.1"
                min="0.1"
                required
                value={targetYield}
                onChangeValue={setTargetYield}
                emptyFallback={initial.targetYield}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Target Total Time (s)</label>
              <NumericInput
                step="0.5"
                min="1"
                required
                value={targetTime}
                onChangeValue={setTargetTime}
                emptyFallback={initial.targetTime}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Pre-infusion Time (s)</label>
              <NumericInput
                step="0.5"
                min="0"
                required
                value={targetPreInfusion}
                onChangeValue={setTargetPreInfusion}
                emptyFallback={initial.targetPreInfusion}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Water Temp (°C)</label>
              <NumericInput
                step="0.5"
                min="70"
                max="105"
                required
                value={targetTempC}
                onChangeValue={setTargetTempC}
                emptyFallback={initial.targetTempC}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">Pressure (bar)</label>
              <NumericInput
                step="0.5"
                min="1"
                max="15"
                required
                value={targetPressureBar}
                onChangeValue={setTargetPressureBar}
                emptyFallback={initial.targetPressureBar}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Target Grinder Setting</label>
              <input
                type="text"
                inputMode="decimal"
                value={targetGrindSetting}
                onChange={(e) => setTargetGrindSetting(e.target.value)}
                placeholder="e.g. 15.5"
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sky-300 font-mono font-semibold focus:outline-none focus:border-amber-500"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">Grinder Setting Notes</label>
              <input
                type="text"
                value={grindRecommendation}
                onChange={(e) => setGrindRecommendation(e.target.value)}
                placeholder="e.g. Fine espresso dial, 1 click finer than standard"
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors"
            >
              {editingPreset ? 'Save Changes' : 'Save Preset'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
