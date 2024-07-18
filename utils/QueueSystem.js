const logger = require("@utils/log");

/**
 * Object to hold multiple queues.
 * @type {Object<string, Function[]>}
 */
const queues = {};

/**
 * Array to keep track of currently processing queues.
 * @type {string[]}
 */
let isProcessing = [];

/**
 * Process the next operation in a specific queue.
 * @param {string} queueName - The name of the queue to process.
 * @returns {Promise<void>}
 */
const processQueue = async (queueName) => {
    if (queues[queueName] && queues[queueName].length > 0 && !isProcessing.includes(queueName)) {
        const operation = queues[queueName].shift();
        isProcessing.push(queueName);

        try {
            await operation();
            isProcessing = isProcessing.filter(x => x != queueName);
            processQueue(queueName);
        } catch (error) {
            logger.error(`Error processing queue '${queueName}':\n` + error);
            isProcessing = isProcessing.filter(x => x != queueName);
            processQueue(queueName);
        }
    }
};

/**
 * Add an operation to a specific queue.
 * @param {string} queueName - The name of the queue to add the operation to.
 * @param {Function} operation - The operation to add to the queue.
 */
const addToQueue = (queueName, operation) => {
    if (!queues[queueName]) 
        queues[queueName] = [];
    
    queues[queueName].push(operation);
    
    if (queues[queueName].length === 1) 
        processQueue(queueName);
};

module.exports = {
    addToQueue,
};
