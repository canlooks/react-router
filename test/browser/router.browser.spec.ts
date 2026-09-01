import {expect, test, type Page} from '@playwright/test'

type BrowserTelemetry = {
    pushes: number
    replaces: number
    scrollCalls: unknown[][]
}

declare global {
    interface Window {
        __routerTelemetry: BrowserTelemetry
    }
}

async function installTelemetry(page: Page) {
    await page.addInitScript(() => {
        const telemetry: BrowserTelemetry = {
            pushes: 0,
            replaces: 0,
            scrollCalls: []
        }
        Object.defineProperty(window, '__routerTelemetry', {value: telemetry})

        const nativePushState = history.pushState.bind(history)
        const nativeReplaceState = history.replaceState.bind(history)
        history.pushState = (...args) => {
            telemetry.pushes += 1
            return nativePushState(...args)
        }
        history.replaceState = (...args) => {
            telemetry.replaces += 1
            return nativeReplaceState(...args)
        }

        const nativeScrollTo = window.scrollTo.bind(window)
        const patchedScrollTo = (...args: [ScrollToOptions?] | [number, number]) => {
            telemetry.scrollCalls.push(args)
            if (typeof args[0] === 'number') {
                nativeScrollTo(args[0], args[1] ?? 0)
            } else {
                nativeScrollTo(args[0])
            }
        }
        window.scrollTo = patchedScrollTo as typeof window.scrollTo
    })
}

async function openFixture(page: Page, path: string) {
    await installTelemetry(page)
    await page.goto(path)
    await expect(page.getByTestId('page')).toBeVisible()
}

async function dispatchClickWithoutNativeNavigation(
    page: Page,
    testId: string,
    eventInit: Record<string, boolean | number | undefined>
) {
    await page.evaluate(() => {
        document.addEventListener('click', event => event.preventDefault(), {once: true})
    })
    await page.getByTestId(testId).dispatchEvent('click', eventInit)
}

test('history deep link, refresh, Unicode params, query and hash', async ({page}) => {
    await openFixture(
        page,
        '/history/unicode/%E4%B8%AD/%E7%A9%BA%E6%A0%BC?q=%E8%B7%AF%E7%94%B1#section'
    )

    await expect(page.getByTestId('page')).toHaveText('unicode')
    await expect(page.getByTestId('params')).toHaveText('{"slot":"中","chip":"空格"}')
    await expect(page.getByTestId('query')).toHaveText('路由')
    await expect(page.getByTestId('hash')).toHaveText('#section')

    await page.reload()
    await expect(page.getByTestId('page')).toHaveText('unicode')
    await expect(page.getByTestId('params')).toHaveText('{"slot":"中","chip":"空格"}')
})

test('history state follows back and forward entries', async ({page}) => {
    await openFixture(page, '/history')

    await page.getByTestId('state-first').click()
    await expect(page).toHaveURL(/\/history\/first$/)
    await expect(page.getByTestId('state')).toHaveText('{"entry":"first"}')

    await page.getByTestId('state-second').click()
    await expect(page).toHaveURL(/\/history\/second$/)
    await expect(page.getByTestId('state')).toHaveText('{"entry":"second"}')

    await page.goBack()
    await expect(page.getByTestId('page')).toHaveText('first')
    await expect(page.getByTestId('state')).toHaveText('{"entry":"first"}')

    await page.goForward()
    await expect(page.getByTestId('page')).toHaveText('second')
    await expect(page.getByTestId('state')).toHaveText('{"entry":"second"}')
})

test('hash mode keeps base and native replace history semantics', async ({page}) => {
    await openFixture(page, '/hash#/app/first')
    await expect(page.getByTestId('page')).toHaveText('first')
    await page.reload()
    await expect(page.getByTestId('page')).toHaveText('first')

    await page.goto('/hash#/app')
    await expect(page.getByTestId('page')).toHaveText('home')

    await expect(page.getByTestId('link-next')).toHaveAttribute('href', '#/app/next')
    await page.getByTestId('state-first').click()
    await expect(page).toHaveURL(/\/hash#\/app\/first$/)
    await expect(page.getByTestId('state')).toHaveText('{"entry":"first"}')

    await page.getByTestId('replace-second').click()
    await expect(page).toHaveURL(/\/hash#\/app\/second$/)
    await expect(page.getByTestId('state')).toHaveText('{"entry":"second-replaced"}')

    await page.goBack()
    await expect(page).toHaveURL(/\/hash#\/app$/)
    await expect(page.getByTestId('page')).toHaveText('home')

    await page.goForward()
    await expect(page.getByTestId('page')).toHaveText('second')
    await expect(page.getByTestId('state')).toHaveText('{"entry":"second-replaced"}')
})

test('memory navigation is private and restores per-entry state', async ({page}) => {
    await openFixture(page, '/memory?host=kept#browser')
    const browserUrl = page.url()

    await page.getByTestId('state-first').click()
    await expect(page.getByTestId('page')).toHaveText('first')
    await expect(page.getByTestId('state')).toHaveText('{"entry":"first"}')
    expect(page.url()).toBe(browserUrl)

    await page.getByTestId('state-second').click()
    await expect(page.getByTestId('page')).toHaveText('second')
    await page.getByTestId('back').click()
    await expect(page.getByTestId('page')).toHaveText('first')
    await expect(page.getByTestId('state')).toHaveText('{"entry":"first"}')
    expect(page.url()).toBe(browserUrl)
})

test('Link preserves native click semantics and cancellation', async ({page, context}) => {
    await openFixture(page, '/history')

    const link = page.getByTestId('link-next')
    for (const eventInit of [
        {button: 1},
        {button: 0, ctrlKey: true},
        {button: 0, metaKey: true},
        {button: 0, shiftKey: true},
        {button: 0, altKey: true}
    ]) {
        await dispatchClickWithoutNativeNavigation(page, 'link-next', eventInit)
    }
    await expect.poll(() => page.evaluate(() => window.__routerTelemetry.pushes)).toBe(0)
    await expect(page).toHaveURL(/\/history$/)
    for (const candidate of context.pages()) {
        if (candidate !== page) {
            await candidate.close()
        }
    }

    await page.getByTestId('link-cancelled').click()
    await expect(page).toHaveURL(/\/history$/)
    await expect.poll(() => page.evaluate(() => window.__routerTelemetry.pushes)).toBe(0)

    const popupPromise = page.waitForEvent('popup')
    await page.getByTestId('link-blank').click()
    const popup = await popupPromise
    await popup.waitForURL(/\/history\/next$/)
    expect(new URL(popup.url()).pathname).toBe('/history/next')
    await popup.close()
    await expect(page).toHaveURL(/\/history$/)

    await expect(page.getByTestId('link-download')).toHaveAttribute('download', 'next.html')
    await expect(page.getByTestId('link-external')).toHaveAttribute(
        'href',
        'https://example.com/route'
    )
    await expect(page.getByTestId('link-outside-base')).toHaveAttribute(
        'href',
        'http://127.0.0.1:4173/outside'
    )

    await link.click()
    await expect(page).toHaveURL(/\/history\/next$/)
    await expect.poll(() => page.evaluate(() => window.__routerTelemetry.pushes)).toBe(1)
})

test('Link supports keyboard focus and activation', async ({page}) => {
    await openFixture(page, '/history')
    const link = page.getByTestId('link-next')

    for (let attempt = 0; attempt < 4; attempt++) {
        if (await link.evaluate(element => element === document.activeElement)) {
            break
        }
        await page.keyboard.press('Tab')
    }
    await expect(link).toBeFocused()
    await expect(link).toHaveCSS('outline-style', 'solid')
    await page.keyboard.press('Enter')

    await expect(page).toHaveURL(/\/history\/next$/)
    await expect(page.getByTestId('page')).toHaveText('next')

    await page.goBack()
    const button = page.getByTestId('button-next')
    await button.focus()
    await expect(button).toBeFocused()
    await expect(button).toHaveCSS('outline-style', 'solid')
    await page.keyboard.press('Space')
    await expect(page).toHaveURL(/\/history\/next$/)
    await expect(page.getByTestId('page')).toHaveText('next')
})

test('query and hash-only targets use URL semantics', async ({page}) => {
    await openFixture(page, '/history/first?old=1#old')

    await expect(page.getByTestId('link-query')).toHaveAttribute('href', '/history/first?page=2')
    await page.getByTestId('link-query').click()
    await expect(page).toHaveURL(/\/history\/first\?page=2$/)

    await expect(page.getByTestId('link-hash')).toHaveAttribute(
        'href',
        '/history/first?page=2#details'
    )
    await page.getByTestId('link-hash').click()
    await expect(page).toHaveURL(/\/history\/first\?page=2#details$/)
})

test('Navigate is idempotent under StrictMode', async ({page}) => {
    await installTelemetry(page)
    await page.goto('/history/strict')

    await expect(page).toHaveURL(/\/history\/target$/)
    await expect(page.getByTestId('page')).toHaveText('target')
    await expect.poll(() => page.evaluate(() => window.__routerTelemetry.pushes)).toBe(1)
})

test('scrollRestore false resets after commit without changing global policy', async ({page}) => {
    await openFixture(page, '/history/long')
    await page.evaluate(() => {
        history.scrollRestoration = 'manual'
        window.scrollTo(0, 1200)
        window.__routerTelemetry.scrollCalls = []
    })
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000)

    await page.getByTestId('scroll-reset').click()
    await expect(page.getByTestId('page')).toHaveText('next')
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0)
    await expect.poll(() => page.evaluate(() => window.__routerTelemetry.scrollCalls.length)).toBe(1)
    expect(await page.evaluate(() => history.scrollRestoration)).toBe('manual')

    await page.goBack()
    await expect(page.getByTestId('page')).toHaveText('long')
    await page.evaluate(() => {
        window.scrollTo(0, 1200)
        window.__routerTelemetry.scrollCalls = []
    })
    await page.getByTestId('scroll-preserve').click()
    await expect(page.getByTestId('page')).toHaveText('next')
    await expect.poll(() => page.evaluate(() => window.__routerTelemetry.scrollCalls.length)).toBe(0)
})

test('nested Router renders the child route', async ({page}) => {
    await openFixture(page, '/history/nested/child')
    await expect(page.getByTestId('page')).toHaveText('nested-child')
    await page.getByTestId('nested-link').click()
    await expect(page).toHaveURL(/\/history\/nested\/sibling$/)
    await expect(page.getByTestId('page')).toHaveText('nested-sibling')
})

test('history parent navigation synchronizes the nested Router and traversal', async ({page}) => {
    await openFixture(page, '/history/nested/child')

    await page.getByTestId('nested-parent-link').click()
    await expect(page).toHaveURL(/\/history\/nested\/sibling$/)
    await expect(page.getByTestId('page')).toHaveText('nested-sibling')

    await page.goBack()
    await expect(page).toHaveURL(/\/history\/nested\/child$/)
    await expect(page.getByTestId('page')).toHaveText('nested-child')
})

test('hash parent navigation synchronizes the nested Router and traversal', async ({page}) => {
    await openFixture(page, '/hash#/app/nested/child')

    await page.getByTestId('nested-parent-link').click()
    await expect(page).toHaveURL(/\/hash#\/app\/nested\/sibling$/)
    await expect(page.getByTestId('page')).toHaveText('nested-sibling')

    await page.goBack()
    await expect(page).toHaveURL(/\/hash#\/app\/nested\/child$/)
    await expect(page.getByTestId('page')).toHaveText('nested-child')
})
