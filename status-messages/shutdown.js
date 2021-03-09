const webcamUtil = require('../utils/webcamUtil')
const statusUtil = require('../utils/statusUtil')

const getModule = async function (discordClient, channel, guild, user) {
  discordClient.user.setActivity('wait for Klipper', { type: 'LISTENING' })

  const snapshot = await webcamUtil.retrieveWebcam()

  const statusEmbed = statusUtil.getDefaultEmbed(user,'Klipper Shutdown','#c90000')
  statusEmbed
    .attachFiles(snapshot)
    .setImage(`attachment://${  snapshot.name}`)

  statusUtil.postStatus(discordClient,statusEmbed,channel)
}
module.exports = getModule
