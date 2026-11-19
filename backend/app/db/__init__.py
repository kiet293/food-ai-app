from .base import Base


def __getattr__(name):
    # Importing ORM metadata must not initialize the engine or load settings.
    if name in {"SessionLocal", "engine", "get_db"}:
        from . import session
        return getattr(session, name)
    raise AttributeError(f"module {__name__!r} has no attribute {name!r}")

__all__ = ["Base", "SessionLocal", "engine", "get_db"]
