export enum AudioEvent {
    PLAY_BGM = "audio_play_bgm",
    PLAY_EFFECT = "audio_play_effect",
    STOP_BGM = "audio_stop_bgm",
    STOP_EFFECT = "audio_stop_effect",
}

export class AudioBroadcast {
    static playBgm(name: string): void {
        const event = new cc.Event.EventCustom(AudioEvent.PLAY_BGM, true);
        event.setUserData(name);
        cc.systemEvent.dispatchEvent(event);
        cc.log(`AudioBroadcast: 發送播放BGM事件，名稱=${name}`);
    }

    static playEffect(name: string): void {
        const event = new cc.Event.EventCustom(AudioEvent.PLAY_EFFECT, true);
        event.setUserData(name);
        cc.systemEvent.dispatchEvent(event);
    }

    static stopBgm(): void {
        const event = new cc.Event.EventCustom(AudioEvent.STOP_BGM, true);
        cc.systemEvent.dispatchEvent(event);
    }

    static stopEffect(name: string): void {
        const event = new cc.Event.EventCustom(AudioEvent.STOP_EFFECT, true);
        event.setUserData(name);
        cc.systemEvent.dispatchEvent(event);
    }
}