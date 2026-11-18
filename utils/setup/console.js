// Routes console output through the logger. Imported right after the env setup
// so every module loaded afterwards logs through it.
import logger from "#utils/log.js";

console.warner = console.warn;
console.logger = console.log;
console.log = (message, ...args) => logger.console(message, ...args);
console.warn = (message, ...args) => logger.warning(message, ...args);
console.error = (message, ...args) => logger.error(message, ...args);
console.info = (message, ...args) => logger.info(message, ...args);
console.debug = (message, ...args) => logger.debug(message, ...args);
console.log("Logger instanciated");
