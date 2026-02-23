# 微信 Markdown 编辑器 (wechat-editor)

专为微信公众号创作者打造的极致像素风 Markdown 编辑器，内置 Google Gemini AI 强大助手。

## 简介

本项目是 [Panda-995/wechat-editor](https://github.com/panda-995/wechat-editor) 的飞牛 NAS (FNOS) 适配版本。它允许你在私有云环境中运行一个高性能的微信排版工具。

## 功能特性

- **极致体验**：像素风 UI，简洁高效。
- **Markdown 支持**：实时预览，完美适配微信公众号样式。
- **AI 助手**：集成 Google Gemini AI，辅助内容创作与润色。
- **私有化部署**：基于 Docker 技术，数据存储在本地 NAS。

## FNOS 部署说明

1. 在飞牛 NAS 应用中心选择“手动安装”。
2. 上传 `wechat-editor.fpk` 文件。
3. 安装完成后，即可在浏览器中通过指定端口访问。

## 技术元数据

- **Docker 镜像**: `ghcr.io/panda-995/wechat-editor:v1.1`
- **默认端口**: `80` (容器内)
- **开发者**: [Panda-995](https://github.com/panda-995)

