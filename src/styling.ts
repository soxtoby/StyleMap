import { Property } from "csstype";
import { css, cssProperties, cssPropertyValue, fontFaceCss, keyframesCss, splitProperties } from "./css";
import { AnimationDefinition, CSSProperties, ElementStyle, FontFaceDefinition, KeyFrames, PropertyType, Registerable, RegisteredStyles, Rules, StyleCollection, Styles, Variable } from "./types";

export const RegistrationId = Symbol('RegistrationId');
export type Registration = { [RegistrationId]?: string; }
type NamedRegistration<T> = readonly [string, T] & Registration;

let registeredFontFaces = [] as FontFaceDefinition[];
let registeredRules = [] as Rules[];
let registeredStyles = [] as NamedRegistration<RegisteredStyles>[];
let registeredKeyframes = [] as NamedRegistration<KeyFrames>[];
let registeredVariables = [] as Variable<any>[];
let stylesheetRequired = true;
let hmrEnabled = !!(module as any).hot;
let updateTimeout = 0;
export let stylesheet: HTMLStyleElement;
export const StyleRendered = Symbol('StyleRendered');

export function elementStyle(styles: CSSProperties): ElementStyle {
    let { properties, nested, keyframes } = splitProperties(styles);

    if (nested.length)
        console.warn('Cannot put nested properties in an element style:', nested);

    if (keyframes.length)
        console.warn('Cannot put keyframes inline in an element style:', keyframes);

    let elementStyle = {} as any;
    properties.forEach(([property, value]) => elementStyle[property] = cssPropertyValue(property, value));
    return withToString(elementStyle, () => cssProperties(properties));
}

export function style(name: string, styles: Styles): RegisteredStyles {
    name = register(registeredStyles, name, styles as RegisteredStyles, 1);
    return withToString(styles, () => name) as RegisteredStyles;
}

export function classes(styleCollection: StyleCollection): string {
    if (!styleCollection)
        return '';
    if (Array.isArray(styleCollection))
        return styleCollection.filter(Boolean).map(classes).join(' ');
    if (styleCollection[StyleRendered] || !stylesheetRequired)
        return styleCollection.toString();
    throw new Error(`'${styleCollection.toString()}' style is being used, but hasn't been added to the stylesheet.`);
}

export function cssRules(rules: Rules): Rules {
    autoUpdateStylesheet();
    registeredRules.push(rules);
    return rules;
}

export function fontFace(definition: FontFaceDefinition): FontFaceDefinition {
    autoUpdateStylesheet();
    registeredFontFaces.push(definition);
    return withToString(definition, () => definition.fontFamily);
}

export function animation(keyframes: KeyFrames, duration?: number | string, timing?: Property.AnimationTimingFunction, delay?: number | string, iterationCount?: Property.AnimationIterationCount, direction?: Property.AnimationDirection, fillMode?: Property.AnimationFillMode, playState?: Property.AnimationPlayState): AnimationDefinition;
export function animation(name: string, keyframes: KeyFrames, duration?: number | string, timing?: Property.AnimationTimingFunction, delay?: number | string, iterationCount?: Property.AnimationIterationCount, direction?: Property.AnimationDirection, fillMode?: Property.AnimationFillMode, playState?: Property.AnimationPlayState): AnimationDefinition;
export function animation(...args: any[]) {
    let registeredName: string | undefined;
    if (typeof args[0] == 'object')
        args.unshift(undefined);
    else
        registeredName = register(registeredKeyframes, args[0], args[1], 1);

    let [animationName, keyframes, animationDuration, animationTimingFunction, animationDelay, animationIterationCount, animationDirection, animationFillMode, animationPlayState] = args;
    return { animationName: registeredName || animationName, keyframes, animationDuration, animationTimingFunction, animationDelay, animationIterationCount, animationDirection, animationFillMode, animationPlayState };
}

export function variable<T extends keyof CSSProperties & string>(property: T, name?: string): Variable<T> {
    autoUpdateStylesheet();

    let namePrefix = name || property;
    let [id, index] = identifyRegistration(registeredVariables, namePrefix, 1);
    let varName = `--${namePrefix}-${index}`;

    let variable = createVariable<T>(varName, property);
    variable[RegistrationId] = id;
    registeredVariables[index] = variable;
    return variable;
}

function createVariable<T extends keyof CSSProperties>(name: string, property: string, fallback?: PropertyType<T> | Variable<T>): Variable<T> {
    return Object.assign(Object.create({
        set(value: PropertyType<T>) {
            return { [name]: cssPropertyValue(property, value) };
        },
        or(newFallback: PropertyType<T> | Variable<T>) {
            return createVariable<T>(name, property, isVariable(fallback) ? fallback.or(newFallback) : newFallback);
        },
        toString() {
            return `var(${[name, cssPropertyValue(property, fallback)].filter(Boolean).join(', ')})`;
        }
    }), { var: [name, fallback] });
}

function isVariable<T extends keyof CSSProperties>(value: any): value is Variable<T> {
    return typeof value == 'object' && typeof value.or == 'function';
}

function register<T extends Registerable>(registry: NamedRegistration<T>[], name: string, styling: T, sourceFrameOffset: number) {
    autoUpdateStylesheet();

    let [id, index] = identifyRegistration(registry, name, sourceFrameOffset + 1);
    let suffixedName = `${name}-${index}`;
    if (registry[index]?.[1][StyleRendered] === false)
        throw new Error(`'${suffixedName}' style registered more than once between stylesheet updates. Style names must be unique within a module when HMR support is enabled.`);
    registry[index] = Object.assign([suffixedName, styling] as const, { [RegistrationId]: id });
    styling[StyleRendered] = false;
    return suffixedName;
}

function identifyRegistration<R extends Registration>(registrations: R[], name: string, sourceFrameOffset: number): [id: string | undefined, index: number] {
    if (!hmrEnabled)
        return [undefined, registrations.length];

    let stack = new Error('msg').stack?.split('\n') ?? [];
    sourceFrameOffset++; // For this function
    if (stack[0].includes('msg'))
        sourceFrameOffset++; // Chrome includes error message at top of stack, but Firefox does not
    let callerModule = stack[sourceFrameOffset].split(new RegExp('(?<!\\/)@|\\('))[0]; // Strip off line number - module or function level is good enough
    let id = `${name}:${callerModule}`;

    let existingRegistrationIndex = registrations.findIndex(r => r[RegistrationId] == id);
    return [id, existingRegistrationIndex >= 0 ? existingRegistrationIndex : registrations.length];
}

function withToString<T>(obj: T, toString: () => string) {
    Object.defineProperty(obj, 'toString', { value: toString, enumerable: false });
    return obj;
}

function autoUpdateStylesheet() {
    // Auto-update styles if stylesheet has already been rendered
    if (hmrEnabled && stylesheet) {
        clearTimeout(updateTimeout);
        updateTimeout = setTimeout(updateStylesheet) as any as number;
    }
}

export function updateStylesheet() {
    ensureStylesheet();
    stylesheet.innerHTML = getCss() + '\n/*# sourceURL=stylemap.css */';
    registeredStyles.forEach(([, s]) => s[StyleRendered] = true);
}

/**
 * Can be used to disable the requirement that styles are added to the stylesheet before being used.
 * Useful mainly for tests. Not recommended in production.
 */
export function requireStylesheet(enable = true) {
    stylesheetRequired = enable;
}

/**
 * Enable or disable experimental support for Hot Module Replacement (HMR). Enabled by default if `module.hot` is available.
 * Not recommended in production.
 */
export function enableHmrSupport(enable = true) {
    hmrEnabled = enable;
}

export function getCss() {
    return registeredFontFaces.map(fontFaceCss)
        .concat(registeredRules.map(css))
        .concat(registeredStyles.map(([name, styles]) => css({ [`.${name}`]: styles })))
        .concat(registeredKeyframes.map(([name, frames]) => keyframesCss(name, frames)))
        .join('\n');
}

function ensureStylesheet() {
    if (!stylesheet) {
        stylesheet = document.createElement('style');
        document.head.appendChild(stylesheet);
    }
}

export function resetStyles() {
    registeredStyles.forEach(([, s]) => delete (s as any)[StyleRendered]);
    registeredFontFaces = [];
    registeredStyles = [];
    registeredRules = [];
    registeredKeyframes = [];
}