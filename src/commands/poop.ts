import { CacheType, ChatInputCommandInteraction, MessageFlags, SlashCommandBuilder, userMention } from "discord.js";
import MSSM from "../bot.js";
import Command from "../command.js";

export default class PoopCommand extends Command {
    public getName() { return "shit"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("yes")
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        if (msg.user.id === "1123025469231612044") {
            bot.memory.poop++;
            bot.memory.save();
        }

        // @ts-ignore
        msg.reply({ content: `${userMention("1123025469231612044")} has shit ${bot.memory.poop} times`, flags: [MessageFlags.SuppressNotifications] });
    }
}
