import AbstractCommand from "../AbstractCommand.js";

//test command
export default class Test extends AbstractCommand{
    execute(message,args) {
            message.channel.send({content:"Shut the fuck up" , ephemeral: true});
            message.channel.send("Shut the fuck up");
    }
}