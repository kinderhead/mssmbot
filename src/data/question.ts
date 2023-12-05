import { QuestionData } from "@prisma/client";
import DataMapper from "./mapper.js";
import MSSM from "../bot.js";
import MSSMUser from "./user.js";

export default class Question extends DataMapper<QuestionData> implements QuestionData {
    public author: MSSMUser;

    public constructor(bot: MSSM, data: QuestionData) {
        super(bot, data, bot.qotd.questions);
    }

    protected override set<TKey extends keyof QuestionData>(name: TKey, value: QuestionData[TKey]) {
        (async () => {
            this.obj = await this.bot.db.questionData.update({ where: { id: this.obj.id }, data: { [name]: value } });
        })();
    }

    public override async refresh() {
        this.author = this.bot.getUserV2(this.obj.authorId);
    }

    // Type safety stuff
    id: number;
    date: Date;
    question: string;
    asked: boolean;
    isEmbed: boolean;
    link: string;
    authorId: string;
}