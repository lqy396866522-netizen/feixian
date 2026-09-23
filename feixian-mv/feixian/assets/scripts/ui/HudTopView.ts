import { Label, Node, Color } from 'cc';
import { UiFactory } from './UiFactory';
import { C } from './UiTheme';
import { DESIGN_W, PL } from './ProductLayout';
import { uiHalfWidth } from './SpriteLayout';
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
    expFill: Node;
};

export class HudTopView {
    refs!: HudTopRefs;
    private expBarW = 168;

    constructor(
        private f: UiFactory,
        private parent: Node,
        private onMenu: () => void,
        private onPlus: () => void,
        private onWorldMap: () => void,
        private onCity: () => void,
    ) {}

    build(): HudTopRefs {
        const bar = this.f.mk('HudTop', this.parent, DESIGN_W, PL.hudH, 0, PL.hudTopY);
        this.f.tryLoadSpriteBg(bar, 'textures/ui/product/hud_top_bg', DESIGN_W, PL.hudH, () => {
            this.f.fill(bar, new Color(22, 36, 58, 235), 0);
        });

        const av = this.f.mk('avatar', bar, 66, 66, -292, 20);
        this.f.circle(av, C.navy2);
        this.f.strokeCircle(av, C.gold, 2.5);
        this.f.loadSprite(av, 'textures/chars/hero', 62, 62, false);

        const lblName = this.f.label(bar, '道友', 21, C.white, -218, 42, 200, 28, true);
        lblName.horizontalAlign = Label.HorizontalAlign.LEFT;
        const lblRealm = this.f.label(bar, '炼气期', 16, C.goldLt, -218, 17, 220, 24);
        lblRealm.horizontalAlign = Label.HorizontalAlign.LEFT;
        const lblLevel = this.f.label(bar, 'Lv.1', 14, C.white, -218, -6, 200, 22);
        lblLevel.horizontalAlign = Label.HorizontalAlign.LEFT;

        const expBg = this.f.mk('expBg', bar, this.expBarW, 10, -218, -25);
        this.f.fill(expBg, new Color(0, 0, 0, 120), 5);
        const expFill = this.f.mk('expFill', expBg, this.expBarW - 4, 8, 0, 0);
        this.f.fill(expFill, C.ok, 4);

        const pill = (x: number, icon: string) => {
            const p = this.f.mk('cur', bar, 128, 38, x, 8);
            this.f.tryLoadSpriteBg(p, 'textures/ui/product/panel_currency', 128, 38, () => {
                this.f.fill(p, new Color(18, 28, 48, 220), 10);
                this.f.strokeCircle(p, C.gold, 1.5);
            });
            const ic = this.f.mk('ic', p, 30, 30, -44, 0);
            this.f.loadSprite(ic, icon, 30, 30, false);
            const plus = this.f.mk('plus', p, 22, 22, 48, 0);
            this.f.loadSprite(plus, 'textures/ui/product/btn_plus', 22, 22, false, () => {
                this.f.label(plus, '+', 16, C.goldLt, 0, 0, 22, 22, true);
            });
            this.f.click(plus, () => this.onPlus());
            return p;
        };
        const jadeP = pill(-72, 'textures/icons/res_jade');
        const lingP = pill(58, 'textures/icons/res_herb');
        const goldP = pill(188, 'textures/icons/res_gold');
        const lblJade = this.f.label(jadeP, '仙玉 0', 16, C.white, 6, 0, 82, 28, true);
        lblJade.horizontalAlign = Label.HorizontalAlign.LEFT;
        const lblLing = this.f.label(lingP, '灵石 0', 16, C.white, 6, 0, 82, 28, true);
        lblLing.horizontalAlign = Label.HorizontalAlign.LEFT;
        const lblGold = this.f.label(goldP, '金币 0', 16, C.goldLt, 6, 0, 82, 28, true);
        lblGold.horizontalAlign = Label.HorizontalAlign.LEFT;

        const powerBar = this.f.mk('powBar', bar, 400, 34, -32, -48);
        this.f.tryLoadSpriteBg(powerBar, 'textures/ui/product/bar_power', 380, 32, () => this.f.fill(powerBar, C.navy, 8));
        const lblTopPower = this.f.label(powerBar, '战力 0', 21, C.hot, 0, 0, 380, 30, true);

        const menuX = uiHalfWidth() - 30;
        const menu = this.f.mk('menu', bar, 52, 52, menuX, 22);
        this.f.tryLoadSpriteBg(menu, 'textures/ui/product/btn_menu', 52, 52, () => {
            this.f.circle(menu, C.navy2);
            this.f.label(menu, '≡', 26, C.white, 0, 0, 44, 44, true);
        });
        this.f.click(menu, () => this.onMenu());

        const cornerX = uiHalfWidth() - 28;
        const mapBtn = this.f.mk('worldMap', this.parent, PL.cornerBtn, PL.cornerBtn, cornerX, PL.cornerMapY);
        this.f.tryLoadSpriteBg(mapBtn, 'textures/ui/product/side_manual', PL.cornerBtn, PL.cornerBtn, () => {
            this.f.circle(mapBtn, C.white);
        });
        this.f.label(mapBtn, '地图', 13, C.navy, 0, -34, 56, 20, true);
        this.f.click(mapBtn, () => this.onWorldMap());

        const cityBtn = this.f.mk('city', this.parent, PL.cornerBtn, PL.cornerBtn, cornerX, PL.cornerCityY);
        this.f.circle(cityBtn, C.white);
        this.f.strokeCircle(cityBtn, C.gold, 2);
        this.f.label(cityBtn, '主城', 13, C.navy, 0, -34, 56, 20, true);
        this.f.click(cityBtn, () => this.onCity());

        this.refs = {
            root: bar, lblGold, lblLing, lblJade, lblName, lblRealm, lblLevel, lblTopPower,
            lblPower: lblTopPower,
            goldPulseNode: goldP, expFill,
        };
        return this.refs;
    }

    refresh(m: GameModel) {
        const s = m.save;
        const r = this.refs;
        if (!r) return;
        r.lblGold.string = `金币 ${m.fmtGold(s.gold)}`;
        r.lblLing.string = `灵石 ${s.lingshi}`;
        r.lblJade.string = `仙玉 ${s.xianyu}`;
        r.lblName.string = s.playerName;
        r.lblRealm.string = m.realmText;
        const need = m.nextBreakthroughNeed();
        const exp = Math.min(s.realmExp, need);
        r.lblLevel.string = `Lv.${s.playerLevel}  经验 ${exp}/${need}`;
        r.lblTopPower.string = `战力 ${m.combatPower}`;
        const ratio = need ? exp / need : 0;
        this.f.setFillWidth(r.expFill, this.expBarW - 4, ratio, C.ok);
    }
}
