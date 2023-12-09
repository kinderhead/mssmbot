import { MegaPollOption } from "@prisma/client";
import DataMapper from "./mapper.js";
import MSSM from "../bot.js";
import MegaPollData from "./mega_poll.js";
import MSSMUser from "./user.js";

export default class MegaPollOptionData extends DataMapper<MegaPollOption> implements MegaPollOption {
    public poll: MegaPollData;
    public selected: MSSMUser[] = [];

    public constructor(bot: MSSM, data: MegaPollOption) {
        super(bot, data, bot.qotd.megaPollQuestions);
    }

    public async refresh() {
        this.poll = this.bot.qotd.megaPolls[this.obj.pollId];
        this.fetchArrayFactory(
            this.selected,
            (await this.bot.db.megaPollOption.findUnique({ where: { id: this.obj.id }, include: { selected: true } })).selected,
            MSSMUser
        );
    }

    public async reload() {
        this.obj = await this.bot.db.megaPollOption.findUnique({ where: { id: this.obj.id } })
    }

    protected set<TKey extends keyof MegaPollOption>(name: TKey, value: MegaPollOption[TKey]): void {
        (async () => {
            await this.bot.db.megaPollOption.update({ where: { id: this.obj.id }, data: { [name]: value } });
        })();
    }

    id: number;
    option: string;
    pollId: number;
}