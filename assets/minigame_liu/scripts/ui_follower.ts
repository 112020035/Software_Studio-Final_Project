const {ccclass, property} = cc._decorator;

@ccclass
export default class ui_follower extends cc.Component {

    @property({ type: cc.Node, tooltip: "綁定主攝影機" })
    private main_camera: cc.Node = null;

    // 使用 lateUpdate 確保在鏡頭移動後才更新 UI 位置
    lateUpdate () {
        if (this.main_camera) {
            // 讓 UI 層的座標永遠等同於攝影機的座標
            this.node.position = this.main_camera.position;
        }
    }
}