import { CacheType, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import Command from "../command.js";

export default class SetCountCommand extends Command {
    public getName() { return "set-count"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Sets up the counting channel")
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>) {
        this.bot.memory.countingchannelid = msg.channelId;
        this.bot.memory.count = 0;
        this.bot.memory.save();

        await msg.reply("It is time to count. Next number is 1.");
    }
}
