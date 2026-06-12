/**
 * EndingCtrl.ts
 * 場景：Ending
 * 掛載節點：Canvas
 *
 * 使用方式：
 *   將此腳本掛在 Canvas 上，
 *   於 Inspector 將 BackToMenuButton 拖入對應欄位。
 *
 * 場景啟動後 Canvas 下所有 Label 淡入，
 * 點擊按鈕返回 MainMenu。
 */
const { ccclass, property } = cc._decorator;

@ccclass
export default class EndingCtrl extends cc.Component {

    @property(cc.Node)
    backToMenuButton: cc.Node = null;

    /** Label 淡入持續秒數 */
    @property
    fadeDuration: number = 2.0;

    start() {
        // Canvas 下所有 Label 淡入
        this.fadeInLabels(this.node);

        if (this.backToMenuButton) {
            this.backToMenuButton.on(cc.Node.EventType.TOUCH_END, this.onBackToMenu, this);
        } else {
            cc.warn("EndingCtrl: backToMenuButton 未指定，請檢查 Inspector");
        }
    }

    onDestroy() {
        if (this.backToMenuButton) {
            this.backToMenuButton.off(cc.Node.EventType.TOUCH_END, this.onBackToMenu, this);
        }
    }

    private onBackToMenu() {
        cc.director.loadScene("MainMenu");
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