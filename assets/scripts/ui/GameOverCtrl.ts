import GameData from "../gameflow/GameData";

const { ccclass, property } = cc._decorator;

@ccclass
export default class GameOverCtrl extends cc.Component {
    start() {

        this.bindButton("Canvas/RetryButton", "onRetry");
        this.bindButton("Canvas/BackButton", "onBack");
    }

    private bindButton(path: string, handler: string) {
        const node = cc.find(path);
        if (!node) { cc.warn(`GameOverCtrl: 找不到 ${path}`); return; }
        const eh        = new cc.Component.EventHandler();
        eh.target       = this.node;
        eh.component    = "GameOverCtrl";
        eh.handler      = handler;
        node.getComponent(cc.Button).clickEvents.push(eh);
    }

    onRetry() {
        switch (GameData.currentLevel) {
            case 1: 
                cc.director.loadScene("Level1");
                break;
            case 2: 
                cc.director.loadScene("Level2"); 
                break;
            case 3: 
                cc.director.loadScene("Level3"); 
                break;
        }
    }
    onBack() {
        cc.director.loadScene("Explore");
    }
}