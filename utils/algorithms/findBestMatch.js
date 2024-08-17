/**
 * Algorithms for finding the best match between a given input and a list of values.
 * @enum {string}
 */
const algorithms = {
    LEVENSHTEIN_DISTANCE: "leven",
    FUZZY_MATCH: "fuzzy",
};

/**
 * Find the best match between a given input and a list of values using a specified algorithm.
 * 
 * @param {string} algorithm - The algorithm to use for finding the best match.
 * @param {string} input - The input string to find the best match for.
 * @param {string[]} values - An array of strings to find the best match in.
 * @returns {{match: string, score: number}} An object containing the best match and its score.
 * @throws {Error} If an invalid algorithm is provided.
 */
const findBestMatch = (algorithm, input, values) => {
    if (!Object.values(algorithms).includes(algorithm))
        throw new Error("Invalid algorithm provided");
    

    switch (algorithm) {
        case algorithms.LEVENSHTEIN_DISTANCE:
            return levenshteinDistanceAlgorithm(input, values);
        case algorithms.FUZZY_MATCH:
            return fuzzyMatchAlgorithm(input, values);
        default:
            throw new Error("Invalid algorithm provided");
    }
};

/**
 * Calculate the Levenshtein distance between two strings.
 * 
 * @param {string} s1 - The first string.
 * @param {string} s2 - The second string.
 * @returns {number} The Levenshtein distance between the two strings.
 */
function levenshteinDistance(s1, s2) {
    const m = s1.length;
    const n = s2.length;
    const dp = Array.from({ length: m + 1 }, (_, i) => Array(n + 1).fill(i));

    for (let j = 1; j <= n; j++) 
        dp[0][j] = j;
    

    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
            dp[i][j] = Math.min(
                dp[i - 1][j] + 1,
                dp[i][j - 1] + 1,
                dp[i - 1][j - 1] + cost,
            );
        }
    }

    return dp[m][n];
}

/**
 * Find the best match between a given input and a list of values using the Levenshtein distance algorithm.
 * 
 * @param {string} input - The input string to find the best match for.
 * @param {string[]} values - An array of strings to find the best match in.
 * @returns {{match: string, score: number}} An object containing the best match and its score.
 */
function levenshteinDistanceAlgorithm(input, values) {
    let closestMatch = "";
    let closestDistance = Number.MAX_SAFE_INTEGER;

    for (const value of values) {
        const distance = levenshteinDistance(input, value);
        if (distance < closestDistance) {
            closestMatch = value;
            closestDistance = distance;
        }
    }

    return {
        match: closestMatch,
        score: closestDistance,
    };
}

/**
 * Tokenize a string into an array of lowercase words.
 * 
 * @param {string} str - The string to tokenize.
 * @returns {string[]} An array of tokens.
 */
function tokenize(str) {
    return str.toLowerCase().split(/\s+/).filter(Boolean);
}

/**
 * Calculate a simple similarity ratio between two strings.
 * 
 * @param {string} a - The first string.
 * @param {string} b - The second string.
 * @returns {number} The similarity ratio between the two strings.
 */
function similarityRatio(a, b) {
    const [longer, shorter] = a.length > b.length ? [a, b] : [b, a];
    const lengthDifference = longer.length - shorter.length;

    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
        if (shorter[i] === longer[i]) 
            matches++;
        
    }

    return (matches / longer.length) - (lengthDifference / longer.length);
}

/**
 * Find the best match between a given input and a list of values using the fuzzy match algorithm.
 * 
 * @param {string} searchString - The input string to find the best match for.
 * @param {string[]} listOfStrings - An array of strings to find the best match in.
 * @returns {{match: string, score: number}} An object containing the best match and its score.
 */
function fuzzyMatchAlgorithm(searchString, listOfStrings) {
    const searchTokens = tokenize(searchString);
    let bestMatch = "";
    let highestScore = -Infinity;

    for (const target of listOfStrings) {
        const targetTokens = tokenize(target);
        let score = 0;

        for (const searchToken of searchTokens) {
            let bestTokenScore = 0;
            for (const targetToken of targetTokens) {
                const tokenScore = similarityRatio(searchToken, targetToken);
                if (tokenScore > bestTokenScore) 
                    bestTokenScore = tokenScore;
            }
            score += bestTokenScore;
        }

        if (score > highestScore) {
            highestScore = score;
            bestMatch = target;
        }
    }

    return {
        match: bestMatch,
        score: highestScore,
    };
}

module.exports = { findBestMatch, algorithms };
