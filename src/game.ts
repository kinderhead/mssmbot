import { APIEmbedField, ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ColorResolvable, ComponentType, EmbedBuilder, GuildMember, Message, MessageCollector, ModalActionRowComponentBuilder, ModalBuilder, PermissionFlagsBits, TextChannel, TextInputBuilder, TextInputStyle, ThreadChannel } from "discord.js";
import MSSM from "./mssm.js";
import "reflect-metadata";
import { GameData } from "./lib/storage.js";
import { Loggable, createCustomId } from "botinator";

export default abstract class Game<TOpts extends BasicOpts = BasicOpts> extends Loggable {
    public abstract minPlayers(): number;
    public abstract maxPlayers(): number;
    public abstract getName(): string;

    protected abstract init(): Promise<TOpts>;
    protected abstract start(): Promise<void>;
    protected abstract onMessage(user: GuildMember, msg: Message): Promise<void>;
    protected abstract continueFromCrash(): Promise<void>;

    public host: GuildMember;
    public channel: ThreadChannel;
    public bot: MSSM;

    public options: TOpts;

    public allowNewPlayers = true;
    public hasStarted = false;

    public players: GuildMember[] = [];

    public commands: GameCommand[] = [];

    public crashed: boolean = false;

    private msgCollector: MessageCollector;

    constructor(host: GuildMember, baseChannel: TextChannel, bot: MSSM, type: string, quiet: boolean = false, crashed: boolean = false) {
        super();
        this.log.settings.name = `${this.constructor.name}-${host?.displayName}`;

        this.host = host;
        this.bot = bot;

        this.commands = this.getCommands();

        if (!crashed) {
            this.players.push(this.host);

            baseChannel.threads.create({
                name: this.getName(),
                autoArchiveDuration: 60,
                reason: "Gaming"
            }).then(async i => {
                this.channel = i;
                this.bot.memory.games[this.channel.id] = new GameData();
                this.bot.memory.games[this.channel.id].type = type;

                this.channel.send({ content: quiet ? "Gaming" : "Gaming <@&752354843766554705>" });

                this.setup();
                this.options = await this.init();

                this.log.info("Initialized new game");

                this.save();
            });
        }

        this.crashed = crashed;
    }

    public async load(_data: GameData) {
        var data = JSON.parse(JSON.stringify(_data)) as GameData;

        this.channel = this.bot.client.channels.cache.get(data.channelID) as ThreadChannel;
        this.options = data.options;
        this.hasStarted = data.started;
        this.allowNewPlayers = data.allowNewPlayers;

        for (const i of data.players) {
            var player = this.bot.getUser(i);
            if (player !== undefined) {
                this.players.push(player);
            } else {
                this.send("PANIC MODE!!!!! Not all players can be found.");
                this.panic();
            }
        }

        var player = this.bot.getUser(data.host);
        if (player !== undefined) {
            this.host = player;
        }
        this.log.settings.name = `${this.constructor.name}-${this.host.displayName}`;

        for (const key in data.data) {
            // @ts-ignore
            this[key] = data.data[key];
        }

        this.setup();

        await this.send("Recovered from restart. Funny moments ensue.");
        await this.continueFromCrash();
    }

    protected save() {
        this.bot.memory.games[this.channel.id].players = this.players.map(i => i.id);
        this.bot.memory.games[this.channel.id].options = this.options;
        this.bot.memory.games[this.channel.id].channelID = this.channel.id;
        this.bot.memory.games[this.channel.id].started = this.hasStarted;
        this.bot.memory.games[this.channel.id].host = this.host.id;
        this.bot.memory.save();
    }

    private async setup() {
        this.msgCollector = this.channel.createMessageCollector();
        this.msgCollector.on("collect", async msg => {
            if (msg.author.bot) return;

            const user = this.bot.getUser(msg);
            const cmd = msg.content.toLowerCase().trim().split(" ")[0];

            for (const i of this.commands) {
                if ("!" + i.name === cmd) {
                    if (!user.permissions.has(PermissionFlagsBits.Administrator)) {
                        if (i.mustBeHost && user.id != this.host.id) return;
                        if (i.mustBePlaying && this.players.findIndex(e => e.id === user.id) == -1) return;
                        if (i.mustBeMod) return;
                    }

                    var args = msg.content.trim().split(" ");
                    args.shift();

                    this.log.silly(`Running game command: ${i.name}`, args);
                    await i.callback(user, msg, args);
                    return;
                }
            }

            this.onMessage(user, msg);
        });
    }

    public async stop(close: boolean = true) {
        for (const i of this.players) {
            this.bot.hands[i.id] = undefined;
        }

        this.allowNewPlayers = true;
        this.hasStarted = false;

        if (close) {
            this.msgCollector.stop();
            await this.channel.setArchived(true);
            this.bot.activeGames.splice(this.bot.activeGames.indexOf(this), 1);
            delete this.bot.memory.games[this.channel.id];
            this.bot.memory.save();
        }
    }

    public async panic() {
        this.bot.activeGames.splice(this.bot.activeGames.indexOf(this), 1);
        this.log.fatal("We do be panicing though");
    }

    public async send(msg: string) {
        this.log.info(msg);
        await this.channel.send(msg);
    }

    protected async sendOptions() {
        if (this.crashed) {
            this.options = await this.init();
            this.crashed = false;
        }

        try {
            var opts = Object.keys(this.options);

            var reply: ButtonInteraction = undefined;
            var msg: Message = undefined;

            if (opts.length == 0) return;

            var custom = createCustomId();
            while (true) {
                var fields: APIEmbedField[] = [];
                var row = new ActionRowBuilder<ButtonBuilder>();

                for (const i of opts) {
                    fields.push({ name: `${Reflect.getMetadata(nameKey, this.options, i)}: ${this.options[i]}`, value: Reflect.getMetadata(descKey, this.options, i) })

                    if (typeof this.options[i] === "boolean") {
                        row.addComponents(new ButtonBuilder().setLabel(`Toggle ${(Reflect.getMetadata(nameKey, this.options, i) as string).toString().toLowerCase()}`).setStyle(this.options[i] ? ButtonStyle.Success : ButtonStyle.Danger).setCustomId(custom + i));
                    } else if (typeof this.options[i] === "number") {
                        row.addComponents(new ButtonBuilder().setLabel(`Choose ${(Reflect.getMetadata(nameKey, this.options, i) as string).toString().toLowerCase()}`).setStyle(ButtonStyle.Primary).setCustomId(custom + i));
                    }
                }

                row.addComponents(new ButtonBuilder().setLabel("Start").setStyle(ButtonStyle.Primary).setCustomId(custom + "__done"));

                var embed = new EmbedBuilder()
                    .setTitle("Game options")
                    .setDescription("Only the host can change settings.")
                    .addFields(fields)
                    .setColor("Orange")

                if (reply === undefined && msg !== undefined) {
                    msg = await msg.edit({ embeds: [embed], components: [row] });
                } else if (reply === undefined) {
                    msg = await this.channel.send({ embeds: [embed], components: [row] });
                } else if (reply.isButton() && reply.customId === custom + "__done") {
                    await reply.update({ embeds: [embed], components: [] });
                    break;
                } else {
                    // @ts-ignore
                    msg = await reply.update({ embeds: [embed], components: [row] });
                }

                reply = await msg.awaitMessageComponent({ filter: i => i.user.id === this.host.id, componentType: ComponentType.Button });
                if (reply.customId === custom + "__done") continue;

                var key = reply.customId.substring(custom.length);
                var opt = this.options[key];

                if (typeof opt === "boolean") {
                    // @ts-ignore
                    this.options[key as keyof TOpts] = !opt;
                } else if (typeof opt === "number") {
                    var customID = createCustomId();
                    const modal = new ModalBuilder()
                        .setTitle(`Choose ${(Reflect.getMetadata(nameKey, this.options, key) as string).toString().toLowerCase()}`)
                        .setCustomId(customID)
                        .addComponents(
                            new ActionRowBuilder<ModalActionRowComponentBuilder>()
                                .addComponents(
                                    new TextInputBuilder()
                                        .setLabel("Type a number")
                                        .setStyle(TextInputStyle.Short)
                                        .setCustomId("number")
                                )
                        );

                    await reply.showModal(modal);

                    try {
                        var response = await reply.awaitModalSubmit({ filter: i => i.customId === customID, time: 60000 });

                        if (isNaN(parseInt(response.fields.getTextInputValue("number")))) {
                            response.reply({ content: "Not a number", ephemeral: true });
                        } else {
                            // @ts-ignore
                            this.options[reply.customId as keyof TOpts] = parseInt(response.fields.getTextInputValue("number"));

                            await response.deferReply({ ephemeral: true });
                            await response.deleteReply();
                        }

                        reply = undefined;
                    } catch (e) {
                        this.log.error(e);
                    }
                }
            }
        } catch (e) {
            this.log.error("Error choosing options:", e);

            this.send("An error has occured while choosing options. This is likely due to the bot retarting. Options will not change. If you would like to change options type `!restart`.");
        }
    }

    public async quickEmbed(title: string, body: string, color: ColorResolvable) {
        await this.channel.send({
            embeds: [
                new EmbedBuilder()
                    .setTitle(title)
                    .setDescription(body)
                    .setColor(color)
            ]
        });
    }

    public isUserPlaying(user: GuildMember) {
        return this.players.findIndex(i => i.id === user.id) != -1;
    }

    public join(user: GuildMember) {
        if (this.bot.isUserPlaying(user)) {
            return "You are already in a game. Leave that one first.";
        }

        if (this.players.length == this.maxPlayers()) {
            return "This game is full.";
        }

        if (!this.allowNewPlayers) {
            return "This game does not allow new players";
        }

        this.players.push(user);
        this.send(`${user.displayName} has joined!`);
        //this.channel.members.add(i);

        this.save();

        return "DONE";
    }

    public leave(user: GuildMember) {
        if (user === undefined) return "Player not found.";

        if (user.id === this.host.id) {
            return "You are the host. You cannot leave this game.";
        }

        this.bot.hands[user.id] = undefined;

        this.players.splice(this.players.findIndex(j => j.id === user.id), 1);
        this.send(`${user.displayName} has left.`);
        //this.channel.members.remove(i.id);

        this.save();

        return "DONE";
    }

    public async declareWinner(user: GuildMember, baseXP: number = 5) {
        await this.send(`${user.displayName} has won!`);

        await this.bot.addXP(user.id, baseXP + this.players.length)

        await this.bot.counting.giveSave(this.bot.getUserV2(user.id), 1);

        if (this.crashed) {
            this.options = await this.init();
        }

        this.stop(false);
        this.save();
    }

    protected getCommands(): GameCommand[] {
        return [
            new GameCommand("join", "`!join`: Join game.", async (i, msg) => {
                const res = this.join(i);

                if (res === "DONE") {
                    this.bot.logging.ignoreIds.push(msg.id);
                    msg.delete();
                } else {
                    msg.reply(res);
                }
            }, false, false),

            new GameCommand("leave", "`!leave`: Leave game.", async (i, msg) => {
                const res = this.leave(i);

                if (res === "DONE") {
                    this.bot.logging.ignoreIds.push(msg.id);
                    msg.delete();
                } else {
                    msg.reply(res);
                }
            }),

            new GameCommand("kick", "`!kick <player>`: Kick a player. Host only", async (i, msg, args) => {
                if (args.length == 0 || !/([0-9])\w+/g.test(args[0])) {
                    await msg.reply("Specify a player");
                    return;
                }

                var user = this.bot.getUser(/([0-9])\w+/g.exec(args[0])[0]);

                const res = this.leave(user);
                this.log.info("Kicked user ^");

                if (res === "DONE") {
                    msg.delete();
                } else {
                    msg.reply(res);
                }
            }),

            new GameCommand("players", "`!players`: Lists all players.", async (i, msg) => {
                const embed = new EmbedBuilder()
                    .setTitle("Players")
                    .addFields(this.players.map(i => {
                        return { name: i.displayName, value: "\u200B", inline: true };
                    }));

                this.channel.send({ embeds: [embed] });
            }, false, false),

            new GameCommand("start", "`!start`: Start the game. Host only", async (i, msg) => {
                if (this.hasStarted) {
                    msg.reply("This game has already started.");
                    return;
                }

                if (this.players.length < this.minPlayers()) {
                    msg.reply("Too few players.");
                    this.allowNewPlayers = true;
                    return;
                }

                this.log.info("Starting game");

                await this.sendOptions();
                this.allowNewPlayers = false;
                this.hasStarted = true;
                await this.start();
                this.save();
            }, true),

            new GameCommand("restart", "`!restart`: Restart the game. Host only", async (i, msg) => {
                await this.stop(false);
                await this.sendOptions();

                if (this.players.length < this.minPlayers()) {
                    msg.reply("Too few players.");
                    this.allowNewPlayers = true;
                    return;
                }

                this.log.info("Restarting game");

                this.allowNewPlayers = false;
                this.hasStarted = true;
                await this.start();
                this.save();
            }, true),

            new GameCommand("help", "`!help`: Show help message.", async (i, msg) => {
                const embed = new EmbedBuilder()
                    .setTitle("Help")
                    .addFields(this.commands.filter(e => {
                        if (i.permissions.has(PermissionFlagsBits.Administrator)) return true;
                        if (e.mustBeMod) return false;
                        if (e.mustBeHost && i.id === this.host.id) return true;
                        return false;
                    }).map(i => {
                        return { name: i.name, value: i.desc };
                    }));

                this.channel.send({ embeds: [embed] });
            }, false, false),

            new GameCommand("quit", "`!quit`: Close game. Host only.", async (i) => {
                this.send("Stopped game");
                this.stop();
            }, true)
        ];
    }
}

export class GameCommand {
    public name: string;
    public desc: string;
    public callback: (user: GuildMember, msg: Message, args: string[]) => Promise<void>;
    public mustBeHost: boolean;
    public mustBePlaying: boolean;
    public mustBeMod: boolean;

    constructor(name: string, desc: string, callback: (user: GuildMember, msg: Message, args: string[]) => Promise<void>, mustBeHost: boolean = false, mustBePlaying: boolean = true, mustBeMod: boolean = false) {
        this.name = name;
        this.callback = callback;
        this.desc = desc;
        this.mustBeHost = mustBeHost;
        this.mustBePlaying = mustBePlaying;
        this.mustBeMod = mustBeMod;
    }
}

export class BasicOpts {
    [key: string]: boolean | number;
}

const nameKey = Symbol("name");
const descKey = Symbol("desc");

export function name(name: string) {
    return Reflect.metadata(nameKey, name);
}

export function desc(desc: string) {
    return Reflect.metadata(descKey, desc);
}
