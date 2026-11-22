import React from 'react';
import { DialInDiagnosis } from '../types/espresso';
import { AlertCircle, CheckCircle2, ChevronRight, Gauge, Sparkles } from 'lucide-react';

interface DialInDoctorCardProps {
  diagnosis: DialInDiagnosis;
  ratio: number;
  flowRate: number;
  actualFlowRate?: number;
  timeSeconds: number;
}

export const DialInDoctorCard: React.FC<DialInDoctorCardProps> = ({
  diagnosis,
  ratio,
  flowRate,
  actualFlowRate,
  timeSeconds,
}) => {
  const isOptimal = diagnosis.status === 'optimal';
  const isWarning = diagnosis.status === 'under_extracted' || diagnosis.status === 'over_extracted' || diagnosis.status === 'channeling';

  return (
    <div
      className={`rounded-xl border p-4 sm:p-5 transition-all ${
        isOptimal
          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-100'
          : isWarning
          ? 'bg-amber-950/25 border-amber-500/30 text-amber-100'
          : 'bg-[#141822] border-slate-800 text-slate-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          {isOptimal ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
          )}
          <div>
            <h4 className="font-semibold text-sm text-white">{diagnosis.headline}</h4>
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-400 mt-0.5">
              <span>{diagnosis.ratioCategory}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">Ratio 1:{ratio.toFixed(2)}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                Avg {flowRate.toFixed(2)} g/s
                {actualFlowRate !== undefined && (
                  <span className="text-sky-300"> / Act {actualFlowRate.toFixed(2)} g/s</span>
                )}
              </span>
            </div>
          </div>
        </div>
        <div className="shrink-0 flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono bg-slate-900/80 border border-slate-700/80 text-slate-300">
          <Gauge className="w-3 h-3 text-amber-400" />
          <span>{timeSeconds.toFixed(1)}s</span>
        </div>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed mb-3.5">
        {diagnosis.explanation}
      </p>

      {/* Actionable recommendations */}
      <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-amber-400 flex items-center gap-1">
          <Sparkles className="w-3 h-3" />
          <span>Dial-In Next Steps</span>
        </div>
        <ul className="space-y-1 text-xs text-slate-300">
          {diagnosis.recommendations.map((rec, idx) => (
            <li key={idx} className="flex items-start gap-1.5">
              <ChevronRight className="w-3.5 h-3.5 text-amber-500/80 shrink-0 mt-0.5" />
              <span>{rec}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
