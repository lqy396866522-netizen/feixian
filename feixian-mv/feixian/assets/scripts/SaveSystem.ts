import { sys } from 'cc';
import { GameSave, createNewSave } from './GameTypes';

const SAVE_KEY = 'feixian_mvp_save_v1';

function storageGet(key: string): string | null {
    try {
        if (sys && sys.localStorage) {
            const v = sys.localStorage.getItem(key);
            if (v != null) return v;
        }
    } catch (_) { /* fall through */ }
    try {
        if (typeof localStorage !== 'undefined') return localStorage.getItem(key);
    } catch (_) { /* ignore */ }
    return null;
}

function storageSet(key: string, value: string): void {
    try {
        if (sys && sys.localStorage) sys.localStorage.setItem(key, value);
    } catch (_) { /* ignore */ }
    try {
        if (typeof localStorage !== 'undefined') localStorage.setItem(key, value);
    } catch (_) { /* ignore */ }
}

function storageRemove(key: string): void {
    try {
        if (sys && sys.localStorage) sys.localStorage.removeItem(key);
    } catch (_) { /* ignore */ }
    try {
        if (typeof localStorage !== 'undefined') localStorage.removeItem(key);
    } catch (_) { /* ignore */ }
}

export class SaveSystem {
    static load(): GameSave {
        try {
            const raw = storageGet(SAVE_KEY);
            if (!raw) return createNewSave();
            const data = JSON.parse(raw) as GameSave;
            if (!data || data.version !== 1) return createNewSave();
            const base = createNewSave();
            const merged = { ...base, ...data, inventory: data.inventory && data.inventory.length ? data.inventory : base.inventory };
            if (typeof (merged as any).sfxEnabled !== 'boolean') (merged as any).sfxEnabled = true;
            if ((merged as any).activeBeastId === undefined) (merged as any).activeBeastId = 'beast_fox';
            if (!Array.isArray((merged as any).beasts) || !(merged as any).beasts.length) {
                (merged as any).beasts = [{ id: 'beast_fox', name: '青蔓灵狐', power: 1260 }];
            }
            if (typeof (merged as any).playerLevel !== 'number') (merged as any).playerLevel = 2;
            return merged;
        } catch (e) {
            console.warn('[SaveSystem] load failed', e);
            return createNewSave();
        }
    }

    static save(data: GameSave): void {
        try {
            storageSet(SAVE_KEY, JSON.stringify(data));
        } catch (e) {
            console.warn('[SaveSystem] save failed', e);
        }
    }

    static clear(): void {
        storageRemove(SAVE_KEY);
    }
}
