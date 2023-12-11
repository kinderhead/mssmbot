import { CacheType, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import Command from "../command.js";

export default class QOTDSendCommand extends Command {
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
