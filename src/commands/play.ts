import { AutocompleteInteraction, CacheType, ChatInputCommandInteraction, SlashCommandBuilder, TextChannel } from "discord.js";
import Command from "../command.js";
import { autocompleteOptions } from "../lib/utils.js";

export default class PlayCommand extends Command {
    public getName() { return "play"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Gaming")
            .addStringOption(opt => opt
                .setName("game")
                .setDescription("Game")
                .setAutocomplete(true)
                .setRequired(true)
            )
            .addBooleanOption(opt => opt
                .setName("quiet")
                .setDescription("Does not ping when the game starts. Default false")
                .setRequired(false)
            );
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>) {
        const name = msg.options.getString("game");

        if (!(name in this.bot.games)) {
            msg.reply({ content: "Unknown game", ephemeral: true });
            return;
        }

        if (this.bot.isUserPlaying(msg.user)) {
            msg.reply({ content: "You are already in a game. Leave that one first.", ephemeral: true });
            return;
        }

        await msg.reply("Starting...");

        var quiet = msg.options.getBoolean("quiet", false);

        this.bot.activeGames.push(new this.bot.games[name](this.bot.getUser(msg), msg.channel as TextChannel, this.bot, name, quiet == null ? false : quiet));
    }

    public async autocomplete(cmd: AutocompleteInteraction<CacheType>): Promise<void> {
        await autocompleteOptions(cmd, Object.keys(this.bot.games));
    }
}
