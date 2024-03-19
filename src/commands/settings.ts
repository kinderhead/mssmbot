import { Command, settingsHelper } from "botinator";
import { CacheType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import MSSMUser from "../data/user.js";
import MSSM from "../mssm.js";

export default class SettingsCommand extends Command<MSSMUser, MSSM> {
    public getName() { return "settings"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Personalize your experience with MSSM Bot.");
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>, user: MSSMUser) {
        await settingsHelper(this.bot.getUser(msg), msg.reply.bind(msg), new EmbedBuilder().setTitle("MSSM Bot Options"), [
            { default: user.bio == "" ? "Nothing here" : user.bio, name: "Bio", desc: "Set the bio that shows up in `/status` and `/whois`", on_change: async (i: string) => user.bio = i },
            { default: user.minecraft_username == "" ? "Nothing here": user.minecraft_username, name: "Minecraft username", desc: "Connect your Minecraft and Discord accounts together for the MSSM Minecraft Server", on_change: async (i: string) => user.minecraft_username = i },
            { default: user.levelup_ping, name: "Level up ping", desc: "Get pinged when you level up", on_change: async i => user.levelup_ping = i },
        ]);
    }
}
