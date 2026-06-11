/**
 * Level 3 player resource HUD.
 *
 * Attach this component to Canvas or Main Camera, assign the Player node and
 * the four Pixel Bar outline/fill pairs.
 */
import { AudioBroadcast } from "../Audio/AudioEvent";
const { ccclass, property } = cc._decorator;

interface Level3ResourceState {
    health: number;
    maxHealth: number;
    stamina: number;
    maxStamina: number;
    ammo: number;
    maxAmmo: number;
    shield: number;
    maxShield: number;
}

@ccclass
export default class Level3PlayerHUD extends cc.Component {
    @property(cc.Node)
    player: cc.Node = null;

    @property(cc.Node)
    cameraNode: cc.Node = null;

    @property(cc.SpriteFrame)
    healthBarOutline: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    healthBarFill: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    staminaBarOutline: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    staminaBarFill: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    ammoBarOutline: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    ammoBarFill: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    shieldBarOutline: cc.SpriteFrame = null;

    @property(cc.SpriteFrame)
    shieldBarFill: cc.SpriteFrame = null;

    @property
    leftMargin = 24;

    @property
    topMargin = 24;

    @property
    barWidth = 150;

    @property
    barHeight = 30;

    @property
    barGap = 12;

    @property
    fillHeightRatio = 0.066;

    @property
    debugVisible = false;

    private hudRoot: cc.Node = null;
    private fills: { [key: string]: cc.Sprite } = {};

    onLoad() {
        if (!this.player) {
            this.player = cc.find("Player");
        }
        if (!this.cameraNode) {
            this.cameraNode = cc.find("Canvas/Main Camera");
        }

        this.raiseCanvasAboveWorld();
        this.createHud();
        this.refresh();
        
    }
    start() {
        // 播放BGM
        AudioBroadcast.playBgm("level3_bgm");
    }

    update() {
        this.refresh();
    }

    lateUpdate() {
        this.syncHudToCamera();
    }

    private createHud() {
        const parent = this.findCanvas();
        this.hudRoot = new cc.Node("Level3 Player HUD");
        this.hudRoot.zIndex = 20000;
        this.hudRoot.setAnchorPoint(0.5, 0.5);
        this.hudRoot.setPosition(0, 0);
        this.hudRoot.group = parent.group;
        parent.addChild(this.hudRoot);
        this.hudRoot.setSiblingIndex(parent.childrenCount - 1);

        const leftX = -cc.winSize.width * 0.5 + this.leftMargin;
        const topY = cc.winSize.height * 0.5 - this.topMargin;
        const step = this.barHeight + this.barGap;

        this.createBar(
            "health",
            this.healthBarOutline,
            this.healthBarFill,
            leftX,
            topY
        );
        this.createBar(
            "stamina",
            this.staminaBarOutline,
            this.staminaBarFill,
            leftX,
            topY - step
        );
        this.createBar(
            "ammo",
            this.ammoBarOutline,
            this.ammoBarFill,
            leftX,
            topY - step * 2
        );
        this.createBar(
            "shield",
            this.shieldBarOutline,
            this.shieldBarFill,
            leftX,
            topY - step * 3
        );
        this.createDebugMarker();
        this.syncHudToCamera();

        cc.log(
            `[Level3PlayerHUD] created bars=`
            + `${Object.keys(this.fills).length}, parent=${parent.name}`
        );
    }

    private createBar(
        key: string,
        outlineFrame: cc.SpriteFrame,
        fillFrame: cc.SpriteFrame,
        x: number,
        y: number
    ) {
        if (!outlineFrame || !fillFrame) {
            cc.warn(`[Level3PlayerHUD] missing ${key} sprites`);
            return;
        }

        const container = new cc.Node(`${key} Bar`);
        container.setAnchorPoint(0, 0.5);
        container.setPosition(x, y);
        this.hudRoot.addChild(container);

        const outlineRect = outlineFrame.getRect();
        const outlineHeight = outlineRect.width > 0
            ? this.barWidth * outlineRect.height / outlineRect.width
            : this.barHeight;

        const fillNode = new cc.Node(`${key} Fill`);
        fillNode.setAnchorPoint(0, 0.5);
        fillNode.setPosition(this.barWidth * 0.2, 0);
        container.addChild(fillNode);

        const fillHeight = Math.max(
            3,
            this.barWidth * this.fillHeightRatio
        );
        const fill = fillNode.addComponent(cc.Sprite);
        fill.spriteFrame = fillFrame;
        fill.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        fillNode.setContentSize(
            this.barWidth * 0.8,
            fillHeight
        );
        fill.type = cc.Sprite.Type.FILLED;
        fill.fillType = cc.Sprite.FillType.HORIZONTAL;
        fill.fillStart = 0;
        fill.fillRange = 1;
        this.fills[key] = fill;

        const outlineNode = new cc.Node(`${key} Outline`);
        outlineNode.setAnchorPoint(0, 0.5);
        container.addChild(outlineNode);

        const outline = outlineNode.addComponent(cc.Sprite);
        outline.spriteFrame = outlineFrame;
        outline.sizeMode = cc.Sprite.SizeMode.CUSTOM;
        outlineNode.setContentSize(this.barWidth, outlineHeight);
    }

    private refresh() {
        if (!this.player || !this.player.isValid) return;

        const components = this.player.getComponents(cc.Component);
        let state: Level3ResourceState = null;

        for (const component of components) {
            const provider = component as any;
            if (typeof provider.getResourceState === "function") {
                state = provider.getResourceState();
                break;
            }
        }
        if (!state) return;

        this.setFill("health", state.health, state.maxHealth);
        this.setFill("stamina", state.stamina, state.maxStamina);
        this.setFill("ammo", state.ammo, state.maxAmmo);
        this.setFill("shield", state.shield, state.maxShield);
    }

    private setFill(key: string, value: number, maximum: number) {
        const fill = this.fills[key];
        if (!fill) return;
        fill.fillRange = maximum > 0
            ? cc.misc.clampf(value / maximum, 0, 1)
            : 0;
    }

    private findCanvas(): cc.Node {
        return cc.find("Canvas") || this.node;
    }

    private raiseCanvasAboveWorld() {
        const canvas = this.findCanvas();
        const scene = cc.director.getScene();
        if (!scene || canvas.parent !== scene) return;

        canvas.zIndex = 20000;
        canvas.setSiblingIndex(scene.childrenCount - 1);
    }

    private syncHudToCamera() {
        if (!this.hudRoot || !this.cameraNode) return;

        const canvas = this.findCanvas();
        const cameraWorld = this.cameraNode.convertToWorldSpaceAR(
            cc.Vec2.ZERO
        );
        this.hudRoot.setPosition(canvas.convertToNodeSpaceAR(cameraWorld));
    }

    private createDebugMarker() {
        if (!this.debugVisible || !this.hudRoot) return;

        const marker = new cc.Node("HUD Debug Marker");
        marker.zIndex = 30000;
        marker.setPosition(0, 0);
        this.hudRoot.addChild(marker);

        const graphics = marker.addComponent(cc.Graphics);
        graphics.fillColor = cc.Color.RED;
        graphics.rect(-15, -15, 30, 30);
        graphics.fill();
    }

}
