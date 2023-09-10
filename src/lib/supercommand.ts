import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import Command from "../command.js";
import MSSM from "../bot.js";

export default abstract class SuperCommand extends Command {
    private cmdBuilder: SlashCommandBuilder;

    public create() {
        if (this.cmdBuilder === undefined) {
            
        }

        return this.cmdBuilder;
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        msg.options.data
    }
}
