import { CacheType, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import MSSM from "../bot.js";
import Command from "../command.js";

export default class CreateClubCommand extends Command {
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

    public async execute(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        await msg.deferReply({ ephemeral: true });

        await bot.db.clubData.create({
            data: {
                name: msg.options.getString("name"),
                channel: msg.options.getChannel("channel").id,
                role: msg.options.getRole("role").id,
                manager: {
                    connect: { id: msg.options.getUser("manager").id }
                }
            }
        });
        
        await msg.editReply("Done");
    }
}
