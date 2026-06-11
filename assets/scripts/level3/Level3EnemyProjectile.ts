const { ccclass, property } = cc._decorator;

@ccclass
export default class Level3EnemyProjectile extends cc.Component {
    @property
    speed = 360;

    @property
    damage = 1;

    @property
    lifetime = 4;

    @property
    collisionRadius = 5;

    private velocity = cc.v2();
    private elapsed = 0;
    private launched = false;
    private playerNode: cc.Node = null;

    onLoad() {
        cc.director.getCollisionManager().enabled = true;
        this.ensureCollider();
    }

    public launch(direction: cc.Vec2) {
        const normalized = direction && direction.magSqr() > 0.001
            ? direction.normalize()
            : cc.v2(0, -1);
        this.velocity = normalized.mul(this.speed);
        this.elapsed = 0;
        this.launched = true;
        this.node.active = true;
        this.node.angle = -cc.misc.radiansToDegrees(
            Math.atan2(normalized.x, normalized.y)
        );
    }

    update(dt: number) {
        if (!this.launched) return;

        this.elapsed += dt;
        if (this.elapsed >= this.lifetime) {
            this.node.destroy();
            return;
        }

        this.node.x += this.velocity.x * dt;
        this.node.y += this.velocity.y * dt;

        if (!this.playerNode || !this.playerNode.isValid) {
            this.playerNode = cc.find("Player");
        }
        if (this.playerNode) {
            this.tryHitPlayer();
        }
    }

    private tryHitPlayer() {
        const myWorld = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const playerWorld = this.playerNode.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const dx = myWorld.x - playerWorld.x;
        const dy = myWorld.y - playerWorld.y;

        const playerScale = Math.max(
            Math.abs(this.playerNode.scaleX),
            Math.abs(this.playerNode.scaleY)
        );
        const playerCol = this.playerNode.getComponent(cc.CircleCollider);
        const playerRadius = playerCol ? playerCol.radius * playerScale : 20;
        const hitDist = this.collisionRadius + playerRadius;

        if (dx * dx + dy * dy >= hitDist * hitDist) return;

        const comps = this.playerNode.getComponents(cc.Component);
        for (const comp of comps) {
            const receiver = comp as any;
            if (typeof receiver.takeDamage === "function") {
                receiver.takeDamage(this.damage, this.node);
                break;
            }
        }

        this.launched = false;
        this.node.destroy();
    }

    onCollisionEnter(other: cc.Collider) {
        if (!this.launched || !other || !other.node) return;
        if (other.node.group !== "Player") return;

        const components = other.node.getComponents(cc.Component);
        for (const component of components) {
            const receiver = component as any;
            if (typeof receiver.takeDamage === "function") {
                receiver.takeDamage(this.damage, this.node);
                break;
            }
        }

        this.launched = false;
        this.node.destroy();
    }

    private ensureCollider() {
        let collider = this.getComponent(cc.CircleCollider);
        if (!collider) collider = this.node.addComponent(cc.CircleCollider);
        collider.radius = Math.max(1, this.collisionRadius);
        collider.enabled = true;
    }
}
