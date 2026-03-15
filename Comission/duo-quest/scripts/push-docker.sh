#!/bin/bash

# CoMission Docker 镜像推送脚本
# 用于将 Docker 镜像推送到 GitHub Container Registry (GHCR)

set -e

# 配置变量
REGISTRY="ghcr.io"
REPO_OWNER="boater-man"  # 替换为你的 GitHub 用户名
REPO_NAME="comission"    # 替换为你的仓库名
IMAGE_NAME="${REGISTRY}/${REPO_OWNER}/${REPO_NAME}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  CoMission Docker 镜像推送脚本${NC}"
echo -e "${GREEN}========================================${NC}"

# 检查是否登录 GitHub
if ! docker info 2>/dev/null | grep -q "Username"; then
    echo -e "${YELLOW}请先登录 GitHub Container Registry...${NC}"
    echo "请输入 GitHub Personal Access Token (PAT):"
    read -s GH_TOKEN
    echo ""
    
    if [ -z "$GH_TOKEN" ]; then
        echo -e "${RED}错误：Token 不能为空${NC}"
        exit 1
    fi
    
    echo "${GH_TOKEN}" | docker login ${REGISTRY} -u ${REPO_OWNER} --password-stdin
fi

# 获取版本号
VERSION="1.3.1"
echo -e "${YELLOW}当前版本：${VERSION}${NC}"

# 获取 Git SHA
GIT_SHA=$(git rev-parse --short HEAD 2>/dev/null || echo "local")
echo -e "${YELLOW}Git SHA: ${GIT_SHA}${NC}"

# 构建镜像
echo -e "${GREEN}开始构建 Docker 镜像...${NC}"
docker build -t ${IMAGE_NAME}:${VERSION} \
             -t ${IMAGE_NAME}:${GIT_SHA} \
             -t ${IMAGE_NAME}:latest \
             -f Dockerfile \
             .

# 推送镜像
echo -e "${GREEN}开始推送 Docker 镜像到 GitHub Packages...${NC}"
echo "镜像地址:"
echo "  - ${IMAGE_NAME}:${VERSION}"
echo "  - ${IMAGE_NAME}:${GIT_SHA}"
echo "  - ${IMAGE_NAME}:latest"

docker push ${IMAGE_NAME}:${VERSION}
docker push ${IMAGE_NAME}:${GIT_SHA}
docker push ${IMAGE_NAME}:latest

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  推送完成！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "镜像已推送到:"
echo "  https://github.com/${REPO_OWNER}/${REPO_NAME}/pkgs/container/${REPO_NAME}"
echo ""
echo "使用方式:"
echo "  docker pull ${IMAGE_NAME}:latest"
echo "  docker pull ${IMAGE_NAME}:${VERSION}"
echo ""
