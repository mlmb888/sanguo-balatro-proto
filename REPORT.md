# 三国小丑牌 · 试玩交付报告（v0.2）

## 公开试玩 URL
https://mlmb888.github.io/sanguo-balatro-proto/?v=2

（同一 Pages 链接；`?v=2` 用于绕开缓存。若仍像旧版：请强刷 / 清站点数据。）

备用：https://cdn.jsdelivr.net/gh/mlmb888/sanguo-balatro-proto@master/index.html  
源码：https://github.com/mlmb888/sanguo-balatro-proto

## 本地路径
`/workspace/sanguo-balatro-proto/index.html`

## v0.2 相对 v0.1 改动
### 教程
- 首次开局 3 步遮罩（localStorage `sg_balatro_tut_v2`）：选牌 → 底分×倍率凑目标 → 组将点亮小丑；可下一步/跳过
- 首次进虎牢关再弹一句：必须对子及以上（`sg_balatro_boss_tip_v1`）

### 界面
- 醒目得分进度条；气势/出牌/弃牌旁短说明
- 选牌实时预览牌型 + 底分×倍率=分（含小丑加成与虎牢关 0 分警告）
- 点小丑槽 toast/浮层显示能力

### 数值
- 目标 80 / 180 / 280
- 开局仅关羽（1 槽占用，空槽可见）
- 弃牌 3→2
- 赵云：本关仅首次出牌且≤2 张且高牌/对子（不含组将）时倍率+6

## 验证
- `node test-logic.mjs` 12/12
- Playwright：教程三步、目标 80、单将、预览、虎牢关 tip、目标 280

## 仍存缺口
- 刘/曹/周/吕无小丑效果；观星无任意重排；无换槽 UI；无音效/存档/微信壳
- 关羽「含蜀+8」仍较强，认真用蜀色仍能较快破前两关（刻意保留「懂了就能过」）
