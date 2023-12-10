import { CacheType, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import MSSM from "../bot.js";
import Command from "../command.js";
import { getResultPretty } from "../games/chess.js";
import { expandAndHandleEmbed, getValuesFromObject } from "../lib/utils.js";

export default class GamesCommand extends Command {
    public getName() { return "games"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Shows all active games or game history for those which support it.")
            .addSubcommand(sbc => sbc
                .setName("active")
                .setDescription("Show active games")
            )
            .addSubcommandGroup(sbc => sbc
                .setName("history")
                .setDescription("Game history")
                .addSubcommand(sbc => sbc
                    .setName("chess")
                    .setDescription("Chess history")
                )
            )
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        if (msg.options.getSubcommand() === "active") {
            const embed = new EmbedBuilder()
                .setTitle("Active Games")
                .setColor("Green")
                .setDescription("Click on a link and then type `!join` to join.")
                .addFields(bot.activeGames.map(i => {
                    return { name: `"${i.getName()}" created by ${i.host.displayName}. ${i.players.length}/${i.maxPlayers()}`, value: `[Link](${i.channel.url})` };
                }));

            if (bot.activeGames.length == 0) embed.setDescription("No games, just like the PS5");

            await msg.reply({ embeds: [embed] });
        } else if (msg.options.getSubcommand() === "chess") {
            const games = getValuesFromObject(bot.chessGames);
            games.reverse();
            
            await expandAndHandleEmbed(new EmbedBuilder().setTitle("Chess Games"), games.map(i => {
                return { name: `${bot.getUser(i.whiteId).displayName} vs ${bot.getUser(i.blackId).displayName}: ${getResultPretty(i.pgn)}`, value: `[Link](${i.lichess})`, inline: true };
            }), 25, msg.reply.bind(msg));
        }
    }
}
