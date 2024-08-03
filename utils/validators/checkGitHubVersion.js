const logger = require("@utils/log");
const { version, repository } = require("@root/package.json");

const checkGitHubVersion = async function() {
    logger.debug("Checking application version compared to GitHub...");
    const repoUrlArray = repository.url.split("/");
    const repoIdentifier = `${repoUrlArray[3]}/${repoUrlArray[4].split(".")[0]}`;
    if (!repoIdentifier) 
        return "undefined";
    const result = await (await fetch(`https://api.github.com/repos/${repoIdentifier}/contents/package.json`)).json();
    const githubVersion = JSON.parse(Buffer.from(result.content, "base64").toString("utf-8")).version; 
    logger.debug(`Current version is ${version}`);

    if (githubVersion !== version) {
        logger.warning(`New version available: ${githubVersion}`);
        logger.warning(`You are currently using version: ${version}`);
        if (githubVersion.split(".")[0] !== version.split(".")[0]) logger.severe("Major version mismatch");
        logger.warning("Please consider updating the application with 'git pull'.");
    }


    logger.info("Successfully checked application version.");
};

module.exports = { checkGitHubVersion };