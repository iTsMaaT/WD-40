#!/usr/bin/env node

require("module-alias/register");
const fs = require("fs");
const path = require("path");
const changelog = require("@root/changelogs.json");

// Helper function to format the date
const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
};

// Initialize the markdown content
let markdownContent = "# Changelog\n\n";

// Reverse the order of changelog entries for most recent first
changelog.reverse().forEach(entry => {
    markdownContent += `## [${entry.version}] - ${formatDate(entry.date)}\n\n`;
    entry.changes.forEach(change => {
        markdownContent += `- ${change.replaceAll(">", "")}\n`;
    });
    markdownContent += "\n";
});

// Write the markdown content to CHANGELOG.md (overwrite if exists)
const outputPath = path.join(process.cwd(), "CHANGELOG.md");
fs.writeFileSync(outputPath, markdownContent, "utf-8");

console.log("CHANGELOG.md file created successfully.");
