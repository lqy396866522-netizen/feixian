import { AudioClip, AudioSource, Node, resources } from 'cc';

const CLIPS: Record<string, string> = {
    click: 'audio/click',
    hit: 'audio/hit',
    break: 'audio/break',
};

/**
 * 最小 MVP 音效：resources/audio/*.mp3，缺失时静默。
 */
export class SfxPlayer {
    private src: AudioSource;
    private cache: Partial<Record<string, AudioClip>> = {};
    private enabled = true;

    constructor(host: Node) {
        this.src = host.getComponent(AudioSource) || host.addComponent(AudioSource);
        this.src.volume = 0.55;
        Object.keys(CLIPS).forEach((k) => {
            resources.load(CLIPS[k], AudioClip, (err, clip) => {
                if (!err && clip) this.cache[k] = clip;
            });
        });
    }

    setEnabled(on: boolean): void {
        this.enabled = on;
    }

    play(name: string): void {
        if (!this.enabled) return;
        const clip = this.cache[name];
        if (clip) this.src.playOneShot(clip, 0.55);
    }
}
