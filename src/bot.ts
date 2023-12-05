import { MegaPoll, MegaPollOption, PollData, PrismaClient, UserData } from '@prisma/client';
import { APIEmbed, Attachment, Awaitable, CacheType, ChatInputCommandInteraction, Client, ComponentType, EmbedBuilder, Events, GatewayIntentBits, GuildBasedChannel, GuildMember, Interaction, Message, MessageReaction, PartialGuildMember, PartialMessageReaction, PartialUser, Partials, REST, ReactionCollector, Role, Routes, SlashCommandBuilder, SlashCommandSubcommandsOnlyBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextChannel, ThreadAutoArchiveDuration, User, channelMention, roleMention, userMention } from 'discord.js';
import fs from 'fs';

import util from 'node:util';
import { createStream } from "rotating-file-stream";
import { ILogObj, Logger } from 'tslog';
import Command from './command.js';
import AddXPCommand from './commands/add_xp.js';
import AnonCommand from './commands/anon.js';
import ApplyCommand from './commands/apply.js';
import ArchiveCommand from './commands/archive.js';
import ClosePollCommand from './commands/close_poll.js';
import GamesCommand from './commands/games.js';
import HandCommand from './commands/hand.js';
import HelpCommand from './commands/help.js';
import KillCommand from './commands/kill.js';
import LeaderboardCommand from './commands/leaderboard.js';
import MegaPollCommand from './commands/mega_poll.js';
import MetaQuestionsCommand from './commands/meta_questions.js';
import ModAppsCommand from './commands/mod_apps.js';
import PlayCommand from './commands/play.js';
import PoopCommand from './commands/poop.js';
import QOTDCommand from './commands/qotd.js';
import QOTDQueueCommand from './commands/qotd_queue.js';
import QOTDSendCommand from './commands/qotd_send.js';
import RefreshCommand from './commands/refresh.js';
import RoleRemoverCommand from './commands/role_remover.js';
import SetCountCommand from './commands/set_count.js';
import SetInfoCommand from './commands/set_info.js';
import SettingsCommand from './commands/settings.js';
import StatusCommand from './commands/status.js';
import ToolsCommand from './commands/tools.js';
import WhoIsCommand from './commands/whois.js';
import Game from './game.js';
import ChessGame from './games/chess.js';
import UnoGame from './games/uno.js';
import { getInfoEmbeds, getMinecraftEmbeds, getModInfoEmbeds } from './lib/info_messages.js';
import Lichess from './lib/lichess.js';
import { EmbedResource, StringOpts, StringResource } from './lib/resource.js';
import { Memory, Poll, QueueDataStorage, Storage } from './lib/storage.js';
import { InteractionSendable, createCustomId, isValidUrl, quickActionRow, shorten } from './lib/utils.js';
import SetRulesCommand from './commands/set_rules.js';
import EditRulesCommand from './commands/edit_rules.js';
import Component from './lib/component.js';
import Starboard from './components/starboard.js';
import BotLogger from './components/logger.js';
import CatHandler from './components/cat.js';
import H from './components/h.js';
import Counting from './components/counting.js';
import QOTD from './components/qotd.js';
import Clubs from './components/clubs.js';
import Reddit from './lib/reddit.js';
import RedditComponent from './components/reddit.js';
import SyscallCommand from './commands/syscall.js';
import Muckbang from './components/muckbang.js';
import MSSMUser from './data/user.js';
import Question from './data/question.js';
import StarboardData from './data/starboard.js';

export const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export function choose<T>(arr: T[]) {
    return arr[Math.floor(Math.random() * arr.length)];
}

export const DEFAULT_LOGGER = new Logger<ILogObj>({ name: "MSSM", type: "pretty", hideLogPositionForProduction: true, prettyLogTimeZone: "local", minLevel: 2, prettyLogTemplate: "{{yyyy}}.{{mm}}.{{dd}} {{hh}}:{{MM}}:{{ss}}:{{ms}} {{logLevelName}}\t[{{name}}] " });
export const LOGGER_STREAM = createStream("bot.log", {
    size: "100M",
    interval: "1d",
    path: "/home/daniel/mssmbot/logs/"
});

export default class MSSM {
    public components: Component[] = [];
    public commands: Command[] = [];
    public games: { [name: string]: new (host: GuildMember, baseChannel: TextChannel, bot: MSSM, type: string, quiet?: boolean, crashed?: boolean) => Game } = {};

    public hands: { [name: string]: (msg: ChatInputCommandInteraction<CacheType>) => Promise<void> | void } = {};

    public activeGames: Game[] = [];

    private secret: string;
    private clientID: string;

    public client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildPresences, GatewayIntentBits.GuildMessageTyping, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessageReactions], partials: [Partials.Channel, Partials.Message, Partials.Reaction] });
    public lichess: Lichess;

    public people: GuildMember[] = [];

    public users: { [id: string]: MSSMUser } = {};

    public db: PrismaClient;
    public memory = Storage.make<Memory>("memory.json", new Memory());

    public welcomeChannel: TextChannel;

    public levelChannel: TextChannel;
    public xpBanList = ["750202680114282595", "739339459161751553", "739338796067323994", "752355433955721288", "742500057143574648", "789982492413001730", "1039979628397338646"];
    public xpCooldown: { [id: string]: Date } = {};

    public readonly log = DEFAULT_LOGGER;
    public logChannel: TextChannel;

    public hasStarted = false;

    constructor() {
        // DEFAULT_LOGGER.attachTransport(obj => {
        //     const meta = obj['_meta'] as IMeta;
        //     let parentString = meta.parentNames?.join(':') || '';
        //     if (parentString) { parentString = `${parentString}:`; }

        //     LOGGER_STREAM.write(`${meta.date.toISOString()} ${meta.logLevelName}\t[${parentString}${meta.name}] ${obj[0]}` + "\n");
        // });

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

                if (txt.includes("ERROR") || txt.includes("FATAL")) {
                    msg = `${roleMention("752345386617798798")}\n` + msg;
                }

                this.logChannel.send(msg);
            }

            txt = txt.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, '');
            LOGGER_STREAM.write(txt + "\n");
        }

        console.log("");

        this.db = new PrismaClient();

        this.addComponent(new Starboard(this));
        this.addComponent(new BotLogger(this));
        this.addComponent(new CatHandler(this));
        this.addComponent(new H(this));
        this.addComponent(new Counting(this));
        this.addComponent(new QOTD(this));
        this.addComponent(new Clubs(this));
        this.addComponent(new RedditComponent(this));
        this.addComponent(new Muckbang(this));

        this.registerCommand(new StatusCommand());
        this.registerCommand(new RoleRemoverCommand());
        this.registerCommand(new SetInfoCommand());
        this.registerCommand(new HelpCommand());
        this.registerCommand(new AddXPCommand());
        this.registerCommand(new LeaderboardCommand());
        this.registerCommand(new PlayCommand());
        this.registerCommand(new GamesCommand());
        this.registerCommand(new HandCommand());
        this.registerCommand(new WhoIsCommand());
        this.registerCommand(new ToolsCommand());
        this.registerCommand(new SetCountCommand());
        this.registerCommand(new RefreshCommand());
        this.registerCommand(new ApplyCommand());
        this.registerCommand(new KillCommand());
        this.registerCommand(new ModAppsCommand());
        this.registerCommand(new AnonCommand());
        this.registerCommand(new PoopCommand());
        this.registerCommand(new SettingsCommand());
        this.registerCommand(new ArchiveCommand());
        this.registerCommand(new SetRulesCommand());
        this.registerCommand(new EditRulesCommand());
        this.registerCommand(new SyscallCommand());

        this.registerGame(UnoGame, "uno");
        this.registerGame(ChessGame, "chess");

        const config = JSON.parse(fs.readFileSync("config.json").toString());
        this.clientID = config["client"];
        this.secret = config["secret"];

        this.client.once(Events.ClientReady, this.onLogIn.bind(this));

        this.client.on(Events.InteractionCreate, this.onInteraction.bind(this));
        this.client.on(Events.MessageCreate, this.onMessage.bind(this));
        this.client.on(Events.GuildMemberAdd, this.onNewMember.bind(this));
        this.client.on(Events.GuildMemberRemove, this.onMemberLeave.bind(this));

        this.client.on(Events.Error, e => { this.log.fatal(e); });

        this.lichess = new Lichess(config["lichess"]);
    }

    public async run() {
        try {
            await this.client.login(this.secret);
        } finally {
            await this.db.$disconnect();
        }
    }

    public async syncUser(user: GuildMember) {
        var data = await this.db.userData.findUnique({ where: { id: user.id } });
        if (data == null) {
            await this.db.userData.create({ data: { id: user.id } });
            this.log.info("Created data for user " + user.displayName);
        } else if (data.bio.length > 2048) {
            this.log.warn(`${user.displayName}'s bio is too long`);
            await this.levelChannel.send(`${userMention(user.id)}\nYour bio is too long after a change that limits bios to 2048 characters.`);
        }
        var u = new MSSMUser(this, data);
        return u;
    }

    public async setupDataMap() {
        this.log.info("Setting up datamap");

        for (const i of this.people) {
            await this.syncUser(i);
        }

        for (const i of this.components) {
            await i.refreshDatamaps();
        }
    }

    public async onLogIn(c: Client) {
        this.log.info("Logging in");
        this.log.silly("Bot in " + this.client.guilds.cache.size + " servers");

        var promisesToAwait: (Promise<any> | Awaitable<any>)[] = [];

        for (const i of this.client.guilds.cache.values()) {
            this.people = [...(await i.members.fetch()).map(e => e), ...this.people];
            this.log.debug("Loaded guild " + i.name);
        }

        this.people = [...new Set(this.people)];

        this.levelChannel = this.getChannel("1140018125149044817");
        this.logChannel = this.getChannel("739339459161751553");
        this.welcomeChannel = this.getChannel("739335818518331496");

        promisesToAwait.push(this.setupDataMap());

        for (const i of this.components) {
            promisesToAwait.push(i.init());
        }

        for (const i in this.memory.games) {
            this.log.warn("Recovering a game of " + i);
            try {
                var game = new this.games[this.memory.games[i].type](null, null, this, i, true, true);
                await game.load(this.memory.games[i]);
                this.activeGames.push(game);
            } catch (e) {
                this.log.error("Failed to recover game", e);
                delete this.memory.games[i];
            }
        }

        if (this.memory.infoid !== "") {
            var channel = this.getChannel(this.memory.infochannelid);
            var msg = await channel.messages.fetch(this.memory.infoid);
            msg.edit({ embeds: getInfoEmbeds(this) });

            if (channel.threads.cache.size == 0) {
                var thread = await channel.threads.create({ name: "Changelog", reason: "Changelog", autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek });
                thread.send("Changelog for those interested. Unmute this thread to receive updates.");
                this.memory.changelogthreadid = thread.id;
                this.memory.save();
            }
        }

        if (this.memory.modinfoid !== "") {
            var channel = this.getChannel(this.memory.modinfochannelid);
            var msg = await channel.messages.fetch(this.memory.modinfoid);
            msg.edit({ embeds: getModInfoEmbeds(this) });
        }

        if (this.memory.minecraftchannelid !== "") {
            await this.refreshMinecraft();
        }

        this.sendChangelog();

        this.log.info("Waiting for processes to finish");
        await Promise.all(promisesToAwait);

        this.hasStarted = true;
        this.log.info("Bot slipped on a banana and had to restart. Ready");
    }

    public async onNewMember(user: GuildMember) {
        await this.syncUser(user);
        this.people.push(user);

        this.welcomeChannel.send(`Welcome ${userMention(user.id)} to the MSSM Discord Server! Be sure to take a look at ${channelMention("739335850130669608")} and ${channelMention("1127742548287422534")} at some point.`)
    }

    public async onMemberLeave(user: GuildMember | PartialGuildMember) {
        this.welcomeChannel.send(`${user.displayName} has left.`);
    }

    public async onMessage(msg: Message) {
        if (msg.author.bot) return;

        if (msg.createdAt.toLocaleDateString() !== this.memory.latestmessagedate) {
            this.log.info(`There were ${this.memory.messagestoday} messages yesterday`);
            this.levelChannel.send(`There were ${this.memory.messagestoday} messages yesterday`);
            this.memory.latestmessagedate = msg.createdAt.toLocaleDateString();
            this.memory.messagestoday = 0;
        }

        this.memory.messagestoday += 1;

        if (!this.xpBanList.includes(msg.channelId) && msg.content[0] !== "!" && msg.content.length >= 20) {
            var canGiveXP = true;

            if (Object.hasOwn(this.xpCooldown, msg.author.id)) {
                if ((Date.now() - this.xpCooldown[msg.author.id].getTime()) / 1000 < 30) {
                    canGiveXP = false;
                }
            }

            if (canGiveXP) {
                await this.addXP(msg.author.id, 1);
                this.xpCooldown[msg.author.id] = new Date(Date.now());
            }
        }

        this.memory.save();
    }

    public async onInteraction(message: Interaction) {
        if (message.isAutocomplete() || message.isChatInputCommand()) {
            const cmd = this.commands.find(i => i.getName() == message.commandName);
            if (!cmd) {
                this.log.error("Cannot find command " + message.commandName);
                return;
            }

            if (message.isAutocomplete()) {
                await cmd.autocomplete(message, this);
            } else if (message.isChatInputCommand()) {
                try {
                    if (cmd.getName() !== "hand") cmd.log.silly(`${this.getUser(message).displayName} has run /${cmd.getName()}`);
                    await cmd.execute(message, this, this.getUserV2(message.user.id));
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

    public getLevelFromXP(xp: number) {
        if (xp <= 0) return 0;
        return Math.floor((Math.sqrt(xp + 4) - 2) / 1.5);
    }

    public getXPFromLevel(level: number) {
        if (level <= 0) return 0;
        return Math.floor(((9 * (level ** 2)) / 4) + (6 * level));
    }

    public async addXP(user: string, amount: number): Promise<boolean>;
    public async addXP(user: MSSMUser, amount: number): Promise<boolean>;
    public async addXP(user: MSSMUser | string, amount: number): Promise<boolean> {
        var id = typeof (user) === "string" ? user : user.id;

        var data: MSSMUser;
        if (typeof (user) === "string") {
            data = this.getUserV2(user);
        } else {
            data = user;
        }

        data.xp += amount;
        data.need_message = this.getLevelFromXP(data.xp) < this.getLevelFromXP(data.xp + amount);

        if (this.getLevelFromXP(data.xp) < this.getLevelFromXP(data.xp + amount)) {
            this.counting.giveSave(data, .25);
        }

        this.log.silly(`Giving ${data.discord.displayName} ${amount} xp`);

        if (data.need_message) {
            await this.levelChannel.send(`${data.levelup_ping ? userMention(data.id) : data.discord.displayName} has leveled up! They are now level ${this.getLevelFromXP(data.xp) + 1}`);
            await this.clearLevelUp(data.id);
            this.log.info(`${data.discord.displayName} leveled up`);
        }

        return data.need_message;
    }

    public async clearLevelUp(user: string) {
        await this.db.userData.update({ where: { id: user }, data: { need_message: false } });
    }

    public async requireResource(type: "embed", user: GuildMember, msg: InteractionSendable, opts: {}): Promise<APIEmbed>;
    public async requireResource(type: "string", user: GuildMember, msg: InteractionSendable, opts: StringOpts): Promise<string>;
    public async requireResource(type: "embed" | "string", user: GuildMember, msg: InteractionSendable, opts: {} | StringOpts) {
        this.log.info(`${user.displayName} has required a resource`);
        if (type === "embed") return await new EmbedResource().get(user, msg, this, opts);
        if (type === "string") return await new StringResource().get(user, msg, this, opts as StringOpts);

    }

    public starboard: Starboard;
    public counting: Counting;
    public qotd: QOTD;
    public logging: BotLogger;
    public clubs: Clubs;
    public muckbang: Muckbang;
    public addComponent(component: Component) {
        this.components.push(component);

        if (component instanceof Starboard) this.starboard = component;
        if (component instanceof Counting) this.counting = component;
        if (component instanceof QOTD) this.qotd = component;
        if (component instanceof BotLogger) this.logging = component;
        if (component instanceof Clubs) this.clubs = component;
        if (component instanceof Muckbang) this.muckbang = component;
    }

    public registerCommand(command: Command) {
        this.commands.push(command);
    }

    public registerGame(game: new (host: GuildMember, baseChannel: TextChannel, bot: MSSM, type: string, quiet?: boolean, crashed?: boolean) => Game, name: string) {
        this.games[name] = game;
    }

    public async refreshMinecraft() {
        var channel = this.getChannel(this.memory.minecraftchannelid);
        var msg = await channel.messages.fetch(this.memory.minecraftid);
        await msg.edit({ embeds: await getMinecraftEmbeds(this) });

        setTimeout(this.refreshMinecraft.bind(this), 30000);
    }

    public async refreshCommands() {
        const rest = new REST().setToken(this.secret);

        const cmds: (SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">)[] = [];

        this.commands.forEach(i => {
            cmds.push(i.create());
        });

        ["739332910620082208"].forEach(async i => {
            await rest.put(Routes.applicationGuildCommands(this.clientID, i), { body: cmds })
        });

        this.log.info("Refreshed commands");
    }

    public isUserPlaying(user: User | GuildMember | UserData) {
        for (const i of this.activeGames) {
            if (i.isUserPlaying(user as GuildMember)) return true;
        }

        return false;
    }

    public getChannel<T extends GuildBasedChannel = TextChannel>(id: string) : T {
        for (const i of this.client.guilds.cache.values()) {
            var ret = i.channels.cache.get(id) as T;
            if (ret !== undefined) {
                return ret;
            }
        }

        throw "Unable to find channel with id " + id;
    }

    public createEmbedFromMessage(msg: Message): [EmbedBuilder, Attachment?] {
        var user = this.getUser(msg);

        var embed = new EmbedBuilder().setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() }).setTitle(`Message in ${channelMention(msg.channelId)}`).setColor(user.displayColor);

        if (isValidUrl(msg.content)) {
            embed.setImage(msg.content);
        } else if (msg.content !== "") {
            embed.setDescription(msg.content);
        }

        var sendoff: Attachment = null;
        if (msg.attachments.size != 0) {
            var attachment = msg.attachments.first();

            if (attachment.contentType?.includes("image/")) {
                embed.setImage(attachment.url);
            } else {
                sendoff = attachment;
            }
        } else if (msg.stickers.size != 0) {
            embed.setImage(msg.stickers.first().url);
        } else if (msg.embeds.length != 0) {
            var e = msg.embeds[0];
            if (e.title == null && e.description == null && e.thumbnail != null) {
                embed.setImage(e.thumbnail.url);
            } else {
                embed.setDescription(`**${e.title ? e.title : ""}**\n\n${e.description ? e.description : ""}`);
                if (e.fields?.length != 0) embed.setFields(e.fields);
                if (e.image) embed.setImage(e.image.url);
                if (e.thumbnail) embed.setThumbnail(e.thumbnail.url);
            }
        }

        return [embed, sendoff];
    }

    public userExists(id: string) {
        for (const i of this.client.guilds.cache.values()) {
            if (i.members.cache.has(id)) return true;
        }

        return false;
    }

    public getUserV2(id: string) {
        return this.users[id];
    }

    public getUser(id: string): GuildMember
    public getUser(user: User): GuildMember
    public getUser(user: UserData): GuildMember
    public getUser(user: { author: User }): GuildMember
    public getUser(user: { user: User }): GuildMember
    public getUser(user: string | UserData | User | { author: User } | { user: User }) {
        for (const i of this.client.guilds.cache.values()) {
            var id = "";
            if (typeof user === "string") {
                id = user;
            } else if ("author" in user) {
                id = user.author.id;
            } else if ("user" in user) {
                id = user.user.id;
            } else {
                id = user.id;
            }

            var ret = i.members.cache.get(id);
            if (ret !== undefined) {
                return ret;
            }
        }

        throw new Error("Unable to find user with id " + id);
    }

    public getRole(id: string): Role {
        for (const i of this.client.guilds.cache.values()) {
            if (i.roles.cache.has(id)) {
                return i.roles.cache.get(id);
            }
        }

        throw new Error("Unable to find role with id " + id);
    }

    public sendChangelog() {
        var title = "Update ";
        var date = new Date().toLocaleDateString().replaceAll("/", ".");
        title += date;

        if (this.memory.changeloglastdate !== date) {
            this.memory.changelognumdate = 1;
        }

        title += `-${this.memory.changelognumdate}`;

        this.memory.changeloglastdate = date;

        var desc = `
* Switched up how /status is customized
        `;

        if (this.memory.changeloglastdesc === desc) return;
        this.memory.changeloglastdesc = desc;

        var embed = new EmbedBuilder()
            .setTitle(title)
            .setDescription(desc)
            .setColor("Green");

        this.log.info("Sending changelog");
        this.getChannel(this.memory.infochannelid).threads.fetch(this.memory.changelogthreadid).then(i => i.send({ embeds: [embed] }));

        this.memory.changelognumdate++;

        this.memory.save();
    }

    public async sendRules() {
        this.log.info("Sending rules");

        var channel = this.getChannel(this.memory.ruleschannelid);

        if (this.memory.rulesmessageids.length !== 0) {
            for (const i of this.memory.rulesmessageids) {
                channel.messages.delete(i);
            }
        } else {
            this.log.warn("No rules messages");
        }

        this.memory.rulesmessageids = [];

        for (const i of this.memory.rulesmessages) {
            var msg = await channel.send({ embeds: [i] });
            this.memory.rulesmessageids.push(msg.id);
        }

        this.memory.save();
    }
}
