# Database migrations

Flyway owns incremental schema changes in this directory. Migration filenames
must follow `V<version>__<description>.sql` and committed migrations must never
be edited after they have run in a shared environment.

The application temporarily retains `Base.metadata.create_all()` so existing
developer databases and new local installations remain compatible. Once a full
baseline migration is generated and tested against a clean database, remove that
compatibility call from `app/application.py`.

Run migrations explicitly with:

```bash
docker compose --profile tools run --rm flyway
```

The legacy Python migration entry points have been removed. New schema changes
belong exclusively in this directory.
