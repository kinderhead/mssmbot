import { CacheType, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import MSSM from "../bot.js";
import Command from "../command.js";

export default class HandCommand extends Command {
    public getName() { return "hand"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("View private information sent by games")
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        await msg.deferReply({ ephemeral: true });
        if (bot.hands[msg.user.id] !== undefined) {
            bot.hands[msg.user.id](msg);
        } else {
            await msg.editReply({ content: "Nothing here." });
        }
    }
}
