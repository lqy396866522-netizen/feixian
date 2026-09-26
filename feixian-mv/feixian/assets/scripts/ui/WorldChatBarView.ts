import { Label, Node } from 'cc';
import { UiFactory } from './UiFactory';
import { C, WORLD_CHAT_LINES } from './UiTheme';
import { PL } from './ProductLayout';
import { uiHalfHeight } from './SpriteLayout';

/** 世界聊天条：贴 Tab 栏上沿，随可见高度自适应 */
export class WorldChatBarView {
    lbl!: Label;
    root!: Node;
    private idx = 0;

    constructor(private f: UiFactory, private parent: Node) {}

    build() {
        const y = -uiHalfHeight() + PL.tabBarH + PL.chatH / 2 + 10;
        const chat = this.f.mk('chat', this.parent, PL.chatW, PL.chatH, 0, y);
        this.root = chat;
        this.f.fill(chat, C.chat, 14);
        this.f.strokeRoundRect(chat, C.gold, 1.5, 14);
        // 原图是 680×40，只以原始尺寸作为中部装饰，外层加高不拉伸图片。
        const skin = this.f.mk('chatSkin', chat, 680, 40, 0, 0);
        this.f.tryLoadSpriteBg(skin, 'textures/ui/product/chat_bar', 680, 40, () => {}, true);
        this.lbl = this.f.label(chat, WORLD_CHAT_LINES[0], 17, C.white, 0, 0, PL.chatW - 38, PL.chatH - 12);
        this.lbl.horizontalAlign = Label.HorizontalAlign.LEFT;
    }

    tick(dtAcc: number): boolean {
        if (dtAcc > 8) {
            this.idx = (this.idx + 1) % WORLD_CHAT_LINES.length;
            this.lbl.string = WORLD_CHAT_LINES[this.idx];
            return true;
        }
        return false;
    }
}
