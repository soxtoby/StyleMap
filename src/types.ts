import * as CSS from 'csstype';
import { RegisteredStyle } from './styling';

type Overwrite<T, U> = Omit<T, keyof T & keyof U> & U;
type Defined<T> = Exclude<T, undefined>;
type AllowMultiple<T, TKeys extends keyof T> = { [K in keyof T]: K extends TKeys ? T[K] | Defined<T[K]>[] : T[K]; };

export type TLength = string | number;

type BaseProperties = CSS.Properties<TLength>;
type ExtendedProperties = Overwrite<BaseProperties, {
    animation?: CSS.AnimationProperty | AnimationDefinition;
    animationDuration?: CSS.GlobalsString | number;
    animationDelay?: CSS.GlobalsString | number;
    background?: CSS.BackgroundProperty<TLength> | BackgroundImageFunctions;
    backgroundImage?: CSS.BackgroundProperty<TLength> | BackgroundImageFunctions;
    transitionDuration?: CSS.GlobalsString | number;
    transitionDelay?: CSS.GlobalsString | number;
    transform?: CSS.TransformProperty | TransformFunctions;
}>;
type VariableProperties = { [K in keyof ExtendedProperties]: ExtendedProperties[K] | VariableOfType<PropertyType<K>>; }
type MultiValueProperties = AllowMultiple<VariableProperties,
    'animation'
    | 'animationDelay'
    | 'animationDirection'
    | 'animationDuration'
    | 'animationFillMode'
    | 'animationIterationCount'
    | 'animationName'
    | 'animationPlayState'
    | 'animationTimingFunction'
    | 'background'
    | 'backgroundAttachment'
    | 'backgroundBlendMode'
    | 'backgroundClip'
    | 'backgroundColor'
    | 'backgroundImage'
    | 'backgroundOrigin'
    | 'backgroundPosition'
    | 'backgroundPositionX'
    | 'backgroundPositionY'
    | 'backgroundRepeat'
    | 'backgroundSize'
    | 'borderColor'
    | 'borderRadius'
    | 'borderStyle'
    | 'borderWidth'
    | 'boxShadow'
    | 'fontFamily'
    | 'fontFeatureSettings'
    | 'margin'
    | 'padding'
    | 'textShadow'
    | 'transition'
    | 'transitionDelay'
    | 'transitionDuration'
    | 'transitionProperty'
    | 'transitionTimingFunction'
>;
export type CSSProperties = MultiValueProperties;

export interface Styles extends CSSProperties {
    $?: Rules;
    ':active'?: Styles;
    ':checked'?: Styles;
    ':default'?: Styles;
    ':defined'?: Styles;
    ':disabled'?: Styles;
    ':empty'?: Styles;
    ':enabled'?: Styles;
    ':first'?: Styles;
    ':first-child'?: Styles;
    ':first-of-type'?: Styles;
    ':focus'?: Styles;
    ':focus-visible'?: Styles;
    ':focus-within'?: Styles;
    ':host'?: Styles;
    ':hover'?: Styles;
    ':indeterminate'?: Styles;
    ':in-range'?: Styles;
    ':invalid'?: Styles;
    ':last-child'?: Styles;
    ':last-of-type'?: Styles;
    ':left'?: Styles;
    ':link'?: Styles;
    ':only-child'?: Styles;
    ':only-of-type'?: Styles;
    ':optional'?: Styles;
    ':out-of-range'?: Styles;
    ':read-only'?: Styles;
    ':read-write'?: Styles;
    ':required'?: Styles;
    ':right'?: Styles;
    ':root'?: Styles;
    ':scope'?: Styles;
    ':target'?: Styles;
    ':valid'?: Styles;
    ':visited'?: Styles;
    '::after'?: Styles;
    '::backdrop '?: Styles;
    '::before'?: Styles;
    '::cue'?: Styles;
    '::first-letter'?: Styles;
    '::first-line'?: Styles;
    '::placeholder '?: Styles;
    '::selection'?: Styles;
}

export interface Registered {
    [RegisteredStyle]: boolean;
}

export interface RegisteredStyles extends Styles, Registered {
    /** Returns class name */
    toString(): string;
}

export type ElementStyle = CSS.Properties<string>;

export interface Rules {
    [selector: string]: Styles;
}

export type StyleCollection = RegisteredStyles | StyleCollectionArray | undefined | false;

export interface StyleCollectionArray extends Array<StyleCollection> { }

export type AnimationDefinition = Pick<VariableProperties,
    'animationName'
    | 'animationDuration'
    | 'animationTimingFunction'
    | 'animationDelay'
    | 'animationIterationCount'
    | 'animationDirection'
    | 'animationFillMode'
    | 'animationPlayState'>
    & { keyframes?: KeyFrames };

export interface TransformFunctions {
    matrix?: string | [number, number, number, number, number, number];
    matrix3d?: string | [number, number, number, number, number, number, number, number, number, number, number, number, number, number, number, number];
    translate?: TLength | [TLength, TLength?];
    translateX?: TLength;
    translateY?: TLength;
    translateZ?: TLength;
    translate3d?: TLength | [TLength, TLength, TLength];
    scale?: number | [number, number?];
    scaleX?: number;
    scaleY?: number;
    scaleZ?: number;
    scale3d?: string | [number, number, number];
    rotate?: TLength;
    rotateX?: TLength;
    rotateY?: TLength;
    rotateZ?: TLength;
    rotate3d?: TLength | [number, number, number, TLength];
    skew?: TLength | [TLength, TLength?];
    skewX?: TLength;
    skewY?: TLength;
    perspective?: TLength;
}

export interface BackgroundImageFunctions {
    url?: string;
    linearGradient?: string | (string | CSS.Color)[];
    radialGradient?: string | (string | CSS.Color)[];
    conicGradient?: string | (string | CSS.Color)[];
    repeatingLinearGradient?: string | (string | CSS.Color)[];
    repeatingRadialGradient?: string | (string | CSS.Color)[];
}

export type FontFaceDefinition = Overwrite<CSS.FontFace, {
    fontFamily: string;
    src: FontFaceSrc | FontFaceSrc[]
}>;

export type FontFaceSrc = string | { local: string } | { url: string, format?: FontFaceFormat };

export type FontFaceFormat = 'woff' | 'woff2' | 'truetype' | 'opentype' | 'embedded-opentype' | 'svg' | string;

export interface KeyFrames {
    from?: CSSProperties;
    to?: CSSProperties;
    [percentage: string]: CSSProperties | undefined;
    [percentage: number]: CSSProperties | undefined;
}

export type PropertyType<T extends keyof CSSProperties> = Defined<ExtendedProperties[T]>;

interface VariableOfType<T> {
    /** Enables mixing variables of different properties with same type, but won't actually exist on the object. */
    __type: T;
}

/** Will resolve to var(--name, fallback), with normal property defaults applied. */
export interface Variable<T extends keyof CSSProperties> extends VariableOfType<PropertyType<T>> {
    /** [name, fallback] */
    var: [string, PropertyType<T> | VariableOfType<PropertyType<T>> | undefined];
    /** Returns an object to spread into styles to set the value of the variable. */
    set(value: PropertyType<T>): object;
    /** Creates a variable with a fallback. */
    or(fallback: PropertyType<T> | VariableOfType<PropertyType<T>>): Variable<T>;
    /** 
     * Returns var(--name, fallback), using the defaults for the declared property instead of the property being set.
     * Useful in template strings.
     */
    toString(): string;
}