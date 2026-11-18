import stemmer from "./stem.js";
import english from "./english.js";

english.among = stemmer.among;
english.except = stemmer.except;

export default english;
