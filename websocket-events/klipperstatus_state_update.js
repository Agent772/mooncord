const Discord = require('discord.js')
const path = require('path')
const { variables, database } = require('../utils')
const { discordClient } = require('../clients')

let notifyembed

const event = async (message) => {
  if (message.type === 'utf8') {
    const messageJson = JSON.parse(message.utf8Data)
    const { result } = messageJson
    if (typeof (result) !== 'undefined' && typeof (result.version_info) !== 'undefined') {
      const guildsdatabase = database.getDatabase()
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
          if (softwareinfo.package_count !== 0 && (typeof (variables.getVersions()) === 'undefined' || softwareinfo.package_count !== variables.getVersions()[software].package_count)) {
            notifyembed.addField('System', `Packages: ${softwareinfo.package_count}`, true)
            postUpdate = true
          }
        } else {
          if (softwareinfo.version !== softwareinfo.remote_version && (typeof (variables.getVersions()) === 'undefined' || softwareinfo.remote_version !== variables.getVersions()[software].remote_version)) {
            notifyembed.addField(software, `${softwareinfo.version} \n🆕 ${softwareinfo.remote_version}`, true)
            postUpdate = true
          }
        }
      }
      if (postUpdate) {
        variables.setVersions(result.version_info)
        for (const guildid in guildsdatabase) {
          await discordClient.getClient().guilds.fetch(guildid)
            .then(async (guild) => {
              const guilddatabase = guildsdatabase[guild.id]
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

async function sendMessage (channel) {
  channel.send(notifyembed)
}
module.exports = event
