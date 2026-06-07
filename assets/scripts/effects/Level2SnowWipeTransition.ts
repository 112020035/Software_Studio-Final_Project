/**
 * Level2SnowWipeTransition.ts
 * Scene: Level2
 * Attach to: A scene transition controller.
 * Watches the player position, draws the snow wipe, and loads Level2-part2.
 */
cc.Class({
    extends: cc.Component,

    properties: {
        playerNodeName: 'Pink_Monster',
        playerComponentName: 'PinkMonsterController',
        cameraNodeName: 'Main Camera',
        targetScene: 'Level2-part2',
        triggerX: 2450,
        duration: 1.1,
        toothHeight: 22,
        toothDepth: 16,
        extraWidth: 120,
        extraHeight: 240,
        zIndex: 9000,
        testKey: true,
        debugLog: true
    },

    onLoad: function () {
        this.player = this.findPlayerNode();
        this.cameraNode = this.findNodeByName(this.cameraNodeName);
        this.overlayNode = null;
        this.graphics = null;
        this.progress = 0;
        this.isTransitioning = false;
        this.hasLoadedTarget = false;
        this.hasWarnedMissingPlayer = false;

        this.createOverlay();

        if (this.testKey) {
            cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        }

        if (this.debugLog) {
            cc.log('[Level2SnowWipeTransition] Loaded. player=' +
                (this.player ? this.player.name : 'null') +
                ', parent=' + (this.player && this.player.parent ? this.player.parent.name : 'null') +
                ', camera=' + (this.cameraNode ? this.cameraNode.name : 'null') +
                ', triggerX=' + this.triggerX);
        }
    },

    onDestroy: function () {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
    },

    update: function (dt) {
        if (!this.player) {
            this.player = this.findPlayerNode();

            if (!this.player && !this.hasWarnedMissingPlayer) {
                this.hasWarnedMissingPlayer = true;
                cc.warn('[Level2SnowWipeTransition] Player node not found: ' + this.playerNodeName);
            }
        }

        if (!this.player || !this.graphics || this.hasLoadedTarget) {
            return;
        }

        this.syncOverlayToCamera();

        if (!this.isTransitioning && this.shouldStartTransition()) {
            this.startTransition();
        }

        if (!this.isTransitioning) {
            return;
        }

        this.progress = Math.min(this.progress + dt / Math.max(this.duration, 0.01), 1);
        this.drawWipe(this.easeInOut(this.progress));

        if (this.progress >= 1) {
            this.hasLoadedTarget = true;
            cc.director.emit('level2-part-transition');
            cc.director.loadScene(this.targetScene);
        }
    },

    onKeyDown: function (event) {
        if (!this.testKey || this.isTransitioning || this.hasLoadedTarget) {
            return;
        }

        if (event.keyCode === cc.macro.KEY.t) {
            cc.log('[Level2SnowWipeTransition] Test key T pressed.');
            this.startTransition();
        }
    },

    startTransition: function () {
        this.isTransitioning = true;
        this.progress = 0;
        this.syncOverlayToCamera();
        this.overlayNode.active = true;
        this.overlayNode.zIndex = this.zIndex;
        this.overlayNode.setSiblingIndex(this.overlayNode.parent.childrenCount - 1);
        this.drawWipe(0);

        if (this.debugLog) {
            cc.log('[Level2SnowWipeTransition] Start wipe. playerX=' + this.getPlayerX().toFixed(2) + ', targetScene=' + this.targetScene);
        }
    },

    createOverlay: function () {
        this.overlayNode = new cc.Node('Level2 Snow Wipe Transition');
        this.overlayNode.zIndex = this.zIndex;
        this.overlayNode.active = false;
        this.node.addChild(this.overlayNode);
        this.overlayNode.setSiblingIndex(this.overlayNode.parent.childrenCount - 1);
        this.syncOverlayToCamera();

        this.graphics = this.overlayNode.addComponent(cc.Graphics);
        this.graphics.fillColor = cc.Color.BLACK;
    },

    syncOverlayToCamera: function () {
        if (!this.overlayNode) {
            return;
        }

        if (!this.cameraNode || !this.cameraNode.parent || this.cameraNode.parent === this.node) {
            this.overlayNode.setPosition(this.cameraNode ? this.cameraNode.position : cc.Vec2.ZERO);
            return;
        }

        var cameraWorldPosition = this.cameraNode.parent.convertToWorldSpaceAR(this.cameraNode.position);
        var cameraLocalPosition = this.node.convertToNodeSpaceAR(cameraWorldPosition);
        this.overlayNode.setPosition(cameraLocalPosition);
    },

    shouldStartTransition: function () {
        if (this.getPlayerX() >= this.triggerX) {
            return true;
        }

        return this.isPlayerOnSnowRamp();
    },

    getPlayerX: function () {
        if (!this.player) {
            return 0;
        }

        if (!this.player.parent) {
            return this.player.x;
        }

        return this.player.parent.convertToWorldSpaceAR(this.player.position).x;
    },

    isPlayerOnSnowRamp: function () {
        var controller = this.player.getComponent(this.playerComponentName);
        if (!controller || !controller.currentRamp || !controller.currentRamp.node) {
            return false;
        }

        return this.hasSnowNameInParents(controller.currentRamp.node);
    },

    hasSnowNameInParents: function (node) {
        while (node) {
            if (node.name && node.name.toLowerCase().indexOf('snow') !== -1) {
                return true;
            }

            node = node.parent;
        }

        return false;
    },

    findPlayerNode: function () {
        var nodeWithController = this.findNodeWithComponent(this.playerComponentName);
        if (nodeWithController) {
            return nodeWithController;
        }

        var namedNode = this.findNodeByName(this.playerNodeName);
        if (!namedNode) {
            return null;
        }

        return this.findNodeWithComponentInTree(namedNode, this.playerComponentName) || namedNode;
    },

    findNodeWithComponent: function (componentName) {
        var scene = cc.director.getScene();
        if (!scene) {
            return null;
        }

        return this.findNodeWithComponentInTree(scene, componentName);
    },

    findNodeWithComponentInTree: function (node, componentName) {
        if (node.getComponent(componentName)) {
            return node;
        }

        for (var i = 0; i < node.childrenCount; i += 1) {
            var found = this.findNodeWithComponentInTree(node.children[i], componentName);
            if (found) {
                return found;
            }
        }

        return null;
    },

    drawWipe: function (progress) {
        var camera = this.cameraNode ? this.cameraNode.getComponent(cc.Camera) : null;
        var zoom = camera && camera.zoomRatio > 0 ? camera.zoomRatio : 1;
        var width = cc.winSize.width / zoom + this.extraWidth * 2;
        var height = cc.winSize.height / zoom;
        var top = height / 2 + this.extraHeight;
        var bottom = -height / 2 - this.extraHeight;
        var right = width / 2 + this.extraWidth;
        var left = right - width * progress;
        var toothInnerX = Math.min(left + Math.max(this.toothDepth, 0), right);
        var safeToothHeight = Math.max(this.toothHeight, 1);

        this.graphics.clear();

        if (progress <= 0) {
            return;
        }

        this.graphics.rect(toothInnerX, bottom, right - toothInnerX, top - bottom);
        this.graphics.fill();

        for (var y = bottom; y < top; y += safeToothHeight) {
            this.graphics.moveTo(toothInnerX, y);
            this.graphics.lineTo(toothInnerX, y + safeToothHeight);
            this.graphics.lineTo(left, y + safeToothHeight / 2);
            this.graphics.close();
            this.graphics.fill();
        }
    },

    easeInOut: function (t) {
        return t * t * (3 - 2 * t);
    },

    findNodeByName: function (nodeName) {
        var scene = cc.director.getScene();
        if (!scene) {
            return null;
        }

        return this.findNodeByNameRecursive(scene, nodeName);
    },

    findNodeByNameRecursive: function (node, nodeName) {
        if (node.name === nodeName) {
            return node;
        }

        for (var i = 0; i < node.childrenCount; i += 1) {
            var found = this.findNodeByNameRecursive(node.children[i], nodeName);
            if (found) {
                return found;
            }
        }

        return null;
    }
});
