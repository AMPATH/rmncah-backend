import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import dataSource from '../data-source.js';

import { ContributingFactor } from '../../mpdsr/contributing-factors/entities/contributing-factor.entity.js';
import { DelayLevel } from '../../mpdsr/contributing-factors/enums/delay-level.enum.js';

interface ContributingFactorSeed {
  code: string;
  delayLevel: DelayLevel;
  name: string;
}

const DATA_FILE = resolve(
  process.cwd(),
  'src/database/seeds/data/contributing-factors/contributing-factors.json',
);

async function loadSeeds(): Promise<ContributingFactorSeed[]> {
  const content = await readFile(DATA_FILE, 'utf-8');
  const parsed: unknown = JSON.parse(content);

  if (!Array.isArray(parsed)) {
    throw new Error(
      'Contributing factors seed file must contain a JSON array.',
    );
  }

  const validDelayLevels = Object.values(DelayLevel);
  const seenCodes = new Set<string>();

  return parsed.map((record: unknown, index: number) => {
    if (typeof record !== 'object' || record === null) {
      throw new Error(
        `Invalid contributing factor at record ${index + 1}.`,
      );
    }

    const item = record as Record<string, unknown>;

    const requiredString = (field: string): string => {
      const value = item[field];

      if (typeof value !== 'string' || !value.trim()) {
        throw new Error(
          `Missing or invalid "${field}" at record ${index + 1}.`,
        );
      }

      return value.trim();
    };

    const code = requiredString('code');
    const delayLevel = requiredString('delayLevel');
    const name = requiredString('name');

    if (code.length > 30) {
      throw new Error(
        `Contributing factor code "${code}" exceeds 30 characters.`,
      );
    }

    if (name.length > 150) {
      throw new Error(
        `Contributing factor name "${name}" exceeds 150 characters.`,
      );
    }

    if (!validDelayLevels.includes(delayLevel as DelayLevel)) {
      throw new Error(
        `Invalid delay level "${delayLevel}" for factor "${code}".`,
      );
    }

    if (seenCodes.has(code)) {
      throw new Error(
        `Duplicate contributing factor code "${code}" found in seed data.`,
      );
    }

    seenCodes.add(code);

    return {
      code,
      delayLevel: delayLevel as DelayLevel,
      name,
    };
  });
}

async function seedContributingFactors(): Promise<void> {
  const factors = await loadSeeds();

  console.log('Starting contributing factors seeding...');
  console.log(`Total factors: ${factors.length}`);

  for (const level of Object.values(DelayLevel)) {
    const count = factors.filter(
      (factor) => factor.delayLevel === level,
    ).length;

    console.log(`${level}: ${count}`);
  }

  await dataSource.initialize();

  try {
    await dataSource.transaction(async (manager) => {
      const repository = manager.getRepository(ContributingFactor);

      await repository.upsert(
        factors.map((factor) => ({
          ...factor,
          isActive: true,
        })),
        ['code'],
      );

      console.log('Contributing factors seeding completed.');
      console.log(`Factors processed: ${factors.length}`);
    });
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

seedContributingFactors().catch((error: unknown) => {
  console.error('Contributing factors seeding failed:', error);
  process.exitCode = 1;
});
