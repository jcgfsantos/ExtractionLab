import React, { useState, useEffect, useRef } from 'react';
import {
  BeanBag,
  EspressoShot,
  PuckPrep,
  TasteProfile,
  ChannelingLevel,
  GrinderProfile,
  MachineProfile,
  BasketProfile,
  BrewPreset,
  WaterRecipe,
} from '../types/espresso';
import {
  calculateBrewRatio,
  calculateFlowRate,
  calculateActualFlowRate,
  calculateActualGrindSetting,
  stepAdjustNumber,
  parseLocaleNumber,
  diagnoseEspressoShot,
  calculateWaterChemistry,
  FLAVOR_CATEGORIES,
  COMMON_MACHINES,
  COMMON_BASKETS,
  calculateDaysOffRoast,
  getRoastFreshnessStatus,
  isoToLocalDateTimeInputs,
  localDateTimeInputsToIso,
} from '../utils/coffeeCalculations';
import {
  ShotDraft,
  loadShotDraft,
  saveShotDraft,
} from '../utils/sampleData';
import { DialInDoctorCard } from './DialInDoctorCard';
import { LiveShotStopwatch, StopwatchTimerState } from './LiveShotStopwatch';
import { NumericInput } from './NumericInput';
import {
  Star,
  Check,
  Coffee,
  Sliders,
  ChevronDown,
  ChevronUp,
  BookmarkCheck,
  Plus,
  Disc,
  Calculator,
  Calendar,
  Clock,
  X,
  Save,
  RotateCcw,
  Droplets,
} from 'lucide-react';

interface ShotFormProps {
  beans: BeanBag[];
  activeBeanId: string;
  onSelectBean: (id: string) => void;
  grinders: GrinderProfile[];
  activeGrinderId: string;
  onSelectGrinder: (id: string) => void;
  defaultGrindSize?: string;
  onUpdateDefaultGrindSize?: (setting: string) => void;
  onAddNewGrinderModal: () => void;
  machines: MachineProfile[];
  activeMachineId: string;
  onSetDefaultMachine: (id: string) => void;
  onManageMachines: () => void;
  baskets: BasketProfile[];
  activeBasketId: string;
  onSetDefaultBasket: (id: string) => void;
  onManageBaskets: () => void;
  waterRecipes?: WaterRecipe[];
  activeWaterRecipeId?: string;
  onSetDefaultWaterRecipe?: (id: string) => void;
  onManageWaterRecipes?: () => void;
  onSaveShot: (shot: Omit<EspressoShot, 'id'>) => void;
  onUpdateShot?: (shot: EspressoShot) => void;
  onCancelEdit?: () => void;
  onAddNewBeanModal: () => void;
  initialShotData?: Partial<EspressoShot>;
  presets?: BrewPreset[];
  initialPresetId?: string;
  onResetDraft?: () => void;
  editingShot?: EspressoShot;
  hideStopwatch?: boolean;
}

export const ShotForm: React.FC<ShotFormProps> = ({
  beans,
  activeBeanId,
  onSelectBean,
  grinders,
  activeGrinderId,
  onSelectGrinder,
  defaultGrindSize = '15.5',
  onUpdateDefaultGrindSize,
  onAddNewGrinderModal,
  machines,
  activeMachineId,
  onSetDefaultMachine,
  onManageMachines,
  baskets,
  activeBasketId,
  onSetDefaultBasket,
  onManageBaskets,
  waterRecipes = [],
  activeWaterRecipeId = '',
  onSetDefaultWaterRecipe,
  onManageWaterRecipes,
  onSaveShot,
  onUpdateShot,
  onCancelEdit,
  onAddNewBeanModal,
  initialShotData,
  presets = [],
  initialPresetId,
  onResetDraft,
  editingShot,
  hideStopwatch = false,
}) => {
  const isEditMode = Boolean(editingShot);
  const sourceShot = editingShot ?? initialShotData;

  const savedDraftRef = useRef<ShotDraft | null>(
    !isEditMode && !initialShotData ? loadShotDraft() : null
  );
  const savedDraft = savedDraftRef.current;

  const defaultPreset = !sourceShot
    ? presets.find((p) => p.id === 'preset-classic') ?? presets[0]
    : undefined;

  const [selectedPresetId, setSelectedPresetId] = useState<string>(
    initialPresetId ??
      savedDraft?.selectedPresetId ??
      (sourceShot ? '__custom__' : defaultPreset?.id ?? '__custom__')
  );
  const activeSelectedPreset = presets.find((p) => p.id === selectedPresetId) ?? defaultPreset;

  const [selectedBeanId, setSelectedBeanId] = useState<string>(
    editingShot?.beanId ?? savedDraft?.selectedBeanId ?? activeBeanId ?? beans[0]?.id ?? ''
  );
  const currentBean = beans.find((b) => b.id === selectedBeanId);

  const [beanName, setBeanName] = useState<string>(
    editingShot?.beanName ?? savedDraft?.beanName ?? currentBean?.name ?? beans[0]?.name ?? ''
  );
  const [roaster, setRoaster] = useState<string>(
    editingShot?.roaster ?? savedDraft?.roaster ?? currentBean?.roaster ?? beans[0]?.roaster ?? ''
  );

  // Date & Time Stamp
  const initialDateTime = isoToLocalDateTimeInputs(editingShot?.timestamp ?? initialShotData?.timestamp);
  const [shotDate, setShotDate] = useState<string>(
    !isEditMode && savedDraft?.isTimestampCustomized && savedDraft.shotDate
      ? savedDraft.shotDate
      : initialDateTime.date
  );
  const [shotTime, setShotTime] = useState<string>(
    !isEditMode && savedDraft?.isTimestampCustomized && savedDraft.shotTime
      ? savedDraft.shotTime
      : initialDateTime.time
  );
  const [isTimestampCustomized, setIsTimestampCustomized] = useState<boolean>(
    Boolean(editingShot || initialShotData?.timestamp || (!isEditMode && savedDraft?.isTimestampCustomized))
  );

  // Machine & Basket selection (resolved early so machine defaults can initialize brew parameters)
  const initialMachineId =
    sourceShot?.machineId ??
    (sourceShot?.machine ? machines.find((m) => m.name === sourceShot.machine)?.id : undefined) ??
    (sourceShot?.machine ? '__custom__' : savedDraft?.selectedMachineId ?? activeMachineId ?? machines[0]?.id ?? '');
  const initialMatchedMachine = machines.find((m) => m.id === initialMachineId);
  const [selectedMachineId, setSelectedMachineId] = useState<string>(initialMachineId);
  const matchedMachine = machines.find((m) => m.id === selectedMachineId);
  const [machine, setMachine] = useState<string>(
    sourceShot?.machine ?? savedDraft?.machine ?? initialMatchedMachine?.name ?? machines[0]?.name ?? 'Profitec GO'
  );

  // Core metrics
  const [doseGrams, setDoseGrams] = useState<number>(
    sourceShot?.doseGrams ?? savedDraft?.doseGrams ?? defaultPreset?.targetDose ?? 18.0
  );
  const [yieldGrams, setYieldGrams] = useState<number>(
    sourceShot?.yieldGrams ?? savedDraft?.yieldGrams ?? defaultPreset?.targetYield ?? 36.0
  );
  const [totalTimeSeconds, setTotalTimeSeconds] = useState<number>(
    sourceShot?.totalTimeSeconds ?? savedDraft?.totalTimeSeconds ?? defaultPreset?.targetTime ?? 28.0
  );
  const [preInfusionSeconds, setPreInfusionSeconds] = useState<number>(
    sourceShot?.preInfusionSeconds ??
      savedDraft?.preInfusionSeconds ??
      initialMatchedMachine?.defaultPreInfusionSeconds ??
      defaultPreset?.targetPreInfusion ??
      4.0
  );

  // Equipment & Grinder
  const initialGrinderId =
    sourceShot?.grinderId ??
    (sourceShot?.grinder ? grinders.find((g) => g.name === sourceShot.grinder)?.id : undefined) ??
    savedDraft?.selectedGrinderId ??
    activeGrinderId ??
    grinders[0]?.id ??
    '';
  const initialMatchedGrinder = grinders.find((g) => g.id === initialGrinderId);
  const [selectedGrinderId, setSelectedGrinderId] = useState<string>(initialGrinderId);
  const matchedGrinder = grinders.find((g) => g.id === selectedGrinderId);
  const grindStepSize =
    matchedGrinder?.stepSize !== undefined && matchedGrinder.stepSize > 0
      ? matchedGrinder.stepSize
      : 0.5;

  const [grinderName, setGrinderName] = useState<string>(
    sourceShot?.grinder ?? savedDraft?.grinderName ?? initialMatchedGrinder?.name ?? grinders[0]?.name ?? 'DF64 Gen 2'
  );
  const [grindSetting, setGrindSetting] = useState<string>(
    sourceShot?.grindSetting ?? savedDraft?.grindSetting ?? defaultGrindSize
  );
  const [isEditingDefaultGrind, setIsEditingDefaultGrind] = useState<boolean>(false);
  const [defaultGrindDraft, setDefaultGrindDraft] = useState<string>(defaultGrindSize);
  const [zeroSetting, setZeroSetting] = useState<number>(
    sourceShot?.zeroSetting ?? savedDraft?.zeroSetting ?? initialMatchedGrinder?.zeroSetting ?? 1.5
  );

  const initialBasketId =
    sourceShot?.basketId ??
    (sourceShot?.basket ? baskets.find((b) => b.name === sourceShot.basket)?.id : undefined) ??
    (sourceShot?.basket ? '__custom__' : savedDraft?.selectedBasketId ?? activeBasketId ?? baskets[0]?.id ?? '');
  const [selectedBasketId, setSelectedBasketId] = useState<string>(initialBasketId);
  const matchedBasket = baskets.find((b) => b.id === selectedBasketId);
  const [basket, setBasket] = useState<string>(
    sourceShot?.basket ?? savedDraft?.basket ?? matchedBasket?.name ?? baskets[0]?.name ?? '18g VST Precision (Ridgeless)'
  );

  const initialWaterRecipeId =
    sourceShot?.waterRecipeId ??
    (sourceShot?.waterRecipeName
      ? waterRecipes.find((w) => w.name === sourceShot.waterRecipeName)?.id ?? '__custom__'
      : isEditMode
      ? '__none__'
      : savedDraft?.selectedWaterRecipeId ?? activeWaterRecipeId ?? waterRecipes[0]?.id ?? '__none__');
  const initialMatchedWaterRecipe = waterRecipes.find((w) => w.id === initialWaterRecipeId);
  const [selectedWaterRecipeId, setSelectedWaterRecipeId] = useState<string>(initialWaterRecipeId);
  const matchedWaterRecipe = waterRecipes.find((w) => w.id === selectedWaterRecipeId);
  const [waterRecipeName, setWaterRecipeName] = useState<string>(
    sourceShot?.waterRecipeName ??
      (isEditMode ? '' : savedDraft?.waterRecipeName ?? initialMatchedWaterRecipe?.name ?? '')
  );

  const [waterTempC, setWaterTempC] = useState<number>(
    sourceShot?.waterTempC ?? savedDraft?.waterTempC ?? defaultPreset?.targetTempC ?? matchedMachine?.defaultTempC ?? 93.5
  );
  const [peakPressureBars, setPeakPressureBars] = useState<number>(
    sourceShot?.peakPressureBars ?? savedDraft?.peakPressureBars ?? defaultPreset?.targetPressureBar ?? matchedMachine?.defaultPressureBars ?? 9.0
  );

  // Puck Prep
  const [puckPrep, setPuckPrep] = useState<PuckPrep>(
    sourceShot?.puckPrep ??
      savedDraft?.puckPrep ?? {
        wdt: true,
        puckScreen: true,
        distributionTool: false,
        paperFilterBottom: false,
        paperFilterTop: false,
      }
  );
  const [channeling, setChanneling] = useState<ChannelingLevel>(
    sourceShot?.channeling ?? savedDraft?.channeling ?? 'None / Clean'
  );

  // Sensory Evaluation
  const [tasteProfile, setTasteProfile] = useState<TasteProfile>(
    sourceShot?.tasteProfile ??
      savedDraft?.tasteProfile ?? {
        acidity: 3,
        sweetness: 4,
        bitterness: 2,
        body: 3,
        crema: 4,
        clarity: 4,
      }
  );
  const [flavorTags, setFlavorTags] = useState<string[]>(
    sourceShot?.flavorTags ??
      savedDraft?.flavorTags ??
      (currentBean?.flavorTags ? [...currentBean.flavorTags] : [])
  );
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [rating, setRating] = useState<number>(sourceShot?.rating ?? savedDraft?.rating ?? 4.0);
  const [notes, setNotes] = useState<string>(sourceShot?.notes ?? savedDraft?.notes ?? '');
  const [isDialedIn, setIsDialedIn] = useState<boolean>(
    sourceShot?.isDialedIn ?? savedDraft?.isDialedIn ?? false
  );

  const [timerState, setTimerState] = useState<StopwatchTimerState>(() => ({
    elapsedMs: savedDraft?.stopwatchElapsedMs ?? 0,
    preInfusionMs: savedDraft?.stopwatchPreInfusionMs ?? null,
    runningStartedAt: savedDraft?.stopwatchRunningStartedAt ?? null,
    customTargetSeconds: savedDraft?.stopwatchCustomTargetSeconds ?? defaultPreset?.targetTime ?? 28,
  }));

  const [hasDraftSaved, setHasDraftSaved] = useState<boolean>(
    Boolean(!isEditMode && (savedDraft || initialShotData))
  );

  // Track external changes without overwriting restored drafts on initial mount
  const prevActiveBeanIdRef = useRef<string>(activeBeanId);
  const prevActiveGrinderIdRef = useRef<string>(activeGrinderId);
  const prevActiveMachineIdRef = useRef<string>(activeMachineId);
  const prevActiveBasketIdRef = useRef<string>(activeBasketId);
  const prevActiveWaterRecipeIdRef = useRef<string>(activeWaterRecipeId);

  const prevBeanFlavorTagsRef = useRef<string[]>(currentBean?.flavorTags ?? []);

  useEffect(() => {
    if (!isEditMode && activeBeanId && activeBeanId !== prevActiveBeanIdRef.current) {
      prevActiveBeanIdRef.current = activeBeanId;
      setSelectedBeanId(activeBeanId);
      const found = beans.find((b) => b.id === activeBeanId);
      if (found) {
        setBeanName(found.name);
        setRoaster(found.roaster);
        const nextBeanFlavors = found.flavorTags ? [...found.flavorTags] : [];
        setFlavorTags(nextBeanFlavors);
        prevBeanFlavorTagsRef.current = nextBeanFlavors;
      }
    }
  }, [activeBeanId, beans, isEditMode]);

  useEffect(() => {
    if (isEditMode || !currentBean) return;
    const nextBeanFlavors = currentBean.flavorTags ?? [];
    const prevBeanFlavors = prevBeanFlavorTagsRef.current;
    const beanChanged =
      nextBeanFlavors.length !== prevBeanFlavors.length ||
      nextBeanFlavors.some((t, idx) => t !== prevBeanFlavors[idx]);
    if (beanChanged) {
      const currentMatchesPrev =
        flavorTags.length === prevBeanFlavors.length &&
        flavorTags.every((t, idx) => t === prevBeanFlavors[idx]);
      if (currentMatchesPrev) {
        setFlavorTags([...nextBeanFlavors]);
      }
      prevBeanFlavorTagsRef.current = [...nextBeanFlavors];
    }
  }, [currentBean, isEditMode, flavorTags]);

  const prevDefaultGrindSizeRef = useRef<string>(defaultGrindSize);

  useEffect(() => {
    setDefaultGrindDraft(defaultGrindSize);
    if (!isEditMode && defaultGrindSize !== prevDefaultGrindSizeRef.current) {
      if (grindSetting === prevDefaultGrindSizeRef.current) {
        setGrindSetting(defaultGrindSize);
      }
      prevDefaultGrindSizeRef.current = defaultGrindSize;
    }
  }, [defaultGrindSize, isEditMode, grindSetting]);

  useEffect(() => {
    if (!isEditMode && activeGrinderId && activeGrinderId !== prevActiveGrinderIdRef.current) {
      prevActiveGrinderIdRef.current = activeGrinderId;
      setSelectedGrinderId(activeGrinderId);
      const g = grinders.find((item) => item.id === activeGrinderId);
      if (g) {
        setGrinderName(g.name);
        setZeroSetting(g.zeroSetting);
      }
    }
  }, [activeGrinderId, grinders, isEditMode]);

  const prevMachineDefaultPreInfRef = useRef<number | undefined>(
    initialMatchedMachine?.defaultPreInfusionSeconds
  );

  useEffect(() => {
    if (!isEditMode && activeMachineId && activeMachineId !== prevActiveMachineIdRef.current) {
      prevActiveMachineIdRef.current = activeMachineId;
      setSelectedMachineId(activeMachineId);
      const m = machines.find((item) => item.id === activeMachineId);
      if (m) {
        setMachine(m.name);
        if (m.defaultTempC !== undefined) setWaterTempC(m.defaultTempC);
        if (m.defaultPressureBars !== undefined) setPeakPressureBars(m.defaultPressureBars);
        if (m.defaultPreInfusionSeconds !== undefined) {
          setPreInfusionSeconds(m.defaultPreInfusionSeconds);
        }
        prevMachineDefaultPreInfRef.current = m.defaultPreInfusionSeconds;
      }
    }
  }, [activeMachineId, machines, isEditMode]);

  useEffect(() => {
    if (isEditMode || !matchedMachine) return;
    const nextDefault = matchedMachine.defaultPreInfusionSeconds;
    const prevDefault = prevMachineDefaultPreInfRef.current;
    if (nextDefault !== prevDefault) {
      if (nextDefault !== undefined && (preInfusionSeconds === prevDefault || (prevDefault === undefined && !hasDraftSaved))) {
        setPreInfusionSeconds(nextDefault);
      }
      prevMachineDefaultPreInfRef.current = nextDefault;
    }
  }, [matchedMachine, isEditMode, preInfusionSeconds, hasDraftSaved]);

  useEffect(() => {
    if (!isEditMode && activeBasketId && activeBasketId !== prevActiveBasketIdRef.current) {
      prevActiveBasketIdRef.current = activeBasketId;
      setSelectedBasketId(activeBasketId);
      const b = baskets.find((item) => item.id === activeBasketId);
      if (b) {
        setBasket(b.name);
      }
    }
  }, [activeBasketId, baskets, isEditMode]);

  useEffect(() => {
    if (!isEditMode && activeWaterRecipeId && activeWaterRecipeId !== prevActiveWaterRecipeIdRef.current) {
      prevActiveWaterRecipeIdRef.current = activeWaterRecipeId;
      setSelectedWaterRecipeId(activeWaterRecipeId);
      const w = waterRecipes.find((item) => item.id === activeWaterRecipeId);
      if (w) {
        setWaterRecipeName(w.name);
      }
    }
  }, [activeWaterRecipeId, waterRecipes, isEditMode]);

  useEffect(() => {
    if (!isEditMode && matchedWaterRecipe && waterRecipeName !== matchedWaterRecipe.name) {
      setWaterRecipeName(matchedWaterRecipe.name);
    }
  }, [isEditMode, matchedWaterRecipe, waterRecipeName]);

  const handleBeanSelect = (id: string) => {
    setSelectedBeanId(id);
    if (!isEditMode) {
      onSelectBean(id);
    }
    const found = beans.find((b) => b.id === id);
    if (found) {
      setBeanName(found.name);
      setRoaster(found.roaster);
      if (!isEditMode) {
        const nextBeanFlavors = found.flavorTags ? [...found.flavorTags] : [];
        setFlavorTags(nextBeanFlavors);
        prevBeanFlavorTagsRef.current = nextBeanFlavors;
      }
    } else if (editingShot && id === editingShot.beanId) {
      setBeanName(editingShot.beanName);
      setRoaster(editingShot.roaster);
    }
  };

  const handleGrinderSelect = (id: string) => {
    setSelectedGrinderId(id);
    if (!isEditMode && id !== '__historical__') {
      onSelectGrinder(id);
    }
    const g = grinders.find((item) => item.id === id);
    if (g) {
      setGrinderName(g.name);
      setZeroSetting(g.zeroSetting);
    } else if (editingShot && id === (editingShot.grinderId || '__historical__')) {
      setGrinderName(editingShot.grinder);
      setZeroSetting(editingShot.zeroSetting ?? 0);
    }
  };

  const handleMachineSelect = (id: string) => {
    setSelectedMachineId(id);
    if (id === '__custom__') return;
    const m = machines.find((item) => item.id === id);
    if (m) {
      setMachine(m.name);
      if (!isEditMode) {
        if (m.defaultTempC !== undefined) setWaterTempC(m.defaultTempC);
        if (m.defaultPressureBars !== undefined) setPeakPressureBars(m.defaultPressureBars);
        if (m.defaultPreInfusionSeconds !== undefined) {
          setPreInfusionSeconds(m.defaultPreInfusionSeconds);
        }
        prevMachineDefaultPreInfRef.current = m.defaultPreInfusionSeconds;
      }
    } else if (editingShot && id === (editingShot.machineId || '__historical__')) {
      setMachine(editingShot.machine);
    }
  };

  const handleBasketSelect = (id: string) => {
    setSelectedBasketId(id);
    if (id === '__custom__') return;
    const b = baskets.find((item) => item.id === id);
    if (b) {
      setBasket(b.name);
    } else if (editingShot && id === (editingShot.basketId || '__historical__')) {
      setBasket(editingShot.basket);
    }
  };

  const handleWaterRecipeSelect = (id: string) => {
    setSelectedWaterRecipeId(id);
    if (id === '__none__') {
      setWaterRecipeName('');
      return;
    }
    if (id === '__custom__') return;
    const w = waterRecipes.find((item) => item.id === id);
    if (w) {
      setWaterRecipeName(w.name);
    } else if (editingShot && id === (editingShot.waterRecipeId || '__historical__')) {
      setWaterRecipeName(editingShot.waterRecipeName ?? '');
    }
  };

  // Accordion section states
  const [showAdvancedEquipment, setShowAdvancedEquipment] = useState<boolean>(
    isEditMode || Boolean(savedDraft?.showAdvancedEquipment)
  );
  const [activeFlavorCategory, setActiveFlavorCategory] = useState<string>(
    savedDraft?.activeFlavorCategory ?? 'Fruity & Citrus'
  );

  // Auto-save create-mode draft to localStorage on any edit
  const isFirstDraftRenderRef = useRef<boolean>(true);
  useEffect(() => {
    if (isEditMode) return;
    if (isFirstDraftRenderRef.current) {
      isFirstDraftRenderRef.current = false;
      if (!initialShotData && !savedDraft) {
        return;
      }
    }

    saveShotDraft({
      selectedPresetId,
      selectedBeanId,
      beanName,
      roaster,
      shotDate,
      shotTime,
      isTimestampCustomized,
      doseGrams,
      yieldGrams,
      totalTimeSeconds,
      preInfusionSeconds,
      selectedGrinderId,
      grinderName,
      grindSetting,
      zeroSetting,
      selectedMachineId,
      machine,
      selectedBasketId,
      basket,
      selectedWaterRecipeId,
      waterRecipeName,
      waterTempC,
      peakPressureBars,
      puckPrep,
      channeling,
      tasteProfile,
      flavorTags,
      rating,
      notes,
      isDialedIn,
      showAdvancedEquipment,
      activeFlavorCategory,
      stopwatchElapsedMs: timerState.elapsedMs,
      stopwatchPreInfusionMs: timerState.preInfusionMs,
      stopwatchRunningStartedAt: timerState.runningStartedAt,
      stopwatchCustomTargetSeconds: timerState.customTargetSeconds,
      updatedAt: new Date().toISOString(),
    });
    setHasDraftSaved(true);
  }, [
    isEditMode,
    initialShotData,
    savedDraft,
    selectedPresetId,
    selectedBeanId,
    beanName,
    roaster,
    shotDate,
    shotTime,
    isTimestampCustomized,
    doseGrams,
    yieldGrams,
    totalTimeSeconds,
    preInfusionSeconds,
    selectedGrinderId,
    grinderName,
    grindSetting,
    zeroSetting,
    selectedMachineId,
    machine,
    selectedBasketId,
    basket,
    selectedWaterRecipeId,
    waterRecipeName,
    waterTempC,
    peakPressureBars,
    puckPrep,
    channeling,
    tasteProfile,
    flavorTags,
    rating,
    notes,
    isDialedIn,
    showAdvancedEquipment,
    activeFlavorCategory,
    timerState,
  ]);

  // Computed values
  const previewTimestamp = localDateTimeInputsToIso(shotDate, shotTime);
  const ratio = calculateBrewRatio(doseGrams, yieldGrams);
  const flowRate = calculateFlowRate(yieldGrams, totalTimeSeconds);
  const actualFlowRate = calculateActualFlowRate(yieldGrams, totalTimeSeconds, preInfusionSeconds);
  const actualSetting = calculateActualGrindSetting(grindSetting, zeroSetting);
  const daysOffRoast = currentBean ? calculateDaysOffRoast(currentBean.roastDate, previewTimestamp) : null;
  const freshnessInfo = getRoastFreshnessStatus(daysOffRoast);

  const diagnosis = diagnoseEspressoShot({
    doseGrams,
    yieldGrams,
    totalTimeSeconds,
    channeling,
    tasteProfile,
  });

  const handleApplyStopwatchTime = (totalSec: number, preInfSec: number | null) => {
    setTotalTimeSeconds(totalSec);
    if (preInfSec !== null) {
      setPreInfusionSeconds(preInfSec);
    }
  };

  const handleSelectStopwatchPreset = (preset: BrewPreset) => {
    setSelectedPresetId(preset.id);
    setDoseGrams(preset.targetDose);
    setYieldGrams(preset.targetYield);
    setTotalTimeSeconds(preset.targetTime);
    setPreInfusionSeconds(preset.targetPreInfusion);
    setWaterTempC(preset.targetTempC);
    setPeakPressureBars(preset.targetPressureBar);
    if (preset.targetGrindSetting && preset.targetGrindSetting.trim()) {
      setGrindSetting(preset.targetGrindSetting.trim());
    }
  };

  const handleSetTimestampToNow = () => {
    const nowInputs = isoToLocalDateTimeInputs();
    setShotDate(nowInputs.date);
    setShotTime(nowInputs.time);
    setIsTimestampCustomized(isEditMode);
  };

  const toggleFlavorTag = (tag: string) => {
    if (flavorTags.includes(tag)) {
      setFlavorTags(flavorTags.filter((t) => t !== tag));
    } else {
      setFlavorTags([...flavorTags, tag]);
    }
  };

  const handleAddCustomTag = () => {
    const trimmed = customTagInput.trim();
    if (!trimmed) return;
    if (!flavorTags.includes(trimmed)) {
      setFlavorTags([...flavorTags, trimmed]);
    }
    setCustomTagInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const resolvedBeanId = selectedBeanId || currentBean?.id || editingShot?.beanId || '';
    const resolvedBeanName = beanName.trim() || currentBean?.name || editingShot?.beanName || 'Unknown Bean';
    const resolvedRoaster = roaster.trim() || currentBean?.roaster || editingShot?.roaster || 'Unknown Roaster';
    if (!resolvedBeanId && !resolvedBeanName) return;

    const finalTimestamp = isEditMode
      ? localDateTimeInputsToIso(shotDate, shotTime)
      : isTimestampCustomized
      ? localDateTimeInputsToIso(shotDate, shotTime)
      : new Date().toISOString();

    const resolvedWaterId =
      selectedWaterRecipeId === '__none__' || selectedWaterRecipeId === '__custom__'
        ? undefined
        : matchedWaterRecipe?.id ??
          (selectedWaterRecipeId && selectedWaterRecipeId !== '__historical__'
            ? selectedWaterRecipeId
            : undefined);
    const resolvedWaterName =
      selectedWaterRecipeId === '__none__'
        ? undefined
        : waterRecipeName.trim() || matchedWaterRecipe?.name || undefined;

    const payload: Omit<EspressoShot, 'id'> = {
      beanId: resolvedBeanId,
      beanName: resolvedBeanName,
      roaster: resolvedRoaster,
      timestamp: finalTimestamp,
      doseGrams: Number(doseGrams),
      yieldGrams: Number(yieldGrams),
      ratio,
      totalTimeSeconds: Number(totalTimeSeconds),
      preInfusionSeconds: Number(preInfusionSeconds),
      flowRate,
      actualFlowRate,
      grinderId: matchedGrinder?.id ?? (selectedGrinderId && selectedGrinderId !== '__historical__' ? selectedGrinderId : undefined),
      grinder: grinderName.trim() || matchedGrinder?.name || 'Grinder',
      grindSetting: String(grindSetting),
      zeroSetting: Number(zeroSetting),
      actualSetting: actualSetting !== null ? actualSetting : undefined,
      machineId: matchedMachine?.id ?? (selectedMachineId && selectedMachineId !== '__historical__' && selectedMachineId !== '__custom__' ? selectedMachineId : undefined),
      machine: machine.trim() || matchedMachine?.name || 'Espresso Machine',
      basketId: matchedBasket?.id ?? (selectedBasketId && selectedBasketId !== '__historical__' && selectedBasketId !== '__custom__' ? selectedBasketId : undefined),
      basket: basket.trim() || matchedBasket?.name || 'Filter Basket',
      waterRecipeId: resolvedWaterId,
      waterRecipeName: resolvedWaterName,
      waterTempC: Number(waterTempC),
      peakPressureBars: Number(peakPressureBars),
      puckPrep,
      channeling,
      tasteProfile,
      flavorTags,
      rating: Math.min(5, Math.max(0, Number(rating))),
      notes,
      isDialedIn,
    };

    if (editingShot && onUpdateShot) {
      onUpdateShot({
        ...payload,
        id: editingShot.id,
      });
    } else {
      onSaveShot(payload);
    }
  };

  const hasHistoricalBean = Boolean(
    editingShot && editingShot.beanId && !beans.some((b) => b.id === editingShot.beanId)
  );
  const hasHistoricalGrinder = Boolean(
    editingShot && (!editingShot.grinderId || !grinders.some((g) => g.id === editingShot.grinderId))
  );
  const hasHistoricalMachine = Boolean(
    editingShot &&
      editingShot.machine &&
      !machines.some((m) => m.id === editingShot.machineId || m.name === editingShot.machine)
  );
  const hasHistoricalBasket = Boolean(
    editingShot &&
      editingShot.basket &&
      !baskets.some((b) => b.id === editingShot.basketId || b.name === editingShot.basket)
  );
  const hasHistoricalWaterRecipe = Boolean(
    editingShot &&
      editingShot.waterRecipeName &&
      !waterRecipes.some(
        (w) => w.id === editingShot.waterRecipeId || w.name === editingShot.waterRecipeName
      )
  );

  return (
    <div className="space-y-6">
      {/* Edit Mode Banner */}
      {isEditMode && editingShot && (
        <div className="bg-[#141822] border border-amber-500/40 rounded-xl p-4 shadow-lg flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] font-mono font-semibold text-amber-400 uppercase tracking-wider">
              Editing Extraction Record
            </span>
            <h2 className="text-base font-bold text-white mt-0.5">
              {editingShot.beanName} · {new Date(editingShot.timestamp).toLocaleString()}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Modify any telemetry, hardware, sensory, or date/time stamp field and save changes.
            </p>
          </div>
          {onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Close edit dialog"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      )}

      {/* Create Mode Draft Status Bar */}
      {!isEditMode && hasDraftSaved && (
        <div className="bg-slate-900/70 border border-slate-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>In-progress shot draft saved automatically</span>
          </div>
          {onResetDraft && (
            <button
              type="button"
              onClick={onResetDraft}
              className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-[11px] font-medium flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Form</span>
            </button>
          )}
        </div>
      )}

      {/* Integrated Live Stopwatch / Scale Widget */}
      {!hideStopwatch && !isEditMode && (
        <LiveShotStopwatch
          onApplyTimeToForm={handleApplyStopwatchTime}
          targetDose={doseGrams}
          targetYield={yieldGrams}
          presets={presets}
          selectedPresetId={selectedPresetId}
          onSelectPreset={handleSelectStopwatchPreset}
          onClearPreset={() => setSelectedPresetId('__custom__')}
          initialTimerState={timerState}
          onTimerStateChange={setTimerState}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Coffee Bean Selection, Date & Time */}
        <div className="bg-[#141822] border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono font-medium text-amber-500 uppercase tracking-wider">
                01. Bean Selection & Timestamp
              </span>
              <h2 className="text-base font-semibold text-white mt-0.5">Active Coffee Batch & Shot Date/Time</h2>
            </div>
            <button
              type="button"
              onClick={onAddNewBeanModal}
              className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1.5 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Bean Bag</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Coffee Bag
                </label>
                <select
                  value={selectedBeanId}
                  onChange={(e) => handleBeanSelect(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
                >
                  {hasHistoricalBean && editingShot && (
                    <option value={editingShot.beanId}>
                      {editingShot.beanName} — {editingShot.roaster} (Removed Bag)
                    </option>
                  )}
                  {beans.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} — {b.roaster} ({b.roastLevel}, {b.process})
                    </option>
                  ))}
                </select>
              </div>

              {isEditMode && (
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Recorded Bean Name
                    </label>
                    <input
                      type="text"
                      required
                      value={beanName}
                      onChange={(e) => setBeanName(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Recorded Roaster
                    </label>
                    <input
                      type="text"
                      required
                      value={roaster}
                      onChange={(e) => setRoaster(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700/80 rounded-md px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {currentBean ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-xs space-y-1">
                <div className="flex items-center justify-between text-slate-400">
                  <span>Origin: <strong className="text-slate-200">{currentBean.origin}</strong></span>
                  <span className="font-mono text-amber-400">{currentBean.variety}</span>
                </div>
                <div className="flex items-center justify-between text-slate-400">
                  <span>Roast Date: <strong className="text-slate-200">{currentBean.roastDate}</strong></span>
                  <span className="text-emerald-400 font-medium font-mono">{freshnessInfo.text}</span>
                </div>
                <p className="text-[11px] text-slate-400 italic pt-1">{freshnessInfo.note}</p>
              </div>
            ) : (
              <div className="bg-slate-900/60 border border-slate-800 rounded-lg p-3 text-xs flex items-center text-slate-400">
                Historical coffee record ({beanName} — {roaster}). You can keep these details or pick another bag from your inventory.
              </div>
            )}
          </div>

          {/* Date & Time Stamp Controls */}
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Shot Date & Time Stamp</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono text-slate-500">
                  {isEditMode
                    ? 'Editing logged timestamp'
                    : isTimestampCustomized
                    ? 'Custom timestamp locked'
                    : 'Auto-stamped at save'}
                </span>
                <button
                  type="button"
                  onClick={handleSetTimestampToNow}
                  className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[11px] font-mono text-amber-300 transition-colors"
                >
                  Set to Now
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="date"
                  required
                  value={shotDate}
                  onChange={(e) => {
                    setShotDate(e.target.value);
                    setIsTimestampCustomized(true);
                  }}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="relative">
                <Clock className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="time"
                  step="1"
                  required
                  value={shotTime}
                  onChange={(e) => {
                    setShotTime(e.target.value);
                    setIsTimestampCustomized(true);
                  }}
                  className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Core Extraction Telemetry */}
        <div className="bg-[#141822] border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="pb-4 border-b border-slate-800">
            <span className="text-xs font-mono font-medium text-amber-500 uppercase tracking-wider">
              02. Gravimetric Telemetry
            </span>
            <h2 className="text-base font-semibold text-white mt-0.5">Dose, Yield & Extraction Time</h2>
          </div>

          {/* Real-time Computed HUD Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4 bg-slate-900/80 border border-slate-800/90 rounded-lg p-3.5">
            <div>
              <div className="text-[11px] font-mono uppercase text-slate-400">Brew Ratio</div>
              <div className="text-2xl font-mono font-bold text-amber-400 tabular-nums">
                1:{ratio.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-400">{diagnoseEspressoShot({ doseGrams, yieldGrams }).ratioCategory}</div>
            </div>

            <div>
              <div className="text-[11px] font-mono uppercase text-slate-400">Flow (Avg / Actual)</div>
              <div className="flex items-baseline gap-2 flex-wrap">
                <div className="text-xl font-mono font-bold text-white tabular-nums">
                  {flowRate.toFixed(2)}{' '}
                  <span className="text-[11px] font-normal text-slate-400">g/s avg</span>
                </div>
                <span className="text-slate-600 font-mono">/</span>
                <div className="text-xl font-mono font-bold text-sky-300 tabular-nums">
                  {actualFlowRate.toFixed(2)}{' '}
                  <span className="text-[11px] font-normal text-sky-400/80">g/s act</span>
                </div>
              </div>
              <div className="text-[10px] text-slate-400">
                Actual = yield ÷ {Math.max(0, totalTimeSeconds - preInfusionSeconds).toFixed(1)}s main pull
              </div>
            </div>

            <div>
              <div className="text-[11px] font-mono uppercase text-slate-400">Net Beverage</div>
              <div className="text-2xl font-mono font-bold text-white tabular-nums">
                {yieldGrams.toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-400">g</span>
              </div>
              <div className="text-[10px] text-slate-400">From {doseGrams.toFixed(1)}g dry</div>
            </div>

            <div>
              <div className="text-[11px] font-mono uppercase text-slate-400">Main Extraction</div>
              <div className="text-2xl font-mono font-bold text-white tabular-nums">
                {Math.max(0, totalTimeSeconds - preInfusionSeconds).toFixed(1)}{' '}
                <span className="text-xs font-normal text-slate-400">s</span>
              </div>
              <div className="text-[10px] text-slate-400">+{preInfusionSeconds.toFixed(1)}s pre-wet</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Dose */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Coffee Dose (Dry Mass)
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDoseGrams((d) => Math.max(7, Number((d - 0.1).toFixed(1))))}
                  className="px-2.5 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-md text-xs font-mono font-bold border border-slate-700"
                >
                  -0.1
                </button>
                <div className="relative flex-1">
                  <NumericInput
                    step="0.1"
                    min="5"
                    max="30"
                    value={doseGrams}
                    onChangeValue={setDoseGrams}
                    emptyFallback={editingShot?.doseGrams ?? activeSelectedPreset?.targetDose ?? 18.0}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm font-mono font-semibold text-white focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-2.5 top-2.5 text-xs text-slate-400 font-mono">g</span>
                </div>
                <button
                  type="button"
                  onClick={() => setDoseGrams((d) => Math.min(30, Number((d + 0.1).toFixed(1))))}
                  className="px-2.5 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-md text-xs font-mono font-bold border border-slate-700"
                >
                  +0.1
                </button>
              </div>
            </div>

            {/* Yield */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Beverage Yield (Cup Mass)
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setYieldGrams((y) => Math.max(10, Number((y - 0.5).toFixed(1))))}
                  className="px-2.5 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-md text-xs font-mono font-bold border border-slate-700"
                >
                  -0.5
                </button>
                <div className="relative flex-1">
                  <NumericInput
                    step="0.1"
                    min="10"
                    max="120"
                    value={yieldGrams}
                    onChangeValue={setYieldGrams}
                    emptyFallback={editingShot?.yieldGrams ?? activeSelectedPreset?.targetYield ?? 36.0}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm font-mono font-semibold text-amber-300 focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-2.5 top-2.5 text-xs text-slate-400 font-mono">g</span>
                </div>
                <button
                  type="button"
                  onClick={() => setYieldGrams((y) => Math.min(120, Number((y + 0.5).toFixed(1))))}
                  className="px-2.5 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-md text-xs font-mono font-bold border border-slate-700"
                >
                  +0.5
                </button>
              </div>
            </div>

            {/* Total Extraction Time */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Total Shot Time
              </label>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTotalTimeSeconds((t) => Math.max(5, Number((t - 0.5).toFixed(1))))}
                  className="px-2.5 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-md text-xs font-mono font-bold border border-slate-700"
                >
                  -0.5
                </button>
                <div className="relative flex-1">
                  <NumericInput
                    step="0.1"
                    min="5"
                    max="120"
                    value={totalTimeSeconds}
                    onChangeValue={setTotalTimeSeconds}
                    emptyFallback={editingShot?.totalTimeSeconds ?? activeSelectedPreset?.targetTime ?? 28.0}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm font-mono font-semibold text-white focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-2.5 top-2.5 text-xs text-slate-400 font-mono">s</span>
                </div>
                <button
                  type="button"
                  onClick={() => setTotalTimeSeconds((t) => Math.min(120, Number((t + 0.5).toFixed(1))))}
                  className="px-2.5 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-md text-xs font-mono font-bold border border-slate-700"
                >
                  +0.5
                </button>
              </div>
            </div>

            {/* Pre-infusion Time */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-1">
                <label className="block text-xs font-medium text-slate-300">
                  Pre-infusion Time
                </label>
                {matchedMachine?.defaultPreInfusionSeconds !== undefined && (
                  <span className="text-[10px] font-mono text-sky-400/90">
                    Machine: {matchedMachine.defaultPreInfusionSeconds}s
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPreInfusionSeconds((p) => Math.max(0, Number((p - 0.5).toFixed(1))))}
                  className="px-2.5 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-md text-xs font-mono font-bold border border-slate-700"
                >
                  -0.5
                </button>
                <div className="relative flex-1">
                  <NumericInput
                    step="0.1"
                    min="0"
                    max="30"
                    value={preInfusionSeconds}
                    onChangeValue={setPreInfusionSeconds}
                    emptyFallback={
                      editingShot?.preInfusionSeconds ??
                      matchedMachine?.defaultPreInfusionSeconds ??
                      activeSelectedPreset?.targetPreInfusion ??
                      4.0
                    }
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm font-mono font-semibold text-white focus:outline-none focus:border-amber-500"
                  />
                  <span className="absolute right-2.5 top-2.5 text-xs text-slate-400 font-mono">s</span>
                </div>
                <button
                  type="button"
                  onClick={() => setPreInfusionSeconds((p) => Math.min(30, Number((p + 0.5).toFixed(1))))}
                  className="px-2.5 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-md text-xs font-mono font-bold border border-slate-700"
                >
                  +0.5
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Grinder Setting & Zero Calibration */}
        <div className="bg-[#141822] border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
            <div>
              <span className="text-xs font-mono font-medium text-amber-500 uppercase tracking-wider">
                03. Grinder Calibration & Parameters
              </span>
              <h2 className="text-base font-semibold text-white mt-0.5">Grinder Setting & Zero Alignment</h2>
              <div className="text-[11px] font-mono text-slate-400 mt-0.5">
                {machine} · {basket}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onAddNewGrinderModal}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add / Manage Grinders</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAdvancedEquipment(!showAdvancedEquipment)}
                className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-medium ml-2"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{showAdvancedEquipment ? 'Hide Hardware' : 'Machine Details'}</span>
                {showAdvancedEquipment ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Grinder Selection Dropdown */}
          <div className="mt-4">
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Active Grinder Profile
            </label>
            <select
              value={hasHistoricalGrinder && !matchedGrinder ? (editingShot?.grinderId || '__historical__') : selectedGrinderId}
              onChange={(e) => handleGrinderSelect(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 transition-colors"
            >
              {hasHistoricalGrinder && editingShot && (
                <option value={editingShot.grinderId || '__historical__'}>
                  {editingShot.grinder} — Recorded on shot
                </option>
              )}
              {grinders.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name} — {g.burrType} {g.burrSizeMm ? `${g.burrSizeMm}mm` : ''} (Zero Point: {g.zeroSetting > 0 ? `+${g.zeroSetting}` : g.zeroSetting} {g.unit || 'marks'})
                </option>
              ))}
            </select>
          </div>

          {/* Dual Inputs: Grinder Setting & Zero Setting + Live Actual Calculation */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            {/* 1. Grinder Setting (Dial Reading) */}
            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-lg space-y-2">
              <div className="flex justify-between items-center gap-2">
                <label className="text-xs font-medium text-slate-300">
                  Grinder Setting (Dial)
                </label>
                {!isEditingDefaultGrind ? (
                  <div className="flex items-center gap-1.5 text-[10px] font-mono">
                    <button
                      type="button"
                      onClick={() => setGrindSetting(defaultGrindSize)}
                      title="Reset dial to your default grinder size"
                      className="text-slate-400 hover:text-amber-300 transition-colors"
                    >
                      Default: <span className="text-slate-200 font-semibold">{defaultGrindSize}</span>
                    </button>
                    {onUpdateDefaultGrindSize && (
                      <button
                        type="button"
                        onClick={() => {
                          setDefaultGrindDraft(defaultGrindSize);
                          setIsEditingDefaultGrind(true);
                        }}
                        className="text-amber-400 hover:text-amber-300 underline"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-[10px] font-mono">
                    <input
                      type="text"
                      value={defaultGrindDraft}
                      onChange={(e) => setDefaultGrindDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          const trimmed = defaultGrindDraft.trim();
                          if (trimmed && onUpdateDefaultGrindSize) {
                            onUpdateDefaultGrindSize(trimmed);
                            setIsEditingDefaultGrind(false);
                          }
                        } else if (e.key === 'Escape') {
                          setIsEditingDefaultGrind(false);
                        }
                      }}
                      aria-label="Default grinder size"
                      className="w-14 bg-slate-950 border border-amber-500/60 rounded px-1.5 py-0.5 text-center text-amber-300 font-semibold focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const trimmed = defaultGrindDraft.trim();
                        if (trimmed && onUpdateDefaultGrindSize) {
                          onUpdateDefaultGrindSize(trimmed);
                          setIsEditingDefaultGrind(false);
                        }
                      }}
                      className="px-1.5 py-0.5 rounded bg-amber-500 text-slate-950 font-bold hover:bg-amber-400"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingDefaultGrind(false)}
                      className="text-slate-400 hover:text-white px-1"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const num = parseLocaleNumber(grindSetting);
                    if (!isNaN(num)) setGrindSetting(stepAdjustNumber(num, -grindStepSize).toString());
                  }}
                  className="px-2.5 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-md text-xs font-mono font-bold border border-slate-700"
                >
                  -{grindStepSize}
                </button>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={grindSetting}
                  onChange={(e) => setGrindSetting(e.target.value)}
                  onBlur={() => {
                    if (grindSetting.trim() === '') {
                      setGrindSetting(editingShot?.grindSetting ?? defaultGrindSize);
                    }
                  }}
                  placeholder={`e.g. ${defaultGrindSize}`}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm font-mono font-bold text-white text-center focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const num = parseLocaleNumber(grindSetting);
                    if (!isNaN(num)) setGrindSetting(stepAdjustNumber(num, grindStepSize).toString());
                  }}
                  className="px-2.5 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-md text-xs font-mono font-bold border border-slate-700"
                >
                  +{grindStepSize}
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="text-slate-500">Number on physical dial</span>
                {onUpdateDefaultGrindSize &&
                  grindSetting.trim() !== '' &&
                  grindSetting.trim() !== defaultGrindSize && (
                    <button
                      type="button"
                      onClick={() => onUpdateDefaultGrindSize(grindSetting)}
                      className="text-amber-400 hover:text-amber-300 underline font-mono shrink-0"
                    >
                      Set as default
                    </button>
                  )}
              </div>
            </div>

            {/* 2. Zero Setting (Burr Touch point) */}
            <div className="bg-slate-900/60 border border-slate-800 p-3.5 rounded-lg space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1">
                  <Disc className="w-3.5 h-3.5 text-amber-500" />
                  <span>Zero Setting (Burr Touch)</span>
                </label>
                <span className="text-[10px] text-slate-500 font-mono">Step: ±{grindStepSize}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setZeroSetting((z) => stepAdjustNumber(z, -grindStepSize))}
                  className="px-2.5 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-md text-xs font-mono font-bold border border-slate-700"
                >
                  -{grindStepSize}
                </button>
                <NumericInput
                  step="any"
                  value={zeroSetting}
                  onChangeValue={setZeroSetting}
                  emptyFallback={editingShot?.zeroSetting ?? matchedGrinder?.zeroSetting ?? 1.5}
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2 text-sm font-mono font-bold text-amber-400 text-center focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setZeroSetting((z) => stepAdjustNumber(z, grindStepSize))}
                  className="px-2.5 py-2 bg-slate-800 text-slate-300 hover:text-white rounded-md text-xs font-mono font-bold border border-slate-700"
                >
                  +{grindStepSize}
                </button>
              </div>
              <div className="text-[11px] text-slate-500 truncate">
                {matchedGrinder?.zeroDescription || 'Point where burrs chirp/touch'}
              </div>
            </div>

            {/* 3. Calculated Actual Setting Card */}
            <div className="bg-amber-950/20 border border-amber-500/40 p-3.5 rounded-lg flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium uppercase font-mono tracking-wider text-amber-400 flex items-center gap-1">
                  <Calculator className="w-3.5 h-3.5" />
                  <span>Actual Setting</span>
                </span>
                <span className="text-[10px] text-amber-300/80 font-mono">Calibrated</span>
              </div>

              <div className="my-1.5">
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-mono font-bold text-amber-300 tabular-nums">
                    {actualSetting !== null ? actualSetting.toFixed(1) : '—'}
                  </div>
                  {actualSetting !== null && matchedGrinder?.micronsPerClick !== undefined && (
                    <span className="text-xs font-mono font-semibold text-sky-300 bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                      {Math.round(actualSetting * matchedGrinder.micronsPerClick)} µm
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-300 font-mono mt-0.5">
                  {grindSetting} (Dial) − {zeroSetting.toFixed(1)} (Zero)
                  {matchedGrinder?.micronsPerClick !== undefined && (
                    <span className="text-slate-400"> · {matchedGrinder.micronsPerClick} µm/step</span>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-amber-200/70 border-t border-amber-500/20 pt-1">
                Standardized across burr realignment
              </div>
            </div>
          </div>

          {/* Water Temp, Pressure & Water Recipe Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-800/80">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Water Temperature
              </label>
              <div className="relative">
                <NumericInput
                  step="0.5"
                  min="85"
                  max="100"
                  value={waterTempC}
                  onChangeValue={setWaterTempC}
                  emptyFallback={
                    editingShot?.waterTempC ??
                    activeSelectedPreset?.targetTempC ??
                    matchedMachine?.defaultTempC ??
                    93.5
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">°C</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Peak Pressure
              </label>
              <div className="relative">
                <NumericInput
                  step="0.5"
                  min="3"
                  max="15"
                  value={peakPressureBars}
                  onChangeValue={setPeakPressureBars}
                  emptyFallback={
                    editingShot?.peakPressureBars ??
                    activeSelectedPreset?.targetPressureBar ??
                    matchedMachine?.defaultPressureBars ??
                    9.0
                  }
                  className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm font-mono text-white focus:outline-none focus:border-amber-500"
                />
                <span className="absolute right-3 top-2.5 text-xs text-slate-400 font-mono">bar</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-sky-400" />
                  <span>Water Recipe</span>
                </label>
                {onManageWaterRecipes && (
                  <button
                    type="button"
                    onClick={onManageWaterRecipes}
                    className="text-[11px] text-sky-400 hover:text-sky-300 font-medium"
                  >
                    Manage
                  </button>
                )}
              </div>

              <select
                value={
                  selectedWaterRecipeId === '__custom__'
                    ? '__custom__'
                    : selectedWaterRecipeId === '__none__'
                    ? '__none__'
                    : hasHistoricalWaterRecipe && !matchedWaterRecipe
                    ? editingShot?.waterRecipeId || '__historical__'
                    : matchedWaterRecipe?.id || '__none__'
                }
                onChange={(e) => handleWaterRecipeSelect(e.target.value)}
                aria-label="Water Recipe"
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-sky-400"
              >
                {hasHistoricalWaterRecipe && editingShot && (
                  <option value={editingShot.waterRecipeId || '__historical__'}>
                    {editingShot.waterRecipeName} (Recorded on shot)
                  </option>
                )}
                <option value="__none__">Not specified</option>
                {waterRecipes.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.id === activeWaterRecipeId ? '(Default)' : ''}
                  </option>
                ))}
                <option value="__custom__">Custom / Enter manually...</option>
              </select>

              {selectedWaterRecipeId === '__custom__' && (
                <input
                  type="text"
                  value={waterRecipeName}
                  onChange={(e) => setWaterRecipeName(e.target.value)}
                  placeholder="e.g. Spa Reine + 9g Mg / 5g Buf"
                  className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-sky-400"
                />
              )}

              {matchedWaterRecipe && (() => {
                const chem = calculateWaterChemistry(matchedWaterRecipe);
                return (
                  <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
                    <span className="text-sky-300/90">
                      ~{chem.totalGhPpm.toFixed(0)} GH · ~{chem.totalBicarbonateMgL.toFixed(0)} HCO₃ ({matchedWaterRecipe.magnesiumDoseGrams.toFixed(1)}g Mg / {matchedWaterRecipe.bufferDoseGrams.toFixed(1)}g Buf)
                    </span>
                    {matchedWaterRecipe.id !== activeWaterRecipeId && onSetDefaultWaterRecipe && (
                      <button
                        type="button"
                        onClick={() => onSetDefaultWaterRecipe(matchedWaterRecipe.id)}
                        className="text-sky-400 hover:text-sky-300 underline"
                      >
                        Set default
                      </button>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {showAdvancedEquipment && (
            <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Grinder Name (Recorded)
                  </label>
                  <input
                    type="text"
                    required
                    value={grinderName}
                    onChange={(e) => setGrinderName(e.target.value)}
                    placeholder="e.g. DF64 Gen 2"
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Espresso Machine Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-300">
                      Espresso Machine
                    </label>
                    <button
                      type="button"
                      onClick={onManageMachines}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-medium"
                    >
                      Manage
                    </button>
                  </div>
                  <select
                    value={
                      selectedMachineId === '__custom__'
                        ? '__custom__'
                        : hasHistoricalMachine && !matchedMachine
                        ? editingShot?.machineId || '__historical__'
                        : matchedMachine?.id || '__custom__'
                    }
                    onChange={(e) => handleMachineSelect(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    {hasHistoricalMachine && editingShot && (
                      <option value={editingShot.machineId || '__historical__'}>
                        {editingShot.machine} (Recorded on shot)
                      </option>
                    )}
                    {machines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.id === activeMachineId ? '(Default)' : ''}
                      </option>
                    ))}
                    <option value="__custom__">Custom / Enter manually...</option>
                  </select>

                  {selectedMachineId === '__custom__' && (
                    <input
                      type="text"
                      required
                      list="machine-options"
                      value={machine}
                      onChange={(e) => setMachine(e.target.value)}
                      placeholder="e.g. Profitec GO, Breville Dual Boiler"
                      className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  )}
                  <datalist id="machine-options">
                    {COMMON_MACHINES.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>

                  {matchedMachine && matchedMachine.id !== activeMachineId && (
                    <button
                      type="button"
                      onClick={() => onSetDefaultMachine(matchedMachine.id)}
                      className="text-[11px] text-amber-400 hover:text-amber-300 underline font-mono"
                    >
                      Set "{matchedMachine.name}" as default
                    </button>
                  )}
                </div>

                {/* Filter Basket Selector */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-medium text-slate-300">
                      Filter Basket
                    </label>
                    <button
                      type="button"
                      onClick={onManageBaskets}
                      className="text-[11px] text-amber-400 hover:text-amber-300 font-medium"
                    >
                      Manage
                    </button>
                  </div>
                  <select
                    value={
                      selectedBasketId === '__custom__'
                        ? '__custom__'
                        : hasHistoricalBasket && !matchedBasket
                        ? editingShot?.basketId || '__historical__'
                        : matchedBasket?.id || '__custom__'
                    }
                    onChange={(e) => handleBasketSelect(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  >
                    {hasHistoricalBasket && editingShot && (
                      <option value={editingShot.basketId || '__historical__'}>
                        {editingShot.basket} (Recorded on shot)
                      </option>
                    )}
                    {baskets.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} {b.id === activeBasketId ? '(Default)' : ''}
                      </option>
                    ))}
                    <option value="__custom__">Custom / Enter manually...</option>
                  </select>

                  {selectedBasketId === '__custom__' && (
                    <input
                      type="text"
                      required
                      list="basket-options"
                      value={basket}
                      onChange={(e) => setBasket(e.target.value)}
                      placeholder="e.g. 18g VST Precision"
                      className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  )}
                  <datalist id="basket-options">
                    {COMMON_BASKETS.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>

                  {matchedBasket && matchedBasket.id !== activeBasketId && (
                    <button
                      type="button"
                      onClick={() => onSetDefaultBasket(matchedBasket.id)}
                      className="text-[11px] text-amber-400 hover:text-amber-300 underline font-mono"
                    >
                      Set "{matchedBasket.name}" as default
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Puck Prep Checklist & Channeling */}
          <div className="mt-4 pt-4 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-2">
                Puck Preparation Ritual
              </label>
              <div className="flex flex-wrap gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setPuckPrep({ ...puckPrep, wdt: !puckPrep.wdt })}
                  className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                    puckPrep.wdt
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {puckPrep.wdt && <Check className="w-3 h-3 text-amber-400" />}
                  <span>WDT Needles</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPuckPrep({ ...puckPrep, puckScreen: !puckPrep.puckScreen })}
                  className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                    puckPrep.puckScreen
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {puckPrep.puckScreen && <Check className="w-3 h-3 text-amber-400" />}
                  <span>Puck Screen</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPuckPrep({ ...puckPrep, distributionTool: !puckPrep.distributionTool })}
                  className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                    puckPrep.distributionTool
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {puckPrep.distributionTool && <Check className="w-3 h-3 text-amber-400" />}
                  <span>Leveling Wedge</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPuckPrep({ ...puckPrep, paperFilterBottom: !puckPrep.paperFilterBottom })}
                  className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                    puckPrep.paperFilterBottom
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {puckPrep.paperFilterBottom && <Check className="w-3 h-3 text-amber-400" />}
                  <span>Bottom Paper Filter</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPuckPrep({ ...puckPrep, paperFilterTop: !puckPrep.paperFilterTop })}
                  className={`px-3 py-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                    puckPrep.paperFilterTop
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-300'
                  }`}
                >
                  {puckPrep.paperFilterTop && <Check className="w-3 h-3 text-amber-400" />}
                  <span>Top Paper Filter</span>
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Channeling & Flow Observation
              </label>
              <select
                value={channeling}
                onChange={(e) => setChanneling(e.target.value as ChannelingLevel)}
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="None / Clean">None / Clean (Uniform single stream)</option>
                <option value="Minor Pinholes">Minor Pinholes (Slight spraying)</option>
                <option value="Squirting / Severe">Squirting / Severe (Aggressive spurts)</option>
                <option value="Early Blonding">Early Blonding (Watery flow past 15s)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Live SCA Dial-In Doctor Recommendation Card */}
        <DialInDoctorCard
          diagnosis={diagnosis}
          ratio={ratio}
          flowRate={flowRate}
          actualFlowRate={actualFlowRate}
          timeSeconds={totalTimeSeconds}
        />

        {/* Section 4: Sensory Tasting Evaluation & Cupping Wheel */}
        <div className="bg-[#141822] border border-slate-800 rounded-xl p-5 shadow-sm">
          <div className="pb-4 border-b border-slate-800">
            <span className="text-xs font-mono font-medium text-amber-500 uppercase tracking-wider">
              04. Sensory Cupping & Taste Profile
            </span>
            <h2 className="text-base font-semibold text-white mt-0.5">Taste Balance & Flavor Descriptors</h2>
          </div>

          {/* 6 Taste Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-4">
            {/* Acidity */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Acidity</span>
                <span className="font-mono text-amber-400 font-semibold">{tasteProfile.acidity}/5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={tasteProfile.acidity}
                onChange={(e) => setTasteProfile({ ...tasteProfile, acidity: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Flat</span>
                <span>Balanced</span>
                <span>Sharp / Sour</span>
              </div>
            </div>

            {/* Sweetness */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Sweetness</span>
                <span className="font-mono text-amber-400 font-semibold">{tasteProfile.sweetness}/5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={tasteProfile.sweetness}
                onChange={(e) => setTasteProfile({ ...tasteProfile, sweetness: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Low</span>
                <span>Caramel</span>
                <span>Syrupy Sweet</span>
              </div>
            </div>

            {/* Bitterness */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Bitterness</span>
                <span className="font-mono text-amber-400 font-semibold">{tasteProfile.bitterness}/5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={tasteProfile.bitterness}
                onChange={(e) => setTasteProfile({ ...tasteProfile, bitterness: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Pleasant</span>
                <span>Mild Cocoa</span>
                <span>Harsh / Ashy</span>
              </div>
            </div>

            {/* Body */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Body / Tactile</span>
                <span className="font-mono text-amber-400 font-semibold">{tasteProfile.body}/5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={tasteProfile.body}
                onChange={(e) => setTasteProfile({ ...tasteProfile, body: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Watery</span>
                <span>Silky</span>
                <span>Thick / Heavy</span>
              </div>
            </div>

            {/* Crema */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Crema Quality</span>
                <span className="font-mono text-amber-400 font-semibold">{tasteProfile.crema}/5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={tasteProfile.crema}
                onChange={(e) => setTasteProfile({ ...tasteProfile, crema: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Pale / Fading</span>
                <span>Dense</span>
                <span>Tiger Striped</span>
              </div>
            </div>

            {/* Clarity */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">Origin Clarity</span>
                <span className="font-mono text-amber-400 font-semibold">{tasteProfile.clarity}/5</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={tasteProfile.clarity}
                onChange={(e) => setTasteProfile({ ...tasteProfile, clarity: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>Muddy</span>
                <span>Distinct</span>
                <span>Laser Crisp</span>
              </div>
            </div>
          </div>

          {/* Flavor Wheel Tags Picker */}
          <div className="mt-6 pt-5 border-t border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <label className="text-xs font-medium text-slate-300">
                  Sensory Flavor Notes ({flavorTags.length} selected)
                </label>
                {currentBean?.flavorTags &&
                  currentBean.flavorTags.length > 0 &&
                  (flavorTags.length !== currentBean.flavorTags.length ||
                    flavorTags.some((t, idx) => t !== currentBean.flavorTags?.[idx])) && (
                    <button
                      type="button"
                      onClick={() => setFlavorTags([...(currentBean.flavorTags ?? [])])}
                      className="text-[11px] font-mono text-amber-400 hover:text-amber-300 underline"
                    >
                      Reset to bean defaults
                    </button>
                  )}
              </div>

              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
                {FLAVOR_CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setActiveFlavorCategory(cat.name)}
                    className={`px-2.5 py-1 text-xs rounded-md whitespace-nowrap transition-colors ${
                      activeFlavorCategory === cat.name
                        ? 'bg-amber-500 text-slate-950 font-semibold'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Flavor Tag Chips */}
            <div className="flex flex-wrap gap-1.5 min-h-[64px] p-2.5 bg-slate-900/60 rounded-lg border border-slate-800">
              {FLAVOR_CATEGORIES.find((c) => c.name === activeFlavorCategory)?.tags.map((tag) => {
                const selected = flavorTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleFlavorTag(tag)}
                    className={`px-3 py-1 rounded text-xs transition-colors flex items-center gap-1.5 ${
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

            {/* Selected Flavor Tags Summary & Custom Tag Input */}
            <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div className="flex flex-wrap items-center gap-1.5">
                {flavorTags.length === 0 ? (
                  <span className="text-[11px] text-slate-500">No flavor tags selected</span>
                ) : (
                  flavorTags.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleFlavorTag(tag)}
                      title="Remove flavor tag"
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
                  value={customTagInput}
                  onChange={(e) => setCustomTagInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomTag();
                    }
                  }}
                  placeholder="Add custom note..."
                  className="bg-slate-900 border border-slate-700 rounded-md px-2.5 py-1 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-500 w-36"
                />
                <button
                  type="button"
                  onClick={handleAddCustomTag}
                  className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Barista Notes & Overall Star Rating */}
          <div className="mt-5 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Barista Notes & Extraction Remarks
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Syrupy mouthfeel, great body, paired with oat milk, slight blonding at 26s..."
                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500 placeholder:text-slate-600"
              />
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Overall Cup Score ({rating.toFixed(1)} / 5.0)
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((starVal) => (
                      <button
                        key={starVal}
                        type="button"
                        onClick={() => setRating(starVal)}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star
                          className={`w-5 h-5 ${
                            starVal <= rating
                              ? 'text-amber-400 fill-amber-400'
                              : starVal - 0.5 <= rating
                              ? 'text-amber-400 fill-amber-400/50'
                              : 'text-slate-700'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <NumericInput
                    min="0"
                    max="5"
                    step="0.1"
                    value={rating}
                    onChangeValue={setRating}
                    emptyFallback={editingShot?.rating ?? 4.0}
                    transformValue={(val) => Math.min(5, Math.max(0, val))}
                    aria-label="Exact numeric score"
                    className="w-16 bg-slate-900 border border-slate-700 rounded-md px-2 py-1 text-xs font-mono font-semibold text-amber-400 text-center focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 pt-1">
                <input
                  type="checkbox"
                  checked={isDialedIn}
                  onChange={(e) => setIsDialedIn(e.target.checked)}
                  className="rounded border-slate-700 text-amber-500 focus:ring-0 w-4 h-4"
                />
                <span className="font-medium text-amber-400 flex items-center gap-1">
                  <BookmarkCheck className="w-3.5 h-3.5" />
                  <span>Mark as Dialed-In Golden Recipe</span>
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-3 pt-2">
          {isEditMode && onCancelEdit && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-sm rounded-lg border border-slate-700 transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="px-6 py-3 bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-sm rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            {isEditMode ? <Save className="w-4 h-4 stroke-[2.5]" /> : <Coffee className="w-4 h-4 stroke-[2.5]" />}
            <span>{isEditMode ? 'Save Shot Changes' : 'Save Espresso Shot'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
