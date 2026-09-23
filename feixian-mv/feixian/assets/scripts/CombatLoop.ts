import { GameModel } from './GameModel';

export type CombatEvent = {
    dmgToMonster: number;
    dmgToPlayer: number;
    dodge: boolean;
    killed: boolean;
    cleared: boolean;
};

/**
 * 驱动自动战斗节奏（由 MainGame update 调用）
 */
export class CombatLoop {
    model: GameModel;
    interval = 0.85;
    acc = 0;
    onTick: ((ev: CombatEvent) => void) | null = null;

    constructor(model: GameModel) {
        this.model = model;
    }

    update(dt: number, hasTargetInRange = true): void {
        if (!this.model.save.autoBattle || !hasTargetInRange) {
            this.acc = 0;
            return;
        }
        this.acc += dt;
        if (this.acc < this.interval) return;
        this.acc = 0;
        const ev = this.model.combatTick();
        this.onTick && this.onTick(ev);
    }

    forceTick(): CombatEvent {
        const ev = this.model.combatTick();
        this.onTick && this.onTick(ev);
        return ev;
    }
}
