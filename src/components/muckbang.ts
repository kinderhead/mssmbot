import { Awaitable, EmbedBuilder, TextChannel } from "discord.js";
import Component from "../lib/component.js";
import MuckbangCommand from "../commands/muckbang.js";
import { MuckbangGameData } from "@prisma/client";

export default class Muckbang extends Component {
    public channel: TextChannel;

    public games: string[] = [];

    public init() {
        this.channel = this.bot.getChannel("1037857900997132399");
        this.bot.registerCommand(new MuckbangCommand());
        this.refreshGameList();
    }

    public getGameEmbed(game: MuckbangGameData) {
        return new EmbedBuilder()
            .setTitle(game.name)
            .setDescription(`[Download](${game.downloadLink})`)
            .setImage(game.imageLink);
    }

    public async refreshGameList() {
        this.games = (await this.bot.db.muckbangGameData.findMany()).map(i => i.name);
    }
}