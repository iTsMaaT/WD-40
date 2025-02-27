require("module-alias/register");
const { execSync } = require("child_process");
const { fetchGeminiResponse } = require("./fetchGeminiResponse");
const changelog = require("@root/changelogs.json");
const config = require("@root/utils/config/configUtils");
require("dotenv").config();
const logger = require("@utils/log");
const fs = require("fs");

async function generateChangelogEntry() {
    const MODEL = "gemini-1.5-pro";
    try {
        const gitLogCommand = "git log production..develop --no-merges --pretty=format:\"[commit] %s\" --name-only";
        const rawOutput = execSync(gitLogCommand).toString().trim();

        const commitEntries = rawOutput.split("[commit]")
            .filter(entry => entry.trim())
            .map(entry => {
                const [message, ...files] = entry.trim().split("\n");
                return {
                    message,
                    files: files.filter(f => f.trim()),
                };
            })
            .filter(entry => {
                const wordCount = entry.message.trim().split(/\s+/).length;
                return wordCount > 3 && entry.message.length > 15;
            });

        if (commitEntries.length === 0) {
            console.log("No significant commits found");
            return;
        }

        const significantCommits = commitEntries
            .map(entry => `Commit: ${entry.message}\nModified files:\n${entry.files.map(f => `- ${f}`).join("\n")}`)
            .join("\n\n");

        const biggerChangelog = changelog.filter(cl => cl.changes.length > 10);
        const randomChangelog = biggerChangelog[Math.floor(Math.random() * biggerChangelog.length)];

        if (!significantCommits) {
            console.log("No significant commits found");
            return;
        }

        const prompt = `
        Based on these git commit messages, generate a changelog entry in the format shown below.
        Group similar changes together and make them user-friendly.
        Try to have a maximum of 15 bullet points, you can ignore changes that are not too important to the user if needed.
        Don't mention technical details like file names or internal refactoring unless they affect users.

        Here is a example of a changelog entry:

        ${randomChangelog.changes.join("\n")}

        The base command prefix is ${config.get("withoutDatabaseConfig").prefix}
        You should use it for better context
        for example: 
        "in the help command" would become "in ${config.get("withoutDatabaseConfig").prefix}help"
        "new commandname command" would become "new command: ${config.get("withoutDatabaseConfig").prefix}commandname"

        Commit messages:
        ${significantCommits}

        Required format:
        - Short, clear bullet points starting with action words
        - Group similar changes together
        - Focus on user-facing changes
        - Keep technical details minimal unless important for users
        - Match the style of this example:
        - Added support for playing music from Deezer links
        - Fixed permissions issues when bot joins new servers
        - Improved help command with better parameter explanations
        - Maximum of 15 bullet points
        - Make it concise, the user doesn't need to waste time reading it
        - make it only a list seperated by newlines, no other text
        - again, Try to have a maximum of 15 bullet points, you can ignore changes that are not too important to the user if needed.
        
        `.split("\n").map(line => line.trim()).join("\n");

        const response = await fetchGeminiResponse(prompt, process.env.GEMINI_API_KEY, MODEL);

        const changesArray = response.split("\n")
            .filter(line => line.trim());        

        let changes = changesArray.map(line => line.trim().replace(/^[-*]\s*/, ""));

        if (changes.length > 20) {
            console.log(`There are ${changes.length} changes, consolidating them...`);
            const consolidationPrompt = `
                These changelog entries need to be consolidated into 15 or fewer points.
                Combine related changes and make them more concise while preserving the key information.
                Keep the most impactful changes.

                Current entries:
                ${changes.map(c => `- ${c}`).join("\n")}

                Required format:
                - Maximum 15 bullet points
                - Start each point with an action word
                - Combine related changes
                - Focus on the most important user-facing changes
                - Keep the same style as the input
                `.trimStart();

            const consolidatedResponse = await fetchGeminiResponse(
                consolidationPrompt, 
                process.env.GEMINI_API_KEY,
                MODEL,
            );

            changes = consolidatedResponse.split("\n")
                .filter(line => line.trim())
                .map(line => line.trim().replace(/^[-*]\s*/, ""));

            console.log(`Consolidated to ${changes.length} changes.`);
        }

        console.log(`Used tokens: ${calculateUsedTokensPercentage(prompt).usedTokensPercentage}% (${calculateUsedTokensPercentage(prompt).usedTokens} tokens for ${prompt.length} characters)`);

        console.log("\nSuggested changelog entries:");
        console.log("---------------------------");
        console.log("[");
        changes.forEach(change => console.log(`    "${change}",`));
        console.log("]");
        process.exit(0);
    } catch (error) {
        console.error("Error generating changelog:", error);
        process.exit(0);
    }
}

function calculateUsedTokensPercentage(prompt) {
    const maxTokens = 2097152;
    const charPerToken = 4; // 1 character is approximately 4 tokens as per Google
    const wordsPerTokensMin = 60 / 100;
    const wordsPerTokensMax = 80 / 100;
    
    const chars = prompt.length; // Get character count
    const words = prompt.split(" ").length; // Get word count

    // Estimate tokens based on character count (1 char = 4 tokens)
    const tokensFromChars = Math.ceil(chars / charPerToken);
    
    // Estimate tokens based on words
    const tokensFromWords = (Math.ceil(words / wordsPerTokensMin) + Math.floor(words / wordsPerTokensMax)) / 2;

    // Choose the more conservative estimate (larger number of tokens)
    const tokens = Math.max(tokensFromChars, tokensFromWords);
    const usedTokens = Math.min(maxTokens, tokens);
    
    // Calculate the percentage of tokens used
    const usedTokensPercentage = Math.round((usedTokens / maxTokens) * 100);

    return { usedTokens, usedTokensPercentage };
}

generateChangelogEntry();