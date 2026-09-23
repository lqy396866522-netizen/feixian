import { Node, Color, UITransform } from 'cc';
import { UiFactory } from './UiFactory';
import { PL } from './ProductLayout';
import { GameModel } from '../GameModel';

/** 角色头顶绿/红血条（世界层，跟随单位） */
export class WorldHpBarsView {
    heroRoot!: Node;
    heroFill!: Node;
    monRoot!: Node;
    monFill!: Node;
    private barW = 88;

    constructor(private f: UiFactory, private parent: Node) {}

    build() {
        const mkBar = (name: string, fillColor: Color) => {
            const root = this.f.mk(name, this.parent, this.barW, 10, 0, 0);
            this.f.fill(root, new Color(0, 0, 0, 160), 4);
            const fill = this.f.mk('fill', root, this.barW - 4, 8, 0, 0);
            this.f.fill(fill, fillColor, 3);
            return { root, fill };
        };
        const h = mkBar('heroHpBar', new Color(72, 200, 96, 255));
        this.heroRoot = h.root;
        this.heroFill = h.fill;
        const m = mkBar('monHpBar', new Color(220, 64, 64, 255));
        this.monRoot = m.root;
        this.monFill = m.fill;
        this.monRoot.active = false;
    }

    sync(m: GameModel, hero: Node | null, focusMob: Node | null) {
        if (hero?.isValid) {
            const hh = hero.getComponent(UITransform)?.height ?? PL.charSize;
            this.heroRoot.setPosition(hero.position.x, hero.position.y + hh + 6, 0);
            this.heroRoot.active = true;
            const r = m.playerMaxHp ? m.playerHp / m.playerMaxHp : 0;
            this.f.setFillWidth(this.heroFill, this.barW - 4, r, new Color(72, 200, 96, 255));
        } else this.heroRoot.active = false;

        if (focusMob?.isValid && m.monsterMaxHp > 0) {
            const mh = focusMob.getComponent(UITransform)?.height ?? PL.mobBird;
            this.monRoot.setPosition(focusMob.position.x, focusMob.position.y + mh + 4, 0);
            this.monRoot.active = true;
            const r = m.monsterHp / m.monsterMaxHp;
            this.f.setFillWidth(this.monFill, this.barW - 4, r, new Color(220, 64, 64, 255));
        } else this.monRoot.active = false;
    }
}
