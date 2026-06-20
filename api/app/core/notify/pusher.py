"""推送适配：把 (title, content) 按渠道类型组装 payload 并 POST 到目标 URL。

各渠道都是「POST 一个 JSON 到一个 URL」，无服务端鉴权，用户自配 key/url。
单次推送独立 try/except，失败返回 (False, 错误信息) 由上层记 warning 降级，不抛出。
"""
import re

import httpx

from app.core.logging import get_logger
from app.models.notify_channel_model import (
    CHANNEL_DINGTALK,
    CHANNEL_SERVERCHAN,
    CHANNEL_WEBHOOK,
    CHANNEL_WECOM,
)

logger = get_logger(__name__)

_TIMEOUT = 10.0

# Server酱³ 的 SendKey 形如 sctp<uid>t<token>，推送域用其中的数字 uid
_SCT3_RE = re.compile(r"^sctp(\d+)t", re.IGNORECASE)


def _serverchan_url(target: str) -> str:
    """按 SendKey 形态选推送地址：

    - Server酱³（sctp<uid>t...）：https://<uid>.push.ft07.com/send/<key>.send
    - Turbo 版（SCT... 等）：https://sctapi.ftqq.com/<key>.send
    """
    key = target.strip()
    m = _SCT3_RE.match(key)
    if m:
        uid = m.group(1)
        return f"https://{uid}.push.ft07.com/send/{key}.send"
    return f"https://sctapi.ftqq.com/{key}.send"


async def push(channel_type: str, target: str, title: str, content: str) -> tuple[bool, str]:
    """按渠道推送一条消息。返回 (是否成功, 失败原因)。"""
    target = (target or "").strip()
    if not target:
        return False, "渠道未配置"
    try:
        async with httpx.AsyncClient(timeout=_TIMEOUT) as client:
            if channel_type == CHANNEL_SERVERCHAN:
                resp = await client.post(
                    _serverchan_url(target),
                    data={"title": title[:100], "desp": content},
                )
            elif channel_type == CHANNEL_WECOM:
                # 企业微信群机器人：markdown 消息
                resp = await client.post(
                    target,
                    json={
                        "msgtype": "markdown",
                        "markdown": {"content": f"### {title}\n{content}"},
                    },
                )
            elif channel_type == CHANNEL_DINGTALK:
                # 钉钉群机器人：markdown 消息
                resp = await client.post(
                    target,
                    json={
                        "msgtype": "markdown",
                        "markdown": {"title": title[:60], "text": f"### {title}\n\n{content}"},
                    },
                )
            elif channel_type == CHANNEL_WEBHOOK:
                # 通用 webhook：POST 结构化 JSON，由用户侧自行解析
                resp = await client.post(target, json={"title": title, "content": content})
            else:
                return False, f"未知渠道类型：{channel_type}"
        resp.raise_for_status()
        return True, ""
    except httpx.HTTPStatusError as e:
        msg = f"HTTP {e.response.status_code}"
        logger.warning("推送失败: type=%s err=%s", channel_type, msg)
        return False, msg
    except Exception as e:  # noqa: BLE001
        logger.warning("推送失败: type=%s err=%s", channel_type, e)
        return False, str(e)
