const {ccclass, property} = cc._decorator;

@ccclass
export default class bg_drawer extends cc.Component {

    @property({ type: cc.Float, tooltip: "終點線的Y軸高度，應與 player_controller 的 win_altitude 設定一致" })
    private finish_altitude: number = 5000;

    start() {
        this.draw_background_grid();
    }

    private draw_background_grid() {
        let graphics = this.node.getComponent(cc.Graphics);
        if (!graphics) return;

        graphics.clear();

        // ── 1. 黑色背景底層 ──
        graphics.fillColor = cc.Color.BLACK;
        graphics.rect(-2000, -2000, 4000, 20000);
        graphics.fill();

        // ── 2. 白色網格線 ──
        graphics.strokeColor = new cc.Color(255, 255, 255, 40); // 半透明白，避免太搶眼
        graphics.lineWidth = 1;

        const grid_size  = 50;
        const world_w    = 2000;
        const world_h    = 15000;

        for (let x = -world_w; x <= world_w; x += grid_size) {
            graphics.moveTo(x, -2000);
            graphics.lineTo(x, world_h);
        }
        for (let y = -2000; y <= world_h; y += grid_size) {
            graphics.moveTo(-world_w, y);
            graphics.lineTo(world_w,  y);
        }
        graphics.stroke();

        // ── 3. 每 500 單位的刻度粗線 ──
        graphics.strokeColor = new cc.Color(255, 255, 255, 80);
        graphics.lineWidth = 2;
        for (let y = 0; y <= world_h; y += 500) {
            graphics.moveTo(-world_w, y);
            graphics.lineTo(world_w,  y);
        }
        graphics.stroke();

        // ── 4. 終點線（金黃色亮線）──
        graphics.strokeColor = new cc.Color(255, 220, 30, 255);
        graphics.lineWidth = 8;
        graphics.moveTo(-world_w, this.finish_altitude);
        graphics.lineTo(world_w,  this.finish_altitude);
        graphics.stroke();

        // ── 5. 終點線上方的棋盤斑馬紋（賽車風格）──
        const stripe_w = 80;
        const stripe_h = 20;
        for (let sx = -world_w; sx < world_w; sx += stripe_w * 2) {
            graphics.fillColor = new cc.Color(255, 220, 30, 200);
            graphics.rect(sx, this.finish_altitude, stripe_w, stripe_h);
            graphics.fill();

            graphics.fillColor = new cc.Color(0, 0, 0, 200);
            graphics.rect(sx + stripe_w, this.finish_altitude, stripe_w, stripe_h);
            graphics.fill();
        }

        // ── 6. 終點線下方的提示標記（多條斜線，指向終點）──
        graphics.strokeColor = new cc.Color(255, 200, 0, 120);
        graphics.lineWidth = 3;
        const warn_start = this.finish_altitude - 300;
        for (let wy = warn_start; wy < this.finish_altitude; wy += 80) {
            let alpha_factor = (wy - warn_start) / 300; // 越近終點越明顯
            graphics.moveTo(-world_w, wy);
            graphics.lineTo(world_w,  wy);
        }
        graphics.stroke();

        cc.log(`背景網格繪製完成！終點線位於 Y=${this.finish_altitude}`);
    }
}
