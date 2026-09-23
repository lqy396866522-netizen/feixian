import { Label, Node, Color } from 'cc';
import { UiFactory } from './UiFactory';
import { C } from './UiTheme';
import { DESIGN_W, DESIGN_H } from './ProductLayout';
import { GameModel } from '../GameModel';
import { TabId } from './TabTypes';

export class RolePageView {
    root!: Node;
    lblName!: Label;
    lblRealm!: Label;
    lblPower!: Label;

    constructor(private f: UiFactory, private parent: Node, private onBack: (t: TabId) => void) {}

    build() {
        this.root = this.f.mk('RoleRoot', this.parent, DESIGN_W, DESIGN_H, 0, 0);
        this.root.active = false;
        this.f.fill(this.f.mk('bg', this.root, DESIGN_W, DESIGN_H, 0, 0), new Color(230, 236, 244, 255), 0);
        const panel = this.f.mk('panel', this.root, 640, 520, 0, 80);
        this.f.tryLoadSpriteBg(panel, 'textures/ui/product/panel_frame', 640, 520, () => {
            this.f.fill(panel, C.panel, 20);
        });
        this.f.label(panel, '角色', 28, C.navy, 0, 220, 200, 40, true);
        const hero = this.f.mk('hero', panel, 140, 140, 0, 80);
        this.f.loadSprite(hero, 'textures/chars/hero', 140, 140, false);
        this.lblName = this.f.label(panel, '道友', 24, C.ink, 0, -20, 400, 36, true);
        this.lblRealm = this.f.label(panel, '炼气期', 20, C.inkMuted, 0, -60, 400, 32);
        this.lblPower = this.f.label(panel, '战力 0', 26, C.hot, 0, -100, 400, 40, true);
        const back = this.f.mk('back', this.root, 200, 48, 0, -520);
        this.f.fill(back, C.ok, 12);
        this.f.label(back, '返回玩法', 20, C.white, 0, 0, 180, 40, true);
        this.f.click(back, () => this.onBack('play'));
    }

    refresh(m: GameModel) {
        if (!this.lblName) return;
        this.lblName.string = m.save.playerName;
        this.lblRealm.string = m.realmStatusLine();
        this.lblPower.string = `战力 ${m.combatPower}`;
    }
}
