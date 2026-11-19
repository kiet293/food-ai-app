# Backend architecture

The backend is a modular monolith. Domain modules remain independent at the
application boundary, while shared infrastructure lives in dedicated packages.

```text
app/
├── api/             # route composition and request dependencies
├── core/            # configuration, security, exceptions and responses
├── db/              # SQLAlchemy base, engine and session lifecycle
├── integrations/    # Cloudinary, Gemini, Pexels and YOLO adapters
├── workers/         # background jobs
├── modules/         # business domains
│   ├── users/
│   ├── recipes/
│   ├── collections/
│   ├── reels/
│   ├── notifications/
│   ├── search/
│   └── ai/
├── application.py   # application factory and lifespan
└── main.py          # ASGI entry point only
```

## Dependency direction

Routers depend on domain services and schemas. Domain services may depend on
models, repositories and integration interfaces. Integrations and database
details must not depend on routers.

All business code lives below `app.modules`. Shared technical concerns live in
`app.core`, `app.db`, `app.api`, `app.integrations`, and `app.workers`.

## Adding an endpoint

1. Add the request/response model to the domain schema.
2. Add business logic to a focused domain service.
3. Keep database queries out of the router.
4. Add the endpoint to a focused router.
5. Register a new router in `app/api/router.py` only when needed.
6. Add an integration test for the public contract.

## Recipe use cases

`services/write_service.py` owns create/update transactions, input validation,
tag associations and upload compensation. `catalog_service.py` owns catalog,
notebook and feed reads; comments, interactions, tags and statistics have their
own implementation files. `recipe_service.py` is a compatibility facade only.
New callers import the focused service directly.

`repositories/summary_repository.py` loads card counts and viewer state in batches.
`services/presenter.py` assembles the public card shape without lazy relationship
queries. Read repositories may join multiple domains for aggregate views; write
operations belong to the owning module. Repositories do not commit transactions.

AI endpoints are synchronous, so inference, synchronous SDKs and SQLAlchemy run
in FastAPI's worker pool. Routers delegate orchestration to `ai/service.py`.
Cloudinary SDK calls are isolated in `integrations/cloudinary.py`. YOLO returns
plain detection data; the AI service converts it into API schemas.

## Runtime and database lifecycle

Flyway owns schema changes, starting with V0 for an empty database. API startup
does not mutate the schema unless local `AUTO_CREATE_SCHEMA=true` is requested.
Importing `app.db.Base` does not initialize the engine. Request sessions roll back
on errors and close on completion.

The scheduler runs separately with `python -m app.workers`. PostgreSQL advisory
transaction locks prevent overlapping trending recalculations. `RUN_SCHEDULER`
can enable an embedded scheduler for local development. Feed reads no longer
import Pexels videos by default; `SYNC_PEXELS_ON_READ` is an explicit local option.
Run `python -m app.workers sync-pexels` to import videos explicitly instead of
coupling an external API call to feed requests.

The current WebSocket connection registry is process-local. Run one API process
for consistent realtime broadcasts. Multiple API processes/replicas require a
shared event bus before scaling realtime traffic; scheduler separation alone
does not provide this.

## Frontend boundaries

Screens compose components and hooks. `useExploreData` owns batched loading and
refresh of home data; reels use server pagination. Domain services call the
shared HTTP client, which owns authorization headers, timeout, error decoding
and empty response handling. `EXPO_PUBLIC_API_URL` and `EXPO_PUBLIC_WS_URL` override
the local Expo host fallback.
