# Implementation Plan - Database Migration to External PostgreSQL

This plan outlines the steps to migrate the application's database from the internal Docker container (`golfins-postgres`) to an external PostgreSQL server running on the same machine.

## User Configuration Provided

- **Environment**: Same Docker host.
- **External Container Name**: `postgres`
- **Username**: `admin`
- **Password**: `secret123`
- **Networking**: Shared Docker network.
- **Database Name**: `golfins`

---

## Proposed Changes

### 1. Networking Infrastructure
- We will connect the existing external `postgres` container to the application's network (`golfins-network`) to allow communication via container name.

### 2. Configuration Updates

#### [MODIFY] [.env](file:///d:/Docker/Golfins/.env)
- Update `DATABASE_URL` to: `postgresql+asyncpg://admin:secret123@postgres:5432/golfins`

#### [MODIFY] [docker-compose.yaml](file:///d:/Docker/Golfins/docker-compose.yaml)
- **[DELETE]** The `postgres` service block (lines 5-22).
- **[MODIFY]** Remove all `depends_on: postgres` lines from backend services.
- **[MODIFY]** Change the `golfins-network` definition if necessary to ensure it persists or is correctly named.

---

## Execution Steps

### Phase 1: Data Backup (Source)
1. Export data from the current container:
   ```bash
   docker exec golfins-postgres pg_dump -U golfins_user golfins > golfins_dump.sql
   ```

### Phase 2: External Server Preparation
1. Connect the external `postgres` container to the app network:
   ```bash
   docker network connect golfins_golfins-network postgres
   ```
2. Create the target database:
   ```bash
   docker exec -it postgres psql -U admin -c "CREATE DATABASE golfins;"
   ```

### Phase 3: Data Restoration (Target)
1. Import the SQL dump into the external container:
   ```bash
   docker exec -i postgres psql -U admin -d golfins < golfins_dump.sql
   ```

### Phase 4: Application Switchover
1. Update `.env` and `docker-compose.yaml`.
2. Restart services:
   ```bash
   docker-compose down
   docker-compose up -d
   ```

---

## Verification Plan

### Connectivity Test
- Confirm the `postgres` container is reachable from within the app containers:
  ```bash
  docker exec golfins-auth-service ping postgres
  ```

### Data Integrity Check
- Log in to the application and verify that existing data (Users, Policies) is present and correct.
- Check backend logs for any database connection errors.

### Manual Verification
- Perform a "Sync" or "Create" operation to ensure write access works on the new server.
