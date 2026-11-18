import { safeFetch, requestOnce, resolvePublicAddresses } from "#utils/helpers/safeFetch.js";
import fs from "fs/promises";
// const puppeteer = require("puppeteer");
import { parse } from "node-html-parser";
import path from "path";
import embedGenerator from "#utils/helpers/embedGenerator.js";

export default {
    name: "linkinfo",
    description: "Gives info about a link",
    usage: {
        required: {
            "link": "the URL to analyze",
        },
    },
    aliases: ["linfo"],
    category: "info",
    private: true,
    cooldown: 10000,

    /**
     * @param {import("#utils/log.js")} logger The logger instance for logging errors and warnings
     * @param {import("discord.js").Client} client The Discord client instance
     * @param {import("discord.js").Message} message The message object that triggered the command
     * @param {string[]} args The command arguments
     * @param {Object} flags The command flags
     * @returns {Promise<void>}
     */
    async execute(logger, client, message, args, flags) {
        if (!args[0]) return await message.reply({ embeds: [embedGenerator.warning("Please provide a URL")] });
        const link = args[0];
        const MAX_FIELD_LENGTH = 1000;
        const MAX_REDIRECTS = 5;

        try {
            if (!await validateURL(link)) return await message.reply({ embeds: [embedGenerator.error("Invalid URL")] });
            await resolvePublicAddresses(new URL(link).hostname);
            const result = await analyzeLink(link);
            // let file;
            // if (result.screenshotPath) file = new AttachmentBuilder(result.screenshotPath, { name: "screenshot.png" });

            const embed = {
                color: 0xffffff,
                title: "Link Analysis",
                fields: [
                    { name: "Unshortened URL", value: truncateText(result.unshortenedURL, MAX_FIELD_LENGTH) ?? "-" },
                    { name: "Redirects (without search params)", value: result.redirects.length !== 1 ? truncateText(result.redirects.join(" ->\n")) : "None" },
                    { name: "Response Status", value: truncateText(result.responseStatus, MAX_FIELD_LENGTH) ?? "-" },
                    { name: "IP Address", value: truncateText(result.ip, MAX_FIELD_LENGTH) ?? "-" },
                    { name: "Type", value: truncateText(result.type, MAX_FIELD_LENGTH) },
                    { name: "SSL Certificate", value: truncateText(result.sslCertificate, MAX_FIELD_LENGTH) ?? "-" },
                    { name: "Page Title", value: truncateText(result.pageTitle, MAX_FIELD_LENGTH) || "-" },
                    {
                        name: "VirusTotal Analysis (Note that this only works on known links by VirusTotal)",
                        value: truncateText(getVirusTotalAnalysisText(result.scanResults), MAX_FIELD_LENGTH),
                    },
                    { name: "Metadata", value: truncateText(getMetadataText(result.metadata), MAX_FIELD_LENGTH) },
                ],
                /* image: {
                    url: "attachment://screenshot.png",
                },*/
            };

            // if (args[1] == "-f") 
            //    await message.reply({ embeds: [embed, (await generateIPInfoEmbeds(result.ip.split(", ")))[0]]/* , files: [file]*/ });
            // else
            await message.reply({ embeds: [embed]/* , files: [file]*/ });
            // if (result.screenshotPath) await fs.unlink(result.screenshotPath);
        } catch (error) {
            if (error.code === "PRIVATE_URL") {
                logger.warning(`Blocked private URL destination: ${link}`);
                return await message.reply({ embeds: [embedGenerator.warning("This URL resolves to a private or non-public IP address and was not analyzed.")] });
            }
            logger.error(error);
            const responseStatus = error.response?.status || "-";
            const statusDescription = error.response?.statusText || "Unknown Error";

            const embed = {
                color: 0xffffff,
                title: "Link Analysis",
                fields: [
                    { name: "Unshortened URL", value: link },
                    { name: "Response Status", value: `${responseStatus} (${statusDescription})` },
                    { name: "IP Address", value: "-" },
                    { name: "Type", value: "-" },
                    { name: "SSL Certificate", value: "-" },
                    { name: "Redirect Chain", value: "-" },
                    { name: "Page Title", value: "-" },
                    { name: "VirusTotal Analysis", value: "-" },
                    { name: "Metadata", value: "-" },
                ],
            };

            await message.reply({ embeds: [embed] });
        }

        async function analyzeLink(url) {
            const unshortenedURL = await unshortenURL(url);
            const [
                ip,
                type,
                responseStatus,
                sslCertificate,
                pageTitle,
                metadata,
                scanResults,
                // screenshotPath,
                redirects,
            ] = await Promise.all([
                getDestinationIP(unshortenedURL),
                getDestinationType(unshortenedURL),
                getResponseStatus(unshortenedURL),
                validateSSLCertificate(unshortenedURL),
                getPageTitle(unshortenedURL),
                getMetadata(unshortenedURL),
                getVirusTotalAnalysis(unshortenedURL),
                // getWebsiteScreenshot(unshortenedURL),
                followRedirect(url, true),
            ]);

            return {
                unshortenedURL,
                ip,
                type,
                responseStatus,
                sslCertificate,
                pageTitle,
                metadata,
                scanResults,
                // screenshotPath,
                redirects,
            };
        }

        async function validateURL(input) {
            try {
                const url = new URL(input);
                return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password;
            } catch (err) {
                return false;
            }
        }

        async function unshortenURL(url) {
            try {
                const response = await safeFetch(url, { method: "HEAD" });
                return response.url;
            } catch (error) {
                if (error.code !== "PRIVATE_URL") logger.error(error);
                throw error;
            }
        }

        async function getDestinationIP(url) {
            try {
                const urlObject = new URL(url);
                const addresses = await resolvePublicAddresses(urlObject.hostname);
                const ipv4 = [...new Set(addresses.filter(({ family }) => family === 4).map(({ address }) => address))];
                const ipv6 = [...new Set(addresses.filter(({ family }) => family === 6).map(({ address }) => address))];
                return `IPv4: ${ipv4.join(", ") || "-"}\nIPv6: ${ipv6.join(", ") || "-"}`;
            } catch (error) {
                if (error.code === "PRIVATE_URL") {
                    logger.warning(`URL is private or non-public: ${url}`);
                    return "-";
                }
                logger.error(error);
                return "Error while getting the destination IP";
            }
        }

        async function getDestinationType(url) {
            try {
                const response = await safeFetch(url, { method: "HEAD" });
                const contentType = response.headers.get("content-type");

                if (contentType && contentType.startsWith("text/html")) return "Website";
                else if (contentType && contentType.startsWith("application")) return "App";
                else return "File";
            } catch (error) {
                logger.error(error);
                return "Error while getting the website type";
            }
        }

        async function getResponseStatus(url) {
            try {
                const response = await safeFetch(url, { method: "HEAD" });
                const statusCode = response.status;
                const statusDescription = response.statusText;
                return `${statusCode} (${statusDescription})`;
            } catch (error) {
                logger.error(error);
                return "Error while getting the response status";
            }
        }

        async function validateSSLCertificate(url) {
            try {
                if (new URL(url).protocol !== "https:") return "No SSL certificate";
                await safeFetch(url, { method: "HEAD" });
                return "Valid SSL certificate";
            } catch (error) {
                logger.error(error);
                return "Error validating the SSL certificate";
            }
        }

        async function getPageTitle(url) {
            try {
                const response = await safeFetch(url, { method: "GET" });
                const body = await response.text();
                const root = parse(body);
                const title = root.querySelector("title")?.text;
                return title || null;
            } catch (error) {
                logger.error(error);
                return "Error while getting the page title using node-html-parser";
            }
        }
        
        async function getMetadata(url) {
            try {
                const response = await safeFetch(url, { method: "GET" });
                const body = await response.text();
                const root = parse(body);
        
                const description = root.querySelector("meta[name=\"description\"]")?.getAttribute("content");
                const keywords = root.querySelector("meta[name=\"keywords\"]")?.getAttribute("content");
                const ogTitle = root.querySelector("meta[property=\"og:title\"]")?.getAttribute("content");
                const ogDescription = root.querySelector("meta[property=\"og:description\"]")?.getAttribute("content");
                const author = root.querySelector("meta[name=\"author\"]")?.getAttribute("content");
                const publisher = root.querySelector("meta[property=\"article:publisher\"]")?.getAttribute("content");
                const creator = root.querySelector("meta[name=\"creator\"]")?.getAttribute("content");
        
                const metadata = {
                    description: description || "-",
                    keywords: keywords || "-",
                    ogTitle: ogTitle || "-",
                    ogDescription: ogDescription || "-",
                    author: author || "-",
                    publisher: publisher || "-",
                    creator: creator || "-",
                };
        
                return metadata;
            } catch (error) {
                logger.error(error);
                return null;
            }
        }

        async function getVirusTotalAnalysis(url) {
            try {
                if (!process.env.VIRUS_TOTAL_API_KEY) return null;
                const id = Buffer.from(url).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
                const response = await fetch(`https://www.virustotal.com/api/v3/urls/${id}`, {
                    method: "GET",
                    headers: {
                        "x-apikey": process.env.VIRUS_TOTAL_API_KEY,
                    },
                    signal: AbortSignal.timeout(5000),
                });

                const body = await response.json();
                const scanResults = body.data?.attributes?.last_analysis_stats;
                return scanResults || { isRateLimited: false, harmless: 0, suspicious: 0, malicious: 0 };
            } catch (error) {
                logger.error(error);
                return null;
            }
        }

        function truncateText(text, maxLength) {
            if (text && text.length > maxLength) return text.substring(0, maxLength - 3) + "...";
            return text;
        }

        function getVirusTotalAnalysisText(scanResults) {
            if (!scanResults) return "Error occured while getting virus analysis";
            if (scanResults.isRateLimited) return "VirusTotal API rate limit exceeded. Please try again later.";

            const harmless = truncateText(scanResults.harmless, MAX_FIELD_LENGTH);
            const suspicious = truncateText(scanResults.suspicious, MAX_FIELD_LENGTH);
            const malicious = truncateText(scanResults.malicious, MAX_FIELD_LENGTH);
            return `🟢  Safe: ${harmless ?? "-"}\n🟡  Suspicious: ${suspicious ?? "-"}\n🔴  Malicious: ${malicious ?? "-"}`;
        }

        function getMetadataText(metadata) {
            if (!metadata) return "Error occured while getting metadata using cheerio";
            const description = truncateText(metadata.description, MAX_FIELD_LENGTH);
            const keywords = truncateText(metadata.keywords, MAX_FIELD_LENGTH);
            const ogTitle = truncateText(metadata.ogTitle, MAX_FIELD_LENGTH);
            const ogDescription = truncateText(metadata.ogDescription, MAX_FIELD_LENGTH);
            const author = truncateText(metadata.author, MAX_FIELD_LENGTH);
            const publisher = truncateText(metadata.publisher, MAX_FIELD_LENGTH);
            const creator = truncateText(metadata.creator, MAX_FIELD_LENGTH);
            return `Description: ${description}\nKeywords: ${keywords}\nog:title: ${ogTitle}\nog:description: ${ogDescription}\nAuthor: ${author}\nPublisher: ${publisher}\nCreator: ${creator}`;
        }

        /* async function getWebsiteScreenshot(url) {
            try {

                const rootDir = path.resolve(__dirname, "../../../../..");
                const tempFolderPath = path.join(rootDir, "utils", "temp");
                const screenshotPath = path.join(tempFolderPath, `${Date.now()} - screenshot.png`);

                const browser = await puppeteer.launch({ headless: "new" });
                const page = await browser.newPage();
                await page.goto(url);
                await page.screenshot({ path: screenshotPath });
                await browser.close();
                return screenshotPath;
            } catch (err) {
                logger.error(err);
                return null;
            }
        }*/

        async function followRedirect(url, removeSearchParams = false) {
            const redirects = [];
            let currentURL = new URL(url);

            for (let count = 0; count <= MAX_REDIRECTS; count += 1) {
                redirects.push(removeSearchParams
                    ? currentURL.origin + currentURL.pathname
                    : currentURL.href);

                const response = await requestOnce(currentURL, { method: "HEAD" });
                const location = response.headers.get("location");
                if (response.status < 300 || response.status >= 400 || !location) break;
                if (count === MAX_REDIRECTS) throw new Error("Too many redirects");
                currentURL = new URL(location, currentURL);
            }

            return redirects;
        }

    },
};

const generateIPInfoEmbeds = async (IPArray) => {
    try {
        const response = await (await fetch("http://ip-api.com/batch?fields=258043", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(IPArray),
            signal: AbortSignal.timeout(5000),
        })).json();
        const IPEmbeds = [];
        for (const query of response) {
            const embed = {
                color: 0xffffff,
                title: `Information for: ${query.query}`,
                fields: [
                    { name: "Country", value: query.country ? `${query.country} (${query.countryCode})` : "-" },
                    { name: "Region", value: query.city ? `${query.city} (${query.regionName})` : "-" },
                    { name: "Zip code", value: query.zip ?? "-" },
                    { name: "Location", value: query.lat ? `(${query.lat}, ${query.lon})` : "-" },
                    { name: "Timezone", value: query.timezone ?? "-" },
                    { name: "ISP", value: query.isp ? `${query.isp} (${query.org})` : "-" },
                    { name: "Cellular connection", value: query.mobile ?? "-" },
                    { name: "Proxy connection", value: query.proxy ?? "-" },
                ],
            };
            IPEmbeds.push(embed);
        }
        return IPEmbeds;
    } catch {
        return null;
    }
};
