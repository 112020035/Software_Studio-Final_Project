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
        activateOnce: true,
        decorativeOnly: false
    },

    onLoad: function () {
        if (!this.flagSprite) {
            this.flagSprite = this.getComponent(cc.Sprite);
        }

        this.isActivated = false;
        this.frameIndex = 0;
        this.animationTimer = 0;
        this.cachedPlayer = null;

        var collisionManager = cc.director.getCollisionManager();
        collisionManager.enabled = true;

        var body = this.getComponent(cc.RigidBody);
        if (body) {
            body.type = cc.RigidBodyType.Static;
            body.gravityScale = 0;
            body.enabledContactListener = true;
        }

        if (this.decorativeOnly) {
            var collider = this.getComponent(cc.PhysicsCollider) ||
                this.getComponent(cc.Collider);
            if (body) {
                body.enabled = false;
            }
            if (collider) {
                collider.enabled = false;
            }
        }

        this.playBlueFrame();
    },

    update: function (dt) {
        if (!this.decorativeOnly && !this.isActivated) {
            this.tryActivateOverlappingPlayer();
        }

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

    onBeginContact: function (contact, selfCollider, otherCollider) {
        this.tryActivate(otherCollider);
    },

    tryActivate: function (other) {
        if (this.decorativeOnly) {
            return;
        }

        var player = this.findPlayerController(other && other.node);
        this.activatePlayer(player);
    },

    findPlayerController: function (node) {
        while (node) {
            var player = node.getComponent('PinkMonsterPhysicsController') ||
                node.getComponent('PinkMonsterController');
            if (player) {
                return player;
            }

            node = node.parent;
        }

        return null;
    },

    tryActivateOverlappingPlayer: function () {
        if (!this.cachedPlayer || !cc.isValid(this.cachedPlayer.node)) {
            this.cachedPlayer = this.findPlayerInScene();
        }

        if (this.cachedPlayer && this.isPlayerOverlapping(this.cachedPlayer)) {
            this.activatePlayer(this.cachedPlayer);
        }
    },

    findPlayerInScene: function () {
        var scene = cc.director.getScene();
        return scene ? this.findPlayerControllerInChildren(scene) : null;
    },

    findPlayerControllerInChildren: function (node) {
        var player = this.findPlayerController(node);
        if (player) {
            return player;
        }

        for (var i = 0; i < node.childrenCount; i += 1) {
            player = this.findPlayerControllerInChildren(node.children[i]);
            if (player) {
                return player;
            }
        }

        return null;
    },

    isPlayerOverlapping: function (player) {
        var trigger = this.getComponent(cc.PhysicsBoxCollider) ||
            this.getComponent(cc.BoxCollider);
        var playerNode = player.node;
        var playerCollider = player.collider ||
            playerNode.getComponent(cc.PhysicsBoxCollider) ||
            playerNode.getComponent(cc.PhysicsPolygonCollider) ||
            playerNode.getComponent(cc.PhysicsCircleCollider) ||
            playerNode.getComponent(cc.BoxCollider);

        if (!trigger || !playerCollider) {
            return false;
        }

        var triggerSize = trigger.size || this.node.getContentSize();
        var playerSize = this.getColliderSize(playerCollider, playerNode);
        var triggerOffset = trigger.offset || cc.v2();
        var playerOffset = playerCollider.offset || cc.v2();
        var triggerCenter = this.node.convertToWorldSpaceAR(triggerOffset);
        var playerCenter = playerNode.convertToWorldSpaceAR(playerOffset);
        var triggerScaleX = Math.abs(this.node.scaleX || 1);
        var triggerScaleY = Math.abs(this.node.scaleY || 1);
        var playerScaleX = Math.abs(playerNode.scaleX || 1);
        var playerScaleY = Math.abs(playerNode.scaleY || 1);
        var halfWidth = triggerSize.width * triggerScaleX / 2 +
            playerSize.width * playerScaleX / 2;
        var halfHeight = triggerSize.height * triggerScaleY / 2 +
            playerSize.height * playerScaleY / 2;

        return Math.abs(playerCenter.x - triggerCenter.x) <= halfWidth &&
            Math.abs(playerCenter.y - triggerCenter.y) <= halfHeight;
    },

    getColliderSize: function (collider, node) {
        if (collider.size) {
            return collider.size;
        }

        if (typeof collider.radius === 'number') {
            return cc.size(collider.radius * 2, collider.radius * 2);
        }

        return node.getContentSize();
    },

    activatePlayer: function (player) {
        if (this.decorativeOnly ||
            !player ||
            (this.activateOnce && this.isActivated)) {
            return;
        }

        this.isActivated = true;

        if (this.flagSprite && this.flagOffFrame) {
            this.flagSprite.spriteFrame = this.flagOffFrame;
        }

        if (player.setCheckpoint) {
            var respawnPosition = this.getRespawnPositionForPlayer(player);
            var flagNode = this.flagSprite ? this.flagSprite.node : this.node;
            var respawnInverted = (flagNode.scaleY || 1) < 0;
            player.setCheckpoint(
                respawnPosition.x,
                respawnPosition.y,
                respawnInverted
            );
        }

        cc.director.emit('player-life-restored');
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
