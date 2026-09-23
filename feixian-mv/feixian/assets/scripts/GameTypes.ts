/**
 * 飞仙 MVP 数值与类型表（本地）
 */
export type EquipSlot = 'weapon' | 'armor' | 'helmet' | 'boots' | 'accessory' | 'artifact';

export interface EquipItem {
    id: string;
    name: string;
    slot: EquipSlot;
    quality: string; // 白/绿/蓝
    atk: number;
    def: number;
    spd: number;
    spirit: number;
}

export interface GameSave {
    version: number;
    gold: number;
    lingshi: number;
    xianyu: number;
    stage: number;
    stageProgress: number; // 0..1 within stage clear bar (kills)
    killsInStage: number;
    killsNeeded: number;
    realmIndex: number;
    realmLayer: number;
    realmExp: number;
    autoBattle: boolean;
    sfxEnabled: boolean;
    /** P7: deployed beast id or null */
    activeBeastId: string | null;
    beasts: { id: string; name: string; power: number }[];
    inventory: EquipItem[];
    equipped: Partial<Record<EquipSlot, string>>; // item id
    materials: Record<string, number>;
    playerName: string;
    /** 展示用等级（线框），不参与战斗公式 */
    playerLevel: number;
}

export const SLOT_LABELS: Record<EquipSlot, string> = {
    weapon: '武器',
    armor: '铠甲',
    helmet: '头盔',
    boots: '靴子',
    accessory: '饰品',
    artifact: '法宝',
};

export const REALM_NAMES = [
    '炼气期前期',
    '炼气期中期',
    '炼气期后期',
    '筑基期前期',
    '筑基期中期',
    '筑基期后期',
    '金丹期前期',
];

export const STAGE_NAMES = [
    '清萍原野',
    '雾隐林',
    '碎石坡',
    '碧湖泽',
    '玄风谷',
    '赤炎原',
    '寒霜岭',
    '幽冥径',
    '天梯崖',
    '仙门前',
];

/** 怪物基础数值（再乘关卡系数） */
export function monsterStats(stage: number): { hp: number; atk: number; name: string } {
    const coef = stageCoef(stage);
    return {
        hp: Math.floor(80 * coef),
        atk: Math.floor(8 * coef),
        name: `野外怪·${stage}`,
    };
}

export function stageCoef(stage: number): number {
    return 1 + (Math.max(1, stage) - 1) * 0.35;
}

export function killsNeededForStage(stage: number): number {
    return 5 + Math.floor((stage - 1) * 1.5);
}

export function goldDrop(stage: number): number {
    return Math.floor(12 + stage * 6 + Math.random() * 8);
}

export function lingshiDrop(stage: number): number {
    return Math.random() < 0.35 ? Math.floor(1 + stage * 0.4) : 0;
}

export function materialDrop(stage: number): { id: string; name: string; n: number } | null {
    if (Math.random() > 0.25) return null;
    const table = [
        { id: 'mat_grass', name: '清萍草' },
        { id: 'mat_ore', name: '玄铁矿' },
        { id: 'mat_wood', name: '灵木屑' },
    ];
    const t = table[Math.floor(Math.random() * table.length)];
    return { id: t.id, name: t.name, n: 1 + (stage > 5 ? 1 : 0) };
}

/** 突破所需灵石 */
export function breakthroughCost(realmIndex: number, realmLayer: number): number {
    return 20 + realmIndex * 15 + realmLayer * 8;
}

/** 突破所需经验（击杀填充） */
export function breakthroughExpNeed(realmIndex: number, realmLayer: number): number {
    return 2 + realmIndex + Math.floor(realmLayer / 2);
}

export function baseCombatPower(realmIndex: number, realmLayer: number): number {
    return 5000 + realmIndex * 800 + realmLayer * 120;
}

export function equipPowerBonus(item: EquipItem | undefined | null): number {
    if (!item) return 0;
    return item.atk * 8 + item.def * 6 + item.spd * 5 + item.spirit * 4;
}

export function defaultInventory(): EquipItem[] {
    return [
        { id: 'eq_sword1', name: '青锋剑', slot: 'weapon', quality: '蓝', atk: 45, def: 0, spd: 0, spirit: 0 },
        { id: 'eq_cloth1', name: '布衣', slot: 'armor', quality: '白', atk: 0, def: 12, spd: 0, spirit: 0 },
        { id: 'eq_boots1', name: '疾风靴', slot: 'boots', quality: '绿', atk: 0, def: 0, spd: 8, spirit: 0 },
        { id: 'eq_ring1', name: '聚灵戒', slot: 'accessory', quality: '蓝', atk: 0, def: 0, spd: 0, spirit: 20 },
        { id: 'eq_sword2', name: '铁剑', slot: 'weapon', quality: '白', atk: 18, def: 0, spd: 0, spirit: 0 },
        { id: 'eq_helm1', name: '皮帽', slot: 'helmet', quality: '白', atk: 0, def: 8, spd: 0, spirit: 0 },
    ];
}


/** 野怪掉装备（约 18%），品质随关卡略提升 */
export function equipDrop(stage: number): EquipItem | null {
    if (Math.random() > 0.18) return null;
    const slots: EquipSlot[] = ['weapon', 'armor', 'helmet', 'boots', 'accessory', 'artifact'];
    const slot = slots[Math.floor(Math.random() * slots.length)];
    const qualityRoll = Math.random() + stage * 0.02;
    const quality = qualityRoll > 0.92 ? '橙' : qualityRoll > 0.7 ? '紫' : qualityRoll > 0.4 ? '蓝' : '白';
    const mult = quality === '橙' ? 3.2 : quality === '紫' ? 2.2 : quality === '蓝' ? 1.5 : 1;
    const base = 8 + stage * 3;
    const names: Record<EquipSlot, string[]> = {
        weapon: ['铁剑', '青锋', '霜刃', '灵钩'],
        armor: ['布甲', '皮甲', '玄甲', '云纹袍'],
        helmet: ['皮帽', '铁盔', '灵冠'],
        boots: ['布靴', '疾风靴', '云步履'],
        accessory: ['木戒', '玉佩', '聚灵环'],
        artifact: ['木符', '聚气珠', '护心镜'],
    };
    const pool = names[slot];
    const name = pool[Math.floor(Math.random() * pool.length)];
    const id = 'drop_' + slot + '_' + Date.now().toString(36) + '_' + Math.floor(Math.random() * 999);
    const atk = slot === 'weapon' ? Math.floor(base * mult) : Math.floor(base * 0.15 * mult);
    const def = (slot === 'armor' || slot === 'helmet') ? Math.floor(base * 0.5 * mult) : Math.floor(base * 0.1 * mult);
    const spd = slot === 'boots' ? Math.floor(base * 0.4 * mult) : 0;
    const spirit = (slot === 'accessory' || slot === 'artifact') ? Math.floor(base * 0.6 * mult) : 0;
    return { id, name: quality + '·' + name, slot, quality, atk, def, spd, spirit };
}

export function createNewSave(): GameSave {
    const inv = defaultInventory();
    return {
        version: 1,
        gold: 125000,
        lingshi: 830,
        xianyu: 56,
        stage: 2,
        stageProgress: 0,
        killsInStage: 0,
        killsNeeded: killsNeededForStage(2),
        realmIndex: 0,
        realmLayer: 2,
        realmExp: 0,
        autoBattle: true,
        sfxEnabled: true,
        activeBeastId: 'beast_fox',
        beasts: [{ id: 'beast_fox', name: '青蔓灵狐', power: 1260 }],
        inventory: inv,
        equipped: {
            weapon: 'eq_sword1',
            armor: 'eq_cloth1',
            boots: 'eq_boots1',
            accessory: 'eq_ring1',
        },
        materials: { mat_grass: 3, mat_ore: 1 },
        playerName: '玩家昵称',
        playerLevel: 2,
    };
}
