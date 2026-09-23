# 玩法场景背景 · Q 版仙侠草地（GPT Image 2.5）

**目标**：替换 `field_v2` / 旧 `field_product` 的写实暗黄森林，与产品参考一致的 **明亮 Q 版手绘** 俯视斜角地图。

**落盘路径（唯一正式名）**  
`assets/resources/textures/bg/field_play_q.png`  
**代码加载**：`textures/bg/field_play_q`（失败时依次回退 `field_product` → `field_v2`）

---

## 硬性规格

| 项 | 要求 |
|----|------|
| 尺寸 | **720 × 1280** 像素，竖屏，**禁止**非等比拉伸出图 |
| 透视 | **俯视斜角**（2.5D / 等距感），像手游关卡底图，非正侧面壁纸 |
| 风格 | Q 版、手绘、平涂+轻渐变，与 UI 金边壳层同频 |
| 色调 | 青绿草坪为主，**高饱和、明亮、不灰不黄**；禁用摄影写实、雾化远景壁纸 |
| 构图 | 中下为 **可站立的平整草地/石路**（主角与野怪区）；上 1/3 可略虚化的远景装饰 |
| 元素（需可见） | 浅色石路、溪流、小瀑布、木桥、山石、花丛、**樱花**（粉白点缀） |
| 禁止 | 写实森林照片感、单一「远山+雾」壁纸、横向图硬拉竖屏、棋盘格/白底 |

**导入 Creator**：Type = **sprite-frame**，Wrap = Clamp，Filter = Bilinear。

---

## GPT Image 2.5 · 主提示词（英文，直接复制）

```text
Vertical mobile game background, exactly 720x1280 pixels, portrait orientation.

Top-down oblique view (2.5D isometric-ish) fresh xianxia cultivation grassland map for a cute chibi RPG. Hand-painted 2D game art, NOT photorealistic, NOT a forest photograph, NOT a distant mountain wallpaper.

Bright saturated colors but soft and pleasant: vivid cyan-green lawn, light beige stone path winding through the center lower area, small stream with clear blue water, tiny waterfall, simple wooden bridge, rounded gray rocks, flower bushes, cherry blossom petals and pink-white sakura trees on the sides.

Clear playable ground in the lower-middle for characters to stand. Upper area can have lighter decorative hills and clouds. Clean readable shapes, soft cel-shading, no text, no UI, no characters, no monsters.

Single full image, no border, no watermark, no checkerboard transparency (opaque RGB background filling entire canvas).
```

---

## 备选提示词（强调「不要写实」）

```text
Same specs 720x1280 portrait. Cute Chinese fantasy mobile game map illustration, cartoon hand-drawn style like AFK RPG backgrounds. Forbidden: realistic trees, photographic lighting, yellow-brown muddy forest, cinematic foggy mountains stretched vertically. Required: green grass, stone path, stream, waterfall, wooden bridge, sakura, flowers, bright and cheerful.
```

---

## 验收（出图后）

1. 在 Creator 720×1280 预览：**无纵向拉长/压扁感**（节点尺寸与 PNG 一致 720×1280）。  
2. 与 Q 版主角、product UI 并排截图：背景 **不偏写实、不偏暗黄**。  
3. 中下战斗区 **石路/草地清晰**，不挡 HUD。  
4. Console 无 `field_play_q` 加载失败（或确认已替换回退链最优先文件）。

---

## 可选拆分（仅当单张 720×1280 难控时）

优先仍用 **一张整图**。若模型反复写实，可出 **720×1280 一张** 后在 PS 微调，**不要** 用 1280×720 横图旋转拉伸。

| 文件 | 尺寸 | 用途 |
|------|------|------|
| `bg/field_play_q.png` | 720×1280 | **唯一必需** |

---

## 与旧资源关系

| 文件 | 状态 |
|------|------|
| `field_v2.png` | 保留作回退，不再作为目标风格 |
| `field_product.png` | 若已是 Q 版可暂代；否则等新 `field_play_q` |
| `field_play_q.png` | **新正式场景** |
