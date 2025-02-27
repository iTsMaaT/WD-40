const logger = require("@utils/log");

/**
 * Map to hold multiple queues with their operations.
 * Using Map instead of plain object for better performance with frequent additions/deletions
 * @type {Map<string, Function[]>}
 */
const queues = new Map();

/**
 * Set to track currently processing queues.
 * Using Set instead of Array for O(1) lookups
 * @type {Set<string>}
 */
const processingQueues = new Set();

/**
 * Process the next operation in a specific queue.
 * @param {string} queueName - The name of the queue to process.
 * @returns {Promise<void>}
 */
const processQueue = async (queueName) => {
    const queue = queues.get(queueName);
    
    if (!queue?.length || processingQueues.has(queueName)) return;

    const operation = queue.shift();
    processingQueues.add(queueName);

    try {
        await operation();
    } catch (error) {
        logger.error(`Error processing queue '${queueName}':\n${error}`);
    } finally {
        processingQueues.delete(queueName);
        // Continue processing if there are more operations
        if (queue.length > 0) 
            setImmediate(() => processQueue(queueName));
        
    }
};

/**
 * Add an operation to a specific queue.
 * @param {string} queueName - The name of the queue to add the operation to.
 * @param {Function} operation - The operation to add to the queue.
 * @throws {TypeError} If operation is not a function
 */
const addToQueue = (queueName, operation) => {
    if (typeof operation !== "function") 
        throw new TypeError("Operation must be a function");
    

    if (!queues.has(queueName)) 
        queues.set(queueName, []);
    
    
    const queue = queues.get(queueName);
    queue.push(operation);
    
    if (queue.length === 1) 
        processQueue(queueName);
    
};

/**
 * Clear a specific queue or all queues.
 * @param {string} [queueName] - The name of the queue to clear. If omitted, clears all queues.
 */
const clearQueue = (queueName) => {
    if (queueName) 
        queues.delete(queueName);
    else 
        queues.clear();
    
};

module.exports = {
    addToQueue,
    clearQueue,
};