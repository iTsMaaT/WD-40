const got = require("got");
const cheerio = require("cheerio");
got("https://www.bricklink.com/js/allVars.js").then(async response => {
    const res = response.body;
    const countryListItems = res.split("\n").filter(item => item.startsWith("_varArrayCategory"));
    
    // Extracting strCountryName values
    const ID = countryListItems.map(item => {
        const match = item.match(/idCategory:\s*(\d+)/);
        return match ? match[1] : null;
    });

    console.log(ID);
});


(async () => {
    try {
        const regex = /^https:\/\/soundgasm\.net\/.*/;
        const response = await got("https://soundgasm.net/u/ChainsawAngel/TF4M-Dark-Sun-Gwyndolins-Curiosity"); // Replace with the URL you want to fetch
        const html = response.body;

        const $ = cheerio.load(html);
        const scriptContent = $("script").last().html(); // Get the content of the last script tag

        // Extracting the m4a link from the script content using string manipulation
        const startIndex = scriptContent.indexOf("\"https://media.soundgasm.net/sounds/");
        const endIndex = scriptContent.indexOf(".m4a\"", startIndex) + 4; // Adding 4 to include '.m4a'

        const m4aLink = scriptContent.substring(startIndex + 1, endIndex);
        console.log(m4aLink); // Output the extracted m4a link
    } catch (error) {
        console.error("Error:", error);
    }
})();
