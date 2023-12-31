import { Command, createCustomId, embedPager } from "botinator";
import { APIEmbed, ButtonBuilder, ButtonStyle, CacheType, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import MSSMUser from "../data/user.js";
import MSSM from "../mssm.js";

export default class ModAppsCommand extends Command<MSSMUser, MSSM> {
    public getName() { return "mod-apps"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Shows all mod apps")
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>) {
        var apps: [EmbedBuilder, MSSMUser][] = this.bot.getAllMembers().filter(i => i.mod_application !== "").map(i => [EmbedBuilder.from(JSON.parse(i.mod_application) as APIEmbed), i]);

        var sendId = createCustomId();
        var deleteId = createCustomId();
        embedPager(apps.map(i => i[0]), msg.reply.bind(msg), true, "", [
            new ButtonBuilder().setCustomId(sendId).setLabel("Send").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId(deleteId).setLabel("Delete").setStyle(ButtonStyle.Danger)
        ], {
            [sendId]: (i, int) => {
                msg.channel.send({ embeds: [apps[i][0]] });
                return false;
            },
            [deleteId]: async (i, int) => {
                apps[i][1].mod_application = "";
                return false;
            }
        });
    }
}
