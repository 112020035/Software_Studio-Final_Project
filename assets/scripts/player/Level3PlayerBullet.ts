/**
 * Runtime projectile used by the Level 3 player weapon.
 */
const { ccclass, property } = cc._decorator;
import { AudioBroadcast } from "../Audio/AudioEvent";

@ccclass
export default class Level3PlayerBullet extends cc.Component {
    @property
    speed = 720;

    @property
    lifetime = 2.5;

    @property
    damage = 1;

    private velocity = cc.v2(0, 720);
    private elapsed = 0;
    private frames: cc.SpriteFrame[] = [];
    private sprite: cc.Sprite = null;
    private frameIndex = 0;
    private frameElapsed = 0;
    private framesPerSecond = 14;
    private recycleCallback: (bullet: cc.Node) => void = null;
    private isActive = false;

    public configure(
        texture: cc.Texture2D,
        frameWidth: number,
        frameHeight: number,
        frameCount: number,
        framesPerSecond: number,
        recycleCallback: (bullet: cc.Node) => void
    ) {
        this.sprite = this.getComponent(cc.Sprite)
            || this.node.addComponent(cc.Sprite);
        this.framesPerSecond = framesPerSecond;
        this.recycleCallback = recycleCallback;
        this.node.setContentSize(frameWidth, frameHeight);
        this.frames.length = 0;

        const availableFrames = texture
            ? Math.floor(texture.width / frameWidth)
            : 0;
        const count = Math.min(frameCount, availableFrames);

        for (let index = 0; index < count; index++) {
            this.frames.push(new cc.SpriteFrame(
                texture,
                cc.rect(
                    index * frameWidth,
                    0,
                    frameWidth,
                    frameHeight
                )
            ));
        }

        if (this.frames.length > 0) {
            this.sprite.spriteFrame = this.frames[0];
        }
    }

    public launch(
        direction: cc.Vec2,
        speed: number,
        lifetime: number,
        damage: number
    ) {
        this.speed = speed;
        this.lifetime = lifetime;
        this.damage = damage;
        this.velocity = direction.normalize().mul(speed);
        this.elapsed = 0;
        this.frameIndex = 0;
        this.frameElapsed = 0;
        this.isActive = true;

        if (this.sprite && this.frames.length > 0) {
            this.sprite.spriteFrame = this.frames[0];
        }
    }

    public resetForPool() {
        this.isActive = false;
        this.elapsed = 0;
        this.frameIndex = 0;
        this.frameElapsed = 0;
        this.velocity = cc.v2();
        this.node.stopAllActions();
    }

    update(dt: number) {
        if (!this.isActive) return;

        this.elapsed += dt;
        if (this.elapsed >= this.lifetime) {
            this.recycle();
            return;
        }

        this.node.x += this.velocity.x * dt;
        this.node.y += this.velocity.y * dt;
        this.updateAnimation(dt);
    }

    onCollisionEnter(other: cc.Collider) {
        this.hitTarget(other.node);
    }

    onBeginContact(
        contact: cc.PhysicsContact,
        selfCollider: cc.PhysicsCollider,
        otherCollider: cc.PhysicsCollider
    ) {
        this.hitTarget(otherCollider.node);
    }

    private hitTarget(target: cc.Node) {
        if (!this.isActive || !target || target.group === "Player") return;

        const components = target.getComponents(cc.Component);
        for (const component of components) {
            const receiver = component as any;
            if (typeof receiver.takeDamage === "function") {
                receiver.takeDamage(this.damage, this.node);
                break;
            }
        }

        cc.director.emit("level3-player-bullet-hit", target, this.damage);
        this.recycle();
    }

    private recycle() {
        if (!this.isActive) return;
        this.isActive = false;

        if (this.recycleCallback) {
            this.recycleCallback(this.node);
        } else {
            this.node.destroy();
        }
    }

    private updateAnimation(dt: number) {
        if (
            !this.sprite
            || this.frames.length <= 1
            || this.framesPerSecond <= 0
        ) {
            return;
        }

        this.frameElapsed += dt;
        const frameDuration = 1 / this.framesPerSecond;

        while (this.frameElapsed >= frameDuration) {
            this.frameElapsed -= frameDuration;
            this.frameIndex = (this.frameIndex + 1) % this.frames.length;
            this.sprite.spriteFrame = this.frames[this.frameIndex];
        }
    }
}
