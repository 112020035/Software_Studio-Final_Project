/**
 * Level2Ctrl.ts
 * 場景：Level2（第二關）
 * 掛載節點：Canvas
 *
 * 職責：
 *  1. 設定 mini-game 勝利回調（存於 cc 全域，跨場景存活）
 *  2. 立即載入 mini-game 的 start_game 場景
 *
 *  勝利後 mini-game 內的「繼續前進」按鈕會呼叫 (cc as any)._miniGameOnWin，
 *  此處的 callback 會將 currentLevel +1 並跳至 LevelResult。
 */
import GameData from './GameData';

const { ccclass } = cc._decorator;

@ccclass
export default class Level2Ctrl extends cc.Component {
    onLoad() {
        // 設定 mini-game 勝利後的回調（存在 cc 全域，跨場景存活）
        (cc as any)._miniGameOnWin = () => {
            GameData.currentLevel += 1;
            cc.director.loadScene('LevelResult');
        };

        // 載入 mini-game 入口場景
        cc.director.loadScene('start_game');
    }

    onDestroy() {
        // 離開本場景時清理回調，避免殘留
        (cc as any)._miniGameOnWin = null;
    }
}
