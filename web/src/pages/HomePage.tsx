import { useEffect, useState } from 'react'
import { Alert, Badge, Button, Card, Descriptions, Space, Spin } from 'antd'
import client from '@/api/client'

interface HealthData {
  healthy: boolean
  checks: Record<string, boolean>
}

interface HelloData {
  app: string
  message: string
}

// 阶段0验证页：调用后端 hello / health，确认前后端与四存储连通
export default function HomePage() {
  const [hello, setHello] = useState<HelloData | null>(null)
  const [health, setHealth] = useState<HealthData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const check = async () => {
    setLoading(true)
    setError(null)
    try {
      const [h, hb] = await Promise.all([
        client.get<unknown, { data: HelloData }>('/hello'),
        client.get<unknown, { data: HealthData }>('/health'),
      ])
      setHello(h.data)
      setHealth(hb.data)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    check()
  }, [])

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card
        title="后端连通性"
        extra={
          <Button onClick={check} loading={loading}>
            重新检测
          </Button>
        }
      >
        {loading && <Spin />}
        {error && (
          <Alert
            type="error"
            message="无法连接后端"
            description={error}
            showIcon
          />
        )}
        {hello && (
          <Alert
            type="success"
            message={`${hello.app}: ${hello.message}`}
            showIcon
          />
        )}
      </Card>

      {health && (
        <Card title="存储健康检查">
          <Descriptions column={1} bordered size="small">
            {Object.entries(health.checks).map(([name, ok]) => (
              <Descriptions.Item key={name} label={name}>
                <Badge
                  status={ok ? 'success' : 'error'}
                  text={ok ? '已连接' : '未就绪'}
                />
              </Descriptions.Item>
            ))}
          </Descriptions>
        </Card>
      )}
    </Space>
  )
}
