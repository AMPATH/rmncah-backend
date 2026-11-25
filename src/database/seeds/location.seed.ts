import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import dataSource from '../data-source.js';

import { County } from '../../locations/counties/entities/county.entity.js';
import { SubCounty } from '../../locations/sub-counties/entities/sub-county.entity.js';

interface CountySeed {
  name: string;
  code: string;
}

interface SubCountySeed {
  name: string;
  code: string;
  countyCode: string;
}

const DATA_DIRECTORY = resolve(process.cwd(), 'src/database/seeds/data');

async function loadJson<T>(fileName: string): Promise<T[]> {
  const filePath = resolve(DATA_DIRECTORY, fileName);
  const content = await readFile(filePath, 'utf-8');
  const data: unknown = JSON.parse(content);

  if (!Array.isArray(data)) {
    throw new Error(`${fileName} must contain a JSON array.`);
  }

  return data as T[];
}

function requiredString(
  value: unknown,
  field: string,
  fileName: string,
): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Invalid or missing "${field}" in ${fileName}.`);
  }

  return value.trim();
}

async function seed(): Promise<void> {
  const counties = await loadJson<CountySeed>('counties.json');
  const subCounties = await loadJson<SubCountySeed>('sub-counties.json');

  console.log('Starting location data seeding...');
  console.log(`Counties: ${counties.length}`);
  console.log(`Sub-counties: ${subCounties.length}`);

  await dataSource.initialize();

  try {
    await dataSource.transaction(async (manager) => {
      const countyRepository = manager.getRepository(County);
      const subCountyRepository = manager.getRepository(SubCounty);

      const countyByCode = new Map<string, County>();

      // 1. Counties
      for (const item of counties) {
        const name = requiredString(item.name, 'name', 'counties.json');
        const code = requiredString(item.code, 'code', 'counties.json');

        if (code.length !== 3) {
          throw new Error(`County code "${code}" must be 3 characters.`);
        }

        let county = await countyRepository.findOne({
          where: { code },
        });

        if (county) {
          county.name = name;
        } else {
          county = countyRepository.create({ name, code });
        }

        county = await countyRepository.save(county);
        countyByCode.set(code, county);
      }

      // 2. Sub-counties
      for (const item of subCounties) {
        const name = requiredString(item.name, 'name', 'sub-counties.json');
        const code = requiredString(item.code, 'code', 'sub-counties.json');
        const countyCode = requiredString(
          item.countyCode,
          'countyCode',
          'sub-counties.json',
        );

        if (!/^\d{3,10}$/.test(code)) {
          throw new Error(
            `Sub-county code "${code}" must contain between 3 and 10 digits.`,
          );
        }

        const county = countyByCode.get(countyCode);

        if (!county) {
          throw new Error(
            `County code "${countyCode}" for sub-county "${name}" was not found in counties.json.`,
          );
        }

        let subCounty = await subCountyRepository.findOne({
          where: { code },
        });

        if (subCounty && subCounty.countyId !== county.id) {
          throw new Error(
            `Sub-county code "${code}" already belongs to another county.`,
          );
        }

        if (subCounty) {
          subCounty.name = name;
        } else {
          subCounty = subCountyRepository.create({
            name,
            code,
            countyId: county.id,
          });
        }

        await subCountyRepository.save(subCounty);
      }
    });

    console.log('Location data seeding completed successfully.');
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((error: unknown) => {
  console.error('Location data seeding failed:', error);
  process.exitCode = 1;
});
