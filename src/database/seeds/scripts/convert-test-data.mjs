import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const baseDir = resolve('src/database/seeds/data');
const importDir = resolve(baseDir, 'import');

const counties = {
  '026': 'trans-nzoia',
  '027': 'uasin-gishu',
};

const facilityTypes = {
  DISPENSARY: 'Dispensary',
  MEDICAL_CLINIC: 'Medical Clinic',
  HEALTH_CENTRE: 'Health Centre',
  NURSING_HOME: 'Nursing Home',
  SUB_COUNTY_HOSPITAL: 'Sub-County Hospital',
  COUNTY_REFERRAL_HOSPITAL: 'County Referral Hospital',
  NATIONAL_REFERRAL_HOSPITAL: 'National Referral Hospital',
};

const ownershipTypes = {
  PUBLIC: 'Public',
  PRIVATE: 'Private',
  FAITH_BASED: 'Faith Based',
  NGO: 'NGO',
  OTHER: 'Other',
};

function parseCsv(content) {
  const [headerLine, ...lines] = content.trim().split(/\r?\n/);
  const headers = headerLine.split(',').map((value) => value.trim());

  return lines.filter(Boolean).map((line) => {
    const values = line.split(',');
    return Object.fromEntries(
      headers.map((header, index) => [header, values[index]?.trim() ?? '']),
    );
  });
}

function parseBoolean(value) {
  if (value === 'True') return true;
  if (value === 'False') return false;
  throw new Error(`Invalid boolean value: ${value}`);
}

async function writeCountyFiles(folder, groupedData) {
  for (const [countyCode, filename] of Object.entries(counties)) {
    const directory = resolve(baseDir, folder);
    await mkdir(directory, { recursive: true });

    await writeFile(
      resolve(directory, `${filename}.json`),
      JSON.stringify(groupedData[countyCode] ?? [], null, 2) + '\n',
    );

    console.log(`Generated ${folder}/${filename}.json`);
  }
}

async function main() {
  const facilityCsv = await readFile(
    resolve(importDir, 'sample-test-facilities.csv'),
    'utf8',
  );

  const communityCsv = await readFile(
    resolve(importDir, 'sample-test-community-units.csv'),
    'utf8',
  );

  const facilities = parseCsv(facilityCsv);
  const communityUnits = parseCsv(communityCsv);

  const groupedFacilities = { '026': [], '027': [] };
  const groupedCommunityUnits = { '026': [], '027': [] };

  for (const row of facilities) {
    const county = groupedFacilities[row.countyCode];

    if (!county) {
      throw new Error(`Unknown facility county: ${row.countyCode}`);
    }

    if (!facilityTypes[row.type]) {
      throw new Error(`Unknown facility type: ${row.type}`);
    }

    if (!ownershipTypes[row.ownership]) {
      throw new Error(`Unknown ownership: ${row.ownership}`);
    }

    county.push({
      name: row.name,
      mflCode: row.mflCode,
      countyCode: row.countyCode,
      subCountyCode: row.subCountyCode,
      level: row.level,
      type: facilityTypes[row.type],
      ownership: ownershipTypes[row.ownership],
      isActive: parseBoolean(row.isActive),
    });
  }

  for (const row of communityUnits) {
    const county = groupedCommunityUnits[row.countyCode];

    if (!county) {
      throw new Error(`Unknown community-unit county: ${row.countyCode}`);
    }

    county.push({
      name: row.name,
      code: row.code,
      facilityMflCode: row.facilityMflCode,
      isActive: parseBoolean(row.isActive),
    });
  }

  await writeCountyFiles('facilities', groupedFacilities);
  await writeCountyFiles('community-units', groupedCommunityUnits);

  console.log('\nConversion completed successfully.');
  console.log(`Facilities: ${facilities.length}`);
  console.log(`Community units: ${communityUnits.length}`);
}

main().catch((error) => {
  console.error('Conversion failed:', error);
  process.exitCode = 1;
});
