import { Command } from "botinator";
import { CacheType, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import Club from "../data/club.js";
import MSSMUser from "../data/user.js";
import MSSM from "../mssm.js";

export default class CreateClubCommand extends Command<MSSMUser, MSSM> {
    public getName() { return "create-club"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Create a new club")
            .addStringOption(opt => opt.setName("name").setDescription("Name").setRequired(true))
            .addUserOption(opt => opt.setName("manager").setDescription("Manager").setRequired(true))
            .addChannelOption(opt => opt.setName("channel").setDescription("Channel").setRequired(true))
            .addRoleOption(opt => opt.setName("role").setDescription("Role").setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>) {
        await msg.deferReply({ ephemeral: true });
        await Club.create(this.bot, msg.options.getString("name"), msg.options.getChannel("channel").id, msg.options.getRole("role").id, this.bot.getUserV2(msg.options.getUser("manager").id));
        await msg.editReply("Done");
        await this.bot.clubs.refreshClubs();
    }
}
