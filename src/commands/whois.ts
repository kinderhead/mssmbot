import { bold, ButtonStyle, CacheType, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder, TextInputStyle } from "discord.js";
import MSSM from "../bot.js";
import Command from "../command.js";
import { buttonHelper, quickModal } from "../lib/utils.js";

export default class WhoIsCommand extends Command {
    public getName() { return "whois"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Check who a user is")
            .addUserOption(opt => opt.setName("user").setDescription("User").setRequired(true));
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>) {
        const user = this.bot.getUserV2(msg.options.getUser("user").id);

        const embed = new EmbedBuilder()
            .setTitle(user.discord.displayName)
            .setThumbnail(user.discord.displayAvatarURL())
            .setDescription(user.bio === "" ? "Nothing here" : user.bio)
            .setColor(user.discord.displayHexColor);

        await msg.reply({ embeds: [embed] });
    }
}
