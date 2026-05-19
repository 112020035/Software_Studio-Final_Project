/*
 * CheckpointController
 * --------------------
 * Attach this to checkpoint1. It animates between flagBlueAFrame and
 * flagBlueBFrame until the player touches it, then switches to flagOffFrame
 * and updates the player's respawn point.
 */
cc.Class({
    extends: cc.Component,

    properties: {
        flagSprite: {
            default: null,
            type: cc.Sprite
        },
        flagBlueAFrame: {
            default: null,
            type: cc.SpriteFrame
        },
        flagBlueBFrame: {
            default: null,
            type: cc.SpriteFrame
        },
        flagOffFrame: {
            default: null,
            type: cc.SpriteFrame
        },
        animationInterval: 0.22,
        respawnOffsetX: 0,
        respawnOffsetY: 120,
        activateOnce: true
    },

    onLoad: function () {
        if (!this.flagSprite) {
            this.flagSprite = this.getComponent(cc.Sprite);
        }

        this.isActivated = false;
        this.frameIndex = 0;
        this.animationTimer = 0;

        var collisionManager = cc.director.getCollisionManager();
        collisionManager.enabled = true;

        this.playBlueFrame();
    },

    update: function (dt) {
        if (this.isActivated || !this.flagBlueAFrame || !this.flagBlueBFrame) {
            return;
        }

        this.animationTimer += dt;

        if (this.animationTimer < this.animationInterval) {
            return;
        }

        this.animationTimer = 0;
        this.frameIndex = 1 - this.frameIndex;
        this.playBlueFrame();
    },

    onCollisionEnter: function (other) {
        this.tryActivate(other);
    },

    onCollisionStay: function (other) {
        this.tryActivate(other);
    },

    tryActivate: function (other) {
        var player = other && other.node ?
            other.node.getComponent('PinkMonsterController') :
            null;

        if (!player || (this.activateOnce && this.isActivated)) {
            return;
        }

        this.isActivated = true;

        if (this.flagSprite && this.flagOffFrame) {
            this.flagSprite.spriteFrame = this.flagOffFrame;
        }

        if (player.setCheckpoint) {
            var respawnPosition = this.getRespawnPositionForPlayer(player);
            player.setCheckpoint(respawnPosition.x, respawnPosition.y);
        }
    },

    getRespawnPositionForPlayer: function (player) {
        var localOffset = cc.v2(this.respawnOffsetX, this.respawnOffsetY);
        var worldPosition = this.node.convertToWorldSpaceAR ?
            this.node.convertToWorldSpaceAR(localOffset) :
            cc.v2(this.node.x + this.respawnOffsetX, this.node.y + this.respawnOffsetY);

        if (player.node && player.node.parent && player.node.parent.convertToNodeSpaceAR) {
            return player.node.parent.convertToNodeSpaceAR(worldPosition);
        }

        return worldPosition;
    },

    playBlueFrame: function () {
        if (!this.flagSprite) {
            return;
        }

        var frame = this.frameIndex === 0 ?
            this.flagBlueAFrame :
            this.flagBlueBFrame;

        if (frame) {
            this.flagSprite.spriteFrame = frame;
        }
    }
});
