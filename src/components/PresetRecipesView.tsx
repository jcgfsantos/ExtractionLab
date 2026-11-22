import React, { useState } from 'react';
import { BrewPreset } from '../types/espresso';
import { Plus, ArrowRight, Trash2, Edit2 } from 'lucide-react';
import { PresetFormModal } from './PresetFormModal';

interface PresetRecipesViewProps {
  presets: BrewPreset[];
  onApplyPreset: (preset: BrewPreset) => void;
  onSavePreset: (preset: BrewPreset) => void;
  onDeletePreset: (id: string) => void;
}

export const PresetRecipesView: React.FC<PresetRecipesViewProps> = ({
  presets,
  onApplyPreset,
  onSavePreset,
  onDeletePreset,
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPreset, setEditingPreset] = useState<BrewPreset | null>(null);

  const openCreateModal = () => {
    setEditingPreset(null);
    setIsModalOpen(true);
  };

  const openEditModal = (preset: BrewPreset) => {
    setEditingPreset(preset);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPreset(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#141822] border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-medium text-amber-500 uppercase tracking-wider">
            Brew Profiles & Standard Operating Procedures
          </span>
          <h2 className="text-lg font-bold text-white mt-0.5">Espresso Extraction Recipes</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Calibrated baseline recipes from modern Nordic to turbo shots. Edit any preset or apply it directly to the logger.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Recipe Preset</span>
        </button>
      </div>

      {/* Preset Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {presets.map((preset) => {
          const ratio = preset.targetDose > 0 ? (preset.targetYield / preset.targetDose).toFixed(2) : '—';

          return (
            <div
              key={preset.id}
              className="bg-[#141822] border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-[11px] font-mono font-medium text-amber-400 uppercase tracking-wide">
                      {preset.style}
                    </span>
                    <h3 className="font-bold text-base text-white mt-0.5">{preset.name}</h3>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => openEditModal(preset)}
                      className="text-slate-400 hover:text-amber-400 p-1.5 rounded-md hover:bg-slate-800/70 transition-colors"
                      title="Edit recipe preset"
                      aria-label={`Edit ${preset.name}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeletePreset(preset.id)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-md hover:bg-slate-800/70 transition-colors"
                      title="Delete recipe preset"
                      aria-label={`Delete ${preset.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {preset.description && (
                  <p className="text-xs text-slate-300 mt-3 leading-relaxed">
                    {preset.description}
                  </p>
                )}

                {/* Target Telemetry Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 my-4 text-center font-mono bg-slate-900/60 border border-slate-800/80 rounded-lg p-3">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Ratio</span>
                    <strong className="text-amber-400 text-sm font-bold">1:{ratio}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">In / Out</span>
                    <span className="text-slate-200 text-xs font-semibold">
                      {preset.targetDose}g / {preset.targetYield}g
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Time (Pre)</span>
                    <span className="text-slate-200 text-xs font-semibold">
                      {preset.targetTime}s ({preset.targetPreInfusion}s)
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Temp / Bar</span>
                    <span className="text-slate-200 text-xs font-semibold">
                      {preset.targetTempC}°C · {preset.targetPressureBar}b
                    </span>
                  </div>
                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[10px] text-slate-500 block uppercase">Grind</span>
                    <span className="text-sky-300 text-xs font-semibold">
                      {preset.targetGrindSetting ? preset.targetGrindSetting : '—'}
                    </span>
                  </div>
                </div>

                {preset.grindRecommendation && (
                  <div className="text-xs text-slate-400">
                    <span className="text-slate-500 font-mono text-[11px] uppercase mr-1.5">Grind:</span>
                    <span>{preset.grindRecommendation}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => openEditModal(preset)}
                  className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 text-xs font-medium flex items-center gap-1.5 transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                <button
                  type="button"
                  onClick={() => onApplyPreset(preset)}
                  className="px-4 py-2 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>Apply Recipe to Logger</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create / Edit Preset Modal */}
      {isModalOpen && (
        <PresetFormModal
          key={editingPreset?.id ?? 'new-preset'}
          editingPreset={editingPreset}
          onSave={onSavePreset}
          onClose={closeModal}
        />
      )}
    </div>
  );
};
