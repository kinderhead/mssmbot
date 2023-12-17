import { LOG_CONFIG } from "./bot.js";

export default class Loggable {
    public readonly log = LOG_CONFIG.DEFAULT_LOGGER.getSubLogger({ name: this.constructor.name });
}