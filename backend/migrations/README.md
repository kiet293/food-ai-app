# Database migrations

Flyway owns incremental schema changes in this directory. Migration filenames
must follow `V<version>__<description>.sql` and committed migrations must never
be edited after they have run in a shared environment.

`V0__baseline.sql` creates the complete schema for a fresh database. Existing
nonempty databases use Flyway's configured baseline version 0 and then apply V1
and subsequent migrations. V1 remains unchanged to preserve its checksum.

Run migrations before starting the API or scheduler. The API no longer creates
tables by default. `AUTO_CREATE_SCHEMA=true` is a local development escape hatch;
it is rejected in production and does not replace incremental migrations.

Run migrations explicitly with:

```bash
docker compose --profile tools run --rm flyway
```

The legacy Python migration entry points have been removed. New schema changes
belong exclusively in this directory.
