# 三国小丑牌 · 试玩交付报告

## 公开试玩 URL
https://mlmb888.github.io/sanguo-balatro-proto/

备用：https://cdn.jsdelivr.net/gh/mlmb888/sanguo-balatro-proto@master/index.html  
源码：https://github.com/mlmb888/sanguo-balatro-proto

## 本地路径
`/workspace/sanguo-balatro-proto/`（入口 `index.html`）

本地：`python3 -m http.server 8765` 后打开对应端口。

## 已实现
- 竖屏 H5 单文件：摸牌→选牌→出牌/弃牌→底分×倍率→过关/扣气势
- 花色魏蜀吴群 + 点数角标 + 汉字字位；约 52 牌库
- 牌型表 v0.1（含组将）；取最高
- 武将小丑：关羽、张飞、赵云、诸葛亮（观星）
- 章一三关：50 / 100 / Boss 虎牢关 150（对子及以上才计分）
- 关间商店、组将解锁、水墨 CSS UI、结算飘字
- `node test-logic.mjs` 评牌单测 9 项通过

## 未实现 / 缺口
- 刘备/曹操/周瑜/吕布无小丑效果（仅字位/组将识别）
- 观星无任意顺序拖拽重排（仅保持/洗乱）
- 槽满无手动替换 UI；无音效/存档/微信 SDK
- 数值偏松（赵云+短牌极易破关，利于演示通关）
- Netlify 账号侧 SSO 挡了公开访问，故用 GitHub Pages

## 验证
- `curl` 公开 URL → 200，标题「三国小丑牌 · 试玩」
- Playwright 390×844：点选→出牌→小关1破关→进入商店/小关2
- `node test-logic.mjs`：9/9 通过

## 建议下一刀（最多 3）
1. **数值收紧**：赵云改为「仅高牌/对子且不含组将时 +6」或限一次/关，并把目标分调到 80/180/280。
2. **补 2 名武将效果 + 槽位替换 UI**（刘备护气势、曹操偷分），拉长构筑决策。
3. **微信小游戏壳**：包一层 `wx` 适配（分享「我打到虎牢关」截图、本地存档），并加简易教程遮罩。
