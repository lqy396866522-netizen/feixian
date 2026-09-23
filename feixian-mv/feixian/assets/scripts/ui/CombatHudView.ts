import { Label, Node, Color } from 'cc';
import { UiFactory } from './UiFactory';
import { C } from './UiTheme';
import { GameModel } from '../GameModel';

/** 战斗飘字（世界坐标）；数值 HP 由 WorldHpBarsView 负责 */
export class CombatHudView {
    lblFloat!: Label;
    floatRoot!: Node;

    constructor(private f: UiFactory, private parent: Node) {}

    build() {
        this.floatRoot = this.f.mk('floatDmg', this.parent, 120, 44, 0, 0);
        this.lblFloat = this.f.label(this.floatRoot, '', 32, C.red, 0, 0, 120, 44, true);
        this.lblFloat.enableOutline = true;
        this.lblFloat.outlineColor = new Color(0, 0, 0, 200);
        this.lblFloat.outlineWidth = 2;
        this.floatRoot.active = false;
    }

    refresh(_m: GameModel, _wildCount: number) {
        /* 顶栏/世界血条已展示 HP，此处不再叠白底面板 */
    }

    showFloatAt(x: number, y: number, text: string, color: Color) {
        this.floatRoot.setPosition(x, y, 0);
        this.floatRoot.active = true;
        this.lblFloat.string = text;
        this.lblFloat.color = color;
    }

    clearFloat() {
        this.lblFloat.string = '';
        this.floatRoot.active = false;
    }
}
