import {
  BeanBag,
  BasketProfile,
  ChannelingLevel,
  EspressoShot,
  GrinderProfile,
  MachineProfile,
  WaterRecipe,
} from '../types/espresso';
import {
  calculateActualFlowRate,
  calculateActualGrindSetting,
  calculateBrewRatio,
  calculateFlowRate,
  DEFAULT_BUFFER_CONCENTRATE,
  DEFAULT_MAGNESIUM_CONCENTRATE,
} from './coffeeCalculations';

const VALID_CHANNELING_LEVELS: ChannelingLevel[] = [
  'None / Clean',
  'Minor Pinholes',
  'Squirting / Severe',
  'Early Blonding',
];

export function parseCsvText(text: string): string[][] {
  const cleaned = text.replace(/^\uFEFF/, '');
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let inQuotes = false;

  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    const next = cleaned[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        currentCell += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        currentCell += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ',') {
        currentRow.push(currentCell);
        currentCell = '';
      } else if (ch === '\r' && next === '\n') {
        currentRow.push(currentCell);
        if (currentRow.some((cell) => cell.trim() !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
        i++;
      } else if (ch === '\n' || ch === '\r') {
        currentRow.push(currentCell);
        if (currentRow.some((cell) => cell.trim() !== '')) {
          rows.push(currentRow);
        }
        currentRow = [];
        currentCell = '';
      } else {
        currentCell += ch;
      }
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    if (currentRow.some((cell) => cell.trim() !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function parseNumberCell(raw: string | undefined): number | undefined {
  if (raw === undefined) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : undefined;
}

function normalizeTimestamp(raw: string | undefined): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return new Date().toISOString();
  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function normalizeChanneling(raw: string | undefined): ChannelingLevel {
  const trimmed = (raw || '').trim();
  const match = VALID_CHANNELING_LEVELS.find(
    (level) => level.toLowerCase() === trimmed.toLowerCase()
  );
  return match ?? 'None / Clean';
}

export interface CsvImportResult {
  shots: EspressoShot[];
  beans: BeanBag[];
  grinders: GrinderProfile[];
  machines: MachineProfile[];
  baskets: BasketProfile[];
  waterRecipes: WaterRecipe[];
  summary: {
    shotCount: number;
    newBeans: number;
    newGrinders: number;
    newMachines: number;
    newBaskets: number;
    newWaterRecipes: number;
  };
}

export function importDatabaseFromCsv(
  csvText: string,
  existing: {
    beans: BeanBag[];
    grinders: GrinderProfile[];
    machines: MachineProfile[];
    baskets: BasketProfile[];
    waterRecipes: WaterRecipe[];
  }
): CsvImportResult {
  const rows = parseCsvText(csvText);
  if (rows.length < 2) {
    throw new Error('CSV file must include a header row and at least one shot record.');
  }

  const headerIndex = new Map<string, number>();
  rows[0].forEach((col, idx) => {
    headerIndex.set(col.trim().toLowerCase(), idx);
  });

  const getCol = (row: string[], ...candidates: string[]): string | undefined => {
    for (const candidate of candidates) {
      const idx = headerIndex.get(candidate.toLowerCase());
      if (idx !== undefined) {
        return row[idx];
      }
    }
    return undefined;
  };

  const hasCoreHeaders =
    headerIndex.has('dose (g)') &&
    headerIndex.has('yield (g)') &&
    (headerIndex.has('bean name') || headerIndex.has('timestamp'));

  if (!hasCoreHeaders) {
    throw new Error(
      'Unrecognized CSV format. Please use a CSV file exported from ExtractionLab.'
    );
  }

  const beans = [...existing.beans];
  const grinders = [...existing.grinders];
  const machines = [...existing.machines];
  const baskets = [...existing.baskets];
  const waterRecipes = [...existing.waterRecipes];

  let newBeans = 0;
  let newGrinders = 0;
  let newMachines = 0;
  let newBaskets = 0;
  let newWaterRecipes = 0;

  const baseNow = Date.now();
  const importedShots: EspressoShot[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.every((cell) => cell.trim() === '')) continue;

    const timestamp = normalizeTimestamp(getCol(row, 'Timestamp'));
    const beanName = (getCol(row, 'Bean Name') || 'Imported Coffee').trim();
    const roaster = (getCol(row, 'Roaster') || 'Unknown Roaster').trim();
    const doseGrams = parseNumberCell(getCol(row, 'Dose (g)')) ?? 18.0;
    const yieldGrams = parseNumberCell(getCol(row, 'Yield (g)')) ?? 36.0;
    const totalTimeSeconds = parseNumberCell(getCol(row, 'Total Time (s)')) ?? 28.0;
    const preInfusionSeconds = parseNumberCell(getCol(row, 'Pre-infusion (s)')) ?? 0;

    const ratio =
      parseNumberCell(getCol(row, 'Ratio')) ??
      calculateBrewRatio(doseGrams, yieldGrams);
    const flowRate =
      parseNumberCell(getCol(row, 'Avg Flow Rate (g/s)')) ??
      calculateFlowRate(yieldGrams, totalTimeSeconds);
    const actualFlowRate =
      parseNumberCell(getCol(row, 'Actual Flow Rate (g/s)')) ??
      calculateActualFlowRate(yieldGrams, totalTimeSeconds, preInfusionSeconds);

    const grinderName = (getCol(row, 'Grinder') || 'Grinder').trim();
    const grindSetting = (getCol(row, 'Grind Setting (Dial)') || '').trim() || '15.5';
    const zeroSetting = parseNumberCell(getCol(row, 'Zero Setting'));
    const actualSetting =
      parseNumberCell(getCol(row, 'Actual Setting')) ??
      calculateActualGrindSetting(grindSetting, zeroSetting ?? 0) ??
      undefined;

    const machineName = (getCol(row, 'Machine') || 'Espresso Machine').trim();
    const basketName = (getCol(row, 'Basket') || 'Filter Basket').trim();
    const waterRecipeName = (getCol(row, 'Water Recipe', 'Water') || '').trim();
    const waterTempC = parseNumberCell(getCol(row, 'Water Temp (C)')) ?? 93.5;
    const peakPressureBars = parseNumberCell(getCol(row, 'Pressure (bar)')) ?? 9.0;
    const channeling = normalizeChanneling(getCol(row, 'Channeling'));
    const ratingRaw = parseNumberCell(getCol(row, 'Score (1-5)')) ?? 4.0;
    const rating = Math.min(5, Math.max(0, ratingRaw));

    const dialedInCell = (getCol(row, 'Dialed In') || '').trim().toLowerCase();
    const isDialedIn = dialedInCell === 'yes' || dialedInCell === 'true' || dialedInCell === '1';

    const flavorTagsRaw = getCol(row, 'Flavor Tags') || '';
    const flavorTags = flavorTagsRaw
      .split(';')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const notes = (getCol(row, 'Notes') || '').trim();

    // Match or create BeanBag
    let matchedBean = beans.find(
      (b) =>
        b.name.toLowerCase() === beanName.toLowerCase() &&
        b.roaster.toLowerCase() === roaster.toLowerCase()
    );
    if (!matchedBean) {
      matchedBean = beans.find((b) => b.name.toLowerCase() === beanName.toLowerCase());
    }
    if (!matchedBean) {
      matchedBean = {
        id: `bean-import-${baseNow}-${newBeans}`,
        name: beanName,
        roaster,
        origin: 'Single Origin',
        variety: 'Heirloom',
        process: 'Washed',
        roastLevel: 'Medium',
        roastDate: timestamp.split('T')[0],
        bagWeightGrams: 250,
        status: 'active',
        flavorTags: [...flavorTags],
        notes: '',
        createdAt: timestamp,
      };
      beans.push(matchedBean);
      newBeans++;
    }

    // Match or create GrinderProfile
    let matchedGrinder = grinders.find(
      (g) => g.name.toLowerCase() === grinderName.toLowerCase()
    );
    if (!matchedGrinder && grinderName) {
      matchedGrinder = {
        id: `grinder-import-${baseNow}-${newGrinders}`,
        name: grinderName,
        burrType: 'Flat',
        zeroSetting: zeroSetting ?? 0,
        unit: 'marks',
        stepSize: 0.5,
        createdAt: timestamp,
      };
      grinders.push(matchedGrinder);
      newGrinders++;
    }

    // Match or create MachineProfile
    let matchedMachine = machines.find(
      (m) => m.name.toLowerCase() === machineName.toLowerCase()
    );
    if (!matchedMachine && machineName) {
      matchedMachine = {
        id: `machine-import-${baseNow}-${newMachines}`,
        name: machineName,
        portafilterSizeMm: 58,
        defaultTempC: waterTempC,
        defaultPressureBars: peakPressureBars,
        defaultPreInfusionSeconds: preInfusionSeconds,
        createdAt: timestamp,
      };
      machines.push(matchedMachine);
      newMachines++;
    }

    // Match or create BasketProfile
    let matchedBasket = baskets.find(
      (b) => b.name.toLowerCase() === basketName.toLowerCase()
    );
    if (!matchedBasket && basketName) {
      matchedBasket = {
        id: `basket-import-${baseNow}-${newBaskets}`,
        name: basketName,
        style: 'Ridgeless',
        createdAt: timestamp,
      };
      baskets.push(matchedBasket);
      newBaskets++;
    }

    // Match or create WaterRecipe if specified
    let matchedWaterRecipe = waterRecipeName
      ? waterRecipes.find((w) => w.name.toLowerCase() === waterRecipeName.toLowerCase())
      : undefined;
    if (!matchedWaterRecipe && waterRecipeName) {
      matchedWaterRecipe = {
        id: `water-import-${baseNow}-${newWaterRecipes}`,
        name: waterRecipeName,
        baseWater: 'Montcalm',
        batchVolumeLiters: 1.5,
        magnesiumDoseGrams: 9.0,
        bufferDoseGrams: 5.0,
        magnesiumConcentrate: { ...DEFAULT_MAGNESIUM_CONCENTRATE },
        bufferConcentrate: { ...DEFAULT_BUFFER_CONCENTRATE },
        createdAt: timestamp,
      };
      waterRecipes.push(matchedWaterRecipe);
      newWaterRecipes++;
    }

    importedShots.push({
      id: `shot-import-${baseNow}-${i}`,
      beanId: matchedBean.id,
      beanName: matchedBean.name,
      roaster: matchedBean.roaster,
      timestamp,
      doseGrams,
      yieldGrams,
      ratio,
      totalTimeSeconds,
      preInfusionSeconds,
      flowRate,
      actualFlowRate,
      grinderId: matchedGrinder?.id,
      grinder: matchedGrinder?.name ?? grinderName,
      grindSetting,
      zeroSetting: zeroSetting ?? matchedGrinder?.zeroSetting,
      actualSetting,
      machineId: matchedMachine?.id,
      machine: matchedMachine?.name ?? machineName,
      basketId: matchedBasket?.id,
      basket: matchedBasket?.name ?? basketName,
      waterRecipeId: matchedWaterRecipe?.id,
      waterRecipeName: matchedWaterRecipe?.name ?? (waterRecipeName || undefined),
      waterTempC,
      peakPressureBars,
      puckPrep: {
        wdt: true,
        puckScreen: false,
        distributionTool: false,
        paperFilterBottom: false,
        paperFilterTop: false,
      },
      channeling,
      tasteProfile: {
        acidity: 3,
        sweetness: 3,
        bitterness: 3,
        body: 3,
        crema: 3,
        clarity: 3,
      },
      flavorTags,
      rating,
      notes,
      isDialedIn,
    });
  }

  if (importedShots.length === 0) {
    throw new Error('No valid shot rows were found in the CSV file.');
  }

  return {
    shots: importedShots,
    beans,
    grinders,
    machines,
    baskets,
    waterRecipes,
    summary: {
      shotCount: importedShots.length,
      newBeans,
      newGrinders,
      newMachines,
      newBaskets,
      newWaterRecipes,
    },
  };
}
