import { StarboardMessage } from "@prisma/client";
import DataMapper from "./mapper.js";
import MSSMUser from "./user.js";
import MSSM from "../bot.js";

export default class StarboardData extends DataMapper<StarboardMessage> implements StarboardMessage {
    public author: MSSMUser;
    
    public constructor(bot: MSSM, data: StarboardMessage) {
        super(bot, data, bot.starboard.starboardPosts);
    }

    protected override set<TKey extends keyof StarboardMessage>(name: TKey, value: StarboardMessage[TKey]) {
        (async () => {
            await this.bot.db.starboardMessage.update({ where: { id: this.obj.id }, data: { [name]: value } });
        })();
    }

    public override async refresh() {
        this.author = this.bot.getUserV2(this.obj.authorId);
    }

    public async reload() {
        this.obj = await this.bot.db.starboardMessage.findUnique({ where: { id: this.obj.id } })
    }

    // Type safety
    id: string;
    channelId: string;
    authorId: string;
    starboardMessageId: string;
    stars: number;
    date: Date;
}