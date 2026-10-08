const https = require("https");
const http = require("http");
const dns = require("dns/promises");
const net = require("net");
const fs = require("fs/promises");
// const puppeteer = require("puppeteer");
const { parse } = require("node-html-parser");
const path = require("path");
const embedGenerator = require("@utils/helpers/embedGenerator");

module.exports = {
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
     * @param {import("@utils/log")} logger The logger instance for logging errors and warnings
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
        const MAX_RESPONSE_BYTES = 1024 * 1024;
        const MAX_REDIRECTS = 5;
        const REQUEST_TIMEOUT_MS = 5000;

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

                const response = await requestURL(currentURL, { method: "HEAD" });
                const location = response.headers.get("location");
                if (response.status < 300 || response.status >= 400 || !location) break;
                if (count === MAX_REDIRECTS) throw new Error("Too many redirects");
                currentURL = new URL(location, currentURL);
            }

            return redirects;
        }

        async function safeFetch(input, options = {}) {
            let currentURL = new URL(input);
            const method = options.method || "GET";

            for (let count = 0; count <= MAX_REDIRECTS; count += 1) {
                const response = await requestURL(currentURL, { method });
                const location = response.headers.get("location");
                if (response.status < 300 || response.status >= 400 || !location) {
                    response.url = currentURL.href;
                    return response;
                }
                if (count === MAX_REDIRECTS) throw new Error("Too many redirects");
                currentURL = new URL(location, currentURL);
            }

            throw new Error("Too many redirects");
        }

        async function requestURL(url, { method }) {
            if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("Only HTTP(S) URLs without credentials are allowed");

            const hostname = url.hostname.replace(/^\[|\]$/g, "");
            const addresses = await resolvePublicAddresses(hostname);
            const address = addresses[0];
            const transport = url.protocol === "https:" ? https : http;
            const requestPath = `${url.pathname}${url.search}`;

            return new Promise((resolve, reject) => {
                let settled = false;
                const request = transport.request({
                    protocol: url.protocol,
                    hostname,
                    port: url.port || (url.protocol === "https:" ? 443 : 80),
                    path: requestPath,
                    method,
                    headers: { "Accept-Encoding": "identity" },
                    lookup: (_hostname, lookupOptions, callback) => {
                        if (lookupOptions?.all) callback(null, [address]);
                        else callback(null, address.address, address.family);
                    },
                    servername: net.isIP(hostname) ? undefined : hostname,
                    rejectUnauthorized: true,
                }, (response) => {
                    const chunks = [];
                    let size = 0;

                    response.on("data", (chunk) => {
                        size += chunk.length;
                        if (size > MAX_RESPONSE_BYTES) {
                            request.destroy(new Error("Response exceeds the 1 MiB limit"));
                            return;
                        }
                        chunks.push(chunk);
                    });
                    response.on("end", () => {
                        if (settled) return;
                        settled = true;
                        clearTimeout(timeout);
                        const body = Buffer.concat(chunks);
                        resolve({
                            status: response.statusCode,
                            statusText: response.statusMessage,
                            headers: { get: (name) => response.headers[name.toLowerCase()] ?? null },
                            text: async () => body.toString("utf8"),
                        });
                    });
                    response.on("error", (error) => {
                        if (settled) return;
                        settled = true;
                        clearTimeout(timeout);
                        reject(error);
                    });
                });

                const timeout = setTimeout(() => request.destroy(new Error("Request timed out")), REQUEST_TIMEOUT_MS);
                request.on("error", (error) => {
                    if (settled) return;
                    settled = true;
                    clearTimeout(timeout);
                    reject(error);
                });
                request.end();
            });
        }

        async function resolvePublicAddresses(hostname) {
            const family = net.isIP(hostname);
            const addresses = family
                ? [{ address: hostname, family }]
                : (await Promise.all([
                    resolveDNSRecords(hostname, 4),
                    resolveDNSRecords(hostname, 6),
                ])).flat();

            if (!addresses.length) throw new Error("URL has no IP addresses");
            if (addresses.some(({ address }) => !isPublicAddress(address))) {
                const error = new Error("URL resolves to a non-public IP address");
                error.code = "PRIVATE_URL";
                throw error;
            }
            return addresses;
        }

        async function resolveDNSRecords(hostname, family) {
            try {
                const records = family === 4
                    ? await dns.resolve4(hostname)
                    : await dns.resolve6(hostname);
                return records.map((address) => ({ address, family }));
            } catch (error) {
                if (["ENODATA", "ENOTFOUND", "EAI_NODATA"].includes(error.code)) return [];
                throw error;
            }
        }

        function isPublicAddress(address) {
            const family = net.isIP(address);
            if (family === 4) {
                const value = address.split(".").reduce((result, octet) => (result * 256) + Number(octet), 0);
                const blockedRanges = [
                    ["0.0.0.0", 8], ["10.0.0.0", 8], ["100.64.0.0", 10], ["127.0.0.0", 8],
                    ["169.254.0.0", 16], ["172.16.0.0", 12], ["192.0.0.0", 24], ["192.0.2.0", 24],
                    ["192.88.99.0", 24], ["192.168.0.0", 16], ["198.18.0.0", 15], ["198.51.100.0", 24],
                    ["203.0.113.0", 24], ["224.0.0.0", 4], ["240.0.0.0", 4],
                ];

                return !blockedRanges.some(([network, prefix]) => {
                    const networkValue = network.split(".").reduce((result, octet) => (result * 256) + Number(octet), 0);
                    const mask = (0xffffffff << (32 - prefix)) >>> 0;
                    return (value & mask) === (networkValue & mask);
                });
            }
            if (family !== 6) return false;

            const groups = parseIPv6(address);
            if (!groups) return false;
            if (groups.slice(0, 5).every((group) => group === 0) && groups[5] === 0xffff) {
                const mappedIPv4 = groups.slice(6).flatMap((group) => [group >> 8, group & 0xff]).join(".");
                return isPublicAddress(mappedIPv4);
            }

            const first = groups[0];
            const second = groups[1];
            return first >= 0x2000 && first <= 0x3fff
                && !(first === 0x2001 && (second <= 0x01ff || second === 0x0db8))
                && first !== 0x2002
                && first !== 0x3fff;
        }

        function parseIPv6(address) {
            let value = address.toLowerCase();
            const ipv4Tail = value.match(/(?:^|:)(\d{1,3}(?:\.\d{1,3}){3})$/);
            if (ipv4Tail) {
                const octets = ipv4Tail[1].split(".").map(Number);
                if (octets.some((octet) => octet > 255)) return null;
                const replacement = `${((octets[0] << 8) | octets[1]).toString(16)}:${((octets[2] << 8) | octets[3]).toString(16)}`;
                value = value.slice(0, value.length - ipv4Tail[1].length) + replacement;
            }

            const halves = value.split("::");
            if (halves.length > 2) return null;
            const left = halves[0] ? halves[0].split(":") : [];
            const right = halves[1] ? halves[1].split(":") : [];
            const missing = 8 - left.length - right.length;
            if ((halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) return null;
            const groups = [...left, ...Array(missing).fill("0"), ...right].map((group) => Number.parseInt(group, 16));
            return groups.length === 8 && groups.every((group) => Number.isInteger(group) && group >= 0 && group <= 0xffff)
                ? groups
                : null;
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
