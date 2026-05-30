"""Elasticsearch 异步客户端。"""
from elasticsearch import AsyncElasticsearch

from app.config import settings

_client: AsyncElasticsearch | None = None


def get_es() -> AsyncElasticsearch:
    global _client
    if _client is None:
        auth = None
        if settings.es_username:
            auth = (settings.es_username, settings.es_password)
        _client = AsyncElasticsearch(hosts=[settings.es_host], basic_auth=auth)
    return _client


async def ping() -> bool:
    try:
        return await get_es().ping()
    except Exception:
        return False


async def close() -> None:
    global _client
    if _client is not None:
        await _client.close()
        _client = None
