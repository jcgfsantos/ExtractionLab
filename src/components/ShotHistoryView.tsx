import React, { useState, useMemo } from 'react';
import { EspressoShot, BeanBag, BrewPreset } from '../types/espresso';
import {
  Search,
  Filter,
  Copy,
  Edit2,
  Trash2,
  BookmarkCheck,
  BookmarkPlus,
  Star,
  Sliders,
  Table as TableIcon,
  LayoutGrid,
  Droplets,
} from 'lucide-react';
import { SensorySpiderChart } from './SensorySpiderChart';
import { PresetFormModal } from './PresetFormModal';
import { calculateActualFlowRate } from '../utils/coffeeCalculations';

interface ShotHistoryViewProps {
  shots: EspressoShot[];
  beans: BeanBag[];
  onEditShot: (shot: EspressoShot) => void;
  onDuplicateShot: (shot: EspressoShot) => void;
  onDeleteShot: (shotId: string) => void;
  onCompareShots: (shot1: EspressoShot, shot2: EspressoShot) => void;
  onSavePreset: (preset: BrewPreset) => void;
}

export const ShotHistoryView: React.FC<ShotHistoryViewProps> = ({
  shots,
  beans,
  onEditShot,
  onDuplicateShot,
  onDeleteShot,
  onCompareShots,
  onSavePreset,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedBeanFilter, setSelectedBeanFilter] = useState<string>('all');
  const [onlyDialedIn, setOnlyDialedIn] = useState<boolean>(false);
  const [minRatingFilter, setMinRatingFilter] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
  const [selectedForComparison, setSelectedForComparison] = useState<string[]>([]);
  const [expandedRadarId, setExpandedRadarId] = useState<string | null>(null);
  const [presetSourceShot, setPresetSourceShot] = useState<EspressoShot | null>(null);

  // Filtered & sorted shots (newest first)
  const filteredShots = useMemo(() => {
    return shots
      .filter((s) => {
        if (selectedBeanFilter !== 'all' && s.beanId !== selectedBeanFilter) return false;
        if (onlyDialedIn && !s.isDialedIn) return false;
        if (minRatingFilter > 0 && s.rating < minRatingFilter) return false;
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchBean = s.beanName.toLowerCase().includes(q);
          const matchRoaster = s.roaster.toLowerCase().includes(q);
          const matchGrinder = s.grinder.toLowerCase().includes(q);
          const matchSetting = s.grindSetting.toLowerCase().includes(q);
          const matchNotes = s.notes.toLowerCase().includes(q);
          const matchTags = s.flavorTags.some((t) => t.toLowerCase().includes(q));
          const matchWater = (s.waterRecipeName || '').toLowerCase().includes(q);
          if (!matchBean && !matchRoaster && !matchGrinder && !matchSetting && !matchNotes && !matchTags && !matchWater) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [shots, selectedBeanFilter, onlyDialedIn, minRatingFilter, searchQuery]);

  const handleToggleCompare = (id: string) => {
    if (selectedForComparison.includes(id)) {
      setSelectedForComparison(selectedForComparison.filter((i) => i !== id));
    } else {
      if (selectedForComparison.length >= 2) {
        // Replace second one
        setSelectedForComparison([selectedForComparison[0], id]);
      } else {
        setSelectedForComparison([...selectedForComparison, id]);
      }
    }
  };

  const handleTriggerCompare = () => {
    if (selectedForComparison.length !== 2) return;
    const shot1 = shots.find((s) => s.id === selectedForComparison[0]);
    const shot2 = shots.find((s) => s.id === selectedForComparison[1]);
    if (shot1 && shot2) {
      onCompareShots(shot1, shot2);
    }
  };

  return (
    <div className="space-y-5">
      {/* Search & Filter Toolbar */}
      <div className="bg-[#141822] border border-slate-800 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, grind, beans, tags..."
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Bean Filter */}
          <select
            value={selectedBeanFilter}
            onChange={(e) => setSelectedBeanFilter(e.target.value)}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value="all">All Bean Bags ({shots.length})</option>
            {beans.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({shots.filter((s) => s.beanId === b.id).length})
              </option>
            ))}
          </select>

          {/* Dialed In Filter Toggle */}
          <button
            onClick={() => setOnlyDialedIn(!onlyDialedIn)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors flex items-center gap-1.5 ${
              onlyDialedIn
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookmarkCheck className="w-3.5 h-3.5" />
            <span>Golden Recipes Only</span>
          </button>

          {/* Rating filter */}
          <select
            value={minRatingFilter}
            onChange={(e) => setMinRatingFilter(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-amber-500"
          >
            <option value={0}>Any Score</option>
            <option value={4}>4+ Stars</option>
            <option value={4.5}>4.5+ Stars</option>
          </select>

          {/* Card vs Table toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded ${viewMode === 'cards' ? 'bg-slate-800 text-amber-400' : 'text-slate-400'}`}
              title="Card View"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded ${viewMode === 'table' ? 'bg-slate-800 text-amber-400' : 'text-slate-400'}`}
              title="Telemetry Table View"
            >
              <TableIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Floating Action Bar */}
      {selectedForComparison.length > 0 && (
        <div className="bg-amber-950/40 border border-amber-500/40 rounded-xl p-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-amber-200">
            <span className="font-semibold">{selectedForComparison.length} of 2</span>
            <span>shots selected for side-by-side delta comparison.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedForComparison([])}
              className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded"
            >
              Clear
            </button>
            <button
              onClick={handleTriggerCompare}
              disabled={selectedForComparison.length !== 2}
              className="px-3 py-1.5 text-xs font-semibold bg-amber-500 text-slate-950 rounded-lg hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              Compare Side-by-Side
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredShots.length === 0 ? (
        <div className="bg-[#141822] border border-slate-800 rounded-xl p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center mx-auto text-slate-500 mb-3">
            <Filter className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-white">No extraction logs match</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, bean filter, or minimum rating threshold.
          </p>
        </div>
      ) : viewMode === 'table' ? (
        /* Telemetry Table View */
        <div className="bg-[#141822] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
                <tr>
                  <th className="py-3 px-3 w-10 text-center">Compare</th>
                  <th className="py-3 px-3">Date / Bean</th>
                  <th className="py-3 px-3 text-right">Dose → Yield</th>
                  <th className="py-3 px-3 text-center">Ratio</th>
                  <th className="py-3 px-3 text-right">Time (Pre)</th>
                  <th className="py-3 px-3 text-right">Flow (Avg / Act)</th>
                  <th className="py-3 px-3">Grinder @ Setting</th>
                  <th className="py-3 px-3">Temp / Bar</th>
                  <th className="py-3 px-3 text-center">Score</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-mono">
                {filteredShots.map((shot) => {
                  const isChecked = selectedForComparison.includes(shot.id);
                  const actualFlow =
                    shot.actualFlowRate ??
                    calculateActualFlowRate(
                      shot.yieldGrams,
                      shot.totalTimeSeconds,
                      shot.preInfusionSeconds
                    );
                  const shotDateObj = new Date(shot.timestamp);
                  const dateStr = shotDateObj.toLocaleDateString(undefined, {
                    year: shotDateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr
                      key={shot.id}
                      className={`hover:bg-slate-900/50 transition-colors ${
                        shot.isDialedIn ? 'bg-amber-500/[0.03]' : ''
                      }`}
                    >
                      <td className="py-3 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleCompare(shot.id)}
                          className="rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer"
                        />
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <div className="font-semibold text-white flex items-center gap-1.5">
                          <span>{shot.beanName}</span>
                          {shot.isDialedIn && (
                            <span title="Dialed-in recipe">
                              <BookmarkCheck className="w-3.5 h-3.5 text-amber-400" />
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400">{dateStr} · {shot.roaster}</div>
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums">
                        <span className="text-slate-300 font-semibold">{shot.doseGrams.toFixed(1)}g</span>
                        <span className="text-slate-500 mx-1">→</span>
                        <span className="text-amber-400 font-semibold">{shot.yieldGrams.toFixed(1)}g</span>
                      </td>
                      <td className="py-3 px-3 text-center tabular-nums font-bold text-amber-300">
                        1:{shot.ratio.toFixed(2)}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-slate-300">
                        {shot.totalTimeSeconds.toFixed(1)}s
                        {shot.preInfusionSeconds > 0 && (
                          <span className="text-[10px] text-slate-500 ml-1">({shot.preInfusionSeconds.toFixed(1)}s)</span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums text-slate-300">
                        <div>{shot.flowRate.toFixed(2)} g/s <span className="text-[10px] text-slate-500">avg</span></div>
                        <div className="text-sky-300">{actualFlow.toFixed(2)} g/s <span className="text-[10px] text-sky-400/70">act</span></div>
                      </td>
                      <td className="py-3 px-3 font-sans">
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-400 font-mono font-bold text-sm bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            {shot.actualSetting !== undefined ? shot.actualSetting.toFixed(1) : shot.grindSetting}
                            {shot.actualSetting !== undefined && (
                              <span className="text-[10px] font-normal text-amber-300/80 ml-1">actual</span>
                            )}
                          </span>
                          {shot.actualSetting !== undefined && shot.zeroSetting !== undefined && shot.zeroSetting !== 0 && (
                            <span className="text-[10px] font-mono text-slate-500" title={`Dial ${shot.grindSetting} - Zero ${shot.zeroSetting}`}>
                              ({shot.grindSetting} dial)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{shot.grinder}</div>
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">
                        <div>{shot.waterTempC}°C · {shot.peakPressureBars}b</div>
                        {shot.waterRecipeName && (
                          <div
                            className="text-[10px] text-sky-300 flex items-center gap-1 mt-0.5 truncate max-w-[165px]"
                            title={shot.waterRecipeName}
                          >
                            <Droplets className="w-3 h-3 shrink-0" />
                            <span className="truncate">{shot.waterRecipeName}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center gap-1 text-amber-400 font-bold">
                          <Star className="w-3.5 h-3.5 fill-amber-400" />
                          <span>{shot.rating.toFixed(1)}</span>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-sans">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => onEditShot(shot)}
                            title="Edit all shot data & timestamp"
                            className="p-1.5 text-slate-400 hover:text-amber-300 rounded hover:bg-slate-800 transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setPresetSourceShot(shot)}
                            title="Create preset recipe from this shot"
                            aria-label={`Create preset recipe from ${shot.beanName}`}
                            className="p-1.5 text-slate-400 hover:text-emerald-300 rounded hover:bg-slate-800 transition-colors"
                          >
                            <BookmarkPlus className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDuplicateShot(shot)}
                            title="Duplicate to tweak in logger"
                            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteShot(shot.id)}
                            title="Delete shot"
                            className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Detailed Cards View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredShots.map((shot) => {
            const isChecked = selectedForComparison.includes(shot.id);
            const isRadarOpen = expandedRadarId === shot.id;
            const actualFlow =
              shot.actualFlowRate ??
              calculateActualFlowRate(
                shot.yieldGrams,
                shot.totalTimeSeconds,
                shot.preInfusionSeconds
              );
            const shotDateObj = new Date(shot.timestamp);
            const dateStr = shotDateObj.toLocaleDateString(undefined, {
              year: shotDateObj.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            return (
              <div
                key={shot.id}
                className={`bg-[#141822] border rounded-xl p-5 shadow-sm transition-all relative ${
                  shot.isDialedIn
                    ? 'border-amber-500/40 bg-gradient-to-br from-[#141822] to-amber-950/15'
                    : 'border-slate-800'
                }`}
              >
                {/* Header Row */}
                <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800/80">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm text-white">{shot.beanName}</h3>
                      {shot.isDialedIn && (
                        <span className="text-[11px] font-mono text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.2 rounded font-medium flex items-center gap-1">
                          <BookmarkCheck className="w-3 h-3" />
                          <span>Dialed-In</span>
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-400">
                      <span>{shot.roaster}</span>
                      <span aria-hidden="true"> · </span>
                      <span className="font-mono text-[11px] text-slate-500">{dateStr}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded text-xs font-mono font-bold text-amber-400">
                      <Star className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{shot.rating.toFixed(1)}</span>
                    </div>

                    <input
                      type="checkbox"
                      title="Select to compare"
                      checked={isChecked}
                      onChange={() => handleToggleCompare(shot.id)}
                      className="rounded border-slate-700 text-amber-500 focus:ring-0 cursor-pointer ml-1"
                    />
                  </div>
                </div>

                {/* Primary Extraction Telemetry Matrix */}
                <div className="grid grid-cols-4 gap-2 my-3.5 text-center font-mono bg-slate-900/60 border border-slate-800/80 rounded-lg p-2.5">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Ratio</div>
                    <div className="text-sm font-bold text-amber-400 tabular-nums">
                      1:{shot.ratio.toFixed(2)}
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Mass (In/Out)</div>
                    <div className="text-xs font-semibold text-slate-200 tabular-nums">
                      {shot.doseGrams.toFixed(1)}g / {shot.yieldGrams.toFixed(1)}g
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Time (Total)</div>
                    <div className="text-xs font-semibold text-slate-200 tabular-nums">
                      {shot.totalTimeSeconds.toFixed(1)}s
                    </div>
                  </div>

                  <div>
                    <div className="text-[10px] text-slate-500 uppercase">Flow (Avg / Act)</div>
                    <div className="text-xs font-semibold text-slate-200 tabular-nums">
                      {shot.flowRate.toFixed(2)}
                      <span className="text-slate-500 mx-0.5">/</span>
                      <span className="text-sky-300">{actualFlow.toFixed(2)}</span>{' '}
                      <span className="text-[10px] font-normal text-slate-400">g/s</span>
                    </div>
                  </div>
                </div>

                {/* Hardware & Settings Strip with Actual & Dial Breakdown */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 mb-3">
                  <div className="flex items-center gap-1 text-slate-300 font-mono">
                    <Sliders className="w-3.5 h-3.5 text-amber-400" />
                    <span>Grind:</span>
                    {shot.actualSetting !== undefined ? (
                      <div className="flex items-baseline gap-1">
                        <strong className="text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                          {shot.actualSetting.toFixed(1)}
                        </strong>
                        <span className="text-[10px] text-amber-300/80">actual</span>
                        {shot.zeroSetting !== undefined && shot.zeroSetting !== 0 && (
                          <span className="text-[11px] text-slate-500 font-normal">
                            ({shot.grindSetting} dial − {shot.zeroSetting} zero)
                          </span>
                        )}
                      </div>
                    ) : (
                      <strong className="text-amber-400 font-bold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        {shot.grindSetting}
                      </strong>
                    )}
                    <span className="text-slate-500">({shot.grinder})</span>
                  </div>

                  <span aria-hidden="true" className="text-slate-700">·</span>

                  <div className="text-slate-400 font-mono text-[11px]">
                    {shot.waterTempC}°C · {shot.peakPressureBars} bar
                  </div>

                  {shot.waterRecipeName && (
                    <>
                      <span aria-hidden="true" className="text-slate-700">·</span>
                      <div className="flex items-center gap-1 text-sky-300 font-mono text-[11px] bg-sky-500/10 border border-sky-500/20 px-1.5 py-0.5 rounded">
                        <Droplets className="w-3 h-3 shrink-0" />
                        <span>{shot.waterRecipeName}</span>
                      </div>
                    </>
                  )}

                  {shot.channeling !== 'None / Clean' && (
                    <span className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 px-1.5 py-0.2 rounded font-mono">
                      {shot.channeling}
                    </span>
                  )}
                </div>

                {/* Flavor tags */}
                {shot.flavorTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {shot.flavorTags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Barista Notes */}
                {shot.notes && (
                  <p className="text-xs text-slate-300 bg-slate-900/40 border border-slate-800/60 rounded-md p-2.5 mb-3 leading-relaxed">
                    {shot.notes}
                  </p>
                )}

                {/* Collapsible Radar View */}
                {isRadarOpen && (
                  <div className="my-3 p-3 bg-slate-900/80 border border-slate-800 rounded-lg flex flex-col items-center">
                    <SensorySpiderChart profile={shot.tasteProfile} size={180} />
                  </div>
                )}

                {/* Footer Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <button
                    onClick={() => setExpandedRadarId(isRadarOpen ? null : shot.id)}
                    className="text-slate-400 hover:text-amber-400 font-medium transition-colors"
                  >
                    {isRadarOpen ? 'Hide Taste Wheel' : 'Show Taste Wheel'}
                  </button>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => onEditShot(shot)}
                      className="px-2.5 py-1 rounded bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 transition-colors flex items-center gap-1 font-medium"
                      title="Edit all shot data including date and time"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => setPresetSourceShot(shot)}
                      className="px-2.5 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-colors flex items-center gap-1 font-medium"
                      title="Create a reusable preset recipe from this shot"
                    >
                      <BookmarkPlus className="w-3 h-3" />
                      <span>Save Preset</span>
                    </button>
                    <button
                      onClick={() => onDuplicateShot(shot)}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors flex items-center gap-1 font-medium"
                      title="Load these exact settings into logger to pull your next shot"
                    >
                      <Copy className="w-3 h-3" />
                      <span>Tweak Shot</span>
                    </button>
                    <button
                      onClick={() => onDeleteShot(shot.id)}
                      className="p-1 text-slate-500 hover:text-rose-400 transition-colors"
                      title="Delete shot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Preset Recipe from Shot Modal */}
      {presetSourceShot && (
        <PresetFormModal
          key={`shot-preset-${presetSourceShot.id}`}
          sourceShot={presetSourceShot}
          onSave={onSavePreset}
          onClose={() => setPresetSourceShot(null)}
        />
      )}
    </div>
  );
};
