const isURL = function() {
    const string = this.toString().trim();
    try {
        new URL(string);
        return true;
    } catch (err) {
        return false;
    }
};

String.prototype.isURL = isURL;