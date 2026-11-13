import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

import dataSource from '../data-source.js';

import { County } from '../../locations/counties/entities/county.entity.js';
import { SubCounty } from '../../locations/sub-counties/entities/sub-county.entity.js';
import { Facility } from '../../facilities/entities/facility.entity.js';
import { CommunityUnit } from '../../locations/community-units/entities/community-unit.entity.js';

import {
  FacilityLevel,
  FacilityType,
  FacilityOwnership,
} from '../../facilities/enums/facility.enum.js';

interface CountySeed {
  name: string;
  code: string;
}

interface SubCountySeed {
  name: string;
  code: string;
  countyCode: string;
}

interface FacilitySeed {
  name: string;
  mflCode: string;
  subCountyCode: string;
  level: FacilityLevel;
  type?: FacilityType | null;
  ownership?: FacilityOwnership | null;
  isActive?: boolean;
}

interface CommunityUnitSeed {
  name: string;
  facilityMflCode: string;
  code?: string | null;
  isActive?: boolean;
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

function isEnumValue<T extends Record<string, string>>(
  enumObject: T,
  value: unknown,
): value is T[keyof T] {
  return Object.values(enumObject).includes(value as string);
}

async function seed(): Promise<void> {
  const counties = await loadJson<CountySeed>('counties.json');
  const subCounties = await loadJson<SubCountySeed>('sub-counties.json');
  const facilities = await loadJson<FacilitySeed>('facilities.json');
  const communityUnits = await loadJson<CommunityUnitSeed>(
    'community-units.json',
  );

  console.log('Starting location data seeding...');
  console.log(`Counties: ${counties.length}`);
  console.log(`Sub-counties: ${subCounties.length}`);
  console.log(`Facilities: ${facilities.length}`);
  console.log(`Community units: ${communityUnits.length}`);

  await dataSource.initialize();

  try {
    await dataSource.transaction(async (manager) => {
      const countyRepository = manager.getRepository(County);
      const subCountyRepository = manager.getRepository(SubCounty);
      const facilityRepository = manager.getRepository(Facility);
      const communityUnitRepository = manager.getRepository(CommunityUnit);

      const countyByCode = new Map<string, County>();
      const subCountyByCode = new Map<string, SubCounty>();
      const facilityByMflCode = new Map<string, Facility>();

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

        subCounty = await subCountyRepository.save(subCounty);
        subCountyByCode.set(code, subCounty);
      }

      // 3. Facilities
      for (const item of facilities) {
        const name = requiredString(item.name, 'name', 'facilities.json');
        const mflCode = requiredString(
          item.mflCode,
          'mflCode',
          'facilities.json',
        );
        const subCountyCode = requiredString(
          item.subCountyCode,
          'subCountyCode',
          'facilities.json',
        );

        if (!isEnumValue(FacilityLevel, item.level)) {
          throw new Error(
            `Invalid facility level for "${name}": ${String(item.level)}`,
          );
        }

        if (item.type != null && !isEnumValue(FacilityType, item.type)) {
          throw new Error(
            `Invalid facility type for "${name}": ${String(item.type)}`,
          );
        }

        if (
          item.ownership != null &&
          !isEnumValue(FacilityOwnership, item.ownership)
        ) {
          throw new Error(
            `Invalid facility ownership for "${name}": ${String(item.ownership)}`,
          );
        }

        const subCounty = subCountyByCode.get(subCountyCode);

        if (!subCounty) {
          throw new Error(
            `Sub-county code "${subCountyCode}" for facility "${name}" was not found in sub-counties.json.`,
          );
        }

        let facility = await facilityRepository.findOne({
          where: { mflCode },
        });

        if (facility) {
          facility.name = name;
          facility.subCountyId = subCounty.id;
          facility.level = item.level;
          facility.type = item.type ?? null;
          facility.ownership = item.ownership ?? null;
          facility.isActive = item.isActive ?? true;
        } else {
          facility = facilityRepository.create({
            name,
            mflCode,
            subCountyId: subCounty.id,
            level: item.level,
            type: item.type ?? null,
            ownership: item.ownership ?? null,
            isActive: item.isActive ?? true,
          });
        }

        facility = await facilityRepository.save(facility);
        facilityByMflCode.set(mflCode, facility);
      }

      // 4. Community units
      for (const item of communityUnits) {
        const name = requiredString(item.name, 'name', 'community-units.json');
        const facilityMflCode = requiredString(
          item.facilityMflCode,
          'facilityMflCode',
          'community-units.json',
        );

        const facility = facilityByMflCode.get(facilityMflCode);

        if (!facility) {
          throw new Error(
            `Facility MFL code "${facilityMflCode}" for community unit "${name}" was not found in facilities.json.`,
          );
        }

        let communityUnit = await communityUnitRepository.findOne({
          where: {
            facilityId: facility.id,
            name,
          },
        });

        if (communityUnit) {
          communityUnit.code = item.code ?? null;
          communityUnit.isActive = item.isActive ?? true;
        } else {
          communityUnit = communityUnitRepository.create({
            name,
            facilityId: facility.id,
            code: item.code ?? null,
            isActive: item.isActive ?? true,
          });
        }

        await communityUnitRepository.save(communityUnit);
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
