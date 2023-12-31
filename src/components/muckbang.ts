import { Component } from "botinator";
import { EmbedBuilder, TextChannel } from "discord.js";
import MuckbangCommand from "../commands/muckbang.js";
import MuckbangGame from "../data/muckbang_game.js";
import MSSMUser from "../data/user.js";
import MSSM from "../mssm.js";

export default class Muckbang extends Component<MSSMUser, MSSM> {
    public channel: TextChannel;

    public games: { [id: number]: MuckbangGame } = {};

    public async init() {
        this.channel = this.bot.getChannel("1037857900997132399");
        this.bot.registerCommand(new MuckbangCommand(this.bot));

        for (const i of await this.bot.db.muckbangGameData.findMany()) {
            this.games[i.id] = new MuckbangGame(this.bot, i);
        }
    }

    public getGameEmbed(game: MuckbangGame) {
        return new EmbedBuilder()
            .setTitle(game.name)
            .setDescription(`[Download](${game.downloadLink})`)
            .setImage(game.imageLink);
    }

    public async refreshDatamaps() {
        for (const i in this.games) {
            await this.games[i].refresh();
        }
    }
}