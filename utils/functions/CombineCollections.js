const CombineCollections = function (col1, col2) {
    const combinedArray = [];

    // Add elements from the first collection
    if (Array.isArray(col1)) {
        combinedArray.push(...col1);
    } else {
        combinedArray.push(...Object.keys(col1));
    }
  
    // Add elements from the second collection
    if (Array.isArray(col2)) {
        combinedArray.push(...col2);
    } else {
        combinedArray.push(...Object.keys(col2));
    }
  
    return combinedArray;
};
module.exports = CombineCollections;