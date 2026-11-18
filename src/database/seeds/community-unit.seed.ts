import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import dataSource from '../data-source.js';

import { Facility } from '../../facilities/entities/facility.entity.js';
import { CommunityUnit } from '../../locations/community-units/entities/community-unit.entity.js';

interface CommunityUnitSeed {
  name: string;
  code?: string | null;
  facilityMflCode: string;
  isActive?: boolean;
}

const COMMUNITY_UNIT_FILES = ['uasin-gishu.json', 'trans-nzoia.json'];

const COMMUNITY_UNIT_DATA_DIR = resolve(
  process.cwd(),
  'src/database/seeds/data/community-units',
);

async function loadCommunityUnitSeeds(): Promise<CommunityUnitSeed[]> {
  const records: CommunityUnitSeed[] = [];

  for (const fileName of COMMUNITY_UNIT_FILES) {
    const filePath = resolve(COMMUNITY_UNIT_DATA_DIR, fileName);
    const content = await readFile(filePath, 'utf-8');
    const parsed: unknown = JSON.parse(content);

    if (!Array.isArray(parsed)) {
      throw new Error(`${fileName} must contain a JSON array.`);
    }

    records.push(...(parsed as CommunityUnitSeed[]));
  }

  return records;
}

function validateCommunityUnitSeeds(seeds: CommunityUnitSeed[]): void {
  const seenRecords = new Set<string>();

  for (const [index, seed] of seeds.entries()) {
    const record = index + 1;

    if (!seed.name?.trim() || !seed.facilityMflCode?.trim()) {
      throw new Error(
        `Community Unit record ${record} has missing required fields.`,
      );
    }

    if (
      seed.code !== undefined &&
      seed.code !== null &&
      (typeof seed.code !== 'string' || !seed.code.trim())
    ) {
      throw new Error(`Invalid Community Unit code for ${seed.name}.`);
    }

    if (seed.isActive !== undefined && typeof seed.isActive !== 'boolean') {
      throw new Error(`Invalid isActive value for ${seed.name}.`);
    }

    const uniqueKey = `${seed.facilityMflCode.trim()}::${seed.name.trim().toLowerCase()}`;

    if (seenRecords.has(uniqueKey)) {
      throw new Error(
        `Duplicate Community Unit "${seed.name}" for facility ${seed.facilityMflCode}.`,
      );
    }

    seenRecords.add(uniqueKey);
  }
}

async function seedCommunityUnits(): Promise<void> {
  await dataSource.initialize();

  try {
    const seeds = await loadCommunityUnitSeeds();

    validateCommunityUnitSeeds(seeds);

    console.log('Starting Community Unit seeding...');
    console.log(`Community Units: ${seeds.length}`);

    await dataSource.transaction(async (manager) => {
      const facilityRepository = manager.getRepository(Facility);
      const communityUnitRepository = manager.getRepository(CommunityUnit);

      let createdCount = 0;
      let updatedCount = 0;

      for (const seed of seeds) {
        const name = seed.name.trim();
        const facilityMflCode = seed.facilityMflCode.trim();

        // Resolve the parent facility using its MFL code.
        const facility = await facilityRepository.findOne({
          where: {
            mflCode: facilityMflCode,
          },
        });

        if (!facility) {
          throw new Error(
            `Facility MFL code "${facilityMflCode}" not found for Community Unit "${name}".`,
          );
        }

        // Include soft-deleted records to avoid unique-key conflicts.
        let communityUnit = await communityUnitRepository.findOne({
          where: {
            facilityId: facility.id,
            name,
          },
          withDeleted: true,
        });

        const communityUnitData = {
          name,
          facilityId: facility.id,
          code: seed.code?.trim() || null,
          isActive: seed.isActive ?? true,
        };

        if (communityUnit) {
          // Restore the record if it was previously soft-deleted.
          if (communityUnit.deletedAt) {
            communityUnit =
              await communityUnitRepository.recover(communityUnit);
          }

          Object.assign(communityUnit, communityUnitData);

          await communityUnitRepository.save(communityUnit);
          updatedCount++;
        } else {
          communityUnit = communityUnitRepository.create(communityUnitData);

          await communityUnitRepository.save(communityUnit);
          createdCount++;
        }
      }

      console.log('Community Unit seeding completed.');
      console.log(`Created: ${createdCount}`);
      console.log(`Updated: ${updatedCount}`);
      console.log(`Total processed: ${seeds.length}`);
    });
  } catch (error) {
    console.error('Community Unit seeding failed:', error);
    throw error;
  } finally {
    if (dataSource.isInitialized) {
      await dataSource.destroy();
    }
  }
}

seedCommunityUnits().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
