# CoMission 双人任务协作应用

> **版本**: 1.3.1  
> **大小**: 15KB (FPK 安装包)  
> **Docker 镜像**: 约 489MB（安装时自动拉取）

## 📦 安装方法

### 方式一：FPK 手动安装（推荐）

1. 下载 `comission.fpk` 文件（15KB）
2. 登录 FNOS 系统管理后台
3. 进入「应用管理」→「手动安装」
4. 上传 `comission.fpk` 文件
5. 等待 Docker 镜像自动拉取（约 489MB）
6. 安装完成后访问 http://localhost:3000

### 方式二：Docker 命令

```bash
docker run -d \
  --name comission \
  -p 3000:3000 \
  -v ./data:/app/data \
  -v ./uploads:/app/uploads \
  -e NODE_ENV=production \
  --restart unless-stopped \
  ghcr.io/boater-man/comission:latest
```

### 方式三：Docker Compose

创建 `docker-compose.yml`：

```yaml
version: '3.8'

services:
  comission:
    image: ghcr.io/boater-man/comission:latest
    container_name: comission
    ports:
      - "3000:3000"
    volumes:
      - ./data:/app/data
      - ./uploads:/app/uploads
    environment:
      - NODE_ENV=production
    restart: unless-stopped
```

运行：
```bash
docker compose up -d
```

## ✨ 功能特性

### 🎯 任务系统
- 任务分类：学习📚 / 工作💼 / 生活🏠
- 积分奖励：1-100 积分可配置
- 任务流程：发布→接受→完成→审核→批准
- 实时同步：任务状态变更即时通知

### 🛒 积分商城
- 商品管理：创建/编辑/删除商品
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

1. **首次安装**: 需要拉取 Docker 镜像（约 489MB），可能需要 10-30 秒
2. **端口占用**: 确保 3000 端口未被占用
3. **退出组队**: 将清空双方所有积分
4. **商品兑换**: 兑换后自动下架

## 🔧 管理命令

```bash
# 查看运行状态
docker ps | grep comission

# 查看日志
docker logs -f comission

# 重启应用
docker restart comission

# 停止应用
docker stop comission

# 启动应用
docker start comission

# 删除应用
docker rm comission
```

## 🔗 相关链接

- **GitHub**: https://github.com/boater-man/comission
- **Docker**: https://github.com/boater-man/comission/pkgs/container/comission
- **Issues**: https://github.com/boater-man/comission/issues
- **FnDepot**: https://github.com/boater-man/FnDepot

---

*CoMission - 让协作更有趣*
