import { MuckbangGameData } from "@prisma/client";
import MSSM from "../mssm.js";
import { DataMapper } from "botinator";

export default class MuckbangGame extends DataMapper<MSSM, MuckbangGameData> implements MuckbangGameData {
    public constructor(bot: MSSM, data: MuckbangGameData) {
        super(bot, data, bot.muckbang.games);
    }

    public async refresh() {

    }

    public async reload() {
        this.obj = await this.bot.db.muckbangGameData.findUnique({ where: { id: this.obj.id } })
    }

    protected set<TKey extends keyof MuckbangGameData>(name: TKey, value: MuckbangGameData[TKey]): void {
        (async () => {
            await this.bot.db.muckbangGameData.update({ where: { id: this.obj.id }, data: { [name]: value } });
        })();
    }

    public static async create(bot: MSSM, name: string, downloadLink: string, imageLink: string) {
        return new MuckbangGame(bot, await bot.db.muckbangGameData.create({ data: { name, downloadLink, imageLink } }));
    }

    id: number;
    name: string;
    downloadLink: string;
    imageLink: string;
}