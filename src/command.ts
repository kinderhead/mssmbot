import { AutocompleteInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder } from "discord.js";
import MSSMUser from "./data/user.js";
import Loggable from "./lib/logutils.js";
import MSSM from "./mssm.js";
import Bot from "./lib/bot.js";

export default abstract class Command<TUser, TBot extends Bot<TUser>> extends Loggable {
    public readonly bot: TBot;

    public abstract getName(): string;
    public abstract create(): SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;
    public abstract execute(msg: ChatInputCommandInteraction<CacheType>, user: TUser): Promise<void>;

    public autocomplete(cmd: AutocompleteInteraction): Promise<void> { return new Promise<void>(() => { }); }

    public constructor(bot: TBot) {
        super();
        this.bot = bot;
    }
}
