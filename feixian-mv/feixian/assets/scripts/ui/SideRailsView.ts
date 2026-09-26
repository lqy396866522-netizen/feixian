import { Node, Color, Label } from 'cc';
import { UiFactory } from './UiFactory';
import { C } from './UiTheme';
import { PL } from './ProductLayout';
import { uiHalfWidth } from './SpriteLayout';
import { GameModel } from '../GameModel';

const LEFT = [
    { k: 'sign7', t: '七日签到' },
    { k: 'newserver', t: '新服活动' },
    { k: 'firstpay', t: '首充豪礼' },
    { k: 'help', t: '仙友助力' },
];
const RIGHT = [
    { k: 'gift', t: '超值大礼' },
    { k: 'manual', t: '修行手册' },
    { k: 'online', t: '在线奖励' },
    { k: 'fastfight', t: '妖兽图鉴' },
];

export type SideRailHandlers = {
    onCity: () => void;
    onWorldMap: () => void;
    onRealm: () => void;
    onAuto: () => void;
};

/** 左右功能栏：活动入口两列 + 右上主城/地图 + 左下境界/自动 + 右下快捷战斗 */
export class SideRailsView {
    chestBtn!: Node;
    private autoBtn!: Node;
    private realmDot!: Node;

    constructor(
        private f: UiFactory,
        private parent: Node,
        private toast: (m: string) => void,
        private handlers: SideRailHandlers,
    ) {}

    private buildSide(item: { k: string; t: string }, x: number, y: number, prefix: string) {
        const slot = this.f.mk(prefix + item.k, this.parent, 96, PL.sideSlotH, x, y);
        // 文字压在图标下沿，保持透明，不再增加第二块深色铭牌。
        const ic = this.f.mk('ic', slot, PL.sideIcon, PL.sideIcon, 0, 17);
        this.f.tryLoadSpriteBg(ic, `textures/ui/product/side_${item.k}`, PL.sideIcon, PL.sideIcon, () => {
            this.f.circle(ic, C.navy2);
            this.f.strokeCircle(ic, C.gold, 2);
            const gl = this.f.label(ic, item.t.charAt(0), 22, C.goldLt, 0, 0, 40, 32, true);
            gl.node.name = 'ph';
        });
        this.f.addRedDot(ic, PL.sideIcon / 2 - 4, PL.sideIcon / 2 - 4);
        const name = this.f.label(slot, item.t, 14, C.white, 0, -20, 96, 20, true);
        name.enableOutline = true;
        name.outlineColor = new Color(10, 24, 32, 230);
        name.outlineWidth = 2;
        this.f.click(slot, () => this.toast(`${item.t} 活动未开放`));
    }

    /** 右上角并排双入口：主城 / 世界地图 */
    private buildCorner(x: number, key: string, label: string, glyph: string, cb: () => void) {
        const slot = this.f.mk('corner_' + key, this.parent, 96, PL.sideSlotH, x, PL.cornerY);
        const ic = this.f.mk('ic', slot, PL.cornerBtn, PL.cornerBtn, 0, 17);
        this.f.tryLoadSpriteBg(ic, `textures/ui/product/side_${key}`, PL.cornerBtn, PL.cornerBtn, () => {
            this.f.circle(ic, C.navy2);
            this.f.strokeCircle(ic, C.gold, 2);
            const gl = this.f.label(ic, glyph, 22, C.goldLt, 0, 0, 44, 32, true);
            gl.node.name = 'ph';
        });
        const name = this.f.label(slot, label, 14, C.white, 0, -20, 96, 20, true);
        name.enableOutline = true;
        name.outlineColor = new Color(10, 24, 32, 230);
        name.outlineWidth = 2;
        this.f.click(slot, cb);
    }

    /** 底部两侧圆形快捷钮：贴图缺失时用描边圆 + 字符占位 */
    private buildOrbBtn(key: string, x: number, y: number, size: number, tex: string, glyph: string, label: string, cb: () => void): Node {
        const b = this.f.mk(key, this.parent, size, size, x, y);
        this.f.tryLoadSpriteBg(b, tex, size, size, () => {
            this.f.circle(b, C.navy2);
            this.f.strokeCircle(b, C.gold, 2.5);
            if (glyph) {
                const gl = this.f.label(b, glyph, 22, C.goldLt, 0, 0, size - 8, 32, true);
                gl.node.name = 'ph';
            }
        });
        const name = this.f.label(b, label, 14, C.white, 0, -size / 2 + 9, 96, 20, true);
        name.enableOutline = true;
        name.outlineColor = new Color(10, 24, 32, 230);
        name.outlineWidth = 2;
        this.f.click(b, cb);
        return b;
    }

    build() {
        const hw = uiHalfWidth();
        const edge = hw - 38;
        LEFT.forEach((item, i) => this.buildSide(item, -edge, PL.sideTopY - i * PL.sideGap, 'L_'));
        RIGHT.forEach((item, i) => this.buildSide(item, edge, PL.sideTopY - i * PL.sideGap, 'R_'));

        this.buildCorner(hw - 160, 'city', '主城', '城', () => this.handlers.onCity());
        this.buildCorner(edge, 'worldmap', '世界地图', '图', () => this.handlers.onWorldMap());

        this.chestBtn = this.f.mk('ChestBtn', this.parent, PL.sideIcon, PL.sideIcon, edge, PL.chestY);
        this.f.circle(this.chestBtn, C.gold);
        this.f.strokeCircle(this.chestBtn, C.navy, 2);
        this.f.label(this.chestBtn, '宝箱', 13, C.navy, 0, -32, 60, 22, true);
        this.chestBtn.active = false;

        const orbX = -hw + 64;
        const realm = this.buildOrbBtn(
            'realmOrb', orbX, PL.realmOrbY, PL.realmOrb,
            'textures/ui/product/orb_realm', '境', '境界',
            () => this.handlers.onRealm(),
        );
        this.realmDot = this.f.addRedDot(realm, PL.realmOrb / 2 - 6, PL.realmOrb / 2 - 6);
        this.realmDot.active = false;

        this.autoBtn = this.buildOrbBtn(
            'autoBtn', orbX, PL.autoBtnY, PL.autoBtn,
            'textures/ui/product/btn_auto_on', '', '自动',
            () => this.handlers.onAuto(),
        );

        // “快速战斗 / 自动挑战”与中央技能坞争抢了同一片操作区。
        // 战斗行为已由左下自动钮和底部玩法入口承接，因此不再重复放置两枚右侧悬浮按钮。
    }

    refresh(m: GameModel) {
        const on = m.save.autoBattle;
        this.f.tryLoadSpriteBg(this.autoBtn, on ? 'textures/ui/product/btn_auto_on' : 'textures/ui/product/btn_auto_off', PL.autoBtn, PL.autoBtn, () => {
            this.f.circle(this.autoBtn, on ? C.gold : C.disabledBg);
        });
        if (this.realmDot?.isValid) this.realmDot.active = m.breakthroughReady();
    }
}
