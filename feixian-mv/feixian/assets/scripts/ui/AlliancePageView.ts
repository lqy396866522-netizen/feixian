import { Node, Color } from 'cc';
import { UiFactory } from './UiFactory';
import { C } from './UiTheme';
import { DESIGN_W, DESIGN_H } from './ProductLayout';
import { TabId } from './TabTypes';

export class AlliancePageView {
    root!: Node;

    constructor(
        private f: UiFactory,
        private parent: Node,
        private onBack: (t: TabId) => void,
        private toast: (m: string) => void,
    ) {}

    build() {
        this.root = this.f.mk('AllianceRoot', this.parent, DESIGN_W, DESIGN_H, 0, 0);
        this.root.active = false;
        this.f.fill(this.f.mk('bg', this.root, DESIGN_W, DESIGN_H, 0, 0), new Color(220, 228, 240, 255), 0);
        const panel = this.f.mk('panel', this.root, 640, 400, 0, 120);
        this.f.tryLoadSpriteBg(panel, 'textures/ui/product/panel_frame', 640, 400, () => {
            this.f.fill(panel, C.panel, 20);
        });
        this.f.label(panel, '仙盟', 28, C.navy, 0, 160, 200, 40, true);
        this.f.label(panel, '联网仙盟功能即将开放', 20, C.inkMuted, 0, 80, 520, 36);
        const join = this.f.mk('join', panel, 220, 52, 0, -20);
        this.f.fill(join, C.primary, 14);
        this.f.label(join, '申请加入', 22, C.white, 0, 0, 200, 40, true);
        this.f.click(join, () => this.toast('仙盟未开放'));
        const back = this.f.mk('back', this.root, 200, 48, 0, -520);
        this.f.fill(back, C.ok, 12);
        this.f.label(back, '返回玩法', 20, C.white, 0, 0, 180, 40, true);
        this.f.click(back, () => this.onBack('play'));
    }
}
