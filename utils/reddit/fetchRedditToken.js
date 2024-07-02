const fs = require("fs");

async function getRedditToken() {    
    const changelogs = require("../../changelogs.json");
    const version = changelogs[changelogs.length - 1].version;
    const UserAgent = "WD-40 Discord Bot/v" + version + " by u/itsmath";
    let baseUrl = "https://www.reddit.com";
    const headers = {
        "User-Agent": UserAgent,
        "Accept": "application/json",
        "Accept-Encoding": "gzip,deflate,br",
    };

    try {
        let { access_token, expires_at } = require("./redditConf.json");

        if (Date.now() >= expires_at) {
            // Needs to refresh the tokens
            const refresh_url = "https://www.reddit.com/api/v1/access_token";

            const result = await fetch(refresh_url, {
                method: "POST",
                headers: {
                    Authorization: "Basic " + Buffer.from(process.env.REDDIT_CLIENT_ID + ":" + process.env.REDDIT_CLIENT_SECRET).toString("base64"),
                    "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
                },
                body: `grant_type=refresh_token&refresh_token=${encodeURIComponent(process.env.REDDIT_REFRESH_TOKEN)}`,
            });

            if (result.status == 200) {
                const res_body = await result.json();
                if (res_body.access_token) {
                    const toSave = {
                        access_token: res_body.access_token,
                        expires_at: Date.now() + (parseInt(res_body.expires_in) * 1000),
                    };
                    fs.writeFileSync(process.cwd() + "/utils/reddit/redditConf.json", JSON.stringify(toSave), { encoding: "UTF-8" });
                    access_token = toSave.access_token;
                    expires_at = toSave.expires_at;
                } else {
                    throw new Error("Failed to obtain access token from response");
                }
            } else {
                throw new Error(`Token refresh failed with status: ${result.status}`);
            }
        }

        baseUrl = "https://oauth.reddit.com";
        headers["Authorization"] = "Bearer " + access_token;
    } catch (e) {
        console.error(e);
        throw e; // Ensure to propagate the error
    }

    return { baseUrl, headers };
}

async function initConfFile() {    
    const confFile = process.cwd() + "/utils/reddit/redditConf.json";
    if (!fs.existsSync(confFile)) {
        const conf = {
            access_token: "",
            expires_at: Date.now(),
        };
        fs.writeFileSync(confFile, JSON.stringify(conf), { encoding: "UTF-8" });
    }
}

module.exports = { getRedditToken, initConfFile };
