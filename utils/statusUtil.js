const Discord = require('discord.js')

const discordDatabase = require('../discorddatabase')
const status = require('../status-messages/index')
const variables = require('../utils/variablesUtil')

function triggerStatusUpdate (discordClient, channel, guild, user) {
  console.log(`Printer Status: ${  variables.getStatus()}`)
  const event = status[variables.getStatus()]
  setTimeout(() => {
    event(discordClient, channel, guild, user)
  }, 1000)
}

module.exports.triggerStatusUpdate = function (discordClient, channel, guild, user) {
  triggerStatusUpdate(discordClient, channel, guild, user)
}

module.exports.getDefaultEmbed = function(user,status,color){
  const embed = new Discord.MessageEmbed()
  .setColor(color)
  .setTitle(status)
  .setTimestamp()

  if (typeof (user) === 'undefined') {
    embed.setFooter('Automatic')
  } else {
    embed.setFooter(user.username + '#' + user.discriminator, 'https://cdn.discordapp.com/avatars/' + user.id + '/' + user.avatar +'.webp?size=256')
  }

  return embed
}

module.exports.postStatus = function(discordClient, message, channel){
  const database = discordDatabase.getDatabase()
  if (typeof channel === 'undefined') {
    for (const guildid in database) {
      discordClient.guilds.fetch(guildid)
        .then(async (guild) => {
          const guilddatabase = database[guild.id]
          const broadcastchannels = guilddatabase.statuschannels
          for (const index in broadcastchannels) {
            const channel = guild.channels.cache.get(broadcastchannels[index])
            channel.send(message)
          }
        })
        .catch((error)=>{console.log(error)})
    }
  } else {
    channel.send(message)
  }
}