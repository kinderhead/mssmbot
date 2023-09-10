import { CacheType, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import MSSM from "../bot.js";
import Command from "../command.js";

export default class RefreshCommand extends Command {
    public getName() { return "refresh"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Refresh commands")
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        await msg.deferReply();
        await bot.refreshCommands();
        msg.editReply("Refreshed commands");
    }
}
