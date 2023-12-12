import { CacheType, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import Command from "../command.js";
import MSSMUser from "../data/user.js";
import MSSM from "../mssm.js";

export default class RefreshCommand extends Command<MSSMUser, MSSM> {
    public getName() { return "refresh"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Refresh commands")
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>) {
        await msg.deferReply();
        await this.bot.refreshCommands();
        await msg.editReply("Refreshed commands");
    }
}
