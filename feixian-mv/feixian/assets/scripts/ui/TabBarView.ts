import { Label, Node, Color } from 'cc';
import { UiFactory } from './UiFactory';
import { C } from './UiTheme';
import { DESIGN_W, PL } from './ProductLayout';
import { TAB_ORDER, TAB_META, TabId } from './TabTypes';

export class TabBarView {
    tabDots: Record<string, Node> = {};
    tabLabels: Record<string, Label> = {};
    tabIcons: Record<string, Node> = {};
    tabIndicator!: Node;
    barRoot!: Node;

    constructor(private f: UiFactory, private parent: Node, private onTab: (id: TabId) => void) {}

    build() {
        const barH = PL.tabBarH;
        const bar = this.f.mk('TabBar', this.parent, DESIGN_W, barH, 0, PL.tabBarY);
        this.barRoot = bar;
        this.f.tryLoadSpriteBg(bar, 'textures/ui/product/tabbar_bg', DESIGN_W, barH, () => this.f.fill(bar, C.navy, 0));
        this.tabIndicator = this.f.mk('tabInd', bar, 72, 4, 0, -52);
        this.f.fill(this.tabIndicator, C.tabOn, 2);

        const n = TAB_ORDER.length;
        const gap = DESIGN_W / n;
        const startX = -DESIGN_W / 2 + gap / 2;
        TAB_ORDER.forEach((id, i) => {
            const meta = TAB_META[id];
            const x = startX + i * gap;
            const b = this.f.mk('tab_' + id, bar, 72, 80, x, 8);
            this.tabDots[id] = b;
            const icon = this.f.mk('ic', b, 56, 56, 0, 8);
            this.tabIcons[id] = icon;
            this.f.loadSprite(icon, meta.icon, 56, 56, false, () => {
                this.f.label(b, meta.label.charAt(0), 20, C.tabGlyph, 0, 6, 60, 28, true);
            });
            this.tabLabels[id] = this.f.label(b, meta.label, 12, meta.enabled ? C.goldLt : C.disabled, 0, -30, 72, 20);
            this.f.click(b, () => this.onTab(id));
        });
    }

    refresh(current: TabId) {
        const idx = Math.max(0, TAB_ORDER.indexOf(current));
        const gap = DESIGN_W / TAB_ORDER.length;
        const x = -DESIGN_W / 2 + gap / 2 + idx * gap;
        this.tabIndicator.setPosition(x, -52, 0);
        this.tabIndicator.active = current === 'play';
        TAB_ORDER.forEach((id) => {
            const meta = TAB_META[id];
            const icon = this.tabIcons[id];
            const lb = this.tabLabels[id];
            if (!icon) return;
            const selected = id === current;
            const path = id === 'play' && selected
                ? 'textures/ui/product/tab_play_on'
                : meta.icon;
            this.f.loadSprite(icon, path, 56, 56, false);
            if (lb) {
                lb.color = !meta.enabled ? C.disabled : (selected ? C.goldLt : C.white);
            }
        });
    }
}
