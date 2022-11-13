
//starts from a random number, then counts everytime a precise user says sex, no args to reset
module.exports={
    name:"sex",
    desciption:"starts from a random number, then counts everytime a precise user says sex, no args to reset",
    execute(message,args) {
        if (message.member.permissions.has("Administrator")) {
            if (args.length == 1) {
                const rawid1 =  args[0].replace("@", "")
                const rawdid2 = rawid1.replace("<", "")
                SexID = rawdid2.replace(">", "")
                message.channel.send (`\<\@${SexID}\> is too horny`);
                SexCount = Math.floor(Math.random()*100000) + 1;
            }
            else {
                SexID = 0;
                message.channel.send (`Sex is reset`);
            }
        }
        else {
            message.channel.send(`You are not allowed to execute that command`);
        }
    }
}
