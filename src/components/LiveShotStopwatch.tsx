import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, ArrowDownToLine, Split } from 'lucide-react';
import { BrewPreset } from '../types/espresso';
import { playTimerCue } from '../utils/audioCue';

export interface StopwatchTimerState {
  elapsedMs: number;
  preInfusionMs: number | null;
  runningStartedAt: number | null;
  customTargetSeconds: number;
}

interface LiveShotStopwatchProps {
  onApplyTimeToForm: (totalSeconds: number, preInfusionSeconds: number | null) => void;
  targetDose?: number;
  targetYield?: number;
  presets?: BrewPreset[];
  selectedPresetId?: string;
  onSelectPreset?: (preset: BrewPreset) => void;
  onClearPreset?: () => void;
  initialTimerState?: StopwatchTimerState;
  onTimerStateChange?: (state: StopwatchTimerState) => void;
}

export const LiveShotStopwatch: React.FC<LiveShotStopwatchProps> = ({
  onApplyTimeToForm,
  targetDose = 18.0,
  targetYield = 36.0,
  presets = [],
  selectedPresetId = '__custom__',
  onSelectPreset,
  onClearPreset,
  initialTimerState,
  onTimerStateChange,
}) => {
  const initialStartedAt = initialTimerState?.runningStartedAt ?? null;
  const [isRunning, setIsRunning] = useState<boolean>(Boolean(initialStartedAt));
  const [elapsedMs, setElapsedMs] = useState<number>(() =>
    initialStartedAt ? Math.max(0, Date.now() - initialStartedAt) : (initialTimerState?.elapsedMs ?? 0)
  );
  const [preInfusionMs, setPreInfusionMs] = useState<number | null>(
    initialTimerState?.preInfusionMs ?? null
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [customTargetSeconds, setCustomTargetSeconds] = useState<number>(
    initialTimerState?.customTargetSeconds ?? 28
  );

  const activePreset = presets.find((p) => p.id === selectedPresetId);
  const targetSeconds = activePreset ? activePreset.targetTime : customTargetSeconds;

  const startTimeRef = useRef<number>(0);
  const timerIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRunning) {
      startTimeRef.current = performance.now() - elapsedMs;
      timerIntervalRef.current = window.setInterval(() => {
        setElapsedMs(performance.now() - startTimeRef.current);
      }, 50);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isRunning]);

  const emitTimerState = (overrides: Partial<StopwatchTimerState> = {}) => {
    onTimerStateChange?.({
      elapsedMs,
      preInfusionMs,
      runningStartedAt: isRunning ? Date.now() - elapsedMs : null,
      customTargetSeconds,
      ...overrides,
    });
  };

  const handleStartPause = () => {
    if (!isRunning) {
      playTimerCue('start', soundEnabled);
      const startedAt = Date.now() - elapsedMs;
      setIsRunning(true);
      emitTimerState({
        elapsedMs,
        runningStartedAt: startedAt,
      });
    } else {
      playTimerCue('stop', soundEnabled);
      const currentElapsed = performance.now() - startTimeRef.current;
      setElapsedMs(currentElapsed);
      setIsRunning(false);
      emitTimerState({
        elapsedMs: currentElapsed,
        runningStartedAt: null,
      });
    }
  };

  const handleSplitPreInfusion = () => {
    if (!isRunning || preInfusionMs !== null) return;
    playTimerCue('split', soundEnabled);
    const currentElapsed = performance.now() - startTimeRef.current;
    setPreInfusionMs(currentElapsed);
    emitTimerState({
      elapsedMs: currentElapsed,
      preInfusionMs: currentElapsed,
      runningStartedAt: Date.now() - currentElapsed,
    });
  };

  const handleReset = () => {
    setIsRunning(false);
    setElapsedMs(0);
    setPreInfusionMs(null);
    emitTimerState({
      elapsedMs: 0,
      preInfusionMs: null,
      runningStartedAt: null,
    });
  };

  const handleApply = () => {
    const totalSec = Number((elapsedMs / 1000).toFixed(1));
    const preInfSec = preInfusionMs !== null ? Number((preInfusionMs / 1000).toFixed(1)) : null;
    playTimerCue('success', soundEnabled);
    onApplyTimeToForm(totalSec, preInfSec);
  };

  const handleTargetChange = (value: string) => {
    if (value.startsWith('preset-time:')) {
      const sec = Number(value.replace('preset-time:', ''));
      if (!Number.isNaN(sec) && sec > 0) {
        setCustomTargetSeconds(sec);
        emitTimerState({ customTargetSeconds: sec });
      }
      onClearPreset?.();
      return;
    }

    const chosen = presets.find((p) => p.id === value);
    if (chosen) {
      setCustomTargetSeconds(chosen.targetTime);
      emitTimerState({ customTargetSeconds: chosen.targetTime });
      onSelectPreset?.(chosen);
    }
  };

  const totalSeconds = elapsedMs / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  const tenths = Math.floor((totalSeconds * 10) % 10);

  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${tenths}`;

  const preInfSeconds = preInfusionMs !== null ? (preInfusionMs / 1000).toFixed(1) : null;
  const mainExtractionSeconds = preInfusionMs !== null ? ((elapsedMs - preInfusionMs) / 1000).toFixed(1) : null;

  // Real-time projected flow rate if target yield is provided
  const liveEstFlowRate = totalSeconds > 0 && targetYield ? (targetYield / totalSeconds).toFixed(2) : null;

  // Progress percentage toward target seconds
  const progressPercent = targetSeconds > 0 ? Math.min(100, (totalSeconds / targetSeconds) * 100) : 0;

  return (
    <div className="bg-[#141822] border border-slate-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
      {/* Background pace bar */}
      <div
        className="absolute bottom-0 left-0 h-1 bg-amber-500/40 transition-all duration-150"
        style={{ width: `${progressPercent}%` }}
      />

      <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-800/80 mb-4">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500/80" />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            Extraction Scale & Timer
          </span>
        </div>
        <div className="flex items-center gap-3 max-w-full">
          <label className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono min-w-0">
            <span className="shrink-0">Target:</span>
            <select
              value={activePreset ? activePreset.id : `preset-time:${customTargetSeconds}`}
              onChange={(e) => handleTargetChange(e.target.value)}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-0.5 text-xs text-amber-300 focus:outline-none focus:border-amber-500 max-w-[230px] sm:max-w-[280px] truncate"
            >
              {presets.length > 0 && (
                <optgroup label="Saved Recipe Presets">
                  {presets.map((preset) => (
                    <option key={preset.id} value={preset.id}>
                      {preset.targetTime}s · {preset.name}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label="Quick Time Targets">
                <option value="preset-time:16">16s (Custom Pace)</option>
                <option value="preset-time:25">25s (Custom Pace)</option>
                <option value="preset-time:28">28s (Custom Pace)</option>
                <option value="preset-time:32">32s (Custom Pace)</option>
                <option value="preset-time:36">36s (Custom Pace)</option>
              </optgroup>
            </select>
          </label>
          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="text-slate-400 hover:text-white p-1 rounded hover:bg-slate-800 transition-colors shrink-0"
            title={soundEnabled ? 'Mute timer sound' : 'Enable timer audio chime'}
            aria-label="Toggle timer audio"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 opacity-60" />}
          </button>
        </div>
      </div>

      {/* Big Scale Display */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-4 py-2">
        <div>
          <div className="text-5xl sm:text-6xl font-mono font-bold tracking-tight text-white tabular-nums drop-shadow-sm flex items-baseline gap-1">
            <span>{formattedTime}</span>
            <span className="text-xs text-slate-500 font-sans uppercase font-medium">sec</span>
          </div>

          <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
            {preInfSeconds !== null ? (
              <span className="flex items-center gap-1 text-amber-400/90 font-mono">
                <span>Pre-infusion:</span>
                <span className="font-semibold">{preInfSeconds}s</span>
                <span className="text-slate-600">/</span>
                <span>Main: {mainExtractionSeconds}s</span>
              </span>
            ) : (
              <span className="text-slate-500">Pre-infusion: not split</span>
            )}
          </div>
        </div>

        {/* Live telemetry snippet */}
        <div className="sm:text-right space-y-1 bg-slate-900/60 border border-slate-800/80 rounded-lg p-3 sm:min-w-[170px]">
          <div className="text-[11px] text-slate-400 font-mono flex sm:justify-end gap-1.5">
            <span>Target Yield:</span>
            <span className="text-slate-200 font-semibold">{targetYield}g</span>
          </div>
          <div className="text-[11px] text-slate-400 font-mono flex sm:justify-end gap-1.5">
            <span>Target Ratio:</span>
            <span className="text-slate-200 font-semibold">
              1:{targetDose > 0 ? (targetYield / targetDose).toFixed(1) : '0.0'}
            </span>
          </div>
          {liveEstFlowRate && totalSeconds > 3 && (
            <div className="text-[11px] text-amber-400 font-mono flex sm:justify-end gap-1.5">
              <span>Avg Flow:</span>
              <span className="font-bold">{liveEstFlowRate} g/s</span>
            </div>
          )}
        </div>
      </div>

      {/* Tactile Control Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-5">
        <button
          onClick={handleStartPause}
          className={`py-2.5 px-4 rounded-lg font-semibold text-xs flex items-center justify-center gap-2 transition-all ${
            isRunning
              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
              : 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400 shadow'
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-4 h-4 fill-current" />
              <span>Pause</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              <span>{elapsedMs > 0 ? 'Resume' : 'Start Shot'}</span>
            </>
          )}
        </button>

        <button
          onClick={handleSplitPreInfusion}
          disabled={!isRunning || preInfusionMs !== null}
          className={`py-2.5 px-3 rounded-lg text-xs font-medium border flex items-center justify-center gap-1.5 transition-colors ${
            preInfusionMs !== null
              ? 'bg-amber-500/10 text-amber-300 border-amber-500/30 cursor-default'
              : isRunning
              ? 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white'
              : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
          }`}
        >
          <Split className="w-3.5 h-3.5" />
          <span>{preInfusionMs !== null ? `Split @ ${preInfSeconds}s` : 'Mark Pre-Infusion'}</span>
        </button>

        <button
          onClick={handleReset}
          disabled={elapsedMs === 0}
          className="py-2.5 px-3 rounded-lg text-xs font-medium text-slate-400 bg-slate-800/60 border border-slate-800 hover:text-slate-200 hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>

        <button
          onClick={handleApply}
          disabled={elapsedMs === 0}
          className="col-span-2 sm:col-span-1 py-2.5 px-3 rounded-lg text-xs font-semibold text-emerald-300 bg-emerald-500/15 border border-emerald-500/30 hover:bg-emerald-500/25 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowDownToLine className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Apply to Log</span>
        </button>
      </div>
    </div>
  );
};
