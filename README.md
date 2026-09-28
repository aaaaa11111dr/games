# OJ Tracker · 算法成长工作台

Vue 3 + TypeScript + Vite 前端，Express 后端。支持桌面和移动浏览器。

## 启动

需要 Node.js 22.12+（推荐 Node 24）和 npm。

```sh
npm ci
npm run dev
```

打开终端显示的 Vite 地址（默认 http://localhost:5173）。开发时 `/api` 代理至 3001 端口。

生产运行：

```sh
npm run build
npm start
```

打开 http://localhost:3001。一个进程提供前端静态资源与 API，默认根路径部署。可用 `PORT` 修改端口；`SERVE_STATIC=0` 可仅启动 API。无需桌面软件或插件。

## 功能

- **复古报纸界面**：泛黄纸张、墨色横排文字、双线报头与细线分栏，桌面及手机自适应。
- **万年历**：1900—2100 年切换，公历与农历对照，今日定位、当日训练题单和日程提醒。农历使用浏览器 Intl 中国历法；不包含法定节假日调休数据。
- **定时工具**：日历选日后添加提醒；1—1440 分钟专注倒计时，支持暂停、继续、重置。倒计时截止时间持久保存，跨页面与刷新后仍然有效。

- **分数趋势**：同步 Codeforces、LeetCode（国际/中国站）、AtCoder 的比赛分数；按真实比赛时间展示折线图，支持时间筛选和多账号。洛谷等平台可手动录入，手动与自动曲线分开。各平台分数不等价。
- **新题推荐**：服务端获取 Codeforces / LeetCode 题库中最新 150 道，按难度、关键词及是否免费筛选，返回名称、链接和难度，可一键加入题单。Codeforces 按比赛编号倒序，LeetCode 按数字题号倒序，属于近似上新顺序，不宣称精确发布时间。尚未公布的难度显示为未评级。
- **训练计划**：创建/重命名/删除题单、记录目标、自建题目、标记完成、保存进度。
- **定时蜂鸣**：为每个题单设置单次本地时间提醒，点击页面顶部启用声音（同时试听）。每次重新打开需启用音频。提醒在所有应用页面生效，刷新保留计划并避免同一时间重复触发；改期后需重新设定。取消提醒后不再触发。

提醒依赖当前打开的浏览器页面；关闭页面、设备休眠、系统静音或浏览器后台节流时，无法保证准点响铃。重新打开 / 恢复页面后会补发到期提醒。此功能不是系统闹钟或后台推送。

题单和分数历史保存在当前浏览器的 localStorage，不跨设备同步；清理浏览器数据会删除这些记录。旧有 OJ 解题数据存储机制保留。

## 接口与错误处理

- `GET /api/training/problems?platform=codeforces`
- `GET /api/training/problems?platform=leetcode&site=cn`（site 默认 com）
- `GET /api/training/ratings?platform=codeforces&username=tourist`
- `GET /api/training/ratings?platform=leetcode&username=USERNAME&site=com`
- `GET /api/training/ratings?platform=atcoder&username=USERNAME`

响应为 `{ data, fetchedAt, stale }`。题库与分数接口缓存 5 分钟、合并同键并发请求、上游超时 20 秒；上游失败且有历史缓存时返回 `stale: true`，否则返回 502。上游网站可能限流、改变接口或禁止访问，界面会如实报告失败而非生成虚假题目/分数。LeetCode 使用网站题库接口，不是有稳定性保证的开放 API。

Codeforces API 文档：https://codeforces.com/apiHelp/

## 验证

```sh
npm run check
npm test
npm run build
```

测试覆盖新题排序/难度、缓存去重/降级，以及提醒到期、取消、去重和重新设定。
