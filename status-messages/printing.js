const discordDatabase = require('../discorddatabase')
const webcamUtil = require('../utils/webcamUtil')
const thumbnailUtil = require('../utils/thumbnailUtil')
const Discord = require('discord.js');
const variables = require('../utils/variablesUtil')

var getModule = (async function(discordClient,channel,guild,user){
    var database = discordDatabase.getDatabase();
    discordClient.user.setActivity("running Print: "+variables.getProgress().toFixed(0)+"%",{type: "WATCHING"})
     
    if(typeof channel =="undefined"){
        for(var guildid in database){
            discordClient.guilds.fetch(guildid)
            .then(async function(guild){
                var guilddatabase = database[guild.id]
                var broadcastchannels = guilddatabase.statuschannels
                for(var index in broadcastchannels){
                    var channel = guild.channels.cache.get(broadcastchannels[index]);
                    await sendMessage(channel,user)
                }
            })
            .catch(console.error);
        }
    }else{
        await sendMessage(channel,user)
    }
})

async function sendMessage(channel,user){
    if(variables.getProgress().toFixed(2)==0.00){
        return;
    }
    var snapshot = await webcamUtil.retrieveWebcam()
    var thumbnail = await thumbnailUtil.retrieveThumbnail()
    var statusEmbed = new Discord.MessageEmbed()
    .setColor('#0099ff')
    .setTitle('Printing')
    .setAuthor(variables.getCurrentFile())
    .addField('Print Time',variables.getFormatedPrintTime(),true)
    .addField('ETA Print Time',variables.getFormatedRemainingTime,true)
    .addField('Progress',variables.getProgress().toFixed(0)+"%",true)
    .attachFiles([snapshot,thumbnail])
    .setImage(url="attachment://"+snapshot.name)
    .setThumbnail(url="attachment://"+thumbnail.name)
    .setTimestamp()

    if(typeof(user)=="undefined"){
        statusEmbed.setFooter("Automatic")
    }else{
        statusEmbed.setFooter(user.tag, user.avatarURL())
    }

    channel.send(statusEmbed);
}
module.exports = getModule;