import { Layout, Menu } from 'antd'
import {
  AppstoreOutlined,
  BookOutlined,
  CommentOutlined,
  DeploymentUnitOutlined,
  HddOutlined,
} from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

const { Sider, Content, Header } = Layout

// 导航骨架：菜单项随各阶段页面落地逐步启用
const menuItems = [
  { key: '/', icon: <AppstoreOutlined />, label: '仪表盘' },
  { key: '/chat', icon: <CommentOutlined />, label: '对话' },
  { key: '/knowledge', icon: <BookOutlined />, label: '知识库' },
  { key: '/memory', icon: <HddOutlined />, label: '记忆' },
  { key: '/graph', icon: <DeploymentUnitOutlined />, label: '知识图谱' },
]

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  return (
    <Layout style={{ height: '100vh' }}>
      <Sider theme="light" width={200}>
        <div
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            fontSize: 18,
          }}
        >
          彗记 Comet
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', paddingInline: 24 }}>
          个人 AI 知识库与记忆助手
        </Header>
        <Content style={{ padding: 24, overflow: 'auto' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
