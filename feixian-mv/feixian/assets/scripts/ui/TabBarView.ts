import { Label, Node, Color, Graphics } from 'cc';
import { UiFactory } from './UiFactory';
import { C } from './UiTheme';
import { DESIGN_W, PL } from './ProductLayout';
import { uiHalfHeight, uiFullWidth } from './SpriteLayout';
import { TAB_ORDER, TAB_META, TabId } from './TabTypes';

/** 底部七 Tab：中央「玩法」金圈上浮，选中金亮、按压回弹；贴底自适应 */
export class TabBarView {
    tabDots: Record<string, Node> = {};
    tabLabels: Record<string, Label> = {};
    tabIcons: Record<string, Node> = {};
    barRoot!: Node;
    private playGlow!: Node;

    constructor(private f: UiFactory, private parent: Node, private onTab: (id: TabId) => void) {}

    build() {
        const barH = PL.tabBarH;
        const barW = uiFullWidth();
        const bar = this.f.mk('TabBar', this.parent, barW, barH, 0, -uiHalfHeight() + barH / 2);
        this.barRoot = bar;
        this.f.tryLoadSpriteBg(bar, 'textures/ui/product/tabbar_master_v2', barW, barH, () => this.f.fill(bar, C.navy, 0), true);

        // 与生成的母版底座七枚圆形插槽逐一对齐，而非按等间距猜测位置。
        const socketX = [-287, -198, -108, 0, 108, 198, 287];
        TAB_ORDER.forEach((id, i) => {
            const meta = TAB_META[id];
            const x = socketX[i];
            const isPlay = id === 'play';
            const slotH = isPlay ? 160 : 112;
            const b = this.f.mk('tab_' + id, bar, isPlay ? 126 : 88, slotH, x, 0);
            this.tabDots[id] = b;

            if (isPlay) {
                this.playGlow = this.f.mk('glow', b, 1, 1, 0, 0);
                const g = this.playGlow.addComponent(Graphics);
                g.fillColor = new Color(255, 214, 110, 70);
                // 中央发光由母版底座绘制，运行时不额外叠加一层粗圆。
            }

            const iconSize = isPlay ? 88 : 54;
            const iconY = 0;
            const icon = this.f.mk('ic', b, iconSize, iconSize, 0, iconY);
            this.tabIcons[id] = icon;
            this.f.loadSprite(icon, meta.icon, iconSize, iconSize, false, () => {
                const gl = this.f.label(icon, meta.label.charAt(0), isPlay ? 34 : 23, C.tabGlyph, 0, 0, iconSize, 34, true);
                gl.node.name = 'ph';
            });
            // 母版文字压在图标下沿，不额外占一行高度。
            const name = this.f.label(b, meta.label, 15, meta.enabled ? C.white : C.disabled, 0, isPlay ? -40 : -33, 88, 22, true);
            name.enableOutline = true;
            name.outlineColor = new Color(8, 19, 31, 235);
            name.outlineWidth = 2;
            this.tabLabels[id] = name;
            const btn = this.f.click(b, () => this.onTab(id));
            btn.zoomScale = 0.9;
        });
    }

    refresh(current: TabId) {
        TAB_ORDER.forEach((id) => {
            const meta = TAB_META[id];
            const icon = this.tabIcons[id];
            const lb = this.tabLabels[id];
            if (!icon) return;
            const selected = id === current;
            const isPlay = id === 'play';
            const path = isPlay && selected ? 'textures/ui/product/tab_play_on' : meta.icon;
            this.f.loadSprite(icon, path, isPlay ? 88 : 54, isPlay ? 88 : 54, false);
            icon.setScale(selected && !isPlay ? 1.12 : 1, selected && !isPlay ? 1.12 : 1, 1);
            if (lb) {
                lb.color = !meta.enabled ? C.disabled : (selected ? C.goldLt : C.white);
                lb.isBold = selected;
            }
        });
    }
}
