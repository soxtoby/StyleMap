# StyleMap
CSS-in-JS with a focus on ease of use, ease of debugging and type-safety.

## Getting Started
Install with yarn or NPM:
```
yarn add stylemap
```
```
npm install --save stylemap
```
Style some elements!
```tsx
import { styles, updateStylesheet, classes } from 'stylemap';

let hotPinkText = style('hotPink', { color: '#FF69B4' });

updateStylesheet();

let HotPink = ({children}) => <div className={classes(hotPinkText)}>{children}</div>;
```
(this example uses React, but you can use whatever you like)

Note the use of `updateStylesheet()` - registered styles must to added to the StyleMap stylesheet before they take effect. This is a deliberate design to avoid creating styles on-the-fly, which is slow and unpredictable.

## Creating Styles
Styles are created by passing a name and `Styles` object into the `style` function:
```ts
let myStyle = style('style-name', { color: 'red' });
```
Note that the name will have a number appended to it to create the CSS class name ([see below](#generated-names) for more detail).

StyleMap comes with TypeScript types, so you'll get autocomplete and type information when building the `Styles` object passed into `style`.

Property names are camel case (e.g. `paddingTop`), and will be converted to snake case in CSS (e.g. `padding-top`). Vendor-specific properties are pascal case (e.g. `MozTabSize`) and are converted to snake case with a leading dash (e.g. `-moz-tab-size`).

### Property Types
All CSS properties accept a string, but some properties also accept a number, which will automatically be converted to a default unit (usually `px`, [see below](#overriding-defaults) for more detail).

### Pseudo Class/Element Selectors
Basic pseudo class and element selectors can be included in a `Styles` object and will be appended to the parent selector to create a new CSS rule.

Code:
```ts
style('textbox', { ':focus': { background: 'lightgreen' } });
```
CSS:
```css
.textbox-0:focus { background: lightgreen; }
```

### Nested Selectors
More complex selectors can be created using the nesting property, `$`. By default, nested selectors will be appended to the parent selector with a space in-between:

Code:
```ts
style('parent', { $: {
    'input': { background: 'white' },
    '> label': { color: 'black' }
} });
```
CSS:
```css
.parent-0 input { background: white; }
.parent-0 > label { color: black; }
```

Selectors with `&` in them will instead have their `&`s replaced with the parent selector.

Code:
```ts
style('parent', { $: { 
    'input&': { color: 'blue' },
    '&:disabled': { color: 'grey' }
} });
```
CSS:
```css
input.parent-0 { color: blue; }
.parent-0:disabled { color: grey; }
```

Both `@media` and `@supports` can be nested inside a style as selectors, and will wrap the provided styling in a conditional group.

Code:
```ts
style('myThing', { $: { '@media screen': { fontSize: 'large' } } });
```
CSS:
```css
@media screen { .myThing-0 { font-size: large; } }
```

### Multiple Values
Some properties allow multiple values as an array, which will be separated appropriately. E.g.
```ts
style('ugly-box', {
    padding: [4, 8, 4, 16],
    background: ['linear-gradient(blue, red)', 'purple']
});
```
CSS:
```css
.ugly-box-0 {
  padding: 4px 8px 4px 16px;
  background: linear-gradient(blue, red), purple;
}
```

### CSS Functions
Some properties allow specifying the value as an object with CSS functions for the property names. E.g.
```ts
style('squeeze', { transform: { scale: 0.8, rotate: '30deg' } });
```
CSS:
```css
.squeeze-0 { transform: scale(0.8) rotate(30deg); }
```

## Using Styles
### Class Names
To get the class name of a style, use the `classes` function.
```ts
let myStyle = style('styleName', { color: 'red' });
let className = classes(myStyle); // Returns e.g. 'styleName-0'
```
The `classes` function will also take in a nested array of styles, `false` or `undefined`, to produce a space-separated list of class names.
```ts
let style1 = style('red', { color: 'red' });
let style2 = style('blue', { color: 'blue' });
let undefinedStyle = undefined;
let condition = false;

classes([style1, [style2, undefinedStyle]]); // Returns e.g. 'red-0 blue-1'
classes([style1, condition && style2]); // Returns e.g. 'red-0`
```
If any of the styles passed in to `classes` have not yet been rendered to the stylesheet, it will throw an error to prevent you from using styles that won't show up.

### Inline Element Styles
StyleMap styles can be converted to more standard CSS style objects with the `elementStyle` function.
These objects can be passed directly to a React style prop, or `toString`'d for use as an element's style attribute.
```ts
// Returns { width: '100px', padding: '2px 4px' }
let inlineStyle = elementStyle({ width: 100, padding: [2, 4] });
// toString returns 'width: 100px; padding: 2px 4px;'
element.style = inlineStyle.toString();
```
Note that nested selectors/styles, and inline animation keyframes are not supported by `elementStyle`.

### Style References
To reference one style from another style, you can use template strings:
```ts
let style1 = style('inner', { border: '1px solid red' });
let style2 = style('outer', {
    $: {
        [`.${style1}`]: { borderColor: 'green' }
    }
});
```
CSS:
```css
.inner-0 { border: 1px solid red; }
.outer-1 .inner-0 { border-color: green; }
```
Note the `.` before `${style1}`, as a style's `toString()` only returns the class name.

### Mixins
The `style` function returns an object, which makes it easy to mix-in with other styles:

```ts
let red = style('red', { color: 'red' });
let error = style('error', {
    fontWeight: 'bold',
    ...red
});
```

## Animations
Animations can be defined inside another style using the `animation` function:
```ts
style('popup', {
    animation: animation({
        from: {
            opacity: 0,
            transform: { translateY: '100%' }
        },
        to: {
            opacity: 1,
            transform: 'none'
        }
    }, 100, 'ease-out')
});
```
CSS:
```css
.popup-0 { animation: popup-0-animation-0 100ms ease-out 0ms 1 normal none running; }
@keyframes popup-0-animation-0 {
  from { opacity: 0; transform: translateY(100%); }
  to { opacity: 1; transform: none; }
}
```
Note that unspecified animation properties are filled in with their defaults.

Animations can also be defined outside a style, to be re-used:
```ts
let reusableAnimation = animation('reuse-me', { 50: { transform: { scale: 2 } } }, '1s');
style('animated', {
    animation: reusableAnimation,
    animationIterationCount: 'infinite'
});
```
CSS:
```css
.animated-0 {
  animation: reuse-me-0 1s ease 0ms 1 normal none running;
  animation-iteration-count: infinite;
}
@keyframes reuse-me-0 {
  50% { transform: scale(2); }
}
```

## Custom CSS Rules
Not all styling will be tied to CSS classes. Custom CSS rules can be registered with the `cssRules` function.

Code:
```ts
cssRules({
    'body': { background: 'white' },
    'input:focus': { outlineColor: 'blue' }
});
```
CSS:
```css
body { background: white; }
input:focus { outline-color: blue; }
```

## Custom Fonts
Custom font faces can be registered with the `fontFace` function:
```ts
let myFont = fontFace({
    fontFamily: 'myFont',
    fontWeight: 'bold',
    src: [
        { url: '/myFont.woff', format: 'woff' },
        { local: 'Arial' }
    ]
})
```
CSS:
```css
@font-face {
    font-family: myFont;
    font-weight: bold;
    src: url(/myfont.woff) format(woff), local(Arial);
}
```

To use the font in a style, reference the font face's `fontFamily` property:
```ts
style('special-text': { fontFamily: myFont.fontFamily });
```

## CSS Variables
Since styles are declared statically, CSS variables are indispensable for dynamic styling. StyleMap variables provide type-safety and default units by specifying the CSS property they will be used for.

First declare the variable:
```ts
let dynamicColor = variable('color', 'variable-name'); // variable name is optional
```
then use the variable in a style:
```ts
let dynamicStyle = style('dynamic', { color: dynamicColor });
```
and set the variable in either a CSS rule, or an element's `style` attribute:
```tsx
cssRules({ '::global': { ...dynamicColor.set('red') } });
// or
<div style={{ ...dynamicColor.set('blue') }} />
```
(once again, this example uses React, but you can use whatever you like)

## Generated Names
All generated class, keyframe, and variable names have a hyphenated index appended to their names. This provides the following benefits:
- Avoids conflicts with CSS from outside StyleMap.
- Ensures that names are unique, even if the same name is used more than once.
- Indicates the order that styles were registered, which helps when debugging overridden properties.

## Overriding Defaults
StyleMap exposes a `propertyDefaults` object, which is a map of property name to adjustment function. These adjustment functions are applied to property values to convert them to CSS strings, and can be used to provide default values, default units, or potentially other conversions. If a property isn't specified in `popertyDefaults`, the default behavior is to convert numbers to `px`.

StyleMap also exposes a `functionDefaults` object, which is a map of function name to adjustment function. These adjustment functions work similarly to property adjustment functions, but are applied to function arguments, when used in [function objects](#css-functions).

If you want to override any default values or units, you can used the provided `defaultValue`, `defaultUnit`, and `defaultUnitAndValue` functions.