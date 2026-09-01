# `@canlooks/react-router` 测试计划与测试说明

## 1. 文档信息

| 项目 | 内容 |
| --- | --- |
| 被测项目 | `@canlooks/react-router` |
| 被测版本 | `2.0.9` |
| 源码基线 | `main` 分支，源码提交 `4fff00c` |
| 文档版本 | `2.1` |
| 编制/更新日期 | 2026-08-29 / 2026-09-01 |
| 测试类型 | 单元、组件、Hook、集成、路由模式、类型契约、构建、包与真实浏览器 |
| 自动化框架 | Vitest 4.1.11、React Testing Library 16.3.3、jsdom 30.0.1、Playwright 1.58.2 |
| 当前自动化结果 | 30 个 Vitest 文件、456 项通过；Chrome/Edge/Firefox 共 36 项通过；无 expected-failure、跳过或待办用例 |
| 当前覆盖率 | 语句 100%、分支 99.7%、函数 100%、行 100% |

本文件既是执行说明，也是交付给测试人员的验收依据。原报告中的 DEF-001～012、DEF-016 均已转为普通回归并通过；本轮完成 DEF-017～021 以及后续新确认的 DEF-023 修复与回归（不含 DEF-022）。DEF-014、DEF-015 已在当前基线复核为不再复现；DEF-013、DEF-022 按用户指定明确排除，不在本文中宣称已修复。

## 2. 项目功能与用途

本项目是一个面向 React 19 的轻量路由管理库。使用方以嵌套对象定义路由树；路由器根据当前位置构造从根到叶子的匹配栈，再通过 `layout`、`page` 与 `Outlet` 形成嵌套界面。

核心处理链路为：当前位置或内存位置 → 按 `base` 截断路径 → 静态/动态路由匹配 → 构造路由栈 → 过滤布局栈 → 逐层渲染布局和页面。

主要能力如下：

- `history`、`hash`、`memory` 三种路由模式。
- 静态路径、`:param` 命名参数、`*` 单段通配符、`**` 剩余路径通配符。
- 以 `#` 开头的无 URL 分组节点。
- 多层 `layout`、`page`、`Outlet` 嵌套渲染。
- `Link`、`Navigate`、`Redirect` 以及命令式导航。
- 路由参数、查询参数、当前路由、路由栈、路径解析等 Hook。
- 导航状态、替换、前进后退、滚动恢复选项。
- `RouteItem<T>` 自定义元数据与公开 TypeScript 声明。
- CommonJS 与 ESM 双构建产物。

源码职责如下：

| 文件 | 职责 |
| --- | --- |
| `src/router.tsx` | 路由上下文、三种模式、位置同步、导航、状态与查询参数 |
| `src/routes.tsx` | 遍历路由树、建立静态/动态映射、匹配并构造路由栈 |
| `src/outlet.tsx` | 路由栈与布局索引上下文、布局/页面逐层输出 |
| `src/link.tsx` | 链接渲染、目标解析、点击导航与自定义组件 |
| `src/navigate.tsx` | `useNavigate`、声明式导航和重定向 |
| `src/utils.ts` | 路径、位置、匹配、同步状态等基础函数 |
| `index.d.ts` | 对 npm 使用方暴露的公共类型契约 |

## 3. 测试目标

1. 验证 README 描述的主要路由能力在正常、边界和异常输入下是否成立。
2. 验证公共组件、Hook、工具函数及路由树组合行为。
3. 验证不同模式的 URL 副作用、内部栈、事件监听和导航状态。
4. 验证嵌套路由器、动态路由、分组、嵌套布局与元数据等高风险组合。
5. 通过 TypeScript 编译测试保护公开声明，通过双模块冒烟保护发布包入口。
6. 建立可在 CI 中执行的覆盖率门槛，防止未测试代码回归。
7. 将历史 expected-failure 与探索断言全部转为普通回归，并在缺陷复现时直接阻断门禁。

## 4. 测试范围

### 4.1 范围内

- `src` 下所有运行时代码和 `index.d.ts`。
- README 中公开的组件、Hook、路由模式、路径类型和高级用法。
- React DOM 环境下的路由渲染与交互。
- 浏览器 History API、hashchange/popstate 监听及内存栈逻辑。
- 导航目标为字符串、同源 URL、跨源 URL 和历史 delta 的情况。
- CJS/ESM 构建、公开导出、入口文件和基础运行时行为。

### 4.2 范围外或需独立执行

- 真实生产服务器的 history fallback 配置。
- 旧版浏览器兼容性、移动 WebView 兼容性。
- SSR、React Server Components 和 hydration；项目当前未声明这些能力。
- 性能、长时间稳定性和大规模路由树基准。
- npm 发布、权限和 registry 网络可用性；仅执行 `npm pack --dry-run`。
- 第三方依赖漏洞修复；可用 `npm audit` 独立评估。

## 5. 测试策略与方法

| 层级 | 方法 | 重点 |
| --- | --- | --- |
| 静态检查 | TypeScript `noEmit` 编译 | 测试代码、公共类型、泛型元数据、组件属性 |
| 单元测试 | 白盒、等价类、边界值、表驱动 | 路径规范化、拼接、解析、截断、匹配、位置比较 |
| 组件测试 | jsdom + React Testing Library | `Router`、`Routes`、`Outlet`、`Link`、`Navigate` |
| Hook 测试 | 通过测试组件观察输出 | 参数、查询、路由上下文、路由栈、当前路由、路径解析 |
| 模式测试 | 状态转换、事件与副作用 | history/hash/memory、前进后退、替换、越界、事件清理 |
| 集成测试 | 从 URL 到最终 DOM 的端到端组件链 | 动态路由、布局、元数据、深层嵌套、嵌套路由器 |
| 缺陷回归测试 | 普通 Vitest 用例 | DEF-001～012、DEF-016～021、DEF-023（不含 DEF-022）的正确契约；回归时直接失败 |
| 构建与包测试 | `tsc`、`tsc-alias`、Node import/require | CJS/ESM、31 个公开运行时导出、入口存在性 |
| 浏览器端到端 | Playwright + 真实 Chrome/Edge/Firefox | 历史栈、滚动、点击语义、深链、刷新和嵌套路由 |

自动化用例优先断言用户可观察结果，例如 DOM、URL、路由上下文和 History API 调用；只在工具函数和难以触发的内部状态上使用白盒断言。

## 6. 测试环境

本次已验证环境：

| 软件 | 版本 |
| --- | --- |
| Windows | Windows 11 Pro 10.0.26200 x64 |
| Node.js | 24.14.1 |
| npm | 11.19.0 |
| TypeScript | 7.0.2 |
| React / React DOM | 19.2.8 |
| Vitest | 4.1.11 |
| jsdom | 30.0.1 |
| Playwright | 1.58.2 |
| Chrome / Edge / Firefox | 152.0.7977.64 / 152.0.4191.53 / 146.0.1 |

执行前提：

- 从项目根目录执行命令。
- 使用 `npm ci` 按 `package-lock.json` 安装依赖。
- 发布包本身按 `engines.node >=18` 验证；开发测试栈中的 jsdom 30 建议使用 Node 22.22.2、24.15.0 或更新版本。当前 Node 24.14.1 会产生一条 `EBADENGINE` 警告，但本轮所有门禁仍实际通过。
- 首次执行浏览器矩阵前运行 `npm run test:browser:install` 安装 Playwright Firefox；Chrome 与 Edge 使用本机稳定版。
- Playwright 会启动带 history fallback 的本地 Vite 测试服务器，不需要人工打开页面。
- 用例会修改 jsdom 的 `history` 和 `location.hash`；每个用例负责清理，禁止依赖执行顺序。

## 7. 测试目录与用例分布

| 目录或文件 | 普通自动化用例数 | 内容 |
| --- | ---: | --- |
| `test/unit` | 141 | 工具函数、URL/base resolver 与位置对象 |
| `test/components` | 78 | 五个核心组件 |
| `test/hooks` | 54 | 七组公共 Hook，包括 entry 热更新时的 Params 原子替换回归 |
| `test/modes` | 53 | history、hash、memory 模式 |
| `test/integration` | 125 | 动态路由、优先级、滚动、布局、元数据、边界、嵌套路由器 |
| `test/known-issues` | 5 普通回归 | 原 expected-failure 的修复契约 |
| `test/types` | 编译期 | 公共 TypeScript API 正向和反向契约 |
| `test/package-smoke.mjs` | 包级冒烟 | CJS/ESM 与 31 个运行时导出 |
| `test/tarball-consumer-smoke.mjs` | 包级冒烟 | 从真实 tarball 安装并加载 CJS/ESM |
| `test/node-matrix-smoke.mjs` | 8 个入口场景 | Node 18/20/22/24 × CJS/ESM |
| `test/browser` | 36 | 12 个端到端场景 × Chrome/Edge/Firefox |
| `test/vitest.config.mts` | 配置 | jsdom、匹配范围、覆盖率报告和门槛 |
| `test/vitest.setup.ts` | 配置 | jest-dom 断言扩展 |
| `test/tsconfig.json` | 配置 | 测试与类型契约编译配置 |

完整、逐条的运行时用例名称可用下列命令导出：

```bash
npx vitest list -c test/vitest.config.mts
```

## 8. 执行方法

### 8.1 首次准备

```bash
npm ci
```

### 8.2 分层执行

```bash
# 456 项普通回归
npm test

# 测试代码及公共 API 类型契约
npm run test:typecheck

# 回归并生成 test/coverage/index.html
npm run test:coverage

# 清理、双模块构建、根包与临时 tarball 消费者冒烟
npm run test:package

# 类型、覆盖率与当前 Node 包门禁
npm run test:all

# Node 18/20/22/24 的 tarball CJS/ESM 矩阵
npm run test:node-matrix

# 首次安装 Firefox 后，执行 Chrome/Edge/Firefox 矩阵
npm run test:browser:install
npm run test:browser

# 发布前完整门禁（test:all + Node 矩阵 + 浏览器矩阵）
npm run test:release
```

### 8.3 发布内容检查

```bash
npm pack --dry-run --json
```

预期为 21 个文件：`LICENSE`、`README.md`、`package.json`、`index.d.ts`，CJS/ESM 各 8 个 JavaScript 文件，以及 `dist/esm/package.json`。不应包含源码、测试、覆盖率或本地配置。

### 8.4 浏览器自动化测试

```bash
npm run test:browser
```

命令自动启动 Vite、依次运行 Chrome、Edge、Firefox，并在结束时关闭服务器。失败证据写入已忽略的 `test/browser/results`；第 11 节清单已纳入自动化，不再依赖人工操作。

## 9. 自动化测试用例矩阵

下表按功能契约归并 456 项 Vitest 用例及 36 项浏览器用例；同一行通常由多个参数化或边界用例实现。精确断言以对应测试文件为准。

### 9.1 工具函数

| ID | 场景与步骤 | 预期结果 | 自动化位置 |
| --- | --- | --- | --- |
| UT-001 | 向 `isUnset` 输入 `undefined`、`null`、`false`、0、空字符串、对象 | 仅前三类被视为不可渲染 | `unit/utils.guards.test.ts` |
| UT-002 | 混用反斜杠、多重斜杠、首尾斜杠和空字符串 | `unifySlash`、`dropStartSlash`、`dropEndSlash`、`unifyPath` 输出规范路径 | `unit/utils.path.test.ts` |
| UT-003 | 以 0、1、多个参数调用 `joinPath`，覆盖空段、绝对段、完整/协议相对 URL、认证/端口、FTP/file、opaque URL、`.`、`..`、查询和 hash | 协议不被折叠；分层 URL 保留完整 authority；绝对目标覆盖前缀；opaque URL 的相对拼接明确抛错 | `unit/utils.joinPath.test.ts` |
| UT-004 | 解析相对、绝对、父级、仅 query、仅 hash、协议字符串和 URL 对象 | 使用 WHATWG URL 语义；query/hash 不多出斜杠；不修改 URL 对象 | `unit/utils.resolvePath.test.ts` |
| UT-005 | 用字面量字符串、正则、空值、元字符及边界相似前缀截断路径 | 字符串按字面量匹配；显式 RegExp 保持正则语义；不匹配返回 `null` | `unit/utils.truncatePath.test.ts` |
| UT-006 | 分类并匹配静态段、`:param`、`*`、`**`、Unicode、编码斜杠、畸形编码和重复参数 | 编译与匹配共用优先级；全路径匹配；每段只安全解码一次；重复名称转数组 | `unit/utils.matchPath.test.ts` |
| UT-007 | 更新 `useSync` 和 `useSyncState`，使用直接值、函数值和相同值 | ref 同步；函数收到前值；相同值不触发额外渲染 | `integration/edge-cases.test.tsx` |
| UT-008 | 解析 history/hash/memory 的相对、绝对、空引用、同源、跨源、base 内外、Unicode、大小写混合百分号、畸形 `%` 和编码斜杠目标 | Link 与 navigate 共享同一 resolver；外部/越界信息明确；base 逐段规范化且 `%2F` 不跨段 | `unit/location.test.ts` |

### 9.2 路由匹配与渲染组件

| ID | 场景与步骤 | 预期结果 | 自动化位置 |
| --- | --- | --- | --- |
| RT-001 | 根路径与多级静态路径匹配 | 渲染对应叶页面 | `components/Routes.test.tsx` |
| RT-002 | 匹配 `:id`、多参数及重复参数 | 页面渲染且 `params` 正确 | `components/Routes.test.tsx`、`integration/dynamic-routes.test.tsx` |
| RT-003 | 用 `*` 匹配一段，再用多段路径反向验证 | 单段成功，多段失败 | 同上 |
| RT-004 | 用 `**` 匹配一段和多段剩余路径 | 两者均匹配 | 同上 |
| RT-005 | 路径经过 `#group` 节点 | URL 不含组名，但路由栈保留该节点 | `components/Routes.test.tsx`、`hooks/useRouteStack.test.tsx` |
| RT-006 | 未匹配、路径位于 base 外、空路由树以及嵌套 Router 未匹配 | 渲染 `notFound` 或空内容；`pathname` 为 `null` 时不误匹配；未匹配分支提供空 route/layout stack 和索引 0 | `components/Router.test.tsx`、`components/Routes.test.tsx`、`integration/nested-router.test.tsx` |
| RT-007 | 将 static、`:param`、`*`、`**` 按全部兄弟排列顺序声明 | 始终按 static > param > `*` > `**` 匹配，与对象顺序无关 | `integration/route-priority.test.tsx` |
| RT-008 | pathname 不变时运行中更换 `entry` 属性 | 路由映射重建，routeStack 与全新 Params 由同一次纯匹配原子产生；父 Router Context 不被突变 | `components/Routes.test.tsx`、`hooks/useParams.test.tsx` |
| OUT-001 | 叶节点只有 page、同时有 layout/page、只有 layout | 按布局索引渲染正确节点 | `components/Outlet.test.tsx` |
| OUT-002 | 三层布局逐级放置 `Outlet` | DOM 层级与路由层级一致，最终页面只在最内层 | `components/Outlet.test.tsx`、`integration/nested-layouts.test.tsx` |
| OUT-003 | 布局不渲染 `Outlet` | 子布局和页面不可见 | `integration/nested-layouts.test.tsx` |
| OUT-004 | 路由栈为空或布局索引超出栈长度 | `Outlet` 输出为空且不抛异常 | `components/Outlet.test.tsx` |
| RTR-001 | 不传 mode/base，再分别传三种模式和不同 base 形式 | 默认 history/`/`；base 统一首尾斜杠 | `components/Router.test.tsx` |
| RTR-002 | 导航到动态路由后再到静态路由 | 参数装填后被清空，不泄漏到下一页 | `components/Router.test.tsx` |
| RTR-003 | 调用 `setState`、`replace` 并传状态和滚动选项 | Context 状态更新；History API 参数正确 | `components/Router.test.tsx` |

### 9.3 Link、Navigate 与 Hook

| ID | 场景与步骤 | 预期结果 | 自动化位置 |
| --- | --- | --- | --- |
| NAV-001 | 默认和自定义 `component` 渲染 Link | 默认 `<a>`；自定义为 `<button>`；href 按模式解析 | `components/Link.test.tsx` |
| NAV-002 | 普通、Ctrl/Meta/Shift/Alt、中键、target、download、rel external、外链及越界 base 点击 | 仅无修饰左键同窗口站内链接由 SPA 接管，其余保留原生行为 | `components/Link.test.tsx`、`browser/router.browser.spec.ts` |
| NAV-003 | Link 传 `replace`、`state`、`scrollRestore` 和用户 `onClick`/`preventDefault` | 用户回调先执行；取消后无导航；未取消时完整转发选项 | `components/Link.test.tsx` |
| NAV-004 | 在 StrictMode 挂载/重渲染 `Navigate`，再改变目标，覆盖 to、delta、0 和选项 | 同一挂载/目标只导航一次；目标变化可再次导航；组件不输出 DOM | `components/Navigate.test.tsx`、`browser/router.browser.spec.ts` |
| NAV-005 | 挂载 `Redirect` | 等价于 `Navigate replace`，其余选项保留 | `components/Navigate.test.tsx` |
| HK-001 | 调用 `useRouter` | 返回 mode/base/location/pathname/params/state 及全部导航方法 | `hooks/useRouter.test.tsx` |
| HK-002 | 调用 `useNavigate`，执行普通、替换、函数式 state、delta、同源/跨源/越界 base URL | 正常目标生效；跨源与越界目标抛出清晰错误 | `hooks/useNavigate.test.tsx` |
| HK-003 | 静态、动态、编码、多参数、重复参数、通配符及 entry 动态→静态/参数改名/notFound/ReactNode 复用/StrictMode 调用 `useParams` | 返回已安全解码且只属于当前匹配的 `Params`；重复名称为数组；静态和未匹配路由为空对象；`useRouter().params` 与 `useParams()` 一致 | `hooks/useParams.test.tsx` |
| HK-004 | 有/无/多查询参数并比较 `useQuery` | 正确读取 `URLSearchParams`；别名结果一致 | `hooks/useSearchParams.test.tsx` |
| HK-005 | history/hash、base、相对、父级、空字符串、`undefined`、query/hash-only、绝对、同源/跨源 URL 调用 `useResolvePath` | 返回对应模式及 base 可用的标准 href；空字符串按当前路径引用解析，`undefined` 保持无目标语义 | `hooks/useResolvePath.test.tsx`、`components/Link.test.tsx` |
| HK-006 | 根、嵌套、分组路径读取 route stack/layout stack/index | 栈顺序为根到叶，布局过滤和索引正确 | `hooks/useRouteStack.test.tsx`、`integration/nested-layouts.test.tsx` |
| HK-007 | 在布局和页面中读取 `useCurrentRoute` | 返回当前布局深度对应节点并保留元数据 | `hooks/useCurrentRoute.test.tsx` |

### 9.4 三种路由模式

| ID | 场景与步骤 | 预期结果 | 自动化位置 |
| --- | --- | --- | --- |
| HIS-001 | history 模式 push/replace，传 state | 调用对应 History API 并使用解析后 URL | `modes/history.test.tsx` |
| HIS-002 | 新导航设置 `scrollRestore:false`，再验证默认值与 traversal | commit 后显式滚到顶部；默认/回退不主动滚动；不修改全局 `history.scrollRestoration` | `integration/scroll-restoration.test.tsx`、浏览器用例 |
| HIS-003 | 调用 back/forward/delta | 使用浏览器 History API | 同上、`hooks/useNavigate.test.tsx` |
| HIS-004 | 初始 state、连续函数式 setState、push/replace、popstate、不可克隆对象、多个 Router 与卸载 | state 与历史项绑定；函数式更新在同一批次串联；写入失败不污染 React state；browser store 广播且全局监听器正确清理 | `modes/history.test.tsx`、`integration/nested-router.test.tsx` |
| HASH-001 | 空 hash 和初始 `#/users` 挂载 | 空值按 `/`；已有 hash 成为匹配路径 | `modes/hash.test.tsx` |
| HASH-002 | 连续 push、replace、back、forward、delta 与 state | 以原生浏览器历史为唯一来源；replace 保留早期条目；逐项恢复 URL/state | 同上、浏览器用例 |
| HASH-003 | 挂载、卸载一个或多个 hash 路由器，并依次触发同一快照的 popstate/hashchange | 全部 Router 共享一个 popstate 和一个 hashchange 监听器；重复事件不重复发布；末个订阅者卸载时清理 | 同上 |
| HASH-004 | `base="/app"` 下绝对、相对、query/hash 与 URL 对象导航 | 外部 hash 始终包含 base，内部 pathname 正确截断 | 同上、`known-issues`、浏览器用例 |
| MEM-001 | memory 模式执行 pathname/query/hash 导航、state 与 replace | 内部 location/页面更新；不调用浏览器 History API，不改变浏览器 URL | `modes/memory.test.tsx`、浏览器用例 |
| MEM-002 | memory 模式执行 delta、back、forward、0 和越界 | 使用私有 `{entries,index}`；逐条恢复 location/state；越界不变 | 同上 |
| MEM-003 | 挂载 memory 路由器 | 不注册 popstate/hashchange | 同上 |
| MEM-004 | 浏览器 URL 原本带 pathname/query/hash 时挂载并导航 | memory 始终从内部 `/` 启动，完全忽略外部地址 | `integration/edge-cases.test.tsx`、`known-issues/documented-contract.regression.test.tsx` |

### 9.5 集成、类型与包

| ID | 场景与步骤 | 预期结果 | 自动化位置 |
| --- | --- | --- | --- |
| INT-001 | `/users/:id/posts/:postId` 等多层动态路由 | 参数沿完整链正确读取 | `integration/dynamic-routes.test.tsx` |
| INT-002 | 根布局、仪表盘布局、设置布局、动态 tab 页面 | 布局顺序、DOM 包含关系、当前路由和索引均正确 | `integration/nested-layouts.test.tsx` |
| INT-003 | 中间节点无 layout/page，仅叶节点有 page | 中间节点不阻断子路由 | 同上 |
| INT-004 | 深层路径、空树、false/null page、快速连续导航、卸载重挂载 | 无崩溃、无陈旧页面、最后一次导航生效 | `integration/edge-cases.test.tsx` |
| INT-005 | `RouteItem<T>` 带 title/roles/id/level | 元数据贯穿当前路由、完整栈和布局栈 | `integration/custom-metadata.test.tsx` |
| INT-006 | history/hash 下挂载带独立 base 的父子 Router，再验证父→子、子→父、replace、state、traversal、同级 Router 和 memory 隔离 | 所有 browser Router 从共享 store 同步并各自截断 base；memory 保持私有；无需父级回调 | `integration/nested-router.test.tsx`、三浏览器 |
| INT-007 | 静态/动态兄弟全排列、`**` 静态后缀、分组、编码静态路径与重复分组 | 优先级确定且声明顺序不影响结果；更具体的 catch-all 后缀优先 | `integration/route-priority.test.tsx` |
| INT-008 | history/hash/memory 下分别执行滚动重置与默认导航 | 三种模式行为一致，commit 后一次重置且全局策略不变 | `integration/scroll-restoration.test.tsx` |
| TYPE-001 | 正确使用 RouteItem 泛型、三种 Link 形态、Navigate、Params | `tsc` 无错误 | `types/public-api.typecheck.tsx` |
| TYPE-002 | 验证 nullable 返回值、重复参数、函数式 setter，并反向使用非法 mode/缺失元数据 | 声明与运行时一致；`@ts-expect-error` 必须命中 | 同上 |
| PKG-001 | 顺序重新构建 CJS/ESM | 两套产物编译成功；ESM 相对引用经 alias 处理并含内层 `type:module` 边界 | `npm run test:package` |
| PKG-002 | 分别 import/require 本包并枚举公开 API | 31 个运行时导出均存在，基础工具行为一致 | `test/package-smoke.mjs` |
| PKG-003 | 检查 `main`、`module`、`types` | 三个入口文件均存在 | 同上 |
| PKG-004 | pack 后在临时消费者安装 tarball | 安装后的 ESM 边界存在，真实 ESM/CJS 消费均成功 | `test/tarball-consumer-smoke.mjs` |
| PKG-005 | 以 Node 18/20/22/24 分别加载临时消费者中的 tarball | 8 个 CJS/ESM 场景均有 31 个导出，无模块类型警告 | `test/node-matrix-smoke.mjs` |

## 10. 修复缺陷与回归映射

原有 5 个 `it.fails` 已全部改为普通 `it`，文件更名为 `documented-contract.regression.test.tsx`。下面所有范围内缺陷都有独立回归，不再允许 expected-failure 掩盖产品偏差。

| 报告缺陷 | 严重度 | 落地结果 | 主要回归 |
| --- | --- | --- | --- |
| DEF-001 / KNOWN-001 | P0 | memory 使用私有 entries/index/location/state 模型，导航切页且不触碰浏览器地址 | memory、known-issues、浏览器 |
| DEF-002 / KNOWN-002 | P0 | 路由预编译并按 static > param > `*` > `**` 确定排序，兄弟状态不泄漏 | route-priority 全排列 |
| DEF-003 / KNOWN-003 | P1 | hash 直接以原生 History API 为权威，replace 仅替换当前浏览器项 | hash、known-issues、浏览器 |
| DEF-004 / KNOWN-004 | P1 | history/hash/memory 与 Link 共用 base-aware resolver | location、hash、useResolvePath、浏览器 |
| DEF-005 / KNOWN-005 | P1 | 静态路由和字符串 base 按分段字面量匹配，显式 RegExp 单独处理 | matchPath、truncatePath、Router、known-issues |
| DEF-006 | P1 | Link 先执行用户回调，仅接管未取消、无修饰左键、同窗口、站内且 base 内的点击 | Link、Chrome/Edge/Firefox |
| DEF-007 | P1 | state 与每个历史条目绑定；初始化/popstate/前进后退同步；函数式 setter 先求值后写入 | history、hash、memory、浏览器 |
| DEF-008 | P1 | `joinPath`/`resolvePath` 与共享导航 resolver 使用 URL 组件语义 | URL 工具、useResolvePath、浏览器 |
| DEF-009 | P1 | Navigate 以稳定 intent key 去重，同目标重渲染/StrictMode 幂等，目标变化可重新导航 | Navigate、浏览器 |
| DEF-010 | P1 | 构建时生成 `dist/esm/package.json`；构建顺序确定；声明 Node `>=18` | tarball consumer、Node 18/20/22/24 矩阵 |
| DEF-011 | P2 | `Params`、nullable Outlet/Navigate/current route 与函数式 setter 声明对齐运行时 | public API typecheck |
| DEF-012 | P2 | 参数逐段安全解码一次；编码斜杠不破坏分段；畸形编码按原文保留 | matchPath、useParams、真实浏览器 Unicode 深链 |
| DEF-016 | P2 | `scrollRestore:false` 在 commit 后滚到顶部；默认/遍历不主动重置；不修改全局策略 | scroll-restoration、三浏览器 |
| DEF-017 | P1 | 建立模块级 browser-location store；所有 history/hash Router 通过 `useSyncExternalStore` 订阅，库内导航与浏览器 traversal 统一发布，监听器按订阅数去重 | nested-router、history/hash、三浏览器父级导航与回退 |
| DEF-018 | P2 | `joinPath` 以完整 URL 为相对解析基准，保留 username/password/host/port；覆盖 HTTP(S)、FTP、file，并明确拒绝 opaque URL 的相对拼接 | utils.joinPath |
| DEF-019 | P2 | base 与 pathname 使用同一逐段规范化；百分号十六进制大小写等价，Unicode/畸形 `%` 可比较，`%2F` 不跨段 | location、Router history/hash |
| DEF-020 | P2 | `Routes` 无论匹配与否都建立自己的 RouteStack 与布局索引边界；notFound 使用空栈和索引 0 | Routes、nested-router notFound |
| DEF-021 | P3 | `undefined` 与空字符串目标分离；空字符串通过共享 resolver 按当前路径引用处理 | location、useResolvePath、Link |
| DEF-023 | P2 | 路由编译与匹配保持纯计算；每次 entry/pathname 匹配原子返回 routeStack 与全新 Params，并由 `Routes` 内层 RouterContext 同步提供 | Routes 父 Context 不可变、useParams entry 热更新五类回归、StrictMode |

DEF-014（旧开发依赖漏洞）和 DEF-015（旧包链接）在当前基线继续不复现，因此无需新增产品修改；其复核结果会记录在本轮测试报告。DEF-013、DEF-022 按用户指定排除在本轮修复范围之外；本文不对其状态作修复认定，也没有通过修改这两项来换取门禁通过。

## 11. 真实浏览器自动化清单

以下 12 个场景由 `test/browser/router.browser.spec.ts` 在三个浏览器项目中重复执行，共 36 项。

| ID | 前置条件与步骤 | 预期结果 | 当前结果 |
| --- | --- | --- | --- |
| MAN-001 | history 模式直接打开动态深层 URL 并刷新 | 页面保持正确；Vite history fallback 不返回 404 | PASS × 3 |
| MAN-002 | 连续导航后使用浏览器后退/前进 | URL、页面、参数和 state 与历史项一致 | PASS × 3 |
| MAN-003 | hash 模式直接输入深层 hash、刷新，再验证 push/replace/back/forward | 无服务器路径 fallback 也能恢复页面，replace 保留早期项 | PASS × 3 |
| MAN-004 | Link 普通、修饰键、中键、取消、`target=_blank`、download、外部/越界目标 | 仅普通站内点击单页导航；其余保持原生语义 | PASS × 3 |
| MAN-005 | 在长页面设置滚动位置，以 `scrollRestore` true/false 导航并返回 | false 在 commit 后重置；默认不主动调用；全局策略不变 | PASS × 3 |
| MAN-006 | 访问中文、空格编码、查询、hash、query/hash-only 相对目标 | 页面、解码参数、查询和生成 href 正确，无双重编码 | PASS × 3 |
| MAN-007 | 嵌套 Router 子路由直接打开并导航到同级 | 地址栏、父 Router、子 Router 和 DOM 同步 | PASS × 3 |
| MAN-008 | React StrictMode 下挂载 Navigate | 只新增一个历史项，不产生循环 | PASS × 3 |
| MAN-009 | Tab 聚焦默认 Link，以 Enter 激活；聚焦 button 形态并以 Space 激活 | 元素语义正确，焦点轮廓可见 | PASS × 3 |
| MAN-010 | history 父 Router 导航到子 Router 的同级页面，再执行浏览器后退 | 子 Router 立即同步页面；回退恢复父子 URL 与 DOM | PASS × 3 |
| MAN-011 | hash 父 Router 导航到子 Router 的同级页面，再执行浏览器后退 | 子 Router 立即同步页面且保留 base；回退恢复父子 URL 与 DOM | PASS × 3 |
| MAN-012 | Chrome、Edge、Firefox 执行相同完整套件 | 三个浏览器结果一致 | PASS（36/36） |

## 12. 验收标准

### 12.1 测试交付物验收

- `npm ci` 成功，依赖与锁文件一致。
- `npm run test:typecheck` 退出码为 0。
- 456 项 Vitest 用例全部通过，无 expected-failure、`skip`、`todo` 或意外失败。
- 覆盖率不低于：语句 100%、分支 99%、函数 100%、行 100%。
- `npm run test:package` 成功，根包与临时 tarball 消费者的 CJS/ESM 均可加载，31 个公开运行时导出完整。
- Node 18/20/22/24 的 CJS/ESM tarball 矩阵全部通过且无模块类型警告。
- Chrome、Edge、Firefox 的 36 项浏览器用例全部通过。
- `npm pack --dry-run --json` 的文件清单符合第 8.3 节。
- 测试计划、用例、配置和执行命令均位于 `test` 目录或 `package.json` 中并可复现。

### 12.2 产品发布验收

- 5 项 KNOWN 用例已移除 `it.fails` 并作为普通用例通过。
- 本轮范围内不存在未修复的 P0/P1 缺陷。
- 第 11 节适用的真实浏览器场景全部通过。
- README、运行时行为与 `index.d.ts` 保持一致。
- 构建和发布内容检查通过；DEF-013、DEF-022 由独立流程评估或豁免。

当前结论：DEF-001～012、DEF-016～021、DEF-023（不含 DEF-022）的修复范围验收通过，DEF-014/015 在当前基线不再复现；类型、覆盖率、构建、真实 tarball、Node 矩阵和三浏览器矩阵均通过。整体发布决策仍须单独处理本轮明确排除的 DEF-013、DEF-022，不能用本结论替代其风险评估。

## 13. 测试结果记录

本次基线结果：

```text
Test Files  30 passed (30)
Tests       456 passed (456)
Statements  100% (494/494)
Branches    99.71% (349/350)
Functions   100% (98/98)
Lines       100% (484/484)
Typecheck   passed
CJS build   passed
ESM build   passed
Package     31 public runtime exports + tarball consumer passed
Node matrix Node 18/20/22/24 × CJS/ESM passed (8/8)
Browsers    Chrome/Edge/Firefox passed (36/36)
Pack dry-run passed (21 files)
```

覆盖率 HTML 报告由 `npm run test:coverage` 生成在 `test/coverage/index.html`，该目录已加入 `.gitignore`，不作为源码提交。

唯一未覆盖分支是 `src/router.tsx` 对“不存在 `window.scrollTo`”的防御判断。jsdom 与三个真实浏览器均提供该函数，测试没有为了数字伪造不真实的浏览器环境，因此分支门槛保持 99%。

## 14. 缺陷修复后的回归流程

1. 先单独运行缺陷对应的普通回归并确认修复。
2. 补充必要的边界、反向、类型或浏览器用例，禁止新增 `it.fails` 作为长期豁免。
3. 执行 `npm run test:release`。
4. 检查 `npm pack --dry-run --json` 的 21 项发布清单。
5. 更新本文件中的缺陷映射、用例数量、结果记录和验收结论。

## 15. 交付物

- 30 个 Vitest 测试文件，共 456 个普通运行时场景；无 expected-failure。
- `test/browser` 的 Playwright 测试页、配置与 36 项三浏览器执行场景。
- `test/types/public-api.typecheck.tsx` 公共类型契约。
- `test/package-smoke.mjs`、`test/tarball-consumer-smoke.mjs` 与 `test/node-matrix-smoke.mjs` 双模块发布包门禁。
- `test/vitest.config.mts` 覆盖率门槛和报告配置。
- `test/tsconfig.json` 测试类型检查配置。
- `test/TEST_PLAN.md` 本测试计划与执行说明。
- `package.json` 中的 `test`、类型、覆盖率、包、Node 矩阵、浏览器及 `test:release` 命令。
- `package-lock.json` 中固定的覆盖率工具依赖。
