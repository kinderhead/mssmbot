import { Command } from "discord-botinator";
import { CacheType, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import MSSMUser from "../data/user.js";
import MSSM from "../mssm.js";

export default class RefreshCommand extends Command<MSSM, MSSMUser> {
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
