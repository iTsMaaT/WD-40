const prettyString = function (inputString, type, addDot) {
    const punctuationMarks = ["!", "?", ".", ",", ";"];
    if (type === "all") {
        // Capitalize first letter of each word
        const words = inputString.toLowerCase().split(" ");
        const capitalizedWords = words.map(word => word.charAt(0).toUpperCase() + word.slice(1));
        var modifiedString = capitalizedWords.join(" ");
      } else if (type === "first") {
        // Capitalize only the first letter of the entire string
        var modifiedString = inputString.charAt(0).toUpperCase() + inputString.slice(1).toLowerCase();
    } else {
        var modifiedString = inputString 
    }

    if (addDot) {
        const lastChar = modifiedString.charAt(inputString.length - 1);
        if (!punctuationMarks.includes(lastChar)) return modifiedString + ".";
    }
    return modifiedString;
}
module.exports = prettyString;