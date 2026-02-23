#!/bin/sh
# 微信公众号编辑器停止脚本

# 停止nginx服务
pkill -f "nginx: master process"
pkill -f "nginx: worker process"