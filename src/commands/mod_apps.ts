import { APIEmbed, ButtonBuilder, ButtonStyle, CacheType, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder, userMention } from "discord.js";
import MSSM from "../bot.js";
import Command from "../command.js";
import { createCustomId, embedPager, expandAndHandleEmbed } from "../lib/utils.js";

export default class ModAppsCommand extends Command {
    public getName() { return "mod-apps"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Shows all mod apps")
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        var apps: [EmbedBuilder, string][] = (await bot.db.userData.findMany({ where: { mod_application: { not: "" } } })).map(i => [EmbedBuilder.from(JSON.parse(i.mod_application) as APIEmbed), i.id]);
    
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
                await bot.db.userData.update({ where: { id: apps[i][1] }, data: { mod_application: "" } });
                return false;
            }
        });
    }
}
