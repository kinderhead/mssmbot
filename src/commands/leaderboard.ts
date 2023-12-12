import { CacheType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import Command from "../command.js";
import { calcWinLoss } from "../games/chess.js";
import { expandAndHandleEmbed } from "../lib/utils.js";
import MSSMUser from "../data/user.js";
import MSSM from "../mssm.js";

interface Position {
    user: string;
    value: number;
    display: string;
}

export default class LeaderboardCommand extends Command<MSSMUser, MSSM> {
    public getName() { return "leaderboard"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Displays various leaderboads")
            .addSubcommand(sbc => sbc
                .setName("levels")
                .setDescription("Shows the level leaderboard")
            )
            .addSubcommand(sbc => sbc
                .setName("starboard")
                .setDescription("Shows the starboard stars leaderboard")
            )
            .addSubcommand(sbc => sbc
                .setName("uno")
                .setDescription("Shows the uno leaderboard")
            )
            .addSubcommand(sbc => sbc
                .setName("chess")
                .setDescription("Shows the chess leaderboard")
            )
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>) {
        await msg.deferReply();

        var score: Position[] = [];

        if (msg.options.getSubcommand() === "levels") {
            score = await this.getLevels();
        } else if (msg.options.getSubcommand() === "uno") {
            score = await this.getUno();
        } else if (msg.options.getSubcommand() === "chess") {
            score = await this.getChess();
        } else if (msg.options.getSubcommand() === "starboard") {
            score = await this.getStars();
        }

        score = score.filter(i => this.bot.getAllMembers().findIndex(e => e.id === i.user) !== -1 && i.user !== this.bot.client.user.id);

        score.sort((a, b) => b.value - a.value);

        var fields = await Promise.all(score.map(async (i, idex) => {
            var displayname = this.bot.getUser(i.user).displayName;

            return { name: `${idex + 1}: ${displayname}`, value: i.display };
        }));

        await expandAndHandleEmbed(new EmbedBuilder().setTitle("Leaderboard"), fields, 10, msg.editReply.bind(msg));
    }

    public async getLevels(): Promise<Position[]> {
        var score: Position[] = [];

        const people = this.bot.getAllMembers();

        for (const i of people) {
            score.push({ user: i.id, value: i.xp, display: `Level ${this.bot.getLevelFromXP(i.xp)} (${i.xp}|${this.bot.getXPFromLevel(this.bot.getLevelFromXP(i.xp) + 1) + 1})` });
        }

        return score;
    }

    public async getUno(): Promise<Position[]> {
        var score: Position[] = [];

        const people = this.bot.getAllMembers();

        for (const i of people) {
            score.push({ user: i.id, value: i.uno_wins, display: `${i.uno_wins} wins` });
        }

        return score;
    }

    public async getStars(): Promise<Position[]> {
        var score: Position[] = [];

        const people = this.bot.getAllMembers();

        for (const i of people) {
            var totalStars = 0;

            for (const e of i.starboard) {
                totalStars += e.stars;
            }

            score.push({ user: i.id, value: totalStars, display: `${totalStars} ⭐` });
        }

        return score;
    }

    public async getChess(): Promise<Position[]> {
        var score: Position[] = [];

        const people = this.bot.getAllMembers();

        for (const i of people) {
            var [wins, _] = await calcWinLoss(i.id, this.bot);

            score.push({ user: i.id, value: wins, display: `${wins} wins` });
        }

        return score;
    }
}
