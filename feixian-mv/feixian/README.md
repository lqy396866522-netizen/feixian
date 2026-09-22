# 飞仙挂机 MVP

Cocos Creator **3.8.7** 竖屏挂机战斗 Demo（目标平台：微信小游戏 / Web Desktop 预览）。纯本地存档，无后端。

> 当前状态（2026-09-23）：功能开发**正式暂停**。演示包冻结在本机 `http://127.0.0.1:8767`；P8 未开。恢复后从「v3 slash 白格 / 掉落认金终判 → 收庆雨四条落地」继续。

## 仓库说明

本仓库对应本机工程目录：

- 工程：`E:\wx-game\feixian-mv\feixian`
- Creator：`E:\Cocos\Creator\3.8.7\CocosCreator.exe`
- 聊天侧资源/脚本副本：`C:\Users\李庆雨\feixian-for-chat\`
- UI 商业资源：`feixian-for-chat\ui\commercial\v2\`

存档 key：`feixian_mvp_save_v1`（`sys.localStorage` / `localStorage`）。

## 快速开始

1. 安装 [Cocos Creator 3.8.7](https://www.cocos.com/creator-download)
2. 打开本仓库根目录为工程
3. 双击 `assets/scenes/main.scene`（若场景路径不同，以 `assets/scenes` 下实际场景为准）
4. 确认 Canvas 上挂有 `MainGame` 组件
5. 点击预览 ▶（设计分辨率 **720×1280** 竖屏）

### 本机 Web Desktop 演示包

构建产物默认不入库（见 `.gitignore` 的 `build/`）。需要演示时在 Creator 中构建 `web-desktop`，或使用已同步到：

`C:\Users\李庆雨\feixian-for-chat\preview\web-desktop`

然后本地静态服务：

```text
http://127.0.0.1:8767
```

## 目录结构

```text
feixian/
├── assets/
│   ├── scripts/          # TypeScript 玩法逻辑
│   ├── resources/        # 运行时加载贴图（chars / fx / icons / bg）
│   └── scenes/           # 主场景
├── settings/             # Creator 工程设置
├── package.json
├── tsconfig.json
└── README.md
```

忽略目录（勿提交）：`library/`、`temp/`、`local/`、`build/`、`.creator/`。

## 脚本一览

| 文件 | 作用 |
|------|------|
| `assets/scripts/MainGame.ts` | 程序化 UI、战斗表现、Tab |
| `assets/scripts/GameModel.ts` | 战力 / 掉落 / 突破 / 穿戴 |
| `assets/scripts/CombatLoop.ts` | 自动战斗节拍 |
| `assets/scripts/SaveSystem.ts` | 本地存档读写 |
| `assets/scripts/GameTypes.ts` | 数值与类型表 |

## 已交付能力（演示包口径）

- P1–P7：装备掉落、顶栏战力、击杀掉落提示、法术页、宝箱、音效开关、异兽页等
- 庆雨四条（部分待终判）：换地图背景、多野怪+走动、地上掉落自动拾取、slash 帧攻击特效
- v3 资源路径（待设计终判）：`textures/fx/slash_f*_v3`、`textures/fx/drop_gold_v3`

## Tab

可进：装备、玩法、法术、异兽、设置。其余按 MVP 灰态提示。

## 协作约定

- 正式美术资源落盘：`C:\Users\李庆雨\feixian-for-chat\ui\commercial\v2\`
- 换皮后需 Creator 以 **sprite-frame + hasAlpha (RGBA)** 导入透明图
- 进度同步在「炸金花项目组」群；暂停期间不改代码、不出新图

## License

私有项目，未声明开源协议前仅限团队内部使用。