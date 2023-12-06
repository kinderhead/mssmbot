import { ChessData } from "@prisma/client";
import DataMapper from "./mapper.js";
import MSSM from "../bot.js";
import MSSMUser from "./user.js";

export default class ChessGameData extends DataMapper<ChessData> implements ChessData {
    public white: MSSMUser;
    public black: MSSMUser;

    public constructor(bot: MSSM, data: ChessData) {
        super(bot, data, bot.chessGames);
    }

    public async refresh() {
        this.white = this.bot.getUserV2(this.obj.whiteId);
        this.black = this.bot.getUserV2(this.obj.blackId);
    }

    protected set<TKey extends keyof ChessData>(name: TKey, value: ChessData[TKey]): void {
        (async () => {
            this.obj = await this.bot.db.chessData.update({ where: { id: this.obj.id }, data: { [name]: value } });
        })();
    }
    
    // yeah yeah yeah
    id: number;
    pgn: string;
    lichess: string;
    whiteId: string;
    blackId: string;
}