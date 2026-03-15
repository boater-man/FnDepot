# CoMission 双人任务协作应用

> **版本**: 1.3.1  
> **类型**: Docker 应用  
> **大小**: 14KB (配置包)

## 📦 安装方法

### 方式一：FPK 安装（推荐）

1. 下载 `comission.fpk`（仅 14KB）
2. 在 FNOS 应用管理中选择"手动安装"
3. 上传 FPK 文件
4. 系统自动拉取 Docker 镜像（约 489MB）

### 方式二：Docker 命令

```bash
docker run -d \
  -p 3000:3000 \
  -v ./data:/app/data \
  -v ./uploads:/app/uploads \
  -e NODE_ENV=production \
  --name comission \
  ghcr.io/boater-man/comission:latest
```

### 方式三：Docker Compose

```yaml
version: '3.8'

services:
  comission:
    image: ghcr.io/boater-man/comission:latest
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

## ✨ 功能特性

### 🎯 任务系统
- 任务分类：学习📚 / 工作💼 / 生活🏠
- 积分奖励：1-100 积分可配置
- 任务流程：发布→接受→完成→审核→批准
- 实时同步：任务状态变更即时通知

### 🛒 积分商城
- 商品管理：创建/编辑/删除
- 兑换流程：确认弹窗→自动下架→订单生成
- 订单管理：我买到的/我卖出的
- 物流跟踪：待发货→已发货→已收货

### 👥 组队系统
- 配对码：6 位字母数字组合
- 实时状态：队友在线/离线显示
- 积分清零：退出组队时重置

### 🔔 通知中心
- 待发货通知
- 任务审核通知
- 确认收货通知
- 点击跳转处理

## 🔋 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | React 18 + TypeScript + Vite |
| UI | Tailwind CSS + Radix UI |
| 后端 | Node.js + Express |
| 实时 | Socket.IO |
| 数据库 | SQLite |
| 容器 | Docker |

## 📝 版本历史

### v1.3.1 - 当前版本
- ✅ 优化通知系统
- ✅ 修复编辑弹窗问题
- ✅ 任务大厅默认"待接受"
- ✅ 商城默认显示可兑换商品

### v1.3.0
- ✅ 新增通知中心
- ✅ 订单管理独立页面
- ✅ 积分记录独立页面

### v1.0.0
- ✅ 初始版本发布

## ⚠️ 注意事项

1. **首次启动**: 需要拉取 Docker 镜像（约 489MB），可能需要 10-30 秒
2. **退出组队**: 将清空双方所有积分
3. **商品兑换**: 兑换后自动下架
4. **网络要求**: 需要能访问 GitHub Container Registry

## 🔗 相关链接

- **GitHub**: https://github.com/boater-man/comission
- **Docker**: https://github.com/boater-man/comission/pkgs/container/comission
- **Issues**: https://github.com/boater-man/comission/issues
- **FnDepot**: https://github.com/boater-man/FnDepot

---

*CoMission - 让协作更有趣*
