import https from "https";
import http from "http";
import dns from "dns/promises";
import net from "net";

const DEFAULT_MAX_BYTES = 1024 * 1024;
const DEFAULT_MAX_REDIRECTS = 5;
const DEFAULT_TIMEOUT_MS = 5000;

async function resolveDNSRecords(hostname, family) {
    try {
        const records = family === 4 ? await dns.resolve4(hostname) : await dns.resolve6(hostname);
        return records.map((address) => ({ address, family }));
    } catch (error) {
        if (["ENODATA", "ENOTFOUND", "EAI_NODATA"].includes(error.code)) return [];
        throw error;
    }
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

/**
 * Resolves a hostname and throws (code PRIVATE_URL) if any address is non-public
 *
 * @param {string} hostname
 * @returns {Promise<{address: string, family: number}[]>}
 */
async function resolvePublicAddresses(hostname) {
    hostname = hostname.replace(/^\[|\]$/g, "");
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

/**
 * Throws unless the URL is http(s), has no credentials and resolves only to public IPs
 *
 * @param {string|URL} input
 */
async function assertPublicURL(input) {
    const url = new URL(input);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) 
        throw new Error("Only HTTP(S) URLs without credentials are allowed");
    
    await resolvePublicAddresses(url.hostname);
}

function requestURL(url, { method, maxBytes, timeoutMs, headersOnly, headers }) {
    return new Promise((resolve, reject) => {
        (async () => {
            if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) 
                throw new Error("Only HTTP(S) URLs without credentials are allowed");
            

            const hostname = url.hostname.replace(/^\[|\]$/g, "");
            const address = (await resolvePublicAddresses(hostname))[0];
            const transport = url.protocol === "https:" ? https : http;
            let settled = false;
            const finish = (fn, value) => {
                if (settled) return;
                settled = true;
                clearTimeout(timeout);
                fn(value);
            };

            const request = transport.request({
                protocol: url.protocol,
                hostname,
                port: url.port || (url.protocol === "https:" ? 443 : 80),
                path: `${url.pathname}${url.search}`,
                method,
                headers: { "Accept-Encoding": "identity", ...headers },
                lookup: (_hostname, lookupOptions, callback) => {
                    if (lookupOptions?.all) callback(null, [address]);
                    else callback(null, address.address, address.family);
                },
                servername: net.isIP(hostname) ? undefined : hostname,
                rejectUnauthorized: true,
            }, (response) => {
                const build = (body) => ({
                    status: response.statusCode,
                    ok: response.statusCode >= 200 && response.statusCode < 300,
                    statusText: response.statusMessage,
                    headers: { get: (name) => response.headers[name.toLowerCase()] ?? null },
                    text: async () => body.toString("utf8"),
                });

                if (headersOnly) {
                    finish(resolve, build(Buffer.alloc(0)));
                    request.destroy();
                    return;
                }

                const chunks = [];
                let size = 0;
                response.on("data", (chunk) => {
                    size += chunk.length;
                    if (size > maxBytes) {
                        request.destroy(new Error(`Response exceeds the ${maxBytes} byte limit`));
                        return;
                    }
                    chunks.push(chunk);
                });
                response.on("end", () => finish(resolve, build(Buffer.concat(chunks))));
                response.on("error", (error) => finish(reject, error));
            });

            const timeout = setTimeout(() => request.destroy(new Error("Request timed out")), timeoutMs);
            request.on("error", (error) => finish(reject, error));
            request.end();
        })().catch(reject);
    });
}

/**
 * fetch-like helper that only talks to public IPs (pinned DNS lookup, validated on every redirect),
 * caps the body size and enforces a timeout.
 *
 * @param {string|URL} input
 * @param {Object} [options]
 * @param {string} [options.method]
 * @param {number} [options.maxBytes]
 * @param {number} [options.maxRedirects]
 * @param {number} [options.timeoutMs]
 * @param {boolean} [options.headersOnly] Resolve as soon as headers arrive, without reading the body
 * @param {Object} [options.headers]
 */
async function safeFetch(input, options = {}) {
    const {
        method = "GET",
        maxBytes = DEFAULT_MAX_BYTES,
        maxRedirects = DEFAULT_MAX_REDIRECTS,
        timeoutMs = DEFAULT_TIMEOUT_MS,
        headersOnly = false,
        headers = {},
    } = options;
    let currentURL = new URL(input);

    for (let count = 0; count <= maxRedirects; count += 1) {
        const response = await requestURL(currentURL, { method, maxBytes, timeoutMs, headersOnly, headers });
        const location = response.headers.get("location");
        if (response.status < 300 || response.status >= 400 || !location) {
            response.url = currentURL.href;
            return response;
        }
        currentURL = new URL(location, currentURL);
    }

    throw new Error("Too many redirects");
}

/**
 * Performs a single request (no redirect following) with the same protections as safeFetch
 *
 * @param {string|URL} input
 * @param {Object} [options] Same options as safeFetch (redirect related ones are ignored)
 */
async function requestOnce(input, options = {}) {
    const {
        method = "GET",
        maxBytes = DEFAULT_MAX_BYTES,
        timeoutMs = DEFAULT_TIMEOUT_MS,
        headersOnly = false,
        headers = {},
    } = options;
    return await requestURL(new URL(input), { method, maxBytes, timeoutMs, headersOnly, headers });
}

export { safeFetch, requestOnce, assertPublicURL, resolvePublicAddresses, isPublicAddress };
