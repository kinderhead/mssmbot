import { Prisma, UserData } from "@prisma/client";
import DataMapper from "./mapper.js";
import MSSM from "../bot.js";
import Question from "./question.js";
import { GuildMember } from "discord.js";
import StarboardData from "./starboard.js";
import PollQuestion from "./pollquestiondata.js";

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
    public questions: Question[] = [];
    public starboard: StarboardData[] = [];
    public poll_answers: PollQuestion[] = [];

    public get discord() {
        return this.bot.getUser(this.obj.id);
    }

    public constructor(bot: MSSM, data: UserData) {
        super(bot, data, bot.users);
    }

    public async createStarboardPost(id: string, channelId: string, starboardMessageId: string, date: Date, stars: number) {
        var data = new StarboardData(this.bot, await this.bot.db.starboardMessage.create({ data: { id, channelId, starboardMessageId, date, stars, author: { connect: { id: this.obj.id } } } }));
        this.starboard.push(data);
        return data;
    }

    public override async refresh() {
        this.fetchArrayFactory(this.questions, await this.bot.db.questionData.findMany({ where: { authorId: this.obj.id } }), Question);
        this.fetchArrayFactory(this.starboard, await this.bot.db.starboardMessage.findMany({ where: { authorId: this.obj.id } }), StarboardData);
        this.fetchArrayFactory(
            this.poll_answers,
            (await this.bot.db.userData.findUnique({ where: { id: this.obj.id }, include: { poll_answers: true } })).poll_answers,
            PollQuestion
        );
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