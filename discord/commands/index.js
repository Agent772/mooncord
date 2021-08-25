const locale = require('../../utils/localeUtil')
const loadUtil = require('../../utils/loadUtil')

const commandOptions = require('../commands-metadata/commands_options.json')
const optionTypes = require('../commands-metadata/option_types.json')

module.exports.addCommandEvents = (discordClient) => { commandEvent(discordClient) }
module.exports.loadSlashCommands = async (discordClient) => { await loadSlashCommands(discordClient) }

async function loadSlashCommands(discordClient) {
    const commandList = []
    for (const commandIndex in commands) {
        buildSlashCommand(commandIndex)
        const command = commands[commandIndex]
        commandList.push(command.command())
    }
    await discordClient.application?.commands.set(commandList)
}

function buildSlashCommand(command) {
    const messageLocale = locale.commands[command]
    const syntaxLocale = locale.syntaxlocale.commands[command]

    const builder = {
        name: syntaxLocale.command,
        description: messageLocale.description,
        options: []
    }
    
    for(const index in commandOptions[command]) {
        buildCommandOption(
            builder,
            commandOptions[command],
            index,
            syntaxLocale,
            messageLocale)
    }

    console.log(builder)
}

function buildCommandOption(builder, meta, option, syntaxMeta, messageMeta) {
    if (typeof(meta) === 'undefined') { return }

    const optionMeta = meta[option]

    if (typeof(optionMeta) === 'undefined') { return }
    if (Object.keys(optionMeta).length == 0) { return }

    const optionBuilder = {
        type: optionTypes[optionMeta.type],
        name: syntaxMeta.options[option].name,
        description: messageMeta.options[option].description,
        options: []
    }

    optionBuilder.required = optionMeta.required

    if (typeof (optionMeta.choices) !== 'undefined') {
        if (optionMeta.choices === '${loadInfoChoices}') {
            optionBuilder.choices = convertChoices(loadUtil.getComponents())
        } else {
            optionBuilder.choices = convertChoices(optionMeta.choices)
        }
    }

    console.log(optionBuilder)
    
    for(const index in meta[option].options) {
        buildCommandOption(
            optionBuilder,
            meta[option].options,
            index,
            syntaxMeta.options[option],
            messageMeta.options[option])
    }

    builder.options.push(optionBuilder)
}

function convertChoices(choices) {
    const answer = []
    for (const index in Object.keys(choices)) {
        const value = choices[index]
        answer.push([value.name, value.value])
    }
    return answer
}

function commandEvent(discordClient) {
    discordClient.on('interactionCreate', async interaction => {
        if (!interaction.isCommand()) { return }
        for (const commandIndex in commands) {
            const command = commands[commandIndex]
            if (command.command().name === interaction.commandName) {
                await command.reply(interaction)
                return
            }
        }
    })
}

const commands = {
    admin: require('./admin'),
    editchannel: require('./editChannel'),
    emergency_stop: require('./emergencyStop'),
    execute: require('./execute'),
    fileinfo: require('./fileInfo'),
    get_log: require('./getLog'),
    info: require('./info'),
    listfiles: require('./listFiles'),
    loadinfo: require('./loadInfo'),
    notify: require('./notify'),
    printjob: require('./printJob'),
    status: require('./status'),
    temp: require('./temp'),
    timelapse: require('./timelapse')
}