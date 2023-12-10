import { MegaPoll, MegaPollOption } from "@prisma/client";
import MSSM from "../bot.js";
import DataMapper from "./mapper.js";
import MegaPollOptionData from "./mega_poll_option.js";

export default class MegaPollData extends DataMapper<MegaPoll> implements MegaPoll {
    public options: MegaPollOptionData[];

    public constructor(bot: MSSM, data: MegaPoll) {
        super(bot, data, bot.qotd.megaPolls);
    }

    public async refresh() {
        this.options = this.fetchArrayFactory(await this.bot.db.megaPollOption.findMany({ where: { pollId: this.obj.id } }), MegaPollOptionData, this.bot.qotd.megaPollQuestions);
    }

    public async reload() {
        this.obj = await this.bot.db.megaPoll.findUnique({ where: { id: this.obj.id } })
    }

    public static async create(bot: MSSM, title: string, date: Date, channel: string, link: string, buttonId: string, options: string[]) {
        var data = new MegaPollData(bot, await bot.db.megaPoll.create({ data: { title, date, channel, link, buttonId, options: { createMany: { data: options.map(i => { return { option: i } }) } } } }));
        await data.refresh();
        return data;
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