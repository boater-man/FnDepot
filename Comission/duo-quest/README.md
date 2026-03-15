# CoMission

> **版本**: 1.3.1  
> **描述**: 双人任务协作应用 - 让协作更有趣  
> **Docker 镜像**: [ghcr.io/boater-man/comission](https://github.com/boater-man/comission/pkgs/container/comission) ✅

CoMission 是一款专为双人协作设计的任务管理应用，通过积分激励和实时通信，让两人之间的任务协作更加高效有趣。

---

## 📦 Docker 镜像

### 拉取镜像

```bash
# 拉取最新版本
docker pull ghcr.io/boater-man/comission:latest

# 拉取指定版本
docker pull ghcr.io/boater-man/comission:1.3.1
```

### 运行镜像

```bash
docker run -d \
  -p 3000:3000 \
  -v ./data:/app/data \
  -v ./uploads:/app/uploads \
  -e NODE_ENV=production \
  --name comission \
  ghcr.io/boater-man/comission:latest
```

### 推送镜像到 GitHub Packages

**方式一：使用脚本（推荐）**

```bash
# 1. 创建 GitHub Personal Access Token
# 访问：https://github.com/settings/tokens
# 勾选权限：write:packages, read:packages, delete:packages

# 2. 运行推送脚本
cd /home/wutuotuo/桌面/PartGame/duo-quest
./scripts/push-docker.sh
```

**方式二：手动推送**

```bash
# 1. 登录 GitHub Container Registry
export CR_PAT=YOUR_TOKEN
echo $CR_PAT | docker login ghcr.io -u USERNAME --password-stdin

# 2. 构建镜像
docker build -t ghcr.io/boater-man/comission:1.3.1 .

# 3. 推送镜像
docker push ghcr.io/boater-man/comission:1.3.1
docker push ghcr.io/boater-man/comission:latest
```

### 自动构建和推送

项目配置了 GitHub Actions，当有以下操作时会自动构建并推送镜像：

- 推送到 `main` 或 `master` 分支
- 创建版本标签（如 `v1.3.1`）
- 手动触发 workflow

详见：`.github/workflows/docker-publish.yml`

---

## ✨ 核心功能

### 🎯 任务系统
- **任务分类**: 学习 📚 / 工作 💼 / 生活 🏠
- **积分奖励**: 1-100 积分可配置
- **任务流程**: 发布 → 接受 → 完成 → 审核 → 批准
- **实时同步**: 任务状态变更即时通知

### 🛒 积分商城
- **商品管理**: 创建/编辑/删除商品
- **兑换流程**: 确认弹窗 → 自动下架 → 订单生成
- **订单管理**: 我买到的 / 我卖出的
- **物流跟踪**: 待发货 → 已发货 → 已收货

### 👥 组队系统
- **配对码**: 6 位字母数字组合
- **实时状态**: 队友在线/离线显示
- **积分清零**: 退出组队时双方积分重置

### 🔔 通知中心
- **待发货通知**: 商品被兑换后提醒卖家
- **任务审核**: 任务完成后提醒发布者
- **确认收货**: 卖家发货后提醒买家
- **跳转处理**: 点击通知直达对应页面

### 📊 积分记录
- **收支明细**: 获得/消费完整记录
- **统计卡片**: 累计获得 / 累计消费
- **筛选查看**: 全部/获得/消费三标签

---

## 🏗️ 技术架构

```
┌─────────────────────────────────────────────────────────────┐
│                        用户浏览器                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐         │
│  │   React 18  │  │ TypeScript  │  │ Tailwind CSS│         │
│  └─────────────┘  └─────────────┘  └─────────────┘         │
│                          + Socket.IO Client                  │
└─────────────────────────────────────────────────────────────┘
                              ↕ WebSocket/HTTP
┌─────────────────────────────────────────────────────────────┐
│                     Docker 容器 (端口 3000)                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Express Server + Socket.IO Server                   │   │
│  │  - RESTful API                                       │   │
│  │  - 实时事件广播                                      │   │
│  │  - 团队房间管理                                      │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  SQLite Database (持久化存储)                         │   │
│  │  - users / teams / tasks                            │   │
│  │  - products / redemptions / transactions            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 技术栈详情

| 层级 | 技术 | 版本 |
|------|------|------|
| **前端框架** | React | 18.3.1 |
| **开发语言** | TypeScript | 5.6.2 |
| **构建工具** | Vite | 6.0.1 |
| **样式框架** | Tailwind CSS | 3.4.16 |
| **UI 组件** | Radix UI | latest |
| **后端框架** | Express | 4.18.2 |
| **实时通信** | Socket.IO | 4.7.4 |
| **数据库** | better-sqlite3 | 9.4.3 |
| **容器化** | Docker | 27.5.1 |

---

## 📁 项目结构

```
comission/
├── src/                        # 前端源码目录
│   ├── components/             # 可复用组件
│   │   └── Notifications.tsx   # 通知中心组件
│   ├── pages/                  # 页面组件
│   │   ├── Dashboard.tsx       # 首页
│   │   ├── Tasks.tsx           # 任务大厅
│   │   ├── Store.tsx           # 积分商城
│   │   ├── Profile.tsx         # 个人中心
│   │   ├── Orders.tsx          # 订单管理
│   │   └── Transactions.tsx    # 积分记录
│   ├── context/                # React Context
│   │   └── AppContext.tsx      # 全局状态管理
│   ├── services/               # API 服务
│   │   └── api.ts              # 后端 API 调用
│   ├── types/                  # TypeScript 类型定义
│   │   └── index.ts
│   ├── App.tsx                 # 应用入口组件
│   └── main.tsx                # React 渲染入口
├── server/                     # 后端源码目录
│   ├── index.js                # Express + Socket.IO 主服务
│   ├── package.json            # 后端依赖配置
│   └── .npmrc                  # npm 配置
├── public/                     # 静态资源目录
├── Dockerfile                  # Docker 多阶段构建配置
├── docker-compose.yml          # Docker Compose 编排配置
├── package.json                # 前端依赖配置
├── tsconfig.json               # TypeScript 配置
├── tailwind.config.js          # Tailwind CSS 配置
├── vite.config.ts              # Vite 构建配置
└── README.md                   # 项目说明文档
```

---

## 🚀 快速开始

### 环境要求

- Docker 27.5+
- Docker Compose 2.37+

### 部署步骤

```bash
# 1. 进入项目目录
cd /home/wutuotuo/桌面/PartGame/duo-quest

# 2. 构建并启动容器
docker compose up -d

# 3. 查看运行状态
docker compose ps

# 4. 查看实时日志
docker compose logs -f duoquest
```

### 访问应用

打开浏览器访问：**http://localhost:3000**

---

## 📖 使用指南

### 1. 创建账号
- 输入用户名，点击"开始使用"
- 系统自动创建用户账号

### 2. 组队协作
- **创建组队**: 点击"创建组队"生成 6 位配对码
- **加入组队**: 输入队友提供的配对码，点击"加入组队"

### 3. 发布任务
1. 进入"任务"页面
2. 点击"+ 发布任务"
3. 填写任务信息（标题/描述/类型/积分）
4. 点击"发布任务"

### 4. 完成任务
1. 在任务列表找到可接受的任务
2. 点击"接受任务"
3. 完成后点击"完成任务"并上传凭证
4. 等待发布者审核

### 5. 审核任务
1. 收到任务审核通知
2. 查看任务完成凭证
3. 点击"批准"发放积分 或 "驳回"要求重做

### 6. 积分商城
1. 进入"商城"页面
2. 点击"+ 添加商品"创建商品
3. 队友浏览商品并点击"兑换"
4. 卖家在"订单管理"发货
5. 买家确认收货完成交易

---

## 🔧 管理命令

```bash
# 查看容器状态
docker compose ps

# 查看服务日志
docker compose logs duoquest

# 实时查看日志
docker compose logs -f duoquest

# 重启服务
docker compose restart

# 停止服务
docker compose down

# 重新构建
docker compose build

# 清理并重新部署
docker compose down && docker compose build && docker compose up -d
```

---

## 📝 版本历史

### v1.3.1 (当前版本)
- ✅ 优化通知系统，已完成事项不再通知
- ✅ 修复编辑弹窗保留问题
- ✅ 任务大厅默认显示"待接受"
- ✅ 商城默认显示可兑换商品
- ✅ 删除冗余 UI 元素

### v1.3.0
- ✅ 新增通知中心组件
- ✅ 新增订单管理独立页面
- ✅ 新增积分记录独立页面
- ✅ 商品兑换确认弹窗
- ✅ 卖家兑换通知

### v1.2.0
- ✅ Socket.IO 实时更新
- ✅ 3 秒轮询兜底机制
- ✅ 团队房间广播

### v1.1.0
- ✅ 积分商城功能
- ✅ 订单管理功能
- ✅ 退出组队通知

### v1.0.0
- ✅ 初始版本发布
- ✅ 任务系统基础功能
- ✅ 组队系统

---

## 📄 数据模型

### 用户 (users)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 用户唯一标识 |
| username | TEXT | 用户名 |
| points | INTEGER | 当前积分 |
| team_id | TEXT | 所属团队 ID |

### 任务 (tasks)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 任务唯一标识 |
| title | TEXT | 任务标题 |
| type | TEXT | 任务类型 (study/work/life) |
| reward_points | INTEGER | 奖励积分 |
| status | TEXT | 状态 (open/accepted/pending_review/completed/rejected) |

### 商品 (products)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 商品唯一标识 |
| name | TEXT | 商品名称 |
| price | INTEGER | 积分价格 |
| creator_id | TEXT | 创建者 ID |

### 订单 (redemptions)
| 字段 | 类型 | 说明 |
|------|------|------|
| id | TEXT | 订单唯一标识 |
| product_id | TEXT | 商品 ID |
| buyer_id | TEXT | 买家 ID |
| seller_id | TEXT | 卖家 ID |
| status | TEXT | 状态 (pending_shipment/shipped/received) |

---

## ⚠️ 注意事项

1. **退出组队**: 将清空双方所有积分，请谨慎操作
2. **商品兑换**: 兑换后商品自动下架，无法再次兑换
3. **任务审核**: 只有任务发布者可以审核任务
4. **积分不足**: 无法兑换超过当前积分的商品

---

## 📞 技术支持

- **项目位置**: `/home/wutuotuo/桌面/PartGame/duo-quest`
- **访问地址**: http://localhost:3000

---

*CoMission - 让协作更有趣*
