import AbstractCommand from "../AbstractCommand.js";
export default class Suggestion extends AbstractCommand{
    execute(message,args) {
        client.channels.get("1040076894932062229").send(message.content);
    }
}