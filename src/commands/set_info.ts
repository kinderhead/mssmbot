import { CacheType, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import MSSM from "../bot.js";
import Command from "../command.js";
import { getInfoEmbeds, getMinecraftEmbeds, getModInfoEmbeds } from "../lib/info_messages.js";

export default class SetInfoCommand extends Command {
    public getName() { return "set-info"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Sets up the information message")
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
            .addSubcommand(sbc => sbc.setName("mod").setDescription("Mod only commands"))
            .addSubcommand(sbc => sbc.setName("pleb").setDescription("Pleb only commands"))
            .addSubcommand(sbc => sbc.setName("minecraft").setDescription("Minecraft info"));
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        if (msg.options.getSubcommand() === "pleb") {
            const info = await msg.channel.send({ embeds: getInfoEmbeds(bot) });

            bot.memory.infochannelid = info.channelId;
            bot.memory.infoid = info.id;
        } else if (msg.options.getSubcommand() === "mod") {
            const info = await msg.channel.send({ embeds: getModInfoEmbeds(bot) });

            bot.memory.modinfochannelid = info.channelId;
            bot.memory.modinfoid = info.id;
        } else if (msg.options.getSubcommand() === "minecraft") {
            const info = await msg.channel.send({ embeds: getMinecraftEmbeds() });

            bot.memory.minecraftchannelid = info.channelId;
            bot.memory.minecraftid = info.id;
        }
        
        bot.memory.save();
        await msg.reply({ ephemeral: true, content: "Done" });
    }
}
