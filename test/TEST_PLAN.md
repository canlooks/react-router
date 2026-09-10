# @canlooks/react-router 测试计划与交付说明

| 项目 | 内容 |
| --- | --- |
| 被测版本 | `@canlooks/react-router` 2.0.9；源码基准 `4fff00c` 加本轮工作区修复 |
| 文档版本 / 日期 | 1.1 / 2026-09-10 |
| 使用对象 | 测试执行人员、开发人员、发布负责人 |
| 依据 | [README](../README.md)、[公开类型声明](../index.d.ts)、[源码](../src/index.ts) |
| 本次交付 | D-01～D-24 修复、66 项补充回归、公开声明、README、测试台及测试文档更新 |
| 当前结论 | **24 类既有自动化缺陷已修复；343 / 343 用例通过，类型与覆盖率门禁通过。完整产品发布验收仍未完成，见第 6、8 节。** |

本轮按 [修复计划](reports/20260910-123716/FIX_PLAN.md) 实施，修改 `utils.ts`、`routes.tsx`、`router.tsx`、`link.tsx` 和 `index.d.ts`。保留原 277 项业务断言；原 232 项通过基线和 45 项缺陷用例全部通过，另增加 66 项。未使用 `skip`、`todo`、`it.fails`、降低覆盖率门限或扩宽声明来关闭缺陷。保留已有测试重整及 package/lockfile 变更，本轮没有升级依赖或更改包版本。

修复说明及逐项结果见 [FIX_REPORT.md](FIX_REPORT.md)；本轮原始证据归档于 [20260910-132525-fixed](reports/20260910-132525-fixed/RESULTS.md)，修复前报告仍保留在原目录。本文中明确标为“此前”或“修复前”的失败记录是历史证据。

## 1. 项目用途与测试目标

这是供 React 应用使用的轻量级客户端路由库。应用以嵌套对象定义路由；匹配到的树路径决定页面、逐层布局和路由元数据。`Router` 管理地址与导航上下文，`Routes` 将树展开为静态 / 动态路由，`Outlet` 渲染嵌套内容，`Link`、`Navigate`、`Redirect` 和 Hooks 提供导航与路由信息。

目标是验证应用能根据正确地址显示正确页面，并在跳转、返回、替换、配置变化时保持 URL、页面、参数、查询和 state 一致。对文档承诺、公开类型、实现行为三者之间的差异提供可复现证据。

### 1.1 范围与需求追踪

| 需求 | 功能 / 验证范围 | 自动化用例前缀 | 对应源码 |
| --- | --- | --- | --- |
| R01 | 路径规范化、拼接、相对路径、base 截断、URL 对象 | U-PATH、U-JOIN、U-RESOLVE、U-BASE、D-10～D-12、D-16～D-17 | `src/utils.ts`、`src/link.tsx`、`src/router.tsx` |
| R02 | 静态、命名参数、重复参数、`*`、`**`、精确边界 | U-MATCH、C-ROUTES、D-08、D-13～D-15 | `src/utils.ts`、`src/routes.tsx` |
| R03 | 分组、嵌套布局、叶子页面、空值、404、动态替换 entry | C-ROUTES、C-OUTLET、D-09 | `src/routes.tsx`、`src/outlet.tsx` |
| R04 | history 的 push / replace / delta / back / forward / base / 事件 | M-HISTORY、D-06～D-07、D-17、D-19 | `src/router.tsx` |
| R05 | hash 的地址解析、导航栈、外部 hashchange、base 和 state | M-HASH、D-04～D-05、D-18 | `src/router.tsx` |
| R06 | memory 页面切换、状态隔离、独立于浏览器、非浏览器渲染 | M-MEMORY、U-NODE、I-JOURNEY-04、D-01～D-03 | `src/router.tsx` |
| R07 | Link 属性、ref、自定义元素、点击选项和浏览器默认行为 | C-LINK、H-RESOLVE、D-20～D-22 | `src/link.tsx` |
| R08 | Navigate / Redirect 的 effect、delta 优先级、替换行为 | C-NAVIGATE、C-REDIRECT、I-JOURNEY-02 | `src/navigate.tsx` |
| R09 | 全部文档化 Hooks、元数据、查询重复键、参数清理 | C-OUTLET、H-QUERY、H-PARAM、H-RESOLVE、I-JOURNEY-01 | `src/router.tsx`、`src/outlet.tsx` |
| R10 | 同步 ref、批量更新、location 快照、监听清理、StrictMode | U-SYNC、U-LOCATION、U-GUARD、M-HISTORY-14～15、M-HASH-12、I-JOURNEY-05 | `src/utils.ts`、`src/router.tsx` |
| R11 | 嵌套路由器同步与业务组合 | I-JOURNEY-01～06 | `src/router.tsx` 及组件组合 |
| R12 | 公开 TypeScript 使用契约与运行时导出一致性 | T01～T03、D-23～D-24 | `index.d.ts`、`src/index.ts` |

尚未完成的项目包括实际部署服务器的 history 回退规则、真实浏览器滚动与下载、多浏览器兼容、性能容量。它们有明确手工用例，需在目标环境继续执行；本轮 ESM/CJS 发布包的隔离构建与消费已通过，见第6.1节。库没有提供的加载器、异步数据请求、真实登录鉴权、导航拦截器、URL 持久化存储等不列为产品能力；测试中的鉴权布局只是组合示例。

### 1.2 预期行为的来源

- **A：文档明确承诺**，例如三种模式、`base`、嵌套布局、通配符含义、replace 替换当前历史项。
- **B：公开类型或可观察接口契约**，例如 `setState` 接受函数、`Params` 允许字符串数组、运行时导出应有可用声明。
- **C：一致性验收行为**，例如与浏览器 URL 相对解析一致、静态路由不受声明顺序影响、原生链接交互、运行中更换 mode。本轮采用 FIX_PLAN 已选定的这些预期；发布签核仍需确认目标平台和第 6 节范围，不通过删除断言取消支持。

部分当前行为没有被扩展为额外承诺：匹配参数保留百分号编码；重复分组产生相同 URL 时采用首个端点；`0` 和空字符串 page 是有效端点；缺少 Outlet 的布局不显示子页。非法 / 循环路由树、共享同一 route 对象到多个父节点、直接原地修改 entry 对象、Provider 外调用路由 Hooks 没有明确支持契约，暂不作为发布通过项。

## 2. 环境与准备

| 项目 | 本次验证环境 | 交付要求 |
| --- | --- | --- |
| 操作系统 | Windows / PowerShell | Linux/macOS 的自动化执行仍需 CI 复核 |
| Node / npm | Node 24.14.1 / npm 11.19.0 | 建议复用该基准；依赖引擎交集至少为 Node 20.19、22.13 或 24+ 对应支持版本 |
| React / React DOM | 19.2.5 | React 19 系列为本轮基准，不推断旧主版本兼容性 |
| TypeScript / Vite | 6.0.3 / 8.0.8 | 以根目录 lockfile 为准 |
| 自动化 | Vitest 4.1.6、coverage-v8 4.1.6、jsdom 29.1.1 | 新增测试依赖均锁定版本 |
| DOM 测试 | Testing Library React 16.3.2、DOM 10.4.1、jest-dom 6.9.1 | DOM 可访问角色、文本、属性与公开上下文断言 |
| 自动化 URL | `https://router.test/` | jsdom 虚拟地址；无需 DNS、证书或服务器 |
| 浏览器测试台 | `http://127.0.0.1:4173/` | 仅本机监听；端口占用时明确报错 |
| 测试数据 | 固定路由、虚拟用户 ID、内存 JSON state | 无账号、无生产数据、无外部服务依赖 |

在项目根目录执行 `npm ci` 安装 lockfile 中的依赖。安装需要 npm registry 网络；自动化用例本身不访问外网。若出现依赖安装或 Node 引擎错误，先解决环境问题，不记为路由功能缺陷。不要使用 `npm audit fix --force` 作为测试准备步骤，以免改变被测依赖基准。

## 3. 执行方法与结果文件

```bash
npm ci
npm run test:types
npm run test:baseline
npm run test:regressions
npm test
npm run test:coverage
npm run test:catalog
npm run test:browser
```

各命令单独执行并记录退出码。本轮上述自动化命令全部返回 0；修复前 `npm test`、`test:regressions` 和 `test:coverage` 返回 1 的历史记录不能改写为成功。不要用连续 `&&` 连接所有步骤而导致后续报告没有生成。

| 命令 | 用途 | 主要输出 |
| --- | --- | --- |
| `npm test` | 全量自动化；发布功能门禁 | `test/reports/all/results.json`、`junit.xml` |
| `npm run test:baseline` | 排除 `regressions` 目录，检查已有通过行为是否回退 | `test/reports/baseline/`；本轮 232 / 232 通过 |
| `npm run test:regressions` | 保留缺陷契约和补充边界的回归门禁 | `test/reports/regressions/`；本轮 111 / 111 通过 |
| `npm run test:coverage` | 执行全量测试并统计所有 `src` 模块覆盖率；失败也生成报告 | `test/reports/coverage/`；`test/coverage/index.html`、`lcov.info`、`coverage-summary.json` |
| `npm run test:types` | 类型检查源码、测试、浏览器测试台和全部正反向消费者示例 | 编译输出 / 退出码；11 处 `@ts-expect-error`，含原有 7 处 |
| `npm run test:watch` | 开发期间全量监听执行 | `test/reports/watch/` |
| `npm run test:catalog` | 从最新全量 JSON 生成逐条用例清单与结果快照 | [CASE_CATALOG.md](CASE_CATALOG.md) |
| `npm run test:browser` | 启动手工测试台，终端 Ctrl+C 结束 | 本机 4173 端口 |

定向运行示例：

```bash
npm test -- test/modes/history.test.tsx
npm test -- -t D-01
npm run test:baseline -- -t H-QUERY
```

定向运行会覆盖对应 profile 的报告，而且不代表全量结果。生成清单前必须重新执行无过滤条件的 `npm test`。运行器可从 Windows、Linux、macOS 调用，不依赖 `VAR=value command` 或 PowerShell 专属环境变量写法。

### 3.1 自动化设计

纯函数使用等价类、边界值和参数化测试；路径输入覆盖空串、根路径、重复斜杠、反斜杠、相对层级、协议、查询、片段、中文及编码。组件使用真实 React 19 渲染；大部分模式测试保留真实 jsdom History API，只有检查委托参数时才替换 `history.go/back/forward`。

hash 导航等待可观察的 route 更新，不用固定延迟代替断言。测试清理时卸载 React、恢复 spies / globals，并排空已入队的 jsdom 事件；不对跨用例累积的 `history.length` 写固定值，只断言相对增减。文件间独立环境、最多 4 个 worker；同一环境中的导航用例不并发执行。

`helpers/router.tsx` 的 Capture 只用于导航状态观察，会额外包装根布局；布局 / 栈测试直接使用未改写的树，保证布局索引和元数据身份断言有意义。`helpers/context.tsx` 用于组件隔离；点击后在 document 层阻止 jsdom 全页导航，并在此之前记录 Link 是否阻止默认行为，避免把测试兜底逻辑误当成 Link 行为。

`receivePopstate` 是外部事件接收模拟；M-HISTORY-10 另行执行真实 jsdom `history.back/forward`。这两类均不能替代目标浏览器验证。Node 环境用例专门去除浏览器全局，用于导入与 memory SSR 契约。

## 4. 自动化测试用例

下表给出测试人员可执行的功能步骤与验收预期。参数化输入会展开为独立执行结果；**全部 343 条展开后的名称、所在文件与结果见 [CASE_CATALOG.md](CASE_CATALOG.md)**。用例名前缀可直接传给 `-t` 过滤。

### 4.1 工具函数

| 编号 | 输入 / 方法 | 预期结果 | 优先级 |
| --- | --- | --- | --- |
| U-PATH-01～04 | 对空串、根、重复斜杠、反斜杠、中文路径规范化 | 斜杠统一；按函数职责删除首尾斜杠；重复规范化幂等 | P1 |
| U-PATH-05～06 | 删除最后路径段；检查 http/https/ftp、普通路径和非 `://` 字符串 | 只移除最后段；协议判定遵守当前函数定义 | P2 |
| U-JOIN-01 | 0 / 1 / 多段参数、绝对后段、空段、`.`、`..`、hash、绝对 URL 后段 | 返回表中精确字符串；绝对后段重启路径 | P1 |
| U-RESOLVE-01～02 | 从 `/a/b` 解析相邻段、父段、绝对路径、URL 对象、无 fromPath | 正常相对解析；URL 对象保留完整 href | P1 |
| U-BASE-01 | `/app`、根、非前缀、相似前缀 `/application`、显式正则 | base 只能按完整段截断；不匹配返回 null | P1 |
| U-MATCH-01～02 | 静态大小写、命名参数、缺失参数、`*`、`**`、双重同名、中文与编码 | 正确捕获 / 拒绝；`*` 一段；`**` 零或多段；每次返回独立对象 | P1 |
| U-GUARD-01～04 | React 空值、0、空串、布尔、对象、函数、BigInt、Symbol、NaN | 仅 undefined/null/false 被视为 unset；仅 string/number 通过 scalar guard | P2 |
| U-LOCATION-01～03 | 克隆完整 URL 后改变 pathname / search / hash / state | 克隆含数据字段且无方法；URL 改变被识别；state-only 不算 URL 改变 | P1 |
| U-SYNC-01～05 | rerender、惰性初始化、连续函数更新、相同对象、无初值 | ref / setter 身份稳定，同步可见；不丢失批量更新；相同对象不额外渲染 | P1 |
| U-NODE-01 | 在 Node 环境导入源码并调用纯工具函数 | 导入不访问浏览器全局；纯函数可运行 | P1 |

### 4.2 路由、布局与 Hooks

| 编号 | 操作 / 数据 | 验收预期 | 优先级 |
| --- | --- | --- | --- |
| C-ROUTES-01～02 | 访问首页、about、尾斜杠、query/hash、多层 users/posts | 匹配正确端点；最深 page 替换父级 page；参数来自完整链 | P0 |
| C-ROUTES-03～05 | page 为 null/false/undefined/0/空串；父节点仅有 layout | 无 page 的节点不是端点；0/空串可匹配；布局包裹有效后代 | P1 |
| C-ROUTES-06～07 | 静态路由先声明；files 下 catch-all；访问未知前缀 | 静态命中；catch-all 处理剩余段；范围外显示 notFound | P1 |
| C-ROUTES-08～10 | 单层 / 多层 `#group`、动态后代、未设置 notFound | 分组不占 URL；布局仍生效；无匹配可渲染为空 | P1 |
| C-ROUTES-11～13 | 替换 entry、重复分组 URL、单独使用公开 Routes | 路由索引更新；首个重复端点生效；Routes 使用传入上下文 | P1 |
| C-OUTLET-01 | root → users → 无布局 group → leaf layout/page | DOM 逐层嵌套；full stack 保留 group；layout stack 过滤 group；current route 和深度正确 | P0 |
| C-OUTLET-02～04 | 使用 useOutlet、叶子 Outlet、缺少 Outlet、空 layout | useOutlet 等价渲染；叶子无额外内容；缺 Outlet 隐藏子页；空 layout 跳过但 current route 正确 | P1 |
| H-QUERY-01 | `q=中文+hello&tag=a&tag=b&empty=&flag` | query 解码、重复键、空值和不存在键正确；useQuery 与 useSearchParams 等价 | P1 |
| H-PARAM-01、H-QUERY-02～03 | 动态 → 动态 → 静态 → 404；只改查询；修改返回的 URLSearchParams | 参数更新且清理；查询变化可见；本地对象修改不改变真实 URL；useNavigate 等于上下文方法 | P1 |
| H-RESOLVE-01～02 | 三种 mode、带 base、相对目标、空目标 | history 生成 base 下 href；hash/memory 使用 `#` 形式；无目标 href 为空 | P1 |

### 4.3 导航组件与模式

| 编号 | 操作 | 验收预期 | 优先级 |
| --- | --- | --- | --- |
| C-LINK-01～02 | 渲染属性与 ref；普通点击并传 replace/state/scrollRestore | 标签与属性正确；只导航一次；拦截普通默认跳转；选项准确传递 | P0 |
| C-LINK-03～05 | Ctrl 点击；delta=-1/0/2 与 to 共存；无 to | Ctrl 保留原生行为；delta 优先且无 href；无 to 不导航，用户回调仍执行 | P1 |
| C-LINK-06～07 | button / 自定义组件；真实 Router 中点击 | 自定义渲染生效；点击后 URL 与目标页一致 | P1 |
| C-NAVIGATE-01～04 | effect 挂载、delta、缺目标、变更 to | 不生成 DOM；正确调用；delta 优先；目标变化触发下一次导航 | P1 |
| C-REDIRECT-01～02 | 检查 replace=true；从首页重定向到 login | 替换而不增加历史项；目标页出现 | P1 |
| M-HISTORY-01～02 | 默认模式、规范化 base、URL 不在 base 下 | 默认 history；上下文 pathname 截掉 base；越界时 null + notFound | P0 |
| M-HISTORY-03～07 | push / replace、相对目标、反斜杠、同源和跨源 URL 对象 | URL/页面/state 一致；push 增一项；replace 不增；跨源对象抛错且无副作用 | P0 |
| M-HISTORY-08～10 | delta=0/-2、back/forward、接收 popstate、真实 jsdom 往返 | 委托参数正确；0 不动；页面与参数随地址更新 | P1 |
| M-HISTORY-11～13 | scrollRestore、setState、同 URL 导航、无 state 导航 | 浏览器属性为 auto/manual；对象 state 同步；无 state 时清空 | P1 |
| M-HISTORY-14～15 | 卸载、发送未改变 URL 和 state 的事件 | 移除同一个监听器；URL/state 均未变更时不额外更新上下文 | P1 |
| M-HASH-01～04 | 外层 URL 有 query；hash 有路径/query/fragment；相对导航 | 仅读取内部路由；外层 pathname/query 保留；目标内容正确 | P0 |
| M-HASH-05～08 | push/back/forward、返回后新 push、越界 delta、直接改 hash | 往返正确；新分支清除前进链；越界无害；外部 hashchange 生效 | P1 |
| M-HASH-09～12 | 初始 base 深链、context state、跨源对象、卸载 | 初始化能截掉 base；state 局部更新；跨源对象拒绝；监听移除 | P1 |
| M-MEMORY-01～04 | 根初始化、发起导航、对象/函数 state、检查事件订阅 | 根页可见；不修改浏览器 URL/History/滚动设置；state 可更新；无浏览器路由事件监听 | P1 |
| D-01～D-24 | 依第 5 节执行缺陷契约及补充边界用例 | 必须满足正确预期；本轮均为正常通过 | 按缺陷表 |

M-MEMORY-02 验证导航的浏览器副作用隔离；D-01 及新增连续旅程验证页面切换、历史和 state。本轮这些旅程的全部步骤均已执行通过。历史失败用例在首个失败断言处停止，修复前未到达的后续步骤仍保持受阻记录。

### 4.4 集成与类型

| 编号 | 场景 / 方法 | 验收预期 | 优先级 |
| --- | --- | --- | --- |
| I-JOURNEY-01 | `/app` 下首页 → 用户 → 404；期间增加布局计数 | base、分组面包屑、query、详情元数据正确；路由切换保留布局状态；404 不残留旧页 | P0 |
| I-JOURNEY-02 | 受保护分组布局 Redirect 到 login | 无私有页面泄露；URL 替换；returnTo state 传达 | P1 |
| I-JOURNEY-03、06 | 子 history/hash Router 发起导航 | 父、子上下文和页面同步 | P1 |
| I-JOURNEY-04 | 两个 memory Router 更新其中一个 state | 实例状态不串扰 | P1 |
| I-JOURNEY-05 | StrictMode 挂载、hash 点击、卸载 | 页面不重复，卸载清空容器；本例不覆盖 StrictMode 下所有重定向组合 | P1 |
| T01 | 编译 `types/consumer.tsx` 中的泛型元数据、Hooks、URL、state、按钮 Link/ref | 正确的公开调用全部可编译；使用包名导入验证真实类型入口 | P1 |
| T02 | consumer 的 8 个负例及 exports 的 3 个 Provider 负例 | 原 7 个负例、未收窄 Params→string、错误 Context 值均被 TypeScript 拒绝 | P1 |
| T03 | 编译源码、测试配置、测试台 | 不用 `skipLibCheck` 隐藏整体类型问题；全部通过 | P1 |
| D-23～24 | TypeScript compiler API 编译独立缺陷 fixture | 捕获数组类型和缺失导出声明的诊断；修复后诊断应为空 | P1 |

`types/regressions` 现已纳入常规类型门禁，同时由 D-23/D-24 的独立 compiler program 验证；两处均为 `skipLibCheck=false`。五个补齐导出通过包名导入并实际用于 JSX、Provider、useContext 及 boolean 返回值。独立编译用例的超时为 15 秒，以容纳完整声明检查叠加 V8 插桩；不改变诊断必须为空的断言。

### 4.5 本轮补充的 66 项回归

| 文件 | 新增数 | 核心风险 |
| --- | ---: | --- |
| `regressions/path-contracts.test.ts` | 25 | 仅规范化 pathname；美元符、查询斜杠、中文/%2F；完整 URL；字面量/带 flags 正则 base；静态元字符、catch-all、2～4 次同名捕获 |
| `regressions/router-contracts.test.tsx` | 30 | 同 URL 原生 state 往返；批量函数更新/导航；异常不提交；动态祖先与分组；独立 Routes 和 404 清参；双 memory 与父层隔离；中间 replace 保留前进记录；嵌套 hash replace；StrictMode 模式生命周期；三模式 × 两个 base 的 href/地址对照 |
| `regressions/memory-server.test.tsx` | 2 | Node 下实际根页 SSR、两个 base、URL/字符串及 navigate/replace/back/forward/setState 可用 |
| `regressions/link-contracts.test.tsx` | 9 | 中/右键、取消 delta、命名 target、空 download、大小写 `_self`、自定义锚点的最终 DOM 属性、键盘激活形式 |

类型 fixture 的扩展仍由原 D-23/D-24 两个测试执行，不另计运行时用例。逐项展开结果及关联编号以 CASE_CATALOG 为准。

## 5. 已复现缺陷与正确验收预期

以下 24 个编号在本轮选定的自动化范围内均已修复并回归通过，不是豁免。原 45 个失败用例全部保留。缺陷编号是本地编号，没有代替团队创建线上缺陷单。表中最后一列保留修复前实际；本轮实现、测试数量与剩余限制见 FIX_REPORT。D-04/D-18 的关闭仅对应 Router API 局部历史契约，不关闭 MAN-06/09 的原生 hash 历史范围扩展。

| 编号 / 优先级 / 来源 | 最小复现 | 正确预期 | 修复前实际（历史记录） |
| --- | --- | --- | --- |
| D-01 / P0 / A | memory 首页 navigate('/about')；再检查 push/back/forward/replace | 内存地址与页面更新，浏览器 URL 不变 | 始终停留在 `/`；浏览器中同样复现 |
| D-02 / P2 / C | 浏览器已有 `#/unrelated-host-route` 时挂载 memory | 无初始地址配置时，从独立根路由开始 | 使用宿主 hash 作为内存路由 |
| D-03 / P1 / A | Node `renderToString(<Router mode="memory" ... />)` | 不需要 window/location/history | 抛出 `location is not defined` |
| D-04 / P1 / A | hash push about → users/1 → replace users/2 → back；另比较原生历史长度 | 保留 about；replace 不新增原生记录 | 内部栈被清空，无法返回 about；原生记录反而增加 |
| D-05 / P1 / A | hash + base=/app，Link/navigate('/about') | `#/app/about` 并成功匹配 | href/hash 为 `#/about`，遗漏 base |
| D-06 / P1 / B | 带 history.state 挂载；或 popstate 返回带 state 的页面 | context.state 与目标历史项一致 | 初始为 null；返回后仍保留上一页 state |
| D-07 / P1 / B | history setState(prev => next) | 先计算 next，再写入可克隆的历史 state | jsdom history.state 是函数；真实浏览器抛出 DataCloneError |
| D-08 / P1 / C | 先声明 `:id` / `*` / `**`，再声明静态 new，访问 /new | 精确静态页优先且不受兄弟声明顺序影响 | 动态页遮蔽静态页 |
| D-09 / P1 / B | 保持 /42，entry 从 :id 换成静态 42 或 :slug | 清除旧参数，得到 {} 或仅 slug | id 残留，或 id 与 slug 同时存在 |
| D-10 / P1 / C | resolvePath 的 query、fragment、尾斜杠、根级父路径、点开头文件、query 内含斜杠 | 与浏览器 `new URL(to, from)` 的路径/query/hash 一致 | 额外斜杠、旧 query 残留、目录丢失、根斜杠丢失或点被删 |
| D-11 / P1 / B | joinPath('/items?q=old','next')；路径含 `$` | 清旧 query；保留字面量 `$` | 清理函数识别 `$` 而非 `?`，导致旧 query 残留和合法路径截断 |
| D-12 / P1 / B/C | 字符串 base '/v1.0' 匹配 '/v1X0/users'；正则 base 带 `\d+` | 字符串按字面量匹配；显式正则保留转义 | 字符串被当正则；显式正则的反斜杠被规范化破坏 |
| D-13 / P1 / A | matchPath('/v1X0/users/42','/v1.0/users/:id') | 静态段精确匹配，应返回 null | 点被作为正则元字符而错误命中 |
| D-14 / P1 / A | matchPath('/filesXYZ/secret','/files/**') | 前缀必须是完整 files 段 | filesXYZ 也被 catch-all 命中 |
| D-15 / P2 / B | 三段同名参数或三个 `*` | 收集三个值的数组 | 第三个值覆盖前两个 |
| D-16 / P2 / C | joinPath('https://router.test/a/') | 保留 `https://` | 被改成 `https:/` |
| D-17 / P1 / B/C | history navigate('https://router.test/about') | 与同源 URL 对象指向相同地址 | 变成 `/router.test/about` |
| D-18 / P1 / A/B | hash 两次带不同 state 导航，然后 back | 恢复前一个路由的 state | 页面变了，state 仍为后一页 |
| D-19 / P2 / C | 同一 Router 实例从 history rerender 为 hash | 清理旧事件并订阅新模式事件 | effect 未随 mode 更新；旧订阅保留 |
| D-20 / P2 / C | Meta / Shift / Alt 点击 Link | 交给浏览器处理，不触发当前页路由导航 | 除 Ctrl 外都被拦截并调用 navigate |
| D-21 / P1 / B/C | Link.onClick 调用 preventDefault | 取消后不再导航 | 仍调用 navigate |
| D-22 / P2 / B/C | Link 带 target=_blank 或 download | 保留新标签 / 下载语义 | 拦截默认行为，改为当前路由跳转 |
| D-23 / P1 / B | 把重复参数运行时数组赋给 ReturnType&lt;useParams&gt; | `string \| string[]` 被公开类型接受 | 声明限定 string，产生 TS2322 |
| D-24 / P1 / B | 从包入口导入 Routes、三个上下文、isStartWithProtocol | 运行时导出的符号都有公开类型 | 五个导出缺少对应声明，类型导入失败 |

本轮对应改动：`routes.tsx` 使用独立子节点动态标记并在重新匹配开始清参；`router.tsx` 从当前模式正确取 location/state，维护同步的局部历史，成功写入后通知父层；`utils.ts` 分离路径和后缀，正确处理正则/通配/捕获；`link.tsx` 对齐地址解析与原生点击条件；`index.d.ts` 纠正 Params 并补齐五个导出。

## 6. 浏览器与发布手工测试

执行 `npm run test:browser` 后打开本机 4173 端口。选择 mode/base 后点击“应用并重建路由”，每个独立用例从该操作开始；模式与 base 只保存在该标签页的 sessionStorage。它会重建 Router，**不能代替 D-19 的同实例 mode 变更测试**。浏览器历史不会被彻底清空，只检查本用例产生的记录，避免返回本测试之前的页面。

“路由控制台”显示浏览器 URL、匹配 pathname、query/hash、params、context/native state 和 scrollRestoration。目标路径输入框支持查询与片段；state 输入框要求合法 JSON；底部的 Link 用于检查原生行为。遇到 404 时控制台仍保留，可以导航回来。About 是长页，用于滚动验证。

| 编号 / 优先级 | 前提与操作步骤 | 验收标准 | 此前浏览器抽查（修复前） |
| --- | --- | --- | --- |
| MAN-01 / P0 | history、base=/；布局计数点到 1；点“用户 42” | URL=/users/42?tab=profile；详情和 Users 布局出现；id=42、tab=profile；布局计数仍为 1 | 通过 |
| MAN-02 / P1 | 接 MAN-01；点“刷新当前深链接” | 开发服务器返回入口；详情与参数仍正确；布局计数因整页重载归零 | 通过，仅 Vite 开发服务器 |
| MAN-03 / P1 | history；依次导航 about、users/42，勾 replace 导航 users/43；分别用浏览器与控制台后退/前进 | replace 不增加记录；返回到 about；前进到 users/43；页面/URL/参数同步 | 未执行 |
| MAN-04 / P1 | 分别选 history/hash、base=/app；点用户 42；再输入不带 /app 的地址并刷新 | 部署前缀只出现一次；正确内部路径；超出 base 显示 404 | 未执行；hash 有 D-05 |
| MAN-05 / P0 | hash、base=/；点击“用户 42” | 地址变为 /#/users/42?tab=profile；详情、参数和查询正确；外层路径不变 | 通过 |
| MAN-06 / P1 | hash；执行 MAN-03 的序列；再手工编辑 hash、使用浏览器返回和控制台返回 | 替换只影响当前项；两种返回都与实际历史一致；外部 hash 可进入正确页面 | 未执行；D-04/D-18 待修复 |
| MAN-07 / P0 | memory、base=/；点击用户 42；随后导航 about、返回、前进、replace | URL 始终不变；页面/参数随内存历史变化 | 首次点击失败 D-01；后续步骤受阻 |
| MAN-08 / P1 | history、base=/；点“函数式 state +1” | 不抛错；context 与 native state 都是 `{count:1}` | 失败 D-07；真实 DataCloneError |
| MAN-09 / P1 | history/hash 两次导航不同 JSON state，再返回、前进、刷新 | 每个历史项拿回自己的 state；history 刷新可读取原生 state | 未执行；D-06/D-18 待修复 |
| MAN-10 / P1 | 用 Tab 聚焦 Link 并 Enter；Ctrl/Meta/Shift/Alt、中键打开用户链接 | 普通激活只导航一次；修饰键遵循该平台原生语义；焦点可见且键盘可达 | 未执行完整矩阵；D-20 |
| MAN-11 / P1 | 在首页点击“已取消的 About 链接”；另测“新标签打开 About”和“下载链接” | 取消不动；新页出现且当前页不导航；下载保留浏览器语义 | 未执行；D-21/D-22 |
| MAN-12 / P1 | history 的 About 滚到页底；分别选择 scrollRestore=true/false 导航；使用浏览器返回 | 核对 README 的保留 / 回顶语义与实际位置；记录导航前后 scrollY 和浏览器策略 | 未执行，不能由 auto/manual 属性通过替代 |
| MAN-13 / P1 | 设置静态 new、动态用户、docs/intro、docs/a/b、files、files/a/b/c、login、private、missing | 静态/动态/单段/多段边界正确；分组不占 URL；private 跳到 login；404 无旧页 | 自动化覆盖，浏览器完整序列未执行 |
| MAN-14 / P1 | 在 Chrome、Edge、Firefox 的发布时当前与上一稳定版，以及 macOS Safari 重做 MAN-01～13 | P0/P1 全部通过；记录精确浏览器/OS 版本，移动端另做触摸与返回抽查 | 未执行兼容矩阵 |
| MAN-15 / P2 | 构造 100/1,000/10,000 路由、10/50 层布局，重复导航 1,000 次；用 Performance/Memory 面板采样 | 无崩溃、无限循环或持续增长的监听/保留对象；冷启动和导航 p50/p95 相对已批准基准回退≤20% | 未执行；需先建立基准，当前不宣称性能达标 |
| MAN-16 / P1 | 在干净发布工作区依次执行 build、build:alias、npm pack --dry-run；将实际 tarball 安装到独立 React19 消费者 | ESM/CJS/声明入口存在；分别 import/require 并渲染 Router/Link；包不含 test；消费者 typecheck 通过 | 未执行发布包验收；源码测试不代表打包成功 |
| MAN-17 / P1 | 在真实目标服务器部署 history/base=/app；直接请求 /app/users/42 并刷新；hash 模式同测静态托管 | history 回退到入口且资产路径正确；hash 静态托管可打开深链；无服务器 404 | 未执行部署验收 |

此前浏览器抽查使用 **Codex 内置浏览器**，没有采集内核精确版本，不算 Chrome/Edge/Firefox/Safari 矩阵认证。修复前 MAN-01、02、05 通过，MAN-07、08 失败；这些历史结果保留如上。本轮复测结果如下。

### 6.1 本轮浏览器及打包复测（2026-09-10）

本轮仍使用 Windows 上的 Codex 内置浏览器与本地 Vite；内核精确版本未采集。原始状态及说明见 [浏览器记录](reports/20260910-132525-fixed/BROWSER_REPORT.md)。测试台新增 native back/forward 按钮、不可克隆 state 按钮、完整内部 routeURL 和 historyLength，便于区分原生与局部行为。

| 项目 | 本轮结果 / 限制 |
| --- | --- |
| MAN-01、MAN-10 普通键盘激活 | Enter 打开用户 42，id/query 正确，布局计数保持 1，新增一次原生记录 |
| MAN-02、MAN-08、MAN-09 history | 函数 updater 得到 `{count:1}`；同 URL 两项 state 1/2 随原生后退/前进恢复；深链刷新保留原生 state。不可克隆结果报 DataCloneError，context/native state、URL 和长度均不变 |
| MAN-04/05 hash base | `/app` 下用户 Link 得到 `#/app/users/42?tab=profile` 并匹配 `/users/42`；完整 base/越界矩阵由自动化覆盖 |
| MAN-06、MAN-09 hash Router API | replace 长度保持 13；Router.back 恢复 about/step=1，forward 恢复 users/8/step=3；通过局部历史范围 |
| MAN-06、MAN-09 hash 原生返回 | **范围扩展验收未通过**：从 users/1 原生后退到 about 后，state 仍为 `{nativeStep:2}`。Router 的局部游标不与原生记录统一；不通过 URL 猜测恢复，不覆盖宿主 state；见 FIX_PLAN 4.6 |
| MAN-07 memory | `/app` 根 → 用户42 → about → users/7 → back → replace users/8 → forward：页面/params/state 正确，forward 仍到 users/7；浏览器 URL 和长度始终不变 |
| MAN-10 修饰键/中键 | 已实际点击 Control/Meta/Shift/Alt/中键；Control 保持当前页，Windows 内置浏览器的 Meta 走当前页原生导航。平台完整矩阵、焦点可见性和新窗口结果仍待验证 |
| MAN-11 | 取消链接不导航；`_blank` 点击保持原页，但工具未呈现新标签；下载点击没有收到 download 事件。新标签/下载最终结果记为受阻，不将自动化通过替代浏览器完成 |
| MAN-13 冒烟 | 静态 new、docs/intro 单段捕获、files/a/b/c、private→login 携带 state、404 通过；docs/a/b、files 空余段等完整边界由自动化覆盖 |
| D-19 | 同实例 mode 切换、重入重置、StrictMode 成对监听、卸载后事件均由新增自动化通过；重建测试台不代替它 |
| MAN-16 | 隔离源码快照的 build、独立 ESM/CJS 编译、build:alias、pack dry-run/实际 tarball 均通过；独立 React19 消费者安装后 import/require 渲染 Router/Link、完整类型检查均通过，包不含 test |
| MAN-03 全序列、MAN-12/14/15/17 | 本轮未完成完整原生历史序列、真实滚动、浏览器矩阵、性能基准、实际部署；保留发布门禁 |

MAN-12 特别注意：设置 `history.scrollRestoration='manual'` 不等同于主动 `scrollTo(0,0)`。README 的注释与浏览器行为可能不一致，实际滚动验收必须另行完成。开发服务器的 SPA 回退也不代表生产服务器已经配置正确。

## 7. 验收标准与缺陷处理

### 7.1 测试资产交付标准

- 测试文件统一位于 `test/`，安装后可按第 3 节命令执行；类型检查与当前功能基线通过。
- 每项功能有可定位的测试前缀；失败项有编号、步骤、正确预期和当前实际；手工项目有执行边界。
- 全量 JSON / JUnit、覆盖率和用例清单可生成；不得把某项未执行或受阻记录为通过。
- 新增测试依赖属于 devDependencies；测试台只在本机运行，发布包仍应遵守原 `.npmignore` 白名单。

### 7.2 产品发布标准

| 维度 | 放行要求 |
| --- | --- |
| 功能 | 无过滤条件的 `npm test` 100% 通过；无跳过、todo、only 或预期失败反转 |
| 类型 | `npm run test:types` 和 D-23/D-24 均通过；消费者声明与运行时行为一致 |
| 缺陷 | P0/P1 清零；P2 修复或由产品/测试/发布负责人明确记录接受范围；C 类契约已经确认 |
| 覆盖率 | 全源码 statements ≥95%、lines ≥95%、functions ≥95%、branches ≥90%；以全量执行统计 |
| 浏览器 | 所选支持矩阵的 P0/P1 用例通过；真实滚动、键盘/新标签、刷新、原生历史有执行记录 |
| 构建与部署 | MAN-16/17 通过，ESM/CJS/类型入口与实际消费、服务器深链接均可用 |
| 可重复性 | 在目标 CI 干净安装后复跑通过；出现偶发错误需定位，不能靠 retry 计为通过 |

**覆盖率表示执行到了代码，不表示行为正确。** 修复前 45 个失败用例也参与过覆盖率统计；本轮它们正常通过，但仍不能以自动化及覆盖率替代第 6 节未完成的浏览器、滚动及部署验收。

优先级：P0 为核心模式不可用或主流程阻断；P1 为地址、页面、参数、state、类型等关键契约错误；P2 为较少使用的边界、兼容与待确认行为。出现安装失败、测试环境异常或多个文件级崩溃时暂停结果归因；单个已知功能失败不阻止收集其他独立用例结果。

缺陷流程：复现 → 登记环境与最小树/URL → 开发定位 → 确认 A/B/C 契约 → 修复 → 单缺陷回归 → 相关模块回归 → 全量与覆盖率 → 浏览器/发布验收。修复后将对应回归用例保留，或迁入正常模块并更新清单；不能删除断言来取得绿色结果。

建议缺陷单模板：

```text
编号 / 标题 / 优先级：
版本 / 提交 / 操作系统 / Node / 浏览器版本：
模式 / base / 初始 URL / 初始 state：
最小 route tree 与前提：
执行命令或点击步骤：
正确预期 / 实际页面、URL、params、query、state：
退出码 / 测试名 / 日志或截图路径：
复现次数 / 契约来源 / 影响范围：
修复提交 / 复测人 / 复测日期 / 复测结论：
```

## 8. 交付物与本轮执行记录

| 交付物 | 路径 / 说明 |
| --- | --- |
| 测试计划 | 本文件 `test/TEST_PLAN.md` |
| 本轮修复报告 | [FIX_REPORT.md](FIX_REPORT.md)；逐个 D 编号的修改与回归结果 |
| 全部展开用例与状态 | [test/CASE_CATALOG.md](CASE_CATALOG.md)，由 `generate-catalog.mjs` 生成 |
| 正常功能测试 | `test/unit/`、`test/components/`、`test/modes/`、`test/integration/` |
| 缺陷回归 | `test/regressions/`；普通正确行为断言，包含 Node SSR 和类型契约 |
| 类型样例 | `test/types/consumer.tsx`、`test/types/regressions/` |
| 环境与夹具 | `test/setup.ts`、`test/helpers/`、`test/tsconfig.json`、`test/vitest.config.mts` |
| 跨平台执行脚本 | `test/run.mjs`；根 `package.json` 中 `test*` 命令 |
| 手工测试台 | `test/browser/` |
| 自动化原始结果 | `test/reports/{all,baseline,regressions,coverage}/results.json` 与 `junit.xml` |
| 覆盖率 | `test/coverage/` 中 HTML、LCOV、JSON；失败时仍产出 |
| 安装基准 | 根 `package.json`、`package-lock.json` |

`reports/` 与 `coverage/` 是可再生成文件，已在 `test/.gitignore` 排除；需要交给测试团队的执行证据应随交付包单独归档。仓库保留本计划和用例结果快照，避免只交付本机绝对路径报告。

### 8.1 此前测试资产交付时的记录（修复前）

| 此前验证项 | 历史结果 |
| --- | --- |
| 常规类型检查 | 通过；包含源码、测试、配置与消费者样例 |
| 功能基线 | 10 个测试文件、232 个用例全部通过 |
| 全量自动化 | 15 个测试文件、277 个用例；232 通过、45 失败、0 跳过 |
| 已知缺陷 | D-01～D-24，共 24 类；45 个失败均有归属 |
| 语句覆盖 | 100%：279 / 279 |
| 行覆盖 | 100%：277 / 277 |
| 函数覆盖 | 100%：63 / 63 |
| 分支覆盖 | 99.39%：165 / 166 |
| 未覆盖分支 | `src/router.tsx` 的协议 base 判定分支；base 在判断前已被斜杠规范化。未通过造假 mock 强行覆盖 |
| 真实浏览器抽查 | 3 项通过、2 项失败；见 MAN-01/02/05/07/08 |
| 完整兼容、性能、发布包、实际部署 | 尚未执行，不作通过声明 |

### 8.2 本轮修复验收

| 验证项 | 本轮结果 |
| --- | --- |
| 类型 | `test:types` 退出码 0；包含全部类型 fixture；原 7 个和新增 4 个类型负例保留有效 |
| 功能基线 | 10 文件，232 / 232，通过；退出码 0 |
| 缺陷回归 | 5 文件，111 / 111，通过；退出码 0 |
| 无过滤全量 | 15 文件，343 / 343，通过；无失败/跳过/未处理异常；退出码 0 |
| 修复前用例对照 | 原 277 个完整名称全部保留并通过；包含原 45 个缺陷失败和原 232 个通过项 |
| 覆盖率 | statements 337/337、lines 324/324、functions 67/67 均为 100%；branches 248/250 = 99.2%；门限不变，退出码 0 |
| 未覆盖分支 | Router 的既有协议 base 判断；matchPath 的无首斜杠裸 `**` 分支。未引入造假 mock |
| 用例清单 | 最后一次无过滤 `npm test` 后生成，共343项；逐 D 编号统计通过/失败 |
| 构建/打包 | 独立编译、实际打包、离线独立消费者安装、ESM/CJS SSR 与类型检查均返回 0 |
| 执行证据 | `reports/20260910-132525-fixed/`：四组 JSON/JUnit、日志、覆盖率、浏览器记录与截图、包清单及消费日志 |
| 仍需发布验收 | hash 原生历史/state 范围扩展、新标签/下载结果、完整浏览器/滚动矩阵、性能、目标 CI 干净安装及实际部署 |

交付结论为“本轮 24 类既有自动化缺陷修复完成；完整产品发布验收未完成”。修复尚在工作区，未创建 Git 提交；原有暂存删除和测试重整已保留。发布时仍需由对应负责人确认剩余验证、目标平台和 hash 原生历史支持范围。

## 9. 测试工具参考

测试运行与异步断言依据 [Vitest Test API](https://vitest.dev/api/test.html)；全源码包含范围、失败时输出和门限依据 [Vitest Coverage](https://vitest.dev/guide/coverage.html)；React 渲染、act 与卸载使用 [Testing Library React API](https://testing-library.com/docs/react-testing-library/api/)。具体执行以 lockfile 中已安装版本和本仓库配置为准。
