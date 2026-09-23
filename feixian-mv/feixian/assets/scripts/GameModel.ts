import {
    EquipItem, EquipSlot, GameSave, REALM_NAMES, STAGE_NAMES, SLOT_LABELS,
    baseCombatPower, breakthroughCost, breakthroughExpNeed, equipPowerBonus,
    equipDrop, goldDrop, killsNeededForStage, lingshiDrop, materialDrop, monsterStats, stageCoef,
} from './GameTypes';
import { SaveSystem } from './SaveSystem';

export class GameModel {
    save: GameSave;
    /** runtime combat */
    playerHp = 100;
    playerMaxHp = 100;
    monsterHp = 0;
    monsterMaxHp = 0;
    monsterAtk = 0;
    monsterName = '';
    lastLog = '';
    lastLoot: { gold: number; lingshi: number; materials: string[]; equip: EquipItem | null; cleared: boolean } | null = null;
    chestReady = false;
    dirty = false;

    constructor() {
        this.save = SaveSystem.load();
        this.recalcPlayerHp();
        this.spawnMonster();
    }

    persist(): void {
        SaveSystem.save(this.save);
        this.dirty = false;
    }

    get sfxEnabled(): boolean {
        return this.save.sfxEnabled !== false;
    }

    toggleSfx(): boolean {
        this.save.sfxEnabled = !this.sfxEnabled;
        this.persist();
        return this.sfxEnabled;
    }

    playSfxHook: ((name?: string) => void) | null = null;

    playSfx(name?: string): void {
        if (!this.sfxEnabled) return;
        this.playSfxHook && this.playSfxHook(name || 'click');
    }

    getActiveBeast(): { id: string; name: string; power: number } | null {
        const id = this.save.activeBeastId;
        if (!id || !this.save.beasts) return null;
        return this.save.beasts.find((b) => b.id === id) || null;
    }

    deployBeast(id: string): boolean {
        const b = (this.save.beasts || []).find((x) => x.id === id);
        if (!b) return false;
        this.save.activeBeastId = id;
        this.persist();
        return true;
    }



    maybePersist(): void {
        if (this.dirty) this.persist();
    }

    get combatPower(): number {
        let p = baseCombatPower(this.save.realmIndex, this.save.realmLayer);
        for (const slot of Object.keys(SLOT_LABELS) as EquipSlot[]) {
            const id = this.save.equipped[slot];
            if (!id) continue;
            p += equipPowerBonus(this.getItem(id));
        }
        return Math.floor(p);
    }

    get realmText(): string {
        const name = REALM_NAMES[Math.min(this.save.realmIndex, REALM_NAMES.length - 1)];
        return `${name}·${this.cnLayer(this.save.realmLayer)}层`;
    }

    get stageTitle(): string {
        const idx = ((this.save.stage - 1) % STAGE_NAMES.length);
        return `${this.save.stage}-${STAGE_NAMES[idx]}`;
    }

    cnLayer(n: number): string {
        const map = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
        return map[n] ?? String(n);
    }

    getItem(id: string): EquipItem | undefined {
        return this.save.inventory.find((i) => i.id === id);
    }

    getEquipped(slot: EquipSlot): EquipItem | undefined {
        const id = this.save.equipped[slot];
        return id ? this.getItem(id) : undefined;
    }

    playerAtk(): number {
        let atk = 20 + this.save.realmIndex * 8 + this.save.realmLayer * 2;
        atk += Math.floor(this.combatPower / 200);
        for (const slot of Object.keys(SLOT_LABELS) as EquipSlot[]) {
            const it = this.getEquipped(slot);
            if (it) atk += it.atk;
        }
        return atk;
    }

    playerDef(): number {
        let d = 5 + this.save.realmIndex * 2;
        for (const slot of Object.keys(SLOT_LABELS) as EquipSlot[]) {
            const it = this.getEquipped(slot);
            if (it) d += it.def;
        }
        return d;
    }

    recalcPlayerHp(): void {
        this.playerMaxHp = 100 + this.save.realmIndex * 40 + this.save.realmLayer * 10 + this.playerDef() * 2;
        this.playerHp = Math.min(this.playerHp || this.playerMaxHp, this.playerMaxHp);
        if (this.playerHp <= 0) this.playerHp = this.playerMaxHp;
    }

    spawnMonster(): void {
        const m = monsterStats(this.save.stage);
        this.monsterMaxHp = m.hp;
        this.monsterHp = m.hp;
        this.monsterAtk = m.atk;
        this.monsterName = m.name;
    }

    /** one combat tick; returns events for UI */
    combatTick(): { dmgToMonster: number; dmgToPlayer: number; dodge: boolean; killed: boolean; cleared: boolean } {
        const dodge = Math.random() < 0.08;
        let dmgToPlayer = 0;
        if (!dodge) {
            dmgToPlayer = Math.max(1, this.monsterAtk - Math.floor(this.playerDef() * 0.3));
            this.playerHp = Math.max(0, this.playerHp - dmgToPlayer);
        }
        const dmgToMonster = Math.max(1, this.playerAtk() + Math.floor(Math.random() * 10) - 3);
        this.monsterHp = Math.max(0, this.monsterHp - dmgToMonster);

        let killed = false;
        let cleared = false;
        if (this.monsterHp <= 0) {
            killed = true;
            this.onMonsterKilled();
            if (this.save.killsInStage >= this.save.killsNeeded) {
                cleared = true;
                this.chestReady = true;
            }
            this.spawnMonster();
            if (this.playerHp <= 0) {
                this.playerHp = this.playerMaxHp;
                this.lastLog = '重伤回阵，恢复生机…';
            }
        } else if (this.playerHp <= 0) {
            this.playerHp = this.playerMaxHp;
            this.lastLog = '重伤回阵，恢复生机…';
        }
        this.dirty = true;
        return { dmgToMonster, dmgToPlayer, dodge, killed, cleared };
    }

    onMonsterKilled(): void {
        const s = this.save;
        if (s.killsInStage < s.killsNeeded) {
            s.killsInStage += 1;
        }
        s.stageProgress = Math.min(1, s.killsInStage / Math.max(1, s.killsNeeded));
        if (s.killsInStage >= s.killsNeeded) {
            this.chestReady = true;
        }
        const g = goldDrop(s.stage);
        s.gold += g;
        const ls = lingshiDrop(s.stage);
        if (ls) s.lingshi += ls;
        const mats: string[] = [];
        const mat = materialDrop(s.stage);
        if (mat) {
            s.materials[mat.id] = (s.materials[mat.id] || 0) + mat.n;
            mats.push(mat.name + 'x' + mat.n);
        }
        const eq = equipDrop(s.stage);
        if (eq) s.inventory.push(eq);
        s.realmExp += 1;
        this.lastLoot = { gold: g, lingshi: ls || 0, materials: mats, equip: eq, cleared: false };
        this.lastLog = '击杀 +' + g + '金' + (ls ? ' +' + ls + '灵石' : '') + (mats.length ? ' +' + mats.join(',') : '') + (eq ? ' 掉落[' + eq.name + ']' : '');
        this.persist();
    }

    advanceStage(): void {
        this.save.stage += 1;
        this.save.killsInStage = 0;
        this.save.killsNeeded = killsNeededForStage(this.save.stage);
        this.save.stageProgress = 0;
        if (this.lastLoot) this.lastLoot.cleared = true;
        this.lastLog = '通关！进入 ' + this.stageTitle;
        this.persist();
    }

    breakthroughReady(): boolean {
        const need = breakthroughExpNeed(this.save.realmIndex, this.save.realmLayer);
        const cost = breakthroughCost(this.save.realmIndex, this.save.realmLayer);
        return this.save.realmExp >= need && this.save.lingshi >= cost;
    }

    breakthroughProgress(): number {
        const need = breakthroughExpNeed(this.save.realmIndex, this.save.realmLayer);
        return Math.min(1, this.save.realmExp / need);
    }

    tryBreakthrough(): boolean {
        if (!this.breakthroughReady()) return false;
        const cost = breakthroughCost(this.save.realmIndex, this.save.realmLayer);
        this.save.lingshi -= cost;
        this.save.realmExp = 0;
        this.save.realmLayer += 1;
        if (this.save.realmLayer > 9) {
            this.save.realmLayer = 1;
            this.save.realmIndex = Math.min(this.save.realmIndex + 1, REALM_NAMES.length - 1);
        }
        this.recalcPlayerHp();
        this.lastLog = `突破成功！${this.realmText} 战力 ${this.combatPower}`;
        this.persist();
        return true;
    }

    wear(itemId: string): boolean {
        const item = this.getItem(itemId);
        if (!item) return false;
        this.save.equipped[item.slot] = item.id;
        this.recalcPlayerHp();
        this.lastLog = `穿戴 ${item.name}`;
        this.persist();
        return true;
    }

    tryOpenChest(): boolean {
        if (!this.chestReady) return false;
        const s = this.save;
        const g = 30 + s.stage * 15;
        s.gold += g;
        const ls = 2 + Math.floor(s.stage / 2);
        s.lingshi += ls;
        const eq = equipDrop(s.stage + 1);
        if (eq) s.inventory.push(eq);
        this.lastLoot = { gold: g, lingshi: ls, materials: [], equip: eq, cleared: true };
        this.lastLog = "开宝箱 +" + g + "金 +" + ls + "灵石" + (eq ? " [" + eq.name + "]" : "");
        this.chestReady = false;
        this.advanceStage();
        this.persist();
        return true;
    }

    toggleAuto(): void {
        this.save.autoBattle = !this.save.autoBattle;
        this.persist();
    }

    fmtGold(n: number): string {
        if (n >= 10000) return `${(n / 10000).toFixed(n >= 100000 ? 1 : 1)}万`.replace('.0万', '万');
        return String(n);
    }

    nextBreakthroughCost(): number {
        return breakthroughCost(this.save.realmIndex, this.save.realmLayer);
    }

    nextBreakthroughNeed(): number {
        return breakthroughExpNeed(this.save.realmIndex, this.save.realmLayer);
    }

    realmStatusLine(): string {
        const need = this.nextBreakthroughNeed();
        const exp = Math.min(this.save.realmExp, need);
        return `${this.realmText} · ${this.save.realmLayer}层 ${this.save.playerLevel}级 (${exp}/${need})`;
    }

    displayKillsInStage(): number {
        return Math.min(this.save.killsInStage, this.save.killsNeeded);
    }

    previewPowerAfterBreak(): number {
        let ri = this.save.realmIndex;
        let rl = this.save.realmLayer + 1;
        if (rl > 9) {
            rl = 1;
            ri = Math.min(ri + 1, REALM_NAMES.length - 1);
        }
        let p = baseCombatPower(ri, rl);
        for (const slot of Object.keys(SLOT_LABELS) as EquipSlot[]) {
            const id = this.save.equipped[slot];
            if (!id) continue;
            p += equipPowerBonus(this.getItem(id));
        }
        return Math.floor(p);
    }

    hasBetterEquip(): boolean {
        for (const item of this.save.inventory) {
            const cur = this.getEquipped(item.slot);
            if (!cur) return true;
            if (equipPowerBonus(item) > equipPowerBonus(cur)) return true;
        }
        return false;
    }

    equippedBlueCount(): number {
        let n = 0;
        for (const slot of Object.keys(SLOT_LABELS) as EquipSlot[]) {
            const it = this.getEquipped(slot);
            if (it && it.quality.includes('蓝')) n++;
        }
        return n;
    }
}
