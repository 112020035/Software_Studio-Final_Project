/**
 * AudioManager.ts
 * 掛載節點：任意常駐節點（建議 Canvas 下獨立節點）
 * 音檔需求：resources/audio/ 資料夾下放對應名稱的音檔
 */

type AudioName =
    | "btn_press"
    | "collision"
    | "craft_flying"
    | "craft_turning"
    | "damage"
    | "enter_to_level_game"
    | "jump"
    | "level2_bgm"
    | "main_menu_bgm"
    | "main_scene_bgm"
    | "recharge"
    | "run_on_ground"
    | "run_on_water"
    | "shotting"
    | "story_line_bgm"
    | "warning";

const BGM_NAMES: AudioName[] = [
    "main_menu_bgm",
    "main_scene_bgm",
    "story_line_bgm",
    "level2_bgm",
];

const { ccclass } = cc._decorator;

@ccclass
export default class AudioManager extends cc.Component {
    public static instance: AudioManager | null = null;

    private clipMap!: Map<AudioName, cc.AudioClip>;
    private effectIds!: Map<AudioName, number>;
    private bgmId: number = -1;
    private currentBgm: AudioName | null = null;
    private bgmVolume: number = 1;
    private effectVolume: number = 1;

    protected onLoad(): void {
        if (AudioManager.instance && AudioManager.instance !== this) {
            cc.log("[AudioManager] 重複，銷毀");
            this.node.destroy();
            return;
        }

        this.clipMap = new Map();
        this.effectIds = new Map();

        AudioManager.instance = this;
        cc.game.addPersistRootNode(this.node);
    }

    // ─── BGM 控制 ───────────────────────────────────────

    public setBgmVolume(volume: number): void {
        this.bgmVolume = cc.misc.clampf(volume, 0, 1);
        if (this.bgmId !== -1) {
            cc.audioEngine.setVolume(this.bgmId, this.bgmVolume);
        }
    }

    public setEffectVolume(volume: number): void {
        this.effectVolume = cc.misc.clampf(volume, 0, 1);
    }

    public stopBgm(): void {
        if (this.bgmId === -1) return;
        cc.audioEngine.stop(this.bgmId);
        this.bgmId = -1;
        this.currentBgm = null;
    }

    public pauseBgm(): void {
        if (this.bgmId !== -1) cc.audioEngine.pause(this.bgmId);
    }

    public resumeBgm(): void {
        if (this.bgmId !== -1) cc.audioEngine.resume(this.bgmId);
    }

    // ─── Effect 控制 ────────────────────────────────────

    public stopEffect(name: AudioName): void {
        const audioId = this.effectIds.get(name);
        if (audioId === undefined) return;
        cc.audioEngine.stop(audioId);
        this.effectIds.delete(name);
    }

    public stopAllEffects(): void {
        this.effectIds.forEach((audioId) => cc.audioEngine.stop(audioId));
        this.effectIds.clear();
    }

    // ─── 語意化播放方法 ──────────────────────────────────

    public btn_press(): void { this.playEffect("btn_press"); }
    public collision(): void { this.playEffect("collision"); }
    public craft_flying(loop: boolean = true): void { this.playEffect("craft_flying", loop); }
    public craft_turning(loop: boolean = true): void { this.playEffect("craft_turning", loop); }
    public damage(): void { this.playEffect("damage"); }
    public enter_to_level_game(): void { this.playEffect("enter_to_level_game"); }
    public jump(): void { this.playEffect("jump"); }
    public recharge(): void { this.playEffect("recharge"); }
    public run_on_ground(loop: boolean = true): void { this.playEffect("run_on_ground", loop); }
    public run_on_water(loop: boolean = true): void { this.playEffect("run_on_water", loop); }
    public shotting(): void { this.playEffect("shotting"); }
    public warning(): void { this.playEffect("warning"); }

    public main_menu_bgm(): void { this.playBgm("main_menu_bgm"); }
    public main_scene_bgm(): void { this.playBgm("main_scene_bgm"); }
    public story_line_bgm(): void { this.playBgm("story_line_bgm"); }
    public level2_bgm(): void { this.playBgm("level2_bgm"); }

    // ─── 核心播放邏輯 ────────────────────────────────────

    public playBgm(name: AudioName): void {
        if (BGM_NAMES.indexOf(name) === -1) {
            cc.warn(`[AudioManager] ${name} is not a bgm.`);
            return;
        }

        if (this.currentBgm === name && this.bgmId !== -1) return;

        this.loadClip(name, (clip) => {
            this.stopBgm();
            this.bgmId = cc.audioEngine.play(clip, true, this.bgmVolume);
            cc.log(`[AudioManager] 播放 BGM：${name}，bgmId=${this.bgmId}，volume=${this.bgmVolume}`);
            this.currentBgm = name;
        });
    }

    public playEffect(name: AudioName, loop: boolean = false): void {
        this.loadClip(name, (clip) => {
            const oldAudioId = this.effectIds.get(name);
            if (oldAudioId !== undefined) cc.audioEngine.stop(oldAudioId);

            const audioId = cc.audioEngine.play(clip, loop, this.effectVolume);
            this.effectIds.set(name, audioId);

            if (!loop) {
                cc.audioEngine.setFinishCallback(audioId, () => {
                    this.effectIds.delete(name);
                });
            }
        });
    }

    // ─── 動態載入（對應 resources/audio/ 資料夾）────────

    private loadClip(name: AudioName, callback: (clip: cc.AudioClip) => void): void {
        // 有快取直接用
        const cached = this.clipMap.get(name);
        if (cached) {
            callback(cached);
            return;
        }

        // cc.log(`[AudioManager] 嘗試載入：audio/${name}`); // ← 加這行
        cc.loader.loadRes(`audio/${name}`, cc.AudioClip, (err, clip) => {
            if (err || !clip) {
                cc.error(`[AudioManager] 載入失敗：`, err); // ← 改成 error 看詳細錯誤
                return;
            }
            // cc.log(`[AudioManager] 載入成功：audio/${name}`); // ← 加這行
            this.clipMap.set(name, clip);
            callback(clip);
        });
    }
}