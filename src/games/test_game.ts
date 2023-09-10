import { GuildMember, Message } from "discord.js";
import Game from "../game.js";

export default class TestGame extends Game {
    protected async continueFromCrash() {
        
    }

    public minPlayers(): number {
        return 1;
    }

    public maxPlayers(): number {
        return 69;
    }

    public getName(): string {
        return `${this.host.displayName}'s test`;
    }

    protected async init() {
        this.send("This is a thing. Type `!help` for help");
        return {};
    }

    protected async start() {

    }

    protected async onMessage(user: GuildMember, msg: Message<boolean>) {

    }

    protected save() {
        

        super.save();
    }
}