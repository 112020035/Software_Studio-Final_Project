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


    /** 儲存 GameData 關鍵數據到 Firestore */
    /*static async saveGameData(userId: string): Promise<void> {
        const auth = FirebaseManager.ensureInitialized();
        const db = FirebaseManager._db;

        const data = {
            highQualities: GameData.highQualities,
            itemCount: GameData.itemCount,
            bestScores: GameData.bestScores,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            await db.collection("users").doc(userId).set(data, { merge: true });
            console.log("GameData 儲存成功");
        } catch (e) {
            console.error("GameData 儲存失敗:", e);
        }
    }*/

    /** 從 Firestore 讀取並還原 GameData */
    /*static async loadGameData(userId: string): Promise<void> {
        const db = FirebaseManager._db;

        try {
            const doc = await db.collection("users").doc(userId).get();
            if (doc.exists) {
                const data = doc.data();
                if (data.highQualities) GameData.highQualities = data.highQualities;
                if (data.bestScores)    GameData.bestScores    = data.bestScores;
                if (data.itemCount !== undefined) GameData.itemCount = data.itemCount;
                console.log("GameData 讀取成功", data);
            } else {
                console.log("尚無儲存資料，使用預設值");
            }
        } catch (e) {
            console.error("GameData 讀取失敗:", e);
        }
    }*/
}
