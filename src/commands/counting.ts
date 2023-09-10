import { CacheType, ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import MSSM from "../bot.js";
import Command from "../command.js";

export default class CountingCommand extends Command {
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

    public async execute(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        if (msg.options.getSubcommand() === "highscore") {
            await msg.reply(`Counting Highscore: ${Math.max(bot.memory.highscore, bot.memory.count)}`);
        } else if (msg.options.getSubcommand() === "check") {
            await msg.reply(`Next number is ${bot.memory.count + 1}. Last user to count was ${bot.getUser(bot.memory.lasttocount).displayName}.`);
        }
    }
}
