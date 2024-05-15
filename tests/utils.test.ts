import { expect, test } from "bun:test"
import { defaultUnit, defaultUnitAndValue, defaultValue } from "../src/utils"

test("defaultUnit", () => {
    let sut = defaultUnit('foo')
    expect(sut(undefined)).toBeUndefined()
    expect(sut(1)).toBe('1foo')
    expect(sut('1')).toBe('1')
    expect(defaultUnit('foo', true)('1')).toBe('1foo')
})

test("defaultValue", () => {
    let sut = defaultValue('foo')
    expect(sut(undefined)).toBe('foo')
    expect(sut('bar')).toBe('bar')
})

test("defaultUnitAndValue", () => {
    let sut = defaultUnitAndValue('unit', 'value')
    expect(sut(undefined)).toBe('value')
    expect(sut(1)).toBe('1unit')
    expect(sut('text')).toBe('text')
})