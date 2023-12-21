import { Command } from "botinator";
import { CacheType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import MSSMUser from "../data/user.js";
import MSSM from "../mssm.js";

export default class WhoIsCommand extends Command<MSSMUser, MSSM> {
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
