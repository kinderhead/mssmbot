import { CacheType, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import MSSM from "../bot.js";
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

    public async execute(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        await msg.deferReply({ ephemeral: true });
        bot.memory.clubchannelid = msg.channelId;

        var message = await msg.channel.send({ embeds: [getClubEmbed()] });
        bot.memory.clubmessageid = message.id;

        bot.memory.save();

        await bot.clubs.refreshClubs();

        await msg.editReply("Donezo");
    }
}
