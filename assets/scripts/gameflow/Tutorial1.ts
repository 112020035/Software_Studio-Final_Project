/**
 * Tutorial1Ctrl.ts
 * 場景：Tutorial1
 * 掛載節點：Canvas
 *
 * 使用方式：
 *   將此腳本掛在 Canvas 上，
 *   再於 Inspector 將 text、hint、tutorial 節點拖入對應欄位。
 *
 * 流程：
 *   啟動        → text / hint 顯示，text 下的 Label 淡入；tutorial 隱藏
 *   第一次點擊  → text / hint 隱藏，tutorial 顯示
 *   第二次點擊  → 載入 Level1 場景
 */
const { ccclass, property } = cc._decorator;

@ccclass
export default class Tutorial1Ctrl extends cc.Component {

    @property(cc.Node)
    textNode: cc.Node = null;

    @property(cc.Node)
    hintNode: cc.Node = null;

    @property(cc.Node)
    tutorialNode: cc.Node = null;

    /** Label 淡入持續秒數 */
    @property
    fadeDuration: number = 2.0;

    private switched: boolean = false;

    start() {
        if (!this.textNode || !this.hintNode || !this.tutorialNode) {
            cc.warn("Tutorial1Ctrl: 請在 Inspector 將 text / hint / tutorial 節點拖入");
            return;
        }

        // 初始狀態
        this.textNode.active     = true;
        this.hintNode.active     = true;
        this.tutorialNode.active = false;

        // text 底下所有 Label 淡入
        this.fadeInLabels(this.textNode);

        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    onDestroy() {
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    private onTouchEnd() {
        if (!this.switched) {
            // 強制停止殘留淡入動畫，直接設為完全顯示
            this.collectLabels(this.textNode).forEach(label => {
                label.stopAllActions();
                label.opacity = 255;
            });

            this.textNode.active     = false;
            this.hintNode.active     = false;
            this.tutorialNode.active = true;
            this.switched = true;

        } else {
            cc.director.loadScene("Level1");
        }
    }

    private fadeInLabels(root: cc.Node) {
        const labels = this.collectLabels(root);
        if (labels.length === 0) return;

        labels.forEach(label => {
            const originalOpacity = label.opacity > 0 ? label.opacity : 255;
            label.opacity = 0;
            label.runAction(cc.fadeTo(this.fadeDuration, originalOpacity));
        });
    }

    private collectLabels(node: cc.Node): cc.Node[] {
        const result: cc.Node[] = [];
        if (node.getComponent(cc.Label)) {
            result.push(node);
        }
        node.children.forEach(child => {
            result.push(...this.collectLabels(child));
        });
        return result;
    }
}