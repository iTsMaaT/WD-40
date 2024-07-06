/**
 * @module ConsoleColor
 */

const allStyles = {
    Reset: "\x1b[0m",
    Bright: "\x1b[1m",
    Dim: "\x1b[2m",
    Underscore: "\x1b[4m",
    Blink: "\x1b[5m",
    Reverse: "\x1b[7m",
    Hidden: "\x1b[8m",

    FgBlack: "\x1b[30m",
    FgRed: "\x1b[31m",
    FgGreen: "\x1b[32m",
    FgYellow: "\x1b[33m",
    FgBlue: "\x1b[34m",
    FgMagenta: "\x1b[35m",
    FgCyan: "\x1b[36m",
    FgWhite: "\x1b[37m",
    FgGray: "\x1b[90m",

    BgBlack: "\x1b[40m",
    BgRed: "\x1b[41m",
    BgGreen: "\x1b[42m",
    BgYellow: "\x1b[43m",
    BgBlue: "\x1b[44m",
    BgMagenta: "\x1b[45m",
    BgCyan: "\x1b[46m",
    BgWhite: "\x1b[47m",
    BgGray: "\x1b[100m",
};

const foregroundColor = {
    black: "FgBlack",
    red: "FgRed",
    green: "FgGreen",
    yellow: "FgYellow",
    blue: "FgBlue",
    magenta: "FgMagenta",
    cyan: "FgCyan",
    white: "FgWhite",
    gray: "FgGray",
};

const backgroundColor = {
    black: "BgBlack",
    red: "BgRed",
    green: "BgGreen",
    yellow: "BgYellow",
    blue: "BgBlue",
    magenta: "BgMagenta",
    cyan: "BgCyan",
    white: "BgWhite",
    gray: "BgGray",
};

const textStyle = {
    reset: "Reset",
    bright: "Bright",
    dim: "Dim",
    underscore: "Underscore",
    blink: "Blink",
    reverse: "Reverse",
    hidden: "Hidden",
};

/**
 * Applies colors and styles to the given text.
 * 
 * @param {string} text - The text to be styled.
 * @param {string} [fgColor] - The foreground color.
 * @param {string} [bgColor] - The background color.
 * @param {...string} styles - Additional styles.
 * @returns {string} - The styled text.
 */
function colorText(text, fgColor, bgColor, ...styles) {
    let colorCodes = "";
    if (fgColor && allStyles[fgColor]) colorCodes += allStyles[fgColor];
    if (bgColor && allStyles[bgColor]) colorCodes += allStyles[bgColor];
    styles.forEach(s => {
        if (allStyles[s]) colorCodes += allStyles[s];
    });
    return `${colorCodes}${text}${allStyles.Reset}`;
}

module.exports = { colorText, foregroundColor, backgroundColor, textStyle };