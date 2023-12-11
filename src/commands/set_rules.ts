import { CacheType, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import Command from "../command.js";

export default class SetRulesCommand extends Command {
    public getName() { return "set-rules"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Sets up the rules channel")
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>) {
        this.bot.memory.ruleschannelid = msg.channelId;
        this.bot.memory.rulesmessageids = [];

        await msg.reply("Working...");
        await this.bot.sendRules();
        await msg.editReply("Done");
    }
}
