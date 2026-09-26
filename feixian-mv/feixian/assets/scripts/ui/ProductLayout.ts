/** 720×1280，原点在画布中心，Y 向上。 */
export const DESIGN_W = 720;
export const DESIGN_H = 1280;
export const UI_2D = 33554432;
export const SAFE_X = 16;

/**
 * 布局常量。顶/底贴边元素（HUD、Tab、聊天）的 Y 由各 View 按
 * `uiHalfHeight()` 动态锚定，此处只保留相对尺寸与中部区域坐标。
 */
export const PL = {
    /** 顶栏只放角色摘要、资源和战力，避免侵入关卡信息区。 */
    /** HUD 皮肤原始宽高比为 3:1，720 宽时必须使用 240 高以避免拉伸。 */
    hudH: 240,
    /** PNG 顶部自带透明留白，整体上移后装饰刚好贴齐安全区。 */
    hudOffsetY: 32,

    /** HUD 下方的连续三层：关卡名 → 进度轨 → 单一主线任务。 */
    stageTitleY: 408,
    stageRailY: 354,
    questBannerY: 286,
    stageTitleW: 520,
    stageRailW: 340,
    questBannerW: 560,
    questBannerH: 72,

    /** 侧栏 X 由各 View 按 uiHalfWidth() 计算 */
    /** 以 360px 实机截图为基准：图标最小显示 38px，标签最小显示 10px。 */
    sideIcon: 92,
    sideSlotH: 126,
    sideGap: 118,
    sideTopY: 218,
    cornerBtn: 90,
    cornerY: 432,
    chestY: -8,

    /** 左右下侧快捷功能（境界/自动、快速战斗/自动挑战） */
    quickBtn: 94,
    quickFightY: -214,
    quickChallengeY: -318,
    realmOrb: 104,
    realmOrbY: -218,
    autoBtn: 88,
    autoBtnY: -326,

    floatY: 78,
    heroX: -88,
    heroY: -48,
    charSize: 122,
    mobBird: 112,
    mobTurtle: 116,

    /** 放在聊天条上方，保持中部战斗区完全开放。 */
    actionDockY: -205,
    actionDockW: 660,
    actionDockH: 184,

    chatW: 680,
    chatH: 80,

    /** 底栏皮肤原始宽高比为 3:1，720 宽时 240 高不变形。 */
    tabBarH: 240,
};
