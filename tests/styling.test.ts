import { beforeEach, expect, mock, test } from "bun:test"
import { animation, classes, cssRules, elementStyle, fontFace, requireStylesheet, resetStyles, style, stylesheet, updateStylesheet, variable } from "../src/styling"
import { Styles } from "../src/types"

const sourceUrl = '\n/*# sourceURL=stylemap.css */'

beforeEach(() => {
    resetStyles()
})

test("rules added to stylesheet", () => {
    cssRules({ '.test1': { width: 1 } })
    cssRules({ '.test2': { width: 2 } })

    updateStylesheet()

    expect(stylesheet.parentElement).toBe(document.head)
    expect(stylesheet.innerHTML).toBe(`.test1 { width: 1px; }
.test2 { width: 2px; }${sourceUrl}`)
})

test("styles added to stylesheet", () => {
    style('test', { width: 1 })
    style('test', { width: 2 })
    style('marker')

    updateStylesheet()

    expect(stylesheet.parentElement).toBe(document.head)
    expect(stylesheet.innerHTML).toBe(`.test-0 { width: 1px; }
.test-1 { width: 2px; }${sourceUrl}`)
})

test("font faces added to stylesheet", () => {
    fontFace({ fontFamily: 'test', src: 'local(font)' })

    updateStylesheet()

    expect(stylesheet.parentElement).toBe(document.head)
    expect(stylesheet.innerHTML).toBe(`@font-face { font-family: test; src: local(font); }${sourceUrl}`)
})

test("keyframes added to stylesheet", () => {
    animation('test', { from: { width: 1 } })
    animation('test', { from: { width: 2 } })

    updateStylesheet()

    expect(stylesheet.parentElement).toBe(document.head)
    expect(stylesheet.innerHTML).toBe(`@keyframes test-0 {
  from { width: 1px; }
}
@keyframes test-1 {
  from { width: 2px; }
}${sourceUrl}`)
})

test("elementStyle returns evaluated properties", () => {
    let result = elementStyle({
        width: 1,
        padding: [1, 2, 3, 4],
        animation: { animationName: 'test', animationDuration: 1 }
    })

    expect(result.width).toEqual('1px')
    expect(result.padding).toEqual('1px 2px 3px 4px')
    expect(result.animation).toEqual('test 1ms ease 0ms 1 normal none running')
})

test("elementStyle toString returns style", () => {
    let result = elementStyle({
        width: 1,
        padding: [1, 2, 3, 4],
        animation: { animationName: 'test', animationDuration: 1 }
    })

    expect(result.toString()).toEqual('width: 1px; padding: 1px 2px 3px 4px; animation: test 1ms ease 0ms 1 normal none running;')
})

test("elementStyle warns about nested styles", () => {
    console.warn = mock()

    elementStyle({ ':hover': { width: 1 } } as Styles)
    expect(console.warn).toBeCalledWith('Cannot put nested properties in an element style:', expect.arrayContaining([['&:hover', { width: 1 }]]))

    elementStyle({ $: { '.nested': { height: 2 } } } as Styles)
    expect(console.warn).toBeCalledWith('Cannot put nested properties in an element style:', expect.arrayContaining([['.nested', { height: 2 }]]))
})

test("elementStyle warns about inline keyframes", () => {
    console.warn = mock()

    elementStyle({ animation: { keyframes: { from: { width: 1 }, to: { width: 2 } } } })
    expect(console.warn).toBeCalledWith('Cannot put keyframes inline in an element style:', expect.arrayContaining([['inline-animation-0', { from: { width: 1 }, to: { width: 2 } }]]))
})

test("cssRules returns rules", () => {
    let styles = { '.test': { width: 1 } }
    expect(cssRules(styles)).toEqual(styles)
})

test("style returns styles", () => {
    let styles = { width: 1 }
    expect(style('test', styles) as Styles).toEqual(styles)
})

test("style toString returns class name", () => {
    expect(style('test', { width: 1 }).toString()).toBe('test-0')
    expect(style('test', { width: 1 }).toString()).toBe('test-1')
})

test("fontFace returns definition", () => {
    let definition = { fontFamily: 'test', src: 'local(font)' }
    expect(fontFace(definition)).toEqual(definition)
})

test("fontFace toString returns font family", () => {
    expect(fontFace({ fontFamily: 'test', src: 'local(font)' }).toString()).toBe('test')
})

test("classes", () => {
    let style0 = style('style', { width: 0 })
    let style1 = style('style', { width: 1 })
    let style2 = style('style', { width: 2 })
    updateStylesheet()

    expect(classes(undefined)).toBe('')
    expect(classes(false)).toBe('')
    expect(classes([])).toBe('')
    expect(classes([undefined, false])).toBe('')
    expect(classes(style0)).toBe('style-0')
    expect(classes([style0, false, style1, undefined, style2])).toBe('style-0 style-1 style-2')
    expect(classes([style0, [style1, [style2]]])).toBe('style-0 style-1 style-2')
})

test("classes for unrendered styles", () => {
    let style0 = style('style', { width: 0 })
    updateStylesheet()
    let style1 = style('style', { width: 1 })

    expect(() => classes([style0, style1])).toThrow()

    updateStylesheet()

    expect(() => classes([style0, style1])).not.toThrow()

    resetStyles()

    expect(() => classes([style0, style1])).toThrow()

    requireStylesheet(false)

    expect(() => classes([style0, style1])).not.toThrow()

    requireStylesheet(true)
})

test("variables", () => {
    let test1 = variable('width', 'test')
    let test2 = variable('width', 'test')
    let defaultName = variable('width')

    expect(test1.toString()).toBe('var(--test-0)')
    expect(test2.toString()).toBe('var(--test-1)')
    expect(defaultName.toString()).toBe('var(--width-2)')
    expect(test1.set('value')).toEqual({ '--test-0': 'value' })
    expect(test1.or('fallback') as object).toEqual({ var: ['--test-0', 'fallback'] })
    expect(test1.or('fallback').toString()).toBe('var(--test-0, fallback)')
    expect(test1.or(1).toString()).toBe('var(--test-0, 1px)')
    expect(test1.or(test2).or('fallback').toString()).toBe('var(--test-0, var(--test-1, fallback))')
    expect(elementStyle(test1.set(test2)).toString()).toBe('--test-0: var(--test-1);')
    expect(() => test1.set(test1)).toThrow(`Variable --test-0 cannot be set to itself.`)
})