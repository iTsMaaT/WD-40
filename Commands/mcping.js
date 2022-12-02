const util = require('minecraft-server-util');
const {EmbedBuilder} = require('discord.js');
const options = {
    timeout: 1000 * 5, // timeout in milliseconds
    enableSRV: true // SRV record lookup
};
module.exports ={
    //name: 'mcping',
    description: 'Ping a minecraft server',
    execute(client, message, args){
        const server_ip = args[0]
        const server_port_string = args[1]
        const server_port = parseInt(server_port_string)
        if(!args[0]){
            message.channel.send("Please specify the server ip.")
        }else if(!args[1]){
            message.channel.send("Please specify the server port.")
        }else if(args[0] && args[1]){
            util.status(server_ip, server_port, options)
    .then((result) => {
        
        const string1 = JSON.stringify(result);// turn the object into a string
        const string = JSON.parse(string1);// make the string parsable
        const embed = new EmbedBuilder()
    .setColor("#FF0000")
    .setTitle("Minecraft server status")
    .setDescription(`This will show the status and info about the minecraft server \n **Server ip:** ${server_ip} \n **Server port:** ${server_port}`)
    .addFields(
        {name:"Server Version", value: `${string.version.name}`},
        {name:"Server Protocol Version", value:`${string.version.protocol}`},
        {name:"Players Online", value:`${string.players.online}`},
        {name:"Max Players", value:`${string.players.max}`},
        {name:"MOTD (May Not Display Accurately)", value:`${string.motd.clean}`},
        {name:"Latency", value:`${string.roundTripLatency}`},
    )
    .setTimestamp()
    message.channel.send({embeds: [embed]})// send the embed
    })
    
    .catch((error) => {
    console.log(error);// if the server was unable to be pinged or something else happened
    const embed = new EmbedBuilder()
    .setColor("#808080")
    .setTitle("There was an error preforming your command")
    .setDescription(`The server was unable to be pinged or you mis-typed the info`)
    .setTimestamp()
    message.channel.send({embeds: [embed]})// send the embed
    
    });
        }
        

    }   
}