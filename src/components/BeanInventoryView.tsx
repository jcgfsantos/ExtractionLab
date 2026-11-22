import React, { useState } from 'react';
import { BeanBag, EspressoShot } from '../types/espresso';
import {
  calculateDaysOffRoast,
  getRoastFreshnessStatus,
  FLAVOR_CATEGORIES,
} from '../utils/coffeeCalculations';
import {
  Plus,
  Coffee,
  Calendar,
  CheckCircle2,
  Edit2,
  Trash2,
  Scale,
  Check,
  X,
} from 'lucide-react';
import { NumericInput } from './NumericInput';

interface BeanInventoryViewProps {
  beans: BeanBag[];
  shots: EspressoShot[];
  activeBeanId: string;
  onSetActiveBean: (id: string) => void;
  onSaveBean: (bean: BeanBag) => void;
  onDeleteBean: (id: string) => void;
  onLogShotWithBean: (beanId: string) => void;
}

export const BeanInventoryView: React.FC<BeanInventoryViewProps> = ({
  beans,
  shots,
  activeBeanId,
  onSetActiveBean,
  onSaveBean,
  onDeleteBean,
  onLogShotWithBean,
}) => {
  const [filterTab, setFilterTab] = useState<'active' | 'all' | 'finished'>('active');
  const [editingBean, setEditingBean] = useState<BeanBag | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  // Form State
  const [name, setName] = useState<string>('');
  const [roaster, setRoaster] = useState<string>('');
  const [origin, setOrigin] = useState<string>('');
  const [variety, setVariety] = useState<string>('');
  const [process, setProcess] = useState<BeanBag['process']>('Washed');
  const [roastLevel, setRoastLevel] = useState<BeanBag['roastLevel']>('Light');
  const [roastDate, setRoastDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bagWeightGrams, setBagWeightGrams] = useState<number>(250);
  const [altitudeMeters, setAltitudeMeters] = useState<number>(1900);
  const [notes, setNotes] = useState<string>('');
  const [flavorTags, setFlavorTags] = useState<string[]>([]);
  const [activeFlavorCategory, setActiveFlavorCategory] = useState<string>('Fruity & Citrus');
  const [customFlavorInput, setCustomFlavorInput] = useState<string>('');
  const [status, setStatus] = useState<BeanBag['status']>('active');

  const openNewModal = () => {
    setEditingBean(null);
    setName('');
    setRoaster('');
    setOrigin('');
    setVariety('');
    setProcess('Washed');
    setRoastLevel('Light');
    setRoastDate(new Date().toISOString().split('T')[0]);
    setBagWeightGrams(250);
    setAltitudeMeters(1900);
    setNotes('');
    setFlavorTags([]);
    setActiveFlavorCategory('Fruity & Citrus');
    setCustomFlavorInput('');
    setStatus('active');
    setIsModalOpen(true);
  };

  const openEditModal = (b: BeanBag) => {
    setEditingBean(b);
    setName(b.name);
    setRoaster(b.roaster);
    setOrigin(b.origin);
    setVariety(b.variety);
    setProcess(b.process);
    setRoastLevel(b.roastLevel);
    setRoastDate(b.roastDate);
    setBagWeightGrams(b.bagWeightGrams);
    setAltitudeMeters(b.altitudeMeters || 1800);
    setNotes(b.notes || '');
    setFlavorTags(b.flavorTags ? [...b.flavorTags] : []);
    setActiveFlavorCategory('Fruity & Citrus');
    setCustomFlavorInput('');
    setStatus(b.status);
    setIsModalOpen(true);
  };

  const toggleBeanFlavorTag = (tag: string) => {
    setFlavorTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddCustomBeanFlavor = () => {
    const trimmed = customFlavorInput.trim();
    if (!trimmed) return;
    if (!flavorTags.includes(trimmed)) {
      setFlavorTags((prev) => [...prev, trimmed]);
    }
    setCustomFlavorInput('');
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roaster.trim()) return;

    const beanData: BeanBag = {
      id: editingBean ? editingBean.id : `bean-${Date.now()}`,
      name: name.trim(),
      roaster: roaster.trim(),
      origin: origin.trim() || 'Single Origin',
      variety: variety.trim() || 'Heirloom',
      process,
      roastLevel,
      roastDate,
      bagWeightGrams: Number(bagWeightGrams),
      altitudeMeters: Number(altitudeMeters) || undefined,
      status,
      flavorTags,
      notes: notes.trim(),
      createdAt: editingBean ? editingBean.createdAt : new Date().toISOString(),
    };

    onSaveBean(beanData);
    setIsModalOpen(false);
  };

  const filteredBeans = beans.filter((b) => {
    if (filterTab === 'active') return b.status === 'active';
    if (filterTab === 'finished') return b.status === 'finished' || b.status === 'archived';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-[#141822] border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-medium text-amber-500 uppercase tracking-wider">
            Coffee Roastery & Bag Inventory
          </span>
          <h2 className="text-lg font-bold text-white mt-0.5">Specialty Coffee Beans</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitor roast dates, degassing windows, origin details, and extraction history.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => setFilterTab('active')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                filterTab === 'active' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'
              }`}
            >
              In Rotation ({beans.filter((b) => b.status === 'active').length})
            </button>
            <button
              onClick={() => setFilterTab('finished')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                filterTab === 'finished' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'
              }`}
            >
              Archived ({beans.filter((b) => b.status !== 'active').length})
            </button>
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1 rounded font-medium transition-colors ${
                filterTab === 'all' ? 'bg-amber-500/20 text-amber-300' : 'text-slate-400'
              }`}
            >
              All ({beans.length})
            </button>
          </div>

          <button
            onClick={openNewModal}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Add Bag</span>
          </button>
        </div>
      </div>

      {/* Grid of Beans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredBeans.map((bean) => {
          const daysOff = calculateDaysOffRoast(bean.roastDate);
          const freshness = getRoastFreshnessStatus(daysOff);
          const beanShots = shots.filter((s) => s.beanId === bean.id);
          const isActive = bean.id === activeBeanId;
          const dialedInShot = beanShots.find((s) => s.isDialedIn);

          // Calculate coffee used (sum of doses)
          const totalUsedDose = beanShots.reduce((acc, s) => acc + s.doseGrams, 0);
          const estimatedRemaining = Math.max(0, bean.bagWeightGrams - totalUsedDose);

          return (
            <div
              key={bean.id}
              className={`bg-[#141822] border rounded-xl p-5 shadow-sm transition-all flex flex-col justify-between ${
                isActive ? 'border-amber-500/60 ring-1 ring-amber-500/20' : 'border-slate-800'
              }`}
            >
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
                  <div>
                    <span className="text-[11px] font-mono font-medium text-amber-400 uppercase tracking-wide">
                      {bean.roaster}
                    </span>
                    <h3 className="font-bold text-base text-white mt-0.5">{bean.name}</h3>
                    <div className="text-xs text-slate-400 mt-0.5">{bean.origin}</div>
                  </div>

                  {isActive ? (
                    <span className="text-[11px] font-mono text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                      <span>Active</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => onSetActiveBean(bean.id)}
                      className="text-[11px] text-slate-400 hover:text-amber-300 font-mono underline"
                    >
                      Make Active
                    </button>
                  )}
                </div>

                {/* Degassing & Freshness Ribbon */}
                <div className="my-3 p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 space-y-1 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-amber-400" />
                      <span>Roast: {bean.roastDate}</span>
                    </span>
                    <span className="font-mono font-semibold text-emerald-400">
                      {freshness.text}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">{freshness.note}</p>
                </div>

                {/* Coffee Specs Matrix */}
                <div className="grid grid-cols-2 gap-2 text-xs font-mono mb-3 bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60">
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Process</span>
                    <span className="text-slate-200 font-medium">{bean.process}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Roast Level</span>
                    <span className="text-amber-400 font-medium">{bean.roastLevel}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Variety</span>
                    <span className="text-slate-200 truncate block">{bean.variety}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block uppercase">Altitude</span>
                    <span className="text-slate-200">{bean.altitudeMeters ? `${bean.altitudeMeters}m` : 'N/A'}</span>
                  </div>
                </div>

                {/* Bag Capacity & Shots Pulled */}
                <div className="flex items-center justify-between text-xs text-slate-400 py-1 font-mono">
                  <span className="flex items-center gap-1">
                    <Scale className="w-3.5 h-3.5 text-slate-500" />
                    <span>Remaining: ~{estimatedRemaining.toFixed(0)}g / {bean.bagWeightGrams}g</span>
                  </span>
                  <span>{beanShots.length} shots pulled</span>
                </div>

                {bean.flavorTags && bean.flavorTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {bean.flavorTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-[10px] font-medium text-amber-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {bean.notes && (
                  <p className="text-xs text-slate-300 italic mt-2 line-clamp-2">
                    "{bean.notes}"
                  </p>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between text-xs">
                <button
                  onClick={() => onLogShotWithBean(bean.id)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 font-medium flex items-center gap-1 transition-colors"
                >
                  <Coffee className="w-3.5 h-3.5" />
                  <span>Log Shot</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => openEditModal(bean)}
                    className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800"
                    title="Edit bag details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteBean(bean.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800"
                    title="Delete bag"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141822] border border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingBean ? 'Edit Coffee Bag' : 'Add New Coffee Bag'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Record bean origin, roast date, and varietal information for dial-in tracking.
              </p>
            </div>

            <form onSubmit={handleSave} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Bean Name / Farm</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Worka Sakaro, Pink Bourbon"
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Roaster</label>
                  <input
                    type="text"
                    required
                    value={roaster}
                    onChange={(e) => setRoaster(e.target.value)}
                    placeholder="e.g. Sey, Onyx, Tim Wendelboe"
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Origin / Region</label>
                  <input
                    type="text"
                    value={origin}
                    onChange={(e) => setOrigin(e.target.value)}
                    placeholder="e.g. Yirgacheffe, Ethiopia"
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Variety</label>
                  <input
                    type="text"
                    value={variety}
                    onChange={(e) => setVariety(e.target.value)}
                    placeholder="e.g. Heirloom, Geisha, SL28"
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Process</label>
                  <select
                    value={process}
                    onChange={(e) => setProcess(e.target.value as BeanBag['process'])}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Washed">Washed</option>
                    <option value="Natural">Natural</option>
                    <option value="Honey">Honey</option>
                    <option value="Anaerobic">Anaerobic</option>
                    <option value="Experimental">Experimental</option>
                    <option value="Wet-Hulled">Wet-Hulled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Roast Level</label>
                  <select
                    value={roastLevel}
                    onChange={(e) => setRoastLevel(e.target.value as BeanBag['roastLevel'])}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Light">Light (Nordic)</option>
                    <option value="Medium-Light">Medium-Light</option>
                    <option value="Medium">Medium</option>
                    <option value="Medium-Dark">Medium-Dark</option>
                    <option value="Dark">Dark</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Roast Date</label>
                  <input
                    type="date"
                    required
                    value={roastDate}
                    onChange={(e) => setRoastDate(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Bag Size (g)</label>
                  <NumericInput
                    value={bagWeightGrams}
                    onChangeValue={setBagWeightGrams}
                    emptyFallback={editingBean?.bagWeightGrams ?? 250}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Altitude (m)</label>
                  <NumericInput
                    value={altitudeMeters}
                    onChangeValue={setAltitudeMeters}
                    emptyFallback={editingBean?.altitudeMeters ?? 1900}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as BeanBag['status'])}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="active">Active (In Use)</option>
                    <option value="finished">Finished</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>

              {/* Default Flavor Descriptors */}
              <div className="space-y-2 pt-1">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-300 font-medium">
                    Default Flavor Notes ({flavorTags.length} selected)
                  </label>
                  <span className="text-[10px] text-slate-500 font-mono">
                    Auto-selected when logging shots
                  </span>
                </div>

                <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pb-1">
                  {FLAVOR_CATEGORIES.filter((c) => c.name !== 'Taste Flaws / Defects').map((cat) => (
                    <button
                      key={cat.name}
                      type="button"
                      onClick={() => setActiveFlavorCategory(cat.name)}
                      className={`px-2 py-1 text-[11px] rounded whitespace-nowrap transition-colors ${
                        activeFlavorCategory === cat.name
                          ? 'bg-amber-500 text-slate-950 font-semibold'
                          : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                      }`}
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1.5 p-2.5 bg-slate-900/70 rounded-lg border border-slate-800">
                  {FLAVOR_CATEGORIES.find((c) => c.name === activeFlavorCategory)?.tags.map((tag) => {
                    const selected = flavorTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleBeanFlavorTag(tag)}
                        className={`px-2.5 py-1 rounded text-[11px] transition-colors flex items-center gap-1 ${
                          selected
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-medium'
                            : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
                        }`}
                      >
                        {selected && <Check className="w-3 h-3 text-amber-400" />}
                        <span>{tag}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-1">
                    {flavorTags.length === 0 ? (
                      <span className="text-[11px] text-slate-500">No default flavors selected</span>
                    ) : (
                      flavorTags.map((tag) => (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => toggleBeanFlavorTag(tag)}
                          title="Remove flavor"
                          className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[11px] text-amber-300 hover:bg-rose-500/20 hover:border-rose-500/40 hover:text-rose-200 transition-colors flex items-center gap-1"
                        >
                          <span>{tag}</span>
                          <X className="w-3 h-3" />
                        </button>
                      ))
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <input
                      type="text"
                      value={customFlavorInput}
                      onChange={(e) => setCustomFlavorInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomBeanFlavor();
                        }
                      }}
                      placeholder="Custom flavor..."
                      className="bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-[11px] text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 w-32"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomBeanFlavor}
                      className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 border border-slate-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Tasting Notes / Producer Notes</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Jasmine, white peach, bergamot, silky tea finish..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-amber-500"
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
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors"
                >
                  {editingBean ? 'Save Changes' : 'Create Coffee Bag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
