import { QuestionData } from "@prisma/client";
import MSSM from "../mssm.js";
import MSSMUser from "./user.js";
import { DataMapper } from "botinator";

export default class Question extends DataMapper<MSSM, QuestionData> implements QuestionData {
    public author: MSSMUser;

    public constructor(bot: MSSM, data: QuestionData) {
        super(bot, data, bot.qotd.questions);
    }

    protected override set<TKey extends keyof QuestionData>(name: TKey, value: QuestionData[TKey]) {
        (async () => {
            await this.bot.db.questionData.update({ where: { id: this.obj.id }, data: { [name]: value } });
        })();
    }

    public override async refresh() {
        this.author = this.bot.getUserV2(this.obj.authorId);
    }

    public async reload() {
        this.obj = await this.bot.db.questionData.findUnique({ where: { id: this.obj.id } })
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