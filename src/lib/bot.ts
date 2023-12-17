import { Client, Events, GuildBasedChannel, GuildMember, Interaction, Message, PartialGuildMember, Role, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder, TextChannel, roleMention } from "discord.js";
import util from 'node:util';
import { RotatingFileStream, createStream } from "rotating-file-stream";
import { ILogObj, Logger } from "tslog";
import Component from "./component.js";
import Command from "../command.js";

export const LOG_CONFIG = {
    DEFAULT_LOGGER: new Logger<ILogObj>({ name: "Bot", type: "pretty", hideLogPositionForProduction: false, prettyLogTimeZone: "local", minLevel: 2, prettyLogTemplate: "{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}}:{{ms}} {{fileNameWithLine}}\t{{logLevelName}}\t[{{name}}] " }),
    LOGGER_STREAM: null as RotatingFileStream
}

export const DEBUG = process.argv.includes("--debug");

export default abstract class Bot<TUser = GuildMember> {
    private clientID: string;
    private secret: string;

    public client: Client;

    public readonly log = LOG_CONFIG.DEFAULT_LOGGER;
    public logChannel: TextChannel;
    public errorPing: Role;
    
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

            if (this.logChannel && this.hasStarted && !txt.includes("anon") && !txt.includes("DEBUG")) {
                var msg = "```ansi\n" + txt.substring(42).trim() + "\n```";

                if (this.errorPing && ((txt.includes("ERROR") || txt.includes("FATAL")) && !DEBUG)) {
                    msg = `${roleMention(this.errorPing.id)}\n` + msg;
                }

                this.logChannel.send(msg);
            }

            if (LOG_CONFIG.LOGGER_STREAM != null) {
                txt = txt.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
                LOG_CONFIG.LOGGER_STREAM.write(txt + "\n");
            }
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

    public async refreshCommands() {
        const cmds: (SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">)[] = [];

        this.commands.forEach(i => {
            cmds.push(i.create());
        });

        this.client.guilds.cache.forEach(async i => {
            await i.commands.set(cmds);
        });

        this.log.info("Refreshed commands");
    }

    public getChannel<T extends GuildBasedChannel = TextChannel>(id: string): T {
        for (const i of this.client.guilds.cache.values()) {
            var ret = i.channels.cache.get(id) as T;
            if (ret !== undefined) {
                return ret;
            }
        }

        throw new Error("Unable to find channel with id " + id);
    }

    public userExists(id: string) {
        for (const i of this.client.guilds.cache.values()) {
            if (i.members.cache.has(id)) return true;
        }

        return false;
    }

    public getRole(id: string): Role {
        for (const i of this.client.guilds.cache.values()) {
            if (i.roles.cache.has(id)) {
                return i.roles.cache.get(id);
            }
        }

        throw new Error("Unable to find role with id " + id);
    }
}
