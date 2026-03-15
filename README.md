# FnDepot 应用源

> **版本**: 1.0.0
> **最后更新**: 2026-03-15

FnDepot 是运行于 FNOS 上的去中心化第三方应用管理器。本仓库包含以下应用：

## 应用列表

| 应用名称 | 描述 | 版本 | 大小 |
|---------|------|------|------|
| [PixelBeans 拼豆底稿生成器](./pixelbeans/) | 功能强大的拼豆底稿生成器，支持图片像素化、多色板映射、智能颜色合并、背景移除和图纸导出 | 1.0.4 | 33 MB |
| [CoMission 双人任务协作](./comission/) | 专为双人协作设计的任务管理应用，支持任务发布、积分商城、实时通知、订单管理、组队系统 | 1.3.1 | 15 MB |

---

## 安装说明

### 方式一：添加应用源

1. 在 FNOS 系统设置中添加应用源 URL：`https://github.com/boater-man/FnDepot`
2. 刷新应用列表
3. 选择应用进行安装

### 方式二：手动安装 FPK

1. 进入对应应用目录
2. 下载 `.fpk` 文件
3. 在 FNOS 应用管理中选择"手动安装"
4. 上传 FPK 文件

### 方式三：Docker 运行

#### PixelBeans
```bash
docker run -d -p 3000:3000 --name pixelbeans ghcr.io/boater-man/pixelbeans:latest
```

#### CoMission
```bash
docker run -d -p 3000:3000 --name comission ghcr.io/boater-man/comission:latest
```

---

## 目录结构

```
FnDepot/
├── fnpack.json          # 全局索引文件
├── README.md            # 本说明文档
├── LAW.md               # 构建规范文档
├── pixelbeans/          # PixelBeans 应用目录
│   ├── ICON.PNG
│   ├── pixelbeans.fpk
│   ├── README.md
│   └── Preview/
└── comission/           # CoMission 应用目录
    ├── ICON.PNG
    ├── comission.fpk
    ├── README.md
    └── Preview/
```

---

## 相关链接

- **GitHub**: https://github.com/boater-man/FnDepot
- **Docker Packages**: https://github.com/boater-man?tab=packages
- **Issues**: https://github.com/boater-man/FnDepot/issues

---

*FnDepot Protocol Version 1.0*
