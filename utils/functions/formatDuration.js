/**
 * Formats a duration in milliseconds to a human-readable string.
 * @param {number} ms - The duration in milliseconds.
 * @param {boolean} [longFormat=false] - Whether to use long format (e.g., "1 year").
 * @returns {string} The formatted duration.
 */
function formatDuration(ms, longFormat = false) {
    const intervals = [
        { label: "year", seconds: 31536000 },
        { label: "month", seconds: 2592000 },
        { label: "week", seconds: 604800 },
        { label: "day", seconds: 86400 },
        { label: "hour", seconds: 3600 },
        { label: "minute", seconds: 60 },
        { label: "second", seconds: 1 },
    ];

    let seconds = Math.floor(ms / 1000);
    const parts = [];

    for (const interval of intervals) {
        const value = Math.floor(seconds / interval.seconds);
        if (value > 0) {
            if (longFormat) {
                parts.push(`${value} ${interval.label}${value !== 1 ? "s" : ""}`);
            } else {
                const abbreviation = interval.label === "month" ? "mo" : interval.label.charAt(0);
                parts.push(`${value}${abbreviation}`);
            }
            seconds = seconds % interval.seconds;
        }
    }

    return parts.join(" ") || (longFormat ? "0 seconds" : "0s");
}

module.exports = formatDuration;