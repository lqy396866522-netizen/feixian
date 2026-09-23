import { view, SpriteFrame } from 'cc';
import { DESIGN_W, SAFE_X } from './ProductLayout';

/** 在 box 内等比缩放，避免图标被拉扁 */
export function sizeContain(boxW: number, boxH: number, frameW: number, frameH: number): { w: number; h: number } {
    if (frameW <= 0 || frameH <= 0) return { w: boxW, h: boxH };
    const s = Math.min(boxW / frameW, boxH / frameH);
    return { w: frameW * s, h: frameH * s };
}

export function framePixelSize(sf: SpriteFrame): { w: number; h: number } {
    const os = sf.originalSize;
    if (os?.width > 0 && os.height > 0) return { w: os.width, h: os.height };
    const r = sf.rect;
    return { w: r.width, h: r.height };
}

/** 当前可见设计坐标半宽（SHOW_ALL / FIXED_WIDTH 下通常为 360） */
export function uiHalfWidth(): number {
    const vs = view.getVisibleSize();
    return Math.max(280, Math.min(DESIGN_W / 2 - SAFE_X, vs.width / 2 - SAFE_X));
}
