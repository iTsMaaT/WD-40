const prettyMilliseconds = require('pretty-ms');

//gives ping and uptime, or can give ping a precise number of times with a custom delay inbetween
module.exports={
    name:"ping",
    description:"gives ping and uptime, or can give ping a precise number of times with a custom delay inbetween",
    async execute(message,args) {
        if (args.length == 2) {
            for (let i = 0; i < args[0]; i++) {
                setTimeout(function(){
                    message.channel.send (`Ping : \`${client.ws.ping}ms\``);
                    },1000 * args[1] * i)
            }
        }
        else if (args.length == 1) {
            for (let i = 0; i < args[0]; i++) {
                setTimeout(function(){
                    message.channel.send (`Ping : \`${client.ws.ping}ms\``);
                    },1000 * i)
            }
        }
        else if(args.length == 0) {
            const sent = await message.channel.send({ content: 'Pinging...', fetchReply: true });
            
            sent.edit (`

My ping is \`${client.ws.ping}ms\`
Uptime : \`${prettyMilliseconds(client.uptime)}\`
Round trip latency : \`${sent.createdTimestamp - message.createdTimestamp}ms\`
            `);
             
        }
        else {
            message.channel.reply(`Please enter either 1 or 2 arguments.`);
        }
    }
}