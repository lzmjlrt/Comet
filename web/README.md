# Comet 前端（web/）

彗记 Comet 的 Web 前端：React 18 + TypeScript + Ant Design 5 + Vite。

## 技术栈

- React 18 + TypeScript
- Ant Design 5（UI）
- React Router 7（路由）
- Zustand（状态）
- Axios（请求，`/api` 代理到后端 8000）
- 后续：AntV X6 / D3 + ECharts（知识图谱与统计图）

## 本地开发

```bash
npm install
npm run dev      # http://localhost:5173
```

开发服务器已配置把 `/api` 代理到 `http://localhost:8000`，需先起好后端。

## 目录结构

```
web/src/
├── api/        # 请求封装
├── layouts/    # 布局
├── pages/      # 页面
├── App.tsx     # 路由
└── main.tsx    # 入口
```

## 验证点（阶段0）

打开首页会自动调用后端 `/api/hello` 与 `/api/health`，
展示欢迎信息与四存储（PostgreSQL/ES/Neo4j/Redis）连通状态。
