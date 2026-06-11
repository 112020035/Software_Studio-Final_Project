import GameData from "../gameflow/GameData";
import { AudioBroadcast } from "../Audio/AudioEvent";
const { ccclass, property } = cc._decorator;

@ccclass
export default class InventoryCtrl extends cc.Component {

    @property(cc.Label)
    itemCountLabel: cc.Label = null;

    @property(cc.Sprite) part1: cc.Sprite = null;
    @property(cc.Sprite) part2: cc.Sprite = null;
    @property(cc.Sprite) part3: cc.Sprite = null;

    // 順序同 LevelResultCtrl：[道具0瑕疵, 道具0一般, 道具0最佳, 道具1瑕疵, ...]
    @property([cc.SpriteFrame])
    partFrames: cc.SpriteFrame[] = [];

    start() {
        AudioBroadcast.playBgm("inventory_bgm");
        if (this.itemCountLabel) {
            this.itemCountLabel.string = `已收集道具：${GameData.itemCount}`;
        }

        const parts = [this.part1, this.part2, this.part3];

        for (let i = 0; i < 3; i++) {
            const quality = GameData.partQualities[i];
            const sprite  = parts[i];

            if (!sprite) continue;

            if (quality === -1) {
                // 尚未獲得，隱藏節點
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

        this.bindButton("Canvas/BackButton", "onBack");
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