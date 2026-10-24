# 覆盖安装

## 准备

准备一份已经能正常进入游戏的 Mental Omega 3.3.6 简体中文版，所需原游戏与模组请从各自官方渠道获取。建议复制整个安装目录，在副本上安装本包，保留原目录用于恢复；不要与其他任务包或平衡修改混装。

## 安装与启动

1. 下载 Release 的 `MentalOmega336-PvE-Enhanced-*-overlay.zip`，可使用随附的 `SHA256SUMS.txt` 核对 ZIP。
2. 关闭游戏和启动器，将 ZIP **内部内容**解压到副本根目录，使 `rulesmo.ini` 与 `MentalOmegaClient.exe` 位于同一层，同意覆盖现有文件。
3. 包内包含官方 Phobos Development Build #38。此版本是当前规则的依赖，不建议未经验证更换为其他版本。
4. 通过 `MentalOmegaClient.exe` 启动。可访问[在线资料站](http://47.93.249.150/mo336-pve-enhanced/)查看单位图鉴、地图介绍与科技树；离线入口是 `docs/modified-wiki/html-refine/index.html`。

自定义地图位于“魔改合作任务”模式。升天、坚韧、炼狱、自由、均势、没落之地、白给巨兽、重装武器的大厅最多容纳两名玩家，剧情 AI 自动加入。白给巨兽仍需按简报分别选择欧洲联盟、太平洋阵线，重装武器仍需分别选择美国、苏俄；旧客户端只能限制两名玩家共用的可选国家集合，不能阻止两人互换国家。

钢铁长城仍须手动选择第3、4位置；致命冲击（shi）保留8个手动席位，按简报将第1、2位置作为玩家、第3位置作为友军、第4至8位置作为敌军，其国家配置尚待确认。客户端和游戏内颜色已统一为16种，需同时安装包内的 `Resources/GameOptions.ini` 与 `uimd.ini`。

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

- 主规则引用 `rulesmo-JY.ini`，但当前覆盖层未提供；已有资源清单中也未找到。这可能影响依赖其定义的内容。已删除的莉布拉火箭车扩展不再被主规则引用，无需补回。
- 白给巨兽已修正机甲撤离编组及撤离时的失败误判；撤离后进攻时的卡屏弹窗尚未确认根因。
- 致命冲击仍有缺失的实体标签和一处胜利链无效触发引用；均势有两处缺失标签；白给巨兽有四处缺失触发引用。原始意图无法唯一恢复，暂未猜测替换。
- 旧客户端的逐席国家、钢铁长城选位及致命冲击国家配置限制见上述启动说明。
- 已完成十图的静态引用与元数据检查，尚未进行游戏内剧情、寻路或联机验证，不能保证全部任务和多人同步可用。

## 包含与排除

覆盖包包括根目录的活动游戏配置与资源、`INI/MentalOmegaMaps.ini`、`Resources/GameOptions.ini`、`MapsMO/Demonic Modification/`、Phobos DLL 和许可、离线玩家图鉴及本项目说明。

不包含原游戏、MO 官方完整本体、个人设置、历史备份、诊断文件、`agent/`、`MEMORY`、`AGENTS` 或本地开发环境。逐文件大小及 SHA-256 见随包 `PACKAGE-MANIFEST.json`。
