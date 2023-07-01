const id = function(mention) {
    const id = mention.replace(/[<!@>]/g, "");
    if (!id.match(/^\d+$/)) return undefined;
    return id;
};
module.exports = id;