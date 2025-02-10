/**
 * Combines two collections into a single array.
 * @param {Array|Object} col1 - The first collection.
 * @param {Array|Object} col2 - The second collection.
 * @returns {Array} The combined array.
 */
const combineCollections = function(col1, col2) {
    const combinedArray = [];

    // Add elements from the first collection
    if (Array.isArray(col1)) 
        combinedArray.push(...col1);
    else 
        combinedArray.push(...Object.keys(col1));
    
  
    // Add elements from the second collection
    if (Array.isArray(col2)) 
        combinedArray.push(...col2);
    else 
        combinedArray.push(...Object.keys(col2));
    
  
    return combinedArray;
};
module.exports = combineCollections;