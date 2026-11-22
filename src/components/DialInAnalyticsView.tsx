import React, { useState, useMemo, useRef, useEffect, useId, useCallback } from 'react';
import { EspressoShot, BeanBag, MachineProfile } from '../types/espresso';
import { SensorySpiderChart } from './SensorySpiderChart';
import {
  calculateActualGrindSetting,
  calculateFlowRate,
  calculateActualFlowRate,
} from '../utils/coffeeCalculations';
import {
  TrendingUp,
  Award,
  Sparkles,
  Clock,
  Gauge,
  Droplets,
  Activity,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from 'lucide-react';

interface DialInAnalyticsViewProps {
  shots: EspressoShot[];
  beans: BeanBag[];
  activeBeanId: string;
  machines: MachineProfile[];
  activeMachineId: string;
}

interface ChartZoomState {
  xZoom: number;
  yZoom: number;
  xPan: number; // fraction of baseSpan offset from center
  yPan: number; // fraction of baseSpan offset from center
}

const DEFAULT_ZOOM: ChartZoomState = {
  xZoom: 1,
  yZoom: 1,
  xPan: 0,
  yPan: 0,
};

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 10;
const ZOOM_STEP = 1.35;

function clampZoom(z: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, Number(z.toFixed(3))));
}

function computeAxisRange(
  baseMin: number,
  baseMax: number,
  zoom: number,
  pan: number,
  clampMinZero: boolean = false
): { viewMin: number; viewMax: number; viewSpan: number; baseSpan: number } {
  const baseSpan = Math.max(1e-6, baseMax - baseMin);
  const baseCenter = (baseMin + baseMax) / 2;
  const viewSpan = baseSpan / Math.max(MIN_ZOOM, zoom);
  const viewCenter = baseCenter + pan * baseSpan;

  let viewMin = viewCenter - viewSpan / 2;
  let viewMax = viewCenter + viewSpan / 2;

  if (clampMinZero && viewMin < 0) {
    viewMin = 0;
    viewMax = viewSpan;
  }

  return { viewMin, viewMax, viewSpan, baseSpan };
}

function getNiceStep(span: number, targetTickCount: number = 5): number {
  if (span <= 0 || !Number.isFinite(span)) return 1;
  const rough = span / Math.max(2, targetTickCount);
  const pow10 = Math.pow(10, Math.floor(Math.log10(rough)));
  const norm = rough / pow10;
  let niceNorm = 1;
  if (norm < 1.5) niceNorm = 1;
  else if (norm < 3) niceNorm = 2;
  else if (norm < 7) niceNorm = 5;
  else niceNorm = 10;
  return niceNorm * pow10;
}

function formatAxisNumber(val: number, step: number): string {
  if (Math.abs(val) < 1e-9) return '0';
  if (step < 0.05) return val.toFixed(2);
  if (step < 0.5) return val.toFixed(1);
  return Math.abs(val - Math.round(val)) < 0.05 ? String(Math.round(val)) : val.toFixed(1);
}

interface AxisZoomControlsProps {
  zoom: ChartZoomState;
  onZoomX: (factor: number) => void;
  onZoomY: (factor: number) => void;
  onReset: () => void;
  accentColor?: 'amber' | 'sky';
}

const AxisZoomControls: React.FC<AxisZoomControlsProps> = ({
  zoom,
  onZoomX,
  onZoomY,
  onReset,
  accentColor = 'amber',
}) => {
  const isModified =
    Math.abs(zoom.xZoom - 1) > 0.01 ||
    Math.abs(zoom.yZoom - 1) > 0.01 ||
    Math.abs(zoom.xPan) > 0.001 ||
    Math.abs(zoom.yPan) > 0.001;

  const badgeTextClass = accentColor === 'sky' ? 'text-sky-300' : 'text-amber-300';

  return (
    <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
      {/* X-Axis Zoom Controls */}
      <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-lg overflow-hidden">
        <span className="px-2 py-1 text-slate-400 border-r border-slate-800 select-none">X</span>
        <button
          type="button"
          onClick={() => onZoomX(1 / ZOOM_STEP)}
          disabled={zoom.xZoom <= MIN_ZOOM + 0.001}
          title="Zoom out X-axis"
          aria-label="Zoom out X-axis"
          className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className={`px-1.5 py-1 min-w-[42px] text-center tabular-nums ${badgeTextClass}`}>
          {Math.round(zoom.xZoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => onZoomX(ZOOM_STEP)}
          disabled={zoom.xZoom >= MAX_ZOOM - 0.001}
          title="Zoom in X-axis"
          aria-label="Zoom in X-axis"
          className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Y-Axis Zoom Controls */}
      <div className="flex items-center bg-slate-900/90 border border-slate-700/80 rounded-lg overflow-hidden">
        <span className="px-2 py-1 text-slate-400 border-r border-slate-800 select-none">Y</span>
        <button
          type="button"
          onClick={() => onZoomY(1 / ZOOM_STEP)}
          disabled={zoom.yZoom <= MIN_ZOOM + 0.001}
          title="Zoom out Y-axis"
          aria-label="Zoom out Y-axis"
          className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className={`px-1.5 py-1 min-w-[42px] text-center tabular-nums ${badgeTextClass}`}>
          {Math.round(zoom.yZoom * 100)}%
        </span>
        <button
          type="button"
          onClick={() => onZoomY(ZOOM_STEP)}
          disabled={zoom.yZoom >= MAX_ZOOM - 0.001}
          title="Zoom in Y-axis"
          aria-label="Zoom in Y-axis"
          className="px-2 py-1 text-slate-300 hover:text-white hover:bg-slate-800 disabled:opacity-35 disabled:cursor-not-allowed transition-colors"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      {isModified && (
        <button
          type="button"
          onClick={onReset}
          title="Reset X and Y zoom"
          aria-label="Reset zoom"
          className="px-2 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      )}
    </div>
  );
};

export const DialInAnalyticsView: React.FC<DialInAnalyticsViewProps> = ({
  shots,
  beans,
  activeBeanId,
  machines,
  activeMachineId,
}) => {
  const uid = useId().replace(/:/g, '');
  const [selectedBeanId, setSelectedBeanId] = useState<string>(activeBeanId || 'all');

  const resolveShotMachine = useCallback(
    (shot: EspressoShot): { key: string; label: string } => {
      const byId = shot.machineId ? machines.find((m) => m.id === shot.machineId) : undefined;
      if (byId) {
        return { key: `id:${byId.id}`, label: byId.name };
      }
      const trimmedName = (shot.machine || '').trim();
      const byName = trimmedName
        ? machines.find((m) => m.name.trim().toLowerCase() === trimmedName.toLowerCase())
        : undefined;
      if (byName) {
        return { key: `id:${byName.id}`, label: byName.name };
      }
      const fallbackLabel = trimmedName || 'Unknown Machine';
      return { key: `name:${fallbackLabel.toLowerCase()}`, label: fallbackLabel };
    },
    [machines]
  );

  const machineOptions = useMemo(() => {
    const counts = new Map<string, { key: string; label: string; count: number }>();
    machines.forEach((m) => {
      counts.set(`id:${m.id}`, { key: `id:${m.id}`, label: m.name, count: 0 });
    });
    shots.forEach((s) => {
      const resolved = resolveShotMachine(s);
      const existing = counts.get(resolved.key);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(resolved.key, { key: resolved.key, label: resolved.label, count: 1 });
      }
    });
    return Array.from(counts.values());
  }, [machines, shots, resolveShotMachine]);

  const [selectedMachineKey, setSelectedMachineKey] = useState<string>(() => {
    const activeKey = activeMachineId ? `id:${activeMachineId}` : 'all';
    const distinctUsedMachines = new Set(shots.map((s) => resolveShotMachine(s).key));
    if (distinctUsedMachines.size > 1 && distinctUsedMachines.has(activeKey)) {
      return activeKey;
    }
    return 'all';
  });

  const effectiveMachineKey = useMemo(() => {
    if (selectedMachineKey === 'all') return 'all';
    if (machineOptions.some((m) => m.key === selectedMachineKey)) return selectedMachineKey;
    return 'all';
  }, [selectedMachineKey, machineOptions]);

  // Independent Zoom & Pan states for each chart
  const [timeZoom, setTimeZoom] = useState<ChartZoomState>(DEFAULT_ZOOM);
  const [flowZoom, setFlowZoom] = useState<ChartZoomState>(DEFAULT_ZOOM);

  const relevantShots = useMemo(() => {
    const list = shots.filter((s) => {
      if (selectedBeanId !== 'all' && s.beanId !== selectedBeanId) return false;
      if (effectiveMachineKey !== 'all' && resolveShotMachine(s).key !== effectiveMachineKey) {
        return false;
      }
      return true;
    });
    // Sort chronological (oldest to newest for progression timeline)
    return list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }, [shots, selectedBeanId, effectiveMachineKey, resolveShotMachine]);

  // Summary statistics
  const stats = useMemo(() => {
    if (relevantShots.length === 0) return null;
    const avgRatio =
      relevantShots.reduce((acc, s) => acc + s.ratio, 0) / relevantShots.length;
    const avgTime =
      relevantShots.reduce((acc, s) => acc + s.totalTimeSeconds, 0) / relevantShots.length;
    const avgFlow =
      relevantShots.reduce((acc, s) => acc + s.flowRate, 0) / relevantShots.length;
    const avgActualFlow =
      relevantShots.reduce(
        (acc, s) =>
          acc +
          (s.actualFlowRate ??
            calculateActualFlowRate(s.yieldGrams, s.totalTimeSeconds, s.preInfusionSeconds)),
        0
      ) / relevantShots.length;
    const avgRating =
      relevantShots.reduce((acc, s) => acc + s.rating, 0) / relevantShots.length;

    // Highest rated shot
    const bestShot = [...relevantShots].sort((a, b) => b.rating - a.rating)[0];

    // Compute average taste profile
    const avgTaste = {
      acidity: Math.round((relevantShots.reduce((acc, s) => acc + s.tasteProfile.acidity, 0) / relevantShots.length) * 10) / 10,
      sweetness: Math.round((relevantShots.reduce((acc, s) => acc + s.tasteProfile.sweetness, 0) / relevantShots.length) * 10) / 10,
      bitterness: Math.round((relevantShots.reduce((acc, s) => acc + s.tasteProfile.bitterness, 0) / relevantShots.length) * 10) / 10,
      body: Math.round((relevantShots.reduce((acc, s) => acc + s.tasteProfile.body, 0) / relevantShots.length) * 10) / 10,
      crema: Math.round((relevantShots.reduce((acc, s) => acc + s.tasteProfile.crema, 0) / relevantShots.length) * 10) / 10,
      clarity: Math.round((relevantShots.reduce((acc, s) => acc + s.tasteProfile.clarity, 0) / relevantShots.length) * 10) / 10,
    };

    // Most common flavor tags
    const tagCount: Record<string, number> = {};
    relevantShots.forEach((s) => {
      s.flavorTags.forEach((t) => {
        tagCount[t] = (tagCount[t] || 0) + 1;
      });
    });
    const topTags = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([tag]) => tag);

    return {
      count: relevantShots.length,
      avgRatio,
      avgTime,
      avgFlow,
      avgActualFlow,
      avgRating,
      bestShot,
      avgTaste,
      topTags,
    };
  }, [relevantShots]);

  // --- Graph 1: Shot Sequence vs Extraction Time Curve ---
  const chartWidth = 650;
  const chartHeight = 250;
  const padding = { top: 30, right: 30, bottom: 48, left: 48 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const timeChart = useMemo(() => {
    if (relevantShots.length === 0) return null;

    const times = relevantShots.map((s) => s.totalTimeSeconds);
    const rawMinTime = Math.min(...times);
    const rawMaxTime = Math.max(...times);

    const baseMinY = Math.max(0, Math.min(10, Math.floor((rawMinTime - 2) / 5) * 5));
    const baseMaxY = Math.max(45, Math.ceil((rawMaxTime + 2) / 5) * 5);

    const n = relevantShots.length;
    const baseMinX = n === 1 ? -0.5 : -0.35;
    const baseMaxX = n === 1 ? 0.5 : n - 1 + 0.35;

    const xRange = computeAxisRange(baseMinX, baseMaxX, timeZoom.xZoom, timeZoom.xPan, false);
    const yRange = computeAxisRange(baseMinY, baseMaxY, timeZoom.yZoom, timeZoom.yPan, true);

    const toSvgX = (idxVal: number) =>
      padding.left + ((idxVal - xRange.viewMin) / xRange.viewSpan) * innerWidth;
    const toSvgY = (secVal: number) =>
      padding.top + innerHeight - ((secVal - yRange.viewMin) / yRange.viewSpan) * innerHeight;

    // Nice Y ticks within visible range
    const yStep = getNiceStep(yRange.viewSpan, 6);
    const yTicks: { val: number; y: number; label: string }[] = [];
    for (
      let v = Math.ceil(yRange.viewMin / yStep) * yStep;
      v <= yRange.viewMax + 1e-6;
      v += yStep
    ) {
      const rounded = Number(v.toFixed(2));
      yTicks.push({
        val: rounded,
        y: toSvgY(rounded),
        label: `${formatAxisNumber(rounded, yStep)}s`,
      });
    }

    // X ticks (integer shot indices within visible range)
    const startIdx = Math.max(0, Math.ceil(xRange.viewMin - 0.01));
    const endIdx = Math.min(n - 1, Math.floor(xRange.viewMax + 0.01));
    const visibleShotCount = Math.max(1, endIdx - startIdx + 1);
    const xStep = Math.max(1, Math.ceil(visibleShotCount / 9));
    const xTicks: { index: number; x: number; rating: number }[] = [];
    for (let i = startIdx; i <= endIdx; i += xStep) {
      xTicks.push({
        index: i,
        x: toSvgX(i),
        rating: relevantShots[i].rating,
      });
    }

    const pts = relevantShots.map((shot, index) => ({
      x: toSvgX(index),
      y: toSvgY(shot.totalTimeSeconds),
      shot,
      index,
    }));

    const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return {
      ...xRange,
      viewMinY: yRange.viewMin,
      viewMaxY: yRange.viewMax,
      viewSpanY: yRange.viewSpan,
      baseSpanY: yRange.baseSpan,
      viewSpanX: xRange.viewSpan,
      baseSpanX: xRange.baseSpan,
      toSvgX,
      toSvgY,
      yTicks,
      xTicks,
      pts,
      linePath,
    };
  }, [relevantShots, timeZoom, innerWidth, innerHeight, padding.left, padding.top]);

  // --- Graph 2: Actual Grinder Position vs Actual Flow Rate ---
  const [selectedGrinderFilter, setSelectedGrinderFilter] = useState<string>('auto');
  const [inspectedShotId, setInspectedShotId] = useState<string | null>(null);

  const allGrindFlowEntries = useMemo(() => {
    return relevantShots
      .map((shot) => {
        const actualPosition =
          shot.actualSetting !== undefined && Number.isFinite(shot.actualSetting)
            ? shot.actualSetting
            : calculateActualGrindSetting(shot.grindSetting, shot.zeroSetting ?? 0);
        const avgFlow =
          Number.isFinite(shot.flowRate) && shot.flowRate > 0
            ? shot.flowRate
            : calculateFlowRate(shot.yieldGrams, shot.totalTimeSeconds);
        const actualFlow =
          shot.actualFlowRate !== undefined && Number.isFinite(shot.actualFlowRate) && shot.actualFlowRate > 0
            ? shot.actualFlowRate
            : calculateActualFlowRate(
                shot.yieldGrams,
                shot.totalTimeSeconds,
                shot.preInfusionSeconds
              );

        if (actualPosition === null || !Number.isFinite(actualPosition) || actualFlow <= 0) {
          return null;
        }
        return {
          shot,
          grinderLabel: shot.grinder || 'Unknown Grinder',
          actualPosition,
          avgFlow,
          actualFlow,
        };
      })
      .filter((entry): entry is NonNullable<typeof entry> => entry !== null);
  }, [relevantShots]);

  const grinderOptions = useMemo(() => {
    const counts = new Map<string, number>();
    allGrindFlowEntries.forEach((e) => {
      counts.set(e.grinderLabel, (counts.get(e.grinderLabel) ?? 0) + 1);
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }));
  }, [allGrindFlowEntries]);

  const effectiveGrinderFilter = useMemo(() => {
    if (grinderOptions.length <= 1) return 'all';
    if (
      selectedGrinderFilter === 'all' ||
      grinderOptions.some((g) => g.name === selectedGrinderFilter)
    ) {
      return selectedGrinderFilter;
    }
    return grinderOptions[0].name;
  }, [grinderOptions, selectedGrinderFilter]);

  const filteredGrindFlowEntries = useMemo(() => {
    if (effectiveGrinderFilter === 'all') return allGrindFlowEntries;
    return allGrindFlowEntries.filter((e) => e.grinderLabel === effectiveGrinderFilter);
  }, [allGrindFlowEntries, effectiveGrinderFilter]);

  // Reset zoom/pan cleanly when filter context changes
  useEffect(() => {
    setTimeZoom(DEFAULT_ZOOM);
    setFlowZoom(DEFAULT_ZOOM);
  }, [selectedBeanId, effectiveMachineKey]);

  useEffect(() => {
    setFlowZoom(DEFAULT_ZOOM);
  }, [effectiveGrinderFilter]);

  const grindFlowChart = useMemo(() => {
    if (filteredGrindFlowEntries.length === 0) return null;

    const w = 650;
    const h = 265;
    const pad = { top: 28, right: 32, bottom: 52, left: 54 };
    const iw = w - pad.left - pad.right;
    const ih = h - pad.top - pad.bottom;

    const xVals = filteredGrindFlowEntries.map((e) => e.actualPosition);
    const yVals = filteredGrindFlowEntries.map((e) => e.actualFlow);

    const rawMinX = Math.min(...xVals);
    const rawMaxX = Math.max(...xVals);
    const xSpanRaw = rawMaxX - rawMinX;
    const xPad = xSpanRaw === 0 ? 1.0 : xSpanRaw * 0.14;
    const baseMinX = rawMinX - xPad;
    const baseMaxX = rawMaxX + xPad;

    const rawMinY = Math.min(...yVals, 1.1);
    const rawMaxY = Math.max(...yVals, 1.8);
    const baseMinY = Math.max(0, Math.floor((rawMinY - 0.15) * 4) / 4);
    const baseMaxY = Math.max(baseMinY + 0.5, Math.ceil((rawMaxY + 0.2) * 4) / 4);

    const xRange = computeAxisRange(baseMinX, baseMaxX, flowZoom.xZoom, flowZoom.xPan, false);
    const yRange = computeAxisRange(baseMinY, baseMaxY, flowZoom.yZoom, flowZoom.yPan, true);

    const toSvgX = (val: number) =>
      pad.left + ((val - xRange.viewMin) / xRange.viewSpan) * iw;
    const toSvgY = (val: number) =>
      pad.top + ih - ((val - yRange.viewMin) / yRange.viewSpan) * ih;

    // Generate clean X ticks inside current zoomed X window
    const xStep = getNiceStep(xRange.viewSpan, 5);
    const xTicks: { val: number; x: number; label: string }[] = [];
    for (
      let v = Math.ceil(xRange.viewMin / xStep) * xStep;
      v <= xRange.viewMax + 1e-6;
      v += xStep
    ) {
      const rounded = Number(v.toFixed(3));
      xTicks.push({
        val: rounded,
        x: toSvgX(rounded),
        label: formatAxisNumber(rounded, xStep),
      });
    }

    // Generate clean Y ticks inside current zoomed Y window
    const yStep = getNiceStep(yRange.viewSpan, 5);
    const yTicks: { val: number; y: number; label: string }[] = [];
    for (
      let v = Math.ceil(yRange.viewMin / yStep) * yStep;
      v <= yRange.viewMax + 1e-6;
      v += yStep
    ) {
      const rounded = Number(v.toFixed(3));
      yTicks.push({
        val: rounded,
        y: toSvgY(rounded),
        label: yStep < 0.01 ? rounded.toFixed(3) : rounded.toFixed(2),
      });
    }

    // Group by actual position to compute mean actual flow at each setting
    const byPos = new Map<number, { pos: number; flows: number[]; count: number }>();
    filteredGrindFlowEntries.forEach((e) => {
      const key = Number(e.actualPosition.toFixed(2));
      const existing = byPos.get(key);
      if (existing) {
        existing.flows.push(e.actualFlow);
        existing.count += 1;
      } else {
        byPos.set(key, { pos: key, flows: [e.actualFlow], count: 1 });
      }
    });

    const avgCurvePoints = Array.from(byPos.values())
      .sort((a, b) => a.pos - b.pos)
      .map((group) => {
        const meanFlow = group.flows.reduce((sum, f) => sum + f, 0) / group.flows.length;
        return {
          pos: group.pos,
          meanFlow,
          count: group.count,
          x: toSvgX(group.pos),
          y: toSvgY(meanFlow),
        };
      });

    const avgPath = avgCurvePoints
      .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x} ${pt.y}`)
      .join(' ');

    // Linear regression sensitivity across distinct X positions
    let regression: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      slopePerUnit: number;
    } | null = null;

    if (avgCurvePoints.length >= 2) {
      const n = filteredGrindFlowEntries.length;
      const sumX = filteredGrindFlowEntries.reduce((s, e) => s + e.actualPosition, 0);
      const sumY = filteredGrindFlowEntries.reduce((s, e) => s + e.actualFlow, 0);
      const sumXY = filteredGrindFlowEntries.reduce((s, e) => s + e.actualPosition * e.actualFlow, 0);
      const sumXX = filteredGrindFlowEntries.reduce((s, e) => s + e.actualPosition * e.actualPosition, 0);
      const denom = n * sumXX - sumX * sumX;
      if (Math.abs(denom) > 1e-6) {
        const slope = (n * sumXY - sumX * sumY) / denom;
        const intercept = (sumY - slope * sumX) / n;
        const regStartX = xRange.viewMin;
        const regEndX = xRange.viewMax;
        regression = {
          x1: toSvgX(regStartX),
          y1: toSvgY(slope * regStartX + intercept),
          x2: toSvgX(regEndX),
          y2: toSvgY(slope * regEndX + intercept),
          slopePerUnit: slope,
        };
      }
    }

    const scatterPoints = filteredGrindFlowEntries.map((entry) => ({
      ...entry,
      x: toSvgX(entry.actualPosition),
      y: toSvgY(entry.actualFlow),
    }));

    return {
      w,
      h,
      pad,
      iw,
      ih,
      minY: yRange.viewMin,
      maxY: yRange.viewMax,
      viewSpanX: xRange.viewSpan,
      baseSpanX: xRange.baseSpan,
      viewSpanY: yRange.viewSpan,
      baseSpanY: yRange.baseSpan,
      toSvgY,
      xTicks,
      yTicks,
      avgCurvePoints,
      avgPath,
      regression,
      scatterPoints,
    };
  }, [filteredGrindFlowEntries, flowZoom]);

  // Drag-to-pan handlers for both charts
  const dragRef = useRef<{
    chart: 'time' | 'flow';
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
    svgElement: SVGSVGElement;
    moved: boolean;
  } | null>(null);
  const [draggingChart, setDraggingChart] = useState<'time' | 'flow' | null>(null);

  const handleSvgPointerDown = (
    chart: 'time' | 'flow',
    e: React.PointerEvent<SVGSVGElement>
  ) => {
    if (e.button !== 0) return;
    dragRef.current = {
      chart,
      startX: e.clientX,
      startY: e.clientY,
      lastX: e.clientX,
      lastY: e.clientY,
      svgElement: e.currentTarget,
      moved: false,
    };
  };

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const drag = dragRef.current;
    if (!drag) return;

    const totalMove = Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY);
    if (!drag.moved && totalMove < 4) return;
    if (!drag.moved) {
      drag.moved = true;
      setDraggingChart(drag.chart);
    }

    const rect = drag.svgElement.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const dxPx = e.clientX - drag.lastX;
    const dyPx = e.clientY - drag.lastY;
    drag.lastX = e.clientX;
    drag.lastY = e.clientY;

    if (drag.chart === 'time' && timeChart) {
      const scaleX = chartWidth / rect.width;
      const scaleY = chartHeight / rect.height;
      const dxSvg = dxPx * scaleX;
      const dySvg = dyPx * scaleY;
      const deltaPanX = -(dxSvg / innerWidth) * (timeChart.viewSpanX / timeChart.baseSpanX);
      const deltaPanY = (dySvg / innerHeight) * (timeChart.viewSpanY / timeChart.baseSpanY);
      setTimeZoom((prev) => ({
        ...prev,
        xPan: prev.xPan + deltaPanX,
        yPan: prev.yPan + deltaPanY,
      }));
    } else if (drag.chart === 'flow' && grindFlowChart) {
      const scaleX = grindFlowChart.w / rect.width;
      const scaleY = grindFlowChart.h / rect.height;
      const dxSvg = dxPx * scaleX;
      const dySvg = dyPx * scaleY;
      const deltaPanX = -(dxSvg / grindFlowChart.iw) * (grindFlowChart.viewSpanX / grindFlowChart.baseSpanX);
      const deltaPanY = (dySvg / grindFlowChart.ih) * (grindFlowChart.viewSpanY / grindFlowChart.baseSpanY);
      setFlowZoom((prev) => ({
        ...prev,
        xPan: prev.xPan + deltaPanX,
        yPan: prev.yPan + deltaPanY,
      }));
    }
  };

  const handleSvgPointerUp = () => {
    dragRef.current = null;
    setDraggingChart(null);
  };

  const inspectedEntry =
    filteredGrindFlowEntries.find((e) => e.shot.id === inspectedShotId) ??
    filteredGrindFlowEntries[filteredGrindFlowEntries.length - 1] ??
    null;

  const timeClipId = `time-plot-clip-${uid}`;
  const flowClipId = `flow-plot-clip-${uid}`;

  return (
    <div className="space-y-6">
      {/* Header Selector */}
      <div className="bg-[#141822] border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-medium text-amber-500 uppercase tracking-wider">
            Extraction Dynamics & Dial-In Telemetry
          </span>
          <h2 className="text-lg font-bold text-white mt-0.5">Dial-In Progression Analytics</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Track grind adjustments, flow rates, and sensory evolution across consecutive shots.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-medium">Machine:</label>
            <select
              value={effectiveMachineKey}
              onChange={(e) => setSelectedMachineKey(e.target.value)}
              aria-label="Filter analytics by machine"
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Machines ({shots.length} total shots)</option>
              {machineOptions.map((m) => (
                <option key={m.key} value={m.key}>
                  {m.label} ({m.count} {m.count === 1 ? 'shot' : 'shots'})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-400 font-medium">Filter Batch:</label>
            <select
              value={selectedBeanId}
              onChange={(e) => setSelectedBeanId(e.target.value)}
              aria-label="Filter analytics by coffee batch"
              className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="all">All Coffees ({shots.length} total shots)</option>
              {beans.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({shots.filter((s) => s.beanId === b.id).length} shots)
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {stats ? (
        <>
          {/* Key Metric Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-[#141822] border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono mb-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Avg Extraction Time</span>
              </div>
              <div className="text-2xl font-mono font-bold text-white tabular-nums">
                {stats.avgTime.toFixed(1)} <span className="text-xs font-normal text-slate-400">sec</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Across {stats.count} recorded pulls</div>
            </div>

            <div className="bg-[#141822] border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono mb-1">
                <Droplets className="w-3.5 h-3.5 text-amber-400" />
                <span>Average Brew Ratio</span>
              </div>
              <div className="text-2xl font-mono font-bold text-amber-400 tabular-nums">
                1:{stats.avgRatio.toFixed(2)}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Target range: 1:1.8 – 1:2.4</div>
            </div>

            <div className="bg-[#141822] border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono mb-1">
                <Gauge className="w-3.5 h-3.5 text-amber-400" />
                <span>Flow (Avg / Actual)</span>
              </div>
              <div className="flex items-baseline gap-1.5 flex-wrap font-mono tabular-nums">
                <span className="text-xl font-bold text-white">{stats.avgFlow.toFixed(2)}</span>
                <span className="text-slate-600">/</span>
                <span className="text-xl font-bold text-sky-300">{stats.avgActualFlow.toFixed(2)}</span>
                <span className="text-xs font-normal text-slate-400">g/s</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Actual = yield ÷ (time − pre-inf)</div>
            </div>

            <div className="bg-[#141822] border border-slate-800 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-slate-400 text-xs font-mono mb-1">
                <Award className="w-3.5 h-3.5 text-amber-400" />
                <span>Mean Cup Score</span>
              </div>
              <div className="text-2xl font-mono font-bold text-white tabular-nums">
                {stats.avgRating.toFixed(1)} <span className="text-xs font-normal text-slate-400">/ 5.0</span>
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Highest scored: {stats.bestShot.rating.toFixed(1)} ★</div>
            </div>
          </div>

          {/* Golden Recipe Card for Current Coffee */}
          {stats.bestShot && (
            <div className="bg-gradient-to-r from-amber-950/30 to-[#141822] border border-amber-500/30 rounded-xl p-5 shadow-sm">
              <div className="flex items-center gap-2 mb-2 text-amber-400 font-semibold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Golden Dial-In Reference ({stats.bestShot.beanName})</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3 pt-3 border-t border-amber-500/20 text-xs font-mono">
                <div>
                  <span className="text-slate-400 block text-[11px]">Dose / Yield</span>
                  <strong className="text-white text-sm">
                    {stats.bestShot.doseGrams.toFixed(1)}g → {stats.bestShot.yieldGrams.toFixed(1)}g
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Actual Grind Setting</span>
                  <div className="flex items-baseline gap-1">
                    <strong className="text-amber-400 text-sm font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                      {stats.bestShot.actualSetting !== undefined ? stats.bestShot.actualSetting.toFixed(1) : stats.bestShot.grindSetting}
                    </strong>
                    <span className="text-[10px] text-amber-300">actual</span>
                  </div>
                  {stats.bestShot.zeroSetting !== undefined && stats.bestShot.zeroSetting !== 0 && (
                    <span className="text-[10px] text-slate-500 block">
                      ({stats.bestShot.grindSetting} dial − {stats.bestShot.zeroSetting} zero)
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">{stats.bestShot.grinder}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Shot Duration</span>
                  <strong className="text-white text-sm">
                    {stats.bestShot.totalTimeSeconds.toFixed(1)}s ({stats.bestShot.preInfusionSeconds}s pre)
                  </strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Water Temp · Machine</span>
                  <strong className="text-white text-sm">{stats.bestShot.waterTempC}°C</strong>
                  <span className="text-[10px] text-slate-400 block">{stats.bestShot.machine}</span>
                  {stats.bestShot.waterRecipeName && (
                    <span className="text-[10px] text-sky-300 block truncate" title={stats.bestShot.waterRecipeName}>
                      {stats.bestShot.waterRecipeName}
                    </span>
                  )}
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Cup Rating</span>
                  <strong className="text-amber-400 text-sm">{stats.bestShot.rating.toFixed(1)} / 5.0 ★</strong>
                </div>
              </div>
            </div>
          )}

          {/* Graph 1: Dial-In Progression Curve Chart */}
          <div className="bg-[#141822] border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-amber-400" />
                  <span>Shot Sequence vs Extraction Time Curve</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualizes how adjusting grinder settings dialed the shot into the 25s–32s golden window. Drag plot to pan.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <AxisZoomControls
                  zoom={timeZoom}
                  onZoomX={(factor) =>
                    setTimeZoom((prev) => ({ ...prev, xZoom: clampZoom(prev.xZoom * factor) }))
                  }
                  onZoomY={(factor) =>
                    setTimeZoom((prev) => ({ ...prev, yZoom: clampZoom(prev.yZoom * factor) }))
                  }
                  onReset={() => setTimeZoom(DEFAULT_ZOOM)}
                  accentColor="amber"
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400 mb-3">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 bg-amber-400 inline-block" />
                <span>Shot Duration</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-0.5 border-t border-dashed border-emerald-400 inline-block" />
                <span>Golden Target (28s)</span>
              </span>
            </div>

            {/* SVG Plot */}
            {timeChart && (
              <div className="w-full overflow-x-auto">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  onPointerDown={(e) => handleSvgPointerDown('time', e)}
                  onPointerMove={handleSvgPointerMove}
                  onPointerUp={handleSvgPointerUp}
                  onPointerCancel={handleSvgPointerUp}
                  onPointerLeave={handleSvgPointerUp}
                  className={`w-full h-auto min-w-[550px] select-none ${
                    timeZoom.xZoom > 1 || timeZoom.yZoom > 1 ? 'touch-none' : 'touch-pan-y'
                  } ${
                    draggingChart === 'time' ? 'cursor-grabbing' : 'cursor-grab'
                  }`}
                >
                  <defs>
                    <clipPath id={timeClipId}>
                      <rect
                        x={padding.left - 4}
                        y={padding.top - 14}
                        width={innerWidth + 8}
                        height={innerHeight + 22}
                      />
                    </clipPath>
                  </defs>

                  {/* Target Zone Shading (24s - 32s) */}
                  {(() => {
                    const bandBottom = Math.max(24, timeChart.viewMinY);
                    const bandTop = Math.min(32, timeChart.viewMaxY);
                    if (bandTop <= bandBottom) return null;
                    const y24 = timeChart.toSvgY(bandBottom);
                    const y32 = timeChart.toSvgY(bandTop);
                    return (
                      <rect
                        x={padding.left}
                        y={y32}
                        width={innerWidth}
                        height={y24 - y32}
                        fill="rgba(16, 185, 129, 0.05)"
                      />
                    );
                  })()}

                  {/* Horizontal reference lines */}
                  {timeChart.yTicks.map((tick) => (
                    <g key={tick.val}>
                      <line
                        x1={padding.left}
                        y1={tick.y}
                        x2={chartWidth - padding.right}
                        y2={tick.y}
                        stroke="#1e293b"
                        strokeWidth={1}
                        opacity={0.85}
                      />
                      <text
                        x={padding.left - 8}
                        y={tick.y + 4}
                        textAnchor="end"
                        className="text-[10px] font-mono fill-slate-500"
                      >
                        {tick.label}
                      </text>
                    </g>
                  ))}

                  {/* Golden Target 28s line */}
                  {28 >= timeChart.viewMinY && 28 <= timeChart.viewMaxY && (
                    <line
                      x1={padding.left}
                      y1={timeChart.toSvgY(28)}
                      x2={chartWidth - padding.right}
                      y2={timeChart.toSvgY(28)}
                      stroke="#10b981"
                      strokeWidth={1.5}
                      strokeDasharray="4,4"
                      opacity={0.75}
                    />
                  )}

                  {/* Vertical X grid & Shot Index Labels */}
                  {timeChart.xTicks.map((tick) => (
                    <g key={tick.index}>
                      <line
                        x1={tick.x}
                        y1={padding.top}
                        x2={tick.x}
                        y2={padding.top + innerHeight}
                        stroke="#1e293b"
                        strokeWidth="1"
                        opacity="0.45"
                      />
                      <text
                        x={tick.x}
                        y={chartHeight - 14}
                        textAnchor="middle"
                        className="text-[10px] font-mono fill-slate-400"
                      >
                        Shot #{tick.index + 1}
                      </text>
                      <text
                        x={tick.x}
                        y={chartHeight - 3}
                        textAnchor="middle"
                        className="text-[9px] font-mono fill-slate-500"
                      >
                        {tick.rating.toFixed(1)}★
                      </text>
                    </g>
                  ))}

                  {/* Clipped Plot Area */}
                  <g clipPath={`url(#${timeClipId})`}>
                    {/* Connecting Line */}
                    {timeChart.pts.length > 1 && (
                      <path
                        d={timeChart.linePath}
                        fill="none"
                        stroke="#f59e0b"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Data Vertex Points & Labels */}
                    {timeChart.pts.map((p) => {
                      const isDialed = p.shot.isDialedIn;
                      return (
                        <g key={p.shot.id}>
                          <title>
                            {`Shot #${p.index + 1}: ${p.shot.totalTimeSeconds.toFixed(1)}s · ${
                              p.shot.actualSetting !== undefined
                                ? `Actual ${p.shot.actualSetting.toFixed(1)}`
                                : `Grind ${p.shot.grindSetting}`
                            } · ${p.shot.rating.toFixed(1)}★`}
                          </title>
                          <circle
                            cx={p.x}
                            cy={p.y}
                            r={isDialed ? 6 : 4.5}
                            fill={isDialed ? '#fbbf24' : '#0f172a'}
                            stroke="#f59e0b"
                            strokeWidth="2"
                          />
                          <text
                            x={p.x}
                            y={p.y - 10}
                            textAnchor="middle"
                            className="text-[10px] font-mono font-bold fill-amber-300"
                          >
                            {p.shot.actualSetting !== undefined
                              ? `Act ${p.shot.actualSetting.toFixed(1)}`
                              : `Grind ${p.shot.grindSetting}`}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                </svg>
              </div>
            )}
          </div>

          {/* Graph 2: Actual Grinder Position vs Actual Flow Rate Chart */}
          <div className="bg-[#141822] border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-sky-400" />
                  <span>Actual Grinder Position vs. Actual Flow Rate</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Maps zero-calibrated grind position (Dial − Zero) against actual flow rate (Yield ÷ [Total Time − Pre-infusion]). Drag plot to pan.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
                <AxisZoomControls
                  zoom={flowZoom}
                  onZoomX={(factor) =>
                    setFlowZoom((prev) => ({ ...prev, xZoom: clampZoom(prev.xZoom * factor) }))
                  }
                  onZoomY={(factor) =>
                    setFlowZoom((prev) => ({ ...prev, yZoom: clampZoom(prev.yZoom * factor) }))
                  }
                  onReset={() => setFlowZoom(DEFAULT_ZOOM)}
                  accentColor="sky"
                />

                {grinderOptions.length > 1 && (
                  <select
                    value={effectiveGrinderFilter}
                    onChange={(e) => setSelectedGrinderFilter(e.target.value)}
                    aria-label="Filter grinder for flow chart"
                    className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                  >
                    <option value="all">All Grinders ({allGrindFlowEntries.length})</option>
                    {grinderOptions.map((g) => (
                      <option key={g.name} value={g.name}>
                        {g.name} ({g.count})
                      </option>
                    ))}
                  </select>
                )}

                {grindFlowChart?.regression && (
                  <span className="px-2.5 py-1 rounded-md bg-sky-500/10 border border-sky-500/30 text-sky-300">
                    {grindFlowChart.regression.slopePerUnit >= 0 ? '+' : ''}
                    {grindFlowChart.regression.slopePerUnit.toFixed(2)} g/s per +1.0 step
                  </span>
                )}
              </div>
            </div>

            {grindFlowChart ? (
              <>
                <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono text-slate-400 mb-3">
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 bg-sky-400 inline-block" />
                    <span>Mean Actual Flow per Setting</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                    <span>Dialed-In Shot</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-3 h-0.5 border-t border-dashed border-emerald-400 inline-block" />
                    <span>Target Main Flow (1.2–1.8 g/s)</span>
                  </span>
                  {grindFlowChart.regression && (
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-0.5 border-t border-dashed border-violet-400 inline-block" />
                      <span>Trend Line</span>
                    </span>
                  )}
                </div>

                <div className="w-full overflow-x-auto">
                  <svg
                    viewBox={`0 0 ${grindFlowChart.w} ${grindFlowChart.h}`}
                    onPointerDown={(e) => handleSvgPointerDown('flow', e)}
                    onPointerMove={handleSvgPointerMove}
                    onPointerUp={handleSvgPointerUp}
                    onPointerCancel={handleSvgPointerUp}
                    onPointerLeave={handleSvgPointerUp}
                    className={`w-full h-auto min-w-[550px] select-none ${
                      flowZoom.xZoom > 1 || flowZoom.yZoom > 1 ? 'touch-none' : 'touch-pan-y'
                    } ${
                      draggingChart === 'flow' ? 'cursor-grabbing' : 'cursor-grab'
                    }`}
                  >
                    <defs>
                      <clipPath id={flowClipId}>
                        <rect
                          x={grindFlowChart.pad.left - 4}
                          y={grindFlowChart.pad.top - 14}
                          width={grindFlowChart.iw + 8}
                          height={grindFlowChart.ih + 22}
                        />
                      </clipPath>
                    </defs>

                    {/* Target Main Extraction Flow Shading (1.2 - 1.8 g/s) */}
                    {(() => {
                      const bandBottom = Math.max(1.2, grindFlowChart.minY);
                      const bandTop = Math.min(1.8, grindFlowChart.maxY);
                      if (bandTop <= bandBottom) return null;
                      const yTop = grindFlowChart.toSvgY(bandTop);
                      const yBot = grindFlowChart.toSvgY(bandBottom);
                      return (
                        <rect
                          x={grindFlowChart.pad.left}
                          y={yTop}
                          width={grindFlowChart.iw}
                          height={yBot - yTop}
                          fill="rgba(16, 185, 129, 0.07)"
                        />
                      );
                    })()}

                    {/* Horizontal Y grid & g/s labels */}
                    {grindFlowChart.yTicks.map((tick) => (
                      <g key={tick.val}>
                        <line
                          x1={grindFlowChart.pad.left}
                          y1={tick.y}
                          x2={grindFlowChart.w - grindFlowChart.pad.right}
                          y2={tick.y}
                          stroke="#1e293b"
                          strokeWidth="1"
                        />
                        <text
                          x={grindFlowChart.pad.left - 8}
                          y={tick.y + 4}
                          textAnchor="end"
                          className="text-[10px] font-mono fill-slate-500"
                        >
                          {tick.label}
                        </text>
                      </g>
                    ))}

                    {/* Target Center Reference Line (1.5 g/s) */}
                    {1.5 >= grindFlowChart.minY && 1.5 <= grindFlowChart.maxY && (
                      <line
                        x1={grindFlowChart.pad.left}
                        y1={grindFlowChart.toSvgY(1.5)}
                        x2={grindFlowChart.w - grindFlowChart.pad.right}
                        y2={grindFlowChart.toSvgY(1.5)}
                        stroke="#10b981"
                        strokeWidth="1.25"
                        strokeDasharray="4,4"
                        opacity="0.7"
                      />
                    )}

                    {/* Vertical X grid & Actual Position labels */}
                    {grindFlowChart.xTicks.map((tick, idx) => (
                      <g key={idx}>
                        <line
                          x1={tick.x}
                          y1={grindFlowChart.pad.top}
                          x2={tick.x}
                          y2={grindFlowChart.pad.top + grindFlowChart.ih}
                          stroke="#1e293b"
                          strokeWidth="1"
                          opacity="0.6"
                        />
                        <text
                          x={tick.x}
                          y={grindFlowChart.pad.top + grindFlowChart.ih + 16}
                          textAnchor="middle"
                          className="text-[10px] font-mono fill-slate-400"
                        >
                          {tick.label}
                        </text>
                      </g>
                    ))}

                    {/* Axis titles */}
                    <text
                      x={grindFlowChart.pad.left - 42}
                      y={grindFlowChart.pad.top + grindFlowChart.ih / 2}
                      textAnchor="middle"
                      transform={`rotate(-90 ${grindFlowChart.pad.left - 42} ${grindFlowChart.pad.top + grindFlowChart.ih / 2})`}
                      className="text-[10px] font-mono fill-slate-500"
                    >
                      Actual Flow (g/s)
                    </text>
                    <text
                      x={grindFlowChart.pad.left + grindFlowChart.iw / 2}
                      y={grindFlowChart.h - 10}
                      textAnchor="middle"
                      className="text-[10px] font-mono fill-slate-500"
                    >
                      Actual Grinder Position (Finer ← → Coarser)
                    </text>

                    {/* Clipped Plot Area */}
                    <g clipPath={`url(#${flowClipId})`}>
                      {/* Regression Trend Line */}
                      {grindFlowChart.regression && (
                        <line
                          x1={grindFlowChart.regression.x1}
                          y1={grindFlowChart.regression.y1}
                          x2={grindFlowChart.regression.x2}
                          y2={grindFlowChart.regression.y2}
                          stroke="#a78bfa"
                          strokeWidth="1.5"
                          strokeDasharray="5,4"
                          opacity="0.7"
                        />
                      )}

                      {/* Mean Actual Flow Curve Connecting Distinct Grinder Positions */}
                      {grindFlowChart.avgCurvePoints.length > 1 && (
                        <path
                          d={grindFlowChart.avgPath}
                          fill="none"
                          stroke="#38bdf8"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      )}

                      {/* Mean marker when multiple shots share the same setting */}
                      {grindFlowChart.avgCurvePoints
                        .filter((pt) => pt.count > 1)
                        .map((pt) => (
                          <rect
                            key={`mean-${pt.pos}`}
                            x={pt.x - 4}
                            y={pt.y - 4}
                            width="8"
                            height="8"
                            transform={`rotate(45 ${pt.x} ${pt.y})`}
                            fill="#0f172a"
                            stroke="#38bdf8"
                            strokeWidth="2"
                          />
                        ))}

                      {/* Individual Shot Scatter Points */}
                      {grindFlowChart.scatterPoints.map((pt) => {
                        const isInspected = inspectedEntry?.shot.id === pt.shot.id;
                        const isDialed = pt.shot.isDialedIn;
                        return (
                          <g
                            key={pt.shot.id}
                            className="cursor-pointer"
                            onMouseEnter={() => setInspectedShotId(pt.shot.id)}
                            onClick={() => setInspectedShotId(pt.shot.id)}
                          >
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r={isInspected ? 7 : isDialed ? 5.5 : 4.5}
                              fill={isDialed ? '#fbbf24' : '#0f172a'}
                              stroke={isInspected ? '#ffffff' : isDialed ? '#f59e0b' : '#38bdf8'}
                              strokeWidth={isInspected ? 2.5 : 2}
                            />
                            {(isInspected || grindFlowChart.scatterPoints.length <= 10) && (
                              <text
                                x={pt.x}
                                y={pt.y - 10}
                                textAnchor="middle"
                                className={`text-[9px] font-mono font-semibold ${
                                  isInspected ? 'fill-white' : 'fill-sky-300'
                                }`}
                              >
                                {pt.actualFlow.toFixed(2)}
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </g>
                  </svg>
                </div>

                {/* Inspected Shot Details Bar */}
                {inspectedEntry && (
                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs font-mono bg-slate-900/50 rounded-lg px-3 py-2">
                    <div className="flex flex-wrap items-center gap-2 text-slate-300">
                      <span className="text-sky-400 font-semibold">{inspectedEntry.shot.beanName}</span>
                      <span className="text-slate-600">·</span>
                      <span className="text-slate-400">{inspectedEntry.grinderLabel}</span>
                      {inspectedEntry.shot.waterRecipeName && (
                        <>
                          <span className="text-slate-600">·</span>
                          <span className="text-sky-300">{inspectedEntry.shot.waterRecipeName}</span>
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-slate-300">
                      <span>
                        Actual Pos:{' '}
                        <strong className="text-amber-400">
                          {inspectedEntry.actualPosition.toFixed(1)}
                        </strong>
                        {inspectedEntry.shot.zeroSetting !== undefined &&
                          inspectedEntry.shot.zeroSetting !== 0 && (
                            <span className="text-slate-500 ml-1">
                              ({inspectedEntry.shot.grindSetting} − {inspectedEntry.shot.zeroSetting})
                            </span>
                          )}
                      </span>
                      <span>
                        Actual Flow:{' '}
                        <strong className="text-sky-300">
                          {inspectedEntry.actualFlow.toFixed(2)} g/s
                        </strong>
                      </span>
                      <span>
                        Avg Flow:{' '}
                        <strong className="text-slate-200">
                          {inspectedEntry.avgFlow.toFixed(2)} g/s
                        </strong>
                      </span>
                      <span className="text-slate-400">
                        {inspectedEntry.shot.doseGrams}g → {inspectedEntry.shot.yieldGrams}g in{' '}
                        {inspectedEntry.shot.totalTimeSeconds}s ({inspectedEntry.shot.preInfusionSeconds}s pre)
                      </span>
                      <span className="text-amber-400">{inspectedEntry.shot.rating.toFixed(1)}★</span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="py-8 text-center text-xs text-slate-500 font-mono">
                No shots with numeric grinder settings and valid main extraction times recorded yet.
              </div>
            )}
          </div>

          {/* Aggregate Sensory Wheel & Flavor Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#141822] border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col items-center">
              <div className="w-full pb-3 border-b border-slate-800 mb-2">
                <h3 className="text-sm font-semibold text-white">Mean Sensory Cupping Wheel</h3>
                <p className="text-xs text-slate-400">Aggregate flavor balance of recorded extractions</p>
              </div>
              <SensorySpiderChart profile={stats.avgTaste} size={240} />
            </div>

            <div className="bg-[#141822] border border-slate-800 rounded-xl p-5 shadow-sm space-y-4">
              <div className="pb-3 border-b border-slate-800">
                <h3 className="text-sm font-semibold text-white">Dominant Flavor Spectrum</h3>
                <p className="text-xs text-slate-400">Top tasting notes detected across shots</p>
              </div>

              {stats.topTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {stats.topTags.map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 border border-amber-500/30 text-amber-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">No sensory tags logged yet.</p>
              )}

              <div className="pt-4 border-t border-slate-800 space-y-2 text-xs">
                <div className="text-slate-300 font-medium">Barista Dial-In Tip:</div>
                <p className="text-slate-400 leading-relaxed">
                  When switching grind size on flat burrs, purge 1-2g of coffee before measuring your shot. As beans degas past day 14, expect to tighten grind by 0.5 to 1.0 click to sustain uniform backpressure.
                </p>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-[#141822] border border-slate-800 rounded-xl p-12 text-center text-slate-400 space-y-3">
          <div>No extraction shots recorded for this selection yet.</div>
          {(selectedBeanId !== 'all' || effectiveMachineKey !== 'all') && (
            <div className="flex flex-wrap items-center justify-center gap-2">
              {effectiveMachineKey !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedMachineKey('all')}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 transition-colors"
                >
                  Show All Machines
                </button>
              )}
              {selectedBeanId !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedBeanId('all')}
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs text-slate-200 transition-colors"
                >
                  Show All Coffees
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
