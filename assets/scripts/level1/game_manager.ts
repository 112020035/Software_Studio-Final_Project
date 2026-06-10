const {ccclass, property} = cc._decorator;

@ccclass
export default class game_manager extends cc.Component {

    // 當腳本載入時執行
    onLoad () {
        this.init_physics_system();
    }

    // 初始化物理系統
    private init_physics_system() {
        // 取得 Cocos 的物理管理員
        let physics_manager = cc.director.getPhysicsManager();
        
        // 啟用物理引擎
        physics_manager.enabled = true;
        
        // 設定全局重力，參數為 (X, Y)
        // 這裡設定 Y 為 -320，為向下的重力，數值可依後續手感進行調整
        physics_manager.gravity = cc.v2(0, -320);

        // 如果你在開發階段需要看見物理碰撞體的框線，可以把下面這行的註解解開
        // cc.director.getPhysicsManager().debugDrawFlags = cc.PhysicsManager.DrawBits.e_aabbBit | cc.PhysicsManager.DrawBits.e_shapeBit;
    }
}