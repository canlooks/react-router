# 自动化用例清单与执行快照

执行时间（UTC）：2026-09-12T13:42:42.250Z；源码基准提交：`9853df7`；包含工作区未提交的修复。

共 17 个文件、403 个用例；通过 403，失败 0，其他状态 0。

这是最近一次全量执行的快照，不能代替后续复测。失败为普通断言失败，绝非预期失败反转。

测试方法、分组步骤、验收标准与缺陷说明见 [TEST_PLAN.md](TEST_PLAN.md)。参数化用例的具体输入和期望已展开在名称中；更完整的前提和断言请打开对应源文件。

先执行无过滤条件的 `npm test`，再运行 `npm run test:catalog` 更新本文件。

## components/navigation.test.tsx

[查看测试代码](components/navigation.test.tsx)

| 用例（完整执行名称） | 结果 |
| --- | --- |
| C-LINK presentation and navigation intent C-LINK-01 renders href, content, accessible attributes and forwards ref | 通过 |
| C-LINK presentation and navigation intent C-LINK-02 ordinary click prevents browser navigation and forwards navigation options | 通过 |
| C-LINK presentation and navigation intent C-LINK-03 Ctrl-click leaves default browser handling intact | 通过 |
| C-LINK presentation and navigation intent C-LINK-04 delta=-1 takes precedence over to and omits href | 通过 |
| C-LINK presentation and navigation intent C-LINK-04 delta=0 takes precedence over to and omits href | 通过 |
| C-LINK presentation and navigation intent C-LINK-04 delta=2 takes precedence over to and omits href | 通过 |
| C-LINK presentation and navigation intent C-LINK-05 absent to calls user handler but does not navigate | 通过 |
| C-LINK presentation and navigation intent C-LINK-06 supports a button and a custom component | 通过 |
| C-LINK presentation and navigation intent C-LINK-07 performs a real Router transition from click to rendered destination | 通过 |
| C-NAVIGATE and C-REDIRECT effect navigation C-NAVIGATE-01 renders no DOM and forwards destination/options on mount | 通过 |
| C-NAVIGATE and C-REDIRECT effect navigation C-NAVIGATE-02 delta=-1 takes precedence | 通过 |
| C-NAVIGATE and C-REDIRECT effect navigation C-NAVIGATE-02 delta=0 takes precedence | 通过 |
| C-NAVIGATE and C-REDIRECT effect navigation C-NAVIGATE-02 delta=2 takes precedence | 通过 |
| C-NAVIGATE and C-REDIRECT effect navigation C-NAVIGATE-03 no destination means no navigation | 通过 |
| C-NAVIGATE and C-REDIRECT effect navigation C-NAVIGATE-04 changed destination navigates on the next render | 通过 |
| C-NAVIGATE and C-REDIRECT effect navigation C-REDIRECT-01 Redirect always supplies replace=true | 通过 |
| C-NAVIGATE and C-REDIRECT effect navigation C-REDIRECT-02 a route redirect replaces the current URL and renders its destination | 通过 |

## components/outlet-hooks.test.tsx

[查看测试代码](components/outlet-hooks.test.tsx)

| 用例（完整执行名称） | 结果 |
| --- | --- |
| C-OUTLET nested rendering and route metadata hooks C-OUTLET-01 preserves layout nesting, full stack, filtered stack and per-level metadata | 通过 |
| C-OUTLET nested rendering and route metadata hooks C-OUTLET-02 useOutlet renders the child and a leaf Outlet renders no further content | 通过 |
| C-OUTLET nested rendering and route metadata hooks C-OUTLET-03 a layout must provide Outlet for its page to appear | 通过 |
| C-OUTLET nested rendering and route metadata hooks C-OUTLET-04 an unset leaf layout (undefined) still renders its page and current route | 通过 |
| C-OUTLET nested rendering and route metadata hooks C-OUTLET-04 an unset leaf layout (null) still renders its page and current route | 通过 |
| C-OUTLET nested rendering and route metadata hooks C-OUTLET-04 an unset leaf layout (false) still renders its page and current route | 通过 |
| H-QUERY and H-PARAM reactive URL hooks H-QUERY-01 exposes decoded, repeated, empty and missing query values; useQuery is equivalent | 通过 |
| H-QUERY and H-PARAM reactive URL hooks H-PARAM-01 navigation refreshes params and query, then clears params on static and unmatched routes | 通过 |
| H-QUERY and H-PARAM reactive URL hooks H-QUERY-02 changing only query rerenders hooks without losing dynamic params | 通过 |
| H-QUERY and H-PARAM reactive URL hooks H-QUERY-03 mutating returned search params does not silently change the URL | 通过 |
| H-RESOLVE link destination hooks H-RESOLVE-01 history /app/users/42 + /app + /about -> /app/about | 通过 |
| H-RESOLVE link destination hooks H-RESOLVE-01 history /app/users/42 + /app + 43 -> /app/users/43 | 通过 |
| H-RESOLVE link destination hooks H-RESOLVE-01 history /app/users/42 + /app + ../about -> /app/about | 通过 |
| H-RESOLVE link destination hooks H-RESOLVE-01 hash /#/users/42 + / + /about -> #/about | 通过 |
| H-RESOLVE link destination hooks H-RESOLVE-01 hash /#/users/42 + / + 43 -> #/users/43 | 通过 |
| H-RESOLVE link destination hooks H-RESOLVE-01 memory / + / + /about -> #/about | 通过 |
| H-RESOLVE link destination hooks H-RESOLVE-02 absent destination undefined produces an empty href | 通过 |
| H-RESOLVE link destination hooks H-RESOLVE-02 absent destination  produces an empty href | 通过 |

## components/routes.test.tsx

[查看测试代码](components/routes.test.tsx)

| 用例（完整执行名称） | 结果 |
| --- | --- |
| C-ROUTES tree matching and not-found rendering C-ROUTES-01 / renders Home | 通过 |
| C-ROUTES tree matching and not-found rendering C-ROUTES-01 /about renders About | 通过 |
| C-ROUTES tree matching and not-found rendering C-ROUTES-01 /about/ renders About | 通过 |
| C-ROUTES tree matching and not-found rendering C-ROUTES-01 /about// renders About | 通过 |
| C-ROUTES tree matching and not-found rendering C-ROUTES-01 /about?q=1#part renders About | 通过 |
| C-ROUTES tree matching and not-found rendering C-ROUTES-01 /About renders Missing | 通过 |
| C-ROUTES tree matching and not-found rendering C-ROUTES-01 /about/extra renders Missing | 通过 |
| C-ROUTES tree matching and not-found rendering C-ROUTES-02 root page is replaced by the deepest matched child page | 通过 |
| C-ROUTES tree matching and not-found rendering C-ROUTES-03 page=undefined is not a route endpoint | 通过 |
| C-ROUTES tree matching and not-found rendering C-ROUTES-03 page=null is not a route endpoint | 通过 |
| C-ROUTES tree matching and not-found rendering C-ROUTES-03 page=false is not a route endpoint | 通过 |
| C-ROUTES tree matching and not-found rendering C-ROUTES-04 page=0 is a valid matched endpoint | 通过 |
| C-ROUTES tree matching and not-found rendering C-ROUTES-04 page="" is a valid matched endpoint | 通过 |
| C-ROUTES tree matching and not-found rendering C-ROUTES-05 layout-only parents still wrap a matched descendant | 通过 |
| C-ROUTES tree matching and not-found rendering C-ROUTES-06 exact routes beat dynamic routes when declared first | 通过 |
| C-ROUTES tree matching and not-found rendering C-ROUTES-07 wildcard fallback: /files -> Catch-all | 通过 |
| C-ROUTES tree matching and not-found rendering C-ROUTES-07 wildcard fallback: /files/a/b -> Catch-all | 通过 |
| C-ROUTES tree matching and not-found rendering C-ROUTES-07 wildcard fallback: /other -> Missing | 通过 |
| C-ROUTES tree matching and not-found rendering C-ROUTES-08 a group contributes layout but no URL segment | 通过 |
| C-ROUTES tree matching and not-found rendering C-ROUTES-09 nested groups can contain dynamic routes | 通过 |
| C-ROUTES tree matching and not-found rendering C-ROUTES-10 unmatched routes render nothing when notFound is absent | 通过 |
| C-ROUTES tree matching and not-found rendering C-ROUTES-11 replacing the entry tree rebuilds exact and dynamic maps | 通过 |
| C-ROUTES tree matching and not-found rendering C-ROUTES-12 duplicate group URLs use the first declared endpoint | 通过 |
| C-ROUTES tree matching and not-found rendering C-ROUTES-13 public Routes consumes an existing router context | 通过 |

## integration/journeys.test.tsx

[查看测试代码](integration/journeys.test.tsx)

| 用例（完整执行名称） | 结果 |
| --- | --- |
| I-JOURNEY representative application flows I-JOURNEY-01 navigates a grouped application with metadata, layout persistence, query and notFound | 通过 |
| I-JOURNEY representative application flows I-JOURNEY-02 a guard layout redirects an unauthenticated deep link and carries return state | 通过 |
| I-JOURNEY representative application flows I-JOURNEY-03 nested history routers update child and parent after child navigation | 通过 |
| I-JOURNEY representative application flows I-JOURNEY-04 separate memory routers keep their state independent | 通过 |
| I-JOURNEY representative application flows I-JOURNEY-05 StrictMode mounts, navigates and unmounts without duplicate page content | 通过 |
| I-JOURNEY representative application flows I-JOURNEY-06 nested hash routers stay synchronized after child navigation | 通过 |

## modes/hash-memory.test.tsx

[查看测试代码](modes/hash-memory.test.tsx)

| 用例（完整执行名称） | 结果 |
| --- | --- |
| M-HASH hash routing M-HASH-01 reads route, query and inner fragment from hash only | 通过 |
| M-HASH hash routing M-HASH-02 empty hash "" starts at the root page | 通过 |
| M-HASH hash routing M-HASH-02 empty hash "#" starts at the root page | 通过 |
| M-HASH hash routing M-HASH-03 navigation preserves outer pathname/search and updates the rendered page | 通过 |
| M-HASH hash routing M-HASH-04 relative navigation resolves beside the current segment | 通过 |
| M-HASH hash routing M-HASH-05 maintains a push stack for back/forward | 通过 |
| M-HASH hash routing M-HASH-06 pushing after back discards the forward branch | 通过 |
| M-HASH hash routing M-HASH-07 delta -99 outside initial stack is harmless | 通过 |
| M-HASH hash routing M-HASH-07 delta -1 outside initial stack is harmless | 通过 |
| M-HASH hash routing M-HASH-07 delta 0 outside initial stack is harmless | 通过 |
| M-HASH hash routing M-HASH-07 delta 1 outside initial stack is harmless | 通过 |
| M-HASH hash routing M-HASH-07 delta 99 outside initial stack is harmless | 通过 |
| M-HASH hash routing M-HASH-08 responds to an external hashchange | 通过 |
| M-HASH hash routing M-HASH-09 truncates base on initial deep link | 通过 |
| M-HASH hash routing M-HASH-10 stores state in context and leaves native state/scrollRestoration alone | 通过 |
| M-HASH hash routing M-HASH-11 rejects cross-origin URL objects before changing the hash | 通过 |
| M-HASH hash routing M-HASH-12 removes hashchange subscription on unmount | 通过 |
| M-HASH hash routing M-HASH-13 native traversal updates URL/page/params without rewriting host state | 通过 |
| M-MEMORY memory mode baseline M-MEMORY-01 starts with a root page when the browser hash is empty | 通过 |
| M-MEMORY memory mode baseline M-MEMORY-02 navigation does not modify browser URL, native history or scrollRestoration | 通过 |
| M-MEMORY memory mode baseline M-MEMORY-03 setState accepts object and functional updates | 通过 |
| M-MEMORY memory mode baseline M-MEMORY-04 does not subscribe to browser route events | 通过 |

## modes/history.test.tsx

[查看测试代码](modes/history.test.tsx)

| 用例（完整执行名称） | 结果 |
| --- | --- |
| M-HISTORY browser history routing M-HISTORY-01 is the default mode and exposes normalized base and location | 通过 |
| M-HISTORY browser history routing M-HISTORY-02 rejects URL /other outside base /app | 通过 |
| M-HISTORY browser history routing M-HISTORY-02 rejects URL /application/about outside base /app | 通过 |
| M-HISTORY browser history routing M-HISTORY-03 push appends one entry, applies base and keeps state | 通过 |
| M-HISTORY browser history routing M-HISTORY-04 replace helper replaces only the current entry and forwards options | 通过 |
| M-HISTORY browser history routing M-HISTORY-05 relative navigation 43 yields /users/43 | 通过 |
| M-HISTORY browser history routing M-HISTORY-05 relative navigation ../about yields /about | 通过 |
| M-HISTORY browser history routing M-HISTORY-05 relative navigation ?q=next yields /users/42?q=next | 通过 |
| M-HISTORY browser history routing M-HISTORY-05 relative navigation #detail yields /users/42#detail | 通过 |
| M-HISTORY browser history routing M-HISTORY-05 relative navigation \about yields /about | 通过 |
| M-HISTORY browser history routing M-HISTORY-06 a same-origin URL object is used as an absolute browser URL | 通过 |
| M-HISTORY browser history routing M-HISTORY-07 rejects cross-origin URL objects without side effects | 通过 |
| M-HISTORY browser history routing M-HISTORY-08 numeric navigation delegates to native History API; zero is a no-op | 通过 |
| M-HISTORY browser history routing M-HISTORY-09 popstate refreshes rendered page and params | 通过 |
| M-HISTORY browser history routing M-HISTORY-10 actual history back/forward updates the route asynchronously | 通过 |
| M-HISTORY browser history routing M-HISTORY-11 scrollRestore=true sets browser scrollRestoration | 通过 |
| M-HISTORY browser history routing M-HISTORY-11 scrollRestore=false sets browser scrollRestoration | 通过 |
| M-HISTORY browser history routing M-HISTORY-12 setState updates context and native state without changing URL/history length | 通过 |
| M-HISTORY browser history routing M-HISTORY-13 same-URL navigation still updates state | 通过 |
| M-HISTORY browser history routing M-HISTORY-14 adds and removes the exact popstate listener on unmount | 通过 |
| M-HISTORY browser history routing M-HISTORY-15 an unchanged popstate event does not schedule a context update | 通过 |
| M-HISTORY browser history routing M-HISTORY-16 MAN-03 complete push/replace/native traversal keeps the replacement entry | 通过 |

## regressions/declarations.test.ts

[查看测试代码](regressions/declarations.test.ts)

| 用例（完整执行名称） | 结果 |
| --- | --- |
| D-23 useParams declaration accepts the repeated-parameter arrays returned at runtime | 通过 |
| D-24 public declarations expose every runtime export | 通过 |
| X-TYPE-02 Outlet and Navigate declarations match their nullable runtime results | 通过 |

## regressions/link-contracts.test.tsx

[查看测试代码](regressions/link-contracts.test.tsx)

| 用例（完整执行名称） | 结果 |
| --- | --- |
| Known defects: native link semantics D-20 'Meta' modified click preserves browser handling | 通过 |
| Known defects: native link semantics D-20 'Shift' modified click preserves browser handling | 通过 |
| Known defects: native link semantics D-20 'Alt' modified click preserves browser handling | 通过 |
| Known defects: native link semantics D-21 a user onClick handler can cancel router navigation | 通过 |
| Known defects: native link semantics D-22 'new tab' links preserve native handling | 通过 |
| Known defects: native link semantics D-22 'download' links preserve native handling | 通过 |
| Known defects: native link semantics D-20 button=1 does not trigger router navigation | 通过 |
| Known defects: native link semantics D-20 button=2 does not trigger router navigation | 通过 |
| Known defects: native link semantics D-21 cancellation happens before the delta branch and calls the user only once | 通过 |
| Known defects: native link semantics D-22 actual anchor attributes {"target":"named-window"} retain browser handling | 通过 |
| Known defects: native link semantics D-22 actual anchor attributes {"download":""} retain browser handling | 通过 |
| Known defects: native link semantics D-22 target="_self" retains ordinary activation including keyboard-generated clicks | 通过 |
| Known defects: native link semantics D-22 target="_SELF" retains ordinary activation including keyboard-generated clicks | 通过 |
| Known defects: native link semantics D-22 target="" retains ordinary activation including keyboard-generated clicks | 通过 |
| Known defects: native link semantics D-22 custom anchors are checked using their final DOM attributes | 通过 |

## regressions/memory-server.test.tsx

[查看测试代码](regressions/memory-server.test.tsx)

| 用例（完整执行名称） | 结果 |
| --- | --- |
| D-03 documented non-browser memory mode can render without window/location/history | 通过 |
| D-03 memory SSR renders its own root under base / and exposes usable methods | 通过 |
| D-03 memory SSR renders its own root under base /app and exposes usable methods | 通过 |

## regressions/path-contracts.test.ts

[查看测试代码](regressions/path-contracts.test.ts)

| 用例（完整执行名称） | 结果 |
| --- | --- |
| Known defects: path contracts D-10 resolvePath("?q=new", "/items/1") agrees with browser URL resolution | 通过 |
| Known defects: path contracts D-10 resolvePath("#detail", "/items/1") agrees with browser URL resolution | 通过 |
| Known defects: path contracts D-10 resolvePath("?q=new", "/items/1?old=yes#previous") agrees with browser URL resolution | 通过 |
| Known defects: path contracts D-10 resolvePath("#detail", "/items/1?q=keep") agrees with browser URL resolution | 通过 |
| Known defects: path contracts D-10 resolvePath("next", "/items/1?return=/a/b") agrees with browser URL resolution | 通过 |
| Known defects: path contracts D-10 resolvePath("next", "/items/") agrees with browser URL resolution | 通过 |
| Known defects: path contracts D-10 resolvePath("../../../next", "/a/b") agrees with browser URL resolution | 通过 |
| Known defects: path contracts D-10 resolvePath("../about", "/users/42") agrees with browser URL resolution | 通过 |
| Known defects: path contracts D-10 resolvePath(".well-known", "/a/b") agrees with browser URL resolution | 通过 |
| Known defects: path contracts D-11 joinPath removes the previous query before appending a segment | 通过 |
| Known defects: path contracts D-11 dollar signs in real path segments are preserved | 通过 |
| Known defects: path contracts D-12 string base is literal, including regular-expression metacharacters | 通过 |
| Known defects: path contracts D-12 explicit regular-expression base retains escaped character classes | 通过 |
| Known defects: path contracts D-13 static route segments containing dots do not match arbitrary characters | 通过 |
| Known defects: path contracts D-14 catch-all only matches after a complete path segment | 通过 |
| Known defects: path contracts D-15 three repeated captures in /:id/:id/:id remain an array | 通过 |
| Known defects: path contracts D-15 three repeated captures in /*/*/* remain an array | 通过 |
| Known defects: path contracts D-16 a single absolute URL passed to joinPath retains its protocol separator | 通过 |
| Known defects: path contracts D-10 path and suffix boundaries: "next$usd//中文/%2F?return=/a//b/$#part//$" from "/old" | 通过 |
| Known defects: path contracts D-10 path and suffix boundaries: "#part//$" from "/items/?q=/a//b/$" | 通过 |
| Known defects: path contracts D-10 path and suffix boundaries: "next" from "https://router.test/app/items/?q=keep" | 通过 |
| Known defects: path contracts D-10 path and suffix boundaries: "mailto:note" from "/app/items/" | 通过 |
| Known defects: path contracts D-10 path and suffix boundaries: "../../../../" from "/a/b" | 通过 |
| Known defects: path contracts D-10 path and suffix boundaries: "next//part?q=//" from null | 通过 |
| Known defects: path contracts D-16 single URL normalizes only its pathname, preserving authority and suffix | 通过 |
| Known defects: path contracts D-12 literal base v1.0 respects segment boundaries | 通过 |
| Known defects: path contracts D-12 literal base app+beta respects segment boundaries | 通过 |
| Known defects: path contracts D-12 literal base app(test) respects segment boundaries | 通过 |
| Known defects: path contracts D-12 repeatable regexp /^app\/v\d+$/i retains flags and caller lastIndex | 通过 |
| Known defects: path contracts D-12 repeatable regexp /^app\/v\d+$/gi retains flags and caller lastIndex | 通过 |
| Known defects: path contracts D-12 repeatable regexp /^app\/v\d+$/iy retains flags and caller lastIndex | 通过 |
| Known defects: path contracts D-12 escaped literals and internal anchors retain their meaning | 通过 |
| Known defects: path contracts D-13 static metacharacters in v1.0 are literal beside captures | 通过 |
| Known defects: path contracts D-13 static metacharacters in a+b are literal beside captures | 通过 |
| Known defects: path contracts D-13 static metacharacters in (app) are literal beside captures | 通过 |
| Known defects: path contracts D-13 static metacharacters in [app] are literal beside captures | 通过 |
| Known defects: path contracts D-13 static metacharacters in a\|b are literal beside captures | 通过 |
| Known defects: path contracts D-13 static metacharacters in x^y$ are literal beside captures | 通过 |
| Known defects: path contracts D-13 static metacharacters in file* are literal beside captures | 通过 |
| Known defects: path contracts D-13 static metacharacters in path** are literal beside captures | 通过 |
| Known defects: path contracts D-14 catch-all keeps a full segment boundary with empty and nested remainders | 通过 |
| Known defects: path contracts D-15 two through four id captures accumulate without sharing arrays | 通过 |
| Known defects: path contracts D-15 two through four * captures accumulate without sharing arrays | 通过 |

## regressions/report-20260910-path.test.ts

[查看测试代码](regressions/report-20260910-path.test.ts)

| 用例（完整执行名称） | 结果 |
| --- | --- |
| X-JOIN public utility boundaries X-JOIN-01 joinPath(["https://router.test/a","b"]) preserves path literals and URL structure | 通过 |
| X-JOIN public utility boundaries X-JOIN-01 joinPath(["https://router.test/a","../b"]) preserves path literals and URL structure | 通过 |
| X-JOIN public utility boundaries X-JOIN-01 joinPath(["/a",".well-known"]) preserves path literals and URL structure | 通过 |
| X-JOIN public utility boundaries X-JOIN-01 joinPath(["/a","..hidden"]) preserves path literals and URL structure | 通过 |
| X-JOIN public utility boundaries X-JOIN-01 joinPath(["/a","b?q=/x//y"]) preserves path literals and URL structure | 通过 |
| X-JOIN public utility boundaries X-JOIN-01 joinPath(["/a?q=/x//y"]) preserves path literals and URL structure | 通过 |
| X-JOIN public utility boundaries X-JOIN-01 joinPath(["/a","./b"]) preserves path literals and URL structure | 通过 |
| X-JOIN public utility boundaries X-JOIN-01 joinPath(["/a/b","../c"]) preserves path literals and URL structure | 通过 |
| X-PARAM legal parameter names X-PARAM-01 named parameter __proto__ is an own property | 通过 |
| X-PARAM legal parameter names X-PARAM-01 named parameter constructor is an own property | 通过 |
| X-PARAM legal parameter names X-PARAM-01 named parameter toString is an own property | 通过 |
| X-PARAM legal parameter names X-PARAM-01 named parameter id is an own property | 通过 |
| X-PARAM legal parameter names X-PARAM-02 repeated __proto__ parameters form an own array | 通过 |
| X-JOIN-02 additional authority and suffix boundaries preserves structure for ["/a","b#part//"] | 通过 |
| X-JOIN-02 additional authority and suffix boundaries preserves structure for ["/a","b?next=https://h/a//b#part//"] | 通过 |
| X-JOIN-02 additional authority and suffix boundaries preserves structure for ["https://user:pass@router.test:8443/a","b"] | 通过 |
| X-JOIN-02 additional authority and suffix boundaries preserves structure for ["/a/b/c","../../d"] | 通过 |
| X-JOIN-02 additional authority and suffix boundaries preserves structure for ["/a","?q=1"] | 通过 |
| X-JOIN-02 additional authority and suffix boundaries preserves structure for ["/a","#part"] | 通过 |
| X-JOIN-02 additional authority and suffix boundaries preserves structure for ["/a","../b"] | 通过 |
| X-JOIN-02 additional authority and suffix boundaries preserves structure for ["/a",".../b"] | 通过 |
| X-JOIN-02 additional authority and suffix boundaries normalizes only the pathname of a complete URL | 通过 |
| X-JOIN-02 additional authority and suffix boundaries keeps root and empty distinctions | 通过 |

## regressions/report-20260910-router.test.tsx

[查看测试代码](regressions/report-20260910-router.test.tsx)

| 用例（完整执行名称） | 结果 |
| --- | --- |
| X-NAV retained declarative navigation X-NAV-01 unchanged Navigate props must not navigate on unrelated rerender | 通过 |
| X-NAV retained declarative navigation X-NAV-02 history retained layout Navigate must settle after one navigation | 通过 |
| X-NAV retained declarative navigation X-NAV-02 hash retained layout Navigate must settle after one navigation | 通过 |
| X-NAV retained declarative navigation X-NAV-02 memory retained layout Navigate must settle after one navigation | 通过 |
| X-NEST parent to mounted child synchronization X-NEST-01 history parent push must refresh an existing child | 通过 |
| X-NEST parent to mounted child synchronization X-NEST-01 hash parent push must refresh an existing child | 通过 |
| X-NEST parent to mounted child synchronization X-NEST-02 history parent replace must refresh an existing child | 通过 |
| X-NEST parent to mounted child synchronization X-NEST-02 hash parent replace must refresh an existing child | 通过 |
| X-NEST parent to mounted child synchronization X-NEST-03 history parent setState must update child state on the same native entry | 通过 |
| X-ENC history URL encoding end to end X-ENC-01 raw static route segment 中文 is reachable by encoded URL | 通过 |
| X-ENC history URL encoding end to end X-ENC-01 raw static route segment café is reachable by encoded URL | 通过 |
| X-ENC history URL encoding end to end X-ENC-01 raw static route segment a b is reachable by encoded URL | 通过 |
| X-ENC history URL encoding end to end X-ENC-02 base /应用 matches its own navigation URL | 通过 |
| X-ENC history URL encoding end to end X-ENC-02 base /my app matches its own navigation URL | 通过 |
| X-ENC history URL encoding end to end X-ENC-03 explicitly encoded route key works as a control | 通过 |
| X-ENC hash URL encoding end to end X-ENC-01 raw static route segment 中文 is reachable by encoded URL | 通过 |
| X-ENC hash URL encoding end to end X-ENC-01 raw static route segment café is reachable by encoded URL | 通过 |
| X-ENC hash URL encoding end to end X-ENC-01 raw static route segment a b is reachable by encoded URL | 通过 |
| X-ENC hash URL encoding end to end X-ENC-02 base /应用 matches its own navigation URL | 通过 |
| X-ENC hash URL encoding end to end X-ENC-02 base /my app matches its own navigation URL | 通过 |
| X-ENC hash URL encoding end to end X-ENC-03 explicitly encoded route key works as a control | 通过 |
| X-ENC memory URL encoding end to end X-ENC-01 raw static route segment 中文 is reachable by encoded URL | 通过 |
| X-ENC memory URL encoding end to end X-ENC-01 raw static route segment café is reachable by encoded URL | 通过 |
| X-ENC memory URL encoding end to end X-ENC-01 raw static route segment a b is reachable by encoded URL | 通过 |
| X-ENC memory URL encoding end to end X-ENC-02 base /应用 matches its own navigation URL | 通过 |
| X-ENC memory URL encoding end to end X-ENC-02 base /my app matches its own navigation URL | 通过 |
| X-ENC memory URL encoding end to end X-ENC-03 explicitly encoded route key works as a control | 通过 |
| X-TYPE public hook result contract X-TYPE-01 leaf useOutlet must return null when it has no child, per index.d.ts | 通过 |
| X-COMBINATION cross-cutting router boundaries a persistent Navigate follows declaration changes without following its own location | 通过 |
| X-COMBINATION cross-cutting router boundaries a URL object with an unchanged href does not repeat a declaration | 通过 |
| X-COMBINATION cross-cutting router boundaries copies encoded static descendants below a dynamic route and preserves captures | 通过 |
| X-COMBINATION cross-cutting router boundaries copies an encoded static ancestor into a dynamic descendant path | 通过 |
| X-COMBINATION cross-cutting router boundaries retains a special parameter through Router matching and clears it on a static route | 通过 |
| X-COMBINATION cross-cutting router boundaries keeps a child Router instance mounted while a browser parent changes location | 通过 |

## regressions/router-contracts.test.tsx

[查看测试代码](regressions/router-contracts.test.tsx)

| 用例（完整执行名称） | 结果 |
| --- | --- |
| Known defects: navigation and route contracts D-01 memory navigation changes the rendered route without touching the browser URL | 通过 |
| Known defects: navigation and route contracts D-01 memory push/back/forward/replace traverses its own route stack | 通过 |
| Known defects: navigation and route contracts D-02 memory initial route is independent of the host browser hash | 通过 |
| Known defects: navigation and route contracts D-04 hash replace keeps earlier route entries available for back | 通过 |
| Known defects: navigation and route contracts D-04 hash replace does not append a native browser history entry | 通过 |
| Known defects: navigation and route contracts D-05 hash absolute navigation applies base before matching | 通过 |
| Known defects: navigation and route contracts D-05 hash Link href includes the configured base | 通过 |
| Known defects: navigation and route contracts D-06 history context initializes from existing native history.state | 通过 |
| Known defects: navigation and route contracts D-06 popstate restores state belonging to the destination entry | 通过 |
| Known defects: navigation and route contracts D-07 functional setState stores the computed state in native history | 通过 |
| Known defects: navigation and route contracts D-08 static sibling wins even when :id is declared first | 通过 |
| Known defects: navigation and route contracts D-08 static sibling wins even when * is declared first | 通过 |
| Known defects: navigation and route contracts D-08 static sibling wins even when ** is declared first | 通过 |
| Known defects: navigation and route contracts D-09 changing entry from dynamic to static clears previously captured params | 通过 |
| Known defects: navigation and route contracts D-09 changing the dynamic parameter name removes the old name | 通过 |
| Known defects: navigation and route contracts D-17 same-origin absolute URL strings navigate like URL objects | 通过 |
| Known defects: navigation and route contracts D-18 hash back restores the earlier navigation state | 通过 |
| Known defects: navigation and route contracts D-19 changing mode releases the old subscription and installs the new one | 通过 |
| Known defects: navigation and route contracts D-08 groups keep static siblings exact and descendants inherit dynamic ancestors | 通过 |
| Known defects: navigation and route contracts D-09 same-URL entry replacement clears params even on notFound | 通过 |
| Known defects: navigation and route contracts D-09 standalone Routes clears and refills the same params object for every match exit | 通过 |
| Known defects: navigation and route contracts D-09 query-only and state-only updates preserve captured params | 通过 |
| Known defects: navigation and route contracts D-06 native back and forward restore different states at the same URL | 通过 |
| Known defects: navigation and route contracts D-06 nested history routers synchronize same-URL navigation and setState | 通过 |
| Known defects: navigation and route contracts D-07 two functional updates in one batch compute once each from the latest state | 通过 |
| Known defects: navigation and route contracts D-07 native setState failure leaves context and URL untouched | 通过 |
| Known defects: navigation and route contracts D-17 failed native navigation replace=false commits no local changes or scroll policy | 通过 |
| Known defects: navigation and route contracts D-17 failed native navigation replace=true commits no local changes or scroll policy | 通过 |
| Known defects: navigation and route contracts D-17 history rejects cross-origin strings before any navigation side effects | 通过 |
| Known defects: navigation and route contracts D-17 hash rejects cross-origin strings before any navigation side effects | 通过 |
| Known defects: navigation and route contracts D-01/D-02 two memory routers isolate locations, bases, history and state from the host | 通过 |
| Known defects: navigation and route contracts D-03 a nested memory router never notifies its browser parent | 通过 |
| Known defects: navigation and route contracts D-01/D-04/D-18 hash replace in the middle keeps both neighboring entries and state | 通过 |
| Known defects: navigation and route contracts D-01/D-04/D-18 memory replace in the middle keeps both neighboring entries and state | 通过 |
| Known defects: navigation and route contracts D-18 hash same-URL entries and setState restore independently after queued events | 通过 |
| Known defects: navigation and route contracts D-18 memory same-URL entries and setState restore independently after queued events | 通过 |
| Known defects: navigation and route contracts D-04 hash child replace preserves outer URL, native state and length and refreshes its parent | 通过 |
| Known defects: navigation and route contracts D-04 failed hash replace preserves its current entry and forward history | 通过 |
| Known defects: navigation and route contracts D-19 StrictMode mode changes use current sources, reset local histories and pair all listeners | 通过 |
| D-05/D-10/D-17 history href and navigation alignment all target classes use full physical location with base=/ | 通过 |
| D-05/D-10/D-17 history href and navigation alignment all target classes use full physical location with base=/app | 通过 |
| D-05/D-10/D-17 history href and navigation alignment consecutive relative navigations in one batch use the latest directory | 通过 |
| D-05/D-10/D-17 hash href and navigation alignment all target classes use full physical location with base=/ | 通过 |
| D-05/D-10/D-17 hash href and navigation alignment all target classes use full physical location with base=/app | 通过 |
| D-05/D-10/D-17 hash href and navigation alignment consecutive relative navigations in one batch use the latest directory | 通过 |
| D-05/D-10/D-17 memory href and navigation alignment all target classes use full physical location with base=/ | 通过 |
| D-05/D-10/D-17 memory href and navigation alignment all target classes use full physical location with base=/app | 通过 |
| D-05/D-10/D-17 memory href and navigation alignment consecutive relative navigations in one batch use the latest directory | 通过 |

## unit/matching.test.ts

[查看测试代码](unit/matching.test.ts)

| 用例（完整执行名称） | 结果 |
| --- | --- |
| U-MATCH static, dynamic and wildcard matching U-MATCH-01 "/" against "/" -> {} | 通过 |
| U-MATCH static, dynamic and wildcard matching U-MATCH-01 "/about" against "/about" -> {} | 通过 |
| U-MATCH static, dynamic and wildcard matching U-MATCH-01 "/About" against "/about" -> null | 通过 |
| U-MATCH static, dynamic and wildcard matching U-MATCH-01 "/about/" against "/about" -> null | 通过 |
| U-MATCH static, dynamic and wildcard matching U-MATCH-01 "/about/us" against "/about" -> null | 通过 |
| U-MATCH static, dynamic and wildcard matching U-MATCH-01 "/users/42" against "/users/:id" -> {"id":"42"} | 通过 |
| U-MATCH static, dynamic and wildcard matching U-MATCH-01 "/users/42/posts/101" against "/users/:userId/posts/:postId" -> {"userId":"42","postId":"101"} | 通过 |
| U-MATCH static, dynamic and wildcard matching U-MATCH-01 "/users" against "/users/:id" -> null | 通过 |
| U-MATCH static, dynamic and wildcard matching U-MATCH-01 "/users/" against "/users/:id" -> null | 通过 |
| U-MATCH static, dynamic and wildcard matching U-MATCH-01 "/users/42/extra" against "/users/:id" -> null | 通过 |
| U-MATCH static, dynamic and wildcard matching U-MATCH-01 "/docs/intro" against "/docs/*" -> {"*":"intro"} | 通过 |
| U-MATCH static, dynamic and wildcard matching U-MATCH-01 "/docs/a/b" against "/docs/*" -> null | 通过 |
| U-MATCH static, dynamic and wildcard matching U-MATCH-01 "/docs" against "/docs/*" -> null | 通过 |
| U-MATCH static, dynamic and wildcard matching U-MATCH-01 "/docs/" against "/docs/*" -> null | 通过 |
| U-MATCH static, dynamic and wildcard matching U-MATCH-01 "/files" against "/files/**" -> {} | 通过 |
| U-MATCH static, dynamic and wildcard matching U-MATCH-01 "/files/" against "/files/**" -> {} | 通过 |
| U-MATCH static, dynamic and wildcard matching U-MATCH-01 "/files/a/b/c" against "/files/**" -> {} | 通过 |
| U-MATCH static, dynamic and wildcard matching U-MATCH-01 "/a/b/c" against "/**" -> {} | 通过 |
| U-MATCH static, dynamic and wildcard matching U-MATCH-01 "/" against "/**" -> {} | 通过 |
| U-MATCH static, dynamic and wildcard matching U-MATCH-01 "/users/42/a/b" against "/users/:id/**" -> {"id":"42"} | 通过 |
| U-MATCH static, dynamic and wildcard matching U-MATCH-01 "/a/b" against "/:id/:id" -> {"id":["a","b"]} | 通过 |
| U-MATCH static, dynamic and wildcard matching U-MATCH-01 "/a/b" against "/*/*" -> {"*":["a","b"]} | 通过 |
| U-MATCH static, dynamic and wildcard matching U-MATCH-01 "/users/%E4%B8%AD" against "/users/:id" -> {"id":"%E4%B8%AD"} | 通过 |
| U-MATCH static, dynamic and wildcard matching U-MATCH-01 "/users/中文" against "/users/:id" -> {"id":"中文"} | 通过 |
| U-MATCH static, dynamic and wildcard matching U-MATCH-01 "/users/%2F" against "/users/:id" -> {"id":"%2F"} | 通过 |
| U-MATCH static, dynamic and wildcard matching U-MATCH-02 each call returns an independent parameter object | 通过 |

## unit/node-import.test.ts

[查看测试代码](unit/node-import.test.ts)

| 用例（完整执行名称） | 结果 |
| --- | --- |
| U-NODE-01 package source imports without browser globals and pure utilities remain usable | 通过 |

## unit/path.test.ts

[查看测试代码](unit/path.test.ts)

| 用例（完整执行名称） | 结果 |
| --- | --- |
| U-PATH path normalization U-PATH-01 unifySlash("") = "" | 通过 |
| U-PATH path normalization U-PATH-01 unifySlash("/") = "/" | 通过 |
| U-PATH path normalization U-PATH-01 unifySlash("///a//b///") = "/a/b/" | 通过 |
| U-PATH path normalization U-PATH-01 unifySlash("\\a\\b\\") = "/a/b/" | 通过 |
| U-PATH path normalization U-PATH-01 unifySlash("a/\\b") = "a/b" | 通过 |
| U-PATH path normalization U-PATH-01 unifySlash("中文/%20") = "中文/%20" | 通过 |
| U-PATH path normalization U-PATH-02 dropStartSlash("") = "" | 通过 |
| U-PATH path normalization U-PATH-02 dropStartSlash("///") = "" | 通过 |
| U-PATH path normalization U-PATH-02 dropStartSlash("/a/b/") = "a/b/" | 通过 |
| U-PATH path normalization U-PATH-02 dropStartSlash("a/b") = "a/b" | 通过 |
| U-PATH path normalization U-PATH-03 dropEndSlash("") = "" | 通过 |
| U-PATH path normalization U-PATH-03 dropEndSlash("///") = "" | 通过 |
| U-PATH path normalization U-PATH-03 dropEndSlash("/a/b///") = "/a/b" | 通过 |
| U-PATH path normalization U-PATH-03 dropEndSlash("a/b") = "a/b" | 通过 |
| U-PATH path normalization U-PATH-04 unifyPath("") = "" | 通过 |
| U-PATH path normalization U-PATH-04 unifyPath("/") = "" | 通过 |
| U-PATH path normalization U-PATH-04 unifyPath("//a\\b///") = "a/b" | 通过 |
| U-PATH path normalization U-PATH-04 unifyPath("a") = "a" | 通过 |
| U-PATH path normalization U-PATH-04 unifyPath("/中文/") = "中文" | 通过 |
| U-PATH path normalization U-PATH-05 dropLastPortion("/a/b") = "/a" | 通过 |
| U-PATH path normalization U-PATH-05 dropLastPortion("/a/b/") = "/a" | 通过 |
| U-PATH path normalization U-PATH-05 dropLastPortion("/a") = "" | 通过 |
| U-PATH path normalization U-PATH-05 dropLastPortion("/") = "/" | 通过 |
| U-PATH path normalization U-PATH-05 dropLastPortion("a") = "a" | 通过 |
| U-PATH path normalization U-PATH-05 dropLastPortion("") = "" | 通过 |
| U-PATH path normalization U-PATH-06 protocol guard("https://example.test") = true | 通过 |
| U-PATH path normalization U-PATH-06 protocol guard("HTTP://example.test") = true | 通过 |
| U-PATH path normalization U-PATH-06 protocol guard("ftp://host") = true | 通过 |
| U-PATH path normalization U-PATH-06 protocol guard("/about") = false | 通过 |
| U-PATH path normalization U-PATH-06 protocol guard("//example.test") = false | 通过 |
| U-PATH path normalization U-PATH-06 protocol guard("mailto:a@b.test") = false | 通过 |
| U-PATH path normalization U-PATH-06 protocol guard("") = false | 通过 |
| U-JOIN path composition U-JOIN-01 [] -> '' | 通过 |
| U-JOIN path composition U-JOIN-01 [ '/a//b/' ] -> '/a/b' | 通过 |
| U-JOIN path composition U-JOIN-01 [ '/a', 'b', 'c' ] -> '/a/b/c' | 通过 |
| U-JOIN path composition U-JOIN-01 [ '/a', '/b' ] -> '/b' | 通过 |
| U-JOIN path composition U-JOIN-01 [ '', 'a' ] -> 'a' | 通过 |
| U-JOIN path composition U-JOIN-01 [ '/a', '' ] -> '/a' | 通过 |
| U-JOIN path composition U-JOIN-01 [ '/a', './b' ] -> '/a/b' | 通过 |
| U-JOIN path composition U-JOIN-01 [ '/a/b', '../c' ] -> '/a/c' | 通过 |
| U-JOIN path composition U-JOIN-01 [ '/a/b/c', '../../d' ] -> '/a/d' | 通过 |
| U-JOIN path composition U-JOIN-01 [ '/a#old', 'b' ] -> '/a/b' | 通过 |
| U-JOIN path composition U-JOIN-01 [ '/a', 'https://example.test/x' ] -> 'https://example.test/x' | 通过 |
| U-JOIN path composition U-JOIN-01 [ '/', '' ] -> '/' | 通过 |
| U-RESOLVE relative destination resolution U-RESOLVE-01 resolve("/target", "/a/b") = "/target" | 通过 |
| U-RESOLVE relative destination resolution U-RESOLVE-01 resolve("sibling", "/a/b") = "/a/sibling" | 通过 |
| U-RESOLVE relative destination resolution U-RESOLVE-01 resolve("./sibling", "/a/b") = "/a/sibling" | 通过 |
| U-RESOLVE relative destination resolution U-RESOLVE-01 resolve("../sibling", "/a/b/c") = "/a/sibling" | 通过 |
| U-RESOLVE relative destination resolution U-RESOLVE-01 resolve("next", null) = "next" | 通过 |
| U-RESOLVE relative destination resolution U-RESOLVE-01 resolve("next", "") = "next" | 通过 |
| U-RESOLVE relative destination resolution U-RESOLVE-01 resolve("\\a\\b", "/previous") = "/a/b" | 通过 |
| U-RESOLVE relative destination resolution U-RESOLVE-01 resolve("https://example.test/next", "/a") = "https://example.test/next" | 通过 |
| U-RESOLVE relative destination resolution U-RESOLVE-01 resolve("next?x=1#detail", "/a/old") = "/a/next?x=1#detail" | 通过 |
| U-RESOLVE relative destination resolution U-RESOLVE-01 resolve("next", "/a/old#detail") = "/a/next" | 通过 |
| U-RESOLVE relative destination resolution U-RESOLVE-02 accepts a URL instance without losing search/hash | 通过 |
| U-BASE base truncation U-BASE-01 truncate("/app/users/42", /app) = "users/42" | 通过 |
| U-BASE base truncation U-BASE-01 truncate("/app", /app) = "" | 通过 |
| U-BASE base truncation U-BASE-01 truncate("/application/users", /app) = null | 通过 |
| U-BASE base truncation U-BASE-01 truncate("/other", /app) = null | 通过 |
| U-BASE base truncation U-BASE-01 truncate("/app//users/", \app\) = "users" | 通过 |
| U-BASE base truncation U-BASE-01 truncate("/", /) = "" | 通过 |
| U-BASE base truncation U-BASE-01 truncate("/a/b", undefined) = "a/b" | 通过 |
| U-BASE base truncation U-BASE-01 truncate("/a/b", ) = "a/b" | 通过 |
| U-BASE base truncation U-BASE-01 truncate("/app/users", /^app$/) = "users" | 通过 |
| U-BASE base truncation U-BASE-01 truncate("/other/users", /^app$/) = null | 通过 |

## unit/state-location.test.tsx

[查看测试代码](unit/state-location.test.tsx)

| 用例（完整执行名称） | 结果 |
| --- | --- |
| U-GUARD renderability and scalar guards U-GUARD-01 undefined is unset | 通过 |
| U-GUARD renderability and scalar guards U-GUARD-01 null is unset | 通过 |
| U-GUARD renderability and scalar guards U-GUARD-01 false is unset | 通过 |
| U-GUARD renderability and scalar guards U-GUARD-02 0 is set | 通过 |
| U-GUARD renderability and scalar guards U-GUARD-02 "" is set | 通过 |
| U-GUARD renderability and scalar guards U-GUARD-02 true is set | 通过 |
| U-GUARD renderability and scalar guards U-GUARD-02 undefined is set | 通过 |
| U-GUARD renderability and scalar guards U-GUARD-02 {} is set | 通过 |
| U-GUARD renderability and scalar guards U-GUARD-02 {"type":"span","key":"node","props":{},"_owner":null,"_store":{}} is set | 通过 |
| U-GUARD renderability and scalar guards U-GUARD-03  is a string or number | 通过 |
| U-GUARD renderability and scalar guards U-GUARD-03 text is a string or number | 通过 |
| U-GUARD renderability and scalar guards U-GUARD-03 0 is a string or number | 通过 |
| U-GUARD renderability and scalar guards U-GUARD-03 -1 is a string or number | 通过 |
| U-GUARD renderability and scalar guards U-GUARD-03 NaN is a string or number | 通过 |
| U-GUARD renderability and scalar guards U-GUARD-03 Infinity is a string or number | 通过 |
| U-GUARD renderability and scalar guards U-GUARD-04 'null' is not a string or number | 通过 |
| U-GUARD renderability and scalar guards U-GUARD-04 'undefined' is not a string or number | 通过 |
| U-GUARD renderability and scalar guards U-GUARD-04 'boolean' is not a string or number | 通过 |
| U-GUARD renderability and scalar guards U-GUARD-04 'object' is not a string or number | 通过 |
| U-GUARD renderability and scalar guards U-GUARD-04 'array' is not a string or number | 通过 |
| U-GUARD renderability and scalar guards U-GUARD-04 'function' is not a string or number | 通过 |
| U-GUARD renderability and scalar guards U-GUARD-04 'bigint' is not a string or number | 通过 |
| U-GUARD renderability and scalar guards U-GUARD-04 'symbol' is not a string or number | 通过 |
| U-LOCATION browser snapshot U-LOCATION-01 copies all public location fields but no browser methods | 通过 |
| U-LOCATION browser snapshot U-LOCATION-02 detects URL change to /next without mutating snapshot | 通过 |
| U-LOCATION browser snapshot U-LOCATION-02 detects URL change to /?q=2 without mutating snapshot | 通过 |
| U-LOCATION browser snapshot U-LOCATION-02 detects URL change to /#part without mutating snapshot | 通过 |
| U-LOCATION browser snapshot U-LOCATION-03 unchanged URL and state-only updates do not change location | 通过 |
| U-SYNC React ref/state synchronization U-SYNC-01 useSync keeps ref identity and exposes the latest render value | 通过 |
| U-SYNC React ref/state synchronization U-SYNC-02 lazily initializes exactly once | 通过 |
| U-SYNC React ref/state synchronization U-SYNC-03 updates the ref immediately and composes batched functional updates | 通过 |
| U-SYNC React ref/state synchronization U-SYNC-04 assigning the same object does not schedule an extra render | 通过 |
| U-SYNC React ref/state synchronization U-SYNC-05 supports omitted initial state | 通过 |

## 缺陷回归统计

同一场景可关联多个缺陷编号，因此本表不按行相加计算总用例数。修复前的 45 项失败历史见 TEST_PLAN.md 第 5 节。

| 缺陷编号 | 通过数 | 失败数 |
| --- | --- | --- |
| D-01 | 5 | 0 |
| D-02 | 2 | 0 |
| D-03 | 4 | 0 |
| D-04 | 6 | 0 |
| D-05 | 11 | 0 |
| D-06 | 4 | 0 |
| D-07 | 3 | 0 |
| D-08 | 4 | 0 |
| D-09 | 5 | 0 |
| D-10 | 24 | 0 |
| D-11 | 2 | 0 |
| D-12 | 9 | 0 |
| D-13 | 9 | 0 |
| D-14 | 2 | 0 |
| D-15 | 4 | 0 |
| D-16 | 2 | 0 |
| D-17 | 14 | 0 |
| D-18 | 5 | 0 |
| D-19 | 2 | 0 |
| D-20 | 5 | 0 |
| D-21 | 2 | 0 |
| D-22 | 8 | 0 |
| D-23 | 1 | 0 |
| D-24 | 1 | 0 |
