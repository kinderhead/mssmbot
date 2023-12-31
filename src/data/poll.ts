import { PollData } from "@prisma/client";
import MSSM from "../mssm.js";
import PollQuestion from "./poll_question_data.js";
import MSSMUser from "./user.js";
import { DataMapper } from "botinator";

export default class Poll extends DataMapper<MSSM, PollData> implements PollData {
    public author: MSSMUser;
    public options: PollQuestion[];

    public constructor(bot: MSSM, data: PollData) {
        super(bot, data, bot.qotd.polls);
    }

    protected override set<TKey extends keyof PollData>(name: TKey, value: PollData[TKey]) {
        (async () => {
            await this.bot.db.pollData.update({ where: { id: this.obj.id }, data: { [name]: value } });
        })();
    }

    public override async refresh() {
        this.author = this.bot.getUserV2(this.obj.authorId);
        this.options = this.fetchArrayFactory((await this.bot.db.pollData.findUnique({ where: { id: this.obj.id }, include: { options: true } })).options, PollQuestion, this.bot.qotd.pollQuestions);
        for (const i of this.options) {
            await i.refresh();
        }
    }

    public async reload() {
        this.obj = await this.bot.db.pollData.findUnique({ where: { id: this.obj.id } })
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