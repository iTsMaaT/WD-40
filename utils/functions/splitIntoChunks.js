const splitIntoChunks = function(code, chunkSize = 1900) {
    const chunks = [];
    let currentChunk = "";
  
    const lines = code.split("\n");
    for (const line of lines) {
        if (currentChunk.length + line.length + 1 <= chunkSize) {
        // Append line to the current chunk
            currentChunk += line + "\n";
        } else {
        // Push the current chunk to the chunks array and start a new chunk
            chunks.push(currentChunk);
            currentChunk = line + "\n";
        }
    }
  
    // Push the remaining chunk (if any)
    if (currentChunk.length > 0) 
        chunks.push(currentChunk);
    
  
    return chunks;
};
module.exports = splitIntoChunks;