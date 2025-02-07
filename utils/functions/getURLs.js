/**
 * Get URLs from a string.
 * @param {string} str The string to get URLs from.
 * @param {boolean} lower If the URLs should be lowercased.
 * @returns {string[] | null} An array of URLs or null if no URLs were found.
 */
const getURLs = (str, lower = false) => {
    const regexp = /(http|ftp|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))([\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])/igm;
    const bracketsRegexp = /[()]/g;

    if (typeof str !== "string") 
        throw new TypeError(`The str argument should be a string, got ${typeof str}`);
  

    if (str) {
        const urls = str.match(regexp);
        if (urls) 
            return lower ? urls.map((item) => item.toLowerCase().replace(bracketsRegexp, "")) : urls.map((item) => item.replace(bracketsRegexp, ""));
        else 
            return null;
    
    } else {
        return null;
    }
};

module.exports = getURLs;