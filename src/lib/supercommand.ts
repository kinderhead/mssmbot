import { CacheType, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import Command from "../command.js";
import MSSM from "../bot.js";

export default abstract class SuperCommand extends Command {
    private cmdBuilder: SlashCommandBuilder;

    public abstract get name(): string;
    public abstract get description(): string;
    public abstract get modOnly(): boolean;

    public create() {
        if (this.cmdBuilder === undefined) {
            this.cmdBuilder = new SlashCommandBuilder()
                .setName(this.name)
                .setDescription(this.description);
            
            if (this.modOnly) this.cmdBuilder.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);
        }

        return this.cmdBuilder;
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>) {
        
    }
}
