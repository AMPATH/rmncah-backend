# Database Seeders

This directory contains the database seed scripts and datasets used to initialize reference data and Role-Based Access Control (RBAC) configuration.

The project currently has two seeders:

1. **Location Seeder** – populates Kenya's organizational and geographical reference data.
2. **RBAC Seeder** – populates system roles, permissions, and role-permission assignments.

## 1. Location Seeder

File: `src/database/seeds/location.seed.ts`

The location seeder populates the organizational reference data used by the application.

It uses the JSON datasets in `src/database/seeds/data/`:

- `counties.json` – counties.
- `sub-counties.json` – sub-counties.
- `facilities.json` – health facilities.
- `community-units.json` – community units.

Run the location seeder:

```bash
npm run seed:location
```

## 2. RBAC Seeder

File: `src/database/seeds/rbac.seed.ts`

The RBAC seeder initializes the application's authorization configuration.

It populates:

- **Roles** – system roles available in the application.
- **Permissions** – actions that users may perform within each system module.
- **Role-permission assignments** – permissions granted to each role.

The roles and permissions are organized into three system modules:

- `PLATFORM` – platform administration and access management.
- `MPDSR` – Maternal and Perinatal Death Surveillance and Response.
- `EMONC` – Emergency Obstetric and Newborn Care.

The seeder validates role-permission mappings and executes database changes within a transaction.

Run the RBAC seeder:

```bash
npm run seed:rbac
```

## 3. Prerequisites

Before running either seeder:

1. Configure the database connection in the project's `.env` file.
2. Ensure the database exists and is accessible.
3. Build and apply the required database migrations.

Run migrations:

```bash
npm run migration:run
```

## 4. Running the Seeders

Run both seeders individually:

```bash
npm run seed:location
npm run seed:rbac
```

Each command builds the application before executing its corresponding compiled seed script.

## 5. Important Notes

- Run database migrations before executing the seeders.
- The location and RBAC seeders are independent and can be executed separately.
- The RBAC seeder creates role and permission definitions; it does not assign roles to individual users.
- User organizational assignments and user-role assignments are managed separately through the application's authorization workflows.
- The RBAC seeder preserves existing role activation status when updating seeded role definitions.
- Seeders should be executed against the intended database environment.
- Avoid manually modifying seeded reference data unless the corresponding seed definitions are updated as well.

## 6. Available Seed Commands

| Command                 | Description                                                    |
| ----------------------- | -------------------------------------------------------------- |
| `npm run seed:location` | Seeds counties, sub-counties, facilities, and community units. |
| `npm run seed:rbac`     | Seeds roles, permissions, and role-permission mappings.        |
