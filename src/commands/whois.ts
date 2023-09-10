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

    public async execute(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        const user = bot.getUser(msg.options.getUser("user"));

        var data = await bot.db.userData.findUnique({ where: { id: user.id } });

        const embed = new EmbedBuilder()
            .setTitle(user.displayName)
            .setThumbnail(user.displayAvatarURL())
            .setDescription(data.bio === "" ? "Nothing here" : data.bio)
            .setColor(user.displayHexColor);
        
        if (msg.user.id === user.id) {
            const int = await buttonHelper(embed, [
                [{ label: "Edit", style: ButtonStyle.Success }, int => int]
            ], msg.reply.bind(msg), false, user.id);

            var bio = await quickModal("Set bio", "Bio (leave blank to not change)", data.bio, TextInputStyle.Paragraph, int, 2048);
            this.log.info(`${user.displayName} changed their bio to ${data.bio}`);

            data = await bot.db.userData.update({ where: { id: user.id }, data: { bio: bio } });
            embed.setDescription(data.bio === "" ? "Nothing here" : data.bio)
            await msg.editReply({ embeds: [embed] });
        } else {
            await msg.reply({ embeds: [embed] });
        }
    }
}
