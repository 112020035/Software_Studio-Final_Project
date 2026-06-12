/**
 * GameData.ts
 * 全局靜態資料，跨場景共享
 * 掛載方式：不需掛載節點，直接 import 使用
 */

import FirebaseManager from "../firebase/FirebaseManager";

export default class GameData {
    public static levelTime:   number = 0;
    public static coins:       number = 0;
    public static partQualities: number[] = [-1, -1, -1];
    public static highQualities: number[] = [-1, -1, -1];
    public static itemCount: number = 0;
    public static currentLevel: number = 1;
    public static isSolo: boolean = true;
    public static endingType: "bad" | "normal" | "good" = "bad";

    // 三關最高分，初始為 0
    public static bestScores: number[] = [0, 0, 0];

    public static enterlevel(level: number) {
        GameData.currentLevel = level;
    }

    /** 計算本次分數 */
    public static calcScore(): number {
        return GameData.levelTime * 10 + GameData.coins * 5;
    }

    /** 更新對應關卡的最高分，回傳本次分數 */
    public static updateBestScore(): number {
        const score = GameData.calcScore();
        const index = GameData.currentLevel - 1;
        if (index >= 0 && index < 3) {
            if (score > GameData.bestScores[index]) {
                GameData.bestScores[index] = score;
            }
        }
        return score;
    }

    public static updateHighQuality(): number {
        const index = GameData.currentLevel - 1;
        const qual_now = GameData.partQualities[index];
        const qual_high = GameData.highQualities[index];
        if (index >= 0 && index < 3) {
            if (qual_now > qual_high) {
                GameData.highQualities[index] = qual_now;
            }
        }
    }

    public static updateItemCount(): number {
        GameData.itemCount = GameData.highQualities[0] + GameData.highQualities[1] + GameData.highQualities[2];
    }

    public static reset() {
        GameData.itemCount = 0;
        GameData.currentLevel = 1;
        GameData.isSolo = true;
        GameData.endingType = "bad";
    }

    public static calcEnding() {
        if (GameData.highQualities[0] < 0 || GameData.highQualities[1] < 0 || GameData.highQualities[2] < 0){
            GameData.endingType = "bad";
        }
        else if (GameData.itemCount >= 5) {
            GameData.endingType = "good";
        } else if (GameData.itemCount >= 3) {
            GameData.endingType = "normal";
        } else {
            GameData.endingType = "bad";
        }
    }
}