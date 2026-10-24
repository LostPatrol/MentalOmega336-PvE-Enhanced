# MentalOmega336-PvE-Enhanced

**心灵终结 3.3.6 PVE 增强版**，由 [LostPatrol](https://github.com/LostPatrol) 维护的非官方个人修改项目，围绕合作挑战、单位与科技解锁、平衡调整和玩法资料整理展开。

[在线资料站](http://47.93.249.150/mo336-pve-enhanced/)：浏览单位图鉴、地图介绍与阵营科技树。

## 项目内容

本项目以 Mental Omega 3.3.6 为基础，包含游戏规则与资源覆盖层、10 张挑战地图，以及单位图鉴、地图说明和科技树资料。它依赖原游戏和 Mental Omega，不是独立游戏或完整安装包。

## 下载与安装

从 [Releases](https://github.com/LostPatrol/MentalOmega336-PvE-Enhanced/releases) 下载 `MentalOmega336-PvE-Enhanced-*-overlay.zip`，将包内文件解压到一份独立的、已可正常运行的 **Mental Omega 3.3.6 简体中文安装目录**，同意覆盖后通过 `MentalOmegaClient.exe` 启动。不要与其他任务包或规则修改包混装。

覆盖包包括当前规则、两个 MIX、地图及预览、文本与界面资源、官方 Phobos build-38 和离线玩家图鉴。打开 `docs/modified-wiki/html-refine/index.html` 可离线阅读图鉴，也可访问上方在线资料站。

**当前为预发布版本，未完成游戏内运行验证。** 已补齐挑战模式入口、“致命冲击”地图元数据及客户端16色配置；仍缺少 `rulesmo-JY.ini`，部分地图存在待确认的脚本与选位限制。安装、备份及限制详见[安装说明](docs/INSTALL.md)。

游戏与模组请通过各自的官方渠道获取：[Mental Omega 官方网站](https://mentalomega.com/)。

## 自行打包

在仓库根目录用 PowerShell 运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Build-Overlay.ps1
```

输出位于 `dist/`，包括覆盖 ZIP、逐文件 SHA-256 清单和压缩包校验文件。打包保留游戏文件原始字节，不需要 Python、地图编辑器或游戏本体。

## 许可与致谢

当前未授予整包统一的开源许可证。原创与第三方内容说明见[署名与权利说明](THIRD_PARTY_NOTICES.md)，许可边界见[许可证分析](docs/LICENSING.md)。Phobos build-38 沿用 LGPL v3，随附许可及对应源码链接。

感谢 Mentalmeisters、Phobos 开发者及各素材作者。本项目与 Mental Omega 官方及 Electronic Arts 无隶属关系，未获其认可或支持；相关名称与素材权利归各自权利人所有。
