"""Redis 异步客户端。"""
from redis import asyncio as aioredis

from app.config import settings

_client: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis:
    global _client
    if _client is None:
        _client = aioredis.from_url(settings.redis_url, decode_responses=True)
    return _client


async def ping() -> bool:
    try:
        return await get_redis().ping()
    except Exception:
        return False


async def close() -> None:
    global _client
    if _client is not None:
        await _client.aclose()
        _client = None
