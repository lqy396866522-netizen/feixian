import { Node, Color, BlockInputEvents, Label } from 'cc';
import { UiFactory } from './UiFactory';
import { C } from './UiTheme';
import { DESIGN_W, DESIGN_H } from './ProductLayout';
import { GameModel } from '../GameModel';
import { SaveSystem } from '../SaveSystem';

export class MenuOverlayView {
    root!: Node;
    lblSfx!: Label;
    private sfxIcon!: Node;
    private onToggleSfx!: () => void;
    private onClose!: () => void;
    private onRebuild!: () => void;

    constructor(private f: UiFactory, private parent: Node) {}

    build(
        onToggleSfx: () => void,
        onClose: () => void,
        onRebuild: () => void,
    ) {
        this.onToggleSfx = onToggleSfx;
        this.onClose = onClose;
        this.onRebuild = onRebuild;
        this.root = this.f.mk('MenuOverlay', this.parent, DESIGN_W, DESIGN_H, 0, 0);
        this.root.addComponent(BlockInputEvents);
        this.root.active = false;
        this.f.fill(this.f.mk('dim', this.root, DESIGN_W, DESIGN_H, 0, 0), new Color(0, 0, 0, 160), 0);
        const panel = this.f.mk('panel', this.root, 560, 520, 0, 40);
        this.f.tryLoadSpriteBg(panel, 'textures/ui/product/panel_frame', 560, 520, () => {
            this.f.fill(panel, C.panel, 20);
        });
        this.f.label(panel, '菜单 / 设置', 28, C.navy, 0, 220, 300, 40, true);
        const close = this.f.mk('close', panel, 120, 44, 200, 220);
        this.f.fill(close, C.disabledBg, 10);
        this.f.label(close, '关闭', 20, C.ink, 0, 0, 100, 36, true);
        this.f.click(close, () => onClose());

        const row = this.f.mk('sfxRow', panel, 480, 52, 0, 120);
        this.f.fill(row, new Color(240, 245, 250, 255), 12);
        this.sfxIcon = this.f.mk('sfxIcon', row, 36, 36, -200, 0);
        this.f.label(row, '音效', 22, C.ink, -120, 0, 100, 36, true);
        this.lblSfx = this.f.label(row, '开', 22, C.ok, 160, 0, 80, 36, true);
        this.f.click(row, () => onToggleSfx());

        const clearBtn = this.f.mk('clear', panel, 240, 48, 0, 20);
        this.f.fill(clearBtn, C.red, 12);
        this.f.label(clearBtn, '清除存档', 20, C.white, 0, 0, 200, 40, true);
        let arm = false;
        this.f.click(clearBtn, () => {
            if (!arm) { arm = true; return; }
            SaveSystem.clear();
            arm = false;
            onRebuild();
            onClose();
        });
    }

    open(model: GameModel) {
        this.root.active = true;
        // 顶栏/Tab  sibling 900/901，菜单需压在其上（toast 999 仍最顶）
        this.root.setSiblingIndex(990);
        this.refreshSfx(model.sfxEnabled);
    }

    close() {
        this.root.active = false;
    }

    refreshSfx(on: boolean) {
        this.lblSfx.string = on ? '开' : '关';
        this.lblSfx.color = on ? C.ok : C.disabled;
        this.f.loadSprite(this.sfxIcon, on ? 'textures/icons/sfx_on' : 'textures/icons/sfx_off', 36, 36, false);
    }
}
