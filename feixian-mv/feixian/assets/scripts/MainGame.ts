import {
    _decorator, Component, Node, UITransform, Graphics, Label, Color, Vec3,
    Widget, Button, view, ResolutionPolicy, BlockInputEvents, Overflow, Sprite, SpriteFrame, resources, assetManager, ImageAsset, Texture2D,
    tween, UIOpacity,
} from 'cc';
import { GameModel } from './GameModel';
import { CombatLoop, CombatEvent } from './CombatLoop';
import { EquipItem, EquipSlot, SLOT_LABELS } from './GameTypes';
import { SaveSystem } from './SaveSystem';

const { ccclass } = _decorator;

const UI_2D = 33554432;
const DESIGN_W = 720;
const DESIGN_H = 1280;
const CHAR_SIZE = 180; // ~25% of design width 720

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

type TabId = 'equip' | 'spells' | 'beasts' | 'play' | 'cave' | 'guild';

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
    private lblHeroHp!: Label;
    private lblMonHp!: Label;
    private lblMonName!: Label;
    private lblFloat!: Label;
    private lblChat!: Label;
    private lblAuto!: Label;
    private lblBreak!: Label;
    private lblBreakCost!: Label;
    private barStageFill!: Node;
    private barBreakFill!: Node;
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

    onLoad() {
        view.setDesignResolutionSize(DESIGN_W, DESIGN_H, ResolutionPolicy.FIXED_HEIGHT);
        this.uiLayer = this.node.layer || UI_2D;
        this.model = new GameModel();
        this.loop = new CombatLoop(this.model);
        this.loop.onTick = (ev) => this.onCombat(ev);
        this.buildUI();
        this.preloadFxAssets();
        this.refreshAll();
        console.log('[MainGame] 飞仙 MVP 启动, 战力=', this.model.combatPower, '关卡=', this.model.stageTitle);
    }

    onDestroy() {
        this.model && this.model.persist();
    }

    update(dt: number) {
        this.loop.update(dt);
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
            if (this.floatTimer <= 0 && this.lblFloat) this.lblFloat.string = '';
        }
    }

    private onCombat(ev: CombatEvent) {
        if (ev.dodge) {
            this.showFloat('闪避', C.ok);
        } else if (ev.dmgToMonster > 0) {
            this.showFloat(`-${ev.dmgToMonster}`, C.red);
            this.playAttackFx();
        }
        // Task3: ground drop + tiny toast (no big settlement modal)
        if (ev.killed) {
            this.spawnGroundLoot(!!ev.cleared);
            this.refreshAll();
            this.respawnWildVisual();
            this.walkHeroToNearestMob();
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

    private showFloat(text: string, color: Color) {
        if (!this.lblFloat) return;
        this.lblFloat.string = text;
        this.lblFloat.color = color;
        this.floatTimer = 0.7;
    }

    private showToast(msg: string) {
        if (!this.grayToast) return;
        this.grayToast.string = msg;
        this.grayToast.node.active = true;
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

        this.root = this.mk('Root', this.node, DESIGN_W, DESIGN_H, 0, 0);
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

        this.buildPlay();
        this.buildSpells();
        this.buildSettings();
        this.buildBeasts();
        this.buildChestBtn();
        this.buildEquip();
        this.buildTopBar();
        this.buildTabBar();

        this.grayToast = this.label(this.root, '', 22, C.white, 0, 80, 520, 56, true);
        this.fill(this.grayToast.node, C.navy, 16);
        this.grayToast.node.active = false;
        this.grayToast.node.setSiblingIndex(999);
        this.buildLootPanel();
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
        this.spawnOneDrop(baseX, baseY, 'textures/fx/drop_gold_v3', '+' + loot.gold + '金', C.goldLt);
        if (loot.equip) {
            this.spawnOneDrop(baseX + 56, baseY + 8, 'textures/fx/drop_equip', loot.equip.name, C.cyan);
        }
        if (loot.lingshi) {
            this.spawnOneDrop(baseX - 56, baseY + 6, 'textures/fx/drop_gold_v3', '+' + loot.lingshi + '石', C.cyan);
        }
    }

    private spawnOneDrop(x: number, y: number, tex: string, tip: string, tipColor: Color) {
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
            .call(() => { if (n.isValid) n.destroy(); })
            .start();
    }

    private playAttackFx() {
        if (!this.heroNode?.isValid || !this.playRoot?.isValid) return;
        if (this.attackFxNode?.isValid) {
            this.attackFxNode.active = false;
            this.attackFxNode.destroy();
        }
        const hp = this.heroNode.position;
        const FX = Math.round(CHAR_SIZE * 1.2);
        const fx = this.mk('atkFx', this.playRoot, FX, FX, hp.x + Math.round(CHAR_SIZE * 0.55), hp.y + Math.round(CHAR_SIZE * 0.55));
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
        const target = new Vec3(best.position.x - 100, best.position.y, 0);
        tween(this.heroNode)
            .to(0.42, { position: target }, { easing: 'sineInOut' })
            .call(() => {
                if (this.lblHeroHp?.node?.isValid) {
                    this.lblHeroHp.node.setPosition(target.x, target.y - 24, 0);
                }
            })
            .start();
        if (this.lblHeroHp?.node?.isValid) {
            // follow roughly during walk
            tween(this.lblHeroHp.node).to(0.42, { position: new Vec3(target.x, target.y - 24, 0) }, { easing: 'sineInOut' }).start();
        }
        // duel focus mob follows that wild slot
        if (this.mobNode?.isValid) {
            this.mobNode.setPosition(best.position.x, best.position.y, 0);
            if (this.lblMonHp) this.lblMonHp.node.setPosition(best.position.x, best.position.y - 24, 0);
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
                const nx = -240 + Math.random() * 480;
                const ny = this.heroBaseY - 20 + Math.random() * 140;
                victim.setPosition(nx, ny, 0);
                victim.setScale(1, 1, 1);
            })
            .start();
    }


    private buildTopBar() {
        const bar = this.mk('TopBar', this.root, 700, 70, 0, 590);
        this.fill(bar, new Color(26, 42, 68, 210), 18);

        const goldP = this.mk('goldP', bar, 200, 44, -230, 0);
        this.fill(goldP, C.navy2, 16);
        const goldIcon = this.mk('goldIcon', goldP, 36, 36, -70, 0);
        this.loadSprite(goldIcon, 'textures/icons/res_gold', 36, 36, false);
        this.lblGold = this.label(goldP, '金 0', 20, C.goldLt, 0, 0, 190, 40, true);

        const lingP = this.mk('lingP', bar, 180, 44, 0, 0);
        this.fill(lingP, C.navy2, 16);
        this.lblLing = this.label(lingP, '灵石 0', 20, C.goldLt, 0, 0, 170, 40, true);

        const jadeP = this.mk('jadeP', bar, 140, 44, 160, 0);
        this.fill(jadeP, C.navy2, 16);
        this.lblJade = this.label(jadeP, '仙玉 0', 20, C.goldLt, 0, 0, 130, 40, true);

        const powP = this.mk('powP', bar, 150, 44, 300, 0);
        this.fill(powP, C.navy2, 16);
        this.lblTopPower = this.label(powP, '战力 0', 20, C.hot, 0, 0, 140, 40, true);
    }


    /** Task1: design field background (720×1280 art, cover play field) */
    private paintMapBackground(field: Node) {
        // field-local crop of the same map art (full screen already on playRoot)
        const bg = this.mk('mapBg', field, DESIGN_W, 760, 0, 0);
        this.loadSprite(bg, 'textures/bg/field_v2', DESIGN_W, 760, false);
    }

    private buildPlay() {
        const r = this.playRoot;
        const field = this.mk('Field', r, DESIGN_W, 760, 0, 80);
        this.fieldNode = field;
        // full-screen map art (design 720×1280)
        const fullBg = this.mk('fullMapBg', r, DESIGN_W, DESIGN_H, 0, 0);
        this.loadSprite(fullBg, 'textures/bg/field_v2', DESIGN_W, DESIGN_H, false);
        fullBg.setSiblingIndex(0);
        this.paintMapBackground(field);
        // field procedural fill no longer needed — hide old green under art
        field.getComponent(Graphics)?.clear();

        const cave = this.mk('cave', field, 170, 80, 0, 200);
        this.fill(cave, new Color(55, 70, 58, 200), 16);
        cave.active = false; // real map art includes scenery

        this.groundDropRoot = this.mk('drops', r, DESIGN_W, 400, 0, 80);

        // player info
        const info = this.mk('info', r, 340, 110, -170, 500);
        const av = this.mk('avatar', info, 72, 72, -120, 8);
        this.circle(av, C.navy);
        this.label(av, '头像', 16, C.white, 0, 0, 70, 30);
        this.lblName = this.label(info, '玩家昵称', 22, C.ink, 40, 28, 220, 32, true);
        this.lblName.horizontalAlign = Label.HorizontalAlign.LEFT;
        this.lblPower = this.label(info, '战力 0', 22, C.red, 40, -2, 220, 30, true);
        this.lblPower.horizontalAlign = Label.HorizontalAlign.LEFT;
        this.lblRealm = this.label(info, '炼气期', 18, C.inkMuted, 40, -32, 240, 28);
        this.lblRealm.horizontalAlign = Label.HorizontalAlign.LEFT;

        this.lblStage = this.label(r, '2-清萍原野', 28, C.ink, 0, 430, 400, 40, true);

        const stageBar = this.mk('stageBar', r, 420, 18, 0, 400);
        this.fill(stageBar, new Color(255, 255, 255, 180), 9);
        this.barStageFill = this.mk('stageFill', stageBar, 200, 14, -110, 0);
        this.fill(this.barStageFill, C.gold, 7);
        this.lblStageProg = this.label(r, '0/5', 16, C.ink, 240, 400, 80, 24);

        // Task2: many wild monsters on map + walkable hero
        const heroY = 30;
        this.heroBaseY = heroY;
        this.wildMobs = [];
        const mobSpots: [number, number][] = [
            [160, heroY], [240, heroY + 50], [80, heroY + 90], [-40, heroY + 40],
            [300, heroY - 10], [-120, heroY + 70], [40, heroY + 20], [200, heroY + 110],
            [-200, heroY + 30], [120, heroY - 30],
        ];
        // bird + turtle mix; turtle ~20% of 720 ≈ 144
        const WILD_BIRD = 100;
        const WILD_TURTLE = 144;
        for (let i = 0; i < mobSpots.length; i++) {
            const [mx, my] = mobSpots[i];
            const isTurtle = (i % 3) === 1; // ~1/3 turtles
            const sz = isTurtle ? WILD_TURTLE : WILD_BIRD;
            const tex = isTurtle ? 'textures/chars/mob_turtle' : 'textures/chars/mob_bird';
            const mob = this.mk('wild' + i, r, sz, sz, mx, my);
            mob.getComponent(UITransform)!.setAnchorPoint(0.5, 0);
            const ph = this.mk('wildPh', mob, sz, sz, 0, sz / 2);
            this.circle(ph, C.monster);
            this.loadSprite(mob, tex, sz, sz, true);
            this.wildMobs.push(mob);
        }

        this.heroNode = this.mk('hero', r, CHAR_SIZE, CHAR_SIZE, -160, heroY);
        this.heroNode.getComponent(UITransform)!.setAnchorPoint(0.5, 0);
        const heroPh = this.mk('heroPh', this.heroNode, CHAR_SIZE, CHAR_SIZE, 0, CHAR_SIZE / 2);
        this.circle(heroPh, C.hero);
        this.loadSprite(this.heroNode, 'textures/chars/hero', CHAR_SIZE, CHAR_SIZE, true);
        this.label(this.heroNode, '主角', 16, C.white, 0, CHAR_SIZE + 28, 100, 28, true);
        this.lblHeroHp = this.label(r, 'HP', 18, C.ink, -160, heroY - 24, 160, 28);

        // duel focus readout (combat model still 1 target); hide big duel sprite, keep HP label
        this.mobNode = this.mk('mon', r, 1, 1, 160, heroY);
        this.mobNode.active = false;
        this.lblMonName = this.label(r, '野怪×' + mobSpots.length, 18, C.ink, 220, 360, 160, 28, true);
        this.lblMonHp = this.label(r, 'HP', 18, C.ink, 160, heroY - 24, 160, 28);

        this.lblFloat = this.label(r, '', 28, C.red, 160, 160, 160, 40, true);

        // side buttons
        const sideY = [220, 130, 40];
        const sideT = ['礼包', '菜单', '装备'];
        sideT.forEach((t, i) => {
            const b = this.mk('side' + t, r, 70, 70, 300, sideY[i]);
            this.circle(b, C.navy2);
            this.label(b, t, 18, C.white, 0, 0, 66, 28, true);
            if (t === '装备') this.click(b, () => this.setTab('equip'));
            else this.click(b, () => this.showToast('MVP 未开放'));
        });

        // auto battle
        const auto = this.mk('auto', r, 100, 100, -280, -160);
        this.circle(auto, C.gold);
        this.lblAuto = this.label(auto, '自动开', 22, C.navy, 0, 0, 90, 40, true);
        this.click(auto, () => {
            this.model.toggleAuto();
            this.refreshAll();
        });

        // gray skills
        ['技能', '召唤', '增益'].forEach((t, i) => {
            const b = this.mk('sk' + t, r, 64, 64, 40 + i * 80, -170);
            this.circle(b, C.disabledBg);
            this.label(b, t, 16, C.disabled, 0, 0, 60, 24);
            this.click(b, () => this.showToast('法术/召唤未开放'));
        });

        // breakthrough bar
        const br = this.mk('breakBar', r, 680, 70, 0, -260);
        this.fill(br, C.navy, 16);
        this.label(br, '境界', 20, C.goldLt, -280, 0, 70, 30, true);
        this.barBreakFill = this.mk('bfill', br, 320, 22, -40, 0);
        this.fill(this.barBreakFill, C.ok, 8);
        this.lblBreak = this.label(br, '突破', 18, C.white, -40, 0, 360, 30);
        this.lblBreakCost = this.label(br, '灵石20', 18, C.goldLt, 250, 0, 140, 30, true);
        this.click(br, () => {
            const ok = this.model.tryBreakthrough();
            if (!ok) this.showToast('灵石或进度不足');
            this.refreshAll();
        });

        const chat = this.mk('chat', r, 680, 36, 0, -320);
        this.fill(chat, C.chat, 8);
        this.lblChat = this.label(chat, '[世界] 有道友正在清萍原野修炼…', 16, C.white, 0, 0, 660, 30);
        this.lblChat.horizontalAlign = Label.HorizontalAlign.LEFT;
    }

    private buildEquip() {
        const r = this.equipRoot;
        this.fill(this.mk('eqBg', r, DESIGN_W, DESIGN_H, 0, 0), new Color(230, 236, 244, 255), 0);

        const power = this.mk('eqPower', r, 680, 70, 0, 500);
        this.fill(power, C.navy, 16);
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
        this.lblSfx.string = on ? '开' : '关';
        this.lblSfx.color = on ? C.ok : C.disabled;
        // reload icon
        if (this.sfxIconNode) {
            this.loadSprite(this.sfxIconNode, on ? 'textures/icons/sfx_on' : 'textures/icons/sfx_off', 36, 36, false);
        }
        this.showToast(on ? '音效已开启' : '音效已关闭');
        this.model.playSfx('click');
    }

    private buildTabBar() {
        // design: bar ~60px@375 → ~115@720; icon Ø46@375 → ~88@720; selected +4px → ~96
        const barH = 120;
        const bar = this.mk('TabBar', this.root, DESIGN_W, barH, 0, -580);
        this.fill(bar, C.navy, 0);

        const tabs: { id: TabId; glyph: string; name: string; enabled: boolean }[] = [
            { id: 'equip', glyph: '装', name: '装备', enabled: true },
            { id: 'spells', glyph: '法', name: '法术', enabled: true },
            { id: 'beasts', glyph: '异', name: '异兽', enabled: true },
            { id: 'play', glyph: '玩', name: '玩法', enabled: true },
            { id: 'cave', glyph: '调', name: '洞天', enabled: false },
            { id: 'guild', glyph: '置', name: '设置', enabled: true },
        ];
        const n = tabs.length;
        const gap = DESIGN_W / n;
        const startX = -DESIGN_W / 2 + gap / 2;
        tabs.forEach((t, i) => {
            const x = startX + i * gap;
            const b = this.mk('tab_' + t.id, bar, 88, 88, x, 10);
            this.tabDots[t.id] = b;
            this.paintTabDot(b, t.id === this.tab, t.enabled);
            const gl = this.label(b, t.glyph, 26, t.enabled ? C.tabGlyph : C.disabled, 0, 6, 70, 36, true);
            this.tabLabels[t.id] = this.label(b, t.name, 14, t.enabled ? C.goldLt : C.disabled, 0, -28, 80, 22);
            this.click(b, () => {
                if (!t.enabled) {
                    this.showToast(`${t.name} 未开放`);
                    return;
                }
                this.setTab(t.id);
            });
        });
        this.refreshTabs();
    }

    private paintTabDot(n: Node, selected: boolean, enabled: boolean) {
        const ui = n.getComponent(UITransform) || n.addComponent(UITransform);
        const d = !enabled ? 84 : (selected ? 100 : 88); // selected +4px vs prior 96
        ui.setContentSize(d, d);
        let g = n.getComponent(Graphics);
        if (!g) g = n.addComponent(Graphics);
        g.clear();
        const r = d / 2;
        if (!enabled) {
            g.fillColor = C.disabledBg;
            g.circle(0, 0, r);
            g.fill();
            return;
        }
        if (selected) {
            g.fillColor = C.tabOn;
            g.circle(0, 0, r);
            g.fill();
            g.strokeColor = new Color(46, 204, 113, 140);
            g.lineWidth = 2;
            g.circle(0, 0, r + 1);
            g.stroke();
        } else {
            g.fillColor = new Color(26, 42, 68, 200);
            g.circle(0, 0, r);
            g.fill();
            g.strokeColor = new Color(232, 244, 255, 255); // #E8F4FF
            g.lineWidth = 2.5;
            g.circle(0, 0, r - 1.2);
            g.stroke();
        }
    }

    
    private buildSpells() {
        const r = this.spellsRoot;
        this.fill(r, new Color(24, 32, 48, 240), 0);
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

    
    private applySpriteFrame(node: Node, sf: SpriteFrame, w: number, h: number, footAnchor: boolean) {
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

    private loadSprite(node: Node, path: string, w: number, h: number, footAnchor = false) {
        const ui = node.getComponent(UITransform) || node.addComponent(UITransform);
        if (footAnchor) ui.setAnchorPoint(0.5, 0);
        ui.setContentSize(w, h);
        const tryApply = (sf: SpriteFrame | null | undefined, via: string) => {
            if (!sf) return false;
            this.applySpriteFrame(node, sf, w, h, footAnchor);
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
        this.chestBtn = this.mk('ChestBtn', this.playRoot, 120, 120, 280, 120);
        this.circle(this.chestBtn, C.gold);
        this.lblChest = this.label(this.chestBtn, '宝箱', 22, C.navy, 0, 0, 100, 40, true);
        this.chestBtn.active = false;
        this.click(this.chestBtn, () => {
            if (this.model.tryOpenChest()) {
                this.showLootPanel(true);
                this.refreshAll();
            }
        });
    }

    private setTab(id: TabId) {
        if (id !== 'play' && id !== 'equip' && id !== 'spells' && id !== 'guild' && id !== 'beasts') {
            this.showToast('功能未开放');
            return;
        }
        this.tab = id;
        this.playRoot.active = id === 'play';
        this.equipRoot.active = id === 'equip';
        if (this.spellsRoot) this.spellsRoot.active = id === 'spells';
        if (this.settingsRoot) this.settingsRoot.active = id === 'guild';
        if (this.beastsRoot) this.beastsRoot.active = id === 'beasts';
        this.refreshTabs();
        if (this.lootPanel) this.lootPanel.active = false;
        if (id === 'equip') this.rebuildEquipList();
        if (id === 'beasts') this.refreshBeastPage();
        this.refreshAll();
    }

    private refreshTabs() {
        (Object.keys(this.tabDots) as TabId[]).forEach((id) => {
            const enabled = id === 'play' || id === 'equip' || id === 'spells' || id === 'guild' || id === 'beasts';
            const n = this.tabDots[id];
            if (!n) return;
            this.paintTabDot(n, id === this.tab, enabled);
            const lb = this.tabLabels[id];
            if (lb) {
                lb.color = enabled ? C.goldLt : C.disabled;
            }
            // glyph is first Label child named lbl near top — keep white/tabGlyph via children
            for (const ch of n.children) {
                const lab = ch.getComponent(Label);
                if (!lab) continue;
                if (lab.fontSize >= 22) {
                    lab.color = enabled ? (id === this.tab ? C.white : C.tabGlyph) : C.disabled;
                }
            }
        });
    }

    private setFillWidth(node: Node, maxW: number, ratio: number, color: Color) {
        const w = Math.max(8, maxW * Math.min(1, Math.max(0, ratio)));
        const ui = node.getComponent(UITransform)!;
        ui.setContentSize(w, ui.height);
        // left-align inside parent: parent width known by caller via x
        this.fill(node, color, 7);
    }

    private refreshCombatHud() {
        const m = this.model;
        if (this.lblHeroHp) this.lblHeroHp.string = `HP ${m.playerHp}/${m.playerMaxHp}`;
        if (this.lblMonHp) this.lblMonHp.string = `HP ${m.monsterHp}/${m.monsterMaxHp}`;
        if (this.lblMonName) this.lblMonName.string = '野怪×' + Math.max(1, this.wildMobs.length);
        if (this.lblChat && m.lastLog) this.lblChat.string = `[战斗] ${m.lastLog}`;
    }

    private refreshAll() {
        const m = this.model;
        const s = m.save;
        if (this.lblGold) this.lblGold.string = `金 ${m.fmtGold(s.gold)}`;
        if (this.lblLing) this.lblLing.string = `灵石 ${s.lingshi}`;
        if (this.lblJade) this.lblJade.string = `仙玉 ${s.xianyu}`;
        if (this.lblName) this.lblName.string = s.playerName;
        if (this.lblPower) this.lblPower.string = `战力 ${m.combatPower}`;
        if (this.lblTopPower) this.lblTopPower.string = `战力 ${m.combatPower}`;
        if (this.lblRealm) this.lblRealm.string = `${m.realmText} ${s.realmLayer}级`;
        if (this.lblStage) this.lblStage.string = m.stageTitle;
        if (this.lblStageProg) this.lblStageProg.string = `${s.killsInStage}/${s.killsNeeded}`;
        if (this.barStageFill) {
            const ratio = s.killsNeeded ? s.killsInStage / s.killsNeeded : 0;
            this.setFillWidth(this.barStageFill, 412, ratio, C.gold);
            this.barStageFill.setPosition(-210 + (412 * ratio) / 2, 0, 0);
        }
        if (this.lblAuto) this.lblAuto.string = s.autoBattle ? '自动开' : '自动关';
        if (this.lblBreak) {
            const need = m.nextBreakthroughNeed();
            this.lblBreak.string = `境界突破至${m.realmText} (${s.realmExp}/${need})`;
        }
        if (this.lblBreakCost) this.lblBreakCost.string = `灵石${m.nextBreakthroughCost()}`;
        if (this.barBreakFill) {
            const ratio = m.breakthroughProgress();
            this.setFillWidth(this.barBreakFill, 320, ratio, C.ok);
            this.barBreakFill.setPosition(-40 - 160 + (320 * ratio) / 2, 0, 0);
        }
        if (this.lblEquipPower) {
            this.lblEquipPower.string = `战力 ${m.combatPower}`;
        }
        (Object.keys(SLOT_LABELS) as EquipSlot[]).forEach((slot) => {
            const lb = this.slotLabels[slot];
            if (!lb) return;
            const it = m.getEquipped(slot);
            lb.string = it ? `${SLOT_LABELS[slot]}\n${it.name}` : SLOT_LABELS[slot];
        });
        this.refreshCombatHud();
        this.refreshTabs();
        if (this.equipRoot.active) this.rebuildEquipList();
    }
}
