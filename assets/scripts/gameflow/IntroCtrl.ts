/**
 * IntroCtrl.ts
 * 場景：Intro（Slide 2～7，共 6 個過場分鏡）
 * 掛載節點：Canvas
 *
 * 場景節點結構範例：
 * Canvas
 * ├── Slide1  (cc.Sprite，顯示第 2 張分鏡圖)
 * ├── Slide2  (cc.Sprite，顯示第 3 張分鏡圖)
 * ├── Slide3  ...
 * ├── Slide4  ...
 * ├── Slide5  ...
 * └── Slide6  (cc.Sprite，顯示第 7 張分鏡圖)
 *
 * 每個 Slide 節點預設 active = false，由腳本控制顯示。
 * 點擊螢幕換下一張，每張顯示時所有子 Label 會淡入。
 */
import { AudioBroadcast } from "../Audio/AudioEvent";
const { ccclass, property } = cc._decorator;

@ccclass
export default class IntroCtrl extends cc.Component {

    /** Label 淡入持續秒數 */
    @property(cc.Float)
    fadeDuration: number = 1.0;

    private slides: cc.Node[] = [];
    private currentIndex: number = 0;
    private isTweening: boolean = false;

    start() {
        // 換BGM
        AudioBroadcast.playBgm("story_line_bgm");

        // 收集場景中所有 Slide 節點
        for (let i = 1; i <= 6; i++) {
            const node = cc.find("Canvas/Slide" + i);
            if (node) {
                node.active = false;
                this.slides.push(node);
            } else {
                cc.warn(`IntroCtrl: 找不到 Canvas/Slide${i}`);
            }
        }

        if (this.slides.length === 0) {
            cc.warn("IntroCtrl: 沒有任何 Slide 節點，直接跳過");
            cc.director.loadScene("Tutorial");
            return;
        }

        // 監聽點擊事件（掛在 Canvas 上，全螢幕有效）
        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);

        this.showSlide(0);
    }

    onDestroy() {
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    private onTouchEnd() {
        // 淡入動畫進行中不允許連點跳過
        if (this.isTweening) return;

        const next = this.currentIndex + 1;
        if (next < this.slides.length) {
            this.showSlide(next);
        } else {
            cc.director.loadScene("Tutorial");
        }
    }

    private showSlide(index: number) {
        // 隱藏所有 slide，只顯示當前
        this.slides.forEach((s, i) => {
            s.active = (i === index);
        });

        this.currentIndex = index;

        // 對當前 Slide 下的所有 Label 執行淡入
        this.fadeInLabels(this.slides[index]);
    }

    /**
     * 找出節點樹中所有 cc.Label，將透明度從 0 淡入到原始值
     */
    private fadeInLabels(root: cc.Node) {
        const labels = this.collectLabels(root);
        if (labels.length === 0) return;

        this.isTweening = true;

        let completed = 0;

        labels.forEach(label => {
            const originalOpacity = label.opacity > 0 ? label.opacity : 255;
            label.opacity = 0;

            label.runAction(
                cc.sequence(
                    cc.fadeTo(this.fadeDuration, originalOpacity),
                    cc.callFunc(() => {
                        completed++;
                        if (completed >= labels.length) {
                            this.isTweening = false;
                        }
                    })
                )
            );
        });
    }

    /**
     * 遞迴收集節點樹下所有帶有 cc.Label 元件的節點
     */
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