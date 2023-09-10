import { CacheType, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import MSSM from "../bot.js";
import Command from "../command.js";

export default class SetRulesCommand extends Command {
    public getName() { return "set-rules"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Sets up the rules channel")
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        bot.memory.ruleschannelid = msg.channelId;
        bot.memory.rulesmessageids = [];

        await msg.reply("Working...");
        await bot.sendRules();
        await msg.editReply("Done");
    }
}
