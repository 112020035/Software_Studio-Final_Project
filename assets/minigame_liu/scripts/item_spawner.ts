import enemy_drone from './enemy_drone';

const {ccclass, property} = cc._decorator;

@ccclass
export default class item_spawner extends cc.Component {

    @property({ type: cc.Node, tooltip: "主攝影機，用來獲取當前高度" })
    private main_camera: cc.Node = null;

    @property({ type: cc.Node, tooltip: "玩家飛船節點，提供給追蹤敵機使用" })
    private player_node: cc.Node = null;

    @property({ type: cc.Prefab, tooltip: "障礙物的預製體" })
    private obstacle_prefab: cc.Prefab = null;

    @property({ type: cc.Prefab, tooltip: "燃料桶的預製體" })
    private fuel_prefab: cc.Prefab = null;

    @property({ type: cc.Float, tooltip: "每隔多少秒生成一次物件" })
    private spawn_interval: number = 1.5;

    // 生成機率 (總和 = 1.0)
    // obstacles: 55%  fuel: 20%  boost_platform: 15%  portal_pair: 10%

    private spawn_timer: number = 0;

    update(dt: number) {
        if (!this.main_camera) return;

        this.spawn_timer += dt;
        if (this.spawn_timer >= this.spawn_interval) {
            this.spawn_timer = 0;
            this.generate_random_item();
        }

        this.cleanup_distant_items();
    }

    // ── 隨機選擇並生成物件 ──
    // 機率：障礙 47%  燃料 18%  加速台 13%  傳送門 9%  追蹤敵機 13%
    private generate_random_item() {
        let r = Math.random();
        let base_x = (Math.random() - 0.5) * 600;
        let base_y = this.main_camera.y + 500;

        if (r < 0.47) {
            this.spawn_obstacle(base_x, base_y);
        } else if (r < 0.65) {
            this.spawn_fuel(base_x, base_y);
        } else if (r < 0.78) {
            this.spawn_boost_platform(base_x, base_y);
        } else if (r < 0.87) {
            this.spawn_portal_pair(base_x, base_y);
        } else {
            this.spawn_enemy_drone(base_x, base_y);
        }
    }

    // ── 障礙物（prefab）──
    private spawn_obstacle(x: number, y: number) {
        if (!this.obstacle_prefab) return;
        let node = cc.instantiate(this.obstacle_prefab);
        node.setPosition(cc.v2(x, y));
        this.node.addChild(node);
    }

    // ── 燃料桶（prefab）──
    private spawn_fuel(x: number, y: number) {
        if (!this.fuel_prefab) return;
        let node = cc.instantiate(this.fuel_prefab);
        node.setPosition(cc.v2(x, y));
        this.node.addChild(node);
    }

    // ── 加速平台（程式碼生成，Tag 3，Sensor）──
    private spawn_boost_platform(x: number, y: number) {
        let node = new cc.Node('boost_platform');
        node.setPosition(cc.v2(x, y));

        // ── 視覺（cc.Graphics）──
        let g = node.addComponent(cc.Graphics);

        // 平台主體（綠色）
        g.fillColor = new cc.Color(30, 200, 80, 255);
        g.rect(-100, -12, 200, 24);
        g.fill();

        // 亮色高光條
        g.fillColor = new cc.Color(100, 255, 130, 180);
        g.rect(-100, 4, 200, 6);
        g.fill();

        // 向上箭頭（白色三角形，提示「踩這裡飛上去」）
        g.fillColor = new cc.Color(255, 255, 80, 220);
        for (let ax = -60; ax <= 60; ax += 40) {
            g.moveTo(ax, 16);
            g.lineTo(ax - 10, 32);
            g.lineTo(ax + 10, 32);
            g.close();
        }
        g.fill();

        // 外框
        g.strokeColor = new cc.Color(50, 255, 100, 200);
        g.lineWidth = 2;
        g.rect(-100, -12, 200, 24);
        g.stroke();

        // ── 物理（靜態剛體 + Sensor 碰撞器）──
        let rb = node.addComponent(cc.RigidBody);
        rb.type = 0; // Static

        let col = node.addComponent(cc.PhysicsBoxCollider);
        col.tag = 3;
        col.sensor = true;
        col.size = cc.size(200, 24);
        col.apply();

        this.node.addChild(node);
    }

    // ── 傳送門對（程式碼生成，入口 Tag 4 + 出口視覺）──
    private spawn_portal_pair(x: number, base_y: number) {
        let entry_y = base_y;
        let exit_y  = base_y + 350;  // 出口在入口正上方 350 單位

        // 先建出口（需要先有節點，才能讓入口持有其參考）
        let exit_node  = this.create_portal_node(x + (Math.random() - 0.5) * 80, exit_y,  false);
        // 建入口並連結到出口
        let entry_node = this.create_portal_node(x, entry_y, true);
        entry_node['exit_portal'] = exit_node;

        this.node.addChild(exit_node);
        this.node.addChild(entry_node);
    }

    /**
     * 建立傳送門節點（門框 + 光圈，入口青藍色，出口橙金色）
     * @param x          世界 X 座標
     * @param y          世界 Y 座標
     * @param is_entry   true = 入口（有碰撞器 Tag4） / false = 出口（純視覺）
     */
    private create_portal_node(x: number, y: number, is_entry: boolean): cc.Node {
        let node = new cc.Node(is_entry ? 'portal_entry' : 'portal_exit');
        node.setPosition(cc.v2(x, y));
        let g = node.addComponent(cc.Graphics);

        const DW = 64, DH = 96;   // 門總寬、總高
        const FT = 8;              // 框架厚度
        const IW = DW - FT * 2;   // 門洞寬 = 48
        const IH = DH - FT * 2;   // 門洞高 = 80

        // ── 色彩定義（入口青藍 / 出口橙金）──
        const c_frame  = is_entry ? new cc.Color(0,  140, 210, 255) : new cc.Color(200, 90,  0,   255);
        const c_aura   = is_entry ? new cc.Color(0,  200, 255, 40)  : new cc.Color(255, 140, 0,   40);
        const c_ring1  = is_entry ? new cc.Color(0,  200, 255, 80)  : new cc.Color(255, 165, 30,  80);
        const c_ring2  = is_entry ? new cc.Color(40, 220, 255, 140) : new cc.Color(255, 200, 80,  140);
        const c_ring3  = is_entry ? new cc.Color(120,240, 255, 200) : new cc.Color(255, 240, 160, 200);
        const c_stroke = is_entry ? new cc.Color(0,  240, 255, 255) : new cc.Color(255, 215, 50,  255);

        // ── 1. 外側光暈橢圓 ──
        g.fillColor = c_aura;
        g.ellipse(0, 0, DW / 2 + 14, DH / 2 + 12);
        g.fill();

        // ── 2. 門框：左柱、右柱、頂橫樑、底框 ──
        g.fillColor = c_frame;
        g.rect(-DW / 2,          -DH / 2, FT,  DH);  // 左柱
        g.fill();
        g.rect(DW / 2 - FT,      -DH / 2, FT,  DH);  // 右柱
        g.fill();
        g.rect(-DW / 2,           DH / 2 - FT, DW, FT);  // 頂橫樑
        g.fill();
        g.rect(-DW / 2,          -DH / 2, DW, FT);        // 底框
        g.fill();

        // ── 3. 門頂拱形（用橢圓疊在頂橫樑上，製造拱門視感）──
        g.fillColor = c_frame;
        g.ellipse(0, DH / 2 - FT * 0.5, DW / 2, FT * 1.4);
        g.fill();

        // ── 4. 門洞（深色背景）──
        g.fillColor = new cc.Color(0, 8, 25, 252);
        g.rect(-IW / 2, -DH / 2 + FT, IW, IH);
        g.fill();

        // ── 5. 傳送門光圈（三層同心橢圓 + 核心亮點）──
        g.fillColor = c_ring1;
        g.ellipse(0, 0, 20, 28);
        g.fill();
        g.fillColor = c_ring2;
        g.ellipse(0, 0, 13, 19);
        g.fill();
        g.fillColor = c_ring3;
        g.ellipse(0, 0, 7, 11);
        g.fill();
        g.fillColor = new cc.Color(235, 255, 255, 230);
        g.ellipse(0, 0, 3, 4);
        g.fill();

        // ── 6. 方向箭頭（白色，入口向上 / 出口向下）──
        g.fillColor = new cc.Color(255, 255, 255, 200);
        if (is_entry) {
            g.moveTo(0,  36); g.lineTo(-9, 24); g.lineTo(9, 24); g.close(); g.fill();
            g.moveTo(0,  22); g.lineTo(-7, 13); g.lineTo(7, 13); g.close(); g.fill();
        } else {
            g.moveTo(0, -36); g.lineTo(-9, -24); g.lineTo(9, -24); g.close(); g.fill();
            g.moveTo(0, -22); g.lineTo(-7, -13); g.lineTo(7, -13); g.close(); g.fill();
        }

        // ── 7. 外框描邊 ──
        g.strokeColor = c_stroke;
        g.lineWidth = 2;
        g.rect(-DW / 2, -DH / 2, DW, DH);
        g.stroke();

        // ── 8. 內框裝飾線 ──
        g.strokeColor = new cc.Color(c_stroke.r, c_stroke.g, c_stroke.b, 110);
        g.lineWidth = 1;
        g.rect(-IW / 2 + 2, -DH / 2 + FT + 2, IW - 4, IH - 4);
        g.stroke();

        // ── 9. 物理（僅入口）──
        if (is_entry) {
            let rb = node.addComponent(cc.RigidBody);
            rb.type = 0;
            let phys_col = node.addComponent(cc.PhysicsBoxCollider);
            phys_col.tag = 4;
            phys_col.sensor = true;
            phys_col.size = cc.size(62, 92);
            phys_col.apply();
        }

        return node;
    }

    // ── 追蹤敵機（程式碼生成，Tag 5，Sensor，Kinematic）──
    //
    //  行為：
    //   • 生成後靜止不動（IDLE），等待玩家從下方接近
    //   • 玩家進入 activate_delta 範圍後啟動追蹤（TRACKING）
    //   • 持續追蹤 tracking_duration 秒 或 玩家甩脫後自爆
    //   • 碰到玩家→爆炸+推開玩家+扣血（由 player_controller 處理傷害）
    private spawn_enemy_drone(x: number, y: number) {
        if (!this.player_node) {
            cc.warn('[item_spawner] player_node 未設定，無法生成追蹤敵機');
            return;
        }

        let node = new cc.Node('enemy_drone');
        node.setPosition(cc.v2(x, y));

        // ── Kinematic 剛體（由腳本控制速度，重力不起作用）──
        let rb = node.addComponent(cc.RigidBody);
        rb.type = 1;              // Kinematic
        rb.enabledContactListener = false;  // 碰撞由 player_controller 偵測

        // ── Sensor 碰撞器 Tag 5 ──
        let col = node.addComponent(cc.PhysicsBoxCollider);
        col.tag = 5;
        col.sensor = true;
        col.size = cc.size(44, 44);  // 包住機身主體
        col.apply();

        // ── 掛上追蹤腳本，注入玩家參考 ──
        let drone_script = node.addComponent(enemy_drone);
        drone_script.player_node = this.player_node;

        this.node.addChild(node);
    }

    // ── 清除超出視野下方的舊物件 ──
    private cleanup_distant_items() {
        let cutoff_y = this.main_camera.y - 700;
        // 使用 slice 取得副本，避免在迴圈中修改原始陣列
        let children = this.node.children.slice();
        for (let child of children) {
            if (child.y < cutoff_y) {
                child.destroy();
            }
        }
    }
}
