import { CacheType, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import Command from "../command.js";
import { getClubEmbed } from "../lib/info_messages.js";

export default class SetClubsCommand extends Command {
    public getName() { return "set-clubs"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Sets up the clubs channel")
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>) {
        await msg.deferReply({ ephemeral: true });
        this.bot.memory.clubchannelid = msg.channelId;

        var message = await msg.channel.send({ embeds: [getClubEmbed()] });
        this.bot.memory.clubmessageid = message.id;

        this.bot.memory.save();

        await this.bot.clubs.refreshClubs();

        await msg.editReply("Donezo");
    }
}
