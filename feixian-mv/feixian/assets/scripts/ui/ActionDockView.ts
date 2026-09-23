import { Label, Node, Color, Vec3 } from 'cc';
import { UiFactory } from './UiFactory';
import { C } from './UiTheme';
import { PL } from './ProductLayout';
import { GameModel } from '../GameModel';

export class ActionDockView {
    lblAuto!: Label;
    lblBreak!: Label;
    lblBreakCost!: Label;
    lblKillQuest!: Label;
    barBreakFill!: Node;
    autoBtn!: Node;
    skillCdBar!: Node;
    lblSpellCd!: Label;

    constructor(
        private f: UiFactory,
        private parent: Node,
        private onAuto: () => void,
        private onRealm: () => void,
        private onBreakBar: () => void,
        private onSkillToast: (t: string) => void,
    ) {}

    build() {
        const dock = this.f.mk('ActionDock', this.parent, PL.actionDockW, PL.actionDockH, 0, PL.actionDockY);

        this.lblKillQuest = this.f.label(dock, '击败怪物 5 个 (0/5)', 16, C.white, 40, 78, 420, 28, true);
        const kbar = this.f.mk('killBar', dock, 360, 12, 40, 58);
        this.f.fill(kbar, new Color(255, 255, 255, 100), 6);

        this.autoBtn = this.f.mk('auto', dock, 84, 84, -250, -8);
        this.f.tryLoadSpriteBg(this.autoBtn, 'textures/ui/product/btn_auto_on', 84, 84, () => {
            this.f.circle(this.autoBtn, C.gold);
        });
        this.lblAuto = this.f.label(this.autoBtn, '', 1, C.navy, 0, 0, 1, 1);
        this.lblAuto.node.active = false;
        this.f.click(this.autoBtn, () => this.onAuto());

        const realm = this.f.mk('realmOrb', dock, 72, 72, -150, -8);
        this.f.tryLoadSpriteBg(realm, 'textures/ui/product/orb_realm', 72, 72, () => {
            this.f.circle(realm, C.primary);
        });
        this.f.label(realm, '境界', 16, C.white, 0, 0, 70, 28, true);
        this.f.click(realm, () => this.onRealm());

        for (let i = 0; i < 6; i++) {
            const x = -40 + i * 58;
            const b = this.f.mk('sk' + i, dock, 48, 48, x, -8);
            const locked = i > 0;
            this.f.tryLoadSpriteBg(b, locked ? 'textures/ui/product/skill_slot_lock' : 'textures/ui/product/skill_slot', 48, 48, () => {
                this.f.circle(b, locked ? C.disabledBg : C.navy2);
            });
            if (locked) {
                this.f.label(b, '锁', 14, C.disabled, 0, -36, 70, 18);
                this.f.click(b, () => this.onSkillToast('境界不足，技能未解锁'));
            } else {
                this.f.label(b, '斩', 18, C.white, 0, 0, 50, 28, true);
                this.f.click(b, () => this.onSkillToast('请在法术页施放破邪斩'));
            }
        }

        const brRow = this.f.mk('breakRow', dock, 600, 40, 0, -78);
        this.f.tryLoadSpriteBg(brRow, 'textures/ui/product/bar_power', 600, 40, () => {
            this.f.fill(brRow, C.navy, 12);
        });
        this.barBreakFill = this.f.mk('bfill', brRow, 320, 20, -20, 0);
        this.f.fill(this.barBreakFill, C.primary, 8);
        this.lblBreak = this.f.label(brRow, '突破', 17, C.white, -20, 0, 380, 30);
        this.lblBreakCost = this.f.label(brRow, '灵石0', 17, C.goldLt, 240, 0, 120, 30, true);
        this.f.click(brRow, () => this.onBreakBar());
    }

    refresh(m: GameModel, skillCd: number) {
        const s = m.save;
        const autoTex = s.autoBattle ? 'textures/ui/product/btn_auto_on' : 'textures/ui/product/btn_auto_off';
        this.f.tryLoadSpriteBg(this.autoBtn, autoTex, 84, 84, () => {
            this.f.circle(this.autoBtn, s.autoBattle ? C.gold : C.disabledBg);
        });
        const kills = m.displayKillsInStage();
        this.lblKillQuest.string = `击败怪物 ${s.killsNeeded} 个 (${kills}/${s.killsNeeded})`;
        const need = m.nextBreakthroughNeed();
        const exp = Math.min(s.realmExp, need);
        this.lblBreak.string = `境界突破至${m.realmText} (${exp}/${need})`;
        this.lblBreakCost.string = `灵石${m.nextBreakthroughCost()}`;
        const ratio = m.breakthroughProgress();
        this.f.setFillWidth(this.barBreakFill, 320, ratio, m.breakthroughReady() ? C.ok : C.primary);
        this.barBreakFill.setPosition(-20 - 160 + (320 * Math.min(1, ratio)) / 2, 0, 0);
    }
}
