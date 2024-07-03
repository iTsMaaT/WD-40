function countCommonChars(...strings) {
    if (strings.length === 0) return 0;
    return [...new Set(strings[0])]
        .filter(char => strings.every(str => str.includes(char)))
        .length;
}

module.exports = countCommonChars;