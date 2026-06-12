import { AudioBroadcast } from "../Audio/AudioEvent";
import FirebaseManager from "../firebase/FirebaseManager";

const { ccclass, property } = cc._decorator;

@ccclass
export default class LeaderboardCtrl extends cc.Component {

    // 5 個名次的 Node，每個裡面有 rankLabel、nameLabel、scoreLabel
    @property([cc.Node]) entryNodes: cc.Node[] = [];
    @property(cc.Node)   loadingNode: cc.Node  = null;
    @property(cc.Node)   backButton: cc.Node   = null;

    start() {
        if (!this.loadingNode) {
            this.loadingNode = cc.find("Canvas/Loading");
        }
        this.setTitle("Loading");
        this.layoutEntries();

        if (this.backButton) {
            this.backButton.on(cc.Node.EventType.TOUCH_END, () => {
                AudioBroadcast.playEffect("btn_press");
                cc.director.loadScene("Explore"); // 改成你要回去的場景
            }, this);
        }

        // 先隱藏所有 entry
        this.entryNodes.forEach(n => n.active = false);
        if (this.loadingNode) this.loadingNode.active = true;

        this.loadLeaderboard();
    }

    private async loadLeaderboard() {
        try {
            FirebaseManager.ensureInitialized();
            const snapshot = await FirebaseManager.db
                .collection('users')
                .get();

            // 把所有 user 資料撈出來，算總分
            const list: { name: string, total: number }[] = [];

            snapshot.forEach((doc: any) => {
                const data = doc.data();
                const scores: number[] = data.bestScores ?? [0, 0, 0];
                const total = scores.reduce((a: number, b: number) => a + b, 0);
                list.push({
                    name:  data.name  ?? data.email ?? '???',
                    total: total
                });
            });

            // 由高到低排序，取前5
            list.sort((a, b) => b.total - a.total);
            const top5 = list.slice(0, 5);

            this.setTitle("LeaderBoard");

            // 填入 UI
            top5.forEach((entry, i) => {
                const node = this.entryNodes[i];
                if (!node) return;
                node.active = true;

                const rankLabel  = cc.find("RankLabel",  node)?.getComponent(cc.Label);
                const nameLabel  = cc.find("NameLabel",  node)?.getComponent(cc.Label);
                const scoreLabel = cc.find("ScoreLabel", node)?.getComponent(cc.Label);

                if (rankLabel)  rankLabel.string  = `#${i + 1}`;
                if (nameLabel)  nameLabel.string  = entry.name;
                if (scoreLabel) scoreLabel.string = `${entry.total}`;
            });

        } catch(e) {
            console.log("載入排行榜失敗:", e);
            this.setTitle("Load Failed");
        }
    }

    private setTitle(text: string) {
        if (!this.loadingNode) return;

        this.loadingNode.active = true;
        const label = this.loadingNode.getComponentInChildren(cc.Label);
        if (label) {
            label.string = text;
            label.node.setPosition(0, 220);
            label.node.setContentSize(420, 55);
            label.fontSize = 40;
            label.lineHeight = 48;
            label.overflow = cc.Label.Overflow.SHRINK;
        }
    }

    private layoutEntries() {
        const rowStartY = 115;
        const rowGap = 62;

        this.entryNodes.forEach((node, index) => {
            if (!node) return;

            node.setPosition(0, rowStartY - index * rowGap);
            this.layoutColumn(node, "RankLabel", -190, 100);
            this.layoutColumn(node, "NameLabel", 0, 250);
            this.layoutColumn(node, "ScoreLabel", 190, 120);
        });
    }

    private layoutColumn(parent: cc.Node, name: string, x: number, width: number) {
        const node = cc.find(name, parent);
        if (!node) return;

        node.setPosition(x, 0);
        node.setContentSize(width, 44);

        const label = node.getComponent(cc.Label);
        if (!label) return;

        label.fontSize = 28;
        label.lineHeight = 34;
        label.overflow = cc.Label.Overflow.SHRINK;
        label.horizontalAlign = cc.Label.HorizontalAlign.CENTER;
        label.verticalAlign = cc.Label.VerticalAlign.CENTER;
    }
}
