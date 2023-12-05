import { PollData } from "@prisma/client";
import DataMapper from "./mapper.js";
import MSSM from "../bot.js";
import MSSMUser from "./user.js";

export default class Poll extends DataMapper<PollData> implements PollData {
    public author: MSSMUser;

    public constructor(bot: MSSM, data: PollData) {
        super(bot, data, bot.qotd.polls);
    }

    protected override set<TKey extends keyof PollData>(name: TKey, value: PollData[TKey]) {
        (async () => {
            this.obj = await this.bot.db.pollData.update({ where: { id: this.obj.id }, data: { [name]: value } });
        })();
    }

    public override async refresh() {
        this.author = this.bot.getUserV2(this.obj.authorId);
    }

    // Type safety stuff
    id: number;
    date: Date;
    title: string;
    asked: boolean;
    open: boolean;
    meta_is_done: boolean;
    channel: string;
    link: string;
    results_link: string;
    authorId: string;
}