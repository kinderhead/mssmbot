import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import MSSM from "../bot.js";
import Command from "../command.js";
import { getInfoEmbeds } from "../lib/info_messages.js";

export default class ModQuestionCommand extends Command {
    public getName() { return "mod-send"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Send a message to the mods")
            .addStringOption(opt => opt.setName("Thing").setDescription("Thing to send").setRequired(true));
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>) {
        
    }
}
