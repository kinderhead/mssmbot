import { Command } from "botinator";
import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import MSSMUser from "../data/user.js";
import MSSM from "../mssm.js";

export default class ModQuestionCommand extends Command<MSSMUser, MSSM> {
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
