# 飞仙 / wx-game

本仓库根目录对应本机 **`E:\wx-game`**。

> 2026-09-23：飞仙功能开发正式暂停。演示包冻结在 `http://127.0.0.1:8767`；恢复后从 v3 slash 白格 / 掉落认金终判继续。

## 目录

```text
E:\wx-game\
├── assets\                 # 线框 / UI 参考等
└── feixian-mv\
    └── feixian\            # Cocos Creator 3.8.7 主工程
        ├── assets\
        │   ├── scripts\    # MainGame / GameModel / CombatLoop …
        │   ├── resources\  # 运行时贴图
        │   └── scenes\
        ├── settings\
        ├── package.json
        └── README.md       # 工程内补充说明
```

## 主工程

路径：`feixian-mv/feixian`

- 引擎：Cocos Creator **3.8.7**（本机 `E:\Cocos\Creator\3.8.7`）
- 竖屏 720×1280，本地存档 idle 战斗 MVP，无后端
- 存档 key：`feixian_mvp_save_v1`

### 打开预览

1. 用 Creator 打开 `feixian-mv/feixian`
2. 打开主场景，确认 Canvas 挂有 `MainGame`
3. 点击预览 ▶

Web Desktop 演示包可落在：

`C:\Users\李庆雨\feixian-for-chat\preview\web-desktop` → `http://127.0.0.1:8767`

### 脚本

| 文件 | 作用 |
|------|------|
| `assets/scripts/MainGame.ts` | UI 与战斗表现 |
| `assets/scripts/GameModel.ts` | 战力 / 掉落 / 突破 / 穿戴 |
| `assets/scripts/CombatLoop.ts` | 自动战斗 |
| `assets/scripts/SaveSystem.ts` | 本地存档 |
| `assets/scripts/GameTypes.ts` | 数值表 |

## Git 说明

已忽略 Creator 缓存与构建产物：`library/`、`temp/`、`local/`、`build/` 等（见根目录 `.gitignore`）。

远程：https://github.com/lqy396866522-netizen/feixian.git

## License

私有项目，未声明开源协议前仅限团队内部使用。