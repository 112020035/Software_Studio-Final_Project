const {ccclass, property} = cc._decorator;

@ccclass
export default class player_controller extends cc.Component {

    // --- UI 連結元件 ---
    @property({ type: cc.ProgressBar, tooltip: "血條元件" })
    private hp_bar: cc.ProgressBar = null;

    @property({ type: cc.ProgressBar, tooltip: "燃料條元件" })
    private fuel_bar: cc.ProgressBar = null;

    @property({ type: cc.Node, tooltip: "紅色警告節點" })
    private red_warning_node: cc.Node = null;

    // --- 勝利條件 ---
    @property({ type: cc.Float, tooltip: "到達此Y軸高度時觸發勝利 (需與bg_drawer的finish_altitude一致)" })
    private win_altitude: number = 5000;

    // --- 玩家狀態數值 ---
    @property({ type: cc.Float }) private max_hp: number = 100;
    private current_hp: number = 100;

    @property({ type: cc.Float }) private max_fuel: number = 100;
    private current_fuel: number = 100;

    @property({ type: cc.Float, tooltip: "吃到燃料桶時的回補量" })
    private fuel_pack_value: number = 30;

    @property({ type: cc.Float, tooltip: "撞到障礙物時的扣血量" })
    private obstacle_damage_value: number = 25;

    @property({ type: cc.Float, tooltip: "撞擊後暫停自動回正的時間(秒)" })
    private righting_pause_duration: number = 0.4;
    private righting_pause_timer: number = 0;

    @property({ type: cc.Float }) private fuel_consume_rate: number = 15;
    @property({ type: cc.Float }) private hp_damage_rate: number = 20;

    // --- 物理推力參數 ---
    @property({ type: cc.Float }) private side_thrust: number = 15;
    @property({ type: cc.Float }) private diagonal_upward_thrust: number = 10;
    @property({ type: cc.Float }) private vertical_thrust: number = 20;
    @property({ type: cc.Float }) private boost_thrust: number = 30;

    // --- 回正力道 ---
    @property({ type: cc.Float, tooltip: "自動回正的扭力大小" })
    private auto_righting_torque: number = 800;

    // --- 碰撞反彈力道 ---
    @property({ type: cc.Float, tooltip: "撞擊障礙物時的彈開力道" })
    private bounce_force: number = 10;

    // --- 加速平台 ---
    @property({ type: cc.Float, tooltip: "踩到加速平台時的向上衝量" })
    private boost_platform_impulse: number = 300;

    // --- 無敵時間 ---
    @property({ type: cc.Float, tooltip: "受傷後的無敵閃爍時間(秒)" })
    private invincible_duration: number = 1.5;
    private is_invincible: boolean = false;

    // --- 輸入狀態 ---
    private is_left_pressed: boolean = false;
    private is_right_pressed: boolean = false;
    private is_center_pressed: boolean = false;
    private rigid_body: cc.RigidBody = null;

    // --- 遊戲狀態 ---
    private is_game_over: boolean = false;
    private is_win: boolean = false;
    private is_teleporting: boolean = false;

    // --- 動態 HUD 元件 (程式碼建立) ---
    private score_label: cc.Label = null;
    private hp_value_label: cc.Label = null;
    private fuel_value_label: cc.Label = null;
    private hud_hp_graphics: cc.Graphics = null;
    private hud_fuel_graphics: cc.Graphics = null;
    private win_overlay_node: cc.Node = null;
    private flash_overlay_node: cc.Node = null;

    // 每幀條的寬度（create_hud 與 draw_custom_bars 共用）
    private readonly HUD_BAR_W: number = 150;
    private readonly HUD_BAR_H: number = 14;

    onLoad() {
        this.current_hp = this.max_hp;
        this.current_fuel = this.max_fuel;
        this.draw_player_shape();
        this.rigid_body = this.node.getComponent(cc.RigidBody);
        this.register_input_events();
        // 延遲 0.05 秒確保場景完全載入後再建立 HUD
        this.scheduleOnce(this.create_hud, 0.05);
    }

    onDestroy() { this.unregister_input_events(); }

    private draw_player_shape() {
        let g = this.node.getComponent(cc.Graphics);
        if (!g) return;
        g.fillColor = cc.Color.CYAN;
        g.strokeColor = cc.Color.WHITE;
        g.lineWidth = 2;
        g.moveTo(0, 30);
        g.lineTo(-15, -20);
        g.lineTo(15, -20);
        g.close();
        g.fill();
        g.stroke();
    }

    // =====================================================================
    //  HUD 建立 (程式碼動態生成)
    //
    //  佈局：
    //    左上角  → ▲ X m（分數）
    //    右下角  → ♥ [bar] 100  /  ⚡ [bar] 100（HP + Fuel 橫排）
    //
    //  重要：所有 Label 節點的 anchorX=0、anchorY=0.5，
    //        使 node.x 對應文字左緣，確保對齊正確。
    // =====================================================================
    private create_hud() {
        let canvas = this.node.parent;
        if (!canvas) return;
        let ui_layer = canvas.getChildByName('UI_Layer');
        if (!ui_layer) return;

        // 隱藏舊版進度條
        if (this.hp_bar)   this.hp_bar.node.active   = false;
        if (this.fuel_bar) this.fuel_bar.node.active = false;

        // ──────────────────────────────────────────────
        //  左上角：分數面板
        //  節點原點在面板左緣（local x=0），向右延伸 SP_W
        // ──────────────────────────────────────────────
        const SX = -440, SY = 295;
        const SP_W = 150, SP_H = 32;

        let score_panel = new cc.Node('score_panel');
        score_panel.setPosition(cc.v2(SX, SY));
        let spbg = score_panel.addComponent(cc.Graphics);
        spbg.fillColor = new cc.Color(0, 0, 0, 165);
        spbg.rect(0, -SP_H / 2, SP_W, SP_H);
        spbg.fill();
        spbg.fillColor = new cc.Color(255, 215, 30, 220);
        spbg.rect(0, -SP_H / 2, 4, SP_H);
        spbg.fill();
        spbg.strokeColor = new cc.Color(200, 175, 25, 140);
        spbg.lineWidth = 1;
        spbg.rect(0, -SP_H / 2, SP_W, SP_H);
        spbg.stroke();
        ui_layer.addChild(score_panel);

        // anchorX=0 → node.x = 文字左緣（不受字串長度影響）
        let score_node = new cc.Node('score_label');
        score_node.setPosition(cc.v2(10, 0));
        score_node.anchorX = 0;
        score_node.anchorY = 0.5;
        score_node.color = new cc.Color(255, 225, 45, 255);
        let sl = score_node.addComponent(cc.Label);
        sl.string = '▲ 0 m';
        sl.fontSize = 22;
        sl.horizontalAlign = cc.Label.HorizontalAlign.LEFT;
        score_panel.addChild(score_node);
        this.score_label = sl;

        // ──────────────────────────────────────────────
        //  右下角：HP + Fuel 面板
        //
        //  每行：[icon] [bar 150px] [gap] [value]
        //  面板右緣固定於 canvas 右側 (+445)
        // ──────────────────────────────────────────────
        const ICON_X  = 10;                                  // icon 左緣 X
        const BAR_X   = ICON_X + 22 + 6;                    // = 38，bar 左緣 X
        const VAL_X   = BAR_X + this.HUD_BAR_W + 7;         // = 195，value 左緣 X
        const HF_W    = VAL_X + 36;                          // = 231，面板總寬
        const HF_H    = 72;                                  // 面板總高
        const BX      = 445 - HF_W;                         // ≈214，面板左緣 X（右對齊）
        const BY      = -200;
        const R1Y     = 18;    // HP  行中心 Y
        const R2Y     = -18;   // Fuel 行中心 Y

        let hf_panel = new cc.Node('hf_panel');
        hf_panel.setPosition(cc.v2(BX, BY));

        let hfbg = hf_panel.addComponent(cc.Graphics);
        hfbg.fillColor = new cc.Color(0, 0, 0, 165);
        hfbg.rect(0, -HF_H / 2, HF_W, HF_H);
        hfbg.fill();
        hfbg.fillColor = new cc.Color(60, 120, 220, 200);
        hfbg.rect(0, -HF_H / 2, 4, HF_H);
        hfbg.fill();
        // 中間分隔線
        hfbg.strokeColor = new cc.Color(60, 70, 100, 120);
        hfbg.lineWidth = 1;
        hfbg.moveTo(4, 0);
        hfbg.lineTo(HF_W - 4, 0);
        hfbg.stroke();
        // 外框
        hfbg.strokeColor = new cc.Color(60, 80, 130, 150);
        hfbg.lineWidth = 1;
        hfbg.rect(0, -HF_H / 2, HF_W, HF_H);
        hfbg.stroke();
        ui_layer.addChild(hf_panel);

        // ── HP 行 ──
        let hp_icon = new cc.Node('hp_icon');
        hp_icon.setPosition(cc.v2(ICON_X, R1Y));
        hp_icon.anchorX = 0;
        hp_icon.anchorY = 0.5;
        hp_icon.color = new cc.Color(255, 110, 110, 255);
        let hil = hp_icon.addComponent(cc.Label);
        hil.string = '♥';
        hil.fontSize = 20;
        hf_panel.addChild(hp_icon);

        let hp_bar_node = new cc.Node('hp_bar_gfx');
        hp_bar_node.setPosition(cc.v2(BAR_X, R1Y));   // Graphics rect 從 x=0 開始 → 左緣在 BAR_X
        this.hud_hp_graphics = hp_bar_node.addComponent(cc.Graphics);
        hf_panel.addChild(hp_bar_node);

        let hp_val = new cc.Node('hp_val');
        hp_val.setPosition(cc.v2(VAL_X, R1Y));
        hp_val.anchorX = 0;
        hp_val.anchorY = 0.5;
        hp_val.color = new cc.Color(255, 200, 200, 255);
        let hvl = hp_val.addComponent(cc.Label);
        hvl.string = '100';
        hvl.fontSize = 15;
        hf_panel.addChild(hp_val);
        this.hp_value_label = hvl;

        // ── Fuel 行 ──
        let fuel_icon = new cc.Node('fuel_icon');
        fuel_icon.setPosition(cc.v2(ICON_X, R2Y));
        fuel_icon.anchorX = 0;
        fuel_icon.anchorY = 0.5;
        fuel_icon.color = new cc.Color(80, 170, 255, 255);
        let fil = fuel_icon.addComponent(cc.Label);
        fil.string = '⚡';
        fil.fontSize = 20;
        hf_panel.addChild(fuel_icon);

        let fuel_bar_node = new cc.Node('fuel_bar_gfx');
        fuel_bar_node.setPosition(cc.v2(BAR_X, R2Y));
        this.hud_fuel_graphics = fuel_bar_node.addComponent(cc.Graphics);
        hf_panel.addChild(fuel_bar_node);

        let fuel_val = new cc.Node('fuel_val');
        fuel_val.setPosition(cc.v2(VAL_X, R2Y));
        fuel_val.anchorX = 0;
        fuel_val.anchorY = 0.5;
        fuel_val.color = new cc.Color(170, 210, 255, 255);
        let fvl = fuel_val.addComponent(cc.Label);
        fvl.string = '100';
        fvl.fontSize = 15;
        hf_panel.addChild(fuel_val);
        this.fuel_value_label = fvl;

        // ──────────────────────────────────────────────
        //  傳送門閃光覆蓋層
        // ──────────────────────────────────────────────
        let flash_overlay = new cc.Node('flash_overlay');
        flash_overlay.setPosition(cc.v2(0, 0));
        flash_overlay.opacity = 0;
        let fg = flash_overlay.addComponent(cc.Graphics);
        fg.fillColor = new cc.Color(60, 220, 255, 255);
        fg.rect(-480, -320, 960, 640);
        fg.fill();
        ui_layer.addChild(flash_overlay);
        this.flash_overlay_node = flash_overlay;

        // ──────────────────────────────────────────────
        //  勝利覆蓋層（最後加入確保在最上層）
        // ──────────────────────────────────────────────
        let win_overlay = new cc.Node('win_overlay');
        win_overlay.setPosition(cc.v2(0, 0));
        win_overlay.active = false;

        let win_bg = win_overlay.addComponent(cc.Graphics);
        win_bg.fillColor = new cc.Color(0, 15, 40, 225);
        win_bg.rect(-480, -320, 960, 640);
        win_bg.fill();
        win_bg.strokeColor = new cc.Color(255, 210, 30, 200);
        win_bg.lineWidth = 3;
        win_bg.moveTo(-380, 105);
        win_bg.lineTo(380, 105);
        win_bg.stroke();
        win_bg.moveTo(-380, -105);
        win_bg.lineTo(380, -105);
        win_bg.stroke();

        let win_title = new cc.Node('win_title');
        win_title.setPosition(cc.v2(0, 52));
        win_title.color = new cc.Color(255, 228, 48, 255);
        let wtl = win_title.addComponent(cc.Label);
        wtl.string = '任務完成！';
        wtl.fontSize = 58;
        wtl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        win_overlay.addChild(win_title);

        let win_en = new cc.Node('win_en');
        win_en.setPosition(cc.v2(0, 2));
        win_en.color = new cc.Color(200, 220, 255, 200);
        let wel = win_en.addComponent(cc.Label);
        wel.string = 'MISSION COMPLETE';
        wel.fontSize = 32;
        wel.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        win_overlay.addChild(win_en);

        let win_sub = new cc.Node('win_sub');
        win_sub.setPosition(cc.v2(0, -52));
        win_sub.color = new cc.Color(180, 200, 230, 200);
        let wsl = win_sub.addComponent(cc.Label);
        wsl.string = '恭喜抵達目標高度！';
        wsl.fontSize = 25;
        wsl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        win_overlay.addChild(win_sub);

        // ── 繼續前進按鈕（主遊戲整合：點擊後跳回主遊戲）──
        let continue_btn = new cc.Node('continue_btn');
        continue_btn.setPosition(cc.v2(0, -118));
        continue_btn.setContentSize(cc.size(200, 44));

        // 金色背景
        let cbg = continue_btn.addComponent(cc.Graphics);
        cbg.fillColor = new cc.Color(255, 205, 30, 235);
        cbg.rect(-100, -22, 200, 44);
        cbg.fill();
        cbg.strokeColor = new cc.Color(255, 245, 100, 255);
        cbg.lineWidth = 2;
        cbg.rect(-100, -22, 200, 44);
        cbg.stroke();

        // 按鈕文字
        let cbl_node = new cc.Node('btn_text');
        cbl_node.setPosition(cc.v2(0, 0));
        cbl_node.color = new cc.Color(40, 15, 0, 255);
        let cbl = cbl_node.addComponent(cc.Label);
        cbl.string = '繼續前進 →';
        cbl.fontSize = 24;
        cbl.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        continue_btn.addChild(cbl_node);

        // 點擊事件：呼叫主遊戲回調（單獨執行時只印 log）
        continue_btn.on(cc.Node.EventType.TOUCH_END, () => {
            let on_win = (cc as any)._miniGameOnWin;
            if (typeof on_win === 'function') {
                on_win();
            } else {
                cc.log('[player_controller] 單獨執行模式，無法跳轉至主遊戲');
            }
        }, this);

        win_overlay.addChild(continue_btn);

        ui_layer.addChild(win_overlay);
        this.win_overlay_node = win_overlay;
    }

    // =====================================================================
    //  每幀重繪 HP / Fuel 條（同行佈局，條的寬度與 create_hud 一致）
    // =====================================================================
    private draw_custom_bars() {
        const W = this.HUD_BAR_W;
        const H = this.HUD_BAR_H;

        if (this.hud_hp_graphics) {
            let g = this.hud_hp_graphics;
            g.clear();
            let r = this.current_hp / this.max_hp;

            // 底色（深紅）
            g.fillColor = new cc.Color(50, 10, 10, 200);
            g.rect(0, -H / 2, W, H);
            g.fill();

            // 填充：綠→黃→紅 動態變色
            let cr = r > 0.6 ? 50  : (r > 0.3 ? 255 : 255);
            let cg = r > 0.6 ? 225 : (r > 0.3 ? 195 : 42);
            g.fillColor = new cc.Color(cr, cg, 35, 230);
            if (r > 0) {
                g.rect(0, -H / 2, W * r, H);
                g.fill();
            }

            // 外框
            g.strokeColor = new cc.Color(160, 60, 60, 150);
            g.lineWidth = 1;
            g.rect(0, -H / 2, W, H);
            g.stroke();
        }

        if (this.hud_fuel_graphics) {
            let g = this.hud_fuel_graphics;
            g.clear();
            let r = this.current_fuel / this.max_fuel;

            // 底色（深藍）
            g.fillColor = new cc.Color(10, 10, 50, 200);
            g.rect(0, -H / 2, W, H);
            g.fill();

            // 填充：藍→橙（低燃料警告）
            let cr = r > 0.3 ? 55  : 225;
            let cg = r > 0.3 ? 125 : 70;
            let cb = r > 0.3 ? 255 : 75;
            g.fillColor = new cc.Color(cr, cg, cb, 230);
            if (r > 0) {
                g.rect(0, -H / 2, W * r, H);
                g.fill();
            }

            // 外框
            g.strokeColor = new cc.Color(60, 80, 180, 150);
            g.lineWidth = 1;
            g.rect(0, -H / 2, W, H);
            g.stroke();
        }
    }

    // =====================================================================
    //  輸入事件
    // =====================================================================
    private register_input_events() {
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.on_key_down, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.on_key_up, this);
    }

    private unregister_input_events() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.on_key_down, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.on_key_up, this);
    }

    private on_key_down(event: cc.Event.EventKeyboard) {
        switch (event.keyCode) {
            case cc.macro.KEY.left:  case cc.macro.KEY.a:     this.is_left_pressed   = true; break;
            case cc.macro.KEY.right: case cc.macro.KEY.d:     this.is_right_pressed  = true; break;
            case cc.macro.KEY.up:    case cc.macro.KEY.w:
            case cc.macro.KEY.space:                          this.is_center_pressed = true; break;
        }
    }

    private on_key_up(event: cc.Event.EventKeyboard) {
        switch (event.keyCode) {
            case cc.macro.KEY.left:  case cc.macro.KEY.a:     this.is_left_pressed   = false; break;
            case cc.macro.KEY.right: case cc.macro.KEY.d:     this.is_right_pressed  = false; break;
            case cc.macro.KEY.up:    case cc.macro.KEY.w:
            case cc.macro.KEY.space:                          this.is_center_pressed = false; break;
        }
    }

    // =====================================================================
    //  主迴圈
    // =====================================================================
    update(dt: number) {
        if (this.is_game_over || this.is_win) return;

        if (this.current_hp > 0) {
            this.handle_resource_consumption(dt);
            if (!this.is_teleporting) {
                this.apply_thruster_forces();
            }
            this.apply_auto_righting(dt);
            this.limit_physics_velocity();
            this.check_win_condition();
        }
        this.update_ui_visuals();
    }

    private check_win_condition() {
        if (this.node.y >= this.win_altitude) {
            this.handle_win_logic();
        }
    }

    private limit_physics_velocity() {
        if (!this.rigid_body) return;
        const max_speed = 600;
        let v = this.rigid_body.linearVelocity;
        if (v.mag() > max_speed) {
            this.rigid_body.linearVelocity = v.normalize().mul(max_speed);
        }
    }

    // =====================================================================
    //  不倒翁回正
    // =====================================================================
    private apply_auto_righting(dt: number) {
        if (!this.rigid_body) return;
        if (this.righting_pause_timer > 0) {
            this.righting_pause_timer -= dt;
            return;
        }

        let current_angle = this.node.angle % 360;
        if (current_angle > 180) current_angle -= 360;
        else if (current_angle < -180) current_angle += 360;

        if (current_angle >= 170) current_angle = 169;
        else if (current_angle <= -170) current_angle = -169;

        let target_spin = +current_angle * 5;
        let lerp_factor = Math.min(dt * 10, 1);
        this.rigid_body.angularVelocity += (target_spin - this.rigid_body.angularVelocity) * lerp_factor;
    }

    // =====================================================================
    //  資源消耗
    // =====================================================================
    private handle_resource_consumption(dt: number) {
        let is_consuming = this.is_left_pressed || this.is_right_pressed || this.is_center_pressed;

        if (is_consuming) {
            let rate = this.is_center_pressed ? this.fuel_consume_rate * 2 : this.fuel_consume_rate;

            if (this.current_fuel > 0) {
                this.current_fuel = Math.max(0, this.current_fuel - rate * dt);
                if (this.red_warning_node) this.red_warning_node.opacity = 0;
            } else {
                this.current_hp -= this.hp_damage_rate * dt;
                if (this.red_warning_node) this.red_warning_node.opacity = 100;
                if (this.current_hp <= 0) {
                    this.current_hp = 0;
                    this.handle_death_logic();
                }
            }
        } else {
            if (this.red_warning_node) this.red_warning_node.opacity = 0;
        }
    }

    // =====================================================================
    //  推進力
    // =====================================================================
    private apply_thruster_forces() {
        if (!this.rigid_body) return;
        if (this.current_fuel <= 0 && this.current_hp <= 0) return;

        let fx = 0, fy = 0;

        if (this.is_left_pressed && this.is_right_pressed) {
            fy += this.vertical_thrust;
        } else if (this.is_left_pressed) {
            fx -= this.side_thrust;
            fy += this.diagonal_upward_thrust;
        } else if (this.is_right_pressed) {
            fx += this.side_thrust;
            fy += this.diagonal_upward_thrust;
        }

        if (this.is_center_pressed) fy += this.boost_thrust;

        if (fx !== 0 || fy !== 0) {
            this.rigid_body.applyForceToCenter(cc.v2(fx, fy), true);
        }
    }

    // =====================================================================
    //  碰撞偵測
    // =====================================================================
    onBeginContact(contact: cc.PhysicsContact, self_collider: cc.PhysicsCollider, other_collider: cc.PhysicsCollider) {
        switch (other_collider.tag) {
            case 1: this.handle_obstacle_hit(contact);        break;
            case 2: this.handle_fuel_pickup(other_collider);  break;
            case 3: this.handle_boost_platform();             break;
            case 4: this.handle_portal_entry(other_collider); break;
            case 5: this.handle_drone_collision(other_collider); break;
        }
    }

    // ── 障礙物碰撞 ──
    private handle_obstacle_hit(contact: cc.PhysicsContact) {
        if (this.is_invincible) return;

        this.current_hp -= this.obstacle_damage_value;
        this.trigger_invincibility();

        let contact_point = contact.getWorldManifold().points[0];
        if (contact_point && this.rigid_body) {
            let ship_pos = this.node.convertToWorldSpaceAR(cc.v2(0, 0));
            this.righting_pause_timer = this.righting_pause_duration;

            let hit_from_right = contact_point.x > ship_pos.x;
            this.rigid_body.angularVelocity = hit_from_right ? -300 : 300;

            let bounce_dir = ship_pos.sub(contact_point).normalize();
            this.rigid_body.linearVelocity = this.rigid_body.linearVelocity.mul(-1.7);
            this.rigid_body.applyLinearImpulse(
                bounce_dir.mul(this.bounce_force),
                this.rigid_body.getWorldCenter(),
                true
            );

            let dx = contact_point.x - ship_pos.x;
            let dy = contact_point.y - ship_pos.y;
            if (Math.abs(dx) * 2 > Math.abs(dy)) {
                let v = this.rigid_body.linearVelocity;
                this.rigid_body.linearVelocity = cc.v2(v.x * 1.7, Math.abs(v.y) * 2.2 + 18);
            }
        }

        if (this.current_hp <= 0) {
            this.current_hp = 0;
            this.handle_death_logic();
        }
    }

    // ── 燃料拾取 ──
    private handle_fuel_pickup(other_collider: cc.PhysicsCollider) {
        this.current_fuel = Math.min(this.max_fuel, this.current_fuel + this.fuel_pack_value);
        other_collider.node.destroy();
    }

    // ── 加速平台（Tag 3）──
    private handle_boost_platform() {
        if (!this.rigid_body) return;
        // 消除向下速度，施加強力向上衝量
        let v = this.rigid_body.linearVelocity;
        this.rigid_body.linearVelocity = cc.v2(v.x * 0.5, 0);
        this.rigid_body.applyLinearImpulse(
            cc.v2(0, this.boost_platform_impulse),
            this.rigid_body.getWorldCenter(),
            true
        );
        // 踩台加一點燃料
        this.current_fuel = Math.min(this.max_fuel, this.current_fuel + 10);

        // 閃黃色視覺回饋
        cc.tween(this.node)
            .to(0.08, { color: new cc.Color(255, 255, 80, 255) })
            .to(0.12, { color: new cc.Color(255, 255, 255, 255) })
            .start();
    }

    // ── 追蹤敵機（Tag 5）──
    private handle_drone_collision(other_collider: cc.PhysicsCollider) {
        if (this.is_invincible || this.is_game_over || this.is_win) return;

        // 取得敵機腳本（動態取，避免循環 import）
        let drone = other_collider.node.getComponent('enemy_drone') as any;
        if (!drone || drone.is_exploding) return;

        // 扣血（讀取敵機設定的傷害值）
        let dmg = typeof drone.collision_damage === 'number' ? drone.collision_damage : 25;
        this.current_hp = Math.max(0, this.current_hp - dmg);

        // 無敵閃爍 + 暫停自動回正
        this.trigger_invincibility();
        this.righting_pause_timer = this.righting_pause_duration;

        // 通知敵機：推開玩家 + 爆炸
        drone.explode_from_collision(true, this.rigid_body);

        if (this.current_hp <= 0) {
            this.handle_death_logic();
        }
    }

    // ── 傳送門入口（Tag 4）──
    private handle_portal_entry(other_collider: cc.PhysicsCollider) {
        if (this.is_teleporting) return;
        let exit_node = other_collider.node['exit_portal'] as cc.Node;
        if (exit_node && exit_node.isValid) {
            this.start_teleport(other_collider.node, exit_node);
        }
    }

    // ── 傳送序列：淡出 → 攝影機滑向出口門 → 玩家從出口門淡入 ──
    //
    //  流程：
    //   1. 計算出口門世界座標（銷毀前先存）
    //   2. 銷毀入口門（防止 tween 期間再次觸發）；出口門保留！
    //   3. 剛體切換 Kinematic（type=1），防止物理覆蓋 tween 位置
    //   4. 全螢幕閃光（0.15s 升 → 0.5s 降）
    //   5. 淡出玩家（0.2s）
    //   6. tween x/y 平滑滑行到出口門（0.45s，sineInOut）→ 攝影機跟著走，出口門仍可見
    //   7. 玩家在出口門中央淡入（0.28s）→ 視覺效果：「從門裡出來」
    //   8. 拆出口門、恢復 Dynamic、給予上推速度
    private start_teleport(entry_node: cc.Node, exit_node: cc.Node) {
        this.is_teleporting = true;
        let rb = this.rigid_body;

        // ── 計算目標位置（銷毀前）──
        let exit_v2    = cc.v2(exit_node.x, exit_node.y);
        let exit_world = exit_node.parent
            ? exit_node.parent.convertToWorldSpaceAR(exit_v2)
            : exit_v2;
        let target = this.node.parent
            ? this.node.parent.convertToNodeSpaceAR(exit_world)
            : exit_world;

        // ── 只銷毀「入口門」，避免再次觸發；出口門保留到玩家淡入完才拆 ──
        if (entry_node && entry_node.isValid) entry_node.destroy();

        // ── 切成 Kinematic，tween 期間物理不干擾位置 ──
        let saved_type = 2;  // 預設 Dynamic
        if (rb) {
            saved_type = rb.type;
            rb.linearVelocity  = cc.v2(0, 0);
            rb.angularVelocity = 0;
            rb.type = 1;  // Kinematic
        }

        // ── 全螢幕閃光 ──
        if (this.flash_overlay_node) {
            cc.tween(this.flash_overlay_node)
                .to(0.15, { opacity: 175 })
                .to(0.50, { opacity: 0 })
                .start();
        }

        // ── 主動畫序列 ──
        //   淡出 → 鏡頭滑到出口門（出口門此時仍可見！）→ 玩家在門口淡入 → 拆門起飛
        cc.tween(this.node)
            .to(0.20, { opacity: 0 })
            // 攝影機平滑滑行到出口門所在位置（sineInOut 讓起止段更柔和）
            .to(0.45, { x: target.x, y: target.y }, { easing: 'sineInOut' })
            .call(() => { this.node.angle = 0; })
            // 玩家在出口門正中央淡入，視覺上像「從門裡出來」
            .to(0.28, { opacity: 255 })
            .call(() => {
                // 玩家完全顯現後才拆出口門
                if (exit_node && exit_node.isValid) exit_node.destroy();
                if (rb) {
                    rb.type = saved_type;         // 恢復 Dynamic
                    rb.linearVelocity = cc.v2(0, 220);
                }
                this.is_teleporting = false;
            })
            .start();
    }

    // =====================================================================
    //  無敵閃爍
    // =====================================================================
    private trigger_invincibility() {
        this.is_invincible = true;
        let blink_times = Math.floor(this.invincible_duration / 0.15);
        cc.tween(this.node)
            .repeat(blink_times,
                cc.tween()
                    .to(0.075, { opacity: 50 })
                    .to(0.075, { opacity: 255 })
            )
            .call(() => {
                this.is_invincible = false;
                this.node.opacity = 255;
            })
            .start();
    }

    // =====================================================================
    //  死亡 / 勝利
    // =====================================================================
    private handle_death_logic() {
        if (this.is_game_over) return;
        this.is_game_over = true;
        if (this.rigid_body) this.rigid_body.linearVelocity = cc.v2(0, 0);
        cc.log('飛船已損毀，遊戲結束！');
        // TODO: cc.director.loadScene('game_over_scene');
    }

    private handle_win_logic() {
        if (this.is_win) return;
        this.is_win = true;
        if (this.rigid_body) {
            this.rigid_body.linearVelocity  = cc.v2(0, 0);
            this.rigid_body.angularVelocity = 0;
        }
        cc.log('到達目標高度！任務完成！');

        if (this.win_overlay_node) {
            this.win_overlay_node.active  = true;
            this.win_overlay_node.opacity = 0;
            cc.tween(this.win_overlay_node)
                .to(0.8, { opacity: 255 })
                .start();
        }
        // TODO: cc.director.loadScene('win_scene');
    }

    // =====================================================================
    //  UI 更新（每幀）
    // =====================================================================
    private update_ui_visuals() {
        // 備用進度條（已隱藏，但仍同步數值）
        if (this.hp_bar)   this.hp_bar.progress   = this.current_hp   / this.max_hp;
        if (this.fuel_bar) this.fuel_bar.progress = this.current_fuel / this.max_fuel;

        // 數值標籤
        if (this.hp_value_label) {
            this.hp_value_label.string = `${Math.ceil(this.current_hp)}`;
        }
        if (this.fuel_value_label) {
            this.fuel_value_label.string = `${Math.ceil(this.current_fuel)}`;
        }

        // 高度分數
        if (this.score_label) {
            let altitude = Math.max(0, Math.floor(this.node.y / 10));
            this.score_label.string = `▲ ${altitude} m`;
        }

        // 重繪 HP / Fuel 條
        this.draw_custom_bars();
    }
}
