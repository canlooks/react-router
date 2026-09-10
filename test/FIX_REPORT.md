# D-01～D-24 修复与复测报告

2026-09-10，Asia/Shanghai。版本保持 `@canlooks/react-router@2.0.9`，基于 `4fff00c` 的工作区修复，尚未创建 Git 提交。

按 [FIX_PLAN](reports/20260910-123716/FIX_PLAN.md) 实施的 24 类既有自动化缺陷均已修复。原 232 项通过行为保持通过，原 45 项失败全部转绿，新增 66 项边界回归，最终 343 / 343 通过。完整发布验收仍需完成下文列明的浏览器及部署项目。

## 实现与逐项追踪

产品修改限于四个现有源码文件和公开声明，没有增加依赖、改变版本或重构路由架构。保留工作区原有 package/lockfile 修改、暂存删除及测试重整；没有执行整库暂存、回退、提交、发布或部署。

下表回归数量来自本轮无过滤结果；同一测试可以关联多个 D 编号，不能相加得到总数。全部条目状态为“本轮自动化范围已修复”，各项回归所在的 `test:regressions` 和 `npm test` 退出码均为 0。

| 编号 | 实现位置及修复内容 | 关联回归通过数 | 浏览器 / 适用边界 |
| --- | --- | ---: | --- |
| D-01 | `router.tsx`：memory 从当前局部记录生成 location，push/delta 同步页面和 state | 5 | memory 完整旅程通过 |
| D-02 | `router.tsx`：每个 memory 实例从配置 base 下的独立根开始 | 2 | 不读取宿主 hash；双实例自动化 |
| D-03 | `router.tsx`：memory 初始化、URL 解析、方法及事件完全隔离浏览器全局 | 4 | Node 根页 SSR 和方法实际调用通过 |
| D-04 | `router.tsx`：replace 原位覆盖；hash 原生 replace 保留外层 URL/state，主动同步父层 | 6 | 原生长度不增加；局部前后记录保留；原生 traversal 范围见下文 |
| D-05 | `router.tsx`、`link.tsx`：按输入类别应用 base，对齐 href 和实际导航 | 11 | hash `/app` Link 浏览器通过；三模式两种 base 自动化 |
| D-06 | `router.tsx`：history 初始/popstate/父层通知同步 native state，包含同 URL 变化 | 4 | 原生 back/forward 和刷新恢复不同 state |
| D-07 | `router.tsx`：函数 action 计算一次，原生写成功后提交；失败不改变局部状态 | 3 | updater 通过；不可克隆结果正确报错并保持原状态 |
| D-08 | `routes.tsx`：每个子节点独立计算动态标记，仍继承动态祖先 | 4 | 分组/动态顺序由自动化断言；静态页浏览器冒烟 |
| D-09 | `routes.tsx`：每次重新匹配开始清空现有 params 对象 | 5 | 同 URL 换 entry、独立 Routes、404；query/state-only 保参 |
| D-10 | `utils.ts`：分离 pathname 和后缀，按 URL 相对解析保留目录/query/根边界 | 24 | 普通冒号段仍按路径；不解码匹配参数 |
| D-11 | `utils.ts`：修正 query 分隔符 `?`，保留字面量 `$` | 2 | 原 joinPath 拼接语义保持 |
| D-12 | `utils.ts`：字符串 base 字面量比较；显式正则保留转义/flags/lastIndex | 9 | 不扩展 Router base 为正则或协议地址 |
| D-13 | `utils.ts`：逐段编译匹配表达式，静态正则元字符转义 | 9 | 不引入任意正则路由语法 |
| D-14 | `utils.ts`：catch-all 与完整路径段边界绑定 | 2 | 根、空余段及相似前缀自动化；多段浏览器冒烟 |
| D-15 | `utils.ts`：第三次及后续同名参数追加到数组 | 4 | 命名参数与 `*` 的 2～4 次捕获 |
| D-16 | `utils.ts`：单 URL 的 joinPath 保留协议/authority/query/hash | 2 | 只规范化 URL 的 pathname |
| D-17 | `router.tsx`：在斜杠处理前识别绝对字符串，校验/写入后再提交和设置滚动策略 | 14 | 同源 URL 不重复补 base；异常、跨源字符串无局部副作用 |
| D-18 | `router.tsx`：hash/memory 的 URL/state 属于各自历史项，setState 更新当前项 | 5 | Router API 往返通过；原生 hash state 恢复仍未实现 |
| D-19 | `router.tsx`：mode 切换重置来源与局部栈，订阅按 mode 成对清理，回调读取最新逻辑 | 2 | 同实例及 StrictMode 自动化；不以测试台重建替代 |
| D-20 | `link.tsx`：修饰键和非主按钮交给原生行为 | 5 | 已做内置浏览器点击；完整平台矩阵待验 |
| D-21 | `link.tsx`：用户 onClick 后先检查取消，包含 delta 分支 | 2 | 浏览器取消链接保持原页 |
| D-22 | `link.tsx`：按实际锚点 target/download 决定拦截 | 8 | 自动化通过；新标签和下载最终结果在当前工具受阻 |
| D-23 | `index.d.ts`：useParams 返回 Params；消费者正确收窄联合类型 | 1 | 包名消费通过；保留原7个负例，新增未收窄负例 |
| D-24 | `index.d.ts`：补 Routes、三个 Context 值、isStartWithProtocol | 1 | JSX/Provider/useContext/boolean 实际消费及3个 Provider 负例通过 |

回归源码：[路径](regressions/path-contracts.test.ts)、[路由和状态](regressions/router-contracts.test.tsx)、[Node memory](regressions/memory-server.test.tsx)、[Link](regressions/link-contracts.test.tsx)、[声明](regressions/declarations.test.ts)。全部展开名称和结果见 [CASE_CATALOG](CASE_CATALOG.md)。

## 自动化与打包结果

| 检查 | 结果 | 退出码 |
| --- | --- | ---: |
| `npm run test:types` | 源码、测试、测试台及全部消费者；skipLibCheck=false；11 个类型负例有效 | 0 |
| `npm run test:baseline` | 10 文件，232 / 232 | 0 |
| `npm run test:regressions` | 5 文件，111 / 111 | 0 |
| `npm test` | 15 文件，343 / 343；0 失败，0 跳过 | 0 |
| `npm run test:coverage` | 343 / 343；statements 100%、lines 100%、functions 100%、branches 99.2% | 0 |
| `npm run test:catalog` | 从上述无过滤全量报告生成；含24个编号通过/失败统计 | 0 |
| 修复前结果逐名审计 | 277 原用例均存在并通过；232 保持，45 修复，66 新增 | 0 |
| `npm run build`、独立 ESM/CJS 编译、`build:alias` | 隔离源码副本，使用当前已安装依赖；每个编译进程独立核对 | 均为0 |
| `npm pack --dry-run`、`npm pack` | 18 个包文件，包含 ESM/CJS/声明，无 test；包含最终 README | 均为0 |
| 独立 React 19 消费者 | 从最终 tarball 离线安装；原生 import/require 渲染 memory Router/Link、重复参数断言、完整消费者类型检查 | 均为0 |

覆盖率计数为 statements 337/337、lines 324/324、functions 67/67、branches 248/250。门限仍为 95/95/95/90。两个未覆盖分支为既有协议 base 判断和裸 `**`（无首斜杠）的工具分支，没有为填满计数增加虚假 mock。

修复证据见 [RESULTS](reports/20260910-132525-fixed/RESULTS.md)，含原始 JSON/JUnit、日志、完整覆盖率、源码 SHA256、浏览器状态/截图、包清单和消费脚本。生成目录仍由 `test/.gitignore` 忽略；需要移交证据时应单独打包。修复前目录未覆盖。

## 浏览器结论和剩余发布门禁

内置浏览器已通过 memory 的 push/back/replace/forward 整段旅程；history 的函数 updater、同 URL 原生 state 往返和刷新；hash 的 base、replace 长度、Router 方法恢复 state；普通 Enter 激活、布局状态、取消点击及静态/通配/分组重定向/404 冒烟。

按 FIX_PLAN 4.6 保留 hash 局部历史契约：原生后退从 `/users/1` 到 `/about` 会更新页面，但 state 仍是后一项的 `{nativeStep:2}`。MAN-06/09 的原生 hash 逐记录 state 恢复范围扩展验收未通过，不能用24类自动化缺陷关闭替代。原生记录身份、宿主 state 兼容与局部游标统一仍需单独设计。

内置浏览器的 `_blank` 未呈现新标签，下载未发出可观察的 download 事件，因此 MAN-11 仅确认取消有效、原页未被拦截导航，最终新页/下载结果受阻。Windows Meta 点击出现当前页原生导航，不能推断 macOS Meta 行为。完整浏览器矩阵、真实滚动、性能基准、目标 CI 干净安装及实际部署仍待验收。具体步骤和历史结果保留于 [TEST_PLAN](TEST_PLAN.md) 第6～8节。

README 已同步独立 memory、相对路径/base、局部与原生历史差异、state、Link、Params 和新增声明。滚动说明明确 `scrollRestore` 控制 auto/manual，不承诺自动 `scrollTo(0,0)`。
