import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { In } from 'typeorm';

import dataSource from '../data-source.js';

import { Icd11Cause } from '../../mpdsr/causes-of-death/entities/icd11-cause.entity.js';
import {
  Icd11CauseCaseType,
  Icd11CauseType,
} from '../../mpdsr/causes-of-death/entities/icd11-cause-type.entity.js';

interface CauseSeed {
  code: string;
  description: string;
}

const DATA_DIRECTORY = resolve(
  process.cwd(),
  'src/database/seeds/data/icd11-causes',
);

const MATERNAL_FILE = 'maternal-causes.json';
const PERINATAL_FILE = 'perinatal-causes.json';

async function loadCauseSeeds(fileName: string): Promise<CauseSeed[]> {
  const filePath = resolve(DATA_DIRECTORY, fileName);
  const content = await readFile(filePath, 'utf-8');
  const parsed: unknown = JSON.parse(content);

  if (!Array.isArray(parsed)) {
    throw new Error(`${fileName} must contain a JSON array.`);
  }

  const seenCodes = new Set<string>();

  return parsed.map((record: unknown, index: number) => {
    if (typeof record !== 'object' || record === null) {
      throw new Error(
        `Invalid record ${index + 1} in ${fileName}. Expected an object.`,
      );
    }

    const item = record as Record<string, unknown>;

    if (typeof item.code !== 'string' || !item.code.trim()) {
      throw new Error(
        `Missing or invalid code in record ${index + 1} of ${fileName}.`,
      );
    }

    if (
      typeof item.description !== 'string' ||
      !item.description.trim()
    ) {
      throw new Error(
        `Missing or invalid description in record ${index + 1} of ${fileName}.`,
      );
    }

    const code = item.code.trim();
    const description = item.description.trim();

    if (code.length > 50) {
      throw new Error(
        `ICD-11 code "${code}" exceeds 50 characters in ${fileName}.`,
      );
    }

    if (seenCodes.has(code)) {
      throw new Error(
        `Duplicate ICD-11 code "${code}" found in ${fileName}.`,
      );
    }

    seenCodes.add(code);

    return { code, description };
  });
}

async function seedIcd11Causes(): Promise<void> {
  const maternalCauses = await loadCauseSeeds(MATERNAL_FILE);
  const perinatalCauses = await loadCauseSeeds(PERINATAL_FILE);

  console.log('Starting ICD-11 causes seeding...');
  console.log(`Maternal causes: ${maternalCauses.length}`);
  console.log(`Perinatal causes: ${perinatalCauses.length}`);

  // Build one master catalogue, allowing a code to appear in both files.
  const causesByCode = new Map<string, string>();

  for (const cause of [...maternalCauses, ...perinatalCauses]) {
    const existingDescription = causesByCode.get(cause.code);

    if (
      existingDescription !== undefined &&
      existingDescription !== cause.description
    ) {
      throw new Error(
        `ICD-11 code "${cause.code}" has conflicting descriptions across seed files.`,
      );
    }

    causesByCode.set(cause.code, cause.description);
  }

  await dataSource.initialize();

  try {
    await dataSource.transaction(async (manager) => {
      const causeRepository = manager.getRepository(Icd11Cause);
      const causeTypeRepository = manager.getRepository(Icd11CauseType);

      // 1. Insert or update each unique ICD-11 cause.
      const causeRecords = Array.from(
        causesByCode,
        ([code, description]) => ({ code, description }),
      );

      await causeRepository.upsert(causeRecords, ['code']);

      // 2. Retrieve the saved causes to obtain their database IDs.
      const savedCauses = await causeRepository.find({
        where: {
          code: In(causeRecords.map((cause) => cause.code)),
        },
      });

      const causeByCode = new Map(
        savedCauses.map((cause) => [cause.code, cause]),
      );

      // 3. Create maternal and perinatal category mappings.
      const mappings = [
        ...maternalCauses.map((cause) => {
          const savedCause = causeByCode.get(cause.code);

          if (!savedCause) {
            throw new Error(
              `Could not find saved maternal cause "${cause.code}".`,
            );
          }

          return {
            causeId: savedCause.id,
            caseType: Icd11CauseCaseType.MATERNAL,
          };
        }),

        ...perinatalCauses.map((cause) => {
          const savedCause = causeByCode.get(cause.code);

          if (!savedCause) {
            throw new Error(
              `Could not find saved perinatal cause "${cause.code}".`,
            );
          }

          return {
            causeId: savedCause.id,
            caseType: Icd11CauseCaseType.PERINATAL,
          };
        }),
      ];

      // Insert only missing mappings; preserve existing mappings on reruns.
      await causeTypeRepository
        .createQueryBuilder()
        .insert()
        .into(Icd11CauseType)
        .values(mappings)
        .orIgnore()
        .execute();

      console.log('ICD-11 causes seeding completed.');
      console.log(`Unique causes processed: ${causeRecords.length}`);
      console.log(`Maternal mappings processed: ${maternalCauses.length}`);
      console.log(`Perinatal mappings processed: ${perinatalCauses.length}`);
      console.log(`Total mappings processed: ${mappings.length}`);
    });
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

seedIcd11Causes().catch((error: unknown) => {
  console.error('ICD-11 causes seeding failed:', error);
  process.exitCode = 1;
});
