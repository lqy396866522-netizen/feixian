import { Label } from 'cc';
import { UiFactory } from './UiFactory';
import { C, WORLD_CHAT_LINES } from './UiTheme';
import { DESIGN_W, PL } from './ProductLayout';

export class WorldChatBarView {
    lbl!: Label;
    private idx = 0;

    constructor(private f: UiFactory, private parent: Node) {}

    build() {
        const chat = this.f.mk('chat', this.parent, PL.chatW, PL.chatH, 0, PL.chatY);
        this.f.tryLoadSpriteBg(chat, 'textures/ui/product/chat_bar', PL.chatW, PL.chatH, () => {
            this.f.fill(chat, C.chat, 8);
        });
        this.lbl = this.f.label(chat, WORLD_CHAT_LINES[0], 16, C.white, 0, 0, PL.chatW - 24, 30);
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
