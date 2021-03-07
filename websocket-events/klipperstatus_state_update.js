const variables = require('../utils/variablesUtil')
const discordDatabase = require('../discorddatabase')
const Discord = require('discord.js')
const path = require('path')
let notifyembed = new Discord.MessageEmbed()
  .setColor('#fcf803')
  .setTitle('Systemupdates')
  .attachFiles(path.resolve(__dirname, '../images/update.png'))
  .setThumbnail('attachment://update.png')
  .setTimestamp()

const event = async (connection, discordClient) => {
  connection.on('message', async (message) => {
    if (message.type === 'utf8') {
      const messageJson = JSON.parse(message.utf8Data)
      const result = messageJson.result
      if (typeof (result) !== 'undefined') {
        if (typeof (result.version_info) !== 'undefined') {
          variables.setVersions(result.version_info)
          const database = discordDatabase.getDatabase()
          let postUpdate = false
          notifyembed = new Discord.MessageEmbed()
            .setColor('#fcf803')
            .setTitle('Systemupdates')
            .attachFiles(path.resolve(__dirname, '../images/update.png'))
            .setThumbnail('attachment://update.png')
            .setTimestamp()
          for (const software in result.version_info) {
            const softwareinfo = result.version_info[software]
            if (software === 'system') {
              if (softwareinfo.package_count !== 0) {
                notifyembed.addField('System', 'Packages: ' + softwareinfo.package_count, true)
                postUpdate = true
              }
            } else {
              if (softwareinfo.version !== softwareinfo.remote_version) {
                notifyembed.addField(software, softwareinfo.version + ' \n▶️ ' + softwareinfo.remote_version, true)
                postUpdate = true
              }
            }
          }
          if (postUpdate) {
            for (const guildid in database) {
              await discordClient.guilds.fetch(guildid)
                .then(async function (guild) {
                  const guilddatabase = database[guild.id]
                  const broadcastchannels = guilddatabase.statuschannels
                  for (const index in broadcastchannels) {
                    const channel = guild.channels.cache.get(broadcastchannels[index])
                    await sendMessage(channel)
                  }
                })
                .catch(console.error)
            }
          }
        }
      }
    }
  })
}

async function sendMessage (channel) {
  channel.send(notifyembed)
}
module.exports = event