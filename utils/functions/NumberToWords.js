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
module.exports = numberToWord;
