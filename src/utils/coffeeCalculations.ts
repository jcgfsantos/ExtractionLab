import {
  EspressoShot,
  DialInDiagnosis,
  WaterBaseType,
  WaterConcentrateRecipe,
} from '../types/espresso';

export const FLAVOR_CATEGORIES: { name: string; tags: string[] }[] = [
  {
    name: 'Fruity & Citrus',
    tags: ['Lemon / Citrus', 'Bergamot', 'Green Apple', 'Orange / Mandarin', 'Peach / Apricot', 'Plum', 'Blackberry', 'Blueberry', 'Strawberry', 'Raspberry', 'Cherry', 'Tropical Fruit'],
  },
  {
    name: 'Floral & Delicate',
    tags: ['Jasmine', 'Orange Blossom', 'Earl Grey', 'Black Tea', 'Rose', 'Honeysuckle', 'Lemongrass'],
  },
  {
    name: 'Sweet & Confection',
    tags: ['Caramel', 'Toffee', 'Molasses', 'Brown Sugar', 'Honey', 'Maple Syrup', 'Vanilla', 'Butterscotch'],
  },
  {
    name: 'Chocolate & Nutty',
    tags: ['Dark Chocolate', 'Milk Chocolate', 'Cocoa Nibs', 'Roasted Hazelnut', 'Almond', 'Walnut', 'Peanut Butter', 'Nougat'],
  },
  {
    name: 'Spices & Savory',
    tags: ['Cinnamon', 'Cardamom', 'Clove', 'Nutmeg', 'Cedar / Oak', 'Toast / Biscuit', 'Tobacco'],
  },
  {
    name: 'Taste Flaws / Defects',
    tags: ['Sour / Sharp', 'Astringent / Chalky', 'Harsh Bitterness', 'Vegetal / Grassy', 'Ashy / Burnt', 'Thin / Watery'],
  },
];

export const COMMON_GRINDERS = [
  'DF64 Gen 2',
  'DF64V',
  'Niche Zero',
  'Niche Duo',
  'Eureka Mignon Specialita',
  'Eureka Mignon Zero',
  'Baratza Encore ESP',
  'Baratza Sette 270',
  '1Zpresso J-Max',
  '1Zpresso K-Ultra',
  'Comandante C40 (Red Clix)',
  'Lagom P64',
  'Mahlkönig EK43',
  'Fellow Opus',
  'Timemore Sculptor 064s',
  'Timemore Sculptor 078s',
];

export const COMMON_MACHINES = [
  'Profitec GO',
  'Gaggia Classic Pro / Evo',
  'Lelit Bianca V3',
  'Lelit Mara X',
  'Breville Dual Boiler (BES920)',
  'Breville Bambino Plus',
  'Breville Barista Express',
  'La Marzocco Linea Micra',
  'La Marzocco Linea Mini',
  'Flair 58 / 58x',
  'Rancilio Silvia Pro X',
  'ECM Synchronika',
  'Rocket Appartamento',
  'Decent DE1 Pro',
  'Nuova Simonelli Oscar II',
];

export const COMMON_BASKETS = [
  '18g VST Precision (Ridgeless)',
  '20g VST Precision (Ridgeless)',
  '15g VST Precision',
  '18g IMS Precision (Baristapro)',
  '20g IMS Precision',
  'Weber Workshops Unibasket 20g',
  'Normcore 18g High Extraction',
  'Standard Factory Double Basket (14-18g)',
  'Single Basket (7-9g)',
  'Triple Basket (21-22g)',
];

export function calculateBrewRatio(doseGrams: number, yieldGrams: number): number {
  if (!doseGrams || doseGrams <= 0) return 0;
  return Number((yieldGrams / doseGrams).toFixed(2));
}

export function calculateFlowRate(yieldGrams: number, totalTimeSeconds: number): number {
  if (!totalTimeSeconds || totalTimeSeconds <= 0) return 0;
  return Number((yieldGrams / totalTimeSeconds).toFixed(2));
}

export function calculateActualFlowRate(
  yieldGrams: number,
  totalTimeSeconds: number,
  preInfusionSeconds: number = 0
): number {
  const effectiveTime = totalTimeSeconds - Math.max(0, preInfusionSeconds || 0);
  if (!effectiveTime || effectiveTime <= 0) return 0;
  return Number((yieldGrams / effectiveTime).toFixed(2));
}

export function parseLocaleNumber(value: string | number): number {
  if (typeof value === 'number') return value;
  const normalized = String(value).trim().replace(/,/g, '.');
  return parseFloat(normalized);
}

export function calculateActualGrindSetting(dialSetting: string | number, zeroSetting: number = 0): number | null {
  const dialNum =
    typeof dialSetting === 'number'
      ? dialSetting
      : parseFloat(String(dialSetting).replace(/,/g, '.').replace(/[^\d.-]/g, ''));
  if (isNaN(dialNum)) return null;
  const actual = dialNum - zeroSetting;
  return Number(actual.toFixed(2));
}

export function formatGrindSettingDisplay(dialSetting: string, zeroSetting?: number, actualSetting?: number): string {
  if (actualSetting !== undefined && zeroSetting !== undefined && zeroSetting !== 0) {
    return `${actualSetting.toFixed(1)} (Dial ${dialSetting} - Zero ${zeroSetting.toFixed(1)})`;
  }
  return dialSetting;
}

export const DEFAULT_MAGNESIUM_CONCENTRATE: WaterConcentrateRecipe = {
  salt: 'Kruidvat Epsom Salt Bitterzout (MgSO₄·7H₂O)',
  saltGrams: 12.3,
  totalSolutionGrams: 500,
};

export const DEFAULT_BUFFER_CONCENTRATE: WaterConcentrateRecipe = {
  salt: 'Kruidvat Zuiveringszout (NaHCO₃)',
  saltGrams: 8.4,
  totalSolutionGrams: 500,
};

export const BASE_WATER_MINERALS: Record<
  WaterBaseType,
  { ghPpmCaCO3: number; khPpmCaCO3: number; bicarbonateMgL: number; description: string }
> = {
  Montcalm: {
    ghPpmCaCO3: 10,
    khPpmCaCO3: 4,
    bicarbonateMgL: 5,
    description: 'Ultra-soft spring water (~32 mg/L TDS, minimal Ca/scale)',
  },
  'Spa Reine': {
    ghPpmCaCO3: 18,
    khPpmCaCO3: 14,
    bicarbonateMgL: 17,
    description: 'Ultra-soft Belgian mineral water (~38 mg/L TDS, near-zero Ca)',
  },
  'Distilled / RO': {
    ghPpmCaCO3: 0,
    khPpmCaCO3: 0,
    bicarbonateMgL: 0,
    description: 'Pure zero-mineral water baseline (0 mg/L TDS)',
  },
  'Filtered Tap': {
    ghPpmCaCO3: 0,
    khPpmCaCO3: 0,
    bicarbonateMgL: 0,
    description: 'Concentrate additions only (add custom baseline if known)',
  },
  Other: {
    ghPpmCaCO3: 0,
    khPpmCaCO3: 0,
    bicarbonateMgL: 0,
    description: 'Custom water base (concentrate contribution shown)',
  },
};

export interface WaterChemistrySummary {
  addedGhPpm: number;
  addedKhPpm: number;
  addedBicarbonateMgL: number;
  addedMagnesiumMgL: number;
  totalGhPpm: number;
  totalKhPpm: number;
  totalBicarbonateMgL: number;
}

export function calculateWaterChemistry(params: {
  baseWater: WaterBaseType;
  batchVolumeLiters: number;
  magnesiumDoseGrams: number;
  bufferDoseGrams: number;
  magnesiumConcentrate?: WaterConcentrateRecipe;
  bufferConcentrate?: WaterConcentrateRecipe;
}): WaterChemistrySummary {
  const volume = Math.max(0.1, params.batchVolumeLiters || 1.5);
  const mgConc = params.magnesiumConcentrate ?? DEFAULT_MAGNESIUM_CONCENTRATE;
  const bufConc = params.bufferConcentrate ?? DEFAULT_BUFFER_CONCENTRATE;

  const mgSaltRatio =
    mgConc.totalSolutionGrams > 0 ? mgConc.saltGrams / mgConc.totalSolutionGrams : 0;
  const epsomMgPerL = (mgSaltRatio * Math.max(0, params.magnesiumDoseGrams) * 1000) / volume;
  // MgSO4·7H2O molar mass = 246.47 g/mol, CaCO3 = 100.09 g/mol, Mg = 24.305 g/mol
  const addedGhPpm = (epsomMgPerL / 246.47) * 100.09;
  const addedMagnesiumMgL = (epsomMgPerL / 246.47) * 24.305;

  const bufSaltRatio =
    bufConc.totalSolutionGrams > 0 ? bufConc.saltGrams / bufConc.totalSolutionGrams : 0;
  const nahco3MgPerL = (bufSaltRatio * Math.max(0, params.bufferDoseGrams) * 1000) / volume;
  // NaHCO3 molar mass = 84.01 g/mol, CaCO3 eq (KH) = 50.04 g/mol, HCO3- = 61.02 g/mol
  const addedKhPpm = (nahco3MgPerL / 84.01) * 50.04;
  const addedBicarbonateMgL = (nahco3MgPerL / 84.01) * 61.02;

  const base = BASE_WATER_MINERALS[params.baseWater] ?? BASE_WATER_MINERALS.Other;

  return {
    addedGhPpm: Number(addedGhPpm.toFixed(1)),
    addedKhPpm: Number(addedKhPpm.toFixed(1)),
    addedBicarbonateMgL: Number(addedBicarbonateMgL.toFixed(1)),
    addedMagnesiumMgL: Number(addedMagnesiumMgL.toFixed(1)),
    totalGhPpm: Number((base.ghPpmCaCO3 + addedGhPpm).toFixed(1)),
    totalKhPpm: Number((base.khPpmCaCO3 + addedKhPpm).toFixed(1)),
    totalBicarbonateMgL: Number((base.bicarbonateMgL + addedBicarbonateMgL).toFixed(1)),
  };
}

export interface ConcentrateStorageStatus {
  hasDate: boolean;
  daysInFridge: number | null;
  level: 'unset' | 'safe' | 'caution' | 'replace';
  badgeText: string;
  guidance: string;
}

export function getTodayLocalDateInput(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function getConcentrateStorageStatus(preparedDateStr?: string): ConcentrateStorageStatus {
  if (!preparedDateStr) {
    return {
      hasDate: false,
      daysInFridge: null,
      level: 'unset',
      badgeText: 'Prep date not set',
      guidance:
        'Log the preparation date to track cold storage age (safe for ~21–30 days at ≤ 4 °C in chlorine-free water).',
    };
  }

  const parts = preparedDateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some((n) => !Number.isFinite(n))) {
    return {
      hasDate: false,
      daysInFridge: null,
      level: 'unset',
      badgeText: 'Invalid date',
      guidance: 'Choose a valid preparation date.',
    };
  }

  const [y, m, d] = parts;
  const prepUtc = Date.UTC(y, m - 1, d);
  const now = new Date();
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.floor((todayUtc - prepUtc) / (1000 * 60 * 60 * 24));
  const days = Math.max(0, diffDays);

  if (days <= 21) {
    const remainingPrime = 21 - days;
    return {
      hasDate: true,
      daysInFridge: days,
      level: 'safe',
      badgeText: `${days}d in fridge · Safe`,
      guidance: `Within optimal 21-day window (${remainingPrime}d left in prime safety zone). Keep sealed at ≤ 4 °C.`,
    };
  }

  if (days <= 30) {
    const remainingMax = 30 - days;
    return {
      hasDate: true,
      daysInFridge: days,
      level: 'caution',
      badgeText: `${days}d in fridge · Caution`,
      guidance: `Between 22–30 days in chlorine-free water: inspect for haze or slick bottle walls; remake within ${remainingMax}d.`,
    };
  }

  return {
    hasDate: true,
    daysInFridge: days,
    level: 'replace',
    badgeText: `${days}d in fridge · Remake`,
    guidance:
      'Over 30 days in chlorine-free water: biofilm growth risk is elevated. Discard, sanitize bottle, and mix a fresh batch.',
  };
}

export function getRatioCategory(ratio: number): { label: string; description: string } {
  if (ratio <= 0) return { label: 'Pending', description: 'Enter dose and yield' };
  if (ratio < 1.6) return { label: 'Ristretto', description: 'Concentrated, viscous, high tactile body' };
  if (ratio <= 2.2) return { label: 'Normale (1:2)', description: 'Classic balanced espresso sweet spot' };
  if (ratio <= 2.8) return { label: 'Modern High Yield', description: 'Enhanced clarity & origin acidity (great for light roasts)' };
  if (ratio <= 3.8) return { label: 'Lungo / Allongé', description: 'High extraction, tea-like body, delicate aromatics' };
  return { label: 'Caffè Crema', description: 'Ultra-stretched high-yield extraction' };
}

export function calculateDaysOffRoast(roastDateStr: string, shotTimestampStr?: string): number | null {
  if (!roastDateStr) return null;
  const roastDate = new Date(roastDateStr);
  const targetDate = shotTimestampStr ? new Date(shotTimestampStr) : new Date();
  if (isNaN(roastDate.getTime())) return null;
  const diffTime = targetDate.getTime() - roastDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

export function getRoastFreshnessStatus(days: number | null): { text: string; note: string } {
  if (days === null) return { text: 'Date unrecorded', note: 'Add roast date for degassing advice' };
  if (days < 4) return { text: `${days} days (Too Fresh)`, note: 'High CO₂ may cause excessive foaming and sour/uneven extraction. Rest beans 4-7 days.' };
  if (days <= 14) return { text: `${days} days (Peak Window)`, note: 'Optimal degassing. Dynamic aromatics, dense crema, peak sweetness.' };
  if (days <= 35) return { text: `${days} days (Prime Drinking)`, note: 'Consistent flow and stable extraction behavior.' };
  if (days <= 60) return { text: `${days} days (Maturing)`, note: 'Degassing slowed; may require slightly finer grind to maintain backpressure.' };
  return { text: `${days} days (Aged)`, note: 'Aromatics fading. Consider freezing or grinding substantially finer.' };
}

export function isoToLocalDateTimeInputs(iso?: string): { date: string; time: string } {
  const parsed = iso ? new Date(iso) : new Date();
  const d = isNaN(parsed.getTime()) ? new Date() : parsed;
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  return { date, time };
}

export function localDateTimeInputsToIso(dateStr: string, timeStr: string): string {
  const dateParts = dateStr.split('-').map(Number);
  if (dateParts.length !== 3 || dateParts.some(isNaN)) {
    return new Date().toISOString();
  }
  const timeParts = (timeStr || '00:00:00').split(':').map(Number);
  const year = dateParts[0];
  const month = dateParts[1] - 1;
  const day = dateParts[2];
  const hours = !isNaN(timeParts[0]) ? timeParts[0] : 0;
  const minutes = !isNaN(timeParts[1]) ? timeParts[1] : 0;
  const seconds = !isNaN(timeParts[2]) ? timeParts[2] : 0;
  const localDate = new Date(year, month, day, hours, minutes, seconds);
  if (isNaN(localDate.getTime())) {
    return new Date().toISOString();
  }
  return localDate.toISOString();
}

export function diagnoseEspressoShot(shot: Partial<EspressoShot>): DialInDiagnosis {
  const dose = shot.doseGrams || 18;
  const yieldGrams = shot.yieldGrams || 36;
  const time = shot.totalTimeSeconds || 28;
  const ratio = calculateBrewRatio(dose, yieldGrams);
  const flowRate = calculateFlowRate(yieldGrams, time);
  const ratioInfo = getRatioCategory(ratio);

  const acidity = shot.tasteProfile?.acidity ?? 3;
  const sweetness = shot.tasteProfile?.sweetness ?? 3;
  const bitterness = shot.tasteProfile?.bitterness ?? 3;
  const channeling = shot.channeling;

  const flowRateAssessment =
    flowRate < 0.9
      ? `Restricted flow (${flowRate} g/s) - Pucks under dense resistance`
      : flowRate > 1.8
      ? `Fast flow (${flowRate} g/s) - Fast extraction throughput`
      : `Nominal flow (${flowRate} g/s) - Standard espresso laminar window`;

  // Check severe channeling first
  if (channeling === 'Squirting / Severe' || channeling === 'Early Blonding') {
    return {
      status: 'channeling',
      headline: 'Severe Channeling & Flow Bypass Detected',
      explanation:
        'Water discovered path of least resistance through cracks or edges in the coffee puck. This yields simultaneously sour and dry, astringent notes.',
      recommendations: [
        'Perform thorough needle WDT (Weiss Distribution Technique) to break clumps from bottom to top',
        'Use a self-leveling tamper to guarantee a 90° perpendicular puck surface',
        'Consider adding a puck screen (0.2–1.0mm) or paper filter at the bottom of the basket',
        'Check that your dry dose does not overfill basket (leave 2mm headspace under shower screen)',
      ],
      flowRateAssessment,
      ratioCategory: ratioInfo.label,
    };
  }

  // Fast / Under-extracted conditions
  const isFast = time < 23;
  const isSour = acidity >= 4 && sweetness <= 2;
  if (isFast || (isSour && flowRate > 1.6)) {
    return {
      status: 'under_extracted',
      headline: 'Under-Extracted (Shot Ran Fast & Sour)',
      explanation: `Extraction duration (${time}s) was too rapid for sufficient dissolution of sweet and balancing compounds. Dominant organic acids washed through early.`,
      recommendations: [
        'Adjust grinder 1 to 2 steps / clicks FINER to build higher puck resistance',
        'If grinder is already very fine, increase dose by +0.5g (e.g. 18.0g → 18.5g)',
        'For light roasts, increase water temperature by 1°C to 2°C (e.g. 93°C → 95°C)',
        'Extend extraction target yield slightly (e.g. pull 1:2.2 instead of 1:1.8)',
      ],
      flowRateAssessment,
      ratioCategory: ratioInfo.label,
    };
  }

  // Slow / Over-extracted conditions
  const isSlow = time > 37;
  const isBitter = bitterness >= 4 && sweetness <= 2;
  if (isSlow || (isBitter && flowRate < 0.9)) {
    return {
      status: 'over_extracted',
      headline: 'Over-Extracted (Shot Choked / Bitter & Dry)',
      explanation: `Contact time (${time}s) was prolonged, dissolving heavy polyphenols, dry tannins, and astringent compounds from the coffee cell walls.`,
      recommendations: [
        'Adjust grinder 1 to 2 steps / clicks COARSER to open puck porosity',
        'If shot tasted hollow and astringent despite fine grind, check for micro-channeling',
        'Decrease dose slightly by -0.5g if the puck was pressing against the shower screen screw',
        'Lower brew water temperature by 1°C to 2°C for medium-dark roasts',
        'Stop extraction earlier (aim for a tighter 1:1.8 to 1:2.0 ratio)',
      ],
      flowRateAssessment,
      ratioCategory: ratioInfo.label,
    };
  }

  // Optimal / Dialed-in condition
  if (sweetness >= 4 && bitterness <= 3 && acidity <= 3 && time >= 24 && time <= 34) {
    return {
      status: 'optimal',
      headline: 'Sweet Spot Achieved (Balanced Dial-In)',
      explanation: `Excellent extraction harmony. Flow rate (${flowRate} g/s) and ratio (1:${ratio.toFixed(1)}) hit the golden window with rich sweetness and pleasant tactile mouthfeel.`,
      recommendations: [
        'Lock in this grinder setting and dose as your reference recipe for this bag',
        'Record current bean bag day off roast to maintain repeatable results as beans age',
        'If tweaking, change only ONE variable at a time (e.g., ±0.5g yield)',
      ],
      flowRateAssessment,
      ratioCategory: ratioInfo.label,
    };
  }

  // Neutral / In-progress dial-in
  return {
    status: 'optimal',
    headline: 'Within Playable Extraction Range',
    explanation: `Shot pulled in ${time}s with ratio 1:${ratio.toFixed(2)} at ${flowRate} g/s. Taste balance is moderate.`,
    recommendations: [
      'To increase sweetness and body: grind slightly finer and maintain 1:2 ratio',
      'To increase fruity clarity and floral notes: loosen grind by half a step and stretch to 1:2.3 ratio',
      'Ensure pre-infusion is consistent across your test shots (aim for 4-6s)',
    ],
    flowRateAssessment,
    ratioCategory: ratioInfo.label,
  };
}

export function stepAdjustNumber(value: number, delta: number): number {
  const decDelta = (Math.abs(delta).toString().split('.')[1] || '').length;
  const decVal = (Math.abs(value).toString().split('.')[1] || '').length;
  const precision = Math.min(4, Math.max(decDelta, decVal));
  return Number((value + delta).toFixed(precision));
}

