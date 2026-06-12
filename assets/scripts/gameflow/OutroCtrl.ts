/**
 * OutroCtrl.ts
 * 場景：Outro（所有關卡完成後的過渡）
 * 掛載節點：Canvas
 *
 * 使用方式：
 *   將此腳本掛在 Canvas 上，
 *   再於 Inspector 將各 Slide 節點拖入對應欄位。
 *   編輯器中各 Slide 節點的 active 狀態不影響執行結果。
 *
 * 播放順序：Slide1 → Slide{Bad|Normal|Good} → SlideGameEnd
 * 每張顯示時所有子 Label 會淡入，點擊螢幕換下一張。
 */
import GameData from "./GameData";
import { AudioBroadcast } from "../Audio/AudioEvent";

const { ccclass, property } = cc._decorator;

@ccclass
export default class OutroCtrl extends cc.Component {

    @property(cc.Node)
    slide1: cc.Node = null;

    @property(cc.Node)
    slideBad: cc.Node = null;

    @property(cc.Node)
    slideNormal: cc.Node = null;

    @property(cc.Node)
    slideGood: cc.Node = null;

    /** Label 淡入持續秒數 */
    @property
    fadeDuration: number = 2.0;

    private slides: cc.Node[] = [];
    private currentIndex: number = 0;
    private isReady: boolean = false;

    onLoad() {
        // 在第一幀渲染前就把所有 Slide 隱藏，避免閃爍
        const allSlides = [
            this.slide1,
            this.slideBad,
            this.slideNormal,
            this.slideGood
        ];
        allSlides.forEach(s => { if (s) s.active = false; });
    }

    async start() {
        await GameData.loadFromFirestore();

        // 計算結局類型
        GameData.calcEnding();
        const endingType: string = GameData.endingType;
        cc.log(
            `[OutroCtrl] ending=${endingType}, ` +
            `highQualities=${JSON.stringify(GameData.highQualities)}`
        );

        // 依結局種類選中間那張
        let middleSlide: cc.Node = this.slideNormal;
        if (endingType === "bad")  {
            AudioBroadcast.playBgm("bad_bgm");
            middleSlide = this.slideBad;
        } else if (endingType === "good") {
            AudioBroadcast.playBgm("goodending_bgm");
            middleSlide = this.slideGood;
        } else {
            AudioBroadcast.playBgm("normal_bgm");
        }

        // 組成播放清單
        this.slides = [this.slide1, middleSlide];

        // 檢查是否有空的欄位
        this.slides.forEach((s, i) => {
            if (!s) cc.warn(`OutroCtrl: 第 ${i + 1} 個 Slide 節點未指定，請檢查 Inspector`);
        });

        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);

        this.isReady = true;
        this.showSlide(0);
    }

    onDestroy() {
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    private onTouchEnd() {
        if (!this.isReady) return;

        const next = this.currentIndex + 1;
        if (next < this.slides.length) {
            this.showSlide(next);
        } else {
            cc.director.loadScene("Ending");
        }
    }

    private showSlide(index: number) {
        this.slides.forEach((s, i) => {
            if (s) s.active = (i === index);
        });
        this.currentIndex = index;

        const current = this.slides[index];
        if (current) this.fadeInLabels(current);
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
