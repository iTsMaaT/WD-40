const getExactDate = function() {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, "0");
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const yyyy = today.getFullYear();
    const time = String(today.getHours()).padStart(2, "0") + ":" + String(today.getMinutes()).padStart(2, "0") + ":" + String(today.getSeconds()).padStart(2, "0") + "." + String(today.getMilliseconds()).padStart(3, "0");
    return dd + "-" + mm + "-" + yyyy + " " + time;
};
module.exports = getExactDate;