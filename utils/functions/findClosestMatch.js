const findClosestMatch = (input, values) => {
    // Function to calculate the Levenshtein distance between two strings
    function levenshteinDistance(s1, s2) {
        const m = s1.length;
        const n = s2.length;
        const dp = [];
  
        for (let i = 0; i <= m; i++) {
            dp[i] = [i];
        }
  
        for (let j = 1; j <= n; j++) {
            dp[0][j] = j;
        }
  
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
                dp[i][j] = Math.min(
                    dp[i - 1][j] + 1,
                    dp[i][j - 1] + 1,
                    dp[i - 1][j - 1] + cost
                );
            }
        }
  
        return dp[m][n];
    }
  
    // Initialize variables to keep track of the closest match and its distance
    let closestMatch = null;
    let closestDistance = Number.MAX_SAFE_INTEGER;
  
    // Loop through each value in the array

    if (Array.isArray(values)) {
        for (const value of values) {
            // Calculate the Levenshtein distance between the input and the current value
            const distance = levenshteinDistance(input, value);
      
            // If the current distance is smaller than the closest distance, update the closest match
            if (distance < closestDistance) {
                closestMatch = value;
                closestDistance = distance;
            }
        }
    } else {
        for (const value in values) {
        // Calculate the Levenshtein distance between the input and the current value
            const distance = levenshteinDistance(input, value);
  
            // If the current distance is smaller than the closest distance, update the closest match
            if (distance < closestDistance) {
                closestMatch = value;
                closestDistance = distance;
            }
        }
    }
  
    // Return an object containing the closest match, its distance, and potentially more info
    return {
        closestMatch,
        distance: closestDistance,
    };
};

module.exports = findClosestMatch;