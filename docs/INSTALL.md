# 覆盖安装

## 准备

准备一份已经能正常进入游戏的 Mental Omega 3.3.6 简体中文版，所需原游戏与模组请从各自官方渠道获取。建议复制整个安装目录，在副本上安装本包，保留原目录用于恢复；不要与其他任务包或平衡修改混装。

## 安装与启动

1. 下载 Release 的 `MentalOmega336-PvE-Enhanced-*-overlay.zip`，可使用随附的 `SHA256SUMS.txt` 核对 ZIP。
2. 关闭游戏和启动器，将 ZIP **内部内容**解压到副本根目录，使 `rulesmo.ini` 与 `MentalOmegaClient.exe` 位于同一层，同意覆盖现有文件。
3. 包内包含官方 Phobos Development Build #38。此版本是当前规则的依赖，不建议未经验证更换为其他版本。
4. 通过 `MentalOmegaClient.exe` 启动。离线图鉴入口是 `docs/modified-wiki/html-refine/index.html`。

如需原修改版的 Phobos 界面选项，可在自己的 `RA2MO.ini` 的 `[Phobos]` 节设置以下项目；已有同名项目时修改值即可：

```ini
[Phobos]
ShowBuildingPlacementPreview=yes
ToolTipDescriptions=yes
DigitalDisplay.Enable=true
ShowDesignatorRange=true
```

多人游戏的所有参与者应使用相同覆盖包与 Phobos 版本。

本包不覆盖个人 `RA2MO.ini`，不会预设昵称、网络或显示设置。启动器更新可能覆盖修改文件；若需恢复原版，直接使用安装前保留的原目录。只删除本包文件不能恢复被覆盖的原文件。

## 当前预发布限制

- 主规则引用 `SP_LIBRA.ini`、`rulesmo-JY.ini`，但当前覆盖层未提供；已有资源清单中也未找到。这可能影响依赖其定义的内容。
- 地图列表注册了 `Demonic Modification` 模式，但未提供同名模式配置段；该模式在客户端的完整加载行为尚未确认。
- `shi.map` 及预览存在，其地图列表节为空，可能无法在客户端按预期显示或选择。
- `ziyou.map` 与地图列表中的 `LocalSize` 高度存在 150/151 的元数据差异，可能影响预览显示。
- 当前是已有覆盖层的原样快照，未进行游戏内运行验证，不能保证全部任务、规则和多人同步可用。以上问题并未在打包过程中修复。

## 包含与排除

覆盖包包括根目录的活动游戏配置与资源、`INI/MentalOmegaMaps.ini`、`MapsMO/Demonic Modification/`、Phobos DLL 和许可、离线玩家图鉴及本项目说明。

不包含原游戏、MO 官方完整本体、个人设置、历史备份、诊断文件、`agent/`、`MEMORY`、`AGENTS` 或本地开发环境。逐文件大小及 SHA-256 见随包 `PACKAGE-MANIFEST.json`。
