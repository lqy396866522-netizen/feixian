import {
    Node, UITransform, Graphics, Label, Color, Vec3, Button, Overflow, Sprite, SpriteFrame,
    resources, ImageAsset, Texture2D,
} from 'cc';
import { UI_FONT } from './UiTheme';
import { framePixelSize, sizeContain } from './SpriteLayout';

export class UiFactory {
    uiLayer: number;

    constructor(uiLayer: number) {
        this.uiLayer = uiLayer;
    }

    mk(name: string, parent: Node, w: number, h: number, x: number, y: number): Node {
        const n = new Node(name);
        n.layer = this.uiLayer;
        n.parent = parent;
        const ui = n.addComponent(UITransform);
        ui.setContentSize(w, h);
        ui.setAnchorPoint(0.5, 0.5);
        n.setPosition(x, y, 0);
        return n;
    }

    fill(n: Node, color: Color, r = 12) {
        let g = n.getComponent(Graphics);
        if (!g) g = n.addComponent(Graphics);
        g.clear();
        g.fillColor = color;
        const ui = n.getComponent(UITransform)!;
        g.roundRect(-ui.width / 2, -ui.height / 2, ui.width, ui.height, r);
        g.fill();
        return g;
    }

    circle(n: Node, color: Color, radius?: number) {
        let g = n.getComponent(Graphics);
        if (!g) g = n.addComponent(Graphics);
        g.clear();
        g.fillColor = color;
        const ui = n.getComponent(UITransform)!;
        g.circle(0, 0, radius ?? Math.min(ui.width, ui.height) / 2);
        g.fill();
        return g;
    }

    strokeCircle(n: Node, stroke: Color, lineWidth = 2.5) {
        let g = n.getComponent(Graphics);
        if (!g) g = n.addComponent(Graphics);
        const ui = n.getComponent(UITransform)!;
        const rad = Math.min(ui.width, ui.height) / 2 - lineWidth;
        g.strokeColor = stroke;
        g.lineWidth = lineWidth;
        g.circle(0, 0, rad);
        g.stroke();
    }

    /** 金边容器共用描边；作为背景 Sprite 的子节点时不会被贴图加载清除。 */
    strokeRoundRect(n: Node, stroke: Color, lineWidth = 2, radius = 10) {
        let g = n.getComponent(Graphics);
        if (!g) g = n.addComponent(Graphics);
        const ui = n.getComponent(UITransform)!;
        g.strokeColor = stroke;
        g.lineWidth = lineWidth;
        const inset = lineWidth / 2;
        g.roundRect(-ui.width / 2 + inset, -ui.height / 2 + inset, ui.width - lineWidth, ui.height - lineWidth, radius);
        g.stroke();
    }

    label(parent: Node, text: string, size: number, color: Color, x: number, y: number, w = 200, h = 40, bold = false): Label {
        const n = this.mk('lbl', parent, w, h, x, y);
        const l = n.addComponent(Label);
        l.string = text;
        l.fontSize = size;
        l.lineHeight = size + 4;
        l.color = color;
        l.overflow = Overflow.SHRINK;
        l.enableWrapText = false;
        l.isBold = bold;
        l.useSystemFont = true;
        l.fontFamily = UI_FONT;
        l.horizontalAlign = Label.HorizontalAlign.CENTER;
        l.verticalAlign = Label.VerticalAlign.CENTER;
        return l;
    }

    click(n: Node, fn: () => void): Button {
        let btn = n.getComponent(Button);
        if (!btn) btn = n.addComponent(Button);
        btn.transition = Button.Transition.SCALE;
        btn.zoomScale = 0.96;
        n.on(Button.EventType.CLICK, fn, n);
        n.on(Node.EventType.TOUCH_END, fn, n);
        return btn;
    }

    /** 进度条填充：父容器内左对齐，保证从右往左增长/减少（maxW 为去除内边距后的轨道宽） */
    setFillWidth(node: Node, maxW: number, ratio: number, color: Color) {
        const w = Math.max(4, maxW * Math.min(1, Math.max(0, ratio)));
        const pui = node.parent?.getComponent(UITransform);
        const pw = pui ? pui.width : maxW;
        const inset = Math.max(0, (pw - maxW) / 2);
        const left = -pw / 2 + inset;
        node.setPosition(left + w / 2, node.position.y, 0);
        const ui = node.getComponent(UITransform)!;
        ui.setContentSize(w, ui.height);
        this.fill(node, color, 7);
    }

    addRedDot(parent: Node, x: number, y: number) {
        const dot = this.mk('redDot', parent, 16, 16, x, y);
        this.loadSprite(dot, 'textures/ui/product/red_dot', 16, 16, false, () => {
            this.circle(dot, new Color(220, 64, 64, 255));
        }, true);
        return dot;
    }

    /**
     * UI 美术资源默认按原始比例 contain 到布局盒中。任何需要铺满的
     * 普通色块应使用 Graphics，而不是通过拉伸 PNG 获得。
     */
    tryLoadSpriteBg(node: Node, path: string, w: number, h: number, fallback: () => void, preserveAspect = true) {
        this.loadSprite(node, path, w, h, false, () => fallback(), preserveAspect);
    }

    applySpriteFrame(node: Node, sf: SpriteFrame, boxW: number, boxH: number, footAnchor: boolean, preserveAspect = true) {
        const sp = node.getComponent(Sprite) || node.addComponent(Sprite);
        const ui = node.getComponent(UITransform) || node.addComponent(UITransform);
        sp.spriteFrame = sf;
        sp.sizeMode = Sprite.SizeMode.CUSTOM;
        sp.type = Sprite.Type.SIMPLE;
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
        const g = node.getComponent(Graphics);
        if (g) g.enabled = false;
        for (const child of [...node.children]) {
            if (child.name.toLowerCase().includes('ph')) child.active = false;
        }
    }

    loadSprite(
        node: Node, path: string, w: number, h: number, footAnchor = false, onFail?: () => void, preserveAspect = true,
    ) {
        const ui = node.getComponent(UITransform) || node.addComponent(UITransform);
        if (footAnchor) ui.setAnchorPoint(0.5, 0);
        ui.setContentSize(w, h);
        const tryApply = (sf: SpriteFrame | null | undefined) => {
            if (!sf) return false;
            this.applySpriteFrame(node, sf, w, h, footAnchor, preserveAspect);
            return true;
        };
        resources.load(path + '/spriteFrame', SpriteFrame, (errSf, sf) => {
            if (!errSf && tryApply(sf)) return;
            resources.load(path, ImageAsset, (errImg, img) => {
                if (!errImg && img) {
                    const anySF = SpriteFrame as any;
                    const frame = typeof anySF.createWithImage === 'function'
                        ? anySF.createWithImage(img) as SpriteFrame
                        : (() => { const t = new Texture2D(); t.image = img; const f = new SpriteFrame(); f.texture = t; return f; })();
                    if (tryApply(frame)) return;
                }
                onFail && onFail();
            });
        });
    }
}
