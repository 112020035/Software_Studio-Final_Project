// PlayerCollider.ts
// 掛在 Player 節點下的子節點，負責偵測與 Entry / Spaceship 的重疊
// 子節點需掛：PhysicsCircleCollider（sensor = true）+ RigidBody（Kinematic）

const { ccclass, property } = cc._decorator;

@ccclass
export default class PlayerCollider extends cc.Component {

    // 重疊時要顯示的提示節點（由 ExploreCtrl 設定）
    public onEnterSpaceship: () => void = null;
    public onExitSpaceship:  () => void = null;
    public onEnterHome: () => void = null;
    public onExitHome:  () => void = null;
    public onEnterLevel:     (index: number) => void = null;
    public onExitLevel:      (index: number) => void = null;

    onLoad() {
        const col = this.node.getComponent(cc.PhysicsCircleCollider);
        col.apply();

        const rb = this.node.getComponent(cc.RigidBody);

        // 啟用碰撞監聽
        const manager = cc.director.getCollisionManager();
        // 使用物理碰撞回調
        this.node.on(cc.Node.EventType.TOUCH_START, () => {});  // 確保節點啟用
    }

    onBeginContact(contact: cc.PhysicsContact, self: cc.PhysicsCollider, other: cc.PhysicsCollider) {
        const entryIndex = this.getEntryIndex(other.node);
        if (entryIndex >= 0) {
            if (this.onEnterLevel) this.onEnterLevel(entryIndex);
            return;
        }

        if (this.isInteractionTarget(other.node, "Spaceship")) {
            if (this.onEnterSpaceship) this.onEnterSpaceship();
            return;
        }

        if (this.isInteractionTarget(other.node, "Home")) {
            if (this.onEnterHome) this.onEnterHome();
            return;
        }

    }

    onEndContact(contact: cc.PhysicsContact, self: cc.PhysicsCollider, other: cc.PhysicsCollider) {
        const entryIndex = this.getEntryIndex(other.node);
        if (entryIndex >= 0) {
            if (this.onExitLevel) this.onExitLevel(entryIndex);
            return;
        }

        if (this.isInteractionTarget(other.node, "Spaceship")) {
            if (this.onExitSpaceship) this.onExitSpaceship();
            return;
        }

        if (this.isInteractionTarget(other.node, "Home")) {
            if (this.onExitHome) this.onExitHome();
            return;
        }
    }

    // entry 節點名稱為 entry1 / entry2 / entry3，取出數字轉成 0-based index
    private getEntryIndex(node: cc.Node): number {
        const match = node.name.match(/^entry(\d+)$/i);
        if (!match) return -1;
        return parseInt(match[1]) - 1;
    }

    private isInteractionTarget(node: cc.Node, target: string): boolean {
        const normalizedTarget = target.toLowerCase();

        while (node) {
            if (
                node.group.toLowerCase() === normalizedTarget ||
                node.name.toLowerCase() === normalizedTarget
            ) {
                return true;
            }

            node = node.parent;
        }

        return false;
    }
}
