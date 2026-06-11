/**
 * OutroCtrl.ts
 * 場景：Outro（所有關卡完成後的過渡）
 * 掛載節點：Canvas
 *
 * 使用方式：
 *   將此腳本掛在 Canvas 上，
 *   再於 Inspector 將各 Slide 節點拖入對應欄位。
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

    start() {
        AudioBroadcast.playBgm("story_line_bgm");

        // 計算結局類型
        GameData.calcEnding();
        const endingType: string = GameData.endingType;

        // 依結局種類選中間那張
        let middleSlide: cc.Node = this.slideNormal;
        if (endingType === "bad")    middleSlide = this.slideBad;
        if (endingType === "good")   middleSlide = this.slideGood;
        if (endingType === "normal") middleSlide = this.slideNormal;

        // 組成播放清單
        this.slides = [this.slide1, middleSlide];

        // 檢查是否有空的欄位
        for (let i = 0; i < this.slides.length; i++) {
            if (!this.slides[i]) {
                cc.warn(`OutroCtrl: 第 ${i + 1} 個 Slide 節點未指定，請檢查 Inspector`);
            }
        }

        // 全部先隱藏
        this.slides.forEach(s => { if (s) s.active = false; });

        this.node.on(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);

        this.showSlide(0);
    }

    onDestroy() {
        this.node.off(cc.Node.EventType.TOUCH_END, this.onTouchEnd, this);
    }

    private onTouchEnd() {
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