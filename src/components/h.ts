import { GuildEmoji, Awaitable, Message } from "discord.js";
import Component from "../lib/component.js";

export default class H extends Component {
    public async onMessage(msg: Message<boolean>) {
        if (msg.channelId === "1039979628397338646") {
            if (msg.content.toLowerCase().includes("h")) {
                this.log.warn(`${this.bot.getUser(msg).displayName} was very naughty and did H.`);
                await msg.delete();
            }
        } else if (msg.channelId === "789982492413001730") {
            if (!msg.content.toLowerCase().includes("h")) {
                this.log.warn(`${this.bot.getUser(msg).displayName} was very naughty and did not H.`);
                await msg.delete();
            }
        }
    }
}