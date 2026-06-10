const {ccclass, property} = cc._decorator;

// 狀態常數  0=等待  1=追蹤  2=死亡
const IDLE     = 0;
const TRACKING = 1;
const DEAD     = 2;

@ccclass
export default class enemy_drone extends cc.Component {

    // ── 由 item_spawner 生成時動態注入，不在 Inspector 顯示 ──
    player_node: cc.Node = null;

    @property({ type: cc.Float, tooltip: "玩家從下方進入（敵機 Y 減此值）範圍時啟動追蹤" })
    activate_delta: number = 400;

    @property({ type: cc.Float, tooltip: "追蹤速度 (px/s)" })
    move_speed: number = 130;

    @property({ type: cc.Float, tooltip: "追蹤超過此秒數後自爆" })
    tracking_duration: number = 9;

    @property({ type: cc.Float, tooltip: "玩家比敵機高出此值（甩脫）後自爆" })
    escape_altitude: number = 650;

    @property({ type: cc.Float, tooltip: "碰到玩家時的傷害值（由 player_controller 讀取）" })
    collision_damage: number = 25;

    @property({ type: cc.Float, tooltip: "碰撞時推開玩家的衝量大小" })
    push_impulse: number = 380;

    // ── 內部狀態 ──
    private _state: number = IDLE;
    private _track_timer: number = 0;
    private _rb: cc.RigidBody = null;

    /** 公開供 player_controller 檢查是否已爆炸，避免重複觸發 */
    is_exploding: boolean = false;

    // =====================================================================
    //  初始化
    // =====================================================================
    onLoad() {
        this._rb = this.getComponent(cc.RigidBody);
        if (this._rb) {
            this._rb.linearVelocity  = cc.v2(0, 0);
            this._rb.angularVelocity = 0;
        }
        this._draw_drone();
    }

    // =====================================================================
    //  外觀：紅色三角形追蹤機
    // =====================================================================
    private _draw_drone() {
        let g = this.node.getComponent(cc.Graphics);
        if (!g) g = this.node.addComponent(cc.Graphics);
        g.clear();

        // 外圈警戒光暈（半透明）
        g.fillColor = new cc.Color(200, 0, 0, 28);
        g.ellipse(0, 0, 44, 44);
        g.fill();

        // 機翼（深紅色）
        g.fillColor = new cc.Color(140, 10, 10, 255);
        g.moveTo(-13, -10); g.lineTo(-30,  -3); g.lineTo(-19, -22); g.close(); g.fill();
        g.moveTo( 13, -10); g.lineTo( 30,  -3); g.lineTo( 19, -22); g.close(); g.fill();

        // 機身（亮紅三角，尖端指 +Y 方向 = angle=0 時向上）
        g.fillColor = new cc.Color(215, 25, 25, 255);
        g.moveTo(0, 24); g.lineTo(-12, -14); g.lineTo(12, -14); g.close(); g.fill();

        // 核心艙（深色）
        g.fillColor = new cc.Color(50, 0, 0, 255);
        g.ellipse(0, 2, 5, 7);
        g.fill();

        // 引擎焰光
        g.fillColor = new cc.Color(255, 65, 0, 190);
        g.ellipse(0, -18, 5, 4);
        g.fill();

        // 機身描邊
        g.strokeColor = new cc.Color(255, 60, 60, 200);
        g.lineWidth = 1.5;
        g.moveTo(0, 24); g.lineTo(-12, -14); g.lineTo(12, -14); g.close(); g.stroke();
    }

    // =====================================================================
    //  每幀狀態機
    // =====================================================================
    update(dt: number) {
        if (this._state === DEAD || !this.player_node || !this.player_node.isValid) return;

        let pw = this._world(this.player_node);   // 玩家世界座標
        let sw = this._world(this.node);           // 敵機世界座標

        // ── IDLE → 偵測玩家是否從下方接近 ──────────────────────────────
        if (this._state === IDLE) {
            if (pw.y >= sw.y - this.activate_delta) {
                this._state = TRACKING;
                this._track_timer = 0;
                // 啟動閃爍警示
                cc.tween(this.node)
                    .repeat(4,
                        cc.tween()
                            .to(0.07, { opacity: 55 })
                            .to(0.07, { opacity: 255 })
                    )
                    .start();
            }
            return;
        }

        // ── TRACKING → 追蹤玩家 ─────────────────────────────────────────
        this._track_timer += dt;

        // 超時 或 玩家甩脫 → 自爆（不傷玩家）
        if (this._track_timer >= this.tracking_duration ||
            pw.y > sw.y + this.escape_altitude) {
            this.explode_from_collision(false, null);
            return;
        }

        let dx = pw.x - sw.x;
        let dy = pw.y - sw.y;
        let dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 5 && this._rb) {
            let nx = dx / dist;
            let ny = dy / dist;
            // 設定速度朝玩家方向
            this._rb.linearVelocity = cc.v2(nx * this.move_speed, ny * this.move_speed);
            // 機頭朝向玩家（angle=0 時尖端朝 +Y，故減 90° 對齊 atan2 的 +X 基準）
            this.node.angle = Math.atan2(dy, dx) * (180 / Math.PI) - 90;
        }
    }

    // =====================================================================
    //  爆炸
    //  hit_player : 是否因碰到玩家而爆炸（true → 推開玩家）
    //  player_rb  : 玩家剛體，用來施加推力（hit_player=true 時必填）
    // =====================================================================
    explode_from_collision(hit_player: boolean, player_rb: cc.RigidBody | null) {
        if (this.is_exploding) return;
        this.is_exploding = true;
        this._state = DEAD;

        // 停止移動
        if (this._rb) this._rb.linearVelocity = cc.v2(0, 0);

        // ── 計算並施加推力（讓玩家飛離）──
        if (hit_player && player_rb && this.player_node && this.player_node.isValid) {
            let pw  = this._world(this.player_node);
            let sw  = this._world(this.node);
            let dx  = pw.x - sw.x;
            let dy  = pw.y - sw.y;
            let d   = Math.sqrt(dx * dx + dy * dy) || 1;
            let dir = cc.v2(dx / d, dy / d);

            player_rb.linearVelocity = cc.v2(0, 0);
            player_rb.applyLinearImpulse(
                dir.mul(this.push_impulse),
                player_rb.getWorldCenter(),
                true
            );
        }

        // ── 切換爆炸外觀，然後放大淡出 ──
        this._draw_explosion();
        this.node.stopAllActions();

        cc.tween(this.node)
            .to(0.10, { scale: 2.0, opacity: 240 })
            .to(0.18, { scale: 3.8, opacity: 120 })
            .to(0.12, { scale: 4.8, opacity:   0 })
            .call(() => {
                if (this.node && this.node.isValid) this.node.destroy();
            })
            .start();
    }

    // =====================================================================
    //  爆炸外觀（橙紅火球）
    // =====================================================================
    private _draw_explosion() {
        let g = this.node.getComponent(cc.Graphics);
        if (!g) return;
        g.clear();

        g.fillColor = new cc.Color(255, 120, 0, 220);
        g.ellipse(0, 0, 24, 24);
        g.fill();

        g.fillColor = new cc.Color(255, 220, 50, 240);
        g.ellipse(0, 0, 14, 14);
        g.fill();

        g.fillColor = new cc.Color(255, 255, 230, 255);
        g.ellipse(0, 0, 6, 6);
        g.fill();
    }

    // =====================================================================
    //  工具：取節點的世界座標（跨 parent 安全比較位置用）
    // =====================================================================
    private _world(node: cc.Node): cc.Vec2 {
        return node.parent
            ? node.parent.convertToWorldSpaceAR(cc.v2(node.x, node.y))
            : cc.v2(node.x, node.y);
    }
}
