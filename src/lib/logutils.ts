import { DEFAULT_LOGGER } from "./bot.js";

export default class Loggable {
    public readonly log = DEFAULT_LOGGER.getSubLogger({ name: this.constructor.name });
}