const https = require("https");
const fetch = require("node-fetch");
const cheerio = require("cheerio");
const { SendErrorEmbed } = require("@functions/discordFunctions");
const dns = require("dns/promises");

module.exports = {
    name: "linkinfo",
    description: "Gives info about a link",
    usage: "< [URL] >",
    aliases: ["linfo"],
    category: "info",
    cooldown: 10000,
    async execute(logger, client, message, args) {
        const agent = new https.Agent({ keepAlive: true });
        if (!args[0]) return SendErrorEmbed(message, "Please provide a URL", "yellow");
        const link = args[0];
        const MAX_FIELD_LENGTH = 1000;

        try {
            if (!await validateURL(link)) return SendErrorEmbed(message, "Invalid URL", "yellow");
            const result = await analyzeLink(link);

            const embed = {
                color: 0xffffff,
                title: "Link Analysis",
                fields: [
                    { name: "Unshortened URL", value: truncateText(result.unshortenedURL, MAX_FIELD_LENGTH) ?? "-" },
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
            };

            message.reply({ embeds: [embed] });
        } catch (error) {
            logger.error(error.stack);
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
            ] = await Promise.all([
                getDestinationIP(unshortenedURL),
                getDestinationType(unshortenedURL),
                getResponseStatus(unshortenedURL),
                validateSSLCertificate(unshortenedURL),
                getPageTitle(unshortenedURL),
                getMetadata(unshortenedURL),
                getVirusTotalAnalysis(unshortenedURL),
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
            };
        }

        async function validateURL(input) {
            try {
                new URL(input);
                return true;
            } catch (err) {
                return null;
            }
        }

        async function unshortenURL(url) {
            try {
                const response = await fetch(url, { method: "HEAD", redirect: "manual", agent: agent });
                if (response.headers.get("location")?.startsWith("/")) return url;
                if (response.headers.get("location")) return response.headers.get("location");
            } catch (error) {
                logger.error(error);
                return url;
            }
            return url;
        }

        async function getDestinationIP(url) {
            try {
                const urlObject = new URL(url);
                const ip = await dns.resolve4(urlObject.hostname);
                if (ip) return ip.join(", ");
            } catch (error) {
                logger.error(error);
                return "Error while getting the destination IP";
            }
            return null;
        }

        async function getDestinationType(url) {
            try {
                const response = await fetch(url, { method: "HEAD", agent: agent });
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
                const response = await fetch(url, { method: "HEAD", agent: agent });
                const statusCode = response.status;
                const statusDescription = response.statusText;
                return `${statusCode} (${statusDescription})`;
            } catch (error) {
                logger.error(error);
                return "Error while getting the response status";
            }
        }

        async function validateSSLCertificate(url) {
            return new Promise((resolve) => {
                try {
                    const urlObject = new URL(url);
                    const options = {
                        hostname: urlObject.hostname,
                        port: 443,
                        path: "/",
                        method: "GET",
                        rejectUnauthorized: true,
                    };
        
                    const req = https.request(options, (res) => {
                        const certificate = res?.socket?.getPeerCertificate();
                        if (certificate) 
                            resolve("Valid SSL certificate");
                        else 
                            resolve(null);
                        
                    });
        
                    req.on("error", (error) => {
                        console.error(error);
                        resolve("Error validating the SSL certificate");
                    });
        
                    req.end();
                } catch (error) {
                    console.error(error);
                    resolve("Error validating the SSL certificate");
                }
            });
        }

        async function getPageTitle(url) {
            try {
                const response = await fetch(url, { agent: agent });
                const body = await response.text();
                const $ = cheerio.load(body);
                const title = $("title").text();
                return title || null;
            } catch (error) {
                logger.error(error);
                return "Error while getting the page title using cheerio";
            }
        }

        async function getMetadata(url) {
            try {
                const response = await fetch(url, { agent: agent });
                const body = await response.text();
                const $ = cheerio.load(body);

                const description = $("meta[name=\"description\"]").attr("content");
                const keywords = $("meta[name=\"keywords\"]").attr("content");
                const ogTitle = $("meta[property=\"og:title\"]").attr("content");
                const ogDescription = $("meta[property=\"og:description\"]").attr("content");
                const author = $("meta[name=\"author\"]").attr("content");
                const publisher = $("meta[property=\"article:publisher\"]").attr("content");
                const creator = $("meta[name=\"creator\"]").attr("content");

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
                const id = Buffer.from(url).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
                const response = await fetch(`https://www.virustotal.com/api/v3/urls/${id}`, {
                    method: "GET",
                    headers: {
                        "x-apikey": process.env.VIRUS_TOTAL_API_KEY,
                    },
                    agent: agent,
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
    },
};
