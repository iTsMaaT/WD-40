const got = require('got');
const cheerio = require('cheerio');
const https = require('https');
const SendErrorEmbed = require('../../../../utils/functions/SendErrorEmbed');

module.exports = {
    name: 'linkinfo',
    description: 'Gives info about a link',
    usage: '< [URL] >',
    category: 'utils',
    cooldown: 10000,
    async execute(logger, client, message, args) {
        message.channel.sendTyping();
        const agent = new https.Agent({ keepAlive: true });
        if (!args[0]) return SendErrorEmbed(message, "Please provide a URL", "yellow");
        const link = args[0];
        const metadataCache = {};

        try {
            const result = await analyzeLink(link);

            const embed = {
                color: 0xffffff,
                title: 'Link Analysis',
                fields: [
                    { name: 'Unshortened URL', value: result.unshortenedURL ?? '-' },
                    { name: 'Response Status', value: result.responseStatus},
                    { name: 'IP Address', value: result.ip ?? '-' },
                    { name: 'Type', value: result.type },
                    { name: 'SSL Certificate', value: result.sslCertificate ?? '-' },
                    { name: 'Redirect Chain', value: result.redirectChain?.join(' -> ') || '-' },
                    { name: 'Page Title', value: result.pageTitle || '-' },
                    {
                        name: 'VirusTotal Analysis (Note that this only works on known links by VirusTotal)',
                        value: result.scanResults.isRateLimited
                            ? 'VirusTotal API rate limit exceeded. Please try again later.'
                            : `🟢  Safe: ${result.scanResults.harmless ?? "-"}\n` +
                `🟡  Suspicious: ${result.scanResults.suspicious ?? "-"}\n` +
                `🔴  Malicious: ${result.scanResults.malicious ?? "-"}`,
                    },
                    {
                        name: 'Metadata',
                        value:
              'Description: ' +
              result.metadata.description +
              '\nKeywords: ' +
              result.metadata.keywords +
              '\nog:title: ' +
              result.metadata.ogTitle +
              '\nog:description: ' +
              result.metadata.ogDescription ||
              '-',
                    },
                ],
            };

            message.channel.send({ embeds: [embed] });
        } catch (error) {
            logger.error(error.stack);
            const responseStatus = error.response?.statusCode || '-';
            const statusDescription = error.response?.statusMessage || 'Unknown Error';

            const embed = {
                color: 0xffffff,
                title: 'Link Analysis',
                fields: [
                    { name: 'Unshortened URL', value: link },
                    { name: 'Response Status', value: `${responseStatus} (${statusDescription})` },
                    { name: 'IP Address', value: '-' },
                    { name: 'Type', value: '-' },
                    { name: 'SSL Certificate', value: '-' },
                    { name: 'Redirect Chain', value: '-' },
                    { name: 'Page Title', value: '-' },
                    { name: 'VirusTotal Analysis', value: '-' },
                    { name: 'Metadata', value: '-' },
                ],
            };

            message.channel.send({ embeds: [embed] });
        }

        async function analyzeLink(url) {
            const unshortenedURL = await unshortenURL(url);
            const [
                ip,
                type,
                responseStatus,
                sslCertificate,
                redirectChain,
                pageTitle,
                metadata,
                scanResults,
            ] = await Promise.all([
                getDestinationIP(unshortenedURL),
                getDestinationType(unshortenedURL),
                getResponseStatus(unshortenedURL),
                getSSLCertificate(unshortenedURL),
                getRedirectChain(unshortenedURL),
                getPageTitle(unshortenedURL),
                getMetadata(unshortenedURL),
                getVirusTotalAnalysis(unshortenedURL),
            ]);
          
            return {
                unshortenedURL,
                ip: ip !== '-' ? ip : undefined,
                type,
                responseStatus,
                sslCertificate: sslCertificate !== '-' ? sslCertificate : undefined,
                redirectChain: redirectChain.length > 0 ? redirectChain : undefined,
                pageTitle: pageTitle !== null ? pageTitle : undefined,
                metadata,
                scanResults: {
                    isRateLimited: scanResults.isRateLimited,
                    harmless: scanResults.harmless !== "-" ? scanResults.harmless : undefined,
                    suspicious: scanResults.suspicious !== "-" ? scanResults.suspicious : undefined,
                    malicious: scanResults.malicious !== "-" ? scanResults.malicious : undefined,
                },
            };
        }
          
        async function unshortenURL(url) {
            try {
                const response = await got.head(url, { 
                    followRedirect: false, 
                    agent: { https: agent },
                });
                if ((response.headers.location).startsWith("/")) return url;
                if (response.headers.location) return response.headers.location;
                    
            } catch (error) {
                return url;
            }
        }
          
        async function getDestinationIP(url) {
            try {
                const response = await got.head(url, { followRedirect: false, agent: { https: agent } });
                if (response.ip) {
                    return response.ip;
                }
            } catch (error) {
                // Handle the error
            }
            return '-';
        }
          
        async function getDestinationType(url) {
            try {
                const response = await got.head(url, { agent: { https: agent } });
                const contentType = response.headers['content-type'];
          
                if (contentType && contentType.startsWith('text/html')) {
                    return 'Website';
                } else if (contentType && contentType.startsWith('application')) {
                    return 'App';
                } else {
                    return 'File';
                }
            } catch (error) {
                // Handle the error
                return '-';
            }
        }
          
        async function getResponseStatus(url) {
            const response = await got.head(url, { agent: { https: agent } });
            const statusCode = response.statusCode;
            const statusDescription = response.statusMessage;
            return `${statusCode} (${statusDescription})`;
        }
          
        async function getSSLCertificate(url) {
            try {
                if (url.startsWith('https')) {
                    const response = await got(url, { agent: { https: agent } });
                    if (response.socket) {
                        const sslCertificate = response.socket.getPeerCertificate();
                        return JSON.stringify(sslCertificate);
                    }
                }
            } catch (error) {
                // Handle the error
                return '-';
            }
            return '-';
        }
          
        async function getRedirectChain(url) {
            try {
                const response = await got(url, { followRedirect: true, agent: { https: agent } });
                const redirectChain = response.redirectUrls;
                return redirectChain || [];
            } catch (error) {
                // Handle the error
                return [];
            }
        }
          
        async function getPageTitle(url) {
            try {
                const response = await got(url, { agent: { https: agent } });
                const $ = cheerio.load(response.body);
                const title = $('title').text();
                return title || null;
            } catch (error) {
                // Handle the error
                return null;
            }
        }
          
        async function getMetadata(url) {
            try {
                if (metadataCache[url]) {
                    return metadataCache[url];
                }
          
                const response = await got(url, { agent: { https: agent } });
                const $ = cheerio.load(response.body);
          
                const description = $('meta[name="description"]').attr('content');
                const keywords = $('meta[name="keywords"]').attr('content');
                const ogTitle = $('meta[property="og:title"]').attr('content');
                const ogDescription = $('meta[property="og:description"]').attr('content');
          
                const metadata = {
                    description: description || '-',
                    keywords: keywords || '-',
                    ogTitle: ogTitle || '-',
                    ogDescription: ogDescription || '-',
                };
          
                metadataCache[url] = metadata;
                return metadata;
            } catch (error) {
                // Handle the error
                return {
                    description: '-',
                    keywords: '-',
                    ogTitle: '-',
                    ogDescription: '-',
                };
            }
        }
          
        async function getVirusTotalAnalysis(url) {
            try {
                const id = Buffer.from(url).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
                const response = await got(`https://www.virustotal.com/api/v3/urls/${id}`, {
                    headers: {
                        'x-apikey': process.env.VIRUS_TOTAL_API_KEY,
                    },
                    responseType: 'json',
                    agent: { https: agent },
                });
          
                const scanResults = response?.body?.data?.attributes?.last_analysis_stats;
                return scanResults || { isRateLimited: false, harmless: 0, suspicious: 0, malicious: 0 };
            } catch (error) {
                logger.error(error);
                return { isRateLimited: false, harmless: '-', suspicious: '-', malicious: '-' };
            }
        }
          
    },
};