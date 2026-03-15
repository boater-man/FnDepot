# GitHub Packages 部署指南

本指南说明如何将 CoMission 的 Docker 镜像推送到 GitHub Container Registry (GHCR)。

---

## 📋 前置准备

### 1. 创建 GitHub Personal Access Token

1. 访问 [GitHub Token 设置页面](https://github.com/settings/tokens)
2. 点击 "Generate new token (classic)"
3. 填写 Token 说明（如：Docker Registry）
4. 勾选以下权限：
   - ✅ `write:packages` - 推送 Docker 镜像
   - ✅ `read:packages` - 拉取 Docker 镜像
   - ✅ `delete:packages` - 删除镜像（可选）
5. 点击 "Generate token"
6. **重要**：复制并保存 Token，关闭页面后无法再次查看

### 2. 配置 Git 仓库

```bash
# 初始化 Git 仓库（如果还没有）
cd /home/wutuotuo/桌面/PartGame/duo-quest
git init

# 添加远程仓库（替换为你的仓库地址）
git remote add origin https://github.com/boater-man/comission.git

# 提交代码
git add .
git commit -m "Initial commit: CoMission v1.3.1"
git branch -M main
git push -u origin main
```

---

## 🚀 推送方式

### 方式一：使用推送脚本（推荐）

```bash
# 1. 进入项目目录
cd /home/wutuotuo/桌面/PartGame/duo-quest

# 2. 运行推送脚本
./scripts/push-docker.sh

# 3. 按提示输入 GitHub Personal Access Token
```

脚本会自动：
- 登录 GitHub Container Registry
- 构建 Docker 镜像（版本：1.3.1, git-sha, latest）
- 推送到 GHCR

### 方式二：手动推送

```bash
# 1. 登录 GHCR
# 将 YOUR_TOKEN 替换为你的 Personal Access Token
export CR_PAT=YOUR_TOKEN
echo $CR_PAT | docker login ghcr.io -u boater-man --password-stdin

# 2. 构建镜像
docker build -t ghcr.io/boater-man/comission:1.3.1 \
             -t ghcr.io/boater-man/comission:latest \
             -f Dockerfile \
             .

# 3. 推送镜像
docker push ghcr.io/boater-man/comission:1.3.1
docker push ghcr.io/boater-man/comission:latest
```

### 方式三：GitHub Actions 自动推送

配置已完成，触发条件：

| 触发事件 | 推送标签 |
|---------|---------|
| Push to `main` | `latest`, `main`, `<sha>` |
| Push to `master` | `master`, `<sha>` |
| Tag `v1.3.1` | `1.3.1`, `1.3`, `1` |
| Pull Request | `pr-<number>` |
| Workflow Dispatch | 手动触发 |

**手动触发步骤**：

1. 访问 GitHub 仓库 Actions 页面
2. 选择 "Build and Push Docker Image" workflow
3. 点击 "Run workflow"
4. 选择分支/标签
5. 点击 "Run workflow"

---

## 📥 拉取和使用镜像

### 从 GHCR 拉取

```bash
# 拉取最新版本
docker pull ghcr.io/boater-man/comission:latest

# 拉取指定版本
docker pull ghcr.io/boater-man/comission:1.3.1
```

### 使用 Docker Compose

创建 `docker-compose.yml`：

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
      - PORT=3000
    restart: unless-stopped
```

运行：

```bash
docker compose up -d
```

### 直接运行

```bash
docker run -d \
  -p 3000:3000 \
  -v ./data:/app/data \
  -v ./uploads:/app/uploads \
  -e NODE_ENV=production \
  --name comission \
  ghcr.io/boater-man/comission:latest
```

---

## 🔐 认证说明

### 私有镜像

如果镜像是私有的，拉取时需要认证：

**方式 1：使用 Docker 登录**

```bash
docker login ghcr.io -u boater-man
# 输入 Personal Access Token
```

**方式 2：在 docker-compose.yml 中配置**

```yaml
services:
  comission:
    image: ghcr.io/boater-man/comission:latest
    # ...
```

创建 `.docker/config.json`：

```json
{
  "auths": {
    "ghcr.io": {
      "auth": "base64_encoded_credentials"
    }
  }
}
```

---

## 📊 查看镜像

访问 GitHub Packages 页面查看已推送的镜像：

https://github.com/boater-man/comission/pkgs/container/comission

---

## ⚠️ 常见问题

### 1. 推送失败：权限不足

**错误信息**：
```
denied: requested access to the resource is denied
```

**解决方案**：
- 确认 Personal Access Token 有 `write:packages` 权限
- 确认 GitHub 用户名与镜像路径匹配

### 2. 拉取失败：未授权

**错误信息**：
```
pull access denied, repository does not exist or may require authorization
```

**解决方案**：
```bash
docker login ghcr.io -u boater-man
# 输入 Personal Access Token
```

### 3. 镜像名称错误

**错误信息**：
```
invalid reference format
```

**解决方案**：
- 确保镜像名称格式正确：`ghcr.io/OWNER/REPO:TAG`
- 所有字母小写

---

## 📝 版本管理

### 语义化版本

| 标签格式 | 示例 | 说明 |
|---------|------|------|
| `{{version}}` | `1.3.1` | 完整版本号 |
| `{{major}}.{{minor}}` | `1.3` | 主版本。次版本 |
| `{{major}}` | `1` | 主版本 |
| `latest` | `latest` | 最新版本（main 分支） |
| `{{sha}}` | `a1b2c3d` | Git 提交 SHA |

### 发布新版本

```bash
# 1. 更新版本号（package.json, README.md）
# 2. 提交更改
git add .
git commit -m "Release v1.3.1"

# 3. 创建标签
git tag v1.3.1

# 4. 推送代码和标签
git push origin main
git push origin v1.3.1

# 5. GitHub Actions 会自动构建并推送镜像
```

---

*最后更新：2026-03-15*
