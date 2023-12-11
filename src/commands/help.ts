import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import Command from "../command.js";
import { getInfoEmbeds } from "../lib/info_messages.js";

export default class HelpCommand extends Command {
    public getName() { return "help"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Displays the help message found in #mssm-bot-info");
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>) {
        await msg.deferReply({ ephemeral: true });
        await msg.editReply({ embeds: getInfoEmbeds(this.bot) });
    }
}
