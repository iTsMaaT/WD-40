const id = function(mention) {
    const id = mention.replace(/[<!@>]/g, "");
    if (!id.match(/^\d+$/)) return null;
    return id;
};
module.exports = id;