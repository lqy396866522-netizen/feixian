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
        this.lblStage = this.f.label(this.parent, '4-碧湖泽', 30, new Color(255, 248, 220, 255), 0, PL.stageTitleY, PL.stageTitleW, 40, true);

        const rail = this.f.mk('stageRail', this.parent, PL.stageRailW, 28, 0, PL.stageRailY);
        this.f.tryLoadSpriteBg(rail, 'textures/ui/product/stage_rail', PL.stageRailW, 28, () => {
            this.f.fill(rail, new Color(40, 120, 60, 180), 12);
        });
        for (let i = 0; i < 4; i++) {
            const x = -165 + i * 110;
            const n = this.f.mk('node' + i, rail, 32, 32, x, 0);
            this.f.tryLoadSpriteBg(
                n,
                i === 3 ? 'textures/ui/product/stage_node_boss' : 'textures/ui/product/stage_node',
                32,
                32,
                () => this.f.circle(n, i === 3 ? C.red : C.ok),
            );
            this.nodes.push(n);
        }
        this.lblStageProg = this.f.label(this.parent, '0/5', 15, C.goldLt, 250, PL.stageRailY, 72, 24, true);

        const banner = this.f.mk('questBanner', this.parent, PL.questBannerW, PL.questBannerH, 0, PL.questBannerY);
        this.f.tryLoadSpriteBg(banner, 'textures/ui/product/quest_banner', PL.questBannerW, PL.questBannerH, () => {
            this.f.fill(banner, new Color(12, 16, 24, 235), 10);
        });
        this.questLbl = this.f.label(banner, '穿戴 1 件', 17, C.white, -120, 0, 100, 36);
        this.questLbl.horizontalAlign = Label.HorizontalAlign.LEFT;
        this.f.label(banner, '蓝色', 17, C.primary, -20, 0, 48, 36, true);
        this.f.label(banner, '品质装备', 17, C.white, 30, 0, 100, 36);
        this.questHint = this.f.label(banner, '(0/1)  >>', 17, new Color(255, 180, 80, 255), 140, 0, 120, 36, true);
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
