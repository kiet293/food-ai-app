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
