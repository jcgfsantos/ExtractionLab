export type ProcessType = 'Washed' | 'Natural' | 'Honey' | 'Anaerobic' | 'Wet-Hulled' | 'Experimental';

export type RoastLevel = 'Light' | 'Medium-Light' | 'Medium' | 'Medium-Dark' | 'Dark';

export type ChannelingLevel = 'None / Clean' | 'Minor Pinholes' | 'Squirting / Severe' | 'Early Blonding';

export interface BeanBag {
  id: string;
  name: string;
  roaster: string;
  origin: string;
  variety: string;
  process: ProcessType;
  roastLevel: RoastLevel;
  roastDate: string; // YYYY-MM-DD
  altitudeMeters?: number;
  bagWeightGrams: number;
  remainingGrams?: number;
  status: 'active' | 'finished' | 'archived';
  flavorTags?: string[];
  notes?: string;
  createdAt: string;
}

export interface TasteProfile {
  acidity: number; // 1-5
  sweetness: number; // 1-5
  bitterness: number; // 1-5
  body: number; // 1-5
  crema: number; // 1-5
  clarity: number; // 1-5
}

export interface PuckPrep {
  wdt: boolean;
  puckScreen: boolean;
  distributionTool: boolean;
  paperFilterBottom: boolean;
  paperFilterTop: boolean;
}

export type BurrType = 'Flat' | 'Conical' | 'Hybrid';

export interface GrinderProfile {
  id: string;
  name: string; // e.g. "DF64 Gen 2"
  burrType: BurrType;
  burrSizeMm?: number; // e.g. 64
  burrModel?: string; // e.g. "DLC Espresso" / "SSP Cast"
  zeroSetting: number; // e.g. 1.5 (where burrs touch / chirp)
  zeroDescription?: string; // e.g. "Burr chirp at mark 1.5"
  unit?: string; // "marks", "clicks", "steps", "numbers"
  stepSize?: number; // e.g. 0.5, 0.1, 1 (increment/decrement step for +/- buttons)
  micronsPerClick?: number; // e.g. 8.8 or 10 µm burr movement per unit
  notes?: string;
  isDefault?: boolean;
  createdAt: string;
}

export type BoilerType = 'Single Boiler' | 'Heat Exchanger' | 'Dual Boiler' | 'Thermoblock / Thermocoil' | 'Manual Lever';

export interface MachineProfile {
  id: string;
  name: string; // e.g. "Profitec GO"
  boilerType?: BoilerType;
  portafilterSizeMm?: number; // e.g. 58
  defaultTempC?: number; // e.g. 93.5
  defaultPressureBars?: number; // e.g. 9.0
  defaultPreInfusionSeconds?: number; // e.g. 4.0
  notes?: string;
  isDefault?: boolean;
  createdAt: string;
}

export interface BasketProfile {
  id: string;
  name: string; // e.g. "18g VST Precision (Ridgeless)"
  manufacturer?: string; // e.g. "VST", "IMS"
  ratedCapacityGrams?: number; // e.g. 18
  style?: 'Ridgeless' | 'Ridged' | 'High Extraction' | 'Single' | 'Pressurized';
  notes?: string;
  isDefault?: boolean;
  createdAt: string;
}

export type WaterBaseType = 'Montcalm' | 'Spa Reine' | 'Distilled / RO' | 'Filtered Tap' | 'Other';

export interface WaterConcentrateRecipe {
  salt: string; // e.g. "Kruidvat Epsom Salt Bitterzout (MgSO₄·7H₂O)"
  saltGrams: number; // e.g. 12.3
  totalSolutionGrams: number; // e.g. 500
}

export interface WaterConcentrateBatches {
  magnesiumPreparedDate: string; // YYYY-MM-DD or ''
  bufferPreparedDate: string; // YYYY-MM-DD or ''
}

export interface WaterRecipe {
  id: string;
  name: string; // e.g. "Baseline Montcalm / Spa Reine (9g Mg / 5g Buffer)"
  baseWater: WaterBaseType;
  batchVolumeLiters: number; // e.g. 1.5
  magnesiumDoseGrams: number; // e.g. 9.0
  bufferDoseGrams: number; // e.g. 5.0
  magnesiumConcentrate?: WaterConcentrateRecipe;
  bufferConcentrate?: WaterConcentrateRecipe;
  customGhPpm?: number;
  customBicarbonateMgL?: number;
  notes?: string;
  isDefault?: boolean;
  createdAt: string;
}

export interface EspressoShot {
  id: string;
  beanId: string;
  beanName: string;
  roaster: string;
  timestamp: string; // ISO
  doseGrams: number; // e.g. 18.0
  yieldGrams: number; // e.g. 36.0
  ratio: number; // e.g. 2.0
  totalTimeSeconds: number; // e.g. 28.5
  preInfusionSeconds: number; // e.g. 5.0
  flowRate: number; // g/s (average flow = yield / totalTime)
  actualFlowRate?: number; // g/s (actual flow = yield / (totalTime - preInfusion))
  grinderId?: string;
  grinder: string; // e.g. "DF64 Gen 2"
  grindSetting: string; // Dial reading / indicated setting (e.g. "15.5")
  zeroSetting?: number; // Zero point / burr touch calibration (e.g. 1.5)
  actualSetting?: number; // Calculated: dialSetting - zeroSetting (e.g. 14.0)
  machineId?: string;
  machine: string; // e.g. "Profitec GO"
  basketId?: string;
  basket: string; // e.g. "18g VST"
  waterRecipeId?: string;
  waterRecipeName?: string;
  waterTempC: number; // e.g. 93.5
  peakPressureBars: number; // e.g. 9.0
  puckPrep: PuckPrep;
  channeling: ChannelingLevel;
  tasteProfile: TasteProfile;
  flavorTags: string[];
  rating: number; // 1 to 5
  notes: string;
  isDialedIn: boolean;
}

export interface BrewPreset {
  id: string;
  name: string;
  description: string;
  targetDose: number;
  targetYield: number;
  targetTime: number;
  targetPreInfusion: number;
  targetTempC: number;
  targetPressureBar: number;
  targetGrindSetting?: string;
  grindRecommendation: string;
  style: 'Classic Italian' | 'Modern Light Roast' | 'Turbo Shot' | 'Ristretto' | 'Lungo' | 'Custom';
}

export interface DialInDiagnosis {
  status: 'optimal' | 'under_extracted' | 'over_extracted' | 'channeling' | 'fast_flow' | 'slow_flow';
  headline: string;
  explanation: string;
  recommendations: string[];
  flowRateAssessment: string;
  ratioCategory: string;
}
