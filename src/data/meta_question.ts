import { MetaQuestion } from "@prisma/client";
import MSSM from "../bot.js";
import DataMapper from "./mapper.js";

export default class MetaQuestionData extends DataMapper<MetaQuestion> implements MetaQuestion {
    public constructor(bot: MSSM, data: MetaQuestion) {
        super(bot, data, bot.qotd.metaQuestions);
    }

    public async refresh() {
        
    }

    public async reload() {
        this.obj = await this.bot.db.metaQuestion.findUnique({ where: { id: this.obj.id } })
    }

    protected set<TKey extends keyof MetaQuestion>(name: TKey, value: MetaQuestion[TKey]): void {
        (async () => {
            await this.bot.db.metaQuestion.update({ where: { id: this.obj.id }, data: { [name]: value } });
        })();
    }

    public static async create(bot: MSSM, question: string, link: string, active: boolean = true) {
        return new MetaQuestionData(bot, await bot.db.metaQuestion.create({ data: { question, link, active } }));
    }

    id: number;
    question: string;
    link: string;
    active: boolean;
}