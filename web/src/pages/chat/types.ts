import type { Citation, ToolCall } from '@/api/chat'

// 前端消息模型（含流式中的临时状态）
export interface UiMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: Citation[]
  toolCalls?: ToolCall[]
  images?: string[] // 图片 url（用户消息）
  streaming?: boolean
  conversationId?: string // 所属会话（收藏深链用）
  favId?: string | null // 已收藏时的收藏记录 id（高亮+取消用）
  feedback?: 'up' | 'down' | null // 当前用户对该 AI 消息的反馈
}

export const TOOL_META: Record<string, { icon: string; label: string }> = {
  knowledge_search: { icon: '🔍', label: '知识库' },
  memory_search: { icon: '🧠', label: '记忆' },
  web_search: { icon: '🌐', label: '联网' },
}

// 解析工具调用标记的展示信息。
// 内置工具走 TOOL_META；MCP 工具名形如 `{server}__{tool}`，拆成「服务·工具」友好展示。
export function resolveToolMeta(toolName: string): { icon: string; label: string } {
  const builtin = TOOL_META[toolName]
  if (builtin) return builtin
  if (toolName.includes('__')) {
    const idx = toolName.indexOf('__')
    const server = toolName.slice(0, idx)
    const tool = toolName.slice(idx + 2)
    return { icon: '🧩', label: `MCP · ${server} / ${tool}` }
  }
  return { icon: '🛠️', label: toolName }
}
