/*
 * PinkMonsterController
 * ---------------------
 * Level 2 的粉紅怪角色控制腳本。
 *
 * 這個元件負責角色的鍵盤輸入、水平移動、跳躍 / 二段跳、重力、碰撞修正、
 * 動作動畫切換，以及死亡與重置流程。角色動畫本身交由 SpriteSheetAnimator
 * 播放，本腳本只決定目前應該播放哪一個動作 spritesheet。
 *
 * 操作方式： (TODO:動畫案件只是暫時的，用來確認動畫沒有問題)
 * - A / 左方向鍵：向左移動。
 * - D / 右方向鍵：向右移動。
 * - W / 上方向鍵 / Space：跳躍，可依 maxJumpCount 進行二段跳。
 * - J：攻擊動畫。
 * - T：投擲動畫。
 * - S / 下方向鍵：推動動畫。
 * - C：攀爬動畫。
 * - H：受傷動畫。
 * - K：死亡動畫。
 * - R：重置角色。
 *
 * 主要系統：
 * - 移動系統：根據輸入更新 moveDirection 並套用 moveSpeed。
 * - 跳躍系統：使用 velocityY、gravity、jumpCount 管理跳躍與二段跳。
 * - 碰撞系統：透過 Cocos collision aabb 判斷地面、天花板與牆面修正。
 * - 動畫系統：依照角色狀態切換 idle / run / jump / attack 等動作。
 */
cc.Class({
    extends: cc.Component,

    properties: {
        animator: {
            default: null,
            type: cc.Component
        },
        idleTexture: {
            default: null,
            type: cc.Texture2D
        },
        runTexture: {
            default: null,
            type: cc.Texture2D
        },
        jumpTexture: {
            default: null,
            type: cc.Texture2D
        },
        attackTexture: {
            default: null,
            type: cc.Texture2D
        },
        throwTexture: {
            default: null,
            type: cc.Texture2D
        },
        pushTexture: {
            default: null,
            type: cc.Texture2D
        },
        climbTexture: {
            default: null,
            type: cc.Texture2D
        },
        hurtTexture: {
            default: null,
            type: cc.Texture2D
        },
        deathTexture: {
            default: null,
            type: cc.Texture2D
        },
        doubleJumpDustTexture: {
            default: null,
            type: cc.Texture2D
        },
        moveSpeed: 160,
        jumpSpeed: 360,
        doubleJumpSpeed: 330,
        gravity: 900,
        maxJumpCount: 2,
        dustYOffset: 0,
        fallLimitY: -320,
        groundContactGrace: 0.2,
        useHorizontalBounds: true,
        minX: 0,
        maxX: 99999,
        collisionSkin: 0.5
    },

    // 初始化動畫器、角色狀態、碰撞系統與鍵盤事件。
    onLoad: function () {
        if (!this.animator) {
            this.animator = this.getComponent('SpriteSheetAnimator');
        }

        if (!this.animator) {
            this.animator = this.node.getComponentInChildren('SpriteSheetAnimator');
        }

        if (!this.animator) {
            cc.warn('PinkMonsterController needs a SpriteSheetAnimator on this node or one of its children.');
        }

        this.currentAction = '';
        this.moveDirection = 0;
        this.velocityY = 0;
        this.groundY = this.node.y;
        this.isGrounded = false;
        this.isActionLocked = false;
        this.isDead = false;
        this.actionTimer = 0;
        this.leftPressed = false;
        this.rightPressed = false;
        this.attackPressed = false;
        this.throwPressed = false;
        this.pushPressed = false;
        this.climbPressed = false;
        this.hurtPressed = false;
        this.jumpPressed = false;
        this.jumpCount = 0;
        this.groundContactTimer = 0;

        var collisionManager = cc.director.getCollisionManager();
        collisionManager.enabled = true;
        collisionManager.enabledDebugDraw = false;

        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

        this.playIdle();
    },

    // 節點銷毀時移除鍵盤事件監聽。
    onDestroy: function () {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    },

    // 播放待機動畫。
    playIdle: function () {
        this.playAction('idle', this.idleTexture, 4, 8, true);
    },

    // 播放跑步動畫。
    playRun: function () {
        this.playAction('run', this.runTexture, 6, 12, true);
    },

    // 播放跳躍動畫。
    playJump: function () {
        this.playAction('jump', this.jumpTexture, 8, 8, true);
    },

    // 播放攻擊動畫。
    playAttack: function () {
        this.playAction('attack', this.attackTexture, 4, 8, true);
    },

    // 播放投擲動畫。
    playThrow: function () {
        this.playAction('throw', this.throwTexture, 4, 7, true);
    },

    // 播放推動動畫。
    playPush: function () {
        this.playAction('push', this.pushTexture, 6, 8, true);
    },

    // 播放攀爬動畫。
    playClimb: function () {
        this.playAction('climb', this.climbTexture, 4, 8, true);
    },

    // 播放受傷動畫。
    playHurt: function () {
        this.playAction('hurt', this.hurtTexture, 4, 7, true);
    },

    // 播放死亡動畫。
    playDeath: function () {
        this.playAction('death', this.deathTexture, 8, 10, false);
    },

    // 切換角色目前動作並交給 SpriteSheetAnimator 播放。
    playAction: function (actionName, texture, frameCount, fps, loop) {
        if (!this.animator || !texture || this.currentAction === actionName) {
            return;
        }

        this.currentAction = actionName;
        this.animator.playSheet(texture, frameCount, fps, loop);
    },

    // 每幀更新角色輸入、移動、重力與動畫狀態。
    update: function (dt) {
        if (this.isDead) {
            return;
        }

        if (this.actionTimer > 0) {
            this.actionTimer -= dt;

            if (this.actionTimer <= 0) {
                this.isActionLocked = false;
            }
        }

        this.updateMoveDirection();
        this.updateGroundContact(dt);

        this.previousX = this.node.x;
        this.previousY = this.node.y;

        if (this.moveDirection !== 0) {
            this.node.x += this.moveDirection * this.moveSpeed * dt;
            this.node.scaleX = Math.abs(this.node.scaleX) * this.moveDirection;
        }

        this.applyHorizontalBounds();

        if (!this.isGrounded || this.velocityY !== 0) {
            this.velocityY -= this.gravity * dt;
            this.node.y += this.velocityY * dt;

            if (this.node.y <= this.fallLimitY) {
                this.node.y = this.fallLimitY;
                this.velocityY = 0;
                this.isGrounded = true;
                this.jumpCount = 0;
                this.groundContactTimer = this.groundContactGrace;
            }
        }

        this.updateMovementAnimation();
    },

    // 剛進入碰撞時修正角色位置。
    onCollisionEnter: function (other, self) {
        this.resolveSolidCollision(other, self);
    },

    // 持續碰撞時維持角色不穿透平台或牆面。
    onCollisionStay: function (other, self) {
        this.resolveSolidCollision(other, self);
    },

    // 根據碰撞前後位置判斷角色撞到地板、天花板或牆面。
    resolveSolidCollision: function (other, self) {
        if (this.isDead || !other.world || !self.world) {
            return;
        }

        var selfAabb = self.world.aabb;
        var otherAabb = other.world.aabb;

        if (!selfAabb.intersects(otherAabb)) {
            return;
        }

        var previousNodeX = typeof this.previousX === 'number' ? this.previousX : this.node.x;
        var previousNodeY = typeof this.previousY === 'number' ? this.previousY : this.node.y;
        var deltaX = this.node.x - previousNodeX;
        var deltaY = this.node.y - previousNodeY;
        var previousBottom = selfAabb.yMin - deltaY;
        var previousTop = selfAabb.yMax - deltaY;
        var previousLeft = selfAabb.xMin - deltaX;
        var previousRight = selfAabb.xMax - deltaX;
        var overlapLeft = selfAabb.xMax - otherAabb.xMin;
        var overlapRight = otherAabb.xMax - selfAabb.xMin;
        var overlapBottom = selfAabb.yMax - otherAabb.yMin;
        var overlapTop = otherAabb.yMax - selfAabb.yMin;
        var skin = this.collisionSkin;
        var groundOverlap = 0.1;
        var tolerance = 3;

        if (this.velocityY <= 0 && previousBottom >= otherAabb.yMax - tolerance) {
            this.node.y += Math.max(0, overlapTop - groundOverlap);
            this.velocityY = 0;
            this.isGrounded = true;
            this.jumpCount = 0;
            this.groundContactTimer = this.groundContactGrace;
            return;
        }

        if (this.velocityY > 0 && previousTop <= otherAabb.yMin + tolerance) {
            this.node.y -= overlapBottom + skin;
            this.velocityY = 0;
            return;
        }

        if (this.moveDirection < 0 && previousLeft >= otherAabb.xMax - tolerance) {
            this.node.x += overlapRight + skin;
        } else if (this.moveDirection > 0 && previousRight <= otherAabb.xMin + tolerance) {
            this.node.x -= overlapLeft + skin;
        }
    },

    // 根據左右按鍵狀態決定水平移動方向。
    updateMoveDirection: function () {
        if (this.leftPressed && !this.rightPressed) {
            this.moveDirection = -1;
        } else if (this.rightPressed && !this.leftPressed) {
            this.moveDirection = 1;
        } else {
            this.moveDirection = 0;
        }
    },

    // 使用短暫容錯時間判斷角色是否仍接觸地面。
    updateGroundContact: function (dt) {
        if (!this.isGrounded) {
            return;
        }

        this.groundContactTimer -= dt;

        if (this.groundContactTimer <= 0) {
            this.isGrounded = false;
        }
    },

    // 將角色 X 座標限制在關卡水平範圍內。
    applyHorizontalBounds: function () {
        if (!this.useHorizontalBounds) {
            return;
        }

        this.node.x = cc.misc.clampf(this.node.x, this.minX, this.maxX);
    },

    // 依照目前輸入與狀態選擇要播放的角色動畫。
    updateMovementAnimation: function () {
        if (this.isActionLocked) {
            return;
        }

        if (this.attackPressed) {
            this.playAttack();
        } else if (this.throwPressed) {
            this.playThrow();
        } else if (this.hurtPressed) {
            this.playHurt();
        } else if (this.climbPressed) {
            this.playClimb();
        } else if (this.pushPressed) {
            this.playPush();
        } else if (!this.isGrounded) {
            this.playJump();
        } else if (this.moveDirection !== 0) {
            this.playRun();
        } else {
            this.playIdle();
        }
    },

    // 執行跳躍或二段跳，並更新垂直速度。
    jump: function () {
        if (this.isActionLocked || this.isDead || this.jumpCount >= this.maxJumpCount) {
            return;
        }

        var isDoubleJump = !this.isGrounded;
        this.isGrounded = false;
        this.groundContactTimer = 0;
        this.jumpCount += 1;
        this.velocityY = isDoubleJump ? this.doubleJumpSpeed : this.jumpSpeed;

        if (isDoubleJump) {
            this.spawnDoubleJumpDust();
        }

        this.playJump();
    },

    // 產生二段跳時腳下的煙霧特效。
    spawnDoubleJumpDust: function () {
        if (!this.doubleJumpDustTexture || !this.node.parent) {
            return;
        }

        var dustNode = new cc.Node('Double_Jump_Dust');
        var sprite = dustNode.addComponent(cc.Sprite);
        var animator = dustNode.addComponent('SpriteSheetAnimator');
        var scaleX = Math.abs(this.node.scaleX || 1);
        var scaleY = Math.abs(this.node.scaleY || 1);
        var footOffset = ((this.node.height || 32) * scaleY * 0.5) + this.dustYOffset;

        this.node.parent.addChild(dustNode);
        dustNode.setPosition(this.node.x, this.node.y - footOffset);
        dustNode.scaleX = scaleX;
        dustNode.scaleY = scaleY;

        animator.sprite = sprite;
        animator.playSheet(this.doubleJumpDustTexture, 5, 14, false);

        dustNode.runAction(cc.sequence(
            cc.delayTime(0.4),
            cc.removeSelf()
        ));
    },

    // 播放一段會暫時鎖住狀態切換的動作。
    playTemporaryAction: function (playAction, duration) {
        if (this.isDead) {
            return;
        }

        this.isActionLocked = true;
        this.actionTimer = duration;
        playAction.call(this);
    },

    // 讓角色進入死亡狀態並停止所有輸入。
    die: function () {
        this.isDead = true;
        this.moveDirection = 0;
        this.leftPressed = false;
        this.rightPressed = false;
        this.attackPressed = false;
        this.throwPressed = false;
        this.pushPressed = false;
        this.climbPressed = false;
        this.hurtPressed = false;
        this.jumpPressed = false;
        this.velocityY = 0;
        this.playDeath();
    },

    // 重置角色狀態並回到初始地面高度。
    resetCharacter: function () {
        this.isDead = false;
        this.isActionLocked = false;
        this.actionTimer = 0;
        this.velocityY = 0;
        this.node.y = this.groundY;
        this.isGrounded = false;
        this.groundContactTimer = 0;
        this.jumpCount = 0;
        this.attackPressed = false;
        this.throwPressed = false;
        this.pushPressed = false;
        this.climbPressed = false;
        this.hurtPressed = false;
        this.jumpPressed = false;
        this.playIdle();
    },

    // 處理鍵盤按下事件並更新角色輸入狀態。
    onKeyDown: function (event) {
        switch (event.keyCode) {
            case cc.macro.KEY.left:
            case cc.macro.KEY.a:
                this.leftPressed = true;
                break;
            case cc.macro.KEY.right:
            case cc.macro.KEY.d:
                this.rightPressed = true;
                break;
            case cc.macro.KEY.space:
            case cc.macro.KEY.w:
            case cc.macro.KEY.up:
                if (!this.jumpPressed) {
                    this.jumpPressed = true;
                    this.jump();
                }
                break;
            case cc.macro.KEY.j:
                this.attackPressed = true;
                break;
            case cc.macro.KEY.t:
                this.throwPressed = true;
                break;
            case cc.macro.KEY.down:
            case cc.macro.KEY.s:
                this.pushPressed = true;
                break;
            case cc.macro.KEY.c:
                this.climbPressed = true;
                break;
            case cc.macro.KEY.h:
                this.hurtPressed = true;
                break;
            case cc.macro.KEY.k:
                this.die();
                break;
            case cc.macro.KEY.r:
                this.resetCharacter();
                break;
        }
    },

    // 處理鍵盤放開事件並取消對應輸入狀態。
    onKeyUp: function (event) {
        switch (event.keyCode) {
            case cc.macro.KEY.left:
            case cc.macro.KEY.a:
                this.leftPressed = false;
                break;
            case cc.macro.KEY.right:
            case cc.macro.KEY.d:
                this.rightPressed = false;
                break;
            case cc.macro.KEY.space:
            case cc.macro.KEY.w:
            case cc.macro.KEY.up:
                this.jumpPressed = false;
                break;
            case cc.macro.KEY.down:
            case cc.macro.KEY.s:
                this.pushPressed = false;
                break;
            case cc.macro.KEY.j:
                this.attackPressed = false;
                break;
            case cc.macro.KEY.t:
                this.throwPressed = false;
                break;
            case cc.macro.KEY.c:
                this.climbPressed = false;
                break;
            case cc.macro.KEY.h:
                this.hurtPressed = false;
                break;
        }
    }
});
