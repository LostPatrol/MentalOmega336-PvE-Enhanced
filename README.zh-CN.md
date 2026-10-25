# 心灵终结 3.3.6 PVE 增强版

**Mental Omega 3.3.6 PVE Enhanced** 是基于心灵终结 3.3.6 的非官方 PVE 修改版，主要面向爱好单人/合作PVE的玩家。

**[English](README.md) · [下载覆盖包](https://github.com/LostPatrol/MentalOmega336-PvE-Enhanced/releases/download/v0.1.0-beta/MentalOmega336-PvE-Enhanced-0.1.0-beta-overlay.zip) · [在线玩家资料站](http://47.93.249.150/mo336-pve-enhanced/)**

> [!WARNING]
>
> 本修改包的平衡性调整不适配PVP，也不推荐使用本修改版进入联机大厅的PVP房间
>
> 当前版本尚未完成联机验证

## 主要内容

### [在线Wiki](http://47.93.249.150/mo336-pve-enhanced/)

或离线wiki： `docs/modified-wiki/html/index.html`

**108 项新增/解锁内容**， **173 项平衡性调整**，另有战役/特殊单位与 AI 专属变种138项

- **扩展后期科技路线：** 新的科技树、建筑与支援技能，解锁高级战力和支援能力；
- **更多高级单位与英雄:**为原版特殊单位、战役专属单位、渗透单位等添加了新的建造方式；
- **新增特殊玩法：** 引入Phobos的护盾等特殊功能；部分单位武器效果重做；
- **大量平衡性调整:** 调整了百余个单位的数值/机制等各项属性；焚风阵营的调整较少。
- **合作任务/战役。** 新增10张合作任务地图，包含基地攻防、登陆推进、护送撤离等；
- **细节优化：** 敌方军衔显示；建筑自动维修；禁止AI使用各种烦人的支援技能等。

## 使用方法

1. 推荐纯净版 **Mental Omega 3.3.6 简体中文版**；不要与其他任务包混装；
2. 从 [Releases](https://github.com/LostPatrol/MentalOmega336-PvE-Enhanced/releases/tag/v0.1.0-beta) 下载 `MentalOmega336-PvE-Enhanced-0.1.0-beta-overlay.zip`。应下载覆盖 ZIP；
3. 将 ZIP内全部文件解压到副本根目录，同意覆盖；
4. 启动游戏，进入遭遇战即可。或在“魔改合作任务”中选择地图。

## 已知问题

- 某些地图可能会弹窗
- 在早期地图发布之后，又进行了更新，不能保证早期地图在当前版本下依然能完整游玩。
- 部分任务需要手动设置国家或位置

通过 [Issues](https://github.com/LostPatrol/MentalOmega336-PvE-Enhanced/issues) 或 <lostpatrol3@gmail.com>反馈问题，请附上必要描述。

## 打包

下载当前仓库或使用 Git 克隆。在解压后的仓库根目录用 PowerShell 运行：

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Build-Overlay.ps1
```

输出位于 `dist/`

## 许可与致谢

本仓库包含原创内容与基于 Mental Omega 官方的修改内容，请尊重各原创，勿二次分发。Phobos build-38 使用 [LGPL v3](licenses/Phobos-LGPL-3.0.md)，[对应源码](https://github.com/Phobos-developers/Phobos/tree/f23b2ffecfb2bee5a45d088592fdd7a7599d92f5)由上游提供。

感谢 Mentalmeisters、Phobos 开发者及各素材作者。本项目与 Mental Omega 官方及 Electronic Arts 无隶属关系，未获其认可或支持；相关名称与素材权利归各自权利人所有。
