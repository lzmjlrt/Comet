"""时间工具：返回当前日期时间（零外部依赖，验证工具系统的示例内置工具）。"""
from datetime import datetime

from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field

from app.core.agent.tools.base import ToolBuildContext, ToolSpec, register_tool

KEY = "datetime"

_WEEKDAYS = ["星期一", "星期二", "星期三", "星期四", "星期五", "星期六", "星期日"]


class _EmptyInput(BaseModel):
    query: str = Field(default="", description="无需参数，可留空")


async def _build(_ctx: ToolBuildContext) -> StructuredTool:
    async def _run(query: str = "") -> str:
        now = datetime.now()
        weekday = _WEEKDAYS[now.weekday()]
        return f"当前时间：{now.strftime('%Y-%m-%d %H:%M:%S')}（{weekday}）"

    return StructuredTool.from_function(
        coroutine=_run,
        name=KEY,
        description="获取当前的日期、时间和星期。当问题涉及'现在几点''今天几号''今天星期几'等当前时间时使用。",
        args_schema=_EmptyInput,
    )


register_tool(
    ToolSpec(
        key=KEY,
        name="时间",
        description="获取当前日期、时间、星期。",
        icon="🕐",
        builder=_build,
        default_enabled=True,
    )
)
