# Comet (彗记) — 个人 AI 知识库与记忆助手 / Personal AI Knowledge & Memory Assistant

个人 AI 知识库 + 记忆助手。多用户、前后端分离、Docker 一键部署。

核心能力（一阶段全量交付）：

- 知识库 RAG：文档/网页/图片入库，ES 向量 + BM25 + Rerank 混合检索，带引用溯源
- 记忆系统：从对话异步萃取三元组入 Neo4j，画像类 + 事件类两类，社区聚类，不遗忘
- 智能问答：检索做成 LangChain Agent 工具，LLM 自主编排（强模型 function calling + 弱模型降级），SSE 流式
- 知识图谱可视化、全局搜索、模型配置、每日回顾

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 + TypeScript + Ant Design 5 + Vite（AntV X6/D3 + ECharts，Zustand） |
| 后端 | FastAPI |
| 业务库 | PostgreSQL + SQLAlchemy |
| 向量/全文 | Elasticsearch 8+ |
| 记忆图谱 | Neo4j 5+ |
| 异步/缓存 | Celery + Redis |
| 部署 | Docker Compose |

## 目录结构

```
Comet/
├── api/                # 后端 FastAPI（分层：controllers/services/repositories）
├── web/                # 前端 React + TS + AntD
├── docker-compose.yml  # PG / ES / Neo4j / Redis + api / worker / beat / web
├── .env.example        # 根环境变量模板
├── files/              # 需求文档与学习笔记
└── MemoryBear/         # 参考的开源项目（只读，不提交）
```

## 快速开始

### 方式一：Docker Compose 一键起（推荐）

```bash
copy .env.example .env          # 按需修改密钥
docker compose up -d --build
```

- 前端：http://localhost:5173
- 后端：http://localhost:8000/api/hello
- 健康检查：http://localhost:8000/api/health
- Neo4j 浏览器：http://localhost:7474

### 方式二：本地开发

后端：
```bash
cd api
uv sync
copy .env.example .env
uv run python run.py
```

前端：
```bash
cd web
npm install
npm run dev
```

需先用 docker compose 起好 PostgreSQL / ES / Neo4j / Redis 四个存储。

## 开发进度

- [x] 阶段 0 · 基础设施脚手架（骨架 + 四存储 + hello/health 验证）
- [ ] 阶段 1 · 账号体系
- [ ] 阶段 2 · 模型配置
- [ ] 阶段 3 · 知识库 RAG
- [ ] 阶段 4 · 记忆系统
- [ ] 阶段 5 · 智能问答（核心）
- [ ] 阶段 6 · 搜索与导航
- [ ] 阶段 7 · 社区聚类
- [ ] 阶段 8 · 可视化与统计
- [ ] 阶段 9 · 整合打磨

详见 `files/0需求文档/`。
