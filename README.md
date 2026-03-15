# FnDepot 应用源

> **版本**: 1.0.0  
> **最后更新**: 2026-03-15

FnDepot 是运行于 FNOS 上的去中心化第三方应用管理器。本仓库包含以下应用：

## 📦 应用列表

| 应用名称 | 描述 | 版本 | 大小 |
|---------|------|------|------|
| [PixelBeans 拼豆底稿生成器](./pixelbeans/) | 功能强大的拼豆底稿生成器 | 1.0.4 | 33 MB |
| [CoMission 双人任务协作](./comission/) | 双人任务协作应用 | 1.3.1 | 100 MB |

---

## 📥 安装说明

### 方式一：添加应用源

1. 在 FNOS 系统设置中添加应用源 URL
2. 刷新应用列表
3. 选择应用进行安装

### 方式二：手动安装 FPK

**注意**: FPK 文件较大，请从 Release 页面下载

1. 访问 [Releases](https://github.com/boater-man/FnDepot/releases)
2. 下载对应应用的 `.fpk` 文件
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

## 📁 目录结构

```
FnDepot/
├── fnpack.json          # 全局索引文件
├── README.md            # 本说明文档
├── pixelbeans/          # PixelBeans 应用目录
│   ├── README.md
│   ├── manifest
│   └── Preview/
└── comission/           # CoMission 应用目录
    ├── README.md
    ├── manifest
    └── Preview/
```

**注意**: 由于 GitHub 文件大小限制（100MB），FPK 安装包文件不包含在仓库中。请从 Releases 页面下载或通过 Docker 镜像运行。

---

## 🔗 相关链接

- **GitHub**: https://github.com/boater-man/FnDepot
- **Docker Hub**: https://github.com/boater-man?tab=packages
- **Issues**: https://github.com/boater-man/FnDepot/issues

---

*FnDepot Protocol Version 1.0*
