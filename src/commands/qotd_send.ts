import { Command } from "botinator";
import { CacheType, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import MSSMUser from "../data/user.js";
import MSSM from "../mssm.js";

export default class QOTDSendCommand extends Command<MSSMUser, MSSM> {
    public getName() { return "qotd-send"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Sends the next question")
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>) {
        await msg.reply({ content: "Asking question", ephemeral: true });
        await this.bot.qotd.qotdSend();
    }
}
