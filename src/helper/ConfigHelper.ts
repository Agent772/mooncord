import {existsSync, mkdirSync, readFileSync, writeFileSync} from 'fs'
import path from "path";
import {mergeDeep} from "./DataHelper";
import {getEntry, setData, updateData} from "../utils/CacheUtil";
import {logError, logRegular, logWarn} from "./LoggerHelper";

const args = process.argv.slice(2)

export class ConfigHelper {
    protected configPath = args[0]

    public loadCache() {
        logRegular("load Config Cache...")
        const defaultConfig = this.parseConfig(path.resolve(__dirname, '../scripts/'), 'mooncord_full.cfg')
        mergeDeep(defaultConfig, this.getUserConfig())
        console.log(defaultConfig)
        setData('config', defaultConfig)
    }

    public getConfig() {
        return getEntry('config')
    }

    public parseConfig(path: string, filename: string) {
        if(!existsSync(`${path}/${filename}`)) {
            logError(`Config File ${path}/${filename} is not present, skipping!`)
            return {}
        }
        let file = readFileSync(`${path}/${filename}`, {encoding: "utf-8"})
        file = file.replace(/#.*/g, '')
        const lines = file.replace(/\r/g, '').split('\n')
        let result = {}
        let objects = {}
        let tempKey = undefined
        for(const line of lines) {
            if(/^\[include\s(.*\.cfg)\]$/g.test(line)) {
                const subFile = line.split(' ')[1].replace(']','')
                const subData = this.parseConfig(path, subFile)
                mergeDeep(result, subData)
                continue
            }

            const webcamHeader = line.match(/^\[webcam.*\]$/g)
            if(webcamHeader) {
                const name = webcamHeader[0].replace(/\[|\]/g, '').split(' ')
                if(name.length < 2) {
                    name[1] = 'default'
                }
                if(result[name[0]] === undefined) {
                    result[name[0]] = {}
                }

                objects = {}
                result[name[0]][name[1]] = objects
                continue
            }
            const header = line.match(/^\[([^\]]+)\]$/)
            if(header) {
                if(objects[tempKey] !== undefined && objects[tempKey].length === 0) {
                    objects[tempKey] = undefined
                }
                tempKey = undefined
                const name = header[1]
                objects = {}
                result[name] = objects
                continue
            }
            const value = line.match(/^([^;][^:]*):(.*)$/)
            if(value) {
                const key = value[1].trim()

                if(value[2].trim() === '') {
                    tempKey = value[1]
                    objects[value[1]] = []
                    continue
                }

                let realValue = this.parseValue(value[2].trim())

                if(key.match(/[0-9]+_/g)) {
                    const index = Number(key.match(/[0-9]+/g)) - 1
                    const objectRawKey = key.replace(/[0-9]+/g, '')
                    const objectKeys = objectRawKey.split('_')
                    const objectKey = objectKeys[0]
                    const objectKeyValue = objectKeys[1]

                    if(objects[objectKey] === undefined) {
                        objects[objectKey] = []
                    }

                    if(objects[objectKeys[0]][index] === undefined) {
                        objects[objectKeys[0]].push({[objectKeyValue]: realValue})
                    } else {
                        objects[objectKeys[0]][index][objectKeyValue] = realValue
                    }
                    continue
                }

                if(key.startsWith('- {') && objects[tempKey] !== undefined) {
                    realValue = this.parseValue(`${key}:${value[2].trim()}`)
                    objects[tempKey].push(realValue)
                    continue
                }

                if(key.startsWith('- ') && objects[tempKey] !== undefined) {
                    objects[tempKey].push({key: key.substring(2), value: realValue})
                    continue
                }
                if(objects[tempKey] !== undefined && objects[tempKey].length === 0) {
                    objects[tempKey] = undefined
                }
                tempKey = undefined
                objects[value[1]] = realValue
                continue
            }
            if(tempKey !== undefined && objects[tempKey] !== undefined) {
                const currentLine = this.parseValue(line.trim())
                if(currentLine === undefined || currentLine.length === 0) {
                    continue
                }
                objects[tempKey].push(currentLine)
            }
            if(objects[tempKey] !== undefined && objects[tempKey].length === 0) {
                objects[tempKey] = undefined
            }
        }

        return result
    }

    private parseValue(value: string) {
        let realValue: any = value

        if(realValue === '') {
            return undefined
        }

        if(realValue.startsWith('- ')) {
            realValue = realValue.substring(2)
        }

        const numberValue = Number(value)
        if(!isNaN(numberValue)) {
            realValue = numberValue
        }
        if(realValue === 'true') {
            realValue = true
        }
        if(realValue === 'false') {
            realValue = false
        }
        if(typeof realValue === 'string' && realValue.match(/^\{.*\}/g)) {
            realValue = JSON.parse(realValue)
        }
        if(typeof realValue === 'string') {
            realValue = realValue.replace(/\'/g,'')
        }

        return realValue
    }

    public getUserConfig() {
        return this.parseConfig(this.configPath, 'mooncord.cfg')
    }

    public writeUserConfig(modifiedConfig) {
        updateData('config', modifiedConfig)

        logWarn('write config is currently unsupported!')

        //writeFileSync(this.configLegacyPath, JSON.stringify(modifiedConfig, null, 4), {encoding: 'utf8', flag: 'w+'})
    }

    public getPermissions() {
        return this.getConfig().permission
    }

    public getMoonrakerSocketUrl() {
        return this.getConfig().connection.moonraker_socket_url
    }

    public getMoonrakerUrl() {
        return this.getConfig().connection.moonraker_url
    }

    public getMoonrakerApiKey() {
        return this.getConfig().connection.moonraker_token
    }

    public getDiscordToken() {
        return this.getConfig().connection.bot_token
    }

    public getStatusInterval() {
        return this.getConfig().status.update_interval
    }

    public getStatusMinInterval() {
        return this.getConfig().status.min_interval
    }

    public isStatusPerPercent() {
        return this.getConfig().status.use_percent
    }

    public getStatusBeforeTasks() {
        return this.getConfig().status.before
    }

    public getStatusAfterTasks() {
        return this.getConfig().status.after
    }

    public getLocale() {
        const section = this.getEntriesByFilter(/^language$/g)[0]
        return {
            'locale': section.messages,
            'syntax': section.commands
        }
    }

    public isButtonSyntaxLocale() {
        return this.getEntriesByFilter(/^language$/g)[0].buttons_use_commands_language
    }

    public getWebcamUrl() {
        return this.getConfig().webcam.url
    }

    public getWebcamQuality() {
        return this.getConfig().webcam.quality
    }

    public getWebcamBrightness() {
        return this.getConfig().webcam.brightness
    }

    public getWebcamRotation() {
        return this.getConfig().webcam.rotation
    }

    public getWebcamContrast() {
        return this.getConfig().webcam.contrast
    }

    public isWebcamVerticalMirrored() {
        return this.getConfig().webcam.vertical_mirror
    }

    public isWebcamHorizontalMirrored() {
        return this.getConfig().webcam.horizontal_mirror
    }

    public isWebcamGreyscale() {
        return this.getConfig().webcam.greyscale
    }

    public isWebcamSepia() {
        return this.getConfig().webcam.sepia
    }

    public notifyOnMoonrakerThrottle() {
        return this.getConfig().notifications.moonraker_throttle
    }

    public dumpCacheOnStart() {
        return this.getConfig().development.dump_cache_on_start
    }

    public showNoPermissionPrivate() {
        return this.getConfig().messages.show_no_permission_private
    }

    public getLogPath() {
        return this.getConfig().logger.path
    }

    public isLogFileDisabled() {
        return this.getConfig().logger.disable_file
    }

    public getTempPath() {
        const temppath = this.getConfig().tmp_path

        if (!existsSync(temppath)) {
            mkdirSync(temppath)
        }

        return temppath
    }

    public getIconSet() {
        return this.getConfig().messages.icon_set
    }

    public getEmbedMeta() {
        return this.getConfig().embed_meta
    }

    public getModalMeta() {
        return this.getConfig().modal_meta
    }

    public getInputMeta() {
        return this.getConfig().input_meta
    }

    public getStatusMeta() {
        return this.getConfig().status_meta
    }

    public getTempMeta() {
        return this.getConfig().temp_meta
    }

    public getDateLocale() {
        return this.getConfig().language.date_locale
    }

    public getDiscordRequestTimeout() {
        return this.getConfig().discord.request_timeout
    }

    public getEntriesPerPage() {
        return this.getConfig().messages.entries_per_page
    }

    public traceOnWebErrors() {
        return this.getConfig().development.trace_on_web_error
    }

    public getMoonrakerRetryInterval() {
        return this.getConfig().connection.moonraker_retry_interval
    }

    public notifyOnTimelapseFinish() {
        return this.getConfig().notifications.timelapse
    }

    public getM117NotifactionConfig() {
        return this.getConfig().notifications.m117_notification
    }

    public getGcodeExecuteTimeout() {
        return this.getConfig().status.gcode_timeout
    }

    public getGraphConfig(graph: string) {
        return this.getConfig().graph_meta[graph]
    }

    public getGraphService() {
        return this.getConfig().graph.service
    }

    public getTempTargetNotificationConfig() {
        return this.getConfig().notifications.temp_target_notification
    }

    public getIcons(filter: RegExp) {
        const result = []
        const config = this.getConfig()

        for (const key in config) {
            if(!key.match(/icon.*/g)) {
                continue
            }
            if(!key.match(filter)) {
                continue
            }

            result.push(config[key])
        }

        return result
    }

    public getEntriesByFilter(filter: RegExp) {
        const result = []
        const config = this.getConfig()

        for (const key in config) {
            if(!key.match(filter)) {
                continue
            }

            result.push(config[key])
        }

        return result
    }
}