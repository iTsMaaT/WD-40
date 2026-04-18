/**
 * Convert a number to engineer notation
 * @param {number} number - The number to convert
 * @param {string[]} [sizes=["","Ki","Mi","Gi","Ti","Pi"]] - The sizes to use for the engineer notation
 * @param {number} [k=1024] - The base for the engineer notation
 * @param {number} [decimals=2] - The number of decimals to round to
 * @returns {string} The engineer notation string
 */
const toEngineerNotation = function(number, sizes = ["", "Ki", "Mi", "Gi", "Ti", "Pi"], k = 1024, decimals = 2) {
    if (number === 0) return "0";

    // Calculate the logarithm of the value in base 'k' (1024)
    const i = Math.floor(Math.log(number) / Math.log(k));

    // Calculate the value in the appropriate unit
    const formattedValue = parseFloat((number / Math.pow(k, i)).toFixed(decimals));

    // Combine the formatted value with the unit
    return formattedValue + " " + sizes[i];
};

/**
 * Convert a time string to milliseconds
 * @param {string} timeString - The time string to convert
 * @returns {number | null} The time in milliseconds, or null if the input is invalid
 */
const timeFormatToMS = function(timeString) {

    // Validation
    if (!timeString || !/^(\d+[dhms])+ms$/.test(timeString) || /(\D)\1/.test(timeString) || timeString.match(/\d+/g).map(Number).map(parseInt).some(Number.isNaN)) return null;

    const timeUnits = {
        d: 24 * 60 * 60 * 1000, // 1 day = 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
        h: 60 * 60 * 1000,      // 1 hour = 60 minutes * 60 seconds * 1000 milliseconds
        m: 60 * 1000,           // 1 minute = 60 seconds * 1000 milliseconds
        s: 1000,                // 1 second = 1000 milliseconds
        ms: 1,                  // 1 millisecond
    };
      
    const units = timeString.match(/[dhms]/g) || [];
    const values = timeString.match(/\d+/g).map(Number);
      
    let totalMilliseconds = 0;
    for (let i = 0; i < units.length; i++) {
        const unit = units[i];
        const value = values[i] || 0; // Use 0 as default value if a unit is missing
        totalMilliseconds += value * timeUnits[unit];
    }
      
    return totalMilliseconds;
};

/**
 * Prettify a string
 * @param {string} inputString - The input string to prettify
 * @param {string} [type="all"] - The type of prettifying to do
 * @param {boolean} [addDot=false] - Whether to add a dot at the end of the string
 * @returns {string} The prettified string
 */
const prettyString = function(inputString, type, addDot = false) {
    const punctuationMarks = ["!", "?", ".", ",", ";", ":"];
    let modifiedString;
    if (type === "all") {
        // Capitalize first letter of each word
        const words = inputString.toLowerCase().split(" ");
        const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
        modifiedString = capitalizedWords.join(" ");
    } else if (type === "first") {
        // Capitalize only the first letter of the entire string
        modifiedString = inputString.charAt(0).toUpperCase() + inputString.slice(1);
    } else {
        modifiedString = inputString; 
    }

    if (addDot) {
        const lastChar = modifiedString.charAt(inputString.length - 1);
        if (!punctuationMarks.includes(lastChar)) return modifiedString + ".";
    }
    return modifiedString;
};

/**
 * Convert a number to a word
 * @param {string} numberString - The number string to convert
 * @returns {string} The word representation of the number
 */
const numberToWord = function(numberString) {
    const thousands = ["", "thousand", "million", "billion", "trillion"];
    // Uncomment this line for the English Number System
    // var thousands = ['', 'thousand', 'million', 'milliard', 'billion'];

    const digits = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
    const teens = ["ten", "eleven", "twelve", "thirteen", "fourteen", "fifteen", "sixteen", "seventeen", "eighteen", "nineteen"];
    const twenties = ["twenty", "thirty", "forty", "fifty", "sixty", "seventy", "eighty", "ninety"];

    numberString = numberString.toString();
    numberString = numberString.replace(/[, ]/g, "");

    if (numberString != parseFloat(numberString))
        return "not a number";

    let decimalIndex = numberString.indexOf(".");
    if (decimalIndex == -1)
        decimalIndex = numberString.length;

    if (decimalIndex > 15)
        return "too big";

    const numberArray = numberString.split("");
    let wordString = "";
    let shouldSkip = 0;

    for (let i = 0; i < decimalIndex; i++) {
        if ((decimalIndex - i) % 3 == 2) {
            if (numberArray[i] == "1") {
                wordString += teens[Number(numberArray[i + 1])] + " ";
                i++;
                shouldSkip = 1;
            } else if (numberArray[i] != 0) {
                wordString += twenties[numberArray[i] - 2] + " ";
                shouldSkip = 1;
            }
        } else if (numberArray[i] != 0) {
            wordString += digits[numberArray[i]] + " ";
            if ((decimalIndex - i) % 3 == 0)
                wordString += "hundred ";
            shouldSkip = 1;
        }

        if ((decimalIndex - i) % 3 == 1) {
            if (shouldSkip)
                wordString += thousands[(decimalIndex - i - 1) / 3] + " ";
            shouldSkip = 0;
        }
    }

    if (decimalIndex != numberString.length) {
        const decimalPartLength = numberString.length;
        wordString += "point ";
        for (i = decimalIndex + 1; i < decimalPartLength; i++)
            wordString += digits[numberArray[i]] + " ";
    }

    wordString = wordString.replace(/\s+/g, " ");
    return wordString.trim();
};

/**
 * Generate a progress bar
 * @param {Object} options - The options for the progress bar
 * @param {number} options.current - The current value
 * @param {number} options.max - The maximum value
 * @param {number} [options.totalCount=20] - The total count of the progress bar
 * @param {boolean} [options.withPercentage=false] - Whether to include the percentage in the progress bar
 * @returns {string} The progress bar string
 */
function generateProgressBar(options) {
    const current = options.current;
    const max = options.max;
    const totalCount = options.totalCount || 20;
    const withPercentage = options.withPercentage || false;
    if (!current) throw new Error("No current value specified");
    if (!max) throw new Error("No max value specified");
    if (current > max) throw new Error("Current value is bigger than the max value");
    const percentage = (current / max) * 100;
    const filledLength = Math.round((totalCount * percentage) / 100);
    const emptyLength = totalCount - filledLength;

    const filledBar = "█".repeat(filledLength);
    const emptyBar = "░".repeat(emptyLength);

    return `[${filledBar}${emptyBar}]${withPercentage ? ` ${percentage.toFixed(2)}%` : ""}`;
}

module.exports = { 
    numberToWord, 
    prettyString, 
    timeFormatToMS, 
    toEngineerNotation, 
    generateProgressBar,
};