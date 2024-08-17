const extractNumbersAndStrings = (input) => {
    const regex = /(\d+)|"([^"]*)"/g;
    const result = [];
    let match;

    while ((match = regex.exec(input)) !== null) {
        if (match[1] !== undefined) 
            result.push(Number(match[1]));  // Convert the number string to a number
        else if (match[2] !== undefined) 
            result.push(match[2]);  // Add the string inside quotes
    }

    return result;
};

module.exports = extractNumbersAndStrings;