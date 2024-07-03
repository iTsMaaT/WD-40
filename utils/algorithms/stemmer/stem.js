const stemmer = {};
const cache = {};

/**
 * Checks if a word is in the exceptions list or map and returns the word if found.
 * @param {string} word - The word to check.
 * @param {Array|string} exceptions - The list or map of exceptions.
 * @returns {string|boolean} - The word if found in exceptions, otherwise false.
 */
stemmer.except = function(word, exceptions) {
    if (Array.isArray(exceptions)) 
        return exceptions.includes(word) ? word : false;
    else 
        return Object.prototype.hasOwnProperty.call(exceptions, word) ? exceptions[word] : false;
    
    
};

/**
 * Applies a series of replacement patterns to a word.
 * @param {string} word - The word to be transformed.
 * @param {number|Array} offset - The minimum offset for applying replacements or the replacement array.
 * @param {Array} [replace] - An array of patterns and replacements.
 * @returns {string} - The transformed word.
 */
stemmer.among = function among(word, offset, replace) {
    if (!replace) {
        replace = offset;
        offset = 0;
    }

    const initial = word.slice();

    for (let i = 0; i < replace.length; i += 2) {
        const pattern = cache[replace[i]] || (cache[replace[i]] = new RegExp(replace[i] + "$"));
        const replacement = replace[i + 1];

        word = word.replace(pattern, function(match, ...args) {
            const off = args[args.length - 2];
            return (off >= offset) ? (typeof replacement === "function" ? replacement(...args) : replacement) : match + " ";
        });

        if (word !== initial) break;
    }

    return word.replace(/ /g, "");
};

module.exports = stemmer;