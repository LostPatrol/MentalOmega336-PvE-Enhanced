# Mental Omega 3.3.6 PVE Enhanced

**Mental Omega 3.3.6 PVE Enhanced** is an unofficial PVE modification of Mental Omega 3.3.6, mainly for players who enjoy single-player and cooperative PVE.

**[简体中文](README.zh-CN.md) · [Download Overlay](https://github.com/LostPatrol/MentalOmega336-PvE-Enhanced/releases/download/v0.1.0-beta/MentalOmega336-PvE-Enhanced-0.1.0-beta-overlay.zip) · [Online Player Wiki](http://47.93.249.150/mo336-pve-enhanced/)**

> [!WARNING]
>
> The balance changes are not designed for PVP. Using this modification in PVP rooms in the multiplayer lobby is not recommended.
>
> Multiplayer has not yet been verified for the current version.

## Main Features

### [Online Wiki](http://47.93.249.150/mo336-pve-enhanced/)

Or browse the offline wiki: `docs/modified-wiki/html/index.html`

**108 additions/unlocks**, **173 balance adjustments**, plus **138 campaign/special units and AI-only variants**.

- **Expanded late-game technology:** New technology trees, structures, and support powers unlock advanced units and support capabilities.
- **More advanced units and heroes:** New ways to build special, campaign-only, and infiltration-unlocked units from the original game.
- **New mechanics:** Features such as Phobos shields, with reworked weapon effects for some units.
- **Extensive balance changes:** Adjusted stats and mechanics for over a hundred units; Foehn has fewer changes.
- **Cooperative missions/campaigns:** 10 new cooperative mission maps, including base assaults and defense, landing operations, and escort and evacuation missions.
- **Quality-of-life improvements:** Visible enemy ranks, automatic building repairs, and disabling various annoying AI support powers.

## How to Use

1. A clean **Simplified Chinese installation of Mental Omega 3.3.6** is recommended. Do not mix this with other mission packs.
2. Download `MentalOmega336-PvE-Enhanced-0.1.0-beta-overlay.zip` from [Releases](https://github.com/LostPatrol/MentalOmega336-PvE-Enhanced/releases/tag/v0.1.0-beta). Choose the overlay ZIP.
3. Extract all files from the ZIP into the root of your game copy and accept overwrites.
4. Launch the game and enter Skirmish, or select a map under “魔改合作任务” (Modified Cooperative Missions).

## Known Issues

- Some maps may display dialogs.
- Updates made after the release of early maps mean those maps are not guaranteed to remain fully playable in the current version.
- Some missions require manually selecting a country or starting position.

Report problems through [Issues](https://github.com/LostPatrol/MentalOmega336-PvE-Enhanced/issues) or <lostpatrol3@gmail.com>, with the necessary details.

## Packaging

Download this repository or clone it with Git. Run the following in PowerShell from the repository root:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Build-Overlay.ps1
```

Output is placed in `dist/`.

## Licensing and Acknowledgements

See [Third-Party Notices](THIRD_PARTY_NOTICES.md) for original and third-party content attributions and rights. Phobos build-38 remains under LGPL v3; its license and corresponding source link are included. This repository contains both original content and modifications based on the official Mental Omega content. It is shared for discussion and convenience; please respect the original creators and do not redistribute.

Thanks to Mentalmeisters, the Phobos developers, and all asset creators. This project is not affiliated with, endorsed by, or supported by the official Mental Omega team or Electronic Arts. All related names and assets belong to their respective rights holders.
