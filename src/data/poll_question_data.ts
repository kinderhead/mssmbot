import { PollQuestionData } from "@prisma/client";
import DataMapper from "./mapper.js";
import MSSM from "../bot.js";
import MSSMUser from "./user.js";
import Poll from "./poll.js";

export default class PollQuestion extends DataMapper<PollQuestionData> implements PollQuestionData {
    public poll: Poll;
    public selected: MSSMUser[] = [];

    public constructor(bot: MSSM, data: PollQuestionData) {
        super(bot, data, bot.qotd.pollQuestions);
    }
    
    protected override set<TKey extends keyof PollQuestionData>(name: TKey, value: PollQuestionData[TKey]) {
        (async () => {
            await this.bot.db.pollQuestionData.update({ where: { id: this.obj.id }, data: { [name]: value } });
        })();
    }

    public override async refresh() {
        this.poll = this.bot.qotd.polls[this.obj.pollId];
        this.fetchArrayFactory(
            this.selected,
            (await this.bot.db.pollQuestionData.findUnique({ where: { id: this.obj.id }, include: { selected: true } })).selected,
            MSSMUser
        );
    }

    public async reload() {
        this.obj = await this.bot.db.pollQuestionData.findUnique({ where: { id: this.obj.id } })
    }

    id: number;
    option: string;
    pollId: number;
}