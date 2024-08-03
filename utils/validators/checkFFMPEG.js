const { exec } = require("child_process");
const logger = require("@utils/log");

const checkFFmpegInstalled = async function() {
    await new Promise((resolve, reject) => {
        exec("ffmpeg -version", (error) => {
            if (error) {
                logger.warning("FFmpeg is not installed on your system.");
                logger.warning("Make sure you have FFmpeg installed and try again.");
                logger.warning("If you are using Windows, make sure to add FFmpeg to your PATH.");
                logger.warning("Exiting...");
                reject(error);
                process.exit(1);
            }

            logger.debug("FFmpeg is installed.");
            resolve();
        });
    });
};

module.exports = { checkFFmpegInstalled };