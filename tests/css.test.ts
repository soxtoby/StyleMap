import { beforeEach, expect, test } from "bun:test"
import { css, fontFaceCss, keyframesCss } from "../src/css"
import { animation, resetStyles, variable } from "../src/styling"

beforeEach(() => resetStyles())

test("empty", () => {
    expect(css({ '.test': {} })).toBe('')
})

test("basic properties", () => {
    expect(css({ '.test': { background: 'blue' } })).toBe(`.test { background: blue; }`)
    expect(css({ '.test': { width: 5 } })).toBe(`.test { width: 5px; }`)
    expect(css({ '.test': { marginLeft: 3 } })).toBe(`.test { margin-left: 3px; }`)
    expect(css({ '.test': { overflowX: 'auto' } })).toBe(`.test { overflow-x: auto; }`)
})

test("vendor prefixes", () => {
    expect(css({ '.test': { WebkitAlignSelf: 'start' } })).toBe(`.test { -webkit-align-self: start; }`)
    expect(css({ '.test': { MozBoxAlign: 'start' } })).toBe(`.test { -moz-box-align: start; }`)
    expect(css({ '.test': { msContentZooming: 'zoom' } })).toBe(`.test { -ms-content-zooming: zoom; }`)
})

test("arrays of rules", () => {
    expect(css([['.test', { background: 'blue' }]])).toBe(`.test { background: blue; }`)
    expect(css([[['.foo', '.bar'], { width: 1 }]])).toBe(
        `.foo { width: 1px; }\n`
        + `.bar { width: 1px; }`)
})

test("basic properties with multiple values", () => {
    expect(css({ '.test': { transitionProperty: ['width', 'height'] } })).toBe('.test { transition-property: width, height; }')
    expect(css({ '.test': { margin: [1, '2em'] } })).toBe('.test { margin: 1px 2em; }')
    expect(css({ '.test': { gridTemplate: [1, 2] } })).toBe('.test { grid-template: 1px 2px; }')
    expect(css({ '.test': { gridTemplate: ['max-content', [1, 2]] } })).toBe('.test { grid-template: max-content / 1px 2px; }')
})

test("top-level at-rules", () => {
    expect(css({ '@page': { margin: '1cm' } })).toBe(`@page { margin: 1cm; }`)
})

test("multiple properties", () => {
    expect(css({
        '.test': {
            background: 'blue',
            width: 5
        }
    })).toBe(`.test { background: blue; width: 5px; }`)
})

test("nested styles", () => {
    expect(css({ '.test': { '::before': { width: 1 } } }))
        .toBe(`.test::before { width: 1px; }`)

    expect(css({ '.test': { $: { '::before': { width: 1 } } } }))
        .toBe(`.test ::before { width: 1px; }`)

    expect(css({ '.test': { $: { '&::before': { width: 1 } } } }))
        .toBe(`.test::before { width: 1px; }`)

    expect(css({ '.test': { $: { 'input': { width: 1 } } } }))
        .toBe(`.test input { width: 1px; }`)

    expect(css({ '.test': { $: { 'input&': { width: 1 } } } }))
        .toBe(`input.test { width: 1px; }`)

    expect(css({ '.test': { $: [['input', { width: 1 }]] } }))
        .toBe(`.test input { width: 1px; }`)

    expect(css({ '.test': { $: [[['input', 'button'], { width: 1 }]] } })).toBe(
        `.test input { width: 1px; }\n`
        + `.test button { width: 1px; }`)

    expect(css([
        [['.foo', '.bar'], {
            $: [
                [['.baz', '.qux'], { width: 1 }]
            ]
        }]
    ])).toBe(
        `.foo .baz { width: 1px; }\n`
        + `.foo .qux { width: 1px; }\n`
        + `.bar .baz { width: 1px; }\n`
        + `.bar .qux { width: 1px; }`
    )
})

test("multiple rules", () => {
    expect(css({
        '.test': {
            ':checked': { background: 'red' },
            $: {
                'input': { background: 'green' },
            },
            background: 'blue'
        }
    }).split('\n')).toEqual([
        '.test { background: blue; }',
        '.test:checked { background: red; }',
        '.test input { background: green; }'
    ])
})

test("@ groups", () => {
    expect(css({
        '.test': {
            $: {
                '@media screen': {
                    width: 1,
                    '::before': { width: 2 },
                    $: {
                        'input': { width: 3 }
                    }
                }
            }
        }
    }).split('\n')).toEqual([
        `@media screen { .test { width: 1px; } }`,
        `@media screen { .test::before { width: 2px; } }`,
        `@media screen { .test input { width: 3px; } }`
    ])

    expect(css({
        '.test': {
            $: {
                '@media screen': {
                    $: {
                        '@supports (display: grid)': {
                            display: 'grid'
                        }
                    }
                }
            }
        }
    })).toBe(`@media screen { @supports (display: grid) { .test { display: grid; } } }`)
})

test("font face", () => {
    expect(fontFaceCss({
        fontFamily: 'test',
        src: 'local(font)'
    })).toBe(`@font-face { font-family: test; src: local(font); }`)

    expect(fontFaceCss({
        fontFamily: 'test',
        src: [
            { url: 'foo' },
            { url: 'bar', format: 'woff' },
            { local: 'baz' }
        ]
    })).toBe(`@font-face { font-family: test; src: url(foo), url(bar) format(woff), local(baz); }`)
})

test("keyframes", () => {
    let result = keyframesCss('test', {
        from: { width: 1 },
        '50%': { width: 2 },
        70: { width: 3 },
        to: { width: 4 }
    })

    let resultLines = result.split('\n')
    expect(resultLines[0]).toBe('@keyframes test {')
    expect(resultLines.slice(1, -1)).toEqual(expect.arrayContaining([
        '  from { width: 1px; }',
        '  50% { width: 2px; }',
        '  70% { width: 3px; }',
        '  to { width: 4px; }'
    ]))
    expect(resultLines[resultLines.length - 1]).toBe('}')
})

test("anonymous animation", () => {
    expect(css({
        '.test': {
            animation: animation({
                from: { background: 'red' },
                to: { background: 'blue' }
            }, 100)
        }
    })).toBe(`.test { animation: test-animation-0 100ms ease 0ms 1 normal none running; }
@keyframes test-animation-0 {
  from { background: red; }
  to { background: blue; }
}`)
})

test("registered named animation", () => {
    expect(css({
        '.test': {
            animation: animation('named-animation', {
                from: { background: 'red' },
                to: { background: 'blue' }
            }, 100)
        }
    })).toBe(`.test { animation: named-animation-0 100ms ease 0ms 1 normal none running; }`)
})

test("unregistered named animation", () => {
    expect(css({
        '.test': {
            animation: {
                animationName: 'named-animation',
                keyframes: {
                    from: { background: 'red' },
                    to: { background: 'blue' }
                },
                animationDuration: 100
            }
        }
    })).toBe(`.test { animation: named-animation-0 100ms ease 0ms 1 normal none running; }
@keyframes named-animation-0 {
  from { background: red; }
  to { background: blue; }
}`)
})

test("multiple animations", () => {
    expect(css({
        '.test': {
            animation: [
                animation({ to: { width: 1 } }),
                animation({ to: { width: 2 } }, 2, 'ease-out', 3, 4, 'reverse', 'forwards', 'paused'),
                animation('pre-registered', { to: { width: 3 } }),
                'custom 123s'
            ]
        }
    })).toBe(`.test { animation: `
        + `test-animation-0 0ms ease 0ms 1 normal none running, `
        + `test-animation-1 2ms ease-out 3ms 4 reverse forwards paused, `
        + `pre-registered-0 0ms ease 0ms 1 normal none running, `
        + `custom 123s; `
        + `}
@keyframes test-animation-0 {
  to { width: 1px; }
}
@keyframes test-animation-1 {
  to { width: 2px; }
}`)
})

test("variables", () => {
    let timeVar = variable('transitionDelay', 'test')

    expect(css({ '.test': { ...timeVar.set(1) } })).toBe(`.test { --test-0: 1ms; }`)
    expect(css({ '.test': { animationDelay: timeVar.or(1) } })).toBe(`.test { animation-delay: var(--test-0, 1ms); }`)
})

test("functions", () => {
    expect(css({ '.test': { background: { linearGradient: ['blue', 'red'] } } }))
        .toBe('.test { background: linear-gradient(blue, red); }')

    expect(css({ '.test': { transform: { scaleX: 2 } } }))
        .toBe('.test { transform: scaleX(2); }')

    expect(css({ '.test': { transform: { rotate3d: [1, 2, 3, 4], skew: 5 } } }))
        .toBe('.test { transform: rotate3d(1, 2, 3, 4deg) skew(5deg); }')

    expect(css({ '.test': { gridTemplateRows: { repeat: [1, [2, { minmax: [3, 4] }]] } } }))
        .toBe('.test { grid-template-rows: repeat(1, 2px minmax(3px, 4px)); }')
})