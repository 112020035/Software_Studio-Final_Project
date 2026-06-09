import { AudioBroadcast } from "../Audio/AudioEvent";

const { ccclass, property } = cc._decorator;

@ccclass
export default class SettingsCtrl extends cc.Component {

    @property(cc.Button)
    backButton: cc.Button = null!;

    @property(cc.Slider)
    bgmSlider: cc.Slider = null!;

    @property(cc.Slider)
    effectSlider: cc.Slider = null!;

    start() {
        if (this.backButton) {
            this.backButton.node.on("click", this.onBackButtonClick, this);
        } else {
            cc.warn("SettingCtrl: 請在 Inspector 掛上 Back Button");
        }

        // 初始化滑動條位置與事件
        if (this.bgmSlider) {
            this.bgmSlider.progress = AudioBroadcast.getBgmVolume();
            this.bgmSlider.node.on("slide", () => {
                AudioBroadcast.setBgmVolume(this.bgmSlider.progress);
                // cc.log("BGM volume =", this.bgmSlider.progress);
            }, this);
        }

        if (this.effectSlider) {
            this.effectSlider.progress = AudioBroadcast.getEffectVolume();
            this.effectSlider.node.on("slide", () => {
                AudioBroadcast.setEffectVolume(this.effectSlider.progress);
                // cc.log("Effect volume =", this.effectSlider.progress);
            }, this);
        }
    }

    onBgmSliderChanged() {
        AudioBroadcast.setBgmVolume(this.bgmSlider.progress);
        // cc.log("SettingsCtrl: BGM volume set to " + this.bgmSlider.progress);
    }

    onEffectSliderChanged() {
        AudioBroadcast.setEffectVolume(this.effectSlider.progress);
        // cc.log("SettingsCtrl: Effect volume set to " + this.effectSlider.progress);
    }

    onBackButtonClick() {
        this.onBtnPress();
        this.onBackToMainMenu();
    }

    onBackToMainMenu() {
        cc.director.loadScene("MainMenu");
    }

    onBtnPress() {
        AudioBroadcast.playEffect("btn_press");
    }
}
