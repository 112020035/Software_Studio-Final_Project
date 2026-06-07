/**
 * MainMenuCtrl.ts
 * 場景：MainMenu（Slide 1）
 * 掛載節點：Canvas, AudioManager
 * 子節點需求：Canvas/StartButton（cc.Button）
 */
import GameData from "../gameflow/GameData";
import { AudioBroadcast } from "../Audio/AudioEvent";

const { ccclass, property } = cc._decorator;

@ccclass
export default class MainMenuCtrl extends cc.Component {

    start() {
        // 每次回到主選單都重置遊戲資料
        GameData.reset();
        // 播放BGM
        AudioBroadcast.playBgm("main_menu_bgm");
        
        const handler = new cc.Component.EventHandler();
        handler.target = this.node;
        handler.component = "MainMenuCtrl";
        handler.handler = "onStartGame";

        const startBtn = cc.find("Canvas/StartButton");
        if (startBtn) {
            const button = startBtn.getComponent(cc.Button);
            
            // btn_press 音效
            const soundHandler = new cc.Component.EventHandler();
            soundHandler.target = this.node;
            soundHandler.component = "MainMenuCtrl";
            soundHandler.handler = "onBtnPress";
            button.clickEvents.push(soundHandler);
            
            // 換場景
            button.clickEvents.push(handler);
        } else {
            cc.warn("MainMenuCtrl: 找不到 Canvas/StartButton");
        }
            }

    onStartGame() {
        cc.director.loadScene("Intro");
    }
    // btn_press的音效
    onBtnPress() {
        AudioBroadcast.playEffect("btn_press");
    }
}
