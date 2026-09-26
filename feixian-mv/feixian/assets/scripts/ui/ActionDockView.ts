import { Label, Node, Color } from 'cc';
import { UiFactory } from './UiFactory';
import { C } from './UiTheme';
import { PL } from './ProductLayout';
import { GameModel } from '../GameModel';

const SKILL_LOCKS = ['筑基期解锁', '金丹期解锁', '元婴期解锁', '化神期解锁', '炼虚期解锁'];

/** 底部中央战斗坞：击杀任务胶囊 + 灵力球 + 技能槽（境界/自动在左右功能栏） */
export class ActionDockView {
    lblMana!: Label;

    constructor(
        private f: UiFactory,
        private parent: Node,
        private onSkillToast: (t: string) => void,
    ) {}

    build() {
        const dock = this.f.mk('ActionDock', this.parent, PL.actionDockW, PL.actionDockH, 0, PL.actionDockY);

        const mana = this.f.mk('manaOrb', dock, 86, 86, -250, -8);
        this.f.circle(mana, C.primary);
        this.f.strokeCircle(mana, new Color(190, 230, 255, 255), 2.5);
        this.lblMana = this.f.label(mana, '1000', 16, C.white, 0, -60, 92, 22, true);

        for (let i = 0; i < 6; i++) {
            const x = -140 + i * 88;
            const b = this.f.mk('sk' + i, dock, 76, 76, x, -8);
            const locked = i > 0;
            this.f.tryLoadSpriteBg(b, locked ? 'textures/ui/product/skill_slot_lock' : 'textures/ui/product/skill_slot', 76, 76, () => {
                this.f.circle(b, locked ? C.disabledBg : C.navy2);
            });
            if (locked) {
                this.f.label(b, SKILL_LOCKS[i - 1], 14, C.goldLt, 0, -58, 94, 22, true);
                this.f.click(b, () => this.onSkillToast(`${SKILL_LOCKS[i - 1]}，境界不足`));
            } else {
                const gl = this.f.label(b, '斩', 28, C.white, 0, 0, 68, 38, true);
                gl.node.name = 'ph';
                this.f.click(b, () => this.onSkillToast('请在法术页施放破邪斩'));
            }
        }
    }

    refresh(m: GameModel, _skillCd: number) {
        const s = m.save;
        const kills = m.displayKillsInStage();
        this.lblMana.string = `${m.playerMaxHp}`;
    }
}
