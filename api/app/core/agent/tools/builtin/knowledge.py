"""知识库检索工具：检索文档/图片片段并收集引用。"""
from langchain_core.tools import StructuredTool
from pydantic import BaseModel, Field

from app.core.agent.tools.base import ToolBuildContext, ToolSpec, register_tool

KEY = "knowledge_search"


class _QueryInput(BaseModel):
    query: str = Field(..., description="检索的问题或关键词")


async def _build(ctx: ToolBuildContext) -> StructuredTool:
    session = ctx.session
    user_id = ctx.user_id
    citations = ctx.citations

    async def _run(query: str) -> str:
        from app.core.rag.search import hybrid_search

        hits = await hybrid_search(session, user_id, query, top_k=5)
        if not hits:
            return "知识库中没有检索到相关内容。"
        seen = {c["source_id"] for c in citations}
        parts: list[str] = []
        for h in hits:
            parts.append(h["content"])
            sid = h.get("source_id")
            if sid and sid not in seen:
                seen.add(sid)
                citations.append({
                    "source_id": sid,
                    "source_type": h.get("source_type"),
                    "doc_name": h.get("doc_name"),
                    "score": h.get("score"),
                })
        return "检索到以下知识库内容：\n\n" + "\n\n".join(parts)

    return StructuredTool.from_function(
        coroutine=_run,
        name=KEY,
        description="从用户的个人知识库（文档、图片）中检索相关内容。当问题涉及用户上传的资料、文档、笔记时使用。",
        args_schema=_QueryInput,
    )


register_tool(
    ToolSpec(
        key=KEY,
        name="知识库检索",
        description="从你的文档、图片知识库中检索相关内容并带引用来源。",
        icon="🔍",
        builder=_build,
        default_enabled=True,
    )
)
