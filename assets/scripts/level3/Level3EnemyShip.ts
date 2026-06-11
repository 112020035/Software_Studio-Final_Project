import Level3EnemyProjectile from "./Level3EnemyProjectile";
import { AudioBroadcast } from "../Audio/AudioEvent";
const { ccclass, property } = cc._decorator;

@ccclass
export default class Level3EnemyShip extends cc.Component {
    @property
    maxHealth = 4;

    @property
    moveSpeed = 120;

    @property
    attackRange = 520;

    @property
    preferredDistance = 240;

    @property
    fireInterval = 1.5;

    @property
    contactDamage = 1;

    @property
    collisionRadius = 12;

    @property(cc.Prefab)
    projectilePrefab: cc.Prefab = null;

    @property(cc.Node)
    firePoint: cc.Node = null;

    private player: cc.Node = null;
    private health = 1;
    private fireTimer = 0;
    private playerSearchTimer = 0;
    private contactCooldown = 0;
    private lastPlayerPosition: cc.Vec2 = null;

    onLoad() {
        cc.director.getCollisionManager().enabled = true;
        this.health = Math.max(1, this.maxHealth);
        this.ensureCollider();
    }

    start() {
        this.player = this.findPlayer();
        this.fireTimer = Math.random() * Math.max(0.1, this.fireInterval);
    }

    update(dt: number) {
        this.contactCooldown = Math.max(0, this.contactCooldown - dt);

        if (!this.player || !this.player.isValid) {
            this.playerSearchTimer -= dt;
            if (this.playerSearchTimer <= 0) {
                this.playerSearchTimer = 0.5;
                this.player = this.findPlayer();
            }
            this.lastPlayerPosition = null;
            return;
        }

        const playerWorld = this.player.convertToWorldSpaceAR(cc.Vec2.ZERO);

        // 同步玩家 Y 軸位移，確保敵人始終維持在玩家前方
        if (this.lastPlayerPosition) {
            const playerDeltaY = playerWorld.y - this.lastPlayerPosition.y;
            const currentWorld = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
            this.setWorldPosition(cc.v2(currentWorld.x, currentWorld.y + playerDeltaY));
        }
        this.lastPlayerPosition = playerWorld;

        // 移動目標：玩家上方 140 單位，讓玩家容易從下方瞄準
        const targetWorld = cc.v2(playerWorld.x, playerWorld.y + 140);

        const enemyWorld = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        const toTarget = targetWorld.sub(enemyWorld);
        const distance = toTarget.mag();

        if (distance > 0.001) {
            const direction = toTarget.normalize();
            const distanceError = distance - this.preferredDistance;
            const moveDirection = distanceError >= 0 ? 1 : -1;
            const step = Math.min(
                Math.abs(distanceError),
                this.moveSpeed * dt
            );
            const nextWorld = enemyWorld.add(
                direction.mul(step * moveDirection)
            );
            this.setWorldPosition(nextWorld);
            this.node.angle = -cc.misc.radiansToDegrees(
                Math.atan2(direction.x, direction.y)
            );
        }

        this.fireTimer += dt;
        if (
            distance <= this.attackRange
            && this.fireTimer >= Math.max(0.1, this.fireInterval)
        ) {
            this.fireTimer = 0;
            // 子彈仍然瞄準玩家實際位置
            this.fireAt(playerWorld);
        }
    }

    public takeDamage(amount: number) {
        AudioBroadcast.playEffect('vanish');
        this.health -= Math.max(0, amount || 0);
        if (this.health <= 0 && this.node.isValid) {
            this.node.destroy();
        }
    }

    onCollisionEnter(other: cc.Collider) {
        if (
            !other
            || !other.node
            || other.node.group !== "Player"
            || this.contactCooldown > 0
        ) {
            return;
        }

        this.contactCooldown = 0.75;
        this.damageNode(other.node, this.contactDamage);
    }

    private fireAt(playerWorld: cc.Vec2) {
        if (!this.projectilePrefab || !this.node.parent) return;
        AudioBroadcast.playEffect('shotting');
        const projectileNode = cc.instantiate(this.projectilePrefab);
        this.node.parent.addChild(projectileNode);

        const source = this.firePoint && this.firePoint.isValid
            ? this.firePoint
            : this.node;
        const sourceWorld = source.convertToWorldSpaceAR(cc.Vec2.ZERO);
        projectileNode.setPosition(
            this.node.parent.convertToNodeSpaceAR(sourceWorld)
        );

        const projectile = projectileNode.getComponent(
            Level3EnemyProjectile
        );
        if (!projectile) {
            projectileNode.destroy();
            return;
        }

        projectile.launch(playerWorld.sub(sourceWorld));
    }

    private ensureCollider() {
        let collider = this.getComponent(cc.CircleCollider);
        if (!collider) collider = this.node.addComponent(cc.CircleCollider);
        collider.radius = Math.max(1, this.collisionRadius);
        collider.enabled = true;
    }

    private setWorldPosition(worldPosition: cc.Vec2) {
        if (!this.node.parent) {
            this.node.setPosition(worldPosition);
            return;
        }
        this.node.setPosition(
            this.node.parent.convertToNodeSpaceAR(worldPosition)
        );
    }

    private damageNode(target: cc.Node, amount: number) {
        const components = target.getComponents(cc.Component);
        for (const component of components) {
            const receiver = component as any;
            if (typeof receiver.takeDamage === "function") {
                receiver.takeDamage(amount, this.node);
                return;
            }
        }
    }

    private findPlayer(): cc.Node {
        const scene = cc.director.getScene();
        return this.findPlayerInChildren(scene);
    }

    private findPlayerInChildren(node: cc.Node): cc.Node {
        if (!node) return null;
        if (
            node.group === "Player"
            || node.name === "Player"
            || !!node.getComponent("Level3SpaceshipController")
        ) {
            return node;
        }

        for (const child of node.children) {
            const player = this.findPlayerInChildren(child);
            if (player) return player;
        }
        return null;
    }
}
