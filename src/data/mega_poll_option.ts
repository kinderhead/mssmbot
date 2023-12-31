import { MegaPollOption } from "@prisma/client";
import MSSM from "../mssm.js";
import MegaPollData from "./mega_poll.js";
import MSSMUser from "./user.js";
import { DataMapper } from "botinator";

export default class MegaPollOptionData extends DataMapper<MSSM, MegaPollOption> implements MegaPollOption {
    public poll: MegaPollData;
    public selected: MSSMUser[];

    public constructor(bot: MSSM, data: MegaPollOption) {
        super(bot, data, bot.qotd.megaPollQuestions);
    }

    public async refresh() {
        this.poll = this.fetchFactory(await this.bot.db.megaPoll.findUnique({ where: { id: this.obj.pollId } }), MegaPollData, this.bot.qotd.megaPolls);
        this.selected = this.fetchArrayFactory(
            (await this.bot.db.megaPollOption.findUnique({ where: { id: this.obj.id }, include: { selected: true } })).selected,
            MSSMUser,
            this.bot.users
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