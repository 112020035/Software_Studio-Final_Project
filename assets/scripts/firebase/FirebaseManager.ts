const { ccclass } = cc._decorator;

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

@ccclass
export default class FirebaseManager extends cc.Component {

    private static _app: any = null;
    private static _auth: any = null;
    private static _db: any = null;
    static get db(): any { return FirebaseManager._db; }

    static get auth(): any {
        return FirebaseManager.ensureInitialized();
    }

    static ensureInitialized(): any {
        if (FirebaseManager._auth) {
            return FirebaseManager._auth;
        }

        if (typeof firebase === "undefined") {
            throw new Error("Firebase SDK 尚未載入，請確認 firebase-app.js 與 firebase-auth.js 是 plugin 且有載入到 Web。");
        }

        FirebaseManager._app = firebase.apps.length
            ? firebase.app()
            : firebase.initializeApp(firebaseConfig);
        FirebaseManager._auth = firebase.auth(FirebaseManager._app);
        FirebaseManager._db = firebase.firestore(FirebaseManager._app);
        console.log("Firebase db:", FirebaseManager._db);
        console.log("Firebase 初始化成功");

        return FirebaseManager._auth;
    }

    onLoad() {
        try {
            FirebaseManager.ensureInitialized();
        } catch(e) {
            console.log("FirebaseManager 初始化失敗:", e);
        }
    }
}
