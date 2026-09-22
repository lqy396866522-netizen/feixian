#!/usr/bin/env python3
"""feixian-mvp: 6 portrait (9:16) mid-fidelity UI wireframes."""
from PIL import Image, ImageDraw, ImageFont
import os

OUT = "/workspace/feixian-mvp/ui"
W, H = 720, 1280  # 9:16

# ---- Design tokens (also used by palette screen) ----
GRASS       = (168, 196, 140)   # #A8C48C
GRASS_DK    = (140, 168, 112)   # #8CA870
SKY         = (196, 220, 196)   # #C4DCC4
UI_NAVY     = (26, 42, 68)      # #1A2A44
UI_NAVY2    = (36, 56, 88)      # #243858
GOLD        = (212, 168, 72)    # #D4A848
GOLD_LT     = (240, 210, 130)   # #F0D282
POWER_RED   = (220, 64, 64)     # #DC4040
DISABLED    = (148, 152, 160)   # #9498A0
DISABLED_BG = (210, 214, 220)   # #D2D6DC
BTN_PRIMARY = (72, 140, 220)    # #488CDC
BTN_OK      = (72, 176, 120)    # #48B078
PANEL       = (255, 255, 255)
PANEL_A     = (255, 255, 255, 230)
INK         = (32, 40, 52)      # #202834
INK_MUTED   = (100, 110, 124)   # #646E7C
WIRE        = (90, 110, 140)    # wireframe stroke
HOTZONE     = (220, 90, 50)     # hotzone callout
WHITE       = (255, 255, 255)
BLACK       = (0, 0, 0)
CHAT_BG     = (40, 48, 60, 180)

FONT_REG = "/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"
FONT_BOLD = "/usr/share/fonts/opentype/noto/NotoSansCJK-Bold.ttc"

def font(size, bold=False):
    path = FONT_BOLD if bold else FONT_REG
    try:
        return ImageFont.truetype(path, size, index=0)
    except Exception:
        return ImageFont.truetype(FONT_REG, size, index=0)

def rr(draw, xy, r, fill=None, outline=None, width=1):
    draw.rounded_rectangle(xy, radius=r, fill=fill, outline=outline, width=width)

def center_text(draw, text, cx, cy, f, fill=INK):
    bbox = draw.textbbox((0, 0), text, font=f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text((cx - tw // 2, cy - th // 2), text, font=f, fill=fill)

def label_box(draw, xy, text, f=None, fill=PANEL, outline=WIRE, tfill=INK, pad=True):
    f = f or font(18)
    rr(draw, xy, 10, fill=fill, outline=outline, width=2)
    x0, y0, x1, y1 = xy
    center_text(draw, text, (x0 + x1) // 2, (y0 + y1) // 2, f, tfill)

def hotzone_tag(draw, x, y, text, side="left"):
    """Small callout tag naming a hotzone."""
    f = font(14, True)
    bbox = draw.textbbox((0, 0), text, font=f)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pad_x, pad_y = 8, 4
    bw, bh = tw + pad_x * 2, th + pad_y * 2
    if side == "left":
        bx0, by0 = x, y
    elif side == "right":
        bx0, by0 = x - bw, y
    else:
        bx0, by0 = x - bw // 2, y
    rr(draw, [bx0, by0, bx0 + bw, by0 + bh], 6, fill=(255, 245, 235), outline=HOTZONE, width=2)
    draw.text((bx0 + pad_x, by0 + pad_y - 1), text, font=f, fill=HOTZONE)

def status_bar(draw):
    draw.text((28, 14), "9:41", font=font(20, True), fill=INK)
    # signal / battery
    for i, ox in enumerate([W - 100, W - 82, W - 64]):
        draw.ellipse([ox, 20, ox + 10, 30], fill=INK if i < 2 else INK_MUTED)
    rr(draw, [W - 48, 18, W - 22, 32], 3, outline=INK, width=2)
    rr(draw, [W - 46, 20, W - 28, 30], 2, fill=INK)

def phone_chrome(img, draw):
    """Outer soft frame hint."""
    rr(draw, [4, 4, W - 5, H - 5], 28, outline=(180, 190, 200), width=3)

# ============================================================
# 01 Field wireframe
# ============================================================
def make_01_field():
    img = Image.new("RGBA", (W, H), (*SKY, 255))
    draw = ImageDraw.Draw(img)

    # grass field mid
    draw.rectangle([0, 160, W, 780], fill=(*GRASS, 255))
    # simple hills
    draw.ellipse([-80, 620, 320, 860], fill=(*GRASS_DK, 255))
    draw.ellipse([280, 640, 820, 900], fill=(*GRASS_DK, 200))
    # cave block (background landmark)
    rr(draw, [260, 280, 460, 420], 20, fill=(120, 130, 120), outline=WIRE, width=2)
    center_text(draw, "洞口/景", 360, 350, font(20), WHITE)

    phone_chrome(img, draw)
    status_bar(draw)

    # --- Top resources ---
    y = 48
    resources = [("金 12.5万", GOLD), ("灵石 830", (90, 180, 120)), ("仙玉 56", BTN_PRIMARY)]
    x = 20
    for txt, col in resources:
        rr(draw, [x, y, x + 140, y + 34], 17, fill=UI_NAVY, outline=col, width=2)
        center_text(draw, txt, x + 70, y + 17, font(16, True), GOLD_LT if col == GOLD else WHITE)
        x += 150
    hotzone_tag(draw, 20, y + 38, "热区·资源条")

    # Avatar + power + realm
    ay = 96
    draw.ellipse([24, ay, 88, ay + 64], fill=UI_NAVY2, outline=GOLD, width=3)
    center_text(draw, "头像", 56, ay + 32, font(16), WHITE)
    draw.text((100, ay + 4), "玩家昵称", font=font(22, True), fill=INK)
    draw.text((100, ay + 32), "⚔ 战力 8050", font=font(18, True), fill=POWER_RED)
    draw.text((100, ay + 54), "炼气期前期 · 二层 2级", font=font(16), fill=INK_MUTED)
    hotzone_tag(draw, 24, ay + 68, "热区·头像/战力/境界")

    # Stage title + progress
    center_text(draw, "2-清萍原野", W // 2, 210, font(28, True), UI_NAVY)
    rr(draw, [160, 235, 560, 258], 12, fill=WHITE, outline=UI_NAVY, width=2)
    rr(draw, [160, 235, 360, 258], 12, fill=BTN_OK)
    # mini runner icon
    draw.ellipse([340, 228, 372, 260], fill=GOLD, outline=UI_NAVY, width=2)
    hotzone_tag(draw, W // 2 - 40, 265, "热区·关卡进度", side="center")

    # Combat placeholders
    # hero
    draw.ellipse([180, 420, 280, 520], fill=(90, 130, 180), outline=UI_NAVY, width=3)
    center_text(draw, "主角Q", 230, 470, font(18, True), WHITE)
    # monster
    draw.ellipse([420, 400, 540, 520], fill=(160, 100, 100), outline=POWER_RED, width=3)
    center_text(draw, "野外怪", 480, 460, font(18, True), WHITE)
    # damage float
    draw.text((500, 370), "-85", font=font(22, True), fill=POWER_RED)
    draw.text((200, 390), "闪避", font=font(16), fill=BTN_OK)
    hotzone_tag(draw, 170, 530, "热区·自动战斗位")

    # Right floating icons stack
    icons = ["礼包", "菜单", "装备"]
    iy = 300
    for t in icons:
        draw.ellipse([W - 90, iy, W - 30, iy + 60], fill=PANEL, outline=GOLD, width=2)
        center_text(draw, t, W - 60, iy + 30, font(14, True), UI_NAVY)
        # red dot
        draw.ellipse([W - 38, iy + 2, W - 26, iy + 14], fill=POWER_RED)
        iy += 78
    hotzone_tag(draw, W - 20, 280, "热区·侧栏入口", side="right")

    # Auto button
    draw.ellipse([40, 700, 120, 780], fill=GOLD, outline=UI_NAVY, width=3)
    center_text(draw, "自动开", 80, 740, font(18, True), UI_NAVY)
    hotzone_tag(draw, 40, 785, "热区·自动战斗")

    # Locked feature circles row
    lx = 150
    for t in ["技能", "召唤", "增益"]:
        draw.ellipse([lx, 720, lx + 56, 776], fill=DISABLED_BG, outline=DISABLED, width=2)
        center_text(draw, t, lx + 28, 748, font(14), DISABLED)
        draw.text((lx + 4, 778), "即将开放", font=font(11), fill=DISABLED)
        lx += 70

    # Realm breakthrough bar
    by = 820
    draw.ellipse([24, by, 88, by + 64], fill=UI_NAVY2, outline=GOLD, width=2)
    center_text(draw, "境界", 56, by + 32, font(16, True), GOLD_LT)
    rr(draw, [100, by + 8, W - 24, by + 56], 16, fill=UI_NAVY, outline=GOLD, width=2)
    rr(draw, [100, by + 8, 420, by + 56], 16, fill=BTN_PRIMARY)
    draw.text((120, by + 18), "境界突破至炼气期前期·二层 (2/2)", font=font(16, True), fill=WHITE)
    draw.text((W - 110, by + 20), "灵石20", font=font(14), fill=GOLD_LT)
    hotzone_tag(draw, 100, by + 60, "热区·境界突破条")

    # Chat strip
    cy = 900
    rr(draw, [24, cy, W - 24, cy + 36], 8, fill=(40, 48, 60), outline=WIRE, width=1)
    draw.text((36, cy + 8), "[世界] 有道友突破炼气期…", font=font(14), fill=(200, 210, 220))

    # Bottom tab bar — 6 slots: 装备/法术灰/异兽灰/玩法亮/洞天灰/仙盟灰
    # Product priority: 装备/玩法/设置 high + rest gray. We'll show 6 classic + note 设置
    # Spec: 装备/玩法/设置 高亮 + 法术异兽洞天仙盟灰 — so effectively we need settings.
    # Use 6 tabs as reference but mark 设置 as replace for one, OR show:
    # 装备(亮) 法术(灰) 异兽(灰) 玩法(亮/当前) 洞天(灰) 设置(亮) — replace 仙盟 with 设置 for MVP
    tabs = [
        ("装备", True, False),
        ("法术", False, True),
        ("异兽", False, True),
        ("玩法", True, False),   # current
        ("洞天", False, True),
        ("设置", True, False),  # MVP: 设置 replaces 仙盟 as active; 仙盟灰掉 via note
    ]
    tab_y = H - 130
    draw.rectangle([0, tab_y - 10, W, H], fill=PANEL)
    draw.line([0, tab_y - 10, W, tab_y - 10], fill=WIRE, width=2)
    tw = W // 6
    for i, (name, active, gray) in enumerate(tabs):
        cx = tw * i + tw // 2
        if gray:
            fill, outline, tf = DISABLED_BG, DISABLED, DISABLED
        elif name == "玩法":
            fill, outline, tf = BTN_OK, UI_NAVY, UI_NAVY
        else:
            fill, outline, tf = (230, 240, 255), BTN_PRIMARY, UI_NAVY
        draw.ellipse([cx - 28, tab_y + 8, cx + 28, tab_y + 64], fill=fill, outline=outline, width=2)
        center_text(draw, name[0], cx, tab_y + 36, font(20, True), tf)
        center_text(draw, name, cx, tab_y + 78, font(16, True if active else False),
                    UI_NAVY if active else DISABLED)
        if gray:
            center_text(draw, "灰", cx, tab_y + 98, font(12), DISABLED)
        else:
            center_text(draw, "可点", cx, tab_y + 98, font(12), BTN_OK)
    # current indicator under 玩法
    draw.rectangle([tw * 3 + 20, H - 8, tw * 4 - 20, H - 4], fill=BTN_OK)
    hotzone_tag(draw, 12, tab_y - 28, "热区·底栏导航")

    # Screen title badge
    rr(draw, [200, 8, 520, 40], 8, fill=UI_NAVY)
    center_text(draw, "01 野外主界面线框", W // 2, 24, font(16, True), WHITE)

    # Note about 仙盟
    draw.text((24, H - 148), "MVP底栏：装备/玩法/设置可点 · 法术/异兽/洞天/仙盟灰（设置替仙盟位）",
              font=font(12), fill=INK_MUTED)

    path = os.path.join(OUT, "feixian_01_field_wire.png")
    img.convert("RGB").save(path, "PNG", optimize=True)
    return path

# ============================================================
# 02 Breakthrough
# ============================================================
def make_02_breakthrough():
    img = Image.new("RGBA", (W, H), (*SKY, 255))
    draw = ImageDraw.Draw(img)
    # dimmed field hint
    draw.rectangle([0, 0, W, H], fill=(*GRASS, 120))
    # dim overlay
    overlay = Image.new("RGBA", (W, H), (20, 30, 45, 140))
    img = Image.alpha_composite(img, overlay)
    draw = ImageDraw.Draw(img)

    status_bar(draw)
    rr(draw, [W // 2 - 170, 8, W // 2 + 170, 40], 8, fill=UI_NAVY)
    center_text(draw, "02 境界突破页/弹层", W // 2, 24, font(16, True), WHITE)

    # Modal panel
    mx0, my0, mx1, my1 = 48, 160, W - 48, 1080
    rr(draw, [mx0, my0, mx1, my1], 24, fill=PANEL, outline=GOLD, width=3)

    # Title
    center_text(draw, "境界突破", W // 2, my0 + 48, font(32, True), UI_NAVY)
    draw.line([mx0 + 40, my0 + 78, mx1 - 40, my0 + 78], fill=GOLD, width=2)

    # Current realm card
    rr(draw, [mx0 + 32, my0 + 100, mx1 - 32, my0 + 220], 16, fill=(240, 245, 250), outline=WIRE, width=2)
    center_text(draw, "当前境界", W // 2, my0 + 125, font(16), INK_MUTED)
    center_text(draw, "炼气期前期 · 二层", W // 2, my0 + 165, font(28, True), UI_NAVY)
    center_text(draw, "等级 2 / 下一层需突破", W // 2, my0 + 200, font(16), INK_MUTED)
    hotzone_tag(draw, mx0 + 32, my0 + 225, "热区·当前境界")

    # Progress
    rr(draw, [mx0 + 32, my0 + 260, mx1 - 32, my0 + 360], 16, fill=(240, 245, 250), outline=WIRE, width=2)
    draw.text((mx0 + 52, my0 + 275), "突破进度", font=font(18, True), fill=INK)
    rr(draw, [mx0 + 52, my0 + 310, mx1 - 52, my0 + 338], 14, fill=DISABLED_BG, outline=UI_NAVY, width=2)
    rr(draw, [mx0 + 52, my0 + 310, mx0 + 52 + int((mx1 - mx0 - 104) * 1.0), my0 + 338], 14, fill=BTN_PRIMARY)
    center_text(draw, "2 / 2  已满可突破", W // 2, my0 + 324, font(14, True), WHITE)
    hotzone_tag(draw, mx0 + 32, my0 + 365, "热区·进度条")

    # Cost
    rr(draw, [mx0 + 32, my0 + 400, mx1 - 32, my0 + 500], 16, fill=(255, 250, 235), outline=GOLD, width=2)
    draw.text((mx0 + 52, my0 + 418), "突破消耗", font=font(18, True), fill=INK)
    draw.text((mx0 + 52, my0 + 455), "灵石 × 20", font=font(24, True), fill=BTN_OK)
    draw.text((mx0 + 220, my0 + 458), "持有 830  ✓ 足够", font=font(16), fill=INK_MUTED)
    hotzone_tag(draw, mx0 + 32, my0 + 505, "热区·消耗")

    # Attr preview
    rr(draw, [mx0 + 32, my0 + 540, mx1 - 32, my0 + 740], 16, fill=(240, 245, 250), outline=WIRE, width=2)
    draw.text((mx0 + 52, my0 + 555), "属性预览（突破后）", font=font(18, True), fill=INK)
    attrs = [
        ("攻击", "120", "→ 145", "+25"),
        ("防御", "80", "→ 95", "+15"),
        ("生命", "900", "→ 1100", "+200"),
        ("境界", "二层", "→ 三层", "升阶"),
    ]
    ay = my0 + 590
    for name, cur, nxt, delta in attrs:
        draw.text((mx0 + 52, ay), name, font=font(16), fill=INK_MUTED)
        draw.text((mx0 + 140, ay), cur, font=font(16, True), fill=INK)
        draw.text((mx0 + 240, ay), nxt, font=font(16, True), fill=BTN_OK)
        draw.text((mx0 + 400, ay), delta, font=font(16, True), fill=POWER_RED)
        ay += 36
    hotzone_tag(draw, mx0 + 32, my0 + 745, "热区·属性预览")

    # Breakthrough button
    rr(draw, [mx0 + 80, my0 + 790, mx1 - 80, my0 + 870], 28, fill=GOLD, outline=UI_NAVY, width=3)
    center_text(draw, "立即突破", W // 2, my0 + 830, font(28, True), UI_NAVY)
    hotzone_tag(draw, mx0 + 80, my0 + 880, "热区·突破按钮")

    # Close
    draw.ellipse([mx1 - 48, my0 + 16, mx1 - 16, my0 + 48], outline=INK_MUTED, width=2)
    center_text(draw, "×", mx1 - 32, my0 + 32, font(22, True), INK_MUTED)

    # Bottom hint
    center_text(draw, "弹层覆盖野外主界面 · 点击遮罩可关闭", W // 2, my1 + 40, font(14), WHITE)

    path = os.path.join(OUT, "feixian_02_breakthrough_wire.png")
    img.convert("RGB").save(path, "PNG", optimize=True)
    return path

# ============================================================
# 03 Equipment
# ============================================================
def make_03_equip():
    img = Image.new("RGBA", (W, H), (245, 248, 252, 255))
    draw = ImageDraw.Draw(img)
    status_bar(draw)
    rr(draw, [W // 2 - 140, 8, W // 2 + 140, 40], 8, fill=UI_NAVY)
    center_text(draw, "03 装备页线框", W // 2, 24, font(16, True), WHITE)

    # Top power delta
    rr(draw, [24, 56, W - 24, 120], 14, fill=UI_NAVY)
    center_text(draw, "战力  8050  →  8320", W // 2 - 40, 78, font(24, True), WHITE)
    center_text(draw, "+270", W // 2 + 160, 78, font(24, True), GOLD)
    center_text(draw, "热区·战力变化", W // 2, 105, font(12), GOLD_LT)

    # Doll / slots area
    rr(draw, [24, 140, W - 24, 520], 18, fill=PANEL, outline=WIRE, width=2)
    center_text(draw, "人偶槽位", W // 2, 165, font(18, True), INK_MUTED)

    # Center doll
    draw.ellipse([W // 2 - 70, 240, W // 2 + 70, 380], fill=(200, 210, 230), outline=UI_NAVY, width=3)
    center_text(draw, "主角", W // 2, 310, font(22, True), UI_NAVY)

    # Equipment slots around doll
    slots = [
        (80, 200, "武器"),
        (W - 160, 200, "头盔"),
        (80, 320, "铠甲"),
        (W - 160, 320, "靴子"),
        (80, 430, "饰品"),
        (W - 160, 430, "法宝"),
    ]
    for sx, sy, name in slots:
        rr(draw, [sx, sy, sx + 80, sy + 80], 12, fill=(235, 240, 248), outline=GOLD, width=2)
        center_text(draw, name, sx + 40, sy + 40, font(16, True), UI_NAVY)
    hotzone_tag(draw, 24, 505, "热区·人偶槽位")

    # Equipment list
    rr(draw, [24, 540, W - 24, 980], 18, fill=PANEL, outline=WIRE, width=2)
    draw.text((44, 555), "装备列表", font=font(20, True), fill=INK)
    hotzone_tag(draw, 160, 555, "热区·列表")

    items = [
        ("青锋剑", "武器 · 蓝", "攻+45", True),
        ("布衣", "铠甲 · 白", "防+12", False),
        ("疾风靴", "靴子 · 绿", "速+8", False),
        ("聚灵戒", "饰品 · 蓝", "灵+20", False),
    ]
    iy = 595
    for name, typ, stat, sel in items:
        bg = (230, 242, 255) if sel else (248, 250, 252)
        ol = BTN_PRIMARY if sel else WIRE
        rr(draw, [44, iy, W - 44, iy + 78], 12, fill=bg, outline=ol, width=2)
        rr(draw, [56, iy + 12, 112, iy + 68], 8, fill=DISABLED_BG, outline=WIRE, width=1)
        center_text(draw, "图标", 84, iy + 40, font(12), INK_MUTED)
        draw.text((128, iy + 14), name, font=font(20, True), fill=INK)
        draw.text((128, iy + 44), typ, font=font(14), fill=INK_MUTED)
        draw.text((W - 160, iy + 28), stat, font=font(18, True), fill=BTN_OK)
        iy += 90

    # Wear button
    rr(draw, [80, 1000, W - 80, 1080], 28, fill=BTN_PRIMARY, outline=UI_NAVY, width=2)
    center_text(draw, "穿戴", W // 2, 1040, font(28, True), WHITE)
    hotzone_tag(draw, 80, 1088, "热区·穿戴按钮")

    # Mini tab bar
    tab_y = H - 110
    draw.rectangle([0, tab_y, W, H], fill=PANEL)
    draw.line([0, tab_y, W, tab_y], fill=WIRE, width=2)
    for i, (name, on) in enumerate([("装备", True), ("玩法", False), ("设置", False)]):
        cx = 120 + i * 240
        fill = BTN_PRIMARY if on else DISABLED_BG
        draw.ellipse([cx - 24, tab_y + 16, cx + 24, tab_y + 64], fill=fill, outline=UI_NAVY if on else DISABLED, width=2)
        center_text(draw, name, cx, tab_y + 80, font(16, True), UI_NAVY if on else DISABLED)

    path = os.path.join(OUT, "feixian_03_equip_wire.png")
    img.convert("RGB").save(path, "PNG", optimize=True)
    return path

# ============================================================
# 04 Tab bar states
# ============================================================
def make_04_tabbar():
    img = Image.new("RGBA", (W, H), (245, 248, 252, 255))
    draw = ImageDraw.Draw(img)
    status_bar(draw)
    rr(draw, [W // 2 - 160, 8, W // 2 + 160, 40], 8, fill=UI_NAVY)
    center_text(draw, "04 底栏状态说明", W // 2, 24, font(16, True), WHITE)

    center_text(draw, "底栏导航 · 可点态 vs 灰态", W // 2, 80, font(26, True), UI_NAVY)
    center_text(draw, "MVP：装备 / 玩法 / 设置 可点", W // 2, 120, font(18), BTN_OK)
    center_text(draw, "法术 / 异兽 / 洞天 / 仙盟 灰 +「即将开放」", W // 2, 150, font(16), DISABLED)

    # Active section
    rr(draw, [24, 190, W - 24, 520], 18, fill=PANEL, outline=BTN_OK, width=3)
    draw.text((44, 210), "✓ 可点态（Active）", font=font(22, True), fill=BTN_OK)
    actives = [
        ("装备", "入口 · 人偶与穿戴", BTN_PRIMARY),
        ("玩法", "野外主界面（当前）", BTN_OK),
        ("设置", "音效/账号/反馈", GOLD),
    ]
    ay = 260
    for name, desc, col in actives:
        draw.ellipse([56, ay, 120, ay + 64], fill=col, outline=UI_NAVY, width=2)
        center_text(draw, name[0], 88, ay + 32, font(22, True), WHITE if col != GOLD else UI_NAVY)
        draw.text((140, ay + 12), name, font=font(22, True), fill=INK)
        draw.text((140, ay + 42), desc, font=font(16), fill=INK_MUTED)
        rr(draw, [W - 160, ay + 16, W - 48, ay + 48], 12, fill=(220, 245, 230), outline=BTN_OK, width=1)
        center_text(draw, "可点击", W - 104, ay + 32, font(14, True), BTN_OK)
        ay += 80

    # Disabled section
    rr(draw, [24, 550, W - 24, 1000], 18, fill=PANEL, outline=DISABLED, width=3)
    draw.text((44, 570), "◌ 灰态（Disabled）", font=font(22, True), fill=DISABLED)
    grays = ["法术", "异兽", "洞天", "仙盟"]
    gy = 630
    for name in grays:
        draw.ellipse([56, gy, 120, gy + 64], fill=DISABLED_BG, outline=DISABLED, width=2)
        center_text(draw, name[0], 88, gy + 32, font(22, True), DISABLED)
        # lock mark
        draw.ellipse([100, gy + 4, 120, gy + 24], fill=DISABLED)
        draw.text((140, gy + 12), name, font=font(22, True), fill=DISABLED)
        draw.text((140, gy + 42), "功能未开放 · 点击提示即将开放", font=font(14), fill=INK_MUTED)
        rr(draw, [W - 200, gy + 16, W - 48, gy + 48], 12, fill=DISABLED_BG, outline=DISABLED, width=1)
        center_text(draw, "即将开放", W - 124, gy + 32, font(14, True), DISABLED)
        gy += 85

    # Full bar preview at bottom
    draw.text((24, 1020), "完整六格预览（参考原版节奏，MVP 设置替仙盟可点位）：", font=font(14), fill=INK_MUTED)
    tabs = [
        ("装备", True), ("法术", False), ("异兽", False),
        ("玩法", True), ("洞天", False), ("设置", True),
    ]
    tab_y = 1060
    tw = W // 6
    rr(draw, [8, tab_y, W - 8, H - 24], 16, fill=PANEL, outline=WIRE, width=2)
    for i, (name, on) in enumerate(tabs):
        cx = tw * i + tw // 2
        if on:
            fill, ol, tf = (220, 235, 255), BTN_PRIMARY, UI_NAVY
        else:
            fill, ol, tf = DISABLED_BG, DISABLED, DISABLED
        draw.ellipse([cx - 26, tab_y + 20, cx + 26, tab_y + 72], fill=fill, outline=ol, width=2)
        center_text(draw, name[0], cx, tab_y + 46, font(18, True), tf)
        center_text(draw, name, cx, tab_y + 90, font(14, True), tf)
        if not on:
            center_text(draw, "灰", cx, tab_y + 112, font(11), DISABLED)

    # Note 仙盟
    draw.text((24, H - 36), "注：原版第六格为「仙盟」；MVP 改为「设置」可点，仙盟并入灰态。",
              font=font(12), fill=INK_MUTED)

    path = os.path.join(OUT, "feixian_04_tabbar_states.png")
    img.convert("RGB").save(path, "PNG", optimize=True)
    return path

# ============================================================
# 05 Palette
# ============================================================
def make_05_palette():
    img = Image.new("RGBA", (W, H), (250, 250, 252, 255))
    draw = ImageDraw.Draw(img)
    status_bar(draw)
    rr(draw, [W // 2 - 100, 8, W // 2 + 100, 40], 8, fill=UI_NAVY)
    center_text(draw, "05 色板", W // 2, 24, font(16, True), WHITE)

    center_text(draw, "feixian-mvp 设计色板", W // 2, 80, font(28, True), UI_NAVY)
    center_text(draw, "中保真线框 · 统一 Design Tokens", W // 2, 115, font(16), INK_MUTED)

    swatches = [
        ("草地绿", GRASS, "#A8C48C", "野外主场景底色"),
        ("草地深绿", GRASS_DK, "#8CA870", "地形层次/阴影"),
        ("UI 深蓝", UI_NAVY, "#1A2A44", "顶栏/面板深底"),
        ("深蓝次级", UI_NAVY2, "#243858", "头像/圆形容器"),
        ("UI 金", GOLD, "#D4A848", "高亮描边/重要按钮"),
        ("战力红", POWER_RED, "#DC4040", "战力数字/伤害"),
        ("灰禁用", DISABLED, "#9498A0", "不可点 Tab/锁"),
        ("灰底", DISABLED_BG, "#D2D6DC", "禁用按钮底"),
        ("按钮主色", BTN_PRIMARY, "#488CDC", "穿戴/主 CTA"),
        ("成功绿", BTN_OK, "#48B078", "自动开/玩法选中"),
        ("正文墨", INK, "#202834", "标题与正文"),
        ("次级灰字", INK_MUTED, "#646E7C", "说明/弱信息"),
    ]

    y = 150
    for name, rgb, hexv, usage in swatches:
        rr(draw, [32, y, W - 32, y + 78], 14, fill=PANEL, outline=WIRE, width=2)
        rr(draw, [48, y + 12, 128, y + 66], 10, fill=rgb, outline=(0, 0, 0, 40), width=1)
        # checker for contrast label
        tcol = WHITE if sum(rgb) < 400 else INK
        center_text(draw, "", 88, y + 39, font(12), tcol)
        draw.text((148, y + 14), name, font=font(20, True), fill=INK)
        draw.text((148, y + 42), f"{hexv}  ·  {usage}", font=font(14), fill=INK_MUTED)
        # hex badge
        rr(draw, [W - 160, y + 24, W - 48, y + 54], 8, fill=(240, 242, 246), outline=WIRE, width=1)
        center_text(draw, hexv, W - 104, y + 39, font(14, True), UI_NAVY)
        y += 90

    path = os.path.join(OUT, "feixian_05_palette.png")
    img.convert("RGB").save(path, "PNG", optimize=True)
    return path

# ============================================================
# 06 Placeholders
# ============================================================
def make_06_placeholders():
    img = Image.new("RGBA", (W, H), (240, 244, 248, 255))
    draw = ImageDraw.Draw(img)
    status_bar(draw)
    rr(draw, [W // 2 - 150, 8, W // 2 + 150, 40], 8, fill=UI_NAVY)
    center_text(draw, "06 替身素材示意", W // 2, 24, font(16, True), WHITE)

    center_text(draw, "占位剪影 · 尺寸建议", W // 2, 75, font(26, True), UI_NAVY)
    center_text(draw, "简模 Q 版 · 非最终立绘", W // 2, 110, font(16), INK_MUTED)

    # ---- Hero silhouette ----
    rr(draw, [24, 140, W - 24, 480], 18, fill=PANEL, outline=WIRE, width=2)
    draw.text((44, 155), "① 主角 Q 版剪影", font=font(20, True), fill=INK)
    draw.text((44, 185), "建议尺寸：256×256 px（展示）/ 512×512 px（源）", font=font(14), fill=INK_MUTED)

    # body silhouette
    hx, hy = W // 2, 360
    # head
    draw.ellipse([hx - 50, hy - 160, hx + 50, hy - 60], fill=(80, 100, 140))
    # body
    draw.ellipse([hx - 70, hy - 70, hx + 70, hy + 60], fill=(80, 100, 140))
    # legs hint
    draw.ellipse([hx - 55, hy + 40, hx - 5, hy + 90], fill=(60, 80, 120))
    draw.ellipse([hx + 5, hy + 40, hx + 55, hy + 90], fill=(60, 80, 120))
    # arms
    draw.ellipse([hx - 100, hy - 40, hx - 55, hy + 20], fill=(70, 90, 130))
    draw.ellipse([hx + 55, hy - 40, hx + 100, hy + 20], fill=(70, 90, 130))
    center_text(draw, "主角", hx, hy - 20, font(18, True), WHITE)
    # size bracket
    draw.line([hx + 120, hy - 160, hx + 120, hy + 90], fill=HOTZONE, width=2)
    draw.text((hx + 128, hy - 50), "≈220px高\n(1080p屏)", font=font(14), fill=HOTZONE)

    # ---- Monster ----
    rr(draw, [24, 500, W - 24, 820], 18, fill=PANEL, outline=WIRE, width=2)
    draw.text((44, 515), "② 野外怪剪影", font=font(20, True), fill=INK)
    draw.text((44, 545), "建议尺寸：192×192 px（展示）/ 384×384 px（源）", font=font(14), fill=INK_MUTED)

    mx, my = W // 2, 700
    # blob monster
    draw.ellipse([mx - 80, my - 70, mx + 80, my + 60], fill=(140, 70, 70))
    draw.ellipse([mx - 40, my - 110, mx + 40, my - 40], fill=(160, 80, 80))  # head
    # eyes
    draw.ellipse([mx - 28, my - 90, mx - 8, my - 70], fill=WHITE)
    draw.ellipse([mx + 8, my - 90, mx + 28, my - 70], fill=WHITE)
    draw.ellipse([mx - 22, my - 84, mx - 14, my - 76], fill=BLACK)
    draw.ellipse([mx + 14, my - 84, mx + 22, my - 76], fill=BLACK)
    # horns
    draw.polygon([(mx - 50, my - 90), (mx - 70, my - 140), (mx - 30, my - 100)], fill=(100, 50, 50))
    draw.polygon([(mx + 50, my - 90), (mx + 70, my - 140), (mx + 30, my - 100)], fill=(100, 50, 50))
    center_text(draw, "怪", mx, my, font(18, True), WHITE)
    draw.line([mx + 120, my - 130, mx + 120, my + 60], fill=HOTZONE, width=2)
    draw.text((mx + 128, my - 50), "≈180px高\n同屏1~3只", font=font(14), fill=HOTZONE)

    # ---- Drop icons ----
    rr(draw, [24, 840, W - 24, 1180], 18, fill=PANEL, outline=WIRE, width=2)
    draw.text((44, 855), "③ 掉落图标占位", font=font(20, True), fill=INK)
    draw.text((44, 885), "建议尺寸：64×64 / 128×128 px", font=font(14), fill=INK_MUTED)

    drops = [("金币", GOLD), ("灵石", BTN_OK), ("装备", BTN_PRIMARY), ("丹药", POWER_RED)]
    dx = 70
    for name, col in drops:
        rr(draw, [dx, 940, dx + 100, 1040], 16, fill=col, outline=UI_NAVY, width=2)
        # dashed inner
        rr(draw, [dx + 12, 952, dx + 88, 1028], 10, outline=WHITE, width=2)
        center_text(draw, name, dx + 50, 990, font(16, True), WHITE if sum(col) < 500 else UI_NAVY)
        center_text(draw, "64²", dx + 50, 1060, font(14), INK_MUTED)
        dx += 150

    draw.text((44, 1090), "掉落飘字建议：伤害/暴击用战力红；拾取用金色。", font=font(14), fill=INK_MUTED)
    draw.text((44, 1120), "导出格式：PNG 透明底；命名 hero_q.png / mob_field_01.png / drop_*.png", font=font(13), fill=INK_MUTED)

    path = os.path.join(OUT, "feixian_06_placeholders.png")
    img.convert("RGB").save(path, "PNG", optimize=True)
    return path


def main():
    os.makedirs(OUT, exist_ok=True)
    paths = []
    for fn in (make_01_field, make_02_breakthrough, make_03_equip,
               make_04_tabbar, make_05_palette, make_06_placeholders):
        p = fn()
        print("Wrote", p, os.path.getsize(p))
        paths.append(p)
    return paths

if __name__ == "__main__":
    main()
