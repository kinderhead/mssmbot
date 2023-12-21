import { PollQuestionData } from "@prisma/client";
import MSSM from "../mssm.js";
import Poll from "./poll.js";
import MSSMUser from "./user.js";
import { DataMapper } from "botinator";

export default class PollQuestion extends DataMapper<MSSM, PollQuestionData> implements PollQuestionData {
    public poll: Poll;
    public selected: MSSMUser[];

    public constructor(bot: MSSM, data: PollQuestionData) {
        super(bot, data, bot.qotd.pollQuestions);
    }

    protected override set<TKey extends keyof PollQuestionData>(name: TKey, value: PollQuestionData[TKey]) {
        (async () => {
            await this.bot.db.pollQuestionData.update({ where: { id: this.obj.id }, data: { [name]: value } });
        })();
    }

    public async select(user: MSSMUser) {
        await this.bot.db.pollQuestionData.update({ where: { id: this.obj.id }, data: { selected: { connect: { id: user.id } } } });
        this.selected.push(user);
    }

    public async deselect(user: MSSMUser) {
        await this.bot.db.pollQuestionData.update({ where: { id: this.obj.id }, data: { selected: { disconnect: { id: user.id } } } });
        this.selected.splice(this.selected.findIndex(i => i.id === user.id), 1);
    }

    public override async refresh() {
        this.poll = this.fetchFactory(await this.bot.db.pollData.findUnique({ where: { id: this.obj.pollId } }), Poll, this.bot.qotd.polls);
        this.selected = this.fetchArrayFactory(
            (await this.bot.db.pollQuestionData.findUnique({ where: { id: this.obj.id }, include: { selected: true } })).selected,
            MSSMUser,
            this.bot.users
        );
    }

    public async reload() {
        this.obj = await this.bot.db.pollQuestionData.findUnique({ where: { id: this.obj.id } })
    }

    id: number;
    option: string;
    pollId: number;
}