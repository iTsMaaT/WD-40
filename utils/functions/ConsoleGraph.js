const { createCanvas } = require('canvas');
const ConsoleGraph = function(dataPoints, console) {
    // Data points (x, y)
//    const dataPoints = [
//    { x: 1, y: 5 },
//    { x: 12, y: 10 },
//    { x: 25, y: 6 },
//    { x: 37, y: 8 },
//    { x: 49, y: 12 },
//];

    if (console) {
    // Find the minimum and maximum x and y values
        const minX = Math.min(...dataPoints.map(point => point.x));
        const maxX = Math.max(...dataPoints.map(point => point.x));
        const minY = Math.min(...dataPoints.map(point => point.y));
        const maxY = Math.max(...dataPoints.map(point => point.y));
  
        // Set up the dimensions of the graph
        const graphWidth = maxX - minX + 1;
        const graphHeight = maxY - minY + 1;
  
        // Create an empty graph
        const graph = [];
  
        for (let row = 0; row < graphHeight; row++) {
            graph[row] = Array(graphWidth).fill(' ');
        }
  
        // Plot the data points on the graph
        dataPoints.forEach(({ x, y }) => {
            const xPos = x - minX;
            const yPos = graphHeight - (y - minY + 1);
            graph[yPos][xPos] = '*';
        });
  
        // Prepare the graph display
        let graphDisplay = '';
  
        graphDisplay += ' '.repeat(maxY.toString().length) + 'Y\n';
        graphDisplay += ' '.repeat(maxY.toString().length) + '^\n';
  
        for (let row = graphHeight - 1; row >= 0; row--) {
            let line = '';
            if (row === 0 || row === graphHeight - 1) {
                line += (minY + row).toString().padStart(2) + '|';
            } else {
                line += '  |';
            }
  
            for (let col = 0; col < graphWidth; col++) {
                line += graph[row][col];
            }
  
            graphDisplay += line + '\n';
        }
  
        graphDisplay += ' '.repeat(2) + '-'.repeat(graphWidth + 1) + "->X\n";
  
        // Display the x-axis labels
        let xLabelsLine = ' '.repeat(4);
        for (let i = minX; i <= maxX; i++) {
            if (i === minX || i === maxX) {
                xLabelsLine += i.toString();
            } else {
                xLabelsLine += ' ';
            }
        }
  
        graphDisplay += xLabelsLine + '\n';
  
        // Output the graph display
        console.log(graphDisplay);
        return graphDisplay;
        
    } else {

        // Set up canvas size
        const canvasWidth = 400;
        const canvasHeight = 200;
    
        // Find the minimum and maximum values for x and y
        const minX = Math.min(...dataPoints.map((point) => point.x));
        const maxX = Math.max(...dataPoints.map((point) => point.x));
        const minY = Math.min(...dataPoints.map((point) => point.y));
        const maxY = Math.max(...dataPoints.map((point) => point.y));
    
        // Calculate scaling factors for x and y
        const scaleX = canvasWidth / (maxX - minX);
        const scaleY = canvasHeight / (maxY - minY);
    
        // Create a canvas
        const canvas = createCanvas(canvasWidth, canvasHeight);
        const context = canvas.getContext('2d');
    
        // Set line color to white
        context.strokeStyle = 'white';
    
        // Draw the graph
        context.beginPath();
        context.moveTo((dataPoints[0].x - minX) * scaleX, canvasHeight - ((dataPoints[0].y - minY) * scaleY));
    
        for (let i = 1; i < dataPoints.length; i++) {
            context.lineTo((dataPoints[i].x - minX) * scaleX, canvasHeight - ((dataPoints[i].y - minY) * scaleY));
        }
    
        context.stroke();
    
        // Convert canvas to an image
        return canvas.toDataURL('image/png');
    }
};
module.exports = ConsoleGraph;