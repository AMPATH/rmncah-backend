import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import dataSource from '../data-source.js';
import {
  FacilityLevel,
  FacilityOwnership,
  FacilityType,
} from '../../facilities/enums/facility.enum.js';
import { Facility } from '../../facilities/entities/facility.entity.js';
import { SubCounty } from '../../locations/sub-counties/entities/sub-county.entity.js';
import { County } from '../../locations/counties/entities/county.entity.js';

interface FacilitySeed {
  name: string;
  mflCode: string;
  countyCode: string;
  subCountyCode: string;
  level: FacilityLevel;
  type?: FacilityType | null;
  ownership?: FacilityOwnership | null;
  isActive?: boolean;
}

const FACILITY_FILES = ['uasin-gishu.json', 'trans-nzoia.json'];

const FACILITY_DATA_DIR = resolve(
  process.cwd(),
  'src/database/seeds/data/facilities',
);

function isValidEnum<T extends object>(enumObject: T, value: unknown): boolean {
  return Object.values(enumObject).includes(value);
}

async function loadFacilitySeeds(): Promise<FacilitySeed[]> {
  const records: FacilitySeed[] = [];

  for (const fileName of FACILITY_FILES) {
    const filePath = resolve(FACILITY_DATA_DIR, fileName);
    const fileContent = await readFile(filePath, 'utf-8');

    const parsed: unknown = JSON.parse(fileContent);

    if (!Array.isArray(parsed)) {
      throw new Error(`${fileName} must contain a JSON array.`);
    }

    records.push(...(parsed as FacilitySeed[]));
  }

  return records;
}

function validateFacilitySeeds(seeds: FacilitySeed[]): void {
  const seenMflCodes = new Set<string>();

  for (const [index, seed] of seeds.entries()) {
    const record = index + 1;

    if (
      !seed.name?.trim() ||
      !seed.mflCode?.trim() ||
      !seed.countyCode?.trim() ||
      !seed.subCountyCode?.trim()
    ) {
      throw new Error(`Facility record ${record} has missing required fields.`);
    }

    if (seenMflCodes.has(seed.mflCode)) {
      throw new Error(
        `Duplicate MFL code found in seed files: ${seed.mflCode}`,
      );
    }

    seenMflCodes.add(seed.mflCode);

    if (!isValidEnum(FacilityLevel, seed.level)) {
      throw new Error(
        `Invalid facility level "${seed.level}" for ${seed.mflCode}.`,
      );
    }

    if (seed.type != null && !isValidEnum(FacilityType, seed.type)) {
      throw new Error(
        `Invalid facility type "${seed.type}" for ${seed.mflCode}.`,
      );
    }

    if (
      seed.ownership != null &&
      !isValidEnum(FacilityOwnership, seed.ownership)
    ) {
      throw new Error(
        `Invalid facility ownership "${seed.ownership}" for ${seed.mflCode}.`,
      );
    }

    if (seed.isActive !== undefined && typeof seed.isActive !== 'boolean') {
      throw new Error(`Invalid isActive value for ${seed.mflCode}.`);
    }
  }
}

async function seedFacilities(): Promise<void> {
  await dataSource.initialize();

  try {
    const seeds = await loadFacilitySeeds();

    validateFacilitySeeds(seeds);

    await dataSource.transaction(async (manager) => {
      const countyRepository = manager.getRepository(County);
      const subCountyRepository = manager.getRepository(SubCounty);
      const facilityRepository = manager.getRepository(Facility);

      let createdCount = 0;
      let updatedCount = 0;

      for (const seed of seeds) {
        const county = await countyRepository.findOne({
          where: {
            code: seed.countyCode,
          },
        });

        if (!county) {
          throw new Error(
            `County ${seed.countyCode} not found for facility ${seed.mflCode}.`,
          );
        }

        const subCounty = await subCountyRepository.findOne({
          where: {
            code: seed.subCountyCode,
            countyId: county.id,
          },
        });

        if (!subCounty) {
          throw new Error(
            `Sub-county ${seed.subCountyCode} does not exist under county ${seed.countyCode}. Facility: ${seed.mflCode}.`,
          );
        }

        const existingFacility = await facilityRepository.findOne({
          where: {
            mflCode: seed.mflCode,
          },
        });

        const facilityData = {
          name: seed.name.trim(),
          mflCode: seed.mflCode.trim(),
          subCounty,
          level: seed.level,
          type: seed.type ?? null,
          ownership: seed.ownership ?? null,
          isActive: seed.isActive ?? true,
        };

        if (existingFacility) {
          Object.assign(existingFacility, facilityData);
          await facilityRepository.save(existingFacility);
          updatedCount++;
        } else {
          const facility = facilityRepository.create(facilityData);
          await facilityRepository.save(facility);
          createdCount++;
        }
      }

      console.log('Facility seeding completed.');
      console.log(`Created: ${createdCount}`);
      console.log(`Updated: ${updatedCount}`);
      console.log(`Total processed: ${seeds.length}`);
    });
  } catch (error) {
    console.error('Facility seeding failed:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

seedFacilities().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
