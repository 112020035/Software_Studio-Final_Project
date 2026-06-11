/**
 * Spawns Level 3 player bullets when Level3SpaceshipController emits fire.
 */
import Level3PlayerBullet from "./Level3PlayerBullet";

const { ccclass, property } = cc._decorator;

@ccclass
export default class Level3WeaponShooter extends cc.Component {
    @property(cc.Node)
    leftFirePoint: cc.Node = null;

    @property(cc.Node)
    rightFirePoint: cc.Node = null;

    @property(cc.Node)
    bulletLayer: cc.Node = null;

    @property(cc.Texture2D)
    bulletTexture: cc.Texture2D = null;

    @property
    bulletFrameWidth = 32;

    @property
    bulletFrameHeight = 32;

    @property
    bulletFrameCount = 4;

    @property
    bulletFramesPerSecond = 14;

    @property
    bulletSpeed = 720;

    @property
    bulletLifetime = 2.5;

    @property
    bulletDamage = 1;

    @property
    bulletScale = 1;

    @property
    fireCooldown = 0.12;

    @property
    initialPoolSize = 20;

    @property
    logPoolStats = true;

    private lastFireTime = -999;
    private bulletPool = new cc.NodePool();
    private createdBullets = 0;
    private reusedBullets = 0;
    private activeBullets = 0;

    onLoad() {
        cc.director.getCollisionManager().enabled = true;

        if (!this.bulletLayer) {
            this.bulletLayer = this.node.parent || cc.director.getScene();
        }

        this.prewarmPool();

        cc.director.on(
            "level3-player-fire",
            this.onPlayerFire,
            this
        );
    }

    onDestroy() {
        cc.director.off(
            "level3-player-fire",
            this.onPlayerFire,
            this
        );
        this.bulletPool.clear();
    }

    private onPlayerFire(direction: number, source: cc.Node) {
        if (source !== this.node || !this.bulletTexture) return;

        const now = Date.now() / 1000;
        if (now - this.lastFireTime < this.fireCooldown) return;
        this.lastFireTime = now;

        const firePoint = direction < 0
            ? this.leftFirePoint
            : this.rightFirePoint;
        this.spawnBullet(firePoint || this.node);
    }

    private spawnBullet(firePoint: cc.Node) {
        if (!this.bulletLayer) return;

        let bulletNode: cc.Node;
        if (this.bulletPool.size() > 0) {
            bulletNode = this.bulletPool.get();
            this.reusedBullets += 1;
        } else {
            bulletNode = this.createBulletNode();
        }

        this.bulletLayer.addChild(bulletNode);
        bulletNode.active = true;

        const worldPosition = firePoint.convertToWorldSpaceAR(cc.v2());
        bulletNode.setPosition(
            this.bulletLayer.convertToNodeSpaceAR(worldPosition)
        );

        const playerScale = (
            Math.abs(this.node.scaleX) + Math.abs(this.node.scaleY)
        ) * 0.5;
        bulletNode.scale = this.bulletScale * playerScale;

        const bullet = bulletNode.getComponent(Level3PlayerBullet);
        bullet.launch(
            cc.v2(0, 1),
            this.bulletSpeed,
            this.bulletLifetime,
            this.bulletDamage
        );
        this.activeBullets += 1;
    }

    private prewarmPool() {
        const count = Math.max(0, Math.floor(this.initialPoolSize));
        for (let index = 0; index < count; index++) {
            this.bulletPool.put(this.createBulletNode());
        }
        this.logStats("prewarm");
    }

    private createBulletNode(): cc.Node {
        const bulletNode = new cc.Node("PlayerBullet");
        bulletNode.group = "default";

        const collider = bulletNode.addComponent(cc.BoxCollider);
        collider.size = cc.size(
            this.bulletFrameWidth * 0.45,
            this.bulletFrameHeight * 0.65
        );

        const bullet = bulletNode.addComponent(Level3PlayerBullet);
        bullet.configure(
            this.bulletTexture,
            this.bulletFrameWidth,
            this.bulletFrameHeight,
            this.bulletFrameCount,
            this.bulletFramesPerSecond,
            this.recycleBullet.bind(this)
        );

        this.createdBullets += 1;
        return bulletNode;
    }

    private recycleBullet(bulletNode: cc.Node) {
        if (!bulletNode || !bulletNode.isValid) return;

        const bullet = bulletNode.getComponent(Level3PlayerBullet);
        if (bullet) bullet.resetForPool();

        this.activeBullets = Math.max(0, this.activeBullets - 1);
        this.bulletPool.put(bulletNode);

        if (
            this.logPoolStats
            && (this.reusedBullets === 1 || this.reusedBullets % 50 === 0)
        ) {
            this.logStats("recycle");
        }
    }

    private logStats(reason: string) {
        if (!this.logPoolStats) return;
        cc.log(
            `[BulletPool:${reason}] created=${this.createdBullets}, `
            + `reused=${this.reusedBullets}, `
            + `active=${this.activeBullets}, `
            + `available=${this.bulletPool.size()}`
        );
    }
}
