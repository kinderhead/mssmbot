import { Command } from "botinator";
import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import MSSMUser from "../data/user.js";
import MSSM from "../mssm.js";

export default class CountingCommand extends Command<MSSMUser, MSSM> {
    public getName() { return "counting"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Various counting commands")
            .addSubcommand(sbc => sbc
                .setName("highscore")
                .setDescription("Displays the highest number we have counted to."))
            .addSubcommand(sbc => sbc
                .setName("check")
                .setDescription("Check what the next number is just in case something goes wrong."));
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>) {
        if (msg.options.getSubcommand() === "highscore") {
            await msg.reply(`Counting Highscore: ${Math.max(this.bot.memory.highscore, this.bot.memory.count)}`);
        } else if (msg.options.getSubcommand() === "check") {
            await msg.reply(`Next number is ${this.bot.memory.count + 1}. Last user to count was ${this.bot.getUser(this.bot.memory.lasttocount).displayName}.`);
        }
    }
}
