import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { ShotForm } from './components/ShotForm';
import { ShotHistoryView } from './components/ShotHistoryView';
import { DialInAnalyticsView } from './components/DialInAnalyticsView';
import { BeanInventoryView } from './components/BeanInventoryView';
import { GrinderManagerView, EquipmentSection } from './components/GrinderManagerView';
import { WaterRecipesView } from './components/WaterRecipesView';
import { PresetRecipesView } from './components/PresetRecipesView';
import { ShotCompareModal } from './components/ShotCompareModal';
import { DataManagementModal } from './components/DataManagementModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import {
  BeanBag,
  EspressoShot,
  BrewPreset,
  GrinderProfile,
  MachineProfile,
  BasketProfile,
  WaterRecipe,
  WaterConcentrateBatches,
} from './types/espresso';
import {
  loadBeans,
  saveBeans,
  loadShots,
  saveShots,
  loadPresets,
  savePresets,
  loadGrinders,
  saveGrinders,
  loadMachines,
  saveMachines,
  loadBaskets,
  saveBaskets,
  loadWaterRecipes,
  saveWaterRecipes,
  loadWaterConcentrateBatches,
  saveWaterConcentrateBatches,
  loadActiveBeanId,
  saveActiveBeanId,
  loadActiveGrinderId,
  saveActiveGrinderId,
  loadActiveMachineId,
  saveActiveMachineId,
  loadActiveBasketId,
  saveActiveBasketId,
  loadActiveWaterRecipeId,
  saveActiveWaterRecipeId,
  loadEquipment,
  saveEquipment,
  DEFAULT_EQUIPMENT,
  UserEquipment,
  clearShotDraft,
  resetToDefaults,
} from './utils/sampleData';
import { playTimerCue } from './utils/audioCue';
import { CheckCircle2, X } from 'lucide-react';

export default function App() {
  const [beans, setBeans] = useState<BeanBag[]>(() => loadBeans());
  const [shots, setShots] = useState<EspressoShot[]>(() => loadShots());
  const [presets, setPresets] = useState<BrewPreset[]>(() => loadPresets());
  const [grinders, setGrinders] = useState<GrinderProfile[]>(() => loadGrinders());
  const [machines, setMachines] = useState<MachineProfile[]>(() => loadMachines());
  const [baskets, setBaskets] = useState<BasketProfile[]>(() => loadBaskets());
  const [waterRecipes, setWaterRecipes] = useState<WaterRecipe[]>(() => loadWaterRecipes());
  const [waterConcentrateBatches, setWaterConcentrateBatches] = useState<WaterConcentrateBatches>(() =>
    loadWaterConcentrateBatches()
  );
  const [equipment, setEquipment] = useState<UserEquipment>(() => loadEquipment());
  const [activeBeanId, setActiveBeanId] = useState<string>(() => loadActiveBeanId());
  const [activeGrinderId, setActiveGrinderId] = useState<string>(() => loadActiveGrinderId());
  const [activeMachineId, setActiveMachineId] = useState<string>(() => loadActiveMachineId());
  const [activeBasketId, setActiveBasketId] = useState<string>(() => loadActiveBasketId());
  const [activeWaterRecipeId, setActiveWaterRecipeId] = useState<string>(() => loadActiveWaterRecipeId());

  const [currentTab, setCurrentTab] = useState<'log' | 'history' | 'analytics' | 'beans' | 'grinders' | 'water' | 'presets'>('log');
  const [equipmentSection, setEquipmentSection] = useState<EquipmentSection>('grinders');
  const [tweakData, setTweakData] = useState<Partial<EspressoShot> | undefined>(undefined);
  const [appliedPresetId, setAppliedPresetId] = useState<string | undefined>(undefined);
  const [formKey, setFormKey] = useState<number>(0);
  const [editingShot, setEditingShot] = useState<EspressoShot | null>(null);
  const [compareShots, setCompareShots] = useState<[EspressoShot, EspressoShot] | null>(null);
  const [isDataModalOpen, setIsDataModalOpen] = useState<boolean>(false);
  const [notification, setNotification] = useState<{
    message: string;
    shotId?: string;
    actionLabel?: string;
    onAction?: () => void;
  } | null>(null);

  // Sync state to local storage
  useEffect(() => {
    saveBeans(beans);
  }, [beans]);

  useEffect(() => {
    saveShots(shots);
  }, [shots]);

  useEffect(() => {
    savePresets(presets);
  }, [presets]);

  useEffect(() => {
    saveGrinders(grinders);
  }, [grinders]);

  useEffect(() => {
    saveMachines(machines);
  }, [machines]);

  useEffect(() => {
    saveBaskets(baskets);
  }, [baskets]);

  useEffect(() => {
    saveActiveBeanId(activeBeanId);
  }, [activeBeanId]);

  useEffect(() => {
    saveActiveGrinderId(activeGrinderId);
  }, [activeGrinderId]);

  useEffect(() => {
    saveActiveMachineId(activeMachineId);
  }, [activeMachineId]);

  useEffect(() => {
    saveActiveBasketId(activeBasketId);
  }, [activeBasketId]);

  useEffect(() => {
    saveWaterRecipes(waterRecipes);
  }, [waterRecipes]);

  useEffect(() => {
    saveActiveWaterRecipeId(activeWaterRecipeId);
  }, [activeWaterRecipeId]);

  useEffect(() => {
    saveWaterConcentrateBatches(waterConcentrateBatches);
  }, [waterConcentrateBatches]);

  useEffect(() => {
    saveEquipment(equipment);
  }, [equipment]);

  // Active items
  const activeBean = beans.find((b) => b.id === activeBeanId) || beans[0];
  const activeGrinder = grinders.find((g) => g.id === activeGrinderId) || grinders[0];
  const activeMachine = machines.find((m) => m.id === activeMachineId) || machines[0];
  const activeBasket = baskets.find((b) => b.id === activeBasketId) || baskets[0];
  const activeWaterRecipe = waterRecipes.find((w) => w.id === activeWaterRecipeId) || waterRecipes[0];

  // Keep legacy equipment summary in sync with active machine, basket & grinder
  useEffect(() => {
    if (activeMachine || activeBasket || activeGrinder) {
      setEquipment((prev) => {
        const nextMachine = activeMachine?.name ?? prev.machine;
        const nextBasket = activeBasket?.name ?? prev.basket;
        const nextGrinder = activeGrinder?.name ?? prev.grinder;
        if (
          prev.machine === nextMachine &&
          prev.basket === nextBasket &&
          prev.grinder === nextGrinder
        ) {
          return prev;
        }
        return {
          ...prev,
          machine: nextMachine,
          basket: nextBasket,
          grinder: nextGrinder,
        };
      });
    }
  }, [activeMachine, activeBasket, activeGrinder]);

  const showTimedNotice = (
    message: string,
    action?: { actionLabel: string; onAction: () => void }
  ) => {
    setNotification({
      message,
      ...(action ? { actionLabel: action.actionLabel, onAction: action.onAction } : {}),
    });
    setTimeout(() => {
      setNotification((curr) => (curr?.message === message ? null : curr));
    }, 4500);
  };

  const handleSelectBean = (id: string) => {
    setActiveBeanId(id);
  };

  const handleSelectGrinder = (id: string) => {
    setActiveGrinderId(id);
  };

  const handleSaveGrinder = (grinder: GrinderProfile) => {
    setGrinders((prev) => {
      const exists = prev.some((g) => g.id === grinder.id);
      if (exists) {
        return prev.map((g) => (g.id === grinder.id ? grinder : g));
      }
      return [grinder, ...prev];
    });
    setActiveGrinderId(grinder.id);
  };

  const handleUpdateDefaultGrindSize = (setting: string) => {
    const trimmed = setting.trim();
    if (!trimmed) return;
    setEquipment((prev) => ({
      ...prev,
      defaultGrindSize: trimmed,
    }));
    showTimedNotice(`Default grinder size set to ${trimmed}`);
  };

  const handleDeleteGrinder = (id: string) => {
    if (window.confirm('Delete this grinder profile? (Recorded shots will retain historical settings)')) {
      const remaining = grinders.filter((g) => g.id !== id);
      setGrinders(remaining);
      if (activeGrinderId === id && remaining.length > 0) {
        setActiveGrinderId(remaining[0].id);
      }
    }
  };

  const handleSelectMachine = (id: string) => {
    setActiveMachineId(id);
    const chosen = machines.find((m) => m.id === id);
    if (chosen) {
      showTimedNotice(`Default machine set to ${chosen.name}`);
    }
  };

  const handleSaveMachine = (machine: MachineProfile) => {
    setMachines((prev) => {
      const exists = prev.some((m) => m.id === machine.id);
      if (exists) {
        return prev.map((m) => (m.id === machine.id ? machine : m));
      }
      return [machine, ...prev];
    });
    setActiveMachineId(machine.id);
    showTimedNotice(`Default machine set to ${machine.name}`);
  };

  const handleDeleteMachine = (id: string) => {
    if (window.confirm('Delete this machine profile? (Recorded shots will retain historical machine names)')) {
      const remaining = machines.filter((m) => m.id !== id);
      setMachines(remaining);
      if (activeMachineId === id && remaining.length > 0) {
        setActiveMachineId(remaining[0].id);
      }
    }
  };

  const handleSelectBasket = (id: string) => {
    setActiveBasketId(id);
    const chosen = baskets.find((b) => b.id === id);
    if (chosen) {
      showTimedNotice(`Default basket set to ${chosen.name}`);
    }
  };

  const handleSaveBasket = (basket: BasketProfile) => {
    setBaskets((prev) => {
      const exists = prev.some((b) => b.id === basket.id);
      if (exists) {
        return prev.map((b) => (b.id === basket.id ? basket : b));
      }
      return [basket, ...prev];
    });
    setActiveBasketId(basket.id);
    showTimedNotice(`Default basket set to ${basket.name}`);
  };

  const handleDeleteBasket = (id: string) => {
    if (window.confirm('Delete this filter basket profile? (Recorded shots will retain historical basket names)')) {
      const remaining = baskets.filter((b) => b.id !== id);
      setBaskets(remaining);
      if (activeBasketId === id && remaining.length > 0) {
        setActiveBasketId(remaining[0].id);
      }
    }
  };

  const handleSelectWaterRecipe = (id: string) => {
    setActiveWaterRecipeId(id);
    const chosen = waterRecipes.find((w) => w.id === id);
    if (chosen) {
      showTimedNotice(`Default water recipe set to ${chosen.name}`);
    }
  };

  const handleSaveWaterRecipe = (recipe: WaterRecipe) => {
    const exists = waterRecipes.some((w) => w.id === recipe.id);
    setWaterRecipes((prev) =>
      exists ? prev.map((w) => (w.id === recipe.id ? recipe : w)) : [recipe, ...prev]
    );
    setActiveWaterRecipeId(recipe.id);
    showTimedNotice(
      exists ? `Water recipe updated: ${recipe.name}` : `Water recipe saved: ${recipe.name}`
    );
  };

  const handleDeleteWaterRecipe = (id: string) => {
    if (window.confirm('Delete this water recipe? (Recorded shots will retain historical water names)')) {
      const remaining = waterRecipes.filter((w) => w.id !== id);
      setWaterRecipes(remaining);
      if (activeWaterRecipeId === id && remaining.length > 0) {
        setActiveWaterRecipeId(remaining[0].id);
      }
    }
  };

  const handleLogShotWithWater = (waterRecipeId: string) => {
    const recipe = waterRecipes.find((w) => w.id === waterRecipeId);
    clearShotDraft();
    setActiveWaterRecipeId(waterRecipeId);
    setAppliedPresetId(undefined);
    setTweakData(
      recipe
        ? {
            waterRecipeId: recipe.id,
            waterRecipeName: recipe.name,
          }
        : undefined
    );
    setFormKey((k) => k + 1);
    setCurrentTab('log');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateEquipment = (section: EquipmentSection) => {
    setEquipmentSection(section);
    setCurrentTab('grinders');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveShot = (newShotData: Omit<EspressoShot, 'id'>) => {
    const newShot: EspressoShot = {
      ...newShotData,
      id: `shot-${Date.now()}`,
      timestamp: newShotData.timestamp || new Date().toISOString(),
    };

    const updatedShots = [newShot, ...shots];
    setShots(updatedShots);

    // Update remaining coffee in bag
    setBeans((prevBeans) =>
      prevBeans.map((b) => {
        if (b.id === newShot.beanId && b.bagWeightGrams) {
          const currentRemaining = b.remainingGrams ?? b.bagWeightGrams;
          return {
            ...b,
            remainingGrams: Math.max(0, currentRemaining - newShot.doseGrams),
          };
        }
        return b;
      })
    );

    playTimerCue('success', true);
    const actualDisplay = newShot.actualSetting !== undefined ? `Actual: ${newShot.actualSetting.toFixed(1)}` : `Grind: ${newShot.grindSetting}`;
    setNotification({
      message: `Shot logged: 1:${newShot.ratio.toFixed(2)} (${newShot.yieldGrams}g in ${newShot.totalTimeSeconds}s @ ${actualDisplay})`,
      shotId: newShot.id,
    });

    // Clear active draft and reset form for the next shot
    clearShotDraft();
    setTweakData(undefined);
    setAppliedPresetId(undefined);
    setFormKey((k) => k + 1);

    // Auto dismiss notification after 5s
    setTimeout(() => {
      setNotification((curr) => (curr?.shotId === newShot.id ? null : curr));
    }, 5000);
  };

  const handleUpdateShot = (updatedShot: EspressoShot) => {
    const previousShot = shots.find((s) => s.id === updatedShot.id);

    setShots((prev) => prev.map((s) => (s.id === updatedShot.id ? updatedShot : s)));

    // Adjust remaining coffee in bean bag(s) if bean or dose changed
    if (previousShot && (previousShot.beanId !== updatedShot.beanId || previousShot.doseGrams !== updatedShot.doseGrams)) {
      setBeans((prevBeans) =>
        prevBeans.map((b) => {
          let remaining = b.remainingGrams ?? b.bagWeightGrams;
          if (b.id === previousShot.beanId) {
            remaining += previousShot.doseGrams;
          }
          if (b.id === updatedShot.beanId) {
            remaining = Math.max(0, remaining - updatedShot.doseGrams);
          }
          if (b.id === previousShot.beanId || b.id === updatedShot.beanId) {
            return { ...b, remainingGrams: Math.min(b.bagWeightGrams, remaining) };
          }
          return b;
        })
      );
    }

    setEditingShot(null);
    const actualDisplay = updatedShot.actualSetting !== undefined ? `Actual: ${updatedShot.actualSetting.toFixed(1)}` : `Grind: ${updatedShot.grindSetting}`;
    setNotification({
      message: `Shot record updated: 1:${updatedShot.ratio.toFixed(2)} (${updatedShot.yieldGrams}g in ${updatedShot.totalTimeSeconds}s @ ${actualDisplay})`,
      shotId: updatedShot.id,
    });

    setTimeout(() => {
      setNotification((curr) => (curr?.shotId === updatedShot.id ? null : curr));
    }, 5000);
  };

  const handleDeleteShot = (shotId: string) => {
    if (window.confirm('Delete this extraction shot log?')) {
      setShots((prev) => prev.filter((s) => s.id !== shotId));
    }
  };

  const handleDuplicateToTweak = (shot: EspressoShot) => {
    clearShotDraft();
    setAppliedPresetId(undefined);
    setTweakData({
      doseGrams: shot.doseGrams,
      yieldGrams: shot.yieldGrams,
      totalTimeSeconds: shot.totalTimeSeconds,
      preInfusionSeconds: shot.preInfusionSeconds,
      grinderId: shot.grinderId,
      grinder: shot.grinder,
      grindSetting: shot.grindSetting,
      zeroSetting: shot.zeroSetting,
      actualSetting: shot.actualSetting,
      machineId: shot.machineId,
      machine: shot.machine,
      basketId: shot.basketId,
      basket: shot.basket,
      waterRecipeId: shot.waterRecipeId,
      waterRecipeName: shot.waterRecipeName,
      waterTempC: shot.waterTempC,
      peakPressureBars: shot.peakPressureBars,
      puckPrep: shot.puckPrep,
      channeling: shot.channeling,
      tasteProfile: shot.tasteProfile,
      flavorTags: [...shot.flavorTags],
      rating: shot.rating,
      notes: `Adjusted from shot @ Grind ${shot.grindSetting} (Actual ${shot.actualSetting?.toFixed(1) ?? shot.grindSetting})`,
      isDialedIn: false,
    });
    if (shot.beanId) setActiveBeanId(shot.beanId);
    if (shot.grinderId) setActiveGrinderId(shot.grinderId);
    setFormKey((k) => k + 1);
    setCurrentTab('log');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleApplyPreset = (preset: BrewPreset) => {
    clearShotDraft();
    setAppliedPresetId(preset.id);
    setTweakData({
      doseGrams: preset.targetDose,
      yieldGrams: preset.targetYield,
      totalTimeSeconds: preset.targetTime,
      preInfusionSeconds: preset.targetPreInfusion,
      waterTempC: preset.targetTempC,
      peakPressureBars: preset.targetPressureBar,
      ...(preset.targetGrindSetting && preset.targetGrindSetting.trim()
        ? { grindSetting: preset.targetGrindSetting.trim() }
        : {}),
      notes: `Using preset: ${preset.name}. ${preset.grindRecommendation}`,
    });
    setFormKey((k) => k + 1);
    setCurrentTab('log');
    setNotification({
      message: `Applied "${preset.name}" recipe to logger (Target 1:${(preset.targetYield / preset.targetDose).toFixed(2)})`,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNewShotAction = () => {
    setCurrentTab('log');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetFormDraft = () => {
    if (window.confirm('Reset the shot form and clear your current draft?')) {
      clearShotDraft();
      setAppliedPresetId(undefined);
      setTweakData(undefined);
      setFormKey((k) => k + 1);
    }
  };

  const handleLogShotWithBean = (beanId: string) => {
    clearShotDraft();
    setActiveBeanId(beanId);
    setAppliedPresetId(undefined);
    setTweakData(undefined);
    setFormKey((k) => k + 1);
    setCurrentTab('log');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveBean = (bean: BeanBag) => {
    setBeans((prev) => {
      const exists = prev.some((b) => b.id === bean.id);
      if (exists) {
        return prev.map((b) => (b.id === bean.id ? bean : b));
      }
      return [bean, ...prev];
    });
    setActiveBeanId(bean.id);
  };

  const handleDeleteBean = (id: string) => {
    if (window.confirm('Delete this bean bag? (Recorded shots will remain in history)')) {
      setBeans((prev) => prev.filter((b) => b.id !== id));
      if (activeBeanId === id) {
        const remaining = beans.filter((b) => b.id !== id);
        if (remaining.length > 0) {
          setActiveBeanId(remaining[0].id);
        }
      }
    }
  };

  const handleSavePreset = (preset: BrewPreset) => {
    const exists = presets.some((p) => p.id === preset.id);
    setPresets((prev) =>
      exists ? prev.map((p) => (p.id === preset.id ? preset : p)) : [...prev, preset]
    );
    showTimedNotice(
      exists ? `Recipe preset updated: ${preset.name}` : `Recipe preset saved: ${preset.name}`,
      !exists && currentTab !== 'presets'
        ? {
            actionLabel: 'View Presets',
            onAction: () => {
              setCurrentTab('presets');
              setNotification(null);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            },
          }
        : undefined
    );
  };

  const handleDeletePreset = (id: string) => {
    if (window.confirm('Delete this recipe preset?')) {
      setPresets((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleImportData = (data: {
    shots?: EspressoShot[];
    beans?: BeanBag[];
    presets?: BrewPreset[];
    grinders?: GrinderProfile[];
    machines?: MachineProfile[];
    baskets?: BasketProfile[];
    waterRecipes?: WaterRecipe[];
    waterConcentrateBatches?: WaterConcentrateBatches;
    equipment?: UserEquipment;
    notice?: string;
  }) => {
    if (data.beans && data.beans.length > 0) {
      setBeans(data.beans);
      if (!data.beans.some((b) => b.id === activeBeanId)) {
        setActiveBeanId(data.beans[0].id);
      }
    }
    if (data.shots && data.shots.length > 0) setShots(data.shots);
    if (data.presets && data.presets.length > 0) setPresets(data.presets);
    if (data.grinders && data.grinders.length > 0) {
      setGrinders(data.grinders);
      if (!data.grinders.some((g) => g.id === activeGrinderId)) {
        setActiveGrinderId(data.grinders[0].id);
      }
    }
    if (data.machines && data.machines.length > 0) {
      setMachines(data.machines);
      if (!data.machines.some((m) => m.id === activeMachineId)) {
        setActiveMachineId(data.machines[0].id);
      }
    }
    if (data.baskets && data.baskets.length > 0) {
      setBaskets(data.baskets);
      if (!data.baskets.some((b) => b.id === activeBasketId)) {
        setActiveBasketId(data.baskets[0].id);
      }
    }
    if (data.waterRecipes && data.waterRecipes.length > 0) {
      setWaterRecipes(data.waterRecipes);
      if (!data.waterRecipes.some((w) => w.id === activeWaterRecipeId)) {
        setActiveWaterRecipeId(data.waterRecipes[0].id);
      }
    }
    if (data.waterConcentrateBatches) {
      setWaterConcentrateBatches({
        magnesiumPreparedDate: data.waterConcentrateBatches.magnesiumPreparedDate || '',
        bufferPreparedDate: data.waterConcentrateBatches.bufferPreparedDate || '',
      });
    }
    if (data.equipment) {
      setEquipment({ ...DEFAULT_EQUIPMENT, ...data.equipment });
    }
    if (data.notice) {
      showTimedNotice(data.notice);
    }
  };

  const handleResetDefaults = () => {
    const res = resetToDefaults();
    setBeans(res.beans);
    setShots(res.shots);
    setPresets(res.presets);
    setGrinders(res.grinders);
    setMachines(res.machines);
    setBaskets(res.baskets);
    setWaterRecipes(res.waterRecipes);
    setWaterConcentrateBatches(res.waterConcentrateBatches);
    setEquipment(res.equipment);
    setActiveBeanId('bean-1');
    setActiveGrinderId('grinder-1');
    setActiveMachineId('machine-1');
    setActiveBasketId('basket-1');
    setActiveWaterRecipeId('water-1');
    setTweakData(undefined);
    setAppliedPresetId(undefined);
    setFormKey((k) => k + 1);
  };

  return (
    <div className="min-h-screen bg-[#0e1015] text-[#f1f5f9] flex flex-col">
      {/* 3-zone Header Navigation */}
      <TopBar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectEquipmentSection={handleNavigateEquipment}
        onNewShot={handleNewShotAction}
        activeBean={activeBean}
        activeGrinder={activeGrinder}
        activeMachine={activeMachine}
        activeBasket={activeBasket}
        activeWaterRecipe={activeWaterRecipe}
        totalShotsCount={shots.length}
        onOpenDataModal={() => setIsDataModalOpen(true)}
      />

      {/* Floating Success Banner */}
      {notification && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-slate-900 border border-emerald-500/40 text-slate-100 p-3.5 rounded-xl shadow-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2.5 text-xs font-mono">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{notification.message}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {notification.actionLabel && notification.onAction && (
              <button
                onClick={notification.onAction}
                className="px-2 py-1 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold transition-colors"
              >
                {notification.actionLabel}
              </button>
            )}
            <button
              onClick={() => setNotification(null)}
              className="text-slate-400 hover:text-white p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Content Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className={currentTab === 'log' ? 'max-w-4xl mx-auto' : 'hidden'}>
          <ShotForm
            key={formKey}
            beans={beans}
            activeBeanId={activeBeanId}
            onSelectBean={handleSelectBean}
            grinders={grinders}
            activeGrinderId={activeGrinderId}
            onSelectGrinder={handleSelectGrinder}
            defaultGrindSize={equipment.defaultGrindSize || '15.5'}
            onUpdateDefaultGrindSize={handleUpdateDefaultGrindSize}
            onAddNewGrinderModal={() => handleNavigateEquipment('grinders')}
            machines={machines}
            activeMachineId={activeMachineId}
            onSetDefaultMachine={handleSelectMachine}
            onManageMachines={() => handleNavigateEquipment('machines')}
            baskets={baskets}
            activeBasketId={activeBasketId}
            onSetDefaultBasket={handleSelectBasket}
            onManageBaskets={() => handleNavigateEquipment('baskets')}
            waterRecipes={waterRecipes}
            activeWaterRecipeId={activeWaterRecipeId}
            onSetDefaultWaterRecipe={handleSelectWaterRecipe}
            onManageWaterRecipes={() => {
              setCurrentTab('water');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSaveShot={handleSaveShot}
            onAddNewBeanModal={() => {
              setCurrentTab('beans');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            initialShotData={tweakData}
            presets={presets}
            initialPresetId={appliedPresetId}
            onResetDraft={handleResetFormDraft}
          />
        </div>

        {currentTab === 'history' && (
          <ShotHistoryView
            shots={shots}
            beans={beans}
            onEditShot={(shot) => setEditingShot(shot)}
            onDuplicateShot={handleDuplicateToTweak}
            onDeleteShot={handleDeleteShot}
            onCompareShots={(s1, s2) => setCompareShots([s1, s2])}
            onSavePreset={handleSavePreset}
          />
        )}

        {currentTab === 'analytics' && (
          <DialInAnalyticsView
            shots={shots}
            beans={beans}
            activeBeanId={activeBeanId}
            machines={machines}
            activeMachineId={activeMachineId}
          />
        )}

        {currentTab === 'beans' && (
          <BeanInventoryView
            beans={beans}
            shots={shots}
            activeBeanId={activeBeanId}
            onSetActiveBean={handleSelectBean}
            onSaveBean={handleSaveBean}
            onDeleteBean={handleDeleteBean}
            onLogShotWithBean={handleLogShotWithBean}
          />
        )}

        {currentTab === 'grinders' && (
          <GrinderManagerView
            grinders={grinders}
            machines={machines}
            baskets={baskets}
            shots={shots}
            activeGrinderId={activeGrinderId}
            activeMachineId={activeMachineId}
            activeBasketId={activeBasketId}
            onSetActiveGrinder={handleSelectGrinder}
            onSaveGrinder={handleSaveGrinder}
            onDeleteGrinder={handleDeleteGrinder}
            onSetActiveMachine={handleSelectMachine}
            onSaveMachine={handleSaveMachine}
            onDeleteMachine={handleDeleteMachine}
            onSetActiveBasket={handleSelectBasket}
            onSaveBasket={handleSaveBasket}
            onDeleteBasket={handleDeleteBasket}
            initialSection={equipmentSection}
          />
        )}

        {currentTab === 'water' && (
          <WaterRecipesView
            waterRecipes={waterRecipes}
            shots={shots}
            activeWaterRecipeId={activeWaterRecipeId}
            concentrateBatches={waterConcentrateBatches}
            onUpdateConcentrateBatches={setWaterConcentrateBatches}
            onSetActiveWaterRecipe={handleSelectWaterRecipe}
            onSaveWaterRecipe={handleSaveWaterRecipe}
            onDeleteWaterRecipe={handleDeleteWaterRecipe}
            onLogShotWithWater={handleLogShotWithWater}
          />
        )}

        {currentTab === 'presets' && (
          <PresetRecipesView
            presets={presets}
            onApplyPreset={handleApplyPreset}
            onSavePreset={handleSavePreset}
            onDeletePreset={handleDeletePreset}
          />
        )}
      </main>

      {/* Edit Shot Record Modal */}
      {editingShot && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto p-4 sm:p-6">
          <div className="max-w-4xl mx-auto my-4">
            <ShotForm
              key={editingShot.id}
              beans={beans}
              activeBeanId={activeBeanId}
              onSelectBean={handleSelectBean}
              grinders={grinders}
              activeGrinderId={activeGrinderId}
              onSelectGrinder={handleSelectGrinder}
              defaultGrindSize={equipment.defaultGrindSize || '15.5'}
              onUpdateDefaultGrindSize={handleUpdateDefaultGrindSize}
              onAddNewGrinderModal={() => {
                setEditingShot(null);
                handleNavigateEquipment('grinders');
              }}
              machines={machines}
              activeMachineId={activeMachineId}
              onSetDefaultMachine={handleSelectMachine}
              onManageMachines={() => {
                setEditingShot(null);
                handleNavigateEquipment('machines');
              }}
              baskets={baskets}
              activeBasketId={activeBasketId}
              onSetDefaultBasket={handleSelectBasket}
              onManageBaskets={() => {
                setEditingShot(null);
                handleNavigateEquipment('baskets');
              }}
              waterRecipes={waterRecipes}
              activeWaterRecipeId={activeWaterRecipeId}
              onSetDefaultWaterRecipe={handleSelectWaterRecipe}
              onManageWaterRecipes={() => {
                setEditingShot(null);
                setCurrentTab('water');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onSaveShot={handleSaveShot}
              onUpdateShot={handleUpdateShot}
              onCancelEdit={() => setEditingShot(null)}
              onAddNewBeanModal={() => {
                setEditingShot(null);
                setCurrentTab('beans');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              editingShot={editingShot}
              hideStopwatch
            />
          </div>
        </div>
      )}

      {/* Comparison Modal */}
      {compareShots && (
        <ShotCompareModal
          shot1={compareShots[0]}
          shot2={compareShots[1]}
          onClose={() => setCompareShots(null)}
        />
      )}

      {/* Data Backup & CSV Modal */}
      {isDataModalOpen && (
        <DataManagementModal
          shots={shots}
          beans={beans}
          presets={presets}
          grinders={grinders}
          machines={machines}
          baskets={baskets}
          waterRecipes={waterRecipes}
          waterConcentrateBatches={waterConcentrateBatches}
          equipment={equipment}
          onImportData={handleImportData}
          onResetDefaults={handleResetDefaults}
          onClose={() => setIsDataModalOpen(false)}
        />
      )}

      <OfflineIndicator />

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#0a0c10] py-6 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>ExtractionLab Precision Espresso Telemetry System</div>
          <div className="flex items-center gap-3">
            <span>SCA Standard Protocol</span>
            <span>·</span>
            <span>Zero-Calibrated Burrs</span>
            <span>·</span>
            <span>Local Storage Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
