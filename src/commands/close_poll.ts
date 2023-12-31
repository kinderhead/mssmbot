import { Command } from "botinator";
import { CacheType, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import MSSMUser from "../data/user.js";
import MSSM from "../mssm.js";

export default class ClosePollCommand extends Command<MSSMUser, MSSM> {
    public getName() { return "qotd-close-poll"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Close a poll")
            .addIntegerOption(arg => arg.setName("id").setDescription("Poll id").setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>) {
        await msg.reply({ content: "Poll is closed", ephemeral: true });
        await this.bot.qotd.closePoll(this.bot.qotd.polls[msg.options.getInteger("id")]);
    }
}