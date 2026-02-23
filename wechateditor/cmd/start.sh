#!/bin/sh
# 微信公众号编辑器启动脚本

# 设置应用目录
APP_DIR="/app"
DATA_DIR="/data"

# 创建必要目录
mkdir -p $DATA_DIR

# 启动nginx服务
/usr/sbin/nginx -c $APP_DIR/nginx.conf

# 保持容器运行
while true; do
  sleep 100
done