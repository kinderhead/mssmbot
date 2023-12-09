import { MegaPoll } from "@prisma/client";
import MSSM from "../bot.js";
import DataMapper from "./mapper.js";

export default class MegaPollData extends DataMapper<MegaPoll> implements MegaPoll {
    public constructor(bot: MSSM, data: MegaPoll) {
        super(bot, data, bot.qotd.megaPolls);
    }

    public async refresh() {
        
    }

    public async reload() {
        this.obj = await this.bot.db.megaPoll.findUnique({ where: { id: this.obj.id } })
    }

    protected set<TKey extends keyof MegaPoll>(name: TKey, value: MegaPoll[TKey]): void {
        (async () => {
            await this.bot.db.megaPoll.update({ where: { id: this.obj.id }, data: { [name]: value } });
        })();
    }

    id: number;
    title: string;
    date: Date;
    channel: string;
    link: string;
    buttonId: string;
    open: boolean;
}