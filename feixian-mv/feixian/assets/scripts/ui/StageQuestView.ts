import { Label, Node, Color } from 'cc';
import { UiFactory } from './UiFactory';
import { C } from './UiTheme';
import { PL } from './ProductLayout';
import { GameModel } from '../GameModel';

export class StageQuestView {
    lblStage!: Label;
    lblStageProg!: Label;
    nodes: Node[] = [];
    questLbl!: Label;
    questHint!: Label;

    constructor(private f: UiFactory, private parent: Node) {}

    build() {
        // 地图名直接悬浮在野外上方，不再使用会显得像 AI 浮层的深色圆角背景。
        this.lblStage = this.f.label(this.parent, '4-碧湖泽', 31, new Color(255, 248, 220, 255), 0, PL.stageTitleY, PL.stageTitleW - 48, 46, true);
        this.lblStage.enableOutline = true;
        this.lblStage.outlineColor = new Color(20, 32, 24, 220);
        this.lblStage.outlineWidth = 3;

        const rail = this.f.mk('stageRail', this.parent, PL.stageRailW, 42, 0, PL.stageRailY);
        this.f.tryLoadSpriteBg(rail, 'textures/ui/product/stage_rail', PL.stageRailW, 42, () => {
            this.f.fill(rail, new Color(13, 50, 66, 220), 14);
        });
        const railFrame = this.f.mk('railFrame', rail, PL.stageRailW, 42, 0, 0);
        this.f.strokeRoundRect(railFrame, C.gold, 1.5, 14);
        for (let i = 0; i < 4; i++) {
            const x = -123 + i * 82;
            const n = this.f.mk('node' + i, rail, 44, 44, x, 0);
            this.f.tryLoadSpriteBg(
                n,
                i === 3 ? 'textures/ui/product/stage_node_boss' : 'textures/ui/product/stage_node',
                44,
                44,
                () => this.f.circle(n, i === 3 ? C.red : C.ok),
            );
            this.nodes.push(n);
        }
        this.lblStageProg = this.f.label(this.parent, '0/5', 18, C.goldLt, 218, PL.stageRailY, 76, 30, true);

        const banner = this.f.mk('questBanner', this.parent, PL.questBannerW, PL.questBannerH, 0, PL.questBannerY);
        this.f.tryLoadSpriteBg(banner, 'textures/ui/product/quest_banner', PL.questBannerW, PL.questBannerH, () => {
            this.f.fill(banner, new Color(12, 16, 24, 235), 10);
        });
        const bannerFrame = this.f.mk('bannerFrame', banner, PL.questBannerW, PL.questBannerH, 0, 0);
        this.f.strokeRoundRect(bannerFrame, C.gold, 1.5, 12);
        this.questLbl = this.f.label(banner, '主线  穿戴 1 件', 21, C.white, -142, 0, 185, 44);
        this.questLbl.horizontalAlign = Label.HorizontalAlign.LEFT;
        this.f.label(banner, '蓝色', 21, C.primary, 0, 0, 58, 44, true);
        this.f.label(banner, '品质装备', 21, C.white, 70, 0, 120, 44);
        this.questHint = this.f.label(banner, '(0/1)  >>', 21, new Color(255, 180, 80, 255), 182, 0, 138, 44, true);
        this.questHint.horizontalAlign = Label.HorizontalAlign.LEFT;
    }

    refresh(m: GameModel) {
        const s = m.save;
        this.lblStage.string = m.stageTitle;
        this.lblStageProg.string = `${m.displayKillsInStage()}/${s.killsNeeded}`;
        const ratio = s.killsNeeded ? m.displayKillsInStage() / s.killsNeeded : 0;
        const lit = Math.min(3, Math.floor(ratio * 4));
        this.nodes.forEach((n, i) => {
            if (!n?.isValid) return;
            const on = i < lit || (i === 3 && m.chestReady);
            const sp = n.getComponent('cc.Sprite' as any);
            if (sp?.spriteFrame) {
                n.setScale(on ? 1.08 : 0.92, on ? 1.08 : 0.92, 1);
            } else {
                this.f.circle(n, on ? (i === 3 ? C.red : C.ok) : C.disabledBg);
            }
        });
        const blue = m.equippedBlueCount();
        this.questHint.string = `(${blue}/1)  >>`;
    }
}
