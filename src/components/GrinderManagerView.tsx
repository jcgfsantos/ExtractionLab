import React, { useState, useEffect } from 'react';
import {
  GrinderProfile,
  MachineProfile,
  BasketProfile,
  EspressoShot,
  BurrType,
  BoilerType,
} from '../types/espresso';
import {
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Calculator,
  Disc,
  Coffee,
  Sliders,
  Filter,
} from 'lucide-react';
import {
  calculateActualGrindSetting,
  stepAdjustNumber,
  parseLocaleNumber,
  COMMON_MACHINES,
  COMMON_BASKETS,
} from '../utils/coffeeCalculations';
import { NumericInput } from './NumericInput';

export type EquipmentSection = 'grinders' | 'machines' | 'baskets';

interface GrinderManagerViewProps {
  grinders: GrinderProfile[];
  machines: MachineProfile[];
  baskets: BasketProfile[];
  shots: EspressoShot[];
  activeGrinderId: string;
  activeMachineId: string;
  activeBasketId: string;
  onSetActiveGrinder: (id: string) => void;
  onSaveGrinder: (grinder: GrinderProfile) => void;
  onDeleteGrinder: (id: string) => void;
  onSetActiveMachine: (id: string) => void;
  onSaveMachine: (machine: MachineProfile) => void;
  onDeleteMachine: (id: string) => void;
  onSetActiveBasket: (id: string) => void;
  onSaveBasket: (basket: BasketProfile) => void;
  onDeleteBasket: (id: string) => void;
  initialSection?: EquipmentSection;
}

export const GrinderManagerView: React.FC<GrinderManagerViewProps> = ({
  grinders,
  machines,
  baskets,
  shots,
  activeGrinderId,
  activeMachineId,
  activeBasketId,
  onSetActiveGrinder,
  onSaveGrinder,
  onDeleteGrinder,
  onSetActiveMachine,
  onSaveMachine,
  onDeleteMachine,
  onSetActiveBasket,
  onSaveBasket,
  onDeleteBasket,
  initialSection = 'grinders',
}) => {
  const [activeSection, setActiveSection] = useState<EquipmentSection>(initialSection);

  useEffect(() => {
    setActiveSection(initialSection);
  }, [initialSection]);

  const activeGrinder = grinders.find((g) => g.id === activeGrinderId) || grinders[0];
  const activeMachine = machines.find((m) => m.id === activeMachineId) || machines[0];
  const activeBasket = baskets.find((b) => b.id === activeBasketId) || baskets[0];

  // --- Grinder Modal State ---
  const [isGrinderModalOpen, setIsGrinderModalOpen] = useState<boolean>(false);
  const [editingGrinder, setEditingGrinder] = useState<GrinderProfile | null>(null);
  const [grinderName, setGrinderName] = useState<string>('');
  const [burrType, setBurrType] = useState<BurrType>('Flat');
  const [burrSizeMm, setBurrSizeMm] = useState<number>(64);
  const [burrModel, setBurrModel] = useState<string>('');
  const [zeroSetting, setZeroSetting] = useState<number>(1.5);
  const [zeroDescription, setZeroDescription] = useState<string>('');
  const [unit, setUnit] = useState<string>('dial marks');
  const [stepSize, setStepSize] = useState<string>('0.5');
  const [micronsPerClick, setMicronsPerClick] = useState<string>('');
  const [grinderNotes, setGrinderNotes] = useState<string>('');
  const [testDialSetting, setTestDialSetting] = useState<number>(15.0);

  // --- Machine Modal State ---
  const [isMachineModalOpen, setIsMachineModalOpen] = useState<boolean>(false);
  const [editingMachine, setEditingMachine] = useState<MachineProfile | null>(null);
  const [machineName, setMachineName] = useState<string>('');
  const [boilerType, setBoilerType] = useState<BoilerType>('Single Boiler');
  const [portafilterSizeMm, setPortafilterSizeMm] = useState<number>(58);
  const [defaultTempC, setDefaultTempC] = useState<number>(93.5);
  const [defaultPressureBars, setDefaultPressureBars] = useState<number>(9.0);
  const [defaultPreInfusionSeconds, setDefaultPreInfusionSeconds] = useState<string>('4');
  const [machineNotes, setMachineNotes] = useState<string>('');

  // --- Basket Modal State ---
  const [isBasketModalOpen, setIsBasketModalOpen] = useState<boolean>(false);
  const [editingBasket, setEditingBasket] = useState<BasketProfile | null>(null);
  const [basketName, setBasketName] = useState<string>('');
  const [basketManufacturer, setBasketManufacturer] = useState<string>('');
  const [ratedCapacityGrams, setRatedCapacityGrams] = useState<number>(18);
  const [basketStyle, setBasketStyle] = useState<NonNullable<BasketProfile['style']>>('Ridgeless');
  const [basketNotes, setBasketNotes] = useState<string>('');

  // --- Grinder Handlers ---
  const openNewGrinderModal = () => {
    setEditingGrinder(null);
    setGrinderName('');
    setBurrType('Flat');
    setBurrSizeMm(64);
    setBurrModel('');
    setZeroSetting(0.0);
    setZeroDescription('Burrs touch / chirp at collar mark');
    setUnit('dial marks');
    setStepSize('0.5');
    setMicronsPerClick('');
    setGrinderNotes('');
    setTestDialSetting(15.0);
    setIsGrinderModalOpen(true);
  };

  const openEditGrinderModal = (g: GrinderProfile) => {
    setEditingGrinder(g);
    setGrinderName(g.name);
    setBurrType(g.burrType);
    setBurrSizeMm(g.burrSizeMm || 64);
    setBurrModel(g.burrModel || '');
    setZeroSetting(g.zeroSetting);
    setZeroDescription(g.zeroDescription || '');
    setUnit(g.unit || 'dial marks');
    setStepSize(g.stepSize !== undefined ? String(g.stepSize) : '0.5');
    setMicronsPerClick(g.micronsPerClick !== undefined ? String(g.micronsPerClick) : '');
    setGrinderNotes(g.notes || '');
    setTestDialSetting(g.zeroSetting + 14.0);
    setIsGrinderModalOpen(true);
  };

  const handleGrinderSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!grinderName.trim()) return;

    const parsedMicrons = parseLocaleNumber(micronsPerClick);
    const validMicrons =
      micronsPerClick.trim() !== '' && !Number.isNaN(parsedMicrons) && parsedMicrons > 0
        ? parsedMicrons
        : undefined;

    const parsedStep = parseLocaleNumber(stepSize);
    const validStep =
      stepSize.trim() !== '' && !Number.isNaN(parsedStep) && parsedStep > 0
        ? parsedStep
        : 0.5;

    const profile: GrinderProfile = {
      id: editingGrinder ? editingGrinder.id : `grinder-${Date.now()}`,
      name: grinderName.trim(),
      burrType,
      burrSizeMm: Number(burrSizeMm) || undefined,
      burrModel: burrModel.trim() || undefined,
      zeroSetting: Number(zeroSetting),
      zeroDescription: zeroDescription.trim() || undefined,
      unit: unit.trim() || 'dial marks',
      stepSize: validStep,
      micronsPerClick: validMicrons,
      notes: grinderNotes.trim() || undefined,
      isDefault: editingGrinder ? editingGrinder.isDefault : grinders.length === 0,
      createdAt: editingGrinder ? editingGrinder.createdAt : new Date().toISOString(),
    };

    onSaveGrinder(profile);
    setIsGrinderModalOpen(false);
  };

  // --- Machine Handlers ---
  const openNewMachineModal = () => {
    setEditingMachine(null);
    setMachineName('');
    setBoilerType('Single Boiler');
    setPortafilterSizeMm(58);
    setDefaultTempC(93.5);
    setDefaultPressureBars(9.0);
    setDefaultPreInfusionSeconds('4');
    setMachineNotes('');
    setIsMachineModalOpen(true);
  };

  const openEditMachineModal = (m: MachineProfile) => {
    setEditingMachine(m);
    setMachineName(m.name);
    setBoilerType(m.boilerType || 'Single Boiler');
    setPortafilterSizeMm(m.portafilterSizeMm || 58);
    setDefaultTempC(m.defaultTempC ?? 93.5);
    setDefaultPressureBars(m.defaultPressureBars ?? 9.0);
    setDefaultPreInfusionSeconds(
      m.defaultPreInfusionSeconds !== undefined ? String(m.defaultPreInfusionSeconds) : '4'
    );
    setMachineNotes(m.notes || '');
    setIsMachineModalOpen(true);
  };

  const handleMachineSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!machineName.trim()) return;

    const parsedPreInfusion = parseLocaleNumber(defaultPreInfusionSeconds);
    const validPreInfusion =
      defaultPreInfusionSeconds.trim() !== '' &&
      !Number.isNaN(parsedPreInfusion) &&
      parsedPreInfusion >= 0
        ? parsedPreInfusion
        : undefined;

    const profile: MachineProfile = {
      id: editingMachine ? editingMachine.id : `machine-${Date.now()}`,
      name: machineName.trim(),
      boilerType,
      portafilterSizeMm: Number(portafilterSizeMm) || undefined,
      defaultTempC: Number(defaultTempC) || undefined,
      defaultPressureBars: Number(defaultPressureBars) || undefined,
      defaultPreInfusionSeconds: validPreInfusion,
      notes: machineNotes.trim() || undefined,
      isDefault: editingMachine ? editingMachine.isDefault : machines.length === 0,
      createdAt: editingMachine ? editingMachine.createdAt : new Date().toISOString(),
    };

    onSaveMachine(profile);
    setIsMachineModalOpen(false);
  };

  // --- Basket Handlers ---
  const openNewBasketModal = () => {
    setEditingBasket(null);
    setBasketName('');
    setBasketManufacturer('');
    setRatedCapacityGrams(18);
    setBasketStyle('Ridgeless');
    setBasketNotes('');
    setIsBasketModalOpen(true);
  };

  const openEditBasketModal = (b: BasketProfile) => {
    setEditingBasket(b);
    setBasketName(b.name);
    setBasketManufacturer(b.manufacturer || '');
    setRatedCapacityGrams(b.ratedCapacityGrams || 18);
    setBasketStyle(b.style || 'Ridgeless');
    setBasketNotes(b.notes || '');
    setIsBasketModalOpen(true);
  };

  const handleBasketSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!basketName.trim()) return;

    const profile: BasketProfile = {
      id: editingBasket ? editingBasket.id : `basket-${Date.now()}`,
      name: basketName.trim(),
      manufacturer: basketManufacturer.trim() || undefined,
      ratedCapacityGrams: Number(ratedCapacityGrams) || undefined,
      style: basketStyle,
      notes: basketNotes.trim() || undefined,
      isDefault: editingBasket ? editingBasket.isDefault : baskets.length === 0,
      createdAt: editingBasket ? editingBasket.createdAt : new Date().toISOString(),
    };

    onSaveBasket(profile);
    setIsBasketModalOpen(false);
  };

  const calculatedTestActual = calculateActualGrindSetting(testDialSetting, zeroSetting);
  const parsedModalStep = parseLocaleNumber(stepSize);
  const activeModalStep = !Number.isNaN(parsedModalStep) && parsedModalStep > 0 ? parsedModalStep : 0.5;

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="bg-[#141822] border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-mono font-medium text-amber-500 uppercase tracking-wider">
            Equipment Profiles & Active Defaults
          </span>
          <h2 className="text-lg font-bold text-white mt-0.5">Grinders, Espresso Machines & Filter Baskets</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Add all your brewing hardware and set which grinder, machine, and basket are active by default when logging shots.
          </p>
        </div>

        <button
          onClick={() => {
            if (activeSection === 'grinders') openNewGrinderModal();
            else if (activeSection === 'machines') openNewMachineModal();
            else openNewBasketModal();
          }}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1.5 shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>
            {activeSection === 'grinders'
              ? 'Add Grinder'
              : activeSection === 'machines'
              ? 'Add Machine'
              : 'Add Basket'}
          </span>
        </button>
      </div>

      {/* Active Defaults Summary Strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          type="button"
          onClick={() => setActiveSection('grinders')}
          className={`text-left p-3.5 rounded-xl border transition-all ${
            activeSection === 'grinders'
              ? 'bg-amber-950/20 border-amber-500/50'
              : 'bg-[#141822] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-amber-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Active Grinder</span>
            </span>
            <span className="text-slate-400">{grinders.length} saved</span>
          </div>
          <div className="text-sm font-bold text-white truncate">{activeGrinder?.name || 'None'}</div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">
            {activeGrinder
              ? `Zero ${activeGrinder.zeroSetting > 0 ? `+${activeGrinder.zeroSetting}` : activeGrinder.zeroSetting}${
                  activeGrinder.micronsPerClick ? ` · ${activeGrinder.micronsPerClick} µm` : ''
                }`
              : 'Add a grinder'}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('machines')}
          className={`text-left p-3.5 rounded-xl border transition-all ${
            activeSection === 'machines'
              ? 'bg-amber-950/20 border-amber-500/50'
              : 'bg-[#141822] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-amber-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Coffee className="w-3.5 h-3.5" />
              <span>Active Machine</span>
            </span>
            <span className="text-slate-400">{machines.length} saved</span>
          </div>
          <div className="text-sm font-bold text-white truncate">{activeMachine?.name || 'None'}</div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">
            {activeMachine
              ? `${activeMachine.boilerType || 'Espresso'} · ${activeMachine.defaultTempC ?? 93.5}°C / ${activeMachine.defaultPressureBars ?? 9}b · ${activeMachine.defaultPreInfusionSeconds ?? 4}s pre`
              : 'Add a machine'}
          </div>
        </button>

        <button
          type="button"
          onClick={() => setActiveSection('baskets')}
          className={`text-left p-3.5 rounded-xl border transition-all ${
            activeSection === 'baskets'
              ? 'bg-amber-950/20 border-amber-500/50'
              : 'bg-[#141822] border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-mono uppercase text-amber-400 mb-1">
            <span className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" />
              <span>Active Basket</span>
            </span>
            <span className="text-slate-400">{baskets.length} saved</span>
          </div>
          <div className="text-sm font-bold text-white truncate">{activeBasket?.name || 'None'}</div>
          <div className="text-[11px] font-mono text-slate-400 mt-0.5 truncate">
            {activeBasket
              ? `${activeBasket.ratedCapacityGrams ? `${activeBasket.ratedCapacityGrams}g` : 'Custom'} · ${activeBasket.style || 'Ridgeless'}`
              : 'Add a basket'}
          </div>
        </button>
      </div>

      {/* Category Switcher Tabs */}
      <div className="flex items-center gap-2 bg-[#141822] border border-slate-800 rounded-xl p-1.5 w-full sm:w-fit overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveSection('grinders')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSection === 'grinders'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>Grinders ({grinders.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('machines')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSection === 'machines'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Coffee className="w-3.5 h-3.5" />
          <span>Espresso Machines ({machines.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveSection('baskets')}
          className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap flex items-center gap-1.5 ${
            activeSection === 'baskets'
              ? 'bg-amber-500 text-slate-950'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          <span>Filter Baskets ({baskets.length})</span>
        </button>
      </div>

      {/* SECTION 1: GRINDERS */}
      {activeSection === 'grinders' && (
        <div className="space-y-5">
          {/* Explanation Banner */}
          <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4 text-xs text-amber-200/90 flex items-start gap-3">
            <Calculator className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-semibold text-white">How Actual Grind Setting is Calculated</h3>
              <p className="text-slate-300 leading-relaxed">
                Many espresso grinders have burrs that touch at an arbitrary dial mark (e.g., DF64 chirps at 1.5, Eureka chirps at 0.5).
                ExtractionLab calculates: <strong className="text-amber-300 font-mono">Actual Setting = Dial Setting − Zero Touch Point</strong>.
                This ensures your recipe dial-in remains perfectly repeatable even if you disassemble burrs for cleaning.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {grinders.map((grinder) => {
              const isActive = grinder.id === activeGrinderId;
              const grinderShots = shots.filter((s) => s.grinderId === grinder.id || s.grinder === grinder.name);
              const actualSettingsLogged = grinderShots
                .map((s) => s.actualSetting ?? (parseLocaleNumber(s.grindSetting) - (s.zeroSetting ?? grinder.zeroSetting)))
                .filter((v) => !isNaN(v));

              const minActual = actualSettingsLogged.length > 0 ? Math.min(...actualSettingsLogged).toFixed(1) : null;
              const maxActual = actualSettingsLogged.length > 0 ? Math.max(...actualSettingsLogged).toFixed(1) : null;

              return (
                <div
                  key={grinder.id}
                  className={`bg-[#141822] border rounded-xl p-5 shadow-sm transition-all flex flex-col justify-between ${
                    isActive ? 'border-amber-500/60 ring-1 ring-amber-500/20' : 'border-slate-800'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                      <div>
                        <span className="text-[11px] font-mono font-medium text-amber-400 uppercase tracking-wide">
                          {grinder.burrType} Burrs {grinder.burrSizeMm ? `(${grinder.burrSizeMm}mm)` : ''}
                        </span>
                        <h3 className="font-bold text-base text-white mt-0.5">{grinder.name}</h3>
                        {grinder.burrModel && (
                          <div className="text-xs text-slate-400 mt-0.5">{grinder.burrModel}</div>
                        )}
                      </div>

                      {isActive ? (
                        <span className="text-[11px] font-mono text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                          <span>Active Default</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => onSetActiveGrinder(grinder.id)}
                          className="text-[11px] text-slate-400 hover:text-amber-300 font-mono underline"
                        >
                          Set as Default
                        </button>
                      )}
                    </div>

                    <div className="my-3.5 p-3 rounded-lg bg-slate-900/80 border border-slate-800/80 font-mono text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-400">Zero Touch Point:</span>
                        <span className="text-amber-400 font-bold text-sm bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {grinder.zeroSetting > 0 ? `+${grinder.zeroSetting.toFixed(1)}` : grinder.zeroSetting.toFixed(1)} {grinder.unit || 'marks'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[11px] border-t border-slate-800/80 pt-1.5">
                        <span className="text-slate-400">Step Size (+/-):</span>
                        <span className="text-amber-300 font-semibold">
                          ±{grinder.stepSize ?? 0.5} {grinder.unit || 'marks'}
                        </span>
                      </div>

                      {grinder.micronsPerClick !== undefined && (
                        <div className="flex items-center justify-between text-[11px] border-t border-slate-800/80 pt-1.5">
                          <span className="text-slate-400">Step Resolution:</span>
                          <span className="text-sky-300 font-semibold">
                            {grinder.micronsPerClick} µm / {grinder.unit ? grinder.unit.replace(/s$/, '') : 'click'}
                          </span>
                        </div>
                      )}

                      {grinder.zeroDescription && (
                        <div className="text-[11px] text-slate-400 font-sans italic border-t border-slate-800/80 pt-1.5">
                          "{grinder.zeroDescription}"
                        </div>
                      )}

                      <div className="text-[11px] text-slate-400 pt-1 flex items-center justify-between border-t border-slate-800/80">
                        <span>Formula:</span>
                        <span className="text-slate-300">Actual = Dial − ({grinder.zeroSetting.toFixed(1)})</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-slate-900/40 p-2.5 rounded-lg border border-slate-800/60 mb-3">
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Shots Logged</span>
                        <span className="text-slate-200 font-semibold">{grinderShots.length} pulls</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Actual Range</span>
                        <span className="text-amber-400 font-semibold">
                          {minActual && maxActual ? `${minActual} – ${maxActual}` : 'Pending'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 block uppercase">Microns / Click</span>
                        <span className="text-sky-300 font-semibold">
                          {grinder.micronsPerClick !== undefined ? `${grinder.micronsPerClick} µm` : 'Not set'}
                        </span>
                      </div>
                    </div>

                    {grinder.notes && (
                      <p className="text-xs text-slate-300 italic mt-2 leading-relaxed">
                        {grinder.notes}
                      </p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between text-xs">
                    <button
                      onClick={() => openEditGrinderModal(grinder)}
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium flex items-center gap-1.5 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit / Calibrate</span>
                    </button>

                    <button
                      onClick={() => onDeleteGrinder(grinder.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                      title="Delete grinder"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: ESPRESSO MACHINES */}
      {activeSection === 'machines' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {machines.map((machine) => {
            const isActive = machine.id === activeMachineId;
            const machineShots = shots.filter(
              (s) => s.machineId === machine.id || s.machine === machine.name
            );

            return (
              <div
                key={machine.id}
                className={`bg-[#141822] border rounded-xl p-5 shadow-sm transition-all flex flex-col justify-between ${
                  isActive ? 'border-amber-500/60 ring-1 ring-amber-500/20' : 'border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-[11px] font-mono font-medium text-amber-400 uppercase tracking-wide">
                        {machine.boilerType || 'Espresso Machine'}
                        {machine.portafilterSizeMm ? ` · ${machine.portafilterSizeMm}mm` : ''}
                      </span>
                      <h3 className="font-bold text-base text-white mt-0.5">{machine.name}</h3>
                    </div>

                    {isActive ? (
                      <span className="text-[11px] font-mono text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Active Default</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => onSetActiveMachine(machine.id)}
                        className="text-[11px] text-slate-400 hover:text-amber-300 font-mono underline"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 my-3.5 text-xs font-mono bg-slate-900/70 p-3 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Default Temp</span>
                      <span className="text-amber-400 font-bold">
                        {machine.defaultTempC !== undefined ? `${machine.defaultTempC}°C` : '93.5°C'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Peak Pressure</span>
                      <span className="text-slate-200 font-semibold">
                        {machine.defaultPressureBars !== undefined ? `${machine.defaultPressureBars} bar` : '9.0 bar'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Pre-Infusion</span>
                      <span className="text-sky-300 font-semibold">
                        {machine.defaultPreInfusionSeconds !== undefined ? `${machine.defaultPreInfusionSeconds}s` : 'Not set'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Shots Logged</span>
                      <span className="text-slate-200 font-semibold">{machineShots.length}</span>
                    </div>
                  </div>

                  {machine.notes && (
                    <p className="text-xs text-slate-300 italic mt-2 leading-relaxed">
                      {machine.notes}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between text-xs">
                  <button
                    onClick={() => openEditMachineModal(machine)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit Machine</span>
                  </button>

                  <button
                    onClick={() => onDeleteMachine(machine.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                    title="Delete machine"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SECTION 3: FILTER BASKETS */}
      {activeSection === 'baskets' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {baskets.map((basket) => {
            const isActive = basket.id === activeBasketId;
            const basketShots = shots.filter(
              (s) => s.basketId === basket.id || s.basket === basket.name
            );

            return (
              <div
                key={basket.id}
                className={`bg-[#141822] border rounded-xl p-5 shadow-sm transition-all flex flex-col justify-between ${
                  isActive ? 'border-amber-500/60 ring-1 ring-amber-500/20' : 'border-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between pb-3 border-b border-slate-800">
                    <div>
                      <span className="text-[11px] font-mono font-medium text-amber-400 uppercase tracking-wide">
                        {basket.manufacturer ? `${basket.manufacturer} · ` : ''}
                        {basket.style || 'Precision Basket'}
                      </span>
                      <h3 className="font-bold text-base text-white mt-0.5">{basket.name}</h3>
                    </div>

                    {isActive ? (
                      <span className="text-[11px] font-mono text-amber-300 bg-amber-500/20 border border-amber-500/30 px-2 py-0.5 rounded font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                        <span>Active Default</span>
                      </span>
                    ) : (
                      <button
                        onClick={() => onSetActiveBasket(basket.id)}
                        className="text-[11px] text-slate-400 hover:text-amber-300 font-mono underline"
                      >
                        Set as Default
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 my-3.5 text-xs font-mono bg-slate-900/70 p-3 rounded-lg border border-slate-800/80">
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Rated Dose</span>
                      <span className="text-amber-400 font-bold">
                        {basket.ratedCapacityGrams ? `${basket.ratedCapacityGrams}g` : 'Custom'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Style</span>
                      <span className="text-slate-200 font-semibold">{basket.style || 'Ridgeless'}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block uppercase">Shots Logged</span>
                      <span className="text-slate-200 font-semibold">{basketShots.length}</span>
                    </div>
                  </div>

                  {basket.notes && (
                    <p className="text-xs text-slate-300 italic mt-2 leading-relaxed">
                      {basket.notes}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-800 mt-4 flex items-center justify-between text-xs">
                  <button
                    onClick={() => openEditBasketModal(basket)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit Basket</span>
                  </button>

                  <button
                    onClick={() => onDeleteBasket(basket.id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                    title="Delete basket"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Grinder Modal */}
      {isGrinderModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141822] border border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingGrinder ? 'Edit Grinder & Zero Calibration' : 'Add New Grinder Profile'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Set the burr touch point (chirp) to automatically compute true actual grind sizes.
              </p>
            </div>

            <form onSubmit={handleGrinderSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Grinder Name</label>
                  <input
                    type="text"
                    required
                    value={grinderName}
                    onChange={(e) => setGrinderName(e.target.value)}
                    placeholder="e.g. DF64 Gen 2, Niche Zero"
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Burr Type</label>
                  <select
                    value={burrType}
                    onChange={(e) => setBurrType(e.target.value as BurrType)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Flat">Flat Burrs</option>
                    <option value="Conical">Conical Burrs</option>
                    <option value="Hybrid">Hybrid Burrs</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Burr Size (mm)</label>
                  <NumericInput
                    value={burrSizeMm}
                    onChangeValue={setBurrSizeMm}
                    emptyFallback={editingGrinder?.burrSizeMm ?? 64}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Burr Set / Model</label>
                  <input
                    type="text"
                    value={burrModel}
                    onChange={(e) => setBurrModel(e.target.value)}
                    placeholder="e.g. SSP MP, DLC Espresso, Stock"
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-slate-900/90 border border-amber-500/30 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-amber-400 font-semibold flex items-center gap-1.5">
                    <Disc className="w-4 h-4" />
                    <span>Zero Setting (Burr Touch / Chirp Mark)</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">Reference point</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Zero Point Value</label>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setZeroSetting((z) => stepAdjustNumber(z, -activeModalStep))}
                        className="px-2 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-700 text-xs font-mono font-bold"
                      >
                        -{activeModalStep}
                      </button>
                      <NumericInput
                        step="any"
                        value={zeroSetting}
                        onChangeValue={setZeroSetting}
                        emptyFallback={editingGrinder?.zeroSetting ?? 0}
                        className="w-full bg-slate-950 border border-slate-700 rounded-md px-2 py-1.5 text-center text-amber-400 font-mono font-bold text-sm focus:outline-none focus:border-amber-500"
                      />
                      <button
                        type="button"
                        onClick={() => setZeroSetting((z) => stepAdjustNumber(z, activeModalStep))}
                        className="px-2 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-700 text-xs font-mono font-bold"
                      >
                        +{activeModalStep}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Step Size (+/- Buttons)</label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={stepSize}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (/^\d*([.,]\d*)?$/.test(v)) setStepSize(v);
                        }}
                        onBlur={() => {
                          const parsed = parseLocaleNumber(stepSize);
                          if (stepSize.trim() === '' || Number.isNaN(parsed) || parsed <= 0) {
                            setStepSize(String(editingGrinder?.stepSize ?? 0.5));
                          }
                        }}
                        placeholder="e.g. 0.5, 0.1, 1"
                        className="w-full bg-slate-950 border border-slate-700 rounded-md pl-3 pr-10 py-1.5 text-amber-300 font-mono font-semibold focus:outline-none focus:border-amber-500"
                      />
                      <span className="absolute right-2.5 top-1.5 text-[11px] text-slate-400 font-mono">step</span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Dial Unit</label>
                    <input
                      type="text"
                      value={unit}
                      onChange={(e) => setUnit(e.target.value)}
                      placeholder="e.g. marks, clicks"
                      className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-medium mb-1">Microns per Click (µm)</label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={micronsPerClick}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (/^\d*([.,]\d*)?$/.test(v)) setMicronsPerClick(v);
                        }}
                        placeholder="e.g. 8.8 or 10"
                        className="w-full bg-slate-950 border border-slate-700 rounded-md pl-3 pr-8 py-1.5 text-sky-300 font-mono font-semibold focus:outline-none focus:border-amber-500"
                      />
                      <span className="absolute right-2.5 top-1.5 text-[11px] text-slate-400 font-mono">µm</span>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Zero Point Description</label>
                  <input
                    type="text"
                    value={zeroDescription}
                    onChange={(e) => setZeroDescription(e.target.value)}
                    placeholder="e.g. Burrs chirp lightly at collar index 1.5"
                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="pt-2 border-t border-slate-800 text-xs">
                  <div className="text-[11px] text-slate-400 mb-1 font-mono uppercase">
                    Interactive Calculation Test:
                  </div>
                  <div className="flex flex-wrap items-center gap-2 font-mono bg-slate-950 p-2.5 rounded border border-slate-800">
                    <span className="text-slate-400">If Dial Setting:</span>
                    <NumericInput
                      step="any"
                      value={testDialSetting}
                      onChangeValue={setTestDialSetting}
                      emptyFallback={(editingGrinder?.zeroSetting ?? zeroSetting) + 14.0}
                      className="w-16 bg-slate-900 border border-slate-700 rounded px-1.5 py-0.5 text-white text-center font-bold"
                    />
                    <span className="text-slate-500">−</span>
                    <span className="text-slate-300">Zero ({zeroSetting.toFixed(1)})</span>
                    <span className="text-slate-500">=</span>
                    <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                      Actual: {calculatedTestActual !== null ? calculatedTestActual.toFixed(1) : '—'}
                    </span>
                    {calculatedTestActual !== null &&
                      micronsPerClick.trim() !== '' &&
                      !Number.isNaN(parseLocaleNumber(micronsPerClick)) &&
                      parseLocaleNumber(micronsPerClick) > 0 && (
                        <span className="text-sky-300 font-semibold bg-sky-500/10 px-2 py-0.5 rounded border border-sky-500/30">
                          {Math.round(calculatedTestActual * parseLocaleNumber(micronsPerClick))} µm
                        </span>
                      )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Notes & Alignment Remarks</label>
                <textarea
                  rows={2}
                  value={grinderNotes}
                  onChange={(e) => setGrinderNotes(e.target.value)}
                  placeholder="e.g. Marker test completed, 95% wipe clean with 1 foil shim on top carrier..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsGrinderModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors"
                >
                  {editingGrinder ? 'Save Calibration' : 'Create Grinder'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Machine Modal */}
      {isMachineModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141822] border border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingMachine ? 'Edit Espresso Machine' : 'Add New Espresso Machine'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Configure machine specifications and default brew temperature, pressure, and pre-infusion.
              </p>
            </div>

            <form onSubmit={handleMachineSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Machine Name / Model</label>
                <input
                  type="text"
                  required
                  list="machine-modal-options"
                  value={machineName}
                  onChange={(e) => setMachineName(e.target.value)}
                  placeholder="e.g. Profitec GO, Lelit Bianca V3, Flair 58"
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
                <datalist id="machine-modal-options">
                  {COMMON_MACHINES.map((m) => (
                    <option key={m} value={m} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Architecture / Boiler</label>
                  <select
                    value={boilerType}
                    onChange={(e) => setBoilerType(e.target.value as BoilerType)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Single Boiler">Single Boiler</option>
                    <option value="Heat Exchanger">Heat Exchanger</option>
                    <option value="Dual Boiler">Dual Boiler</option>
                    <option value="Thermoblock / Thermocoil">Thermoblock / Thermocoil</option>
                    <option value="Manual Lever">Manual Lever</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Portafilter Size (mm)</label>
                  <NumericInput
                    value={portafilterSizeMm}
                    onChangeValue={setPortafilterSizeMm}
                    emptyFallback={editingMachine?.portafilterSizeMm ?? 58}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Default Temp (°C)</label>
                  <NumericInput
                    step="0.5"
                    min="80"
                    max="100"
                    value={defaultTempC}
                    onChangeValue={setDefaultTempC}
                    emptyFallback={editingMachine?.defaultTempC ?? 93.5}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Default Pressure (bar)</label>
                  <NumericInput
                    step="0.5"
                    min="2"
                    max="15"
                    value={defaultPressureBars}
                    onChangeValue={setDefaultPressureBars}
                    emptyFallback={editingMachine?.defaultPressureBars ?? 9.0}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Pre-Infusion (s)</label>
                  <div className="relative">
                    <input
                      type="text"
                      inputMode="decimal"
                      value={defaultPreInfusionSeconds}
                      onChange={(e) => {
                        const v = e.target.value;
                        if (/^\d*([.,]\d*)?$/.test(v)) setDefaultPreInfusionSeconds(v);
                      }}
                      onBlur={() => {
                        const parsed = parseLocaleNumber(defaultPreInfusionSeconds);
                        if (defaultPreInfusionSeconds.trim() === '' || Number.isNaN(parsed) || parsed < 0) {
                          setDefaultPreInfusionSeconds(String(editingMachine?.defaultPreInfusionSeconds ?? 4));
                        }
                      }}
                      placeholder="e.g. 4.0"
                      className="w-full bg-slate-900 border border-slate-700 rounded-md pl-3 pr-7 py-2 text-sky-300 font-mono font-semibold focus:outline-none focus:border-amber-500"
                    />
                    <span className="absolute right-2.5 top-2 text-slate-400 font-mono">s</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Notes / OPV / Mods</label>
                <textarea
                  rows={2}
                  value={machineNotes}
                  onChange={(e) => setMachineNotes(e.target.value)}
                  placeholder="e.g. OPV calibrated to 9.0 bar blind, IMS shower screen installed..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsMachineModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors"
                >
                  {editingMachine ? 'Save Machine' : 'Create Machine'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Basket Modal */}
      {isBasketModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#141822] border border-slate-800 rounded-xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white">
                {editingBasket ? 'Edit Filter Basket' : 'Add New Filter Basket'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Track basket capacity, geometry, and hole pattern characteristics.
              </p>
            </div>

            <form onSubmit={handleBasketSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Basket Name</label>
                <input
                  type="text"
                  required
                  list="basket-modal-options"
                  value={basketName}
                  onChange={(e) => setBasketName(e.target.value)}
                  placeholder="e.g. 18g VST Precision (Ridgeless), Weber Unibasket 20g"
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
                <datalist id="basket-modal-options">
                  {COMMON_BASKETS.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Brand / Maker</label>
                  <input
                    type="text"
                    value={basketManufacturer}
                    onChange={(e) => setBasketManufacturer(e.target.value)}
                    placeholder="e.g. VST, IMS, Weber"
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Capacity (g)</label>
                  <NumericInput
                    step="0.5"
                    min="5"
                    max="30"
                    value={ratedCapacityGrams}
                    onChangeValue={setRatedCapacityGrams}
                    emptyFallback={editingBasket?.ratedCapacityGrams ?? 18}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Style</label>
                  <select
                    value={basketStyle}
                    onChange={(e) => setBasketStyle(e.target.value as NonNullable<BasketProfile['style']>)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-2 py-2 text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Ridgeless">Ridgeless</option>
                    <option value="Ridged">Ridged</option>
                    <option value="High Extraction">High Extraction</option>
                    <option value="Single">Single</option>
                    <option value="Pressurized">Pressurized</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Notes / Dose Range</label>
                <textarea
                  rows={2}
                  value={basketNotes}
                  onChange={(e) => setBasketNotes(e.target.value)}
                  placeholder="e.g. Sweet spot 17.5g–19.0g for light roasts, pairs with 58.5mm tamper..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsBasketModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-colors"
                >
                  {editingBasket ? 'Save Basket' : 'Create Basket'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
