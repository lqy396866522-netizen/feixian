import {
    Node, UITransform, Graphics, Label, Color, Vec3, Button, Overflow, Sprite, SpriteFrame,
    resources, ImageAsset, Texture2D,
} from 'cc';
import { UI_FONT } from './UiTheme';

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

    click(n: Node, fn: () => void) {
        let btn = n.getComponent(Button);
        if (!btn) btn = n.addComponent(Button);
        btn.transition = Button.Transition.SCALE;
        btn.zoomScale = 0.96;
        n.on(Button.EventType.CLICK, fn, n);
        n.on(Node.EventType.TOUCH_END, fn, n);
    }

    setFillWidth(node: Node, maxW: number, ratio: number, color: Color) {
        const w = Math.max(8, maxW * Math.min(1, Math.max(0, ratio)));
        const ui = node.getComponent(UITransform)!;
        ui.setContentSize(w, ui.height);
        this.fill(node, color, 7);
    }

    addRedDot(parent: Node, x: number, y: number) {
        const dot = this.mk('redDot', parent, 16, 16, x, y);
        this.loadSprite(dot, 'textures/ui/product/red_dot', 16, 16, false, () => {
            this.circle(dot, new Color(220, 64, 64, 255));
        });
        return dot;
    }

    tryLoadSpriteBg(node: Node, path: string, w: number, h: number, fallback: () => void) {
        this.loadSprite(node, path, w, h, false, () => fallback());
    }

    applySpriteFrame(node: Node, sf: SpriteFrame, w: number, h: number, footAnchor: boolean) {
        const sp = node.getComponent(Sprite) || node.addComponent(Sprite);
        const ui = node.getComponent(UITransform) || node.addComponent(UITransform);
        sp.spriteFrame = sf;
        sp.sizeMode = Sprite.SizeMode.CUSTOM;
        sp.type = Sprite.Type.SIMPLE;
        if (footAnchor) ui.setAnchorPoint(0.5, 0);
        else ui.setAnchorPoint(0.5, 0.5);
        ui.setContentSize(w, h);
        const g = node.getComponent(Graphics);
        if (g) g.enabled = false;
        for (const child of [...node.children]) {
            if (child.name.toLowerCase().includes('ph')) child.active = false;
        }
    }

    loadSprite(node: Node, path: string, w: number, h: number, footAnchor = false, onFail?: () => void) {
        const ui = node.getComponent(UITransform) || node.addComponent(UITransform);
        if (footAnchor) ui.setAnchorPoint(0.5, 0);
        ui.setContentSize(w, h);
        const tryApply = (sf: SpriteFrame | null | undefined) => {
            if (!sf) return false;
            this.applySpriteFrame(node, sf, w, h, footAnchor);
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
