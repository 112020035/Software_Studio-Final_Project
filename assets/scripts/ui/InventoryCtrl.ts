import GameData from "../gameflow/GameData";
import FirebaseManager from "../firebase/FirebaseManager";
import { AudioBroadcast } from "../Audio/AudioEvent";
const { ccclass, property } = cc._decorator;

@ccclass
export default class InventoryCtrl extends cc.Component {

    @property(cc.Label)
    itemCountLabel: cc.Label = null;

    @property(cc.Sprite) part1: cc.Sprite = null;
    @property(cc.Sprite) part2: cc.Sprite = null;
    @property(cc.Sprite) part3: cc.Sprite = null;
    @property(cc.Label)  playerNameLabel: cc.Label = null;

    // 順序同 LevelResultCtrl：[道具0瑕疵, 道具0一般, 道具0最佳, 道具1瑕疵, ...]
    @property([cc.SpriteFrame])
    partFrames: cc.SpriteFrame[] = [];

    start() {
        AudioBroadcast.playBgm("inventory_bgm");
        this.bindButton("Canvas/BackButton", "onBack");

        // @ts-ignore
        const user = firebase.auth().currentUser;
        if (user) {
            FirebaseManager.loadGameData(user.uid).then(() => {
                this.refreshUI(user);
            });
        } else {
            this.refreshUI(null);
        }
    }

    private refreshUI(user: any) {
        // 顯示道具數量
        if (this.itemCountLabel) {
            this.itemCountLabel.string = `飛船等級：${GameData.itemCount}`;
        }

        // 顯示玩家名稱
        if (user && this.playerNameLabel) {
            this.playerNameLabel.string = `${user.displayName || user.email.split('@')[0]}的飛船`;
        }

        // 顯示三個道具圖
        const parts = [this.part1, this.part2, this.part3];
        for (let i = 0; i < 3; i++) {
            const quality = GameData.highQualities[i];
            const sprite  = parts[i];
            if (!sprite) continue;

            if (quality === -1) {
                sprite.node.active = false;
            } else {
                sprite.node.active = true;
                const frameIndex = i * 3 + quality;
                const frame = this.partFrames[frameIndex];
                if (frame) {
                    sprite.spriteFrame = frame;
                } else {
                    cc.warn(`[InventoryCtrl] partFrames[${frameIndex}] 未設定`);
                }
            }
        }
    }

    private bindButton(path: string, handler: string) {
        const node = cc.find(path);
        if (!node) { cc.warn(`InventoryCtrl: 找不到 ${path}`); return; }
        const eh = new cc.Component.EventHandler();
        eh.target = this.node;
        eh.component = "InventoryCtrl";
        eh.handler = handler;
        node.getComponent(cc.Button).clickEvents.push(eh);
    }

    onBack() {
        AudioBroadcast.playEffect("btn_press");
        cc.director.loadScene("Explore");
    }
}