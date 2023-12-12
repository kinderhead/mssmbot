import { CacheType, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import Command from "../command.js";
import MSSMUser from "../data/user.js";
import MSSM from "../mssm.js";

export default class AddXPCommand extends Command<MSSMUser, MSSM> {
    public getName() { return "add-xp"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Gives a user xp")
            .addUserOption(arg => arg.setName("user").setDescription("User").setRequired(true))
            .addIntegerOption(arg => arg.setName("amount").setDescription("Amount").setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>) {
        const user = this.bot.getUserV2(msg.options.getUser("user").id);

        await this.bot.addXP(user, msg.options.getInteger("amount"));

        await msg.reply({ content: `User is now at level ${this.bot.getLevelFromXP(user.xp)}`, ephemeral: true });
    }
}
