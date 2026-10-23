# 许可证与素材分发分析

更新日期：2026-10-24。本文是本项目的许可选择建议，不构成对第三方内容的授权，也不是已经生效的统一许可证。

## 当前决定

项目维护者决定参考社区项目，以“玩家自备 MO 3.3.6、解压覆盖”的形式公开当前修改层。仓库与覆盖包包含规则、地图、两个 MIX、界面与文本资源、Phobos build-38 及离线玩家图鉴；不提供原游戏或 MO 官方完整本体。

目前不设置覆盖全仓库的 MIT、GPL 或 CC 许可证。覆盖分发形式本身不改变上游条款，也不表示项目已取得 MO 官方授权。作者提供的原创范围与尚未确认的第三方素材来源见[署名与权利说明](../THIRD_PARTY_NOTICES.md)。

## 推荐方案

| 内容 | 建议 | 适用前提 |
| --- | --- | --- |
| 独立原创工具、脚本、网站代码 | MIT | 能确认相应代码的权利来源；不包含不可兼容的第三方代码 |
| 独立原创说明、攻略文字 | CC BY 4.0；如希望改编继续同许可，可选 CC BY-SA 4.0 | 只覆盖有权许可的原创表达，不自动包含截图、图标及引用内容 |
| MO 规则、地图及其修改版 | 遵循 MO 条款与具体书面授权 | 先核实公开修改和再分发权限，不能用本项目许可证替代 |
| 第三方体素、SHP、图像、音频、字体等 | 逐项保留原许可 | 记录作者、来源、修改及再分发条件；不能仅凭免费下载判断 |
| Phobos build-38 | 沿用 LGPL v3 | 确认二进制来源与对应源码，并履行其分发要求 |

[MIT](https://opensource.org/license/mit) 适合希望他人方便复用的原创代码，允许商业使用，要求保留版权及许可声明。如果更希望衍生代码继续公开，可考虑 [GPL v3](https://www.gnu.org/licenses/gpl-3.0.html)，但不能借此给没有授权的 MO 内容重新许可。不要向 MIT/GPL 加入“禁止商业使用”后仍称其为原版许可证。

[Creative Commons FAQ](https://creativecommons.org/faq/#can-i-apply-a-creative-commons-license-to-software) 不推荐将 CC 用于软件；文档和独立美术作品可以考虑 CC。若选择 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)，需接受其允许商业复用的特点。以上只是候选方案，尚未实施。

## Mental Omega 的公开发布限制

[MO 官方条款](https://mentalomega.com/index.php?page=privacy) 的 Using the Mod 部分没有授权通过修改或再分发原 MO 素材而显著改变模组的公开子模组，列举范围包含体素、图像、地图、任务和 INI；还限制未经许可重新托管模组和补丁。[官方 FAQ](https://mentalomega.com/index.php?page=support) 同样说明了修改与任务包的边界。

本项目属于规则和资源修改覆盖层。因此，“只上传覆盖文件”“免费发布”“加入署名”或“使用开源许可证”均不能据此证明已经获得公开分发授权。官方允许特定任务包使用官方 Phobos 构建，也不等于授权本项目的全部修改。

## MIX 是否加密

本地两个修改用 MIX 的当前文件头均为 `flags = 0x00000000`，未启用 MIX 索引加密。核对既有资源清单及源文件 SHA-256 后，结果如下：

| 文件 | 大小（字节） | 条目数 | 有效素材数 | 内容类型 |
| --- | ---: | ---: | ---: | --- |
| expandmo34.mix | 96,303,853 | 93 | 92 | 17 HVA、17 VXL、53 PCX、5 WAV，另有 1 个 DAT 元数据 |
| expandmo35.mix | 4,861,386 | 123 | 122 | 39 SHP、7 PCX、76 WAV，另有 1 个 DAT 元数据 |

源文件 SHA-256：

```text
expandmo34.mix  b82c2fff2369ed2781c048920d724c25adf2e05161c8c1ead7eb8887ea46518f
expandmo35.mix  f66c98bd39b69ef738aac69f2ffde0cfd07d856d59645cce2b1092075f94cf58
```

这说明素材确实以 MIX 归档形式存放，不能把它理解为授权或保密保障。此次仅核对文件头、哈希与已有清单，未修改、重新解包或解密文件；未逐项核实 214 个素材的作者和使用条件，也未排除单个条目存在其他处理。

后续素材登记至少应包含：文件名及所属 MIX、原作者、原始发布链接、许可原文或授权记录、是否修改、是否允许再分发、署名方式。只有“公开素材”这一描述不足以确定这些权限。

## Phobos build-38

历史版本 [build-38 的 LICENSE.md](https://github.com/Phobos-developers/Phobos/blob/build-38/LICENSE.md) 明确为 **GNU LGPL v3**，应核对这一版本，不能直接套用最新版项目的许可。[同版本 README](https://github.com/Phobos-developers/Phobos/blob/build-38/README.md) 与 [Build 38 发布页](https://github.com/Phobos-developers/Phobos/releases/tag/build-38) 可用于确认来源。

本地 DLL 已与官方 Build 38 发布文件完成 SHA-256 比对，字节一致。包内随附 LGPL v3、GPL v3 文本与精确源码提交及递归获取子模块的说明，见[署名与权利说明](../THIRD_PARTY_NOTICES.md)。

如以后分发 DLL，应保留版权及许可声明，提供 LGPL v3 及其纳入的 GPL v3 文本，并按许可提供与所分发二进制对应的完整源码及必要构建材料；修改过的 DLL 需要相应修改后源码。网络分发源码可参考 [GNU 关于异站源码的说明](https://www.gnu.org/licenses/gpl-faq.en.html#SourceAndBinaryOnDifferentSites)，不能仅给一个可能变化的项目首页。

本覆盖包分发官方未修改的 build-38 DLL。使用 LGPL 组件本身不意味着所有游戏配置、素材和独立文档自动成为 GPL。
