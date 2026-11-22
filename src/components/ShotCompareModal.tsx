import React from 'react';
import { EspressoShot } from '../types/espresso';
import { X, ArrowRight, Star, BookmarkCheck, Sliders, Scale, Clock, Gauge } from 'lucide-react';
import { SensorySpiderChart } from './SensorySpiderChart';
import { calculateActualFlowRate, parseLocaleNumber } from '../utils/coffeeCalculations';

interface ShotCompareModalProps {
  shot1: EspressoShot;
  shot2: EspressoShot;
  onClose: () => void;
}

export const ShotCompareModal: React.FC<ShotCompareModalProps> = ({
  shot1,
  shot2,
  onClose,
}) => {
  const actualFlow1 =
    shot1.actualFlowRate ??
    calculateActualFlowRate(shot1.yieldGrams, shot1.totalTimeSeconds, shot1.preInfusionSeconds);
  const actualFlow2 =
    shot2.actualFlowRate ??
    calculateActualFlowRate(shot2.yieldGrams, shot2.totalTimeSeconds, shot2.preInfusionSeconds);

  // Delta calculations (shot2 - shot1)
  const deltaDose = shot2.doseGrams - shot1.doseGrams;
  const deltaYield = shot2.yieldGrams - shot1.yieldGrams;
  const deltaRatio = shot2.ratio - shot1.ratio;
  const deltaTime = shot2.totalTimeSeconds - shot1.totalTimeSeconds;
  const deltaFlow = shot2.flowRate - shot1.flowRate;
  const deltaActualFlow = actualFlow2 - actualFlow1;
  const deltaRating = shot2.rating - shot1.rating;

  const actual1 = shot1.actualSetting ?? (parseLocaleNumber(shot1.grindSetting) - (shot1.zeroSetting ?? 0));
  const actual2 = shot2.actualSetting ?? (parseLocaleNumber(shot2.grindSetting) - (shot2.zeroSetting ?? 0));
  const deltaActual = !isNaN(actual1) && !isNaN(actual2) ? actual2 - actual1 : null;

  const formatDelta = (val: number, unit = '', decimals = 1) => {
    if (val === 0) return <span className="text-slate-500 font-mono">0{unit}</span>;
    const sign = val > 0 ? '+' : '';
    const color = val > 0 ? 'text-amber-400' : 'text-cyan-400';
    return (
      <span className={`font-mono font-bold ${color}`}>
        {sign}{val.toFixed(decimals)}{unit}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#141822] border border-slate-800 rounded-xl max-w-4xl w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <span className="text-xs font-mono font-medium text-amber-500 uppercase tracking-wider">
              Telemetry Delta Inspection
            </span>
            <h2 className="text-base font-bold text-white mt-0.5">Side-by-Side Shot Comparison</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-6 text-xs">
          {/* Side by side cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Shot 1 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-500 uppercase">Baseline (Shot A)</span>
                  <h3 className="font-bold text-white text-sm">{shot1.beanName}</h3>
                  <div className="text-slate-400 text-[11px]">{new Date(shot1.timestamp).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-1 font-mono text-amber-400 font-bold bg-slate-800 px-2 py-0.5 rounded">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{shot1.rating.toFixed(1)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
                <div>
                  <span className="text-slate-500 block text-[10px]">Mass (In / Out)</span>
                  <span className="text-white font-semibold">{shot1.doseGrams}g → {shot1.yieldGrams}g</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Brew Ratio</span>
                  <span className="text-amber-400 font-bold">1:{shot1.ratio.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Shot Duration</span>
                  <span className="text-white font-semibold">{shot1.totalTimeSeconds}s ({shot1.preInfusionSeconds}s)</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Flow (Avg / Actual)</span>
                  <span className="text-white font-semibold">{shot1.flowRate.toFixed(2)}</span>
                  <span className="text-slate-500 mx-1">/</span>
                  <span className="text-sky-300 font-semibold">{actualFlow1.toFixed(2)} g/s</span>
                </div>
              </div>

              <div className="space-y-1 font-mono text-[11px]">
                <div className="text-slate-400">
                  <span>Grind: </span>
                  <strong className="text-amber-400">
                    {shot1.actualSetting !== undefined ? shot1.actualSetting.toFixed(1) : shot1.grindSetting}
                  </strong>
                  {shot1.actualSetting !== undefined && (
                    <span className="text-[10px] text-amber-300/80 ml-1">actual</span>
                  )}
                  {shot1.actualSetting !== undefined && shot1.zeroSetting !== undefined && shot1.zeroSetting !== 0 && (
                    <span className="text-slate-500 text-[10px] ml-1">
                      (dial {shot1.grindSetting} − zero {shot1.zeroSetting})
                    </span>
                  )}
                  <span className="text-slate-500 ml-1">({shot1.grinder})</span>
                </div>
                <div className="text-slate-400">
                  <span>Machine: </span>
                  <span className="text-slate-200">{shot1.waterTempC}°C · {shot1.peakPressureBars}b · {shot1.machine}</span>
                </div>
                {shot1.waterRecipeName && (
                  <div className="text-slate-400">
                    <span>Water: </span>
                    <span className="text-sky-300">{shot1.waterRecipeName}</span>
                  </div>
                )}
                <div className="text-slate-400">
                  <span>Channeling: </span>
                  <span className="text-slate-200">{shot1.channeling}</span>
                </div>
              </div>

              {shot1.notes && (
                <div className="text-slate-300 italic text-[11px] bg-slate-950/40 p-2 rounded">
                  "{shot1.notes}"
                </div>
              )}

              <div className="pt-2 flex justify-center">
                <SensorySpiderChart profile={shot1.tasteProfile} size={150} showLabels={false} />
              </div>
            </div>

            {/* Shot 2 */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-amber-500 uppercase">Comparison (Shot B)</span>
                  <h3 className="font-bold text-white text-sm">{shot2.beanName}</h3>
                  <div className="text-slate-400 text-[11px]">{new Date(shot2.timestamp).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-1 font-mono text-amber-400 font-bold bg-slate-800 px-2 py-0.5 rounded">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{shot2.rating.toFixed(1)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-slate-950/60 p-2.5 rounded border border-slate-800/80">
                <div>
                  <span className="text-slate-500 block text-[10px]">Mass (In / Out)</span>
                  <span className="text-white font-semibold">{shot2.doseGrams}g → {shot2.yieldGrams}g</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Brew Ratio</span>
                  <span className="text-amber-400 font-bold">1:{shot2.ratio.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Shot Duration</span>
                  <span className="text-white font-semibold">{shot2.totalTimeSeconds}s ({shot2.preInfusionSeconds}s)</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[10px]">Flow (Avg / Actual)</span>
                  <span className="text-white font-semibold">{shot2.flowRate.toFixed(2)}</span>
                  <span className="text-slate-500 mx-1">/</span>
                  <span className="text-sky-300 font-semibold">{actualFlow2.toFixed(2)} g/s</span>
                </div>
              </div>

              <div className="space-y-1 font-mono text-[11px]">
                <div className="text-slate-400">
                  <span>Grind: </span>
                  <strong className="text-amber-400">
                    {shot2.actualSetting !== undefined ? shot2.actualSetting.toFixed(1) : shot2.grindSetting}
                  </strong>
                  {shot2.actualSetting !== undefined && (
                    <span className="text-[10px] text-amber-300/80 ml-1">actual</span>
                  )}
                  {shot2.actualSetting !== undefined && shot2.zeroSetting !== undefined && shot2.zeroSetting !== 0 && (
                    <span className="text-slate-500 text-[10px] ml-1">
                      (dial {shot2.grindSetting} − zero {shot2.zeroSetting})
                    </span>
                  )}
                  <span className="text-slate-500 ml-1">({shot2.grinder})</span>
                </div>
                <div className="text-slate-400">
                  <span>Machine: </span>
                  <span className="text-slate-200">{shot2.waterTempC}°C · {shot2.peakPressureBars}b · {shot2.machine}</span>
                </div>
                {shot2.waterRecipeName && (
                  <div className="text-slate-400">
                    <span>Water: </span>
                    <span className="text-sky-300">{shot2.waterRecipeName}</span>
                  </div>
                )}
                <div className="text-slate-400">
                  <span>Channeling: </span>
                  <span className="text-slate-200">{shot2.channeling}</span>
                </div>
              </div>

              {shot2.notes && (
                <div className="text-slate-300 italic text-[11px] bg-slate-950/40 p-2 rounded">
                  "{shot2.notes}"
                </div>
              )}

              <div className="pt-2 flex justify-center">
                <SensorySpiderChart profile={shot2.tasteProfile} size={150} showLabels={false} />
              </div>
            </div>
          </div>

          {/* Delta Summary Matrix */}
          <div className="bg-[#10131a] border border-slate-800 rounded-lg p-4">
            <h4 className="font-semibold text-white mb-2 text-xs uppercase font-mono tracking-wider text-slate-400">
              Parametric Deltas ($\Delta$ Shot B vs Shot A)
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-7 gap-2.5 text-center">
              <div className="bg-slate-900/60 p-2 rounded">
                <span className="text-[10px] text-slate-500 block uppercase">Dose Delta</span>
                {formatDelta(deltaDose, 'g')}
              </div>
              <div className="bg-slate-900/60 p-2 rounded">
                <span className="text-[10px] text-slate-500 block uppercase">Yield Delta</span>
                {formatDelta(deltaYield, 'g')}
              </div>
              <div className="bg-slate-900/60 p-2 rounded">
                <span className="text-[10px] text-slate-500 block uppercase">Ratio Delta</span>
                {formatDelta(deltaRatio, '', 2)}
              </div>
              <div className="bg-slate-900/60 p-2 rounded">
                <span className="text-[10px] text-slate-500 block uppercase">Actual Grind</span>
                {deltaActual !== null ? formatDelta(deltaActual, '', 1) : <span className="text-slate-500">—</span>}
              </div>
              <div className="bg-slate-900/60 p-2 rounded">
                <span className="text-[10px] text-slate-500 block uppercase">Time Delta</span>
                {formatDelta(deltaTime, 's')}
              </div>
              <div className="bg-slate-900/60 p-2 rounded">
                <span className="text-[10px] text-slate-500 block uppercase">Avg Flow</span>
                {formatDelta(deltaFlow, ' g/s', 2)}
              </div>
              <div className="bg-slate-900/60 p-2 rounded">
                <span className="text-[10px] text-slate-500 block uppercase">Actual Flow</span>
                {formatDelta(deltaActualFlow, ' g/s', 2)}
              </div>
              <div className="bg-slate-900/60 p-2 rounded">
                <span className="text-[10px] text-slate-500 block uppercase">Rating Delta</span>
                {formatDelta(deltaRating, '★')}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
