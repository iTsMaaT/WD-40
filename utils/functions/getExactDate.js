const config = require("../config/configUtils");

/**
 * Get the exact date and time using the configured locale
 * @returns {string} The exact date and time
 */
const getExactDate = function() {
    const today = new Date();
    const locale = config.get("locale") || "en-US";
    
    // Format date using locale
    const dateFormatter = new Intl.DateTimeFormat(locale, {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        fractionalSecondDigits: 3,
        hour12: false,
    });

    return dateFormatter.format(today)
        .replace(/[/]/g, "-")
        .replace(",", "");
};

module.exports = getExactDate;