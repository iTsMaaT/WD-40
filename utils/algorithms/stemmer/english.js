const stemmer = require("./stem.js");

const alphabet = "abcdefghijklmnopqrstuvwxyz";
const vowels = "aeiouy";
const consonants = alphabet.replace(new RegExp(`[${vowels}]`, "g"), "") + "Y";
const v_wxy = vowels + "wxY";
const valid_li = "cdeghkmnrt";
const r1_re = new RegExp(`^.*?([${vowels}][^${vowels}]|$)`);
const r1_spec = /^(gener|commun|arsen)/;
const doubles = /(bb|dd|ff|gg|mm|nn|pp|rr|tt)$/;
const y_cons = new RegExp(`([${vowels}])y`, "g");
const y_suff = new RegExp(`(.${consonants})[yY]$`);

const exceptions1 = {
    skis: "ski",
    skies: "sky",
    dying: "die",
    lying: "lie",
    tying: "tie",
    idly: "idl",
    gently: "gentl",
    ugly: "ugli",
    early: "earli",
    only: "onli",
    singly: "singl",
    sky: "sky",
    news: "news",
    howe: "howe",
    atlas: "atlas",
    cosmos: "cosmos",
    bias: "bias",
    andes: "andes",
};

const exceptions2 = [
    "inning", "outing", "canning", "herring", "earring",
    "proceed", "exceed", "succeed",
];

module.exports = function(word) {
    // Exceptions 1
    let stop = stemmer.except(word, exceptions1);
    if (stop) return stop;

    // No stemming for short words.
    if (word.length < 3) return word;

    // Y = "y" as a consonant.
    if (word[0] === "y") word = "Y" + word.substr(1);
    word = word.replace(y_cons, "$1Y");

    // Identify the regions of the word.
    let r1;
    let m;

    if ((m = r1_spec.exec(word))) 
        r1 = m[0].length;
    else 
        r1 = r1_re.exec(word)[0].length;
    

    const r2 = r1 + r1_re.exec(word.substr(r1))[0].length;

    // Step 0
    word = word.replace(/^'/, "").replace(/'(s'?)?$/, "");

    // Step 1a
    word = stemmer.among(word, [
        "sses", "ss",
        "(ied|ies)", (match, _, offset) => (offset > 1 ? "i" : "ie"),
        `([${vowels}].*?[^us])s`, (match, m1) => m1,
    ]);

    stop = stemmer.except(word, exceptions2);
    if (stop) return stop;

    // Step 1b
    word = stemmer.among(word, [
        "(eed|eedly)", (match, _, offset) => (offset >= r1 ? "ee" : match + " "),
        `([${vowels}].*?)(ed|edly|ing|ingly)`, (match, prefix, suffix, off) => {
            if (/(?:at|bl|iz)$/.test(prefix)) return prefix + "e";
            if (doubles.test(prefix)) return prefix.slice(0, -1);
            if (shortv(word.slice(0, off + prefix.length)) && off + prefix.length <= r1) return prefix + "e";
            return prefix;
        },
    ]);

    // Step 1c
    word = word.replace(y_suff, "$1i");

    // Step 2
    word = stemmer.among(word, r1, [
        "(izer|ization)", "ize",
        "(ational|ation|ator)", "ate",
        "enci", "ence",
        "anci", "ance",
        "abli", "able",
        "entli", "ent",
        "tional", "tion",
        "(alism|aliti|alli)", "al",
        "fulness", "ful",
        "(ousli|ousness)", "ous",
        "(iveness|iviti)", "ive",
        "(biliti|bli)", "ble",
        "ogi", (match, off) => (word[off - 1] === "l" ? "og" : "ogi"),
        "fulli", "ful",
        "lessli", "less",
        "li", (match, off) => (valid_li.includes(word[off - 1]) ? "" : "li"),
    ]);

    // Step 3
    word = stemmer.among(word, r1, [
        "ational", "ate",
        "tional", "tion",
        "alize", "al",
        "(icate|iciti|ical)", "ic",
        "(ful|ness)", "",
        "ative", (match, off) => (off >= r2 ? "" : "ative"),
    ]);

    // Step 4
    word = stemmer.among(word, r2, [
        "(al|ance|ence|er|ic|able|ible|ant|ement|ment|ent|ism|ate|iti|ous|ive|ize)", "",
        "ion", (match, off) => ("st".includes(word[off - 1]) ? "" : m),
    ]);

    // Step 5
    word = stemmer.among(word, r1, [
        "e", (match, off) => (off >= r2 || !shortv(word, off - 2) ? "" : "e"),
        "l", (match, off) => (word[off - 1] === "l" && off >= r2 ? "" : "l"),
    ]);

    word = word.replace(/Y/g, "y");

    return word;
};

// Check for a short syllable at the given index.
function shortv(word, i = word.length - 2) {
    if (word.length < 3) i = 0; // return true
    return !!((!vowels.includes(word[i - 1]) && vowels.includes(word[i]) && !v_wxy.includes(word[i + 1])) ||
              (i === 0 && vowels.includes(word[i]) && !vowels.includes(word[i + 1])));
}

// Check if the word is short.
function short(word, r1) {
    const l = word.length;
    return r1 >= l && shortv(word, l - 2);
}