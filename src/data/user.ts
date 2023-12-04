import { Prisma, UserData } from "@prisma/client";
import DataMapper from "./mapper.js";
import MSSM from "../bot.js";
import Question from "./question.js";
import { GuildMember } from "discord.js";

const fullUser = Prisma.validator<Prisma.UserDataDefaultArgs>()({
    include: {
        chess_games_black: true,
        chess_games_white: true,
        manager_of: true,
        mega_poll_answers: true,
        officer_of: true,
        poll_answers: true,
        polls: true,
        questions: true,
        starboard: true
    }
});

export type FullUser = Prisma.UserDataGetPayload<typeof fullUser>;
export default class MSSMUser extends DataMapper<UserData> implements UserData {
    private questions: Question[] = [];

    public get discord() {
        return this.bot.getUser(this.id);
    }

    public constructor(bot: MSSM, data: UserData) {
        super(bot, data, bot.users);
    }

    public override async refresh() {
        this.fetchArrayFactory(this.questions, await this.bot.db.questionData.findMany({ where: { authorId: this.id } }), Question);
    }

    protected set<TKey extends keyof UserData>(name: TKey, value: UserData[TKey]) {
        (async () => {
            this.obj = await this.bot.db.userData.update({ where: { id: this.obj.id }, data: { [name]: value } });
        })();
    }

    // Type safety stuff :(
    id: string;
    bio: string;
    embeds: string[];
    mod_application: string;
    xp: number;
    need_message: boolean;
    times_counted: number;
    times_failed: number;
    saves: number;
    uno_wins: number;
    uno_losses: number;
    minecraft_username: string;
    levelup_ping: boolean;
}