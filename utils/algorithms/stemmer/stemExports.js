const stemmer = require("./stem.js");


exports = module.exports = require("./english.js");


exports.among = stemmer.among;

exports.except = stemmer.except;