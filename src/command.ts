import { AutocompleteInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from "discord.js";
import MSSM from "./bot.js";
import Loggable from "./lib/logutils.js";

export default abstract class Command extends Loggable {
    public abstract getName(): string;
    public abstract create(): SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
    public abstract execute(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM): Promise<void>;

    public autocomplete(cmd: AutocompleteInteraction, bot: MSSM): Promise<void> { return new Promise<void>(() => { }); }
}
