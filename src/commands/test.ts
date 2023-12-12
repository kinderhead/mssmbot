import { ChatInputCommandInteraction } from "discord.js";
import MSSMUser from "../data/user.js";
import SuperCommand, { cmd, param } from "../lib/supercommand.js";
import MSSM from "../mssm.js";

export default class TestCommand extends SuperCommand<MSSMUser, MSSM> {
    public get description(): string {
        return "Test"
    }

    public get modOnly(): boolean {
        return true;
    }

    public getName(): string {
        return "test";
    }

    @cmd("")
    public async default(msg: ChatInputCommandInteraction, @param("yeah") arg: string, @param("uuye") user: MSSMUser) {
        await msg.reply(user.discord.displayName);
    }
}