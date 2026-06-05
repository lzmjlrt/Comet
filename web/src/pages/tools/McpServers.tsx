import { useEffect, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  Empty,
  Form,
  Input,
  List,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Tag,
  Tooltip,
  Typography,
  message,
} from 'antd'
import {
  ApiOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
  SyncOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons'
import {
  mcpApi,
  type McpAuthType,
  type McpServer,
  type McpServerInput,
  type McpTransport,
} from '@/api/mcp'

const { Text, Paragraph } = Typography

const STATUS_BADGE: Record<string, { status: 'success' | 'error' | 'default'; text: string }> = {
  ok: { status: 'success', text: '正常' },
  error: { status: 'error', text: '异常' },
  unknown: { status: 'default', text: '未测试' },
}

interface FormValues {
  name: string
  transport: McpTransport
  url: string
  auth_type: McpAuthType
  token?: string
  header?: string
  key?: string
}

export default function McpServers() {
  const [servers, setServers] = useState<McpServer[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<McpServer | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [form] = Form.useForm<FormValues>()
  const authType = Form.useWatch('auth_type', form)

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await mcpApi.list()
      setServers(data)
    } catch (e) {
      message.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ transport: 'streamable_http', auth_type: 'none' })
    setModalOpen(true)
  }

  const openEdit = (s: McpServer) => {
    setEditing(s)
    form.resetFields()
    form.setFieldsValue({
      name: s.name,
      transport: s.transport,
      url: s.url,
      auth_type: s.auth_type,
    })
    setModalOpen(true)
  }

  const buildPayload = (v: FormValues): McpServerInput => {
    let auth_config: Record<string, string> | null = null
    if (v.auth_type === 'bearer' && v.token) auth_config = { token: v.token }
    if (v.auth_type === 'api_key' && v.key)
      auth_config = { header: v.header || 'X-API-Key', key: v.key }
    return {
      name: v.name,
      transport: v.transport,
      url: v.url,
      auth_type: v.auth_type,
      auth_config,
    }
  }

  const onSubmit = async () => {
    const v = await form.validateFields()
    const payload = buildPayload(v)
    try {
      if (editing) {
        await mcpApi.update(editing.id, payload)
        message.success('已保存')
      } else {
        await mcpApi.create(payload)
        message.success('已添加')
      }
      setModalOpen(false)
      load()
    } catch (e) {
      message.error((e as Error).message)
    }
  }

  const onTest = async (s: McpServer) => {
    setBusy(s.id)
    try {
      const { data } = await mcpApi.test(s.id)
      if (data.success) message.success(data.message)
      else message.error(data.message)
      load()
    } catch (e) {
      message.error((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const onSync = async (s: McpServer) => {
    setBusy(s.id)
    try {
      await mcpApi.sync(s.id)
      message.success('已同步工具清单')
      load()
    } catch (e) {
      message.error((e as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const onToggle = async (s: McpServer, enabled: boolean) => {
    try {
      await mcpApi.toggle(s.id, enabled)
      setServers((prev) =>
        prev.map((x) => (x.id === s.id ? { ...x, enabled } : x)),
      )
    } catch (e) {
      message.error((e as Error).message)
    }
  }

  const onDelete = async (s: McpServer) => {
    try {
      await mcpApi.remove(s.id)
      message.success('已删除')
      load()
    } catch (e) {
      message.error((e as Error).message)
    }
  }

  return (
    <Card
      title={
        <Space>
          <ApiOutlined />
          MCP 服务
        </Space>
      }
      loading={loading}
      extra={
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          添加服务
        </Button>
      }
    >
      <Paragraph type="secondary" style={{ marginTop: -8 }}>
        接入外部 MCP 服务（远程 SSE / Streamable HTTP），同步其工具后，启用的服务工具会自动加入对话 Agent 可调用范围。
      </Paragraph>
      {servers.length === 0 ? (
        <Empty description="暂无 MCP 服务" />
      ) : (
        <List
          itemLayout="vertical"
          dataSource={servers}
          renderItem={(s) => {
            const badge = STATUS_BADGE[s.status] || STATUS_BADGE.unknown
            return (
              <List.Item
                actions={[
                  <Button
                    key="test"
                    size="small"
                    icon={<ThunderboltOutlined />}
                    loading={busy === s.id}
                    onClick={() => onTest(s)}
                  >
                    测试连接
                  </Button>,
                  <Button
                    key="sync"
                    size="small"
                    icon={<SyncOutlined />}
                    loading={busy === s.id}
                    onClick={() => onSync(s)}
                  >
                    同步工具
                  </Button>,
                  <Button
                    key="edit"
                    size="small"
                    icon={<EditOutlined />}
                    onClick={() => openEdit(s)}
                  >
                    编辑
                  </Button>,
                  <Popconfirm
                    key="del"
                    title="确认删除该 MCP 服务？"
                    onConfirm={() => onDelete(s)}
                  >
                    <Button size="small" danger icon={<DeleteOutlined />}>
                      删除
                    </Button>
                  </Popconfirm>,
                  <Switch
                    key="sw"
                    checked={s.enabled}
                    onChange={(v) => onToggle(s, v)}
                    checkedChildren="启用"
                    unCheckedChildren="停用"
                  />,
                ]}
              >
                <List.Item.Meta
                  title={
                    <Space>
                      <Badge status={badge.status} text={s.name} />
                      <Tag>{s.transport === 'sse' ? 'SSE' : 'Streamable HTTP'}</Tag>
                      {s.auth_type !== 'none' && (
                        <Tag color="blue">
                          {s.auth_type === 'bearer' ? 'Bearer' : 'API Key'}
                        </Tag>
                      )}
                    </Space>
                  }
                  description={
                    <Space direction="vertical" size={2}>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        {s.url}
                      </Text>
                      {s.status === 'error' && s.last_error && (
                        <Text type="danger" style={{ fontSize: 12 }}>
                          {s.last_error}
                        </Text>
                      )}
                    </Space>
                  }
                />
                {s.tools_cache && s.tools_cache.length > 0 ? (
                  <Space size={[4, 4]} wrap>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      工具（{s.tools_cache.length}）：
                    </Text>
                    {s.tools_cache.map((t) => (
                      <Tooltip key={t.name} title={t.description}>
                        <Tag>{t.name}</Tag>
                      </Tooltip>
                    ))}
                  </Space>
                ) : (
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    尚未同步工具，点「同步工具」拉取清单。
                  </Text>
                )}
              </List.Item>
            )
          }}
        />
      )}

      <Modal
        title={editing ? '编辑 MCP 服务' : '添加 MCP 服务'}
        open={modalOpen}
        onOk={onSubmit}
        onCancel={() => setModalOpen(false)}
        destroyOnClose
        okText="保存"
        cancelText="取消"
      >
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item
            label="服务名称"
            name="name"
            rules={[{ required: true, message: '请输入服务名称' }]}
            extra="用于区分不同服务，会作为工具名前缀"
          >
            <Input placeholder="例如：github-mcp" />
          </Form.Item>
          <Form.Item label="传输类型" name="transport" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'streamable_http', label: 'Streamable HTTP' },
                { value: 'sse', label: 'SSE' },
              ]}
            />
          </Form.Item>
          <Form.Item
            label="服务地址 URL"
            name="url"
            rules={[{ required: true, message: '请输入服务地址' }]}
          >
            <Input placeholder="https://example.com/mcp" />
          </Form.Item>
          <Form.Item label="认证方式" name="auth_type" rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'none', label: '无' },
                { value: 'bearer', label: 'Bearer Token' },
                { value: 'api_key', label: 'API Key（自定义请求头）' },
              ]}
            />
          </Form.Item>
          {authType === 'bearer' && (
            <Form.Item
              label="Token"
              name="token"
              extra={editing ? '留空表示不修改' : undefined}
              rules={editing ? [] : [{ required: true, message: '请输入 Token' }]}
            >
              <Input.Password placeholder="Bearer Token" />
            </Form.Item>
          )}
          {authType === 'api_key' && (
            <>
              <Form.Item label="请求头名称" name="header" initialValue="X-API-Key">
                <Input placeholder="X-API-Key" />
              </Form.Item>
              <Form.Item
                label="Key"
                name="key"
                extra={editing ? '留空表示不修改' : undefined}
                rules={editing ? [] : [{ required: true, message: '请输入 Key' }]}
              >
                <Input.Password placeholder="API Key" />
              </Form.Item>
            </>
          )}
        </Form>
      </Modal>
    </Card>
  )
}
