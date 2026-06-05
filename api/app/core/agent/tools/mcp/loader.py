"""MCP 工具加载：基于官方 langchain-mcp-adapters 把外部 MCP server 工具转成 LangChain 工具。

- build_mcp_tools：问答时调用，读已启用 server → 加载其工具，工具名清洗+加 server 前缀+去重。
- fetch_tools_meta：test/sync 时调用，连单个 server 拉工具清单（原始 name/description）。
单个 server 失败降级跳过，不影响其余 server 与内置工具。

工具名约束：OpenAI function calling 要求工具名匹配 ^[a-zA-Z0-9_-]+$ 且不超过 64 字符，
故对 server 名与 MCP 原始工具名统一清洗（非法字符替换为 _），并去重。
"""
import re
import uuid

from langchain_core.tools import BaseTool
from langchain_mcp_adapters.tools import load_mcp_tools
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.agent.tools.mcp.connection import build_connection
from app.core.logging import get_logger
from app.models.mcp_server_model import MCPServer
from app.repositories.mcp_server_repository import MCPServerRepository

logger = get_logger(__name__)

_INVALID = re.compile(r"[^a-zA-Z0-9_-]")
_MAX_NAME_LEN = 64


def _sanitize(text: str) -> str:
    """清洗为合法工具名片段：非法字符→_，去首尾下划线；空则回退 'mcp'。"""
    cleaned = _INVALID.sub("_", text).strip("_")
    return cleaned or "mcp"


async def _load_raw_tools(server: MCPServer) -> list[BaseTool]:
    """连接单个 server 加载原始工具（不改名）。"""
    conn = build_connection(server)
    return await load_mcp_tools(None, connection=conn)


def _rename(tool: BaseTool, prefix: str, seen: set[str]) -> None:
    """把工具名清洗为合法名（{prefix}__{tool}），并在 seen 内去重。"""
    base = f"{prefix}__{_sanitize(tool.name)}"[:_MAX_NAME_LEN]
    name = base
    i = 1
    while name in seen:
        suffix = f"_{i}"
        name = base[: _MAX_NAME_LEN - len(suffix)] + suffix
        i += 1
    seen.add(name)
    tool.name = name


async def build_mcp_tools(
    session: AsyncSession, user_id: uuid.UUID
) -> list[BaseTool]:
    """构建该用户所有已启用 MCP server 的工具列表（名称清洗+去重）。"""
    servers = await MCPServerRepository(session).list_by_user(
        user_id, enabled_only=True
    )
    tools: list[BaseTool] = []
    seen: set[str] = set()
    for server in servers:
        try:
            raw = await _load_raw_tools(server)
        except Exception as e:
            logger.warning("加载 MCP 工具失败（跳过）: %s: %s", server.name, e)
            continue
        prefix = _sanitize(server.name)
        for t in raw:
            _rename(t, prefix, seen)
            tools.append(t)
    return tools


async def fetch_tools_meta(server: MCPServer) -> list[dict]:
    """连接 server 拉取工具清单元信息（原始名，用于测试连接 / 同步）。

    抛出异常由调用方捕获并记入 server.last_error。
    """
    tools = await _load_raw_tools(server)
    return [
        {"name": t.name, "description": (t.description or "")[:500]}
        for t in tools
    ]


__all__ = ["build_mcp_tools", "fetch_tools_meta"]
