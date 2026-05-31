import { Button, Space, Tag, Tooltip, message as antdMessage } from 'antd'
import { CopyOutlined } from '@ant-design/icons'
import MarkdownMessage from '@/components/MarkdownMessage'
import type { UiMessage } from './types'
import { TOOL_META } from './types'

export default function MessageItem({ msg }: { msg: UiMessage }) {
  const isUser = msg.role === 'user'

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(msg.content)
      antdMessage.success('已复制 Markdown 原文')
    } catch {
      antdMessage.error('复制失败')
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        justifyContent: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 24,
      }}
    >
      <div style={{ maxWidth: '82%' }}>
        {/* 工具调用标记（AI 消息） */}
        {!isUser && msg.toolCalls && msg.toolCalls.length > 0 && (
          <Space size={[4, 4]} wrap style={{ marginBottom: 8 }}>
            {msg.toolCalls.map((tc, i) => {
              const meta = TOOL_META[tc.tool] ?? { icon: '🛠️', label: tc.tool }
              return (
                <Tooltip key={i} title={tc.query}>
                  <Tag color="blue" style={{ borderRadius: 12, fontSize: 13, padding: '2px 10px' }}>
                    {meta.icon} {meta.label}
                  </Tag>
                </Tooltip>
              )
            })}
          </Space>
        )}

        <div
          style={{
            background: isUser ? '#155EEF' : '#F7F8FA',
            color: isUser ? '#fff' : '#1D2129',
            padding: isUser ? '12px 16px' : '14px 18px',
            borderRadius: 14,
            fontSize: 16,
            lineHeight: 1.75,
          }}
        >
          {/* 用户消息图片 */}
          {isUser && msg.images && msg.images.length > 0 && (
            <Space wrap style={{ marginBottom: 8 }}>
              {msg.images.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt=""
                  style={{ maxWidth: 160, maxHeight: 160, borderRadius: 8 }}
                />
              ))}
            </Space>
          )}

          {isUser ? (
            <span style={{ whiteSpace: 'pre-wrap', fontSize: 16 }}>{msg.content}</span>
          ) : (
            <MarkdownMessage content={msg.content || (msg.streaming ? '思考中…' : '')} />
          )}
        </div>

        {/* 引用来源 + 复制按钮（AI 消息） */}
        {!isUser && (
          <div style={{ marginTop: 6 }}>
            {msg.citations && msg.citations.length > 0 && (
              <Space size={[4, 4]} wrap style={{ marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#667085' }}>引用：</span>
                {msg.citations.map((c, i) => (
                  <Tag key={i} color="default">
                    {c.source_type === 'image' ? '🖼️' : '📄'} {c.doc_name || c.source_id}
                  </Tag>
                ))}
              </Space>
            )}
            {!msg.streaming && msg.content && (
              <Button
                size="small"
                type="text"
                icon={<CopyOutlined />}
                onClick={onCopy}
                style={{ color: '#667085', fontSize: 12 }}
              >
                复制
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
