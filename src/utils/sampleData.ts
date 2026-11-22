import {
  BeanBag,
  EspressoShot,
  BrewPreset,
  GrinderProfile,
  MachineProfile,
  BasketProfile,
  WaterRecipe,
  PuckPrep,
  ChannelingLevel,
  TasteProfile,
} from '../types/espresso';
import {
  DEFAULT_BUFFER_CONCENTRATE,
  DEFAULT_MAGNESIUM_CONCENTRATE,
} from './coffeeCalculations';

export const INITIAL_GRINDERS: GrinderProfile[] = [
  {
    id: 'grinder-1',
    name: 'DF64 Gen 2',
    burrType: 'Flat',
    burrSizeMm: 64,
    burrModel: 'DLC Espresso Burrs',
    zeroSetting: 1.5,
    zeroDescription: 'Burrs chirp at collar index 1.5',
    unit: 'marks',
    stepSize: 0.5,
    micronsPerClick: 10,
    notes: 'True zero is at dial 1.5. Espresso range typically 12-18 on collar (actual: 10.5-16.5).',
    isDefault: true,
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'grinder-2',
    name: 'Niche Zero',
    burrType: 'Conical',
    burrSizeMm: 63,
    burrModel: 'Mazzer Kony 63mm',
    zeroSetting: 0.0,
    zeroDescription: 'Calibrated using silver ring to indicator dot',
    unit: 'marks',
    stepSize: 0.5,
    micronsPerClick: 12,
    notes: 'Stepless conical grinder. Espresso range 12–20.',
    isDefault: false,
    createdAt: '2026-10-02T00:00:00.000Z',
  },
  {
    id: 'grinder-3',
    name: 'Eureka Mignon Specialita',
    burrType: 'Flat',
    burrSizeMm: 55,
    burrModel: 'Hardened Steel 55mm',
    zeroSetting: 0.5,
    zeroDescription: 'True zero chirp at 0.5 on micro-metric dial',
    unit: 'knob marks',
    stepSize: 0.1,
    micronsPerClick: 15,
    notes: 'Micro-metric stepless knob. Rotate clockwise to coarsen.',
    isDefault: false,
    createdAt: '2026-10-03T00:00:00.000Z',
  },
  {
    id: 'grinder-4',
    name: '1Zpresso J-Max',
    burrType: 'Conical',
    burrSizeMm: 48,
    burrModel: 'Titanium-Coated 48mm',
    zeroSetting: 0.0,
    zeroDescription: 'Tightened fully to burr lock (0 clicks)',
    unit: 'clicks',
    stepSize: 1,
    micronsPerClick: 8.8,
    notes: '8.8 microns per click. Espresso range 110–140 clicks.',
    isDefault: false,
    createdAt: '2026-10-04T00:00:00.000Z',
  },
];

export const INITIAL_MACHINES: MachineProfile[] = [
  {
    id: 'machine-1',
    name: 'Profitec GO',
    boilerType: 'Single Boiler',
    portafilterSizeMm: 58,
    defaultTempC: 93.5,
    defaultPressureBars: 9.0,
    defaultPreInfusionSeconds: 4.0,
    notes: 'PID temperature controlled single boiler with fast heat-up and OPV set to 9 bar static.',
    isDefault: true,
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'machine-2',
    name: 'Flair 58 / 58x',
    boilerType: 'Manual Lever',
    portafilterSizeMm: 58,
    defaultTempC: 95.0,
    defaultPressureBars: 8.5,
    defaultPreInfusionSeconds: 7.0,
    notes: 'Direct manual lever profiling. Ideal for blooming pre-infusion and declining pressure curves.',
    isDefault: false,
    createdAt: '2026-10-02T00:00:00.000Z',
  },
];

export const INITIAL_BASKETS: BasketProfile[] = [
  {
    id: 'basket-1',
    name: '18g VST Precision (Ridgeless)',
    manufacturer: 'VST',
    ratedCapacityGrams: 18,
    style: 'Ridgeless',
    notes: 'Straight-walled laser-cut precision basket for even extraction and fast flow.',
    isDefault: true,
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'basket-2',
    name: '20g IMS Precision',
    manufacturer: 'IMS',
    ratedCapacityGrams: 20,
    style: 'Ridgeless',
    notes: 'Higher capacity basket suited for 19–21g doses and modern high-yield extractions.',
    isDefault: false,
    createdAt: '2026-10-02T00:00:00.000Z',
  },
];

export const INITIAL_WATER_RECIPES: WaterRecipe[] = [
  {
    id: 'water-1',
    name: 'Baseline Montcalm / Spa Reine (9g Mg / 5g Buf)',
    baseWater: 'Montcalm',
    batchVolumeLiters: 1.5,
    magnesiumDoseGrams: 9.0,
    bufferDoseGrams: 5.0,
    magnesiumConcentrate: { ...DEFAULT_MAGNESIUM_CONCENTRATE },
    bufferConcentrate: { ...DEFAULT_BUFFER_CONCENTRATE },
    notes:
      'Baseline 1.5 L Montcalm or Spa Reine bottle: 9.0 g Magnesium concentrate (12.3 g Kruidvat Bitterzout / 500 g) + 5.0 g Buffer concentrate (8.4 g Kruidvat Zuiveringszout / 500 g). Target ~45–50 mg/L hardness (near-zero Ca/scale risk) & ~45–55 mg/L HCO₃⁻.',
    isDefault: true,
    createdAt: '2026-10-01T00:00:00.000Z',
  },
  {
    id: 'water-2',
    name: 'High Clarity Light Roast (-1.5g Buffer)',
    baseWater: 'Montcalm',
    batchVolumeLiters: 1.5,
    magnesiumDoseGrams: 9.0,
    bufferDoseGrams: 3.5,
    magnesiumConcentrate: { ...DEFAULT_MAGNESIUM_CONCENTRATE },
    bufferConcentrate: { ...DEFAULT_BUFFER_CONCENTRATE },
    notes:
      'Lower buffer (-1.5 g per 1.5 L) to increase brightness and floral/citric clarity for Nordic light roasts.',
    isDefault: false,
    createdAt: '2026-10-02T00:00:00.000Z',
  },
  {
    id: 'water-3',
    name: 'Sweet & Rounded Body (+1.5g Mg / +1.0g Buf)',
    baseWater: 'Spa Reine',
    batchVolumeLiters: 1.5,
    magnesiumDoseGrams: 10.5,
    bufferDoseGrams: 6.0,
    magnesiumConcentrate: { ...DEFAULT_MAGNESIUM_CONCENTRATE },
    bufferConcentrate: { ...DEFAULT_BUFFER_CONCENTRATE },
    notes:
      'Higher Magnesium (+1.5 g) for body/sweetness/extraction and higher Buffer (+1.0 g) to tame sharp sourness.',
    isDefault: false,
    createdAt: '2026-10-03T00:00:00.000Z',
  },
];

export const INITIAL_BEANS: BeanBag[] = [
  {
    id: 'bean-1',
    name: 'Worka Sakaro',
    roaster: 'Sey Coffee',
    origin: 'Gedeb, Yirgacheffe, Ethiopia',
    variety: '74110 & 74112 Heirloom',
    process: 'Washed',
    roastLevel: 'Light',
    roastDate: '2026-10-02',
    altitudeMeters: 2100,
    bagWeightGrams: 250,
    remainingGrams: 160,
    status: 'active',
    flavorTags: ['Peach / Apricot', 'Bergamot', 'Jasmine'],
    notes: 'Intense white peach, bergamot, jasmine tea aromatics with crystal citric clarity.',
    createdAt: '2026-10-05T08:00:00.000Z',
  },
  {
    id: 'bean-2',
    name: 'El Paraiso Pink Bourbon',
    roaster: 'Onyx Coffee Lab',
    origin: 'Huila, Colombia',
    variety: 'Pink Bourbon',
    process: 'Anaerobic',
    roastLevel: 'Medium-Light',
    roastDate: '2026-09-28',
    altitudeMeters: 1950,
    bagWeightGrams: 300,
    remainingGrams: 90,
    status: 'active',
    flavorTags: ['Strawberry', 'Tropical Fruit'],
    notes: 'Strawberry guava candy, tropical bubblegum, sparkling malic acidity and creamy mouthfeel.',
    createdAt: '2026-10-01T09:30:00.000Z',
  },
  {
    id: 'bean-3',
    name: 'Finca La Bolsa',
    roaster: 'Tim Wendelboe',
    origin: 'Huehuetenango, Guatemala',
    variety: 'Bourbon & Caturra',
    process: 'Washed',
    roastLevel: 'Medium',
    roastDate: '2026-09-20',
    altitudeMeters: 1600,
    bagWeightGrams: 250,
    remainingGrams: 0,
    status: 'finished',
    flavorTags: ['Milk Chocolate', 'Almond', 'Red Apple'],
    notes: 'Red apple, milk chocolate, roasted almond, syrupy and comforting balanced espresso.',
    createdAt: '2026-09-22T07:15:00.000Z',
  },
];

export const INITIAL_PRESETS: BrewPreset[] = [
  {
    id: 'preset-classic',
    name: 'Classic Espresso Normale (1:2)',
    description: 'Gold standard baseline. Dense crema, sweet caramel balance, suitable for medium roasts.',
    targetDose: 18.0,
    targetYield: 36.0,
    targetTime: 28,
    targetPreInfusion: 4,
    targetTempC: 93.0,
    targetPressureBar: 9.0,
    grindRecommendation: 'Medium-fine espresso dial. Steady rat-tail stream.',
    style: 'Classic Italian',
  },
  {
    id: 'preset-nordic',
    name: 'Modern Nordic Light Roast (1:2.4)',
    description: 'Extended yield and pre-infusion to maximize extraction of dense, high-altitude light roasts.',
    targetDose: 18.0,
    targetYield: 44.0,
    targetTime: 32,
    targetPreInfusion: 7,
    targetTempC: 95.0,
    targetPressureBar: 8.5,
    grindRecommendation: 'Fine with long pre-wetting. Prioritizes floral clarity over heavy body.',
    style: 'Modern Light Roast',
  },
  {
    id: 'preset-turbo',
    name: 'Fast Turbo Shot (1:2.8 @ 6 bar)',
    description: 'Coarse grind, 6-bar flow, ultra-fast 15-second extraction with high extraction efficiency & no channeling.',
    targetDose: 16.0,
    targetYield: 45.0,
    targetTime: 16,
    targetPreInfusion: 2,
    targetTempC: 94.0,
    targetPressureBar: 6.0,
    grindRecommendation: 'Significantly coarser (3-4 clicks coarser than traditional espresso).',
    style: 'Turbo Shot',
  },
  {
    id: 'preset-ristretto',
    name: 'Syrupy Ristretto (1:1.5)',
    description: 'Ultra-concentrated, heavy tactile viscosity, pronounced dark cacao and toasted hazelnut.',
    targetDose: 18.0,
    targetYield: 27.0,
    targetTime: 26,
    targetPreInfusion: 3,
    targetTempC: 92.5,
    targetPressureBar: 9.0,
    grindRecommendation: 'Slightly finer than standard to restrict volume while retaining flow.',
    style: 'Ristretto',
  },
];

export const INITIAL_SHOTS: EspressoShot[] = [
  {
    id: 'shot-101',
    beanId: 'bean-1',
    beanName: 'Worka Sakaro',
    roaster: 'Sey Coffee',
    timestamp: '2026-10-12T08:15:00.000Z',
    doseGrams: 18.0,
    yieldGrams: 42.0,
    ratio: 2.33,
    totalTimeSeconds: 19.0,
    preInfusionSeconds: 3.0,
    flowRate: 2.21,
    grinderId: 'grinder-1',
    grinder: 'DF64 Gen 2',
    grindSetting: '16.0',
    zeroSetting: 1.5,
    actualSetting: 14.5,
    machine: 'Profitec GO',
    basket: '18g VST Precision (Ridgeless)',
    waterTempC: 94.0,
    peakPressureBars: 9.0,
    puckPrep: {
      wdt: true,
      puckScreen: false,
      distributionTool: false,
      paperFilterBottom: false,
      paperFilterTop: false,
    },
    channeling: 'Early Blonding',
    tasteProfile: {
      acidity: 5,
      sweetness: 2,
      bitterness: 1,
      body: 2,
      crema: 3,
      clarity: 4,
    },
    flavorTags: ['Lemon / Citrus', 'Sour / Sharp', 'Thin / Watery'],
    rating: 2.5,
    notes: 'First dial-in attempt on fresh bag. Ran way too fast, gusty stream and sharp citric under-extraction. Need to grind significantly finer.',
    isDialedIn: false,
  },
  {
    id: 'shot-102',
    beanId: 'bean-1',
    beanName: 'Worka Sakaro',
    roaster: 'Sey Coffee',
    timestamp: '2026-10-12T14:30:00.000Z',
    doseGrams: 18.0,
    yieldGrams: 32.0,
    ratio: 1.78,
    totalTimeSeconds: 39.5,
    preInfusionSeconds: 5.0,
    flowRate: 0.81,
    grinderId: 'grinder-1',
    grinder: 'DF64 Gen 2',
    grindSetting: '12.0',
    zeroSetting: 1.5,
    actualSetting: 10.5,
    machine: 'Profitec GO',
    basket: '18g VST Precision (Ridgeless)',
    waterTempC: 94.0,
    peakPressureBars: 9.5,
    puckPrep: {
      wdt: true,
      puckScreen: true,
      distributionTool: false,
      paperFilterBottom: false,
      paperFilterTop: false,
    },
    channeling: 'None / Clean',
    tasteProfile: {
      acidity: 2,
      sweetness: 3,
      bitterness: 4,
      body: 4,
      crema: 4,
      clarity: 2,
    },
    flavorTags: ['Astringent / Chalky', 'Harsh Bitterness', 'Cocoa Nibs'],
    rating: 3.0,
    notes: 'Overcorrected! Choked the machine on setting 12. Heavy dark chocolate but uncomfortably drying on finish.',
    isDialedIn: false,
  },
  {
    id: 'shot-103',
    beanId: 'bean-1',
    beanName: 'Worka Sakaro',
    roaster: 'Sey Coffee',
    timestamp: '2026-10-13T09:10:00.000Z',
    doseGrams: 18.0,
    yieldGrams: 40.0,
    ratio: 2.22,
    totalTimeSeconds: 29.5,
    preInfusionSeconds: 6.0,
    flowRate: 1.36,
    grinderId: 'grinder-1',
    grinder: 'DF64 Gen 2',
    grindSetting: '15.3',
    zeroSetting: 1.5,
    actualSetting: 13.8,
    machine: 'Profitec GO',
    basket: '18g VST Precision (Ridgeless)',
    waterTempC: 95.0,
    peakPressureBars: 9.0,
    puckPrep: {
      wdt: true,
      puckScreen: true,
      distributionTool: true,
      paperFilterBottom: false,
      paperFilterTop: false,
    },
    channeling: 'None / Clean',
    tasteProfile: {
      acidity: 4,
      sweetness: 5,
      bitterness: 2,
      body: 3,
      crema: 4,
      clarity: 5,
    },
    flavorTags: ['Peach / Apricot', 'Bergamot', 'Jasmine', 'Honey'],
    rating: 5.0,
    notes: 'Perfection! Grinder at 15.3 dial (actual 13.8) with 6s pre-infusion. Explosive sweet peach nectar, jasmine floral perfume, silky mouthfeel. Zero astringency.',
    isDialedIn: true,
  },
  {
    id: 'shot-104',
    beanId: 'bean-2',
    beanName: 'El Paraiso Pink Bourbon',
    roaster: 'Onyx Coffee Lab',
    timestamp: '2026-10-13T16:00:00.000Z',
    doseGrams: 18.5,
    yieldGrams: 37.0,
    ratio: 2.0,
    totalTimeSeconds: 27.0,
    preInfusionSeconds: 4.0,
    flowRate: 1.37,
    grinderId: 'grinder-1',
    grinder: 'DF64 Gen 2',
    grindSetting: '15.7',
    zeroSetting: 1.5,
    actualSetting: 14.2,
    machine: 'Profitec GO',
    basket: '18g VST Precision (Ridgeless)',
    waterTempC: 93.0,
    peakPressureBars: 9.0,
    puckPrep: {
      wdt: true,
      puckScreen: true,
      distributionTool: false,
      paperFilterBottom: false,
      paperFilterTop: false,
    },
    channeling: 'None / Clean',
    tasteProfile: {
      acidity: 4,
      sweetness: 5,
      bitterness: 1,
      body: 4,
      crema: 5,
      clarity: 4,
    },
    flavorTags: ['Strawberry', 'Tropical Fruit', 'Vanilla', 'Caramel'],
    rating: 4.8,
    notes: 'Incredible anaerobic profile. Ripe strawberry compote, bright pink grapefruit sweetness, dense tiger crema.',
    isDialedIn: true,
  },
  {
    id: 'shot-105',
    beanId: 'bean-3',
    beanName: 'Finca La Bolsa',
    roaster: 'Tim Wendelboe',
    timestamp: '2026-10-09T08:30:00.000Z',
    doseGrams: 18.0,
    yieldGrams: 36.0,
    ratio: 2.0,
    totalTimeSeconds: 26.0,
    preInfusionSeconds: 4.0,
    flowRate: 1.38,
    grinderId: 'grinder-1',
    grinder: 'DF64 Gen 2',
    grindSetting: '15.5',
    zeroSetting: 1.5,
    actualSetting: 14.0,
    machine: 'Profitec GO',
    basket: '18g VST Precision (Ridgeless)',
    waterTempC: 93.0,
    peakPressureBars: 9.0,
    puckPrep: {
      wdt: true,
      puckScreen: false,
      distributionTool: false,
      paperFilterBottom: false,
      paperFilterTop: false,
    },
    channeling: 'None / Clean',
    tasteProfile: {
      acidity: 3,
      sweetness: 4,
      bitterness: 2,
      body: 4,
      crema: 4,
      clarity: 4,
    },
    flavorTags: ['Milk Chocolate', 'Almond', 'Red Apple', 'Toffee'],
    rating: 4.5,
    notes: 'Super daily driver. Great comfort balance, hazelnut toffee finish, cuts through milk brilliantly.',
    isDialedIn: true,
  },
];

const STORAGE_KEYS = {
  BEANS: 'extractionlab_beans_v1',
  SHOTS: 'extractionlab_shots_v1',
  PRESETS: 'extractionlab_presets_v1',
  GRINDERS: 'extractionlab_grinders_v1',
  MACHINES: 'extractionlab_machines_v1',
  BASKETS: 'extractionlab_baskets_v1',
  WATER_RECIPES: 'extractionlab_water_recipes_v1',
  ACTIVE_BEAN_ID: 'extractionlab_active_bean_v1',
  ACTIVE_GRINDER_ID: 'extractionlab_active_grinder_v1',
  ACTIVE_MACHINE_ID: 'extractionlab_active_machine_v1',
  ACTIVE_BASKET_ID: 'extractionlab_active_basket_v1',
  ACTIVE_WATER_RECIPE_ID: 'extractionlab_active_water_recipe_v1',
  EQUIPMENT: 'extractionlab_equipment_v1',
  SHOT_DRAFT: 'extractionlab_shot_draft_v1',
};

export interface ShotDraft {
  selectedPresetId?: string;
  selectedBeanId?: string;
  beanName?: string;
  roaster?: string;
  shotDate?: string;
  shotTime?: string;
  isTimestampCustomized?: boolean;
  doseGrams?: number;
  yieldGrams?: number;
  totalTimeSeconds?: number;
  preInfusionSeconds?: number;
  selectedGrinderId?: string;
  grinderName?: string;
  grindSetting?: string;
  zeroSetting?: number;
  selectedMachineId?: string;
  machine?: string;
  selectedBasketId?: string;
  basket?: string;
  selectedWaterRecipeId?: string;
  waterRecipeName?: string;
  waterTempC?: number;
  peakPressureBars?: number;
  puckPrep?: PuckPrep;
  channeling?: ChannelingLevel;
  tasteProfile?: TasteProfile;
  flavorTags?: string[];
  rating?: number;
  notes?: string;
  isDialedIn?: boolean;
  showAdvancedEquipment?: boolean;
  activeFlavorCategory?: string;
  stopwatchElapsedMs?: number;
  stopwatchPreInfusionMs?: number | null;
  stopwatchRunningStartedAt?: number | null;
  stopwatchCustomTargetSeconds?: number;
  updatedAt?: string;
}

export interface UserEquipment {
  grinder: string;
  machine: string;
  basket: string;
  defaultDose: number;
  waterTempC: number;
  defaultGrindSize: string;
}

export const DEFAULT_EQUIPMENT: UserEquipment = {
  grinder: 'DF64 Gen 2',
  machine: 'Profitec GO',
  basket: '18g VST Precision (Ridgeless)',
  defaultDose: 18.0,
  waterTempC: 93.5,
  defaultGrindSize: '15.5',
};

export function loadGrinders(): GrinderProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.GRINDERS);
    if (!raw) {
      saveGrinders(INITIAL_GRINDERS);
      return INITIAL_GRINDERS;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_GRINDERS;
  } catch {
    return INITIAL_GRINDERS;
  }
}

export function saveGrinders(grinders: GrinderProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.GRINDERS, JSON.stringify(grinders));
  } catch (err) {
    console.error('Failed to save grinders to localStorage', err);
  }
}

export function loadActiveGrinderId(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_GRINDER_ID) || 'grinder-1';
  } catch {
    return 'grinder-1';
  }
}

export function saveActiveGrinderId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_GRINDER_ID, id);
  } catch (err) {
    console.error('Failed to save active grinder ID', err);
  }
}

export function loadMachines(): MachineProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MACHINES);
    if (!raw) {
      const legacyEq = loadEquipment();
      let seeded = INITIAL_MACHINES;
      if (legacyEq.machine && !INITIAL_MACHINES.some((m) => m.name === legacyEq.machine)) {
        const customMachine: MachineProfile = {
          id: 'machine-custom-1',
          name: legacyEq.machine,
          portafilterSizeMm: 58,
          defaultTempC: legacyEq.waterTempC || 93.5,
          defaultPressureBars: 9.0,
          defaultPreInfusionSeconds: 4.0,
          isDefault: true,
          createdAt: new Date().toISOString(),
        };
        seeded = [customMachine, ...INITIAL_MACHINES];
        saveActiveMachineId(customMachine.id);
      }
      saveMachines(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_MACHINES;
  } catch {
    return INITIAL_MACHINES;
  }
}

export function saveMachines(machines: MachineProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.MACHINES, JSON.stringify(machines));
  } catch (err) {
    console.error('Failed to save machines to localStorage', err);
  }
}

export function loadActiveMachineId(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_MACHINE_ID) || 'machine-1';
  } catch {
    return 'machine-1';
  }
}

export function saveActiveMachineId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_MACHINE_ID, id);
  } catch (err) {
    console.error('Failed to save active machine ID', err);
  }
}

export function loadBaskets(): BasketProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BASKETS);
    if (!raw) {
      const legacyEq = loadEquipment();
      let seeded = INITIAL_BASKETS;
      if (legacyEq.basket && !INITIAL_BASKETS.some((b) => b.name === legacyEq.basket)) {
        const customBasket: BasketProfile = {
          id: 'basket-custom-1',
          name: legacyEq.basket,
          style: 'Ridgeless',
          isDefault: true,
          createdAt: new Date().toISOString(),
        };
        seeded = [customBasket, ...INITIAL_BASKETS];
        saveActiveBasketId(customBasket.id);
      }
      saveBaskets(seeded);
      return seeded;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_BASKETS;
  } catch {
    return INITIAL_BASKETS;
  }
}

export function saveBaskets(baskets: BasketProfile[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BASKETS, JSON.stringify(baskets));
  } catch (err) {
    console.error('Failed to save baskets to localStorage', err);
  }
}

export function loadActiveBasketId(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_BASKET_ID) || 'basket-1';
  } catch {
    return 'basket-1';
  }
}

export function saveActiveBasketId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_BASKET_ID, id);
  } catch (err) {
    console.error('Failed to save active basket ID', err);
  }
}

export function loadWaterRecipes(): WaterRecipe[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WATER_RECIPES);
    if (!raw) {
      saveWaterRecipes(INITIAL_WATER_RECIPES);
      return INITIAL_WATER_RECIPES;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_WATER_RECIPES;
  } catch {
    return INITIAL_WATER_RECIPES;
  }
}

export function saveWaterRecipes(recipes: WaterRecipe[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.WATER_RECIPES, JSON.stringify(recipes));
  } catch (err) {
    console.error('Failed to save water recipes to localStorage', err);
  }
}

export function loadActiveWaterRecipeId(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_WATER_RECIPE_ID) || 'water-1';
  } catch {
    return 'water-1';
  }
}

export function saveActiveWaterRecipeId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_WATER_RECIPE_ID, id);
  } catch (err) {
    console.error('Failed to save active water recipe ID', err);
  }
}

export function loadBeans(): BeanBag[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BEANS);
    if (!raw) {
      saveBeans(INITIAL_BEANS);
      return INITIAL_BEANS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_BEANS;
  }
}

export function saveBeans(beans: BeanBag[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.BEANS, JSON.stringify(beans));
  } catch (err) {
    console.error('Failed to save beans to localStorage', err);
  }
}

export function loadShots(): EspressoShot[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SHOTS);
    if (!raw) {
      saveShots(INITIAL_SHOTS);
      return INITIAL_SHOTS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_SHOTS;
  }
}

export function saveShots(shots: EspressoShot[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SHOTS, JSON.stringify(shots));
  } catch (err) {
    console.error('Failed to save shots to localStorage', err);
  }
}

export function loadPresets(): BrewPreset[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PRESETS);
    if (!raw) {
      savePresets(INITIAL_PRESETS);
      return INITIAL_PRESETS;
    }
    return JSON.parse(raw);
  } catch {
    return INITIAL_PRESETS;
  }
}

export function savePresets(presets: BrewPreset[]): void {
  try {
    localStorage.setItem(STORAGE_KEYS.PRESETS, JSON.stringify(presets));
  } catch (err) {
    console.error('Failed to save presets to localStorage', err);
  }
}

export function loadEquipment(): UserEquipment {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EQUIPMENT);
    if (!raw) {
      saveEquipment(DEFAULT_EQUIPMENT);
      return DEFAULT_EQUIPMENT;
    }
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object'
      ? { ...DEFAULT_EQUIPMENT, ...parsed }
      : DEFAULT_EQUIPMENT;
  } catch {
    return DEFAULT_EQUIPMENT;
  }
}

export function saveEquipment(eq: UserEquipment): void {
  try {
    localStorage.setItem(STORAGE_KEYS.EQUIPMENT, JSON.stringify(eq));
  } catch (err) {
    console.error('Failed to save equipment to localStorage', err);
  }
}

export function loadActiveBeanId(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_BEAN_ID) || 'bean-1';
  } catch {
    return 'bean-1';
  }
}

export function saveActiveBeanId(id: string): void {
  try {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_BEAN_ID, id);
  } catch (err) {
    console.error('Failed to save active bean ID', err);
  }
}

export function loadShotDraft(): ShotDraft | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SHOT_DRAFT);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as ShotDraft;
    }
    return null;
  } catch {
    return null;
  }
}

export function saveShotDraft(draft: ShotDraft): void {
  try {
    localStorage.setItem(STORAGE_KEYS.SHOT_DRAFT, JSON.stringify(draft));
  } catch (err) {
    console.error('Failed to save shot draft to localStorage', err);
  }
}

export function clearShotDraft(): void {
  try {
    localStorage.removeItem(STORAGE_KEYS.SHOT_DRAFT);
  } catch (err) {
    console.error('Failed to clear shot draft from localStorage', err);
  }
}

export function resetToDefaults(): {
  beans: BeanBag[];
  shots: EspressoShot[];
  presets: BrewPreset[];
  grinders: GrinderProfile[];
  machines: MachineProfile[];
  baskets: BasketProfile[];
  waterRecipes: WaterRecipe[];
  equipment: UserEquipment;
} {
  saveBeans(INITIAL_BEANS);
  saveShots(INITIAL_SHOTS);
  savePresets(INITIAL_PRESETS);
  saveGrinders(INITIAL_GRINDERS);
  saveMachines(INITIAL_MACHINES);
  saveBaskets(INITIAL_BASKETS);
  saveWaterRecipes(INITIAL_WATER_RECIPES);
  saveEquipment(DEFAULT_EQUIPMENT);
  saveActiveBeanId('bean-1');
  saveActiveGrinderId('grinder-1');
  saveActiveMachineId('machine-1');
  saveActiveBasketId('basket-1');
  saveActiveWaterRecipeId('water-1');
  clearShotDraft();
  return {
    beans: INITIAL_BEANS,
    shots: INITIAL_SHOTS,
    presets: INITIAL_PRESETS,
    grinders: INITIAL_GRINDERS,
    machines: INITIAL_MACHINES,
    baskets: INITIAL_BASKETS,
    waterRecipes: INITIAL_WATER_RECIPES,
    equipment: DEFAULT_EQUIPMENT,
  };
}
