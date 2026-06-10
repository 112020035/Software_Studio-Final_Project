const {ccclass, property} = cc._decorator;

@ccclass
export default class camera_controller extends cc.Component {

    @property({ type: cc.Node, tooltip: "玩家節點" })
    private target_player: cc.Node = null;

    private max_camera_y: number = 0;
    private y_offset: number = -100; // 負值代表飛船在畫面中心偏下方

    onLoad() {
        if (this.target_player) {
            // 初始高度設為玩家當前位置
            this.max_camera_y = this.target_player.y - this.y_offset;
            this.node.y = this.max_camera_y;
        }
    }

    // 使用 lateUpdate 確保在物理運算之後才移動鏡頭，避免抖動
    lateUpdate(dt: number) {
        if (!this.target_player) return;

        // 計算玩家當前希望鏡頭達到的位置
        let desired_y = this.target_player.y - this.y_offset;

        // 核心邏輯：只進不退 (當前期望位置 > 歷史最高位置)
        if (desired_y > this.max_camera_y) {
            this.max_camera_y = desired_y;
        }

        // 更新鏡頭位置
        this.node.y = this.max_camera_y;
        // 強制 X 座標歸零，防止左右飄移
        this.node.x = 0;
    }
}