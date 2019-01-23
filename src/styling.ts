import * as CSS from 'csstype';
import { css, cssPropertyValue, fontFaceCss, keyframesCss } from "./css";
import { AnimationDefinition, CSSProperties, FontFaceDefinition, KeyFrames, PropertyType, RegisteredStyles, Rules, StyleCollection, Styles, Variable } from "./types";

let registeredFontFaces = [] as FontFaceDefinition[];
let registeredRules = [] as Rules[];
let registeredStyles = [] as [string, RegisteredStyles][];
let registeredKeyframes = [] as [string, KeyFrames][];
let registeredVariables = [] as Variable<any>[];
let stylesheetRequired = true;
export let stylesheet: HTMLStyleElement;
export const RegisteredStyle = Symbol('StyleRendered');

export function style(name: string, styles: Styles): RegisteredStyles {
    name = register(registeredStyles, name, styles);
    (styles as RegisteredStyles)[RegisteredStyle] = false;
    return withToString(styles, () => name) as RegisteredStyles;
}

export function classes(styleCollection: StyleCollection): string {
    if (!styleCollection)
        return '';
    if (Array.isArray(styleCollection))
        return styleCollection.filter(Boolean).map(classes).join(' ');
    if (styleCollection[RegisteredStyle] || !stylesheetRequired)
        return styleCollection.toString();
    throw new Error(`'${styleCollection.toString()}' style is being used, but hasn't been added to the stylesheet.`);
}

export function cssRules(rules: Rules): Rules {
    registeredRules.push(rules);
    return rules;
}

export function fontFace(definition: FontFaceDefinition): FontFaceDefinition {
    registeredFontFaces.push(definition);
    return withToString(definition, () => definition.fontFamily);
}

export function animation(keyframes: KeyFrames, duration?: number | string, timing?: CSS.AnimationTimingFunctionProperty, delay?: number | string, iterationCount?: CSS.AnimationIterationCountProperty, direction?: CSS.AnimationDirectionProperty, fillMode?: CSS.AnimationFillModeProperty, playState?: CSS.AnimationPlayStateProperty): AnimationDefinition;
export function animation(name: string, keyframes: KeyFrames, duration?: number | string, timing?: CSS.AnimationTimingFunctionProperty, delay?: number | string, iterationCount?: CSS.AnimationIterationCountProperty, direction?: CSS.AnimationDirectionProperty, fillMode?: CSS.AnimationFillModeProperty, playState?: CSS.AnimationPlayStateProperty): AnimationDefinition;
export function animation(...args: any[]) {
    let registeredName: string | undefined;
    if (typeof args[0] == 'object')
        args.unshift(undefined);
    else
        registeredName = register(registeredKeyframes, args[0], args[1]);

    let [animationName, keyframes, animationDuration, animationTimingFunction, animationDelay, animationIterationCount, animationDirection, animationFillMode, animationPlayState] = args;
    return { animationName: registeredName || animationName, keyframes, animationDuration, animationTimingFunction, animationDelay, animationIterationCount, animationDirection, animationFillMode, animationPlayState };
}

export function variable<T extends keyof CSSProperties>(property: T, name?: string): Variable<T> {
    let varName = `--${name || property}-${registeredVariables.length}`;
    let variable = createVariable<T>(varName, property!);
    registeredVariables.push(variable);
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

function register<T>(registry: [string, T][], name: string, styling: T) {
    let suffixedName = `${name}-${registry.length}`;
    registry.push([suffixedName, styling]);
    return suffixedName;
}

function withToString<T>(obj: T, toString: () => string) {
    Object.defineProperty(obj, 'toString', { value: toString, enumerable: false });
    return obj;
}

export function updateStylesheet() {
    ensureStylesheet();
    stylesheet.innerHTML = getCss();
    registeredStyles.forEach(([, s]) => s[RegisteredStyle] = true);
}

/**
 * Can be used to disable the requirement that styles are added to the stylesheet before being used.
 * Useful mainly for tests. Not recommended in production.
 */
export function requireStylesheet(enable = true) {
    stylesheetRequired = enable;
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
        stylesheet.type = "text/css";
        document.head.append(stylesheet);
    }
}

export function resetStyles() {
    registeredStyles.forEach(([, s]) => delete s[RegisteredStyle]);
    registeredFontFaces = [];
    registeredStyles = [];
    registeredRules = [];
    registeredKeyframes = [];
}