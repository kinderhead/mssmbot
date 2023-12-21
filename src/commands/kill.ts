import { Command } from "botinator";
import { CacheType, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import MSSMUser from "../data/user.js";
import MSSM from "../mssm.js";

export default class KillCommand extends Command<MSSMUser, MSSM> {
    public getName() { return "kill"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("PANIC AHHHHHH HELP STOP PLS")
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>) {
        await msg.reply("FHSDIOHAIHFIJHSF");
        process.exit(1);
    }
}
