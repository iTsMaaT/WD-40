// Define an object to hold multiple queues
const queues = {};
let isProcessing = [];

// Function to process the next operation in a specific queue
const processQueue = async (queueName) => {
    // Check if the specified queue exists and has operations
    if (queues[queueName] && queues[queueName].length > 0 && !isProcessing.includes(queueName)) {
    // Get the next operation from the specified queue
        const operation = queues[queueName].shift();
        isProcessing.push(queueName);

        try {
            // Execute the operation
            await operation();
            isProcessing = isProcessing.filter(x => x != queueName);

            // Process the next operation in the specified queue
            processQueue(queueName);
        } catch (error) {
            logger.error(`Error processing queue '${queueName}':\n` + error);

            isProcessing = isProcessing.filter(x => x != queueName);
            // Process the next operation in the specified queue even if an error occurs
            processQueue(queueName);
        }
    }
};

// Function to add an operation to a specific queue
const addToQueue = (queueName, operation) => {
    // Check if the specified queue exists, if not create it
    if (!queues[queueName]) 
        queues[queueName] = [];
    

    // Push the operation to the end of the specified queue
    queues[queueName].push(operation);

    // If the specified queue was empty, start processing the operations
    if (queues[queueName].length === 1) 
        processQueue(queueName);
    
};

module.exports = {
    addToQueue,
};
