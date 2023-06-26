'use strict'

import {getEntry, setData} from "../../../utils/CacheUtil";
import {ConsoleHelper} from "../../../helper/ConsoleHelper";

export class ConsoleMessage {

    public async parse(message) {
        if (typeof (message.method) === 'undefined') {
            return
        }
        if (typeof (message.params) === 'undefined') {
            return
        }
        if (message.method !== 'notify_gcode_response') {
            return
        }

        const cache = getEntry('execute')

        const gcodeResponse = message.params[0]
        const commandToExecute = cache.to_execute_command

        if (!gcodeResponse.includes(commandToExecute)) {
            return
        }

        if (gcodeResponse.startsWith('//')) {
            cache.unknown_commands.push(commandToExecute)
        }

        if (gcodeResponse.startsWith('!!')) {
            cache.error_commands.push(commandToExecute)
        }

        setData('execute', cache)
    }
}