export type TabId = 'role' | 'equip' | 'spells' | 'beasts' | 'play' | 'cave' | 'alliance';

/** 母版的主玩法入口固定在第 4 个正中央。 */
export const TAB_ORDER: TabId[] = ['role', 'equip', 'spells', 'play', 'beasts', 'cave', 'alliance'];

export const TAB_META: Record<TabId, { label: string; icon: string; enabled: boolean }> = {
    role: { label: '角色', icon: 'textures/ui/product/tab_role', enabled: true },
    equip: { label: '装备', icon: 'textures/ui/product/tab_equip', enabled: true },
    spells: { label: '法术', icon: 'textures/ui/product/tab_spells', enabled: true },
    beasts: { label: '异兽', icon: 'textures/ui/product/tab_beasts', enabled: true },
    play: { label: '玩法', icon: 'textures/ui/product/tab_play', enabled: true },
    cave: { label: '洞天', icon: 'textures/ui/product/tab_cave', enabled: false },
    alliance: { label: '仙盟', icon: 'textures/ui/product/tab_alliance', enabled: true },
};
