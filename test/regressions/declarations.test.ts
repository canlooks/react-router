// @vitest-environment node
import {resolve} from 'node:path'
import ts from 'typescript'
import {expect, it} from 'vitest'

function diagnosticsFor(fixture: string) {
    const program = ts.createProgram([resolve('test/types/regressions', fixture)], {
        noEmit: true, strict: true, skipLibCheck: false,
        target: ts.ScriptTarget.ESNext, module: ts.ModuleKind.ESNext,
        moduleResolution: ts.ModuleResolutionKind.Bundler, jsx: ts.JsxEmit.ReactJSX,
        types: ['node', 'react']
    })
    return ts.getPreEmitDiagnostics(program).map(diagnostic => ({
        code: diagnostic.code,
        message: ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')
    }))
}

it('D-23 useParams declaration accepts the repeated-parameter arrays returned at runtime', () => {
    expect(diagnosticsFor('params.ts')).toEqual([])
}, 15_000) // Full library checking also runs under V8 coverage instrumentation.

it('D-24 public declarations expose every runtime export', () => {
    expect(diagnosticsFor('exports.tsx')).toEqual([])
}, 15_000)

it('X-TYPE-02 Outlet and Navigate declarations match their nullable runtime results', () => {
    expect(diagnosticsFor('outlet.tsx')).toEqual([])
}, 15_000)
