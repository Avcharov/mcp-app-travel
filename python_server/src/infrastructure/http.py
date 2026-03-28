import logging

from aiohttp import ClientSession

logger = logging.getLogger(__name__)


class HTTPSessionManager:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if getattr(cls, "_instance", None):
            return cls._instance
        cls._instance = super().__new__(cls, *args, **kwargs)
        return cls._instance

    def __init__(self) -> None:
        self._sessions: dict[str, ClientSession] = {}

    def add(self, name: str, session: ClientSession) -> None:
        if name not in self._sessions:
            logger.debug(f"Adding {name} session")
            self._sessions.setdefault(name, session)

    def get(self, name: str) -> ClientSession | None:
        return self._sessions.get(name)

    async def close_all(self) -> None:
        for name, session in self._sessions.items():
            logger.debug(f"Closing {name} session")
            await session.close()

    @classmethod
    def build(cls) -> HTTPSessionManager:
        return HTTPSessionManager()
