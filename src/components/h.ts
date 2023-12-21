import { Component } from "botinator";
import { Message } from "discord.js";
import MSSMUser from "../data/user.js";
import MSSM from "../mssm.js";

export default class H extends Component<MSSMUser, MSSM> {
    public async onMessage(msg: Message<boolean>) {
        if (msg.channelId === "1039979628397338646") {
            if (msg.content.toLowerCase().includes("h")) {
                this.log.warn(`${this.bot.getUserV2(msg.id).discord.displayName} was very naughty and did H.`);
                await msg.delete();
            }
        } else if (msg.channelId === "789982492413001730") {
            if (!msg.content.toLowerCase().includes("h")) {
                this.log.warn(`${this.bot.getUserV2(msg.id).discord.displayName} was very naughty and did not H.`);
                await msg.delete();
            }
        }
    }
}