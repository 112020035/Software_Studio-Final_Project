import GameData from "../gameflow/GameData";
import { AudioBroadcast } from "../Audio/AudioEvent";
const { ccclass, property } = cc._decorator;

@ccclass
export default class LevelResultCtrl extends cc.Component {

    @property(cc.Label)  timeLabel:      cc.Label  = null;
    @property(cc.Label)  coinsLabel:     cc.Label  = null;
    @property(cc.Label)  qualityLabel:   cc.Label  = null;
    @property(cc.Label)  scoreLabel:     cc.Label  = null;
    @property(cc.Label)  newRecordLabel: cc.Label  = null;  // 破紀錄時顯示
    @property(cc.Sprite) partImage:      cc.Sprite = null;

    @property([cc.SpriteFrame])
    partFrames: cc.SpriteFrame[] = [];

    private readonly QUALITY_NAMES = ["GOOD", "EXCELLENT", "PERFECT"];

    start() {
        AudioBroadcast.playBgm("inventory_bgm");
        const levelIndex = GameData.currentLevel - 1;
        const quality    = GameData.partQualities[levelIndex] ?? 0;

        // 更新前先記住舊的最高分
        const prevBest  = GameData.bestScores[levelIndex];
        const score     = GameData.updateBestScore();
        const isNewRecord = score > prevBest;

        if (this.timeLabel)    this.timeLabel.string    = `${GameData.levelTime}`;
        if (this.coinsLabel)   this.coinsLabel.string   = `${GameData.coins}`;
        if (this.qualityLabel) this.qualityLabel.string = this.QUALITY_NAMES[quality];
        if (this.scoreLabel)   this.scoreLabel.string   = `${score}`;

        // 破紀錄才顯示，否則隱藏
        if (this.newRecordLabel) {
            this.newRecordLabel.node.active = isNewRecord;
        }

        if (this.partImage) {
            const frameIndex = levelIndex * 3 + quality;
            const frame = this.partFrames[frameIndex];
            if (frame) {
                this.partImage.spriteFrame = frame;
            } else {
                cc.warn(`[LevelResultCtrl] partFrames[${frameIndex}] 未設定`);
            }
        }

        this.bindButton("Canvas/ContinueButton", "onContinue");
    }

    private bindButton(path: string, handler: string) {
        const node = cc.find(path);
        if (!node) { cc.warn(`LevelResultCtrl: 找不到 ${path}`); return; }
        const eh        = new cc.Component.EventHandler();
        eh.target       = this.node;
        eh.component    = "LevelResultCtrl";
        eh.handler      = handler;
        node.getComponent(cc.Button).clickEvents.push(eh);
    }

    onContinue() {
        AudioBroadcast.playEffect("btn_press");
        cc.director.loadScene("Explore");
    }
}