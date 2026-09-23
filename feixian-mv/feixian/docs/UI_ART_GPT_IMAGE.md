# GPT Image 2.5 · 产品 UI 美术 Manifest

**落盘根目录**：`feixian/assets/resources/textures/`  
**代码引用**：`textures/ui/product/<文件名无后缀>`  
**规范**：RGBA 透明、无棋盘格/白底；出图后运行 `python tools/strip_checkerboard_alpha.py` 再 Creator 导入。

---

## Batch 1 — 壳层（优先）

| 文件 | 尺寸 | 说明 |
|------|------|------|
| `ui/product/hud_top_bg.png` | 720×120 | 顶栏底 |
| `ui/product/bar_power.png` | 680×88 | 战力横条 |
| `ui/product/panel_currency.png` | 220×48 | 单货币槽（×3 可同图） |
| `ui/product/btn_plus.png` | 32×32 | + |
| `ui/product/btn_menu.png` | 64×64 | 汉堡菜单 |
| `ui/product/tabbar_bg.png` | 720×140 | 底栏 |
| `ui/product/chat_bar.png` | 680×40 | 聊天条 |

**提示词模板（顶栏底）**：
```text
Mobile game UI horizontal bar, Chinese xianxia style, dark navy translucent panel with gold ornate border, 720x120 pixels, transparent background outside the bar, no text, no checkerboard, flat 2D game asset.
```

---

## Batch 2 — 侧栏 + Tab 图标

**左栏（128×128）**：`side_sign7.png`, `side_newserver.png`, `side_firstpay.png`, `side_help.png`  
**右栏**：`side_gift.png`, `side_manual.png`, `side_online.png`, `side_fastfight.png`  
**Tab（96×96）**：`tab_role`, `tab_equip`, `tab_spells`, `tab_beasts`, `tab_play`, `tab_cave`, `tab_alliance`  
**选中**：`tab_play_on.png`（玩法高亮金圈）

**侧栏图标提示词**：
```text
Circular mobile game button icon, Chinese fantasy theme, gold rim white center, small area for red notification dot top-right, 128x128, transparent PNG, no checkerboard, single icon only.
```

---

## Batch 3 — 战斗与操作

| 文件 | 尺寸 |
|------|------|
| `btn_auto_on.png` / `btn_auto_off.png` | 200×200 |
| `skill_slot.png` / `skill_slot_lock.png` | 128×128 |
| `orb_realm.png` | 120×120 |
| `stage_rail.png` | 560×24 |
| `stage_node.png` / `stage_node_boss.png` | 40×40 |
| `quest_banner.png` | 680×56 |
| `red_dot.png` | 16×16 |
| `panel_frame.png` | 680×900 | 通用弹层边框 |

---

## Batch 4 — 场景与角色（可选）

| 文件 | 尺寸 | 说明 |
|------|------|------|
| **`bg/field_play_q.png`** | **720×1280** | **玩法背景正式稿**：Q 版俯视斜角青绿草地（见 `docs/BG_FIELD_Q_SPEC.md`） |
| `bg/field_product.png` | 720×1280 | 旧 Batch4 名，可被 `field_play_q` 取代 |
| `chars/hero_product.png` | 1024×1024 | |
| `chars/mob_bird_product.png` | 1024×1024 | |
| `fx/slash_product_sheet.png` | 512×170 | 三帧横排 |

---

## 导入后

1. Creator 选中 PNG → Sprite Frame，勾选透明。  
2. 预览无 `[skin] load failed`。  
3. 与 `docs/QA_PRODUCT_CHECKLIST.md` 对照截图。
