export default class AbstractCommand{

    constructor(name) {
        this.cmdname = name;
    }

    parse(cmd) {
        return this.cmdname == cmd;
    }

    execute(msg,args){}

}