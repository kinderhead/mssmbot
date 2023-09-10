import { CacheType, CategoryChannel, ChatInputCommandInteraction, GuildChannel, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import MSSM from "../bot.js";
import Command from "../command.js";

export default class ArchiveCommand extends Command {
    public getName() { return "archive"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Archive a channel")
            .addChannelOption(arg => arg.setName("channel").setDescription("Channel").setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        const channel = msg.options.getChannel("channel") as GuildChannel;
        const category = channel.guild.channels.cache.get("986118578560454656") as CategoryChannel;

        await msg.deferReply();
        await channel.setParent(category);
        await channel.lockPermissions();
        await msg.editReply("Done");

        this.log.info(`Archived ${channel.name}`);
    }
}
