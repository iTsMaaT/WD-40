const TimeFormatToMS = function (timeString) {

    // Validation
    if (!timeString || !/^(\d+[dhms])+ms$/.test(timeString) || /(\D)\1/.test(timeString) || timeString.match(/\d+/g).map(Number).map(parseInt).some(Number.isNaN)) return undefined;

    const timeUnits = {
        d: 24 * 60 * 60 * 1000, // 1 day = 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
        h: 60 * 60 * 1000,      // 1 hour = 60 minutes * 60 seconds * 1000 milliseconds
        m: 60 * 1000,           // 1 minute = 60 seconds * 1000 milliseconds
        s: 1000,                // 1 second = 1000 milliseconds
        ms: 1                   // 1 millisecond
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
module.exports = TimeFormatToMS;