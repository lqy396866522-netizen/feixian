import {
    _decorator, Component, Node, UITransform, Graphics, Label, Color, Vec3,
    Widget, Button, view, ResolutionPolicy, BlockInputEvents, Overflow, Sprite, SpriteFrame, resources, assetManager, ImageAsset, Texture2D,
    tween, UIOpacity, profiler, input, Input, EventKeyboard, EventMouse, KeyCode,
} from 'cc';
import { GameModel } from './GameModel';
import { CombatLoop, CombatEvent } from './CombatLoop';
import { EquipItem, EquipSlot, SLOT_LABELS } from './GameTypes';
import { SaveSystem } from './SaveSystem';
import { SfxPlayer } from './SfxPlayer';
import { TabId } from './ui/TabTypes';
import { UiFactory } from './ui/UiFactory';
import { HudTopView } from './ui/HudTopView';
import { SideRailsView } from './ui/SideRailsView';
import { StageQuestView } from './ui/StageQuestView';
import { CombatHudView } from './ui/CombatHudView';
import { WorldHpBarsView } from './ui/WorldHpBarsView';
import { ActionDockView } from './ui/ActionDockView';
import { TabBarView } from './ui/TabBarView';
import { MenuOverlayView } from './ui/MenuOverlayView';
import { WorldChatBarView } from './ui/WorldChatBarView';
import { RolePageView } from './ui/RolePageView';
import { AlliancePageView } from './ui/AlliancePageView';
import { PL } from './ui/ProductLayout';
import { framePixelSize, sizeContain, uiFullWidth, uiHalfHeight } from './ui/SpriteLayout';
const { ccclass } = _decorator;

const UI_2D = 33554432;
const DESIGN_W = 720;
const DESIGN_H = 1280;
const CHAR_SIZE = 180; // ~25% of design width 720
const WORLD_TILE_W = 720;
const WORLD_TILE_H = 1280;
const WORLD_COLS = 6;
const WORLD_ROWS = 6;
const WORLD_W = WORLD_TILE_W * WORLD_COLS;
const WORLD_H = WORLD_TILE_H * WORLD_ROWS;
const WORLD_HALF_W = WORLD_W / 2;
const WORLD_HALF_H = WORLD_H / 2;
/** 使用已裁切的 v2 精灵后，以“有效主体高度”而非原始 PNG 画布决定比例。 */
const HERO_W = 172;
const HERO_H = 196;
const MOB_BIRD_W = 102;
const MOB_BIRD_H = 112;
const MOB_TURTLE_W = 108;
const MOB_TURTLE_H = 108;
const AUTO_ATTACK_RANGE = 210;

const EQUIP_ICON: Record<string, string> = {
    weapon: 'textures/icons/equip_weapon',
    armor: 'textures/icons/equip_armor',
    helmet: 'textures/icons/equip_helm',
    boots: 'textures/icons/equip_boots',
    accessory: 'textures/icons/equip_ring',
    artifact: 'textures/icons/equip_gloves',
};

const C = {
    grass: new Color(168, 196, 140, 255),
    grassDk: new Color(140, 168, 112, 255),
    sky: new Color(196, 220, 196, 255),
    navy: new Color(26, 42, 68, 255),
    navy2: new Color(36, 56, 88, 255),
    gold: new Color(212, 168, 72, 255),
    goldLt: new Color(240, 210, 130, 255),
    cyan: new Color(120, 200, 220, 255),
    red: new Color(220, 64, 64, 255),
    disabled: new Color(148, 152, 160, 255),
    disabledBg: new Color(210, 214, 220, 255),
    primary: new Color(72, 140, 220, 255),
    ok: new Color(72, 176, 120, 255),
    tabOn: new Color(46, 204, 113, 255), // #2ECC71
    tabGlyph: new Color(232, 244, 255, 255), // #E8F4FF
    white: new Color(255, 255, 255, 255),
    ink: new Color(32, 40, 52, 255),
    inkMuted: new Color(100, 110, 124, 255),
    panel: new Color(255, 255, 255, 240),
    hero: new Color(72, 140, 220, 255),
    monster: new Color(220, 80, 80, 255),
    chat: new Color(40, 48, 60, 200),
    hot: new Color(220, 90, 50, 255),
};

@ccclass('MainGame')
export class MainGame extends Component {
    private model!: GameModel;
    private loop!: CombatLoop;
    private uiLayer = UI_2D;
    private root!: Node;
    private tab: TabId = 'play';

    private lblGold!: Label;
    private lblLing!: Label;
    private lblJade!: Label;
    private lblPower!: Label;
    private lblTopPower!: Label;
    private lootPanel!: Node;
    private lblLoot!: Label;
    private lootTimer = 0;
    private lblRealm!: Label;
    private lblName!: Label;
    private lblStage!: Label;
    private lblStageProg!: Label;
    private lblMonName!: Label;
    private lblFloat!: Label;
    private lblChat!: Label;
    private playRoot!: Node;
    private equipRoot!: Node;
    private spellsRoot!: Node;
    private settingsRoot!: Node;
    private beastsRoot!: Node;
    private lblBeastName!: Label;
    private lblBeastPower!: Label;
    private beastSpNode!: Node;
    private sfxIconNode!: Node;
    private lblSfx!: Label;
    private chestBtn!: Node;
    private lblChest!: Label;
    private skillCd = 0;
    private heroNode!: Node;
    private mobNode!: Node;
    /** Task2: flock of wild monsters on the map */
    private wildMobs: Node[] = [];
    private fieldNode!: Node;
    private layerBg!: Node;
    private layerDecor!: Node;
    private layerActors!: Node;
    private layerFx!: Node;
    private layerReadout!: Node;
    private layerHud!: Node;
    /** 可移动的大地图根节点；HUD 不放在此节点下，因而不会随镜头移动。 */
    private worldRoot!: Node;
    private groundDropRoot!: Node;
    private attackFxNode: Node | null = null;
    private slashFrames: (SpriteFrame | null)[] = [null, null, null];
    private dropGoldSf: SpriteFrame | null = null;
    private dropEquipSf: SpriteFrame | null = null;
    private heroBaseY = 30;
    private grayToast!: Label;
    private toastTimer = 0;
    private floatTimer = 0;
    private persistAcc = 0;
    private tabDots: Record<TabId, Node> = {} as any;
    private tabLabels: Record<TabId, Label> = {} as any;
    private selectedItemId: string | null = null;
    private lblEquipPower!: Label;
    private equipListNode!: Node;
    private slotLabels: Partial<Record<EquipSlot, Label>> = {};
    private wearBtnLabel!: Label;
    private sfx!: SfxPlayer;
    private uf!: UiFactory;
    private hudTop!: HudTopView;
    private sideRails!: SideRailsView;
    private stageQuest!: StageQuestView;
    private combatHud!: CombatHudView;
    private worldHpBars!: WorldHpBarsView;
    private actionDock!: ActionDockView;
    private tabBarView!: TabBarView;
    private menuOverlay!: MenuOverlayView;
    private chatBar!: WorldChatBarView;
    private rolePage!: RolePageView;
    private alliancePage!: AlliancePageView;
    private breakthroughOverlay!: Node;
    private sideEquipDot!: Node;
    private goldPulseNode!: Node;
    private chatAcc = 0;
    private wildMobBaseY: number[] = [];
    private pressedKeys = new Set<number>();
    private moveTarget: Vec3 | null = null;
    private readonly heroMoveSpeed = 480;

    onLoad() {
        try { profiler.hideStats(); } catch (_) { /* preview */ }
        // SHOW_ALL：等比缩放，完整显示 720 宽 UI，避免窄屏左右裁切与非等比压扁
        view.setDesignResolutionSize(DESIGN_W, DESIGN_H, ResolutionPolicy.SHOW_ALL);
        this.uiLayer = this.node.layer || UI_2D;
        this.model = new GameModel();
        this.sfx = new SfxPlayer(this.node);
        this.sfx.setEnabled(this.model.sfxEnabled);
        this.model.playSfxHook = (n) => this.sfx.play(n || 'click');
        this.loop = new CombatLoop(this.model);
        this.loop.onTick = (ev) => this.onCombat(ev);
        if (this.model.save.killsInStage >= this.model.save.killsNeeded) {
            this.model.chestReady = true;
        }
        this.buildUI();
        this.relayoutChrome();
        view.on('canvas-resize', this.relayoutChrome, this);
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.on(Input.EventType.KEY_UP, this.onKeyUp, this);
        this.preloadFxAssets();
        this.refreshAll();
        console.log('[MainGame] 飞仙 MVP 启动, 战力=', this.model.combatPower, '关卡=', this.model.stageTitle);
    }

    onDestroy() {
        view.off('canvas-resize', this.relayoutChrome, this);
        input.off(Input.EventType.KEY_DOWN, this.onKeyDown, this);
        input.off(Input.EventType.KEY_UP, this.onKeyUp, this);
        this.model && this.model.persist();
    }

    /** 画布尺寸变化后重锚定贴边 UI：顶栏贴顶、聊天/Tab 贴底、底色铺满可见区 */
    private relayoutChrome() {
        if (!this.root?.isValid) return;
        const hh = uiHalfHeight();
        const rootUi = this.root.getComponent(UITransform);
        if (rootUi) {
            rootUi.setContentSize(uiFullWidth(), hh * 2);
            this.fill(this.root, C.sky, 0);
        }
        if (this.hudTop?.refs?.root?.isValid) this.hudTop.refs.root.setPosition(0, hh - PL.hudH / 2 + PL.hudOffsetY, 0);
        if (this.tabBarView?.barRoot?.isValid) this.tabBarView.barRoot.setPosition(0, -hh + PL.tabBarH / 2, 0);
        if (this.chatBar?.root?.isValid) {
            this.chatBar.root.setPosition(0, -hh + PL.tabBarH + PL.chatH / 2 + 10, 0);
        }
    }

    update(dt: number) {
        this.updateWorldMovement(dt);
        this.updateWorldCamera(dt);
        this.loop.update(dt, this.hasAutoAttackTarget());
        if (this.skillCd > 0) this.skillCd -= dt;
        if (this.chestBtn) this.chestBtn.active = !!this.model.chestReady;
        if (this.lootTimer > 0) {
            this.lootTimer -= dt;
            if (this.lootTimer <= 0 && this.lootPanel) this.lootPanel.active = false;
        }
        this.persistAcc += dt;
        if (this.persistAcc > 4) {
            this.persistAcc = 0;
            this.model.maybePersist();
        }
        if (this.toastTimer > 0) {
            this.toastTimer -= dt;
            if (this.toastTimer <= 0 && this.grayToast) this.grayToast.node.active = false;
        }
        if (this.floatTimer > 0) {
            this.floatTimer -= dt;
            if (this.floatTimer <= 0) this.combatHud?.clearFloat();
        }
        this.chatAcc += dt;
        if (this.chatBar && this.chatAcc > 8) {
            if (this.chatBar.tick(this.chatAcc)) this.chatAcc = 0;
        }
        const t = performance.now() * 0.001;
        this.wildMobs.forEach((m, i) => {
            if (!m?.isValid || !m.active) return;
            const base = this.wildMobBaseY[i];
            if (base == null) return;
            m.setPosition(m.position.x, base + Math.sin(t * 1.1 + i * 0.7) * 5, 0);
        });
        if (this.tab === 'play') {
            this.layoutActors();
            this.syncWorldHpBars();
        }
    }

    private pulseGoldBar() {
        if (!this.goldPulseNode?.isValid) return;
        tween(this.goldPulseNode).to(0.08, { scale: new Vec3(1.08, 1.08, 1) }).to(0.12, { scale: new Vec3(1, 1, 1) }).start();
    }

    private onCombat(ev: CombatEvent) {
        if (ev.dodge) {
            this.showFloat('闪避', C.ok);
        } else if (ev.dmgToMonster > 0) {
            this.showFloat(`-${ev.dmgToMonster}`, C.red);
            this.playAttackFx();
            this.model.playSfx('hit');
        }
        // Task3: ground drop + tiny toast (no big settlement modal)
        if (ev.killed) {
            this.spawnGroundLoot(!!ev.cleared);
            this.refreshAll();
            this.respawnWildVisual();
        } else if (ev.cleared) {
            this.refreshAll();
        } else {
            this.refreshCombatHud();
        }
    }


    private preloadFxAssets() {
        const slashPaths = ['textures/fx/slash_f1_v3', 'textures/fx/slash_f2_v3', 'textures/fx/slash_f3_v3'];
        slashPaths.forEach((path, i) => {
            resources.load(path + '/spriteFrame', SpriteFrame, (err, sf) => {
                if (!err && sf) this.slashFrames[i] = sf;
                else console.warn('[fx] slash preload fail', path, err);
            });
        });
        resources.load('textures/fx/drop_gold_v3/spriteFrame', SpriteFrame, (err, sf) => {
            if (!err && sf) this.dropGoldSf = sf; else console.warn('[fx] drop_gold preload fail', err);
        });
        resources.load('textures/fx/drop_equip/spriteFrame', SpriteFrame, (err, sf) => {
            if (!err && sf) this.dropEquipSf = sf; else console.warn('[fx] drop_equip preload fail', err);
        });
    }

    private nearestWildMob(): Node | null {
        if (!this.heroNode?.isValid) return this.wildMobs.find((m) => m?.isValid && m.active) ?? null;
        let best: Node | null = null;
        let bestD = 1e9;
        for (const m of this.wildMobs) {
            if (!m?.isValid || !m.active) continue;
            const d = Vec3.distance(this.heroNode.position, m.position);
            if (d < bestD) { bestD = d; best = m; }
        }
        return best;
    }

    /** 自动攻击只在地图上确实有野怪且处于攻击范围时触发。 */
    private hasAutoAttackTarget(): boolean {
        const target = this.nearestWildMob();
        return !!target && !!this.heroNode?.isValid
            && Vec3.distance(this.heroNode.position, target.position) <= AUTO_ATTACK_RANGE;
    }

    private syncWorldHpBars() {
        if (!this.worldHpBars) return;
        this.worldHpBars.sync(this.model, this.heroNode ?? null, this.nearestWildMob());
    }

    private showFloat(text: string, color: Color) {
        if (!this.combatHud) return;
        const mob = this.nearestWildMob();
        if (mob?.isValid) {
            const ui = mob.getComponent(UITransform)!;
            const p = mob.position;
            this.combatHud.showFloatAt(p.x + 18, p.y + ui.height + 28, text, color);
        } else if (this.heroNode?.isValid) {
            const h = this.heroNode.getComponent(UITransform)?.height ?? HERO_H;
            this.combatHud.showFloatAt(this.heroNode.position.x + 40, this.heroNode.position.y + h + 40, text, color);
        }
        this.floatTimer = 0.7;
    }

    private showToast(msg: string) {
        if (!this.grayToast) return;
        this.grayToast.string = msg;
        this.grayToast.node.active = true;
        this.grayToast.node.setSiblingIndex(999);
        this.toastTimer = 1.4;
    }

    // ---------- builders ----------
    private mk(name: string, parent: Node, w: number, h: number, x: number, y: number): Node {
        const n = new Node(name);
        n.layer = this.uiLayer;
        n.parent = parent;
        const ui = n.addComponent(UITransform);
        ui.setContentSize(w, h);
        ui.setAnchorPoint(0.5, 0.5);
        n.setPosition(x, y, 0);
        return n;
    }

    private fill(n: Node, color: Color, r = 12) {
        let g = n.getComponent(Graphics);
        if (!g) g = n.addComponent(Graphics);
        g.clear();
        g.fillColor = color;
        const ui = n.getComponent(UITransform)!;
        const w = ui.width, h = ui.height;
        g.roundRect(-w / 2, -h / 2, w, h, r);
        g.fill();
        return g;
    }

    private circle(n: Node, color: Color, radius?: number) {
        let g = n.getComponent(Graphics);
        if (!g) g = n.addComponent(Graphics);
        g.clear();
        g.fillColor = color;
        const ui = n.getComponent(UITransform)!;
        const rad = radius ?? Math.min(ui.width, ui.height) / 2;
        g.circle(0, 0, rad);
        g.fill();
        return g;
    }

    private label(parent: Node, text: string, size: number, color: Color, x: number, y: number, w = 200, h = 40, bold = false): Label {
        const n = this.mk('lbl', parent, w, h, x, y);
        const l = n.addComponent(Label);
        l.string = text;
        l.fontSize = size;
        l.lineHeight = size + 4;
        l.color = color;
        l.overflow = Overflow.SHRINK;
        l.enableWrapText = false;
        l.isBold = bold;
        l.horizontalAlign = Label.HorizontalAlign.CENTER;
        l.verticalAlign = Label.VerticalAlign.CENTER;
        return l;
    }

    private click(n: Node, fn: () => void) {
        let btn = n.getComponent(Button);
        if (!btn) btn = n.addComponent(Button);
        btn.transition = Button.Transition.SCALE;
        btn.zoomScale = 0.96;
        n.on(Button.EventType.CLICK, fn, this);
        n.on(Node.EventType.TOUCH_END, fn, this);
        return btn;
    }

    private buildUI() {
        // Canvas-sized root (Creator Canvas is 720x1280 after settings)
        const canvasUi = this.node.getComponent(UITransform);
        if (canvasUi) canvasUi.setContentSize(DESIGN_W, DESIGN_H);

        // SHOW_ALL 下竖屏可能有上下额外线盒，根底色铺满可见区避免露黑边
        this.root = this.mk('Root', this.node, uiFullWidth(), uiHalfHeight() * 2, 0, 0);
        this.fill(this.root, C.sky, 0);

        this.playRoot = this.mk('PlayRoot', this.root, DESIGN_W, DESIGN_H, 0, 0);
        this.spellsRoot = this.mk('SpellsRoot', this.root, DESIGN_W, DESIGN_H - 200, 0, 20);
        this.spellsRoot.active = false;
        this.settingsRoot = this.mk('SettingsRoot', this.root, DESIGN_W, DESIGN_H, 0, 0);
        this.settingsRoot.active = false;
        this.beastsRoot = this.mk('BeastsRoot', this.root, DESIGN_W, DESIGN_H, 0, 0);
        this.beastsRoot.active = false;
        this.equipRoot = this.mk('EquipRoot', this.root, DESIGN_W, DESIGN_H, 0, 0);
        this.equipRoot.active = false;

        this.uf = new UiFactory(this.uiLayer);
        this.buildPlay();
        this.buildProductShell();
        this.buildSpells();
        this.buildBeasts();
        this.buildEquip();
        this.buildRoleAlliancePages();
        this.buildTopBar();
        this.buildTabBar();
        this.buildChestBtn();

        this.grayToast = this.label(this.root, '', 22, C.white, 0, 80, 520, 56, true);
        this.fill(this.grayToast.node, C.navy, 16);
        this.grayToast.node.active = false;
        this.grayToast.node.setSiblingIndex(999);
        this.buildLootPanel();
        this.buildBreakthroughOverlay();
    }

    private buildProductShell() {
        this.sideRails = new SideRailsView(this.uf, this.layerHud, (m) => this.showToast(m), {
            onCity: () => this.showToast('主城未开放'),
            onWorldMap: () => this.showToast('世界地图未开放'),
            onRealm: () => this.openBreakthroughOverlay(),
            onAuto: () => { this.model.toggleAuto(); this.refreshAll(); },
        });
        this.sideRails.build();
        this.stageQuest = new StageQuestView(this.uf, this.layerHud);
        this.stageQuest.build();
        this.combatHud = new CombatHudView(this.uf, this.layerReadout);
        this.combatHud.build();
        this.worldHpBars = new WorldHpBarsView(this.uf, this.layerReadout);
        this.worldHpBars.build();
        this.lblFloat = this.combatHud.lblFloat;
        this.lblStage = this.stageQuest.lblStage;
        this.lblStageProg = this.stageQuest.lblStageProg;
        this.actionDock = new ActionDockView(
            this.uf,
            this.layerHud,
            (t) => this.showToast(t),
        );
        this.actionDock.build();
        this.chatBar = new WorldChatBarView(this.uf, this.root);
        this.chatBar.build();
        this.chatBar.root.setSiblingIndex(899);
        this.lblChat = this.chatBar.lbl;
        this.menuOverlay = new MenuOverlayView(this.uf, this.root);
        this.menuOverlay.build(
            () => this.onToggleSfx(),
            () => this.menuOverlay.close(),
            () => this.rebuildAfterClearSave(),
        );
    }

    private buildRoleAlliancePages() {
        this.rolePage = new RolePageView(this.uf, this.root, (id) => this.setTab(id));
        this.rolePage.build();
        this.alliancePage = new AlliancePageView(this.uf, this.root, (id) => this.setTab(id), (m) => this.showToast(m));
        this.alliancePage.build();
    }

    private rebuildAfterClearSave() {
        this.model = new GameModel();
        this.loop.model = this.model;
        this.loop.onTick = (ev) => this.onCombat(ev);
        this.sfx.setEnabled(this.model.sfxEnabled);
        this.model.playSfxHook = (n) => this.sfx.play(n || 'click');
        this.setTab('play');
        this.refreshAll();
        this.showToast('存档已清除');
    }

    private buildBreakthroughOverlay() {
        this.breakthroughOverlay = this.mk('BreakOverlay', this.root, DESIGN_W, DESIGN_H, 0, 0);
        this.breakthroughOverlay.addComponent(BlockInputEvents);
        this.breakthroughOverlay.active = false;
        this.fill(this.mk('dim', this.breakthroughOverlay, DESIGN_W, DESIGN_H, 0, 0), new Color(12, 18, 28, 180), 0);
        const panel = this.mk('brkPanel', this.breakthroughOverlay, 624, 880, 0, 40);
        this.uf.tryLoadSpriteBg(panel, 'textures/ui/product/panel_frame', 624, 880, () => {
            this.fill(panel, new Color(255, 255, 255, 230), 24);
        });
        this.loadSprite(this.mk('brkArt', panel, 624, 880, 0, 0), 'textures/ui/breakthrough', 624, 880, false, false);
        this.label(panel, '境界突破', 32, C.navy, 0, 380, 300, 48, true);
        this.label(panel, '—', 26, C.navy, 0, 250, 520, 40, true).node.name = 'lblBrkRealm';
        this.label(panel, '—', 16, C.white, 0, 140, 400, 28, true).node.name = 'lblBrkProg';
        this.label(panel, '—', 22, C.ok, 0, 40, 520, 36, true).node.name = 'lblBrkCost';
        const cancel = this.mk('brkCancel', panel, 200, 52, -120, -120);
        this.fill(cancel, C.disabledBg, 12);
        this.label(cancel, '取消', 22, C.ink, 0, 0, 160, 40, true);
        this.click(cancel, () => this.closeBreakthroughOverlay());
        const okBtn = this.mk('brkOk', panel, 200, 52, 120, -120);
        this.fill(okBtn, C.primary, 12);
        this.label(okBtn, '确认突破', 22, C.white, 0, 0, 180, 40, true);
        this.click(okBtn, () => {
            if (!this.model.tryBreakthrough()) this.showToast('灵石或进度不足');
            else {
                this.model.playSfx('break');
                this.showToast('突破成功！');
            }
            this.closeBreakthroughOverlay();
            this.refreshAll();
        });
        this.click(this.breakthroughOverlay.getChildByName('dim')!, () => this.closeBreakthroughOverlay());
    }

    private openBreakthroughOverlay() {
        if (!this.breakthroughOverlay) return;
        this.refreshBreakthroughOverlay();
        this.breakthroughOverlay.active = true;
        this.breakthroughOverlay.setSiblingIndex(998);
    }

    private closeBreakthroughOverlay() {
        if (this.breakthroughOverlay) this.breakthroughOverlay.active = false;
    }

    private refreshBreakthroughOverlay() {
        if (!this.breakthroughOverlay) return;
        const panel = this.breakthroughOverlay.getChildByName('brkPanel');
        if (!panel) return;
        const m = this.model;
        const s = m.save;
        const need = m.nextBreakthroughNeed();
        const cost = m.nextBreakthroughCost();
        const findLbl = (n: string) => panel.getChildByName(n)?.getComponent(Label);
        const lr = findLbl('lblBrkRealm');
        if (lr) lr.string = m.realmText;
        const lp = findLbl('lblBrkProg');
        const exp = Math.min(s.realmExp, need);
        if (lp) lp.string = `${exp} / ${need}`;
        const lc = findLbl('lblBrkCost');
        if (lc) lc.string = `灵石 × ${cost}（持有 ${s.lingshi}）`;
    }

    private buildLootPanel() {
        // Task3: tiny bottom toast — no full-screen settlement modal
        this.lootPanel = this.mk('LootPanel', this.root, 320, 52, 0, -40);
        this.fill(this.lootPanel, new Color(12, 18, 30, 210), 12);
        this.lblLoot = this.label(this.lootPanel, '', 18, C.goldLt, 0, 0, 300, 40, true);
        this.lblLoot.overflow = Overflow.SHRINK;
        this.lootPanel.active = false;
        this.lootPanel.setSiblingIndex(998);
    }

    private showLootPanel(cleared: boolean) {
        this.spawnGroundLoot(cleared);
    }

    private spawnGroundLoot(cleared: boolean) {
        const loot = this.model.lastLoot;
        if (!loot) return;
        const tip = [cleared ? '通关' : '击杀', '+' + loot.gold + '金', loot.equip ? loot.equip.name : '']
            .filter(Boolean).join(' · ');
        this.lblLoot.string = tip;
        this.lootPanel.active = true;
        this.lootTimer = 1.1;

        if (!this.groundDropRoot?.isValid) return;
        const hx = this.heroNode ? this.heroNode.position.x : 0;
        const baseX = hx + 40 + (Math.random() - 0.5) * 80;
        const baseY = this.heroBaseY + 20 + Math.random() * 40;
        // 常规掉落仅以轻量提示表现，避免金币堆叠遮住角色和目标；装备掉落仍保留实体反馈。
        this.pulseGoldBar();
        if (loot.equip) {
            this.spawnOneDrop(baseX + 56, baseY + 8, 'textures/fx/drop_equip', loot.equip.name, C.cyan);
        }
    }

    private spawnOneDrop(x: number, y: number, tex: string, tip: string, tipColor: Color, pulseGold = false) {
        const parent = this.groundDropRoot;
        const n = this.mk('gdrop', parent, 72, 72, x, y);
        const cached = tex.indexOf('drop_gold_v3') >= 0 ? this.dropGoldSf : (tex.indexOf('drop_equip') >= 0 ? this.dropEquipSf : null);
        if (cached) this.applySpriteFrame(n, cached, 64, 64, true);
        else this.loadSprite(n, tex, 64, 64, true);
        this.label(n, tip, 14, tipColor, 0, 40, 120, 22, true);
        n.setScale(0.5, 0.5, 1);
        const hero = this.heroNode;
        tween(n)
            .to(0.16, { scale: new Vec3(1.2, 1.2, 1) }, { easing: 'backOut' })
            .to(0.1, { scale: new Vec3(1, 1, 1) })
            .delay(0.28)
            .to(0.38, {
                position: new Vec3(hero.position.x, hero.position.y + 50, 0),
                scale: new Vec3(0.25, 0.25, 1),
            }, { easing: 'sineIn' })
            .call(() => {
                if (n.isValid) n.destroy();
                if (pulseGold) this.pulseGoldBar();
            })
            .start();
    }

    private playAttackFx() {
        if (!this.heroNode?.isValid || !this.playRoot?.isValid) return;
        if (this.attackFxNode?.isValid) {
            this.attackFxNode.active = false;
            this.attackFxNode.destroy();
        }
        const hp = this.heroNode.position;
        const target = this.nearestWildMob();
        const th = target?.getComponent(UITransform)?.height ?? PL.mobBird;
        const tx = target?.isValid ? target.position.x - 20 : hp.x + 90;
        const ty = target?.isValid ? target.position.y + th * 0.55 : hp.y + PL.charSize * 0.45;
        const FX = Math.round(PL.charSize * 0.95);
        const fx = this.mk('atkFx', this.layerFx, FX, FX, (hp.x + tx) * 0.5, (hp.y + ty) * 0.5 + 20);
        this.attackFxNode = fx;
        fx.getComponent(UITransform)!.setAnchorPoint(0.15, 0.5);
        const sp = fx.addComponent(Sprite);
        sp.sizeMode = Sprite.SizeMode.CUSTOM;
        sp.type = Sprite.Type.SIMPLE;
        fx.getComponent(UITransform)!.setContentSize(FX, FX);
        const apply = (i: number) => {
            const sf = this.slashFrames[i];
            if (sf && fx.isValid && fx.active) sp.spriteFrame = sf;
        };
        apply(0);
        const step = 0.1; // 3×0.1s ≤ 0.35s
        tween(fx)
            .delay(step).call(() => apply(1))
            .delay(step).call(() => apply(2))
            .delay(step)
            .call(() => {
                if (!fx.isValid) return;
                fx.active = false;
                fx.destroy();
                if (this.attackFxNode === fx) this.attackFxNode = null;
            })
            .start();
        const base = hp.clone();
        tween(this.heroNode)
            .to(0.06, { position: new Vec3(base.x + 22, base.y + 6, 0) })
            .to(0.08, { position: base })
            .start();
    }

    private walkHeroToNearestMob() {
        if (!this.heroNode?.isValid || this.wildMobs.length === 0) return;
        let best: Node | null = null;
        let bestD = 1e9;
        for (const m of this.wildMobs) {
            if (!m?.isValid || !m.active) continue;
            const d = Vec3.distance(this.heroNode.position, m.position);
            if (d < bestD) { bestD = d; best = m; }
        }
        if (!best) return;
        // 自动战斗时也复用玩家移动系统，避免 Tween 与键盘/鼠标输入争夺角色坐标。
        this.moveTarget = this.clampWorldPoint(new Vec3(best.position.x - 100, best.position.y, 0));
        if (this.mobNode?.isValid) {
            this.mobNode.setPosition(best.position.x, best.position.y, 0);
        }
    }

    private respawnWildVisual() {
        const alive = this.wildMobs.filter((m) => m?.isValid);
        if (!alive.length) return;
        const victim = alive[Math.floor(Math.random() * alive.length)];
        tween(victim)
            .to(0.12, { scale: new Vec3(0.05, 0.05, 1) })
            .call(() => {
                if (!victim.isValid) return;
                const hx2 = this.heroNode?.isValid ? this.heroNode.position.x : PL.heroX;
                const nx = hx2 + 88 + Math.random() * 95;
                const hy2 = this.heroNode?.isValid ? this.heroNode.position.y : this.heroBaseY;
                const ny = hy2 - 6 + Math.random() * 48;
                victim.setPosition(nx, ny, 0);
                victim.setScale(1, 1, 1);
                this.layoutActors();
            })
            .start();
    }

    /** 背景 < 装饰 < 地面单位(近大远小靠 sibling) < 特效 < 血条/飘字 < HUD */
    private layoutActors() {
        const list: Node[] = this.wildMobs.filter((m) => m?.isValid);
        if (this.heroNode?.isValid) list.push(this.heroNode);
        list.sort((a, b) => b.position.y - a.position.y);
        list.forEach((n, i) => n.setSiblingIndex(i));
        const hx = this.heroNode?.isValid ? this.heroNode.position.x : PL.heroX;
        // hero 的 X 缩放由移动方向决定，不能在排序时重置。
        if (this.heroNode?.isValid) {
            const face = this.heroNode.scale.x < 0 ? -1 : 1;
            this.heroNode.setScale(face, Math.abs(this.heroNode.scale.y) || 1, 1);
        }
        for (const m of this.wildMobs) {
            if (!m?.isValid || Math.abs(m.scale.x) < 0.35) continue;
            const faceLeft = m.position.x >= hx;
            m.setScale(faceLeft ? -Math.abs(m.scale.x) : Math.abs(m.scale.x), Math.abs(m.scale.y) || 1, 1);
        }
    }


    private buildTopBar() {
        this.hudTop = new HudTopView(
            this.uf,
            this.root,
            () => this.menuOverlay.open(this.model),
            () => this.showToast('商城未开放'),
            () => this.showToast('战力排行未开放'),
        );
        const refs = this.hudTop.build();
        this.lblGold = refs.lblGold;
        this.lblLing = refs.lblLing;
        this.lblJade = refs.lblJade;
        this.lblName = refs.lblName;
        this.lblRealm = refs.lblRealm;
        this.lblPower = refs.lblPower;
        this.lblTopPower = refs.lblTopPower;
        this.goldPulseNode = refs.goldPulseNode;
        refs.root.setSiblingIndex(900);
    }


    /**
     * 6×6 由同一张主图切出的地图块。每块都保留原始 720×1280 像素，
     * 因此相邻边缘不经过二次采样，能够像一张完整大地图一样无缝衔接。
     */
    private buildWorldTiles(parent: Node) {
        for (let row = 0; row < WORLD_ROWS; row++) {
            for (let col = 0; col < WORLD_COLS; col++) {
                const x = -WORLD_HALF_W + WORLD_TILE_W * (col + 0.5);
                const y = WORLD_HALF_H - WORLD_TILE_H * (row + 0.5);
                const tile = this.mk(`map_${row}_${col}`, parent, WORLD_TILE_W, WORLD_TILE_H, x, y);
                this.uf.loadSprite(tile, `textures/bg/world/field_play_q_${row}_${col}`, WORLD_TILE_W, WORLD_TILE_H, false, () => {
                    console.warn('[world] missing map tile', row, col);
                }, false);
            }
        }
    }

    private onKeyDown(event: EventKeyboard) {
        const key = event.keyCode;
        if ([KeyCode.KEY_W, KeyCode.KEY_A, KeyCode.KEY_S, KeyCode.KEY_D,
            KeyCode.ARROW_UP, KeyCode.ARROW_DOWN, KeyCode.ARROW_LEFT, KeyCode.ARROW_RIGHT].includes(key)) {
            this.pressedKeys.add(key);
            this.moveTarget = null;
        }
    }

    private onKeyUp(event: EventKeyboard) {
        this.pressedKeys.delete(event.keyCode);
    }

    private onWorldMouseDown(event: EventMouse) {
        if (event.getButton() !== EventMouse.BUTTON_LEFT || this.tab !== 'play') return;
        const point = event.getUILocation();
        const screen = this.playRoot.getComponent(UITransform)!.convertToNodeSpaceAR(new Vec3(point.x, point.y, 0));
        this.moveTarget = this.clampWorldPoint(new Vec3(
            screen.x - this.worldRoot.position.x,
            screen.y - this.worldRoot.position.y,
            0,
        ));
    }

    private clampWorldPoint(point: Vec3) {
        const padding = 96;
        return new Vec3(
            Math.max(-WORLD_HALF_W + padding, Math.min(WORLD_HALF_W - padding, point.x)),
            Math.max(-WORLD_HALF_H + padding, Math.min(WORLD_HALF_H - padding, point.y)),
            0,
        );
    }

    /** 键盘优先；松开键盘后继续执行最近一次鼠标点地移动。 */
    private updateWorldMovement(dt: number) {
        if (this.tab !== 'play' || !this.heroNode?.isValid) return;
        let x = 0;
        let y = 0;
        if (this.pressedKeys.has(KeyCode.KEY_A) || this.pressedKeys.has(KeyCode.ARROW_LEFT)) x -= 1;
        if (this.pressedKeys.has(KeyCode.KEY_D) || this.pressedKeys.has(KeyCode.ARROW_RIGHT)) x += 1;
        if (this.pressedKeys.has(KeyCode.KEY_W) || this.pressedKeys.has(KeyCode.ARROW_UP)) y += 1;
        if (this.pressedKeys.has(KeyCode.KEY_S) || this.pressedKeys.has(KeyCode.ARROW_DOWN)) y -= 1;

        if (x === 0 && y === 0 && this.moveTarget) {
            x = this.moveTarget.x - this.heroNode.position.x;
            y = this.moveTarget.y - this.heroNode.position.y;
            if (Math.hypot(x, y) < 3) {
                this.moveTarget = null;
                return;
            }
        }
        const length = Math.hypot(x, y);
        if (length <= 0) return;
        const step = Math.min(this.heroMoveSpeed * dt, this.moveTarget ? length : this.heroMoveSpeed * dt);
        const next = this.clampWorldPoint(new Vec3(
            this.heroNode.position.x + x / length * step,
            this.heroNode.position.y + y / length * step,
            0,
        ));
        this.heroNode.setPosition(next);
        if (Math.abs(x) > 0.01) this.heroNode.setScale(x < 0 ? -1 : 1, 1, 1);
        this.layoutActors();
    }

    /** 角色永远位于世界坐标，镜头仅移动 worldRoot；屏幕 UI 不受影响。 */
    private updateWorldCamera(dt: number) {
        if (!this.worldRoot?.isValid || !this.heroNode?.isValid) return;
        const targetX = Math.max(-(WORLD_HALF_W - DESIGN_W / 2), Math.min(WORLD_HALF_W - DESIGN_W / 2, -this.heroNode.position.x));
        const targetY = Math.max(-(WORLD_HALF_H - DESIGN_H / 2), Math.min(WORLD_HALF_H - DESIGN_H / 2, -this.heroNode.position.y));
        const t = Math.min(1, dt * 9);
        this.worldRoot.setPosition(
            this.worldRoot.position.x + (targetX - this.worldRoot.position.x) * t,
            this.worldRoot.position.y + (targetY - this.worldRoot.position.y) * t,
            0,
        );
    }

    private buildPlay() {
        const r = this.playRoot;
        this.worldRoot = this.mk('WorldRoot', r, WORLD_W, WORLD_H, 0, 0);
        // 鼠标事件只绑定到世界根，侧栏/按钮等 HUD 为同级节点，不会触发点地移动。
        this.worldRoot.on(Node.EventType.MOUSE_DOWN, this.onWorldMouseDown, this);
        const mkWorldLayer = (name: string) => {
            const n = this.mk(name, this.worldRoot, WORLD_W, WORLD_H, 0, 0);
            const g = n.getComponent(Graphics);
            if (g) g.enabled = false;
            return n;
        };
        this.layerBg = mkWorldLayer('LayerBg');
        this.layerDecor = mkWorldLayer('LayerDecor');
        this.layerActors = mkWorldLayer('LayerActors');
        this.layerFx = mkWorldLayer('LayerFx');
        this.layerReadout = mkWorldLayer('LayerReadout');
        this.layerHud = this.mk('LayerHud', r, DESIGN_W, DESIGN_H, 0, 0);

        this.buildWorldTiles(this.layerBg);

        // P4：只压低地图背景的亮度/饱和感。该层位于地图之上、角色之下，
        // 因而不会让角色、怪物、HP 条或特效一起变暗。
        const field = this.mk('Field', this.layerDecor, WORLD_W, WORLD_H, 0, 0);
        this.fieldNode = field;
        this.fill(field, new Color(14, 38, 24, 64), 0);

        this.groundDropRoot = this.mk('drops', this.layerFx, WORLD_W, WORLD_H, 0, 0);
        const dg = this.groundDropRoot.getComponent(Graphics);
        if (dg) dg.enabled = false;

        const heroY = -120;
        this.heroBaseY = heroY;
        this.wildMobs = [];
        this.wildMobBaseY = [];
        const hx = 0;
        // 保持野怪之间至少一个主体宽度：战斗画面读起来是“主角对阵怪群”，而非贴在一起的蓝色块。
        const mobSpots: [number, number][] = [
            [hx + 158, heroY + 66],
            [hx + 252, heroY + 4],
            [hx + 194, heroY - 80],
        ];
        for (let i = 0; i < mobSpots.length; i++) {
            const [mx, my] = mobSpots[i];
            const isTurtle = (i % 3) === 1;
            const w = isTurtle ? MOB_TURTLE_W : MOB_BIRD_W;
            const h = isTurtle ? MOB_TURTLE_H : MOB_BIRD_H;
            const tex = isTurtle ? 'textures/chars/mob_turtle_v2' : 'textures/chars/mob_bird_v2';
            const mob = this.mk('wild' + i, this.layerActors, w, h, mx, my);
            mob.getComponent(UITransform)!.setAnchorPoint(0.5, 0);
            const ph = this.mk('wildPh', mob, w, h, 0, h / 2);
            this.circle(ph, C.monster);
            this.loadSprite(mob, tex, w, h, true);
            this.wildMobs.push(mob);
            this.wildMobBaseY.push(my);
        }

        this.heroNode = this.mk('hero', this.layerActors, HERO_W, HERO_H, hx, heroY);
        this.heroNode.getComponent(UITransform)!.setAnchorPoint(0.5, 0);
        const heroPh = this.mk('heroPh', this.heroNode, HERO_W, HERO_H, 0, HERO_H / 2);
        this.circle(heroPh, C.hero);
        this.uf.loadSprite(this.heroNode, 'textures/chars/hero_v2', HERO_W, HERO_H, true, () => {
            this.loadSprite(this.heroNode, 'textures/chars/hero', HERO_W, HERO_H, true);
        });

        this.mobNode = this.mk('mon', this.layerActors, 1, 1, 80, heroY);
        this.mobNode.active = false;
        this.layoutActors();
    }

    private buildEquip() {
        const r = this.equipRoot;
        this.fill(this.mk('eqBg', r, DESIGN_W, DESIGN_H, 0, 0), new Color(230, 236, 244, 255), 0);
        const shell = this.mk('eqShell', r, 680, 900, 0, 40);
        this.uf.tryLoadSpriteBg(shell, 'textures/ui/product/panel_frame', 680, 900, () => {
            this.fill(shell, new Color(255, 255, 255, 0), 0);
        });

        const power = this.mk('eqPower', r, 680, 70, 0, 500);
        this.uf.tryLoadSpriteBg(power, 'textures/ui/product/bar_power', 680, 70, () => this.fill(power, C.navy, 16));
        this.lblEquipPower = this.label(power, '战力 0', 26, C.goldLt, 0, 0, 640, 50, true);

        const doll = this.mk('doll', r, 680, 280, 0, 300);
        this.fill(doll, C.white, 18);
        this.label(doll, '人偶槽位', 20, C.inkMuted, 0, 120, 200, 28);
        const hero = this.mk('eqHero', doll, 100, 100, 0, 10);
        this.circle(hero, C.hero);
        this.label(hero, '主角', 22, C.white, 0, 0, 90, 30, true);

        // design: icon ~76% slotH, row gap tightened ~10px, icon-text gap 8px
        const SLOT_H = 56;
        const ICON = Math.round(SLOT_H * 0.76); // ~43
        const slots: { slot: EquipSlot; x: number; y: number }[] = [
            { slot: 'weapon', x: -220, y: 60 },
            { slot: 'armor', x: -220, y: 0 },
            { slot: 'accessory', x: -220, y: -60 },
            { slot: 'helmet', x: 220, y: 60 },
            { slot: 'boots', x: 220, y: 0 },
            { slot: 'artifact', x: 220, y: -60 },
        ];
        slots.forEach((s) => {
            const box = this.mk('slot' + s.slot, doll, 160, SLOT_H, s.x, s.y);
            this.fill(box, new Color(236, 240, 246, 255), 10);
            const iconX = -52;
            const icon = this.mk('ico' + s.slot, box, ICON, ICON, iconX, 0);
            this.loadSprite(icon, EQUIP_ICON[s.slot], ICON, ICON, false);
            // icon right = iconX + ICON/2; +8px gap → label center
            const labelX = iconX + ICON / 2 + 8 + 48;
            const lb = this.label(box, SLOT_LABELS[s.slot], 16, C.ink, labelX, 0, 96, 40);
            lb.horizontalAlign = Label.HorizontalAlign.LEFT;
            this.slotLabels[s.slot] = lb;
        });
        // doll center uses hero skin
        this.loadSprite(hero, 'textures/chars/hero', 100, 100, false);

        this.equipListNode = this.mk('eqList', r, 680, 360, 0, -40);
        this.fill(this.equipListNode, C.white, 18);
        this.label(this.equipListNode, '装备列表', 20, C.inkMuted, -240, 155, 160, 28);

        const wear = this.mk('wear', r, 280, 64, 0, -260);
        this.fill(wear, C.primary, 18);
        this.wearBtnLabel = this.label(wear, '穿戴', 26, C.white, 0, 0, 240, 50, true);
        this.click(wear, () => {
            if (!this.selectedItemId) {
                this.showToast('请先选择装备');
                return;
            }
            this.model.wear(this.selectedItemId);
            this.refreshAll();
        });
    }

    private rebuildEquipList() {
        if (!this.equipListNode) return;
        // remove old rows
        const keep = new Set(['eqList', 'Graphics', 'Label']);
        const children = this.equipListNode.children.slice();
        for (const c of children) {
            if (c.name.startsWith('row_')) c.destroy();
        }
        const items = this.model.save.inventory;
        items.forEach((it, i) => {
            const y = 100 - i * 62;
            const row = this.mk('row_' + it.id, this.equipListNode, 640, 56, 0, y);
            const selected = this.selectedItemId === it.id;
            this.fill(row, selected ? new Color(200, 220, 245, 255) : new Color(244, 246, 250, 255), 10);
            const worn = this.model.save.equipped[it.slot] === it.id;
            const stat = this.statText(it);
            this.label(row, `${it.name}  ${SLOT_LABELS[it.slot]}·${it.quality}${worn ? '  [已穿]' : ''}  ${stat}`, 18, C.ink, 0, 0, 620, 40);
            this.click(row, () => {
                this.selectedItemId = it.id;
                this.refreshAll();
            });
        });
    }

    private statText(it: EquipItem): string {
        const parts: string[] = [];
        if (it.atk) parts.push(`攻+${it.atk}`);
        if (it.def) parts.push(`防+${it.def}`);
        if (it.spd) parts.push(`速+${it.spd}`);
        if (it.spirit) parts.push(`灵+${it.spirit}`);
        return parts.join(' ');
    }



    private buildBeasts() {
        const r = this.beastsRoot;
        this.fill(this.mk('beastBg', r, DESIGN_W, DESIGN_H, 0, 0), new Color(220, 232, 220, 255), 0);
        const shell = this.mk('beastShell', r, 640, 720, 0, 80);
        this.uf.tryLoadSpriteBg(shell, 'textures/ui/product/panel_frame', 640, 720, () => {
            this.fill(shell, C.panel, 20);
        });
        this.label(r, '异兽', 28, C.ink, 0, 520, 200, 40, true);

        // platform
        const stage = this.mk('beastStage', r, 560, 420, 0, 120);
        this.fill(stage, C.white, 20);
        const pad = this.mk('pad', stage, 220, 40, 0, -140);
        this.circle(pad, new Color(180, 200, 170, 255));

        // ~55% panel / ~300; sink feet ~10px toward pad
        this.beastSpNode = this.mk('beastSp', stage, 300, 300, 0, -30);
        this.beastSpNode.getComponent(UITransform)!.setAnchorPoint(0.5, 0);
        this.loadSprite(this.beastSpNode, 'textures/chars/beast_fox', 300, 300, true);

        // name/power below pad (not over chest)
        this.lblBeastName = this.label(stage, '青蔓灵狐', 26, C.ink, 0, -175, 280, 40, true);
        this.lblBeastPower = this.label(stage, '战力 1260', 22, C.red, 0, -210, 280, 36, true);


        // actions
        const deploy = this.mk('deploy', r, 200, 56, -140, -200);
        this.fill(deploy, C.primary, 14);
        this.label(deploy, '上阵', 24, C.white, 0, 0, 180, 40, true);
        this.click(deploy, () => {
            this.model.deployBeast('beast_fox');
            this.showToast('已上阵 青蔓灵狐');
            this.refreshBeastPage();
            this.model.playSfx('click');
        });
        const swap = this.mk('swap', r, 200, 56, 140, -200);
        this.fill(swap, C.navy2, 14);
        this.label(swap, '更换', 24, C.white, 0, 0, 180, 40, true);
        this.click(swap, () => this.showToast('MVP 仅 1 只异兽'));

        // locked
        const grow = this.mk('grow', r, 200, 56, -140, -280);
        this.fill(grow, C.disabledBg, 14);
        this.label(grow, '养成', 22, C.disabled, 0, 0, 180, 40, true);
        this.click(grow, () => this.showToast('养成未开放'));
        const skill = this.mk('skill', r, 200, 56, 140, -280);
        this.fill(skill, C.disabledBg, 14);
        this.label(skill, '技能', 22, C.disabled, 0, 0, 180, 40, true);
        this.click(skill, () => this.showToast('技能未开放'));
    }

    private refreshBeastPage() {
        const b = this.model.getActiveBeast();
        if (this.lblBeastName) this.lblBeastName.string = b ? b.name : '未上阵';
        if (this.lblBeastPower) this.lblBeastPower.string = b ? `战力 ${b.power}` : '战力 —';
    }

    private buildSettings() {
        const r = this.settingsRoot;
        this.fill(this.mk('setBg', r, DESIGN_W, DESIGN_H, 0, 0), new Color(230, 236, 244, 255), 0);
        this.label(r, '设置', 28, C.ink, 0, 520, 200, 40, true);

        const row = this.mk('sfxRow', r, 640, 56, 0, 360);
        this.fill(row, C.white, 14);
        this.sfxIconNode = this.mk('sfxIcon', row, 36, 36, -280, 0);
        const on = this.model.sfxEnabled;
        this.loadSprite(this.sfxIconNode, on ? 'textures/icons/sfx_on' : 'textures/icons/sfx_off', 36, 36, false);
        this.label(row, '音效', 22, C.ink, -200, 0, 120, 40, true);
        this.lblSfx = this.label(row, on ? '开' : '关', 22, on ? C.ok : C.disabled, 220, 0, 80, 40, true);
        const btn = this.mk('sfxBtn', row, 120, 44, 280, 0);
        this.fill(btn, C.primary, 12);
        this.label(btn, '切换', 20, C.white, 0, 0, 100, 36, true);
        this.click(btn, () => this.onToggleSfx());
        this.click(row, () => this.onToggleSfx());
    }

    private onToggleSfx() {
        const on = this.model.toggleSfx();
        this.sfx.setEnabled(on);
        this.menuOverlay?.refreshSfx(on);
        this.showToast(on ? '音效已开启' : '音效已关闭');
        this.model.playSfx('click');
    }

    private buildTabBar() {
        this.tabBarView = new TabBarView(this.uf, this.root, (id) => this.setTab(id));
        this.tabBarView.build();
        this.tabBarView.barRoot.setSiblingIndex(901);
        this.tabDots = this.tabBarView.tabDots as Record<TabId, Node>;
        this.tabLabels = this.tabBarView.tabLabels as Record<TabId, Label>;
        this.tabBarView.refresh(this.tab);
        const eqTab = this.tabDots.equip;
        if (eqTab) this.sideEquipDot = this.uf.addRedDot(eqTab, 28, 28);
    }

    private buildSpells() {
        const r = this.spellsRoot;
        this.fill(r, new Color(24, 32, 48, 240), 0);
        const shell = this.mk('spellShell', r, 640, 720, 0, 80);
        this.uf.tryLoadSpriteBg(shell, 'textures/ui/product/panel_frame', 640, 720, () => {
            this.fill(shell, C.panel, 20);
        });
        this.label(r, '法术', 28, C.goldLt, 0, 520, 200, 40, true);
        this.label(r, '已解锁主动技 1/1', 18, C.inkMuted, 0, 470, 300, 30, true);
        const card = this.mk('skill1', r, 560, 180, 0, 200);
        this.fill(card, C.navy2, 16);
        this.label(card, '破邪斩', 26, C.white, -160, 40, 200, 36, true);
        this.label(card, '对当前野怪造成 220% 攻击伤害\n冷却 8 秒', 18, C.goldLt, 40, 0, 360, 80, true);
        const btn = this.mk('cast', card, 140, 52, 180, -50);
        this.fill(btn, C.primary, 12);
        this.label(btn, '施放', 22, C.white, 0, 0, 120, 40, true);
        this.click(btn, () => this.castSkill());
        const back = this.mk('backSpell', r, 160, 48, 0, -520);
        this.fill(back, C.ok, 12);
        this.label(back, '回野外', 20, C.white, 0, 0, 140, 40, true);
        this.click(back, () => this.setTab('play'));
    }

    private castSkill() {
        if (this.skillCd > 0) {
            this.showToast('技能冷却中 ' + Math.ceil(this.skillCd) + 's');
            return;
        }
        const dmg = Math.max(1, Math.floor(this.model.playerAtk() * 2.2));
        this.model.monsterHp = Math.max(0, this.model.monsterHp - dmg);
        this.skillCd = 8;
        this.showToast('破邪斩 -' + dmg);
        if (this.model.monsterHp <= 0) {
            this.model.onMonsterKilled();
            let cleared = false;
            if (this.model.save.killsInStage >= this.model.save.killsNeeded) {
                this.model.chestReady = true;
                cleared = true;
            } else {
                this.model.spawnMonster();
            }
            this.onCombat({ dmgToMonster: dmg, dmgToPlayer: 0, dodge: false, killed: true, cleared });
        }
        this.refreshAll();
    }

    
    private applySpriteFrame(node: Node, sf: SpriteFrame, boxW: number, boxH: number, footAnchor: boolean, preserveAspect = true) {
        const sp = node.getComponent(Sprite) || node.addComponent(Sprite);
        const ui = node.getComponent(UITransform) || node.addComponent(UITransform);
        sp.spriteFrame = sf;
        sp.sizeMode = Sprite.SizeMode.CUSTOM;
        sp.type = Sprite.Type.SIMPLE;
        // keep PNG alpha
        try {
            const gfx = (sp as any);
            if (gfx.color) gfx.color = new Color(255, 255, 255, 255);
        } catch (_) {}
        if (footAnchor) ui.setAnchorPoint(0.5, 0);
        else ui.setAnchorPoint(0.5, 0.5);
        let w = boxW;
        let h = boxH;
        if (preserveAspect) {
            const fp = framePixelSize(sf);
            const fit = sizeContain(boxW, boxH, fp.w, fp.h);
            w = fit.w;
            h = fit.h;
        }
        ui.setContentSize(w, h);
        // Hide circle/rect Graphics placeholder once real art is on
        const g = node.getComponent(Graphics);
        if (g) g.enabled = false;
        for (const child of [...node.children]) {
            if (child.name.toLowerCase().includes('ph')) {
                child.active = false;
                continue;
            }
            if (child.getComponent(Label)) {
                child.setSiblingIndex(node.children.length - 1);
            }
        }
        console.log('[skin] ok', node.name, w, h, 'foot=', footAnchor);
    }

    private loadSprite(node: Node, path: string, w: number, h: number, footAnchor = false, preserveAspect = true) {
        const ui = node.getComponent(UITransform) || node.addComponent(UITransform);
        if (footAnchor) ui.setAnchorPoint(0.5, 0);
        ui.setContentSize(w, h);
        const tryApply = (sf: SpriteFrame | null | undefined, via: string) => {
            if (!sf) return false;
            this.applySpriteFrame(node, sf, w, h, footAnchor, preserveAspect);
            console.log('[skin] loaded via', via, path);
            return true;
        };
        const fromImage = (img: ImageAsset, via: string) => {
            // Prefer engine helper so alpha (RGBA8888) is preserved
            let frame: SpriteFrame | null = null;
            const anySF = SpriteFrame as any;
            if (typeof anySF.createWithImage === 'function') {
                frame = anySF.createWithImage(img) as SpriteFrame;
            } else {
                const tex = new Texture2D();
                tex.image = img;
                frame = new SpriteFrame();
                frame.texture = tex;
            }
            return tryApply(frame, via);
        };
        // Prefer spriteFrame first (RGBA alpha). Texture→new SpriteFrame often loses alpha → white grid.
        resources.load(path + '/spriteFrame', SpriteFrame, (errSf, sf) => {
            if (!errSf && tryApply(sf, 'resources/spriteFrame')) return;
            console.warn('[skin] spriteFrame fail', path, errSf && (errSf as any).message);
            resources.load(path, ImageAsset, (errImg, img) => {
                if (!errImg && img && fromImage(img, 'resources/ImageAsset')) return;
                console.warn('[skin] ImageAsset fail', path, errImg && (errImg as any).message);
                resources.load(path + '/texture', Texture2D, (errTex, tex) => {
                    if (!errTex && tex) {
                        const frame = new SpriteFrame();
                        frame.texture = tex;
                        if (tryApply(frame, 'resources/texture')) return;
                    }
                    console.warn('[skin] all load paths failed', path);
                });
            });
        });
    }

    private buildChestBtn() {
        this.chestBtn = this.sideRails.chestBtn;
        this.lblChest = this.label(this.chestBtn, '宝箱', 14, C.navy, 0, 0, 60, 24, true);
        this.click(this.chestBtn, () => {
            if (this.model.tryOpenChest()) {
                this.model.playSfx('break');
                this.showLootPanel(true);
                this.pulseGoldBar();
                this.refreshAll();
            }
        });
    }

    private setTab(id: TabId) {
        if (id === 'cave') {
            this.showToast('洞天未开放');
            return;
        }
        this.tab = id;
        this.model.playSfx('click');
        this.playRoot.active = id === 'play';
        this.equipRoot.active = id === 'equip';
        if (this.spellsRoot) this.spellsRoot.active = id === 'spells';
        if (this.beastsRoot) this.beastsRoot.active = id === 'beasts';
        if (this.rolePage?.root) this.rolePage.root.active = id === 'role';
        if (this.alliancePage?.root) this.alliancePage.root.active = id === 'alliance';
        if (this.settingsRoot) this.settingsRoot.active = false;
        this.tabBarView?.refresh(id);
        if (this.lootPanel) this.lootPanel.active = false;
        if (id === 'equip') this.rebuildEquipList();
        if (id === 'beasts') this.refreshBeastPage();
        if (id === 'role') this.rolePage?.refresh(this.model);
        this.refreshAll();
    }

    private refreshCombatHud() {
        const wild = this.wildMobs.filter((m) => m?.isValid && m.active).length;
        this.combatHud?.refresh(this.model, Math.max(1, wild));
        this.syncWorldHpBars();
    }

    private refreshAll() {
        const m = this.model;
        this.hudTop?.refresh(m);
        this.sideRails?.refresh(m);
        this.stageQuest?.refresh(m);
        this.actionDock?.refresh(m, this.skillCd);
        if (this.lblRealm) this.lblRealm.string = m.realmText;
        if (this.sideEquipDot) this.sideEquipDot.active = m.hasBetterEquip();
        if (this.breakthroughOverlay?.active) this.refreshBreakthroughOverlay();
        if (this.lblEquipPower) this.lblEquipPower.string = `战力 ${m.combatPower}`;
        (Object.keys(SLOT_LABELS) as EquipSlot[]).forEach((slot) => {
            const lb = this.slotLabels[slot];
            if (!lb) return;
            const it = m.getEquipped(slot);
            lb.string = it ? `${SLOT_LABELS[slot]}\n${it.name}` : SLOT_LABELS[slot];
        });
        this.refreshCombatHud();
        this.tabBarView?.refresh(this.tab);
        if (this.rolePage?.root?.active) this.rolePage.refresh(m);
        if (this.equipRoot.active) this.rebuildEquipList();
    }
}
