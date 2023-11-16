import { CacheType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import MSSM from "../bot.js";
import Command from "../command.js";
import { getInfoEmbeds } from "../lib/info_messages.js";
import { settingsHelper } from "../lib/utils.js";

export default class SettingsCommand extends Command {
    public getName() { return "settings"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Personalize your experience with MSSM Bot.");
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        var data = await bot.db.userData.findUnique({ where: { id: msg.user.id } });

        await settingsHelper(bot.getUser(msg), msg.reply.bind(msg), bot, new EmbedBuilder().setTitle("MSSM Bot Options"), [
            { default: data.bio, name: "Bio", desc: "Set the bio that shows up in `/status` and `/whois`", on_change: async i => await bot.db.userData.update({ where: { id: msg.user.id }, data: { bio: i } }) },
            { default: data.minecraft_username, name: "Minecraft username", desc: "Connect your Minecraft and Discord accounts together for the MSSM Minecraft Server", on_change: async i => await bot.db.userData.update({ where: { id: msg.user.id }, data: { minecraft_username: i } }) },
            { default: data.levelup_ping, name: "Level up ping", desc: "Get pinged when you level up", on_change: async i => await bot.db.userData.update({ where: { id: msg.user.id }, data: { levelup_ping: i } }) },
        ]);
    }
}
