export function defaultUnitAndValue(unit: string, value: string) {
    return (v: any) => defaultUnit(unit)(v) || defaultValue(value)(v);
}

export function defaultUnit(unit: string, coerceToNumber = false) {
    return defaultUnit;

    function defaultUnit(value: undefined): undefined;
    function defaultUnit(value: any): string;
    function defaultUnit(value: any) {
        return typeof value == 'undefined' ? undefined
            : (coerceToNumber && !Number.isNaN(Number(value)) || typeof value == 'number') ? `${value}${unit}`
                : value as string;
    }
}

export function defaultValue(defaultValue: string) {
    return (value: any) => typeof value == 'undefined' ? defaultValue : value;
}