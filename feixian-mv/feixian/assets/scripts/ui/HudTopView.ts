import { Label, Node, Color } from 'cc';
import { UiFactory } from './UiFactory';
import { C } from './UiTheme';
import { PL } from './ProductLayout';
import { uiHalfWidth, uiHalfHeight, uiFullWidth } from './SpriteLayout';
import { GameModel } from '../GameModel';

export type HudTopRefs = {
    root: Node;
    lblGold: Label;
    lblLing: Label;
    lblJade: Label;
    lblName: Label;
    lblRealm: Label;
    lblLevel: Label;
    lblTopPower: Label;
    lblPower: Label;
    goldPulseNode: Node;
};

/** 顶栏：头像/昵称/境界 + 三货币 + 战力行 + 汉堡；左右按可见宽度锚定 */
export class HudTopView {
    refs!: HudTopRefs;
    private lblRealmSub!: Label;

    constructor(
        private f: UiFactory,
        private parent: Node,
        private onMenu: () => void,
        private onPlus: () => void,
        private onPower: () => void,
    ) {}

    build(): HudTopRefs {
        const hw = uiHalfWidth();
        const barW = uiFullWidth();
        const bar = this.f.mk('HudTop', this.parent, barW, PL.hudH, 0, uiHalfHeight() - PL.hudH / 2 + PL.hudOffsetY);
        this.f.tryLoadSpriteBg(bar, 'textures/ui/product/hud_top_master_v2', barW, PL.hudH, () => {
            this.f.fill(bar, new Color(22, 36, 58, 235), 0);
        }, true);

        // 位置对应母版皮肤的镂空头像环、两条人物信息槽与三枚资源胶囊。
        const ax = -hw + 67;
        const av = this.f.mk('avatar', bar, 92, 92, ax, 0);
        // 皮肤的头像框中心透明，需独立的深色底板和人物层，避免透出野外地图。
        const avBg = this.f.mk('avatarBg', av, 84, 84, 0, 0);
        this.f.circle(avBg, C.navy2);
        const portrait = this.f.mk('portrait', av, 78, 78, 0, -2);
        this.f.loadSprite(portrait, 'textures/chars/hero_v2', 78, 78, false);

        const tx = -hw + 218;
        const lblName = this.f.label(bar, '道友', 19, C.white, tx, 23, 166, 28, true);
        lblName.horizontalAlign = Label.HorizontalAlign.LEFT;
        const lblRealm = this.f.label(bar, '炼气期', 15, C.goldLt, tx, -7, 166, 24);
        lblRealm.horizontalAlign = Label.HorizontalAlign.LEFT;
        const lblLevel = this.f.label(bar, 'Lv.1', 14, C.white, tx, -46, 120, 22);
        lblLevel.horizontalAlign = Label.HorizontalAlign.LEFT;
        lblLevel.node.active = false;

        const pill = (x: number) => {
            // 货币图标、金边与末端菱形来自同一张 HUD 皮肤；这里只保留动态数值和点击热区。
            const p = this.f.mk('cur', bar, 94, 46, x, 0);
            this.f.click(p, () => this.onPlus());
            return p;
        };
        const jadeP = pill(-52);
        const lingP = pill(58);
        const goldP = pill(169);
        const mkPillLbl = (p: Node, t: string, c: Color) => {
            const l = this.f.label(p, t, 18, c, 11, 0, 58, 30, true);
            l.horizontalAlign = Label.HorizontalAlign.CENTER;
            return l;
        };
        const lblJade = mkPillLbl(jadeP, '0', C.white);
        const lblLing = mkPillLbl(lingP, '0', C.white);
        const lblGold = mkPillLbl(goldP, '0', C.goldLt);

        const menu = this.f.mk('menu', bar, 96, 96, hw - 98, 10);
        this.f.click(menu, () => this.onMenu());

        const powerBar = this.f.mk('powBar', bar, 1, 1, 0, 0);
        powerBar.active = false;
        const lblTopPower = this.f.label(powerBar, '战力 0', 23, C.hot, 0, 0, 280, 34, true);
        this.f.click(powerBar, () => this.onPower());

        this.lblRealmSub = this.f.label(bar, '', 14, C.goldLt, tx, -78, 230, 20);
        this.lblRealmSub.horizontalAlign = Label.HorizontalAlign.LEFT;
        this.lblRealmSub.node.active = false;

        this.refs = {
            root: bar, lblGold, lblLing, lblJade, lblName, lblRealm, lblLevel, lblTopPower,
            lblPower: lblTopPower,
            goldPulseNode: goldP,
        };
        return this.refs;
    }

    refresh(m: GameModel) {
        const s = m.save;
        const r = this.refs;
        if (!r) return;
        r.lblGold.string = m.fmtGold(s.gold);
        r.lblLing.string = `${s.lingshi}`;
        r.lblJade.string = `${s.xianyu}`;
        r.lblName.string = s.playerName;
        r.lblRealm.string = m.realmText;
        r.lblLevel.string = `Lv.${s.playerLevel}`;
        r.lblTopPower.string = `战力 ${m.combatPower}`;
        this.lblRealmSub.string = `${m.realmText}  ${s.playerLevel}级`;
    }
}
