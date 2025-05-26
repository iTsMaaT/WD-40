const os = require("os");
const fs = require("fs");
const path = require("path");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");

class ResourceProfiler {
    constructor() {
        this.data = [];
        this.interval = null;
    }

    start(intervalMs = 1000) {
        if (this.interval) {
            console.warn("Profiler is already running.");
            return;
        }

        this.interval = setInterval(() => {
            const usage = this.getInstantUsage();
            this.data.push({ timestamp: Date.now(), ...usage });
        }, intervalMs);
    }

    stop() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    getInstantUsage() {
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memoryUsage = (usedMemory / totalMemory) * 100;

        const cpus = os.cpus();
        const cpuUsage = cpus.map(cpu => {
            const total = Object.values(cpu.times).reduce((acc, time) => acc + time, 0);
            const idle = cpu.times.idle;
            return ((total - idle) / total) * 100;
        });

        return {
            memoryUsage: memoryUsage.toFixed(2),
            cpuUsage: cpuUsage.map(usage => usage.toFixed(2)),
        };
    }

    getLastFiveMinutesUsage() {
        const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
        return this.data.filter(entry => entry.timestamp >= fiveMinutesAgo);
    }

    getTimedAverageUsage(timeMs) {
        const startTime = Date.now() - timeMs;
        const filteredData = this.data.filter(entry => entry.timestamp >= startTime);

        if (filteredData.length === 0) 
            return { memoryUsage: 0, cpuUsage: [] };
        

        const avgMemoryUsage = filteredData.reduce((sum, entry) => sum + parseFloat(entry.memoryUsage), 0) / filteredData.length;
        const avgCpuUsage = filteredData[0].cpuUsage.map((_, i) =>
            filteredData.reduce((sum, entry) => sum + parseFloat(entry.cpuUsage[i]), 0) / filteredData.length,
        );

        return {
            memoryUsage: avgMemoryUsage.toFixed(2),
            cpuUsage: avgCpuUsage.map(usage => usage.toFixed(2)),
        };
    }

    async generateUsageGraph(outputPath) {
        const timestamps = this.data.map(entry => new Date(entry.timestamp).toLocaleTimeString());
        const memoryUsage = this.data.map(entry => parseFloat(entry.memoryUsage));
        const cpuUsage = this.data.map(entry => parseFloat(entry.cpuUsage[0])); // Average CPU usage for simplicity

        const chartJSNodeCanvas = new ChartJSNodeCanvas({ width: 800, height: 400 });
        const configuration = {
            type: "line",
            data: {
                labels: timestamps,
                datasets: [
                    {
                        label: "Memory Usage (%)",
                        data: memoryUsage,
                        borderColor: "rgba(75, 192, 192, 1)",
                        backgroundColor: "rgba(75, 192, 192, 0.2)",
                        fill: true,
                    },
                    {
                        label: "CPU Usage (%)",
                        data: cpuUsage,
                        borderColor: "rgba(255, 99, 132, 1)",
                        backgroundColor: "rgba(255, 99, 132, 0.2)",
                        fill: true,
                    },
                ],
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: "top",
                    },
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: "Time",
                        },
                    },
                    y: {
                        title: {
                            display: true,
                            text: "Usage (%)",
                        },
                        min: 0,
                        max: 100,
                    },
                },
            },
        };

        const imageBuffer = await chartJSNodeCanvas.renderToBuffer(configuration);
        fs.writeFileSync(outputPath, imageBuffer);
    }
}

module.exports = ResourceProfiler;

const profiler = new ResourceProfiler();
profiler.start();
setTimeout(async () => {
    profiler.stop();
    console.log(profiler.getLastFiveMinutesUsage());
    console.log(profiler.getTimedAverageUsage(300000)); // Example: Average usage over the last 5 minutes
    await profiler.generateUsageGraph(path.join(__dirname, "usageGraph.png"));
}, 60000);