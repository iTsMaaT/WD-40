/**
 * Algorithms for finding the best match between a given input and a list of values.
 * @enum {string}
 */
const algorithms = {
    LEVENSHTEIN_DISTANCE: "leven",
    SLICED_LEVENSHTEIN_DISTANCE: "sliced_leven",
    FUZZY_MATCH: "fuzzy",
    JARO_WINKLER: "jaro_winkler",
    DICE_COEFFICIENT: "dice",
    SUBSEQUENCE_MATCH: "subsequence",
};

/**
 * Find the best match between a given input and a list of values using a specified algorithm.
 * 
 * @param {string} algorithm - The algorithm to use for finding the best match.
 * @param {string} input - The input string to find the best match for.
 * @param {string[]} values - An array of strings to find the best match in.
 * @returns {{match: string, score: number, index: number, matches: Array<{value: string, score: number}>}} An object containing the best match, its score, its index in the list of values, and a sorted array of matches.
 * @throws {Error} If an invalid algorithm is provided.
 */
const findBestMatch = (algorithm, input, values) => {
    if (!Object.values(algorithms).includes(algorithm))
        throw new Error("Invalid algorithm provided");

    if (!input || !values || !Array.isArray(values) || values.length === 0) {
        return {
            match: "",
            index: -1,
            score: 0,
            matches: [],
        };
    }

    const result = (() => {
        switch (algorithm) {
            case algorithms.LEVENSHTEIN_DISTANCE:
                return levenshteinDistanceAlgorithm(input, values);
            case algorithms.FUZZY_MATCH:
                return fuzzyMatchAlgorithm(input, values);
            case algorithms.SLICED_LEVENSHTEIN_DISTANCE:
                return slicedLevenshteinDistanceAlgorithm(input, values);
            case algorithms.JARO_WINKLER:
                return jaroWinklerAlgorithm(input, values);
            case algorithms.DICE_COEFFICIENT:
                return diceCoefficientAlgorithm(input, values);
            case algorithms.SUBSEQUENCE_MATCH:
                return fzyStyleMatchAlgorithm(input, values);
            default:
                throw new Error("Invalid algorithm provided");
        }
    })();

    return {
        index: values.indexOf(result.match),
        ...result,
    };
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
 * @returns {{match: string, score: number, matches: Array<{value: string, score: number}>}} An object containing the best match, its score, and a sorted array of matches.
 */
function levenshteinDistanceAlgorithm(input, values) {
    const matches = values.map(value => {
        const maxLen = Math.max(input.length, value.length);
        const rawDistance = levenshteinDistance(input, value);
        const normalizedScore = 1 - rawDistance / maxLen;

        return {
            value,
            score: normalizedScore,
        };
    });

    matches.sort((a, b) => b.score - a.score);

    return {
        match: matches[0].value,
        score: matches[0].score,
        matches,
    };
}

/**
 * Tokenize a string into an array of lowercase words.
 * 
 * @param {string} str - The string to tokenize.
 * @returns {string[]} An array of tokens.
 */
function tokenize(str) {
    return str
        .toLowerCase() // Convert to lowercase for case-insensitive matching
        .replace(/[^\w\s'-]+/g, "") // Remove non-word characters except spaces, hyphens, and apostrophes
        .trim() // Remove leading/trailing whitespace
        .split(/\s+/) // Split by any whitespace
        .filter(Boolean); // Remove empty tokens
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
 * @returns {{match: string, score: number, matches: Array<{value: string, score: number}>}} An object containing the best match, its score, and a sorted array of matches.
 */
function fuzzyMatchAlgorithm(searchString, listOfStrings) {
    const searchTokens = tokenize(searchString);
    const matches = listOfStrings.map(target => {
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

        return {
            value: target,
            score: Math.min(score / searchTokens.length, 1), // Normalize score between 0 and 1
        };
    });

    matches.sort((a, b) => b.score - a.score);

    return {
        match: matches[0].value,
        score: matches[0].score,
        matches,
    };
}

/**
 * Find the best match between a given input and a list of values using the sliced Levenshtein distance algorithm.
 * 
 * @param {string} input - The input string to find the best match for.
 * @param {string[]} values - An array of strings to find the best match in.
 * @returns {{match: string, score: number, matches: Array<{value: string, score: number}>}} An object containing the best match, its score, and a sorted array of matches.
 */
function slicedLevenshteinDistanceAlgorithm(input, values) {
    const matches = values.map(value => {
        const inputLength = input.length;
        // If input is longer than value, compare whole value as one slice
        if (inputLength > value.length) {
            const rawDistance = levenshteinDistance(input, value);
            const normalizedScore = 1 - rawDistance / inputLength;
            return {
                value,
                score: normalizedScore,
            };
        }
        const slices = Array.from({ length: value.length - inputLength + 1 }, (_, i) =>
            value.slice(i, i + inputLength),
        );

        let bestScore = 0;
        for (const slice of slices) {
            const rawDistance = levenshteinDistance(input, slice);
            const normalizedScore = 1 - rawDistance / inputLength;
            if (normalizedScore > bestScore) bestScore = normalizedScore;
        }

        return {
            value,
            score: bestScore,
        };
    });

    matches.sort((a, b) => b.score - a.score);

    return {
        match: matches[0].value,
        score: matches[0].score,
        matches,
    };
}

/**
 * Calculate the Jaro-Winkler similarity between two strings.
 * 
 * @param {string} s1 - The first string.
 * @param {string} s2 - The second string.
 * @returns {number} The Jaro-Winkler similarity score between 0 and 1.
 */
function jaroWinklerSimilarity(s1, s2) {
    const m = s1.length;
    const n = s2.length;

    if (m === 0 || n === 0) return 0;

    const matchDistance = Math.floor(Math.max(m, n) / 2) - 1;
    const s1Matches = Array(m).fill(false);
    const s2Matches = Array(n).fill(false);

    let matches = 0;
    for (let i = 0; i < m; i++) {
        const start = Math.max(0, i - matchDistance);
        const end = Math.min(i + matchDistance + 1, n);

        for (let j = start; j < end; j++) {
            if (s2Matches[j]) continue;
            if (s1[i] !== s2[j]) continue;
            s1Matches[i] = true;
            s2Matches[j] = true;
            matches++;
            break;
        }
    }

    if (matches === 0) return 0;

    let transpositions = 0;
    let k = 0;
    for (let i = 0; i < m; i++) {
        if (!s1Matches[i]) continue;
        while (!s2Matches[k]) k++;
        if (s1[i] !== s2[k]) transpositions++;
        k++;
    }

    transpositions /= 2;

    const jaro = (matches / m + matches / n + (matches - transpositions) / matches) / 3;

    // Jaro-Winkler adjustment
    const prefixLength = Math.min(4, [...s1].findIndex((c, i) => c !== s2[i]) || 0);
    const scalingFactor = 0.1;

    return jaro + prefixLength * scalingFactor * (1 - jaro);
}

/**
 * Find the best match using the Jaro-Winkler similarity algorithm.
 * 
 * @param {string} input - The input string to find the best match for.
 * @param {string[]} values - An array of strings to find the best match in.
 * @returns {{match: string, score: number, matches: Array<{value: string, score: number}>}} An object containing the best match, its score, and a sorted array of matches.
 */
function jaroWinklerAlgorithm(input, values) {
    const matches = values.map(value => ({
        value,
        score: jaroWinklerSimilarity(input, value),
    }));

    matches.sort((a, b) => b.score - a.score);

    return {
        match: matches[0].value,
        score: matches[0].score,
        matches,
    };
}

/**
 * Calculate the Dice coefficient between two strings.
 * 
 * @param {string} s1 - The first string.
 * @param {string} s2 - The second string.
 * @returns {number} The Dice coefficient score between 0 and 1.
 */
function diceCoefficient(s1, s2) {
    if (!s1 || !s2) return 0;

    const bigrams = str => {
        const result = [];
        for (let i = 0; i < str.length - 1; i++) 
            result.push(str.slice(i, i + 2));
        
        return result;
    };

    const bigrams1 = bigrams(s1);
    const bigrams2 = bigrams(s2);

    const intersection = bigrams1.filter(bigram => bigrams2.includes(bigram)).length;

    return (2 * intersection) / (bigrams1.length + bigrams2.length);
}

/**
 * Find the best match using the Dice coefficient algorithm.
 * 
 * @param {string} input - The input string to find the best match for.
 * @param {string[]} values - An array of strings to find the best match in.
 * @returns {{match: string, score: number, matches: Array<{value: string, score: number}>}} An object containing the best match, its score, and a sorted array of matches.
 */
function diceCoefficientAlgorithm(input, values) {
    const matches = values.map(value => ({
        value,
        score: diceCoefficient(input, value),
    }));

    matches.sort((a, b) => b.score - a.score);

    return {
        match: matches[0]?.value || "",
        score: matches[0]?.score || 0,
        matches,
    };
}

/**
 * Score the similarity between input and target using a partial subsequence-based heuristic.
 * Scores based on the longest matching subsequence, even if not all input chars are matched.
 * 
 * @param {string} input - The search query string.
 * @param {string} target - The target string to score against.
 * @returns {number} A raw score (0 if no match).
 */
function fzyScore(input, target) {
    input = input.toLowerCase();
    target = target.toLowerCase();

    let score = 0;
    let inputIdx = 0;
    let lastMatchIdx = -1;
    let matchedChars = 0;

    for (let i = 0; i < target.length && inputIdx < input.length; i++) {
        if (target[i] === input[inputIdx]) {
            matchedChars++;
            const isBoundary = i === 0 || /[\s\-_.]/.test(target[i - 1]);
            score += isBoundary ? 10 : 5;

            if (lastMatchIdx !== -1) {
                const gap = i - lastMatchIdx - 1;
                score -= gap;
            }

            lastMatchIdx = i;
            inputIdx++;
        }
    }

    // Score is proportional to the fraction of input matched
    if (matchedChars === 0) return 0;
    score *= matchedChars / input.length;
    score -= (target.length - matchedChars) * 0.5;

    return score;
}

/**
 * Normalize an array of match scores to the range [0, 1].
 * 
 * @param {Array<{ value: string, score: number }>} matches - Array of raw-scored matches.
 * @returns {Array<{ value: string, score: number }>} Array with normalized scores.
 */
function normalizeScores(matches) {
    // Include all matches, set score to 0 for -Infinity
    const validScores = matches.filter(m => m.score !== -Infinity);
    const max = validScores.length ? Math.max(...validScores.map(m => m.score)) : 1;
    const min = validScores.length ? Math.min(...validScores.map(m => m.score)) : 0;

    return matches.map(m => {
        if (m.score === -Infinity) return { ...m, score: 0 };
        if (max === min) return { ...m, score: 1 };
        return { ...m, score: (m.score - min) / (max - min) };
    });
}

/**
 * Find the best match between a given input and a list of values using a subsequence-based matcher.
 * Similar to fzy or Windows Start Menu style search.
 * 
 * @param {string} input - The input string to find the best match for.
 * @param {string[]} values - An array of strings to match against.
 * @returns {{ match: string, score: number, matches: Array<{ value: string, score: number }> }}
 *          Best match, its normalized score, and full sorted list of matches with scores.
 */
function fzyStyleMatchAlgorithm(input, values) {
    const rawMatches = values.map(value => ({
        value,
        score: fzyScore(input, value),
    }));

    const matches = normalizeScores(rawMatches).sort((a, b) => b.score - a.score);

    return {
        match: matches[0]?.value || "",
        score: matches[0]?.score || 0,
        matches,
    };
}

module.exports = { findBestMatch, algorithms };