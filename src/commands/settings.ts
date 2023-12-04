import { CacheType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import MSSM from "../bot.js";
import Command from "../command.js";
import { getInfoEmbeds } from "../lib/info_messages.js";
import { settingsHelper } from "../lib/utils.js";
import MSSMUser from "../data/user.js";

export default class SettingsCommand extends Command {
    public getName() { return "settings"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Personalize your experience with MSSM Bot.");
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM, user: MSSMUser) {
        await settingsHelper(bot.getUser(msg), msg.reply.bind(msg), bot, new EmbedBuilder().setTitle("MSSM Bot Options"), [
            { default: user.bio, name: "Bio", desc: "Set the bio that shows up in `/status` and `/whois`", on_change: async i => user.bio = i },
            { default: user.minecraft_username, name: "Minecraft username", desc: "Connect your Minecraft and Discord accounts together for the MSSM Minecraft Server", on_change: async i => user.minecraft_username = i },
            { default: user.levelup_ping, name: "Level up ping", desc: "Get pinged when you level up", on_change: async i => user.levelup_ping = i },
        ]);
    }
}
