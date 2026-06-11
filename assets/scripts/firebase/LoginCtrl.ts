const { ccclass, property } = cc._decorator;
import { AudioBroadcast } from "../Audio/AudioEvent";
import FirebaseManager from './FirebaseManager';
declare const firebase: any;

const firebaseConfig = {
    apiKey: "AIzaSyCsbR3D2aFCvxI8Al0SBkBCQT6-BLa6Bv4",
    authDomain: "final-9aa64.firebaseapp.com",
    projectId: "final-9aa64",
    storageBucket: "final-9aa64.firebasestorage.app",
    messagingSenderId: "130635601485",
    appId: "1:130635601485:web:16ae4090a5bfe1bf0cee04",
    measurementId: "G-6DX19V9XCB"
};

function getFirebaseAuth(): any {
    if (typeof firebase === "undefined") {
        throw new Error("Firebase SDK 尚未載入，請確認 firebase-app.js 與 firebase-auth.js 已設為 plugin 並載入到 Web。");
    }

    const app = firebase.apps.length
        ? firebase.app()
        : firebase.initializeApp(firebaseConfig);

    return firebase.auth(app);
}

@ccclass
export default class LoginController extends cc.Component {

    @property(cc.EditBox)  emailInput: cc.EditBox    = null!;
    @property(cc.EditBox)  passwordInput: cc.EditBox = null!;
    @property(cc.EditBox)  nameInput: cc.EditBox = null!;
    @property(cc.Label)    errorLabel: cc.Label      = null!;
    @property(cc.Node)     loadingNode: cc.Node      = null!;

    onLoad() {
        this.errorLabel.string  = '';
        this.loadingNode.active = false;
    }
    // 登入按鈕事件
    onLoginClick() {
        const email    = this.emailInput.string.trim();
        const password = this.passwordInput.string;
        const name = this.nameInput.string.trim();
        
        AudioBroadcast.playEffect("btn_press");
        if (!email || !password) {
            this.errorLabel.string = '請填寫帳號密碼';
            return;
        }

        this.loadingNode.active = true;
        this.errorLabel.string  = '';

        getFirebaseAuth()
            .signInWithEmailAndPassword(email, password)
            .then((userCredential: any) => {
                console.log('登入成功:', userCredential.user.uid);
                cc.director.loadScene('Intro');
            })
            .catch((error: any) => {
                this.errorLabel.string = this.parseError(error.code);
            })
            .finally(() => {
                this.loadingNode.active = false;
            });
    }
    // 註冊按鈕事件
    onRegisterClick() {
        const email    = this.emailInput.string.trim();
        const password = this.passwordInput.string;
        const name     = this.nameInput.string.trim();

        AudioBroadcast.playEffect("btn_press");

        if (!email || !password) {
            this.errorLabel.string = '請填寫帳號密碼';
            return;
        }
        if (!name) {
            this.errorLabel.string = '請填寫名字';
            return;
        }

        this.loadingNode.active = true;
        this.errorLabel.string  = '';

        getFirebaseAuth()
            .createUserWithEmailAndPassword(email, password)
            .then((userCredential: any) => {
                const user = userCredential.user;
                return user.updateProfile({ displayName: name })
                    .then(() => {
                        return FirebaseManager.db
                            .collection('users')
                            .doc(user.uid)
                            .set({
                                name: name,
                                email: email,
                                createdAt: new Date()
                            });
                    });
            })
            .then(() => {
                console.log('註冊成功，名字已存入 Firestore：', name);
                cc.director.loadScene('Intro');
            })
            .catch((error: any) => {
                console.log('錯誤 code:', error.code);
                console.log('錯誤訊息:', error.message);
                this.errorLabel.string = this.parseError(error.code);
            })
            .finally(() => {
                this.loadingNode.active = false;
            });
    }
    private parseError(code: string): string {
        const map: { [key: string]: string } = {
            'auth/user-not-found':       '帳號不存在',
            'auth/wrong-password':       '密碼錯誤',
            'auth/invalid-email':        'Email 格式不正確',
            'auth/email-already-in-use': 'Email 已被使用',
            'auth/weak-password':        '密碼至少需要 6 個字元',
            'auth/too-many-requests':    '嘗試次數過多，請稍後再試',
            'auth/invalid-credential':   '帳號或密碼錯誤',
            'auth/network-request-failed': '連線失敗，請確認網路或 Firebase 授權網域',
            'auth/operation-not-allowed': '尚未啟用 Email/Password 登入方式',
            'auth/unauthorized-domain':  '目前網域未加入 Firebase 授權網域',
        };
        return map[code] || `登入失敗：${code}`;
    }
}
