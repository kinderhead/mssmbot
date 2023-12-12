import { Client, Events, GuildMember, Interaction, Message, PartialGuildMember, TextChannel, roleMention } from "discord.js";
import util from 'node:util';
import { createStream } from "rotating-file-stream";
import { ILogObj, Logger } from "tslog";
import Component from "./component.js";
import Command from "../command.js";

export const DEFAULT_LOGGER = new Logger<ILogObj>({ name: "MSSM", type: "pretty", hideLogPositionForProduction: true, prettyLogTimeZone: "local", minLevel: 2, prettyLogTemplate: "{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}}:{{ms}} {{logLevelName}}\t[{{name}}] " });
export const LOGGER_STREAM = createStream("bot.log", {
    size: "100M",
    interval: "1d",
    path: "/home/daniel/mssmbot/logs/"
});

export const DEBUG = process.argv.includes("--debug");

export default abstract class Bot<TUser = GuildMember> {
    private clientID: string;
    private secret: string;

    public client: Client;

    public readonly log = DEFAULT_LOGGER;
    public logChannel: TextChannel;
    
    public components: Component[] = [];
    public commands: Command<TUser, this>[] = [];

    public hasStarted = false;
    
    public constructor(clientID: string, secret: string, client: Client) {
        this.client = client;
        this.clientID = clientID;
        this.secret = secret;

        // Me not like this
        const oldlog = console.log;
        console.log = (message?: any, ...optionalParams: any[]) => {
            var txt: string = message;
            if (optionalParams.length != 0) {
                txt = util.format(message, optionalParams);
            }
            oldlog(txt);

            if (this.hasStarted && !txt.includes("anon") && !txt.includes("DEBUG")) {
                var msg = "```ansi\n" + txt.substring(42).trim() + "\n```";

                if ((txt.includes("ERROR") || txt.includes("FATAL")) && !DEBUG) {
                    msg = `${roleMention("752345386617798798")}\n` + msg;
                }

                this.logChannel.send(msg);
            }

            txt = txt.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
            LOGGER_STREAM.write(txt + "\n");
        }

        console.log("");

        this.client.once(Events.ClientReady, this.onLogin.bind(this));

        this.client.on(Events.InteractionCreate, this.onInteraction.bind(this));
        this.client.on(Events.MessageCreate, this.onMessage.bind(this));
        this.client.on(Events.GuildMemberAdd, this.onNewMember.bind(this));
        this.client.on(Events.GuildMemberRemove, this.onMemberLeave.bind(this));

        this.client.on(Events.Error, e => { this.log.fatal(e); });
    }

    protected abstract init(): void;

    public registerCommand(command: Command<TUser, this>) {
        this.commands.push(command);
    }

    public async run() {
        this.init();

        try {
            await this.client.login(this.secret);
        } finally {
            await this.onClose();
        }
    }

    public async onLogin(c: Client) {
        this.log.info("Logging in");
        this.log.silly("Bot in " + this.client.guilds.cache.size + " servers");

        for (const i of this.components) {
            i.init();
        }

        this.hasStarted = true;
    }

    public async onNewMember(user: GuildMember) { }
    public async onMemberLeave(user: GuildMember | PartialGuildMember) { }
    public async onMessage(msg: Message) { }

    public async onInteraction(message: Interaction) {
        if (message.isAutocomplete() || message.isChatInputCommand()) {
            const cmd = this.commands.find(i => i.getName() == message.commandName);
            if (!cmd) {
                this.log.error("Cannot find command " + message.commandName);
                return;
            }

            if (message.isAutocomplete()) {
                await cmd.autocomplete(message);
            } else if (message.isChatInputCommand()) {
                try {
                    await cmd.execute(message, this.getUserV2(message.user.id));
                } catch (error) {
                    this.log.error(error);
                    try {
                        if (message.replied || message.deferred) await message.editReply("An error occured running this command");
                        else await message.reply({ content: "An error occured running this command", ephemeral: true });
                    } catch (e) {
                        this.log.error("Error reporting error :(", e);
                    }
                }
            }
        }
    }

    public abstract getUserV2(id: string): TUser;

    public async onClose() {
        
    }
}
