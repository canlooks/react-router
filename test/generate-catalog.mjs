import {readFileSync, writeFileSync} from 'node:fs'
import {dirname, relative, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {execFileSync} from 'node:child_process'

const testDirectory = dirname(fileURLToPath(import.meta.url))
const root = resolve(testDirectory, '..')
const report = JSON.parse(readFileSync(resolve(testDirectory, 'reports/all/results.json'), 'utf8'))
const groups = [...report.testResults].sort((a, b) => a.name.localeCompare(b.name, 'en'))
const cases = groups.flatMap(group => group.assertionResults)
if (!cases.length) throw new Error('The full test report contains no test cases. Run npm test without filters first.')
const commit = execFileSync('git', ['rev-parse', '--short', 'HEAD'], {cwd: root, encoding: 'utf8'}).trim()
const modified = execFileSync('git', ['status', '--porcelain', '--', 'src', 'index.d.ts'], {cwd: root, encoding: 'utf8'}).trim()
const escape = value => String(value).replaceAll('|', '\\|').replaceAll('`', "'").replace(/[\r\n]+/g, ' ')
const failed = cases.filter(item => item.status === 'failed')
const passed = cases.filter(item => item.status === 'passed')
const statuses = {passed: '通过', failed: '失败', pending: '跳过', todo: '待实现', skipped: '跳过'}
const lines = [
    '# 自动化用例清单与执行快照', '',
    `执行时间（UTC）：${new Date(report.startTime).toISOString()}；源码基准提交：\`${commit}\`${modified ? '；包含工作区未提交的修复' : ''}。`, '',
    `共 ${groups.length} 个文件、${cases.length} 个用例；通过 ${passed.length}，失败 ${failed.length}，其他状态 ${cases.length - passed.length - failed.length}。`, '',
    '这是最近一次全量执行的快照，不能代替后续复测。失败为普通断言失败，绝非预期失败反转。', '',
    '测试方法、分组步骤、验收标准与缺陷说明见 [TEST_PLAN.md](TEST_PLAN.md)。参数化用例的具体输入和期望已展开在名称中；更完整的前提和断言请打开对应源文件。', '',
    '先执行无过滤条件的 `npm test`，再运行 `npm run test:catalog` 更新本文件。', ''
]
for (const group of groups) {
    const path = relative(testDirectory, group.name).replaceAll('\\', '/')
    lines.push(`## ${path}`, '', `[查看测试代码](${path})`, '', '| 用例（完整执行名称） | 结果 |', '| --- | --- |')
    for (const item of group.assertionResults) {
        lines.push(`| ${escape(item.fullName)} | ${statuses[item.status] || escape(item.status)} |`)
    }
    lines.push('')
}
lines.push('## 缺陷回归统计', '', '同一场景可关联多个缺陷编号，因此本表不按行相加计算总用例数。修复前的 45 项失败历史见 TEST_PLAN.md 第 5 节。', '', '| 缺陷编号 | 通过数 | 失败数 |', '| --- | --- | --- |')
const defects = new Map()
for (const item of cases) {
    const ids = [...new Set(item.fullName.match(/\bD-\d+\b/g) || (item.status === 'failed' ? ['未归类（需调查）'] : []))]
    for (const id of ids) {
        const counts = defects.get(id) || {passed: 0, failed: 0}
        if (item.status === 'passed' || item.status === 'failed') counts[item.status]++
        defects.set(id, counts)
    }
}
for (const [id, counts] of [...defects].sort(([a], [b]) => a.localeCompare(b))) lines.push(`| ${id} | ${counts.passed} | ${counts.failed} |`)
lines.push('')
writeFileSync(resolve(testDirectory, 'CASE_CATALOG.md'), lines.join('\n'))
process.stdout.write(`Generated test/CASE_CATALOG.md: ${cases.length} cases, ${failed.length} failures.\n`)
