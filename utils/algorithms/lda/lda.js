const stem = require("../stemmer/stemExports.js");

//
// Based on javascript implementation https://github.com/awaisathar/lda.js
// Original code based on http://www.arbylon.net/projects/LdaGibbsSampler.java
//
const process = (sentences, numberOfTopics, numberOfTermsPerTopic, languages = ["en"], alphaValue = 0.1, betaValue = 0.01, randomSeed = null) => {
    // The result will consist of topics and their included terms [[{"term":"word1", "probability":0.065}, {"term":"word2", "probability":0.047}, ... ], [{"term":"word1", "probability":0.085}, {"term":"word2", "probability":0.024}, ... ]].
    const result = [];
    // Index-encoded array of sentences, with each row containing the indices of the words in the vocabulary.
    let documents = [];
    // Hash of vocabulary words and the count of how many times each word has been seen.
    const f = {};
    // Vocabulary of unique words (porter stemmed).
    const vocab = [];
    // Vocabulary of unique words in their original form.
    const vocabOrig = {};

    if (sentences && sentences.length > 0) {
        let stopwords = [];

        languages.forEach(language => {
            const stopwordsLang = require(`./stopwords_${language}.js`);
            stopwords = stopwords.concat(stopwordsLang.stop_words);
        });

        sentences.forEach((sentence, i) => {
            if (sentence === "") return;
            documents[i] = [];

            const words = sentence ? sentence.split(/[\s,"]+/) : null;
            if (!words) return;

            words.forEach(word => {
                const w = word.toLowerCase().replace(/[^a-z'A-Z0-9\u00C0-\u00ff ]+/g, "");
                const wStemmed = stem(w);
                if (w === "" || !wStemmed || w.length === 1 || stopwords.includes(w.replace("'", "")) || stopwords.includes(wStemmed) || w.startsWith("http")) return;

                if (f[wStemmed]) { 
                    f[wStemmed] += 1;
                } else { 
                    f[wStemmed] = 1; 
                    vocab.push(wStemmed);
                    vocabOrig[wStemmed] = w;
                }

                documents[i].push(vocab.indexOf(wStemmed));
            });
        });

        const V = vocab.length;
        const M = documents.length;
        const K = parseInt(numberOfTopics);

        documents = documents.filter(doc => doc.length > 0); // filter empty documents

        const lda = new LDA();
        lda.configure(documents, V, 10000, 2000, 100, 10, randomSeed);
        lda.gibbs(K, alphaValue, betaValue);

        const theta = lda.getTheta();
        const phi = lda.getPhi();

        // topics
        let topTerms = numberOfTermsPerTopic;
        phi.forEach((topic, k) => {
            const things = [];
            topic.forEach((probability, w) => {
                things.push(`${probability.toPrecision(2)}_${vocab[w]}_${vocabOrig[vocab[w]]}`);
            });

            things.sort().reverse();
            if (topTerms > vocab.length) topTerms = vocab.length;

            const row = [];
            for (let t = 0; t < topTerms; t++) {
                const [probStr, , topicTerm] = things[t].split("_");
                const prob = parseFloat(probStr) * 100;
                if (prob < 2) continue;

                row.push({ term: topicTerm, probability: parseFloat(probStr) });
            }

            result.push(row);
        });
    }

    return result;
};

class LDA {
    constructor() {
        this.THIN_INTERVAL = 20;
        this.BURN_IN = 100;
        this.ITERATIONS = 1000;
        this.SAMPLE_LAG = 0;
        this.RANDOM_SEED = null;
        this.dispcol = 0;
        this.numstats = 0;
    }

    configure(docs, v, iterations, burnIn, thinInterval, sampleLag, randomSeed) {
        this.documents = docs;
        this.V = v;
        this.ITERATIONS = iterations;
        this.BURN_IN = burnIn;
        this.THIN_INTERVAL = thinInterval;
        this.SAMPLE_LAG = sampleLag;
        this.RANDOM_SEED = randomSeed;
        this.dispcol = 0;
        this.numstats = 0;
    }

    initialState(K) {
        this.K = K;
        const M = this.documents.length;

        this.nw = this.make2DArray(this.V, K);
        this.nd = this.make2DArray(M, K);
        this.nwsum = new Array(K).fill(0);
        this.ndsum = new Array(M).fill(0);
        this.z = Array.from({ length: M }, () => []);

        for (let m = 0; m < M; m++) {
            const N = this.documents[m].length;
            this.z[m] = new Array(N);
            for (let n = 0; n < N; n++) {
                const topic = Math.floor(this.getRandom() * K);
                this.z[m][n] = topic;
                this.nw[this.documents[m][n]][topic]++;
                this.nd[m][topic]++;
                this.nwsum[topic]++;
            }
            this.ndsum[m] = N;
        }
    }

    gibbs(K, alpha, beta) {
        this.alpha = alpha;
        this.beta = beta;

        if (this.SAMPLE_LAG > 0) {
            this.thetasum = this.make2DArray(this.documents.length, K);
            this.phisum = this.make2DArray(K, this.V);
            this.numstats = 0;
        }

        this.initialState(K);

        for (let i = 0; i < this.ITERATIONS; i++) {
            for (let m = 0; m < this.z.length; m++) {
                for (let n = 0; n < this.z[m].length; n++) {
                    const topic = this.sampleFullConditional(m, n);
                    this.z[m][n] = topic;
                }
            }

            if ((i < this.BURN_IN) && (i % this.THIN_INTERVAL === 0)) 
                this.dispcol++;
            
            if ((i > this.BURN_IN) && (i % this.THIN_INTERVAL === 0)) 
                this.dispcol++;
            
            if ((i > this.BURN_IN) && (this.SAMPLE_LAG > 0) && (i % this.SAMPLE_LAG === 0)) {
                this.updateParams();
                if (i % this.THIN_INTERVAL !== 0) 
                    this.dispcol++;
                
            }
            if (this.dispcol >= 100) 
                this.dispcol = 0;
            
        }
    }

    sampleFullConditional(m, n) {
        let topic = this.z[m][n];
        this.nw[this.documents[m][n]][topic]--;
        this.nd[m][topic]--;
        this.nwsum[topic]--;
        this.ndsum[m]--;

        const p = new Array(this.K);
        for (let k = 0; k < this.K; k++) {
            p[k] = (this.nw[this.documents[m][n]][k] + this.beta) / (this.nwsum[k] + this.V * this.beta) *
                (this.nd[m][k] + this.alpha) / (this.ndsum[m] + this.K * this.alpha);
        }

        for (let k = 1; k < p.length; k++) 
            p[k] += p[k - 1];
        

        const u = this.getRandom() * p[this.K - 1];
        for (topic = 0; topic < p.length; topic++) 
            if (u < p[topic]) break;
        

        this.nw[this.documents[m][n]][topic]++;
        this.nd[m][topic]++;
        this.nwsum[topic]++;
        this.ndsum[m]++;

        return topic;
    }

    updateParams() {
        for (let m = 0; m < this.documents.length; m++) {
            for (let k = 0; k < this.K; k++) 
                this.thetasum[m][k] += (this.nd[m][k] + this.alpha) / (this.ndsum[m] + this.K * this.alpha);
            
        }
        for (let k = 0; k < this.K; k++) {
            for (let w = 0; w < this.V; w++) 
                this.phisum[k][w] += (this.nw[w][k] + this.beta) / (this.nwsum[k] + this.V * this.beta);
            
        }
        this.numstats++;
    }

    getTheta() {
        const theta = Array.from({ length: this.documents.length }, () => []);
        if (this.SAMPLE_LAG > 0) {
            for (let m = 0; m < this.documents.length; m++) {
                for (let k = 0; k < this.K; k++) 
                    theta[m][k] = this.thetasum[m][k] / this.numstats;
                
            }
        } else {
            for (let m = 0; m < this.documents.length; m++) {
                for (let k = 0; k < this.K; k++) 
                    theta[m][k] = (this.nd[m][k] + this.alpha) / (this.ndsum[m] + this.K * this.alpha);
                
            }
        }
        return theta;
    }

    getPhi() {
        const phi = Array.from({ length: this.K }, () => []);
        if (this.SAMPLE_LAG > 0) {
            for (let k = 0; k < this.K; k++) {
                for (let w = 0; w < this.V; w++) 
                    phi[k][w] = this.phisum[k][w] / this.numstats;
                
            }
        } else {
            for (let k = 0; k < this.K; k++) {
                for (let w = 0; w < this.V; w++) 
                    phi[k][w] = (this.nw[w][k] + this.beta) / (this.nwsum[k] + this.V * this.beta);
                
            }
        }
        return phi;
    }

    getRandom() {
        if (this.RANDOM_SEED !== null) {
            const x = Math.sin(this.RANDOM_SEED++) * 1000000;
            return x - Math.floor(x);
        } else {
            return Math.random();
        }
    }

    make2DArray(rows, cols) {
        return Array.from({ length: rows }, () => new Array(cols).fill(0));
    }
}

module.exports = process;