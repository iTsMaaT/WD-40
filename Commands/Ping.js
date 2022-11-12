import AbstractCommand from "../AbstractCommand.js";
import prettyMilliseconds from 'pretty-ms';

//gives ping and uptime, or can give ping a precise number of times with a custom delay inbetween
export default class Ping extends AbstractCommand{
    execute(message,args) {
        if (args.length == 2) {
            for (let i = 0; i < args[0]; i++) {
                setTimeout(function(){
                    message.channel.send (`Ping : \`${client.ws.ping}ms\``);
                    },1000 * args[1] * i)
            }
        }
        else if(args.length == 1) {
            message.channel.send (`

My ping is \`${client.ws.ping}ms\`
Uptime : \`${prettyMilliseconds(client.uptime)}\`
            
            `); 
        }
    }
}
//Round trip latency : \`${sent.createdTimestamp - message.createdTimestamp}ms\`
//import send from "node:process"