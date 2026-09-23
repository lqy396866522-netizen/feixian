import { Node } from 'cc';
import { UiFactory } from './UiFactory';
import { C } from './UiTheme';
import { PL } from './ProductLayout';
import { uiHalfWidth } from './SpriteLayout';

const LEFT = [
    { k: 'sign7', t: '签到' },
    { k: 'newserver', t: '新服活动' },
    { k: 'firstpay', t: '首充' },
    { k: 'help', t: '仙友助力' },
];
const RIGHT = [
    { k: 'gift', t: '礼包' },
    { k: 'manual', t: '修行手册' },
    { k: 'online', t: '在线奖励' },
    { k: 'fastfight', t: '妖兽图鉴' },
];

export class SideRailsView {
    chestBtn!: Node;

    constructor(private f: UiFactory, private parent: Node, private toast: (m: string) => void) {}

    private sideY(i: number) {
        return PL.sideTopY - i * PL.sideGap;
    }

    private buildSide(item: { k: string; t: string }, x: number, y: number, prefix: string) {
        const slot = this.f.mk(prefix + item.k, this.parent, 76, PL.sideSlotH, x, y);
        const ic = this.f.mk('ic', slot, PL.sideIcon, PL.sideIcon, 0, 16);
        this.f.tryLoadSpriteBg(ic, `textures/ui/product/side_${item.k}`, PL.sideIcon, PL.sideIcon, () => {
            this.f.circle(ic, C.white);
            this.f.strokeCircle(ic, C.gold, 2);
        });
        this.f.addRedDot(ic, PL.sideIcon / 2 - 4, PL.sideIcon / 2 - 4);
        this.f.label(slot, item.t, 14, C.white, 0, -34, 76, 22, true);
        this.f.click(slot, () => this.toast(`${item.t} 活动未开放`));
    }

    build() {
        const edge = uiHalfWidth() - 38;
        LEFT.forEach((item, i) => this.buildSide(item, -edge, this.sideY(i), 'L_'));
        RIGHT.forEach((item, i) => this.buildSide(item, edge, this.sideY(i), 'R_'));

        this.chestBtn = this.f.mk('ChestBtn', this.parent, PL.sideIcon, PL.sideIcon, edge, PL.chestY);
        this.f.circle(this.chestBtn, C.gold);
        this.f.strokeCircle(this.chestBtn, C.navy, 2);
        this.f.label(this.chestBtn, '宝箱', 13, C.navy, 0, -32, 60, 22, true);
        this.chestBtn.active = false;
    }
}
