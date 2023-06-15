const got = require('got');
const cheerio = require('cheerio');
const SendErrorEmbed = require("../../../utils/functions/SendErrorEmbed");

module.exports = {
    name: 'linkinfo',
    description: 'Gives info about a link',
    usage: "< [URL] >",
    category: "utils",
    async execute(logger, client, message, args) {
        message.channel.sendTyping();
        const link = args[0];

        analyzeLink(link)
            .then((result) => {
                const embed = {
                    color: 0xffffff,
                    title: 'Link Analysis',
                    fields: [
                        { name: 'Unshortened URL', value: result.unshortenedURL },
                        { name: 'IP Address', value: result.ip ?? "-" },
                        { name: 'Type', value: result.type },
                        { name: 'Response Status', value: result.responseStatus },
                        { name: 'SSL Certificate', value: result.sslCertificate },
                        { name: 'Redirect Chain', value: result.redirectChain.join(' -> ') || "-" },
                        { name: 'Page Title', value: result.pageTitle || "-" },
                        { name: 'Metadata', value: "Description: " + result.metadata.description + "\nKeywords: " + result.metadata.keywords + "\nog:title: " + result.metadata.ogTitle + "\nog:description: " + result.metadata.ogDescription || "-" },
                    ],
                };

                message.channel.send({ embeds: [embed] });
            })
            .catch((error) => {
                logger.error(error);
                const responseStatus = error.response?.statusCode || "-";
                const statusDescription = response.statusMessage;
        
                const embed = {
                    color: 0xffffff,
                    title: 'Link Analysis',
                    fields: [
                        { name: 'Unshortened URL', value: link },
                        { name: 'Response Status', value: `${responseStatus} (${statusDescription})` },
                        { name: 'IP Address', value: "-" },
                        { name: 'Type', value: "-" },
                        { name: 'SSL Certificate', value: "-" },
                        { name: 'Redirect Chain', value: "-" },
                        { name: 'Page Title', value: "-" },
                        { name: 'Metadata', value: "-" },
                    ],
                };
            
                message.channel.send({ embeds: [embed] });
            });

        async function analyzeLink(url) {
            const unshortenedURL = await unshortenURL(url);
            const ip = await getDestinationIP(unshortenedURL);
            const type = await getDestinationType(unshortenedURL);
            const responseStatus = await getResponseStatus(unshortenedURL);
            const sslCertificate = await getSSLCertificate(unshortenedURL);
            const redirectChain = await getRedirectChain(unshortenedURL);
            const pageTitle = await getPageTitle(unshortenedURL);
            const metadata = await getMetadata(unshortenedURL);
            //const responseHeaders = await getResponseHeaders(unshortenedURL);

            return {
                unshortenedURL,
                ip: ip || "-",
                type,
                responseStatus,
                sslCertificate,
                redirectChain,
                pageTitle: pageTitle || "-",
                metadata: metadata || "-",
            };
        }

        async function unshortenURL(url) {
            const response = await got.head(url, { followRedirect: false });
            if (response.headers.location) {
                return response.headers.location;
            }
            return url;
        }

        async function getDestinationIP(url) {
            const response = await got.head(url, { followRedirect: false });
            if (response.ip) {
                return response.ip;
            }
            return "-";
        }

        async function getDestinationType(url) {
            const response = await got.head(url);
            const contentType = response.headers['content-type'];
  
            if (contentType && contentType.startsWith('text/html')) {
                return 'Website';
            } else if (contentType && contentType.startsWith('application')) {
                return 'App';
            } else {
                return 'File';
            }
        }

        async function getResponseStatus(url) {
            const response = await got.head(url);
            const statusCode = response.statusCode;
            const statusDescription = response.statusMessage;
            return `${statusCode} (${statusDescription})`;
        }
        

        async function getSSLCertificate(url) {
            if (url.startsWith('https')) {
                const response = await got(url);
                // Extract SSL certificate information from the response
                const sslCertificate = response.socket.getPeerCertificate();
                return JSON.stringify(sslCertificate);
            }
            return "-";
        }

        async function getRedirectChain(url) {
            const response = await got(url, { followRedirect: true });
            const redirectChain = response.redirectUrls;
            return redirectChain || [];
        }

        async function getPageTitle(url) {
            const response = await got(url);
            // Extract the page title from the response body
            const matches = response.body.match(/<title>(.*?)<\/title>/i);
            return matches ? matches[1] : null;
        }

        async function getMetadata(url) {
            const response = await got(url);
            const $ = cheerio.load(response.body);
        
            // Extract relevant metadata fields using jQuery-like selectors
            const description = $('meta[name="description"]').attr('content');
            const keywords = $('meta[name="keywords"]').attr('content');
            const ogTitle = $('meta[property="og:title"]').attr('content');
            const ogDescription = $('meta[property="og:description"]').attr('content');
            // Add more metadata fields as needed
        
            // Create a metadata object with the extracted fields
            const metadata = {
                description: description || "-",
                keywords: keywords || "-",
                ogTitle: ogTitle || "-",
                ogDescription: ogDescription || "-",
                // Add more fields as needed
            };
        
            return metadata;
        }
        

        async function getResponseHeaders(url) {
            const response = await got.head(url);
            // Extract relevant response headers and format them as desired
            const headers = response.headers;
            // Example: Return a formatted string of response headers
            return Object.entries(headers)
                .map(([name, value]) => `${name}: ${value}`)
                .join('\n');
        }
    }
};
