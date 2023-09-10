import { CacheType, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import MSSM from "../bot.js";
import Command from "../command.js";

export default class AddXPCommand extends Command {
    public getName() { return "add-xp"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Gives a user xp")
            .addUserOption(arg => arg.setName("user").setDescription("User").setRequired(true))
            .addIntegerOption(arg => arg.setName("amount").setDescription("Amount").setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        const user = msg.options.getUser("user");
        var data = await bot.db.userData.findUnique({ where: { id: user.id } });

        await bot.addXP(data, msg.options.getInteger("amount"));

        var data = await bot.db.userData.findUnique({ where: { id: user.id } });
        await msg.reply({ content: `User is now at level ${bot.getLevelFromXP(data.xp)}`, ephemeral: true });
    }
}
