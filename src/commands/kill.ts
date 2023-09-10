import { CacheType, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import MSSM from "../bot.js";
import Command from "../command.js";

export default class KillCommand extends Command {
    public getName() { return "kill"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("PANIC AHHHHHH HELP STOP PLS")
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        await msg.reply("FHSDIOHAIHFIJHSF");
        process.exit(1);
    }
}
