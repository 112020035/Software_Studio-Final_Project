import GameData from "../gameflow/GameData";
import FirebaseManager from "../firebase/FirebaseManager";
import { AudioBroadcast } from "../Audio/AudioEvent";
const { ccclass, property } = cc._decorator;

@ccclass
export default class InventoryCtrl extends cc.Component {

    @property(cc.Label)
    itemCountLabel: cc.Label = null;

    @property(cc.Label)
    totalScoreLabel: cc.Label = null;

    @property(cc.Sprite) part1: cc.Sprite = null;
    @property(cc.Sprite) part2: cc.Sprite = null;
    @property(cc.Sprite) part3: cc.Sprite = null;
    @property(cc.Label)  playerNameLabel: cc.Label = null;

    @property(cc.Label) partLabel1: cc.Label = null;
    @property(cc.Label) partLabel2: cc.Label = null;
    @property(cc.Label) partLabel3: cc.Label = null;

    // 順序同 LevelResultCtrl：[道具0瑕疵, 道具0一般, 道具0最佳, 道具1瑕疵, ...]
    @property([cc.SpriteFrame])
    partFrames: cc.SpriteFrame[] = [];

    private readonly PART_NAMES = ['主核心晶體', '重力引擎模組', '航行控制核心'];
    private readonly QUALITY_NAMES = ['老舊的', '普通的', '良好的'];

    start() {
        AudioBroadcast.playBgm("inventory_bgm");
        this.bindButton("Canvas/BackButton", "onBack");

        const user = FirebaseManager.auth.currentUser;
        this.refreshUI(user);
        this.loadLatestInventory(user);
    }

    private async loadLatestInventory(user: any) {
        if (!user) return;

        await GameData.loadFromFirestore();
        this.refreshUI(user);
    }

    private refreshUI(user: any) {
        // 顯示道具數量
        if (this.itemCountLabel) {
            this.itemCountLabel.string = `飛船等級：${GameData.itemCount}`;
        }

        if (this.totalScoreLabel) {
            this.totalScoreLabel.string = `玩家分數：${GameData.bestScores[1] + GameData.bestScores[2]}`;
        }

        // 顯示玩家名稱
        if (user && this.playerNameLabel) {
            this.playerNameLabel.string = `${user.displayName || user.email.split('@')[0]}的飛船`;
        }

        // 顯示三個道具圖（位置不動）
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

        // 顯示文字標籤：有效項目依序遞補填入 label slot
        const slots = [this.partLabel1, this.partLabel2, this.partLabel3];
        const activeItems: { quality: number, partIndex: number }[] = [];
        for (let i = 0; i < 3; i++) {
            const quality = GameData.highQualities[i];
            if (quality !== -1) {
                activeItems.push({ quality, partIndex: i });
            }
        }
        for (let s = 0; s < slots.length; s++) {
            const slot = slots[s];
            if (!slot) continue;
            if (s < activeItems.length) {
                const { quality, partIndex } = activeItems[s];
                slot.node.active = true;
                slot.string = `${this.QUALITY_NAMES[quality]}${this.PART_NAMES[partIndex]}`;
            } else {
                slot.node.active = false;
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
