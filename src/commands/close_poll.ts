import { CacheType, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import MSSM from "../bot.js";
import Command from "../command.js";

export default class ClosePollCommand extends Command {
    public getName() { return "qotd-close-poll"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Close a poll")
            .addIntegerOption(arg => arg.setName("id").setDescription("Poll id").setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        await msg.reply({ content: "Poll is closed", ephemeral: true });
        await bot.qotd.closePoll(bot.qotd.polls[msg.options.getInteger("id")]);
    }
}