import { Command } from "botinator";
import { CacheType, ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, userMention } from "discord.js";
import MSSMUser from "../data/user.js";
import MSSM from "../mssm.js";

export default class PoopCommand extends Command<MSSMUser, MSSM> {
    public getName() { return "shit"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("yes")
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>) {
        if (msg.user.id === "1123025469231612044") {
            this.bot.memory.poop++;
            this.bot.memory.save();
        }

        // @ts-ignore
        msg.reply({ content: `${userMention("1123025469231612044")} has shit ${this.bot.memory.poop} times`, flags: [MessageFlags.SuppressNotifications] });
    }
}
