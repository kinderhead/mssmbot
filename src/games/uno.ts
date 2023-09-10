import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, EmbedBuilder, GuildMember, Message, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "discord.js";
import Game, { BasicOpts, GameCommand, desc, name } from "../game.js";

export default class UnoGame extends Game<UnoOpts> {
    public hands: { [id: string]: Card[] } = {};
    public cardInPlay: Card;

    public reversed = false;
    public turn = 0;

    public currentStack = 0;
    public currentStackType: "+2" | "+4" = null;

    public lastPickupAmount = 0;

    public safeUno: string[] = [];
    public unoPenalty: boolean = false;

    public lastPlayer: GuildMember;

    public minPlayers(): number {
        return 2;
    }

    public maxPlayers(): number {
        return 25;
    }

    public getName(): string {
        return `${this.host.displayName}'s game of Uno`;
    }

    protected getCommands() {
        var cmds = [
            new GameCommand("skip", "`!skip`: Skips a players turn.", async () => {
                this.step();
                this.log.info("Skipped a turn");
                await this.sendTurnMessage();
            }),
            new GameCommand("give", "`!give <player> <amount>`: Gives a player cards. Mod only.", async (i, msg, args) => {
                if (args.length < 2 || !/([0-9])\w+/g.test(args[0])) {
                    await msg.reply("Invalid args");
                    return;
                }

                var user = this.bot.getUser(/([0-9])\w+/g.exec(args[0])[0]);
                var amount = parseInt(args[1]);

                this.log.info(`Gave ${user} ${amount} cards`);

                if (isNaN(amount)) {
                    await msg.reply("NaN");
                    return;
                }

                this.hands[user.id].push(...this.getRandomCards(amount));

                await msg.reply("The funny is done");
            }, false, false, true)
        ];

        cmds.push(...super.getCommands());
        return cmds;
    }

    protected save() {
        this.bot.memory.games[this.channel.id].data = {
            hands: this.hands,
            cardInPlay: this.cardInPlay,
            reversed: this.reversed,
            turn: this.turn,
            currentStack: this.currentStack,
            currentStackType: this.currentStackType,
            lastPickupAmount: this.lastPickupAmount,
            safeUno: this.safeUno
        }
        super.save();
    }

    protected async continueFromCrash() {
        buildCards();
        if (this.hasStarted) {
            this.lastPlayer = this.players[this.turn];
            await this.sendTurnMessage();
        }
    }

    protected async init() {
        this.channel.send("Type `!help` for help");
        buildCards();

        this.turn = 0;
        this.lastPickupAmount = 0;
        this.currentStack = 0;
        this.currentStackType = null;
        this.reversed = false;

        return new UnoOpts();
    }

    protected async start() {
        for (const i of this.players) {
            this.hands[i.id] = this.getRandomCards(7);
            this.sortCards(this.hands[i.id]);
        }

        await this.play(this.getRandomCard());
        this.sendTurnMessage();
    }

    protected async playWithMessage(card: Card, user: GuildMember) {
        // await this.quickEmbed(`It's ${user.displayName}'s turn`, `Played: ${this.getCardString(card)}${this.hands[user.id].length == 1 ? ". UNO!" : ""}`, card.color);

        await this.play(card);

        if (this.hands[user.id].length == 0) {
            await this.bot.db.userData.update({ where: { id: user.id }, data: { uno_wins: { increment: 1 } } });

            for (const i of this.players) {
                if (i.id !== user.id) {
                    await this.bot.db.userData.update({ where: { id: i.id }, data: { uno_losses: { increment: 1 } } });
                }
            }

            await this.declareWinner(user);

            await this.init();
            this.save();
        } else {
            this.sendTurnMessage();
        }
    }

    protected async play(card: Card) {
        this.cardInPlay = card;

        if (card.value === "Wild" || card.value === "+4") {
            const embed = new EmbedBuilder()
                .setTitle("Player has placed a " + this.getCardString(card))
                .setDescription("Choose a color");

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder().setLabel("Red").setStyle(ButtonStyle.Danger).setCustomId("Red"),
                    new ButtonBuilder().setLabel("Green").setStyle(ButtonStyle.Success).setCustomId("Green"),
                    new ButtonBuilder().setLabel("Blue").setStyle(ButtonStyle.Primary).setCustomId("Blue"),
                    new ButtonBuilder().setLabel("Yellow").setStyle(ButtonStyle.Secondary).setCustomId("Yellow")
                );

            // @ts-ignore
            const msg = await this.channel.send({ embeds: [embed], components: [row] });

            var int = await msg.awaitMessageComponent({ filter: i => i.user.id === this.players[this.turn].id, componentType: ComponentType.Button });
            this.cardInPlay.color = int.customId as Color;
            await int.update({ embeds: [embed.setDescription("Done")], components: [] });
        }

        if (card.value === "Reverse") {
            this.reversed = !this.reversed;
            if (this.players.length <= 2) this.step();
        }

        this.lastPlayer = this.players[this.turn];
        this.step();

        if (card.value === "+2") {
            //this.hands[this.players[this.turn].id].push(...this.getRandomCards(2));
            this.giveCards("+2")
            //await this.channel.send(`${this.players[this.turn].displayName} has been graciously given 2 cards.`);
            //this.step();
        } else if (card.value === "+4") {
            //this.hands[this.players[this.turn].id].push(...this.getRandomCards(4));
            this.giveCards("+4")
            //await this.channel.send(`${this.players[this.turn].displayName} has had 4 cards suspiciously placed in their hand.`);
            //this.step();

        } else if (card.value === "Skip") {
            //await this.channel.send(`${this.players[this.turn].displayName} has been skipped`);
            this.step();
        }
    }

    protected async sendTurnMessage() {
        var desc = "";

        if (this.lastPickupAmount != 0) {
            desc += `${this.lastPlayer.displayName} picked up ${this.lastPickupAmount} card(s)\n`;
        }

        if (this.currentStackType !== null) {
            desc += `Pickup penalty: +${this.currentStack}\n`;
        }

        desc += `Card in play: ${this.getCardString(this.cardInPlay)}\nNext player is ${this.getNextPlayer().displayName}\n\nType \`/hand\` to view your hand and play.\nTip: press up arrow if the last thing you typed was \`/hand\`.`;

        const embed = new EmbedBuilder()
            .setTitle(`It's ${this.players[this.turn].displayName}'s turn`)
            .setDescription(desc)
            .setColor(this.cardInPlay.color)
            .addFields(this.players.map(i => {
                return { name: i.displayName, value: this.hands[i.id].length == 1 ? "UNO" : `${this.hands[i.id].length} cards`, inline: true };
            }));

        for (let idex = 0; idex < this.players.length; idex++) {
            const i = this.players[idex];
            this.setHand(i, idex == this.turn);
        }

        await this.channel.send({ embeds: [embed] });

        this.safeUno = this.safeUno.filter(i => this.hands[i].length == 1);

        this.unoPenalty = false;
        this.lastPickupAmount = 0;

        this.save();
    }

    protected giveCards(type: "+2" | "+4") {
        this.currentStackType = type;
        this.currentStack += type === "+2" ? 2 : 4;
    }

    protected getHandEmbed(user: GuildMember) {
        return new EmbedBuilder()
            .setTitle("Uno Hand")
            .setDescription("If it is your turn and you don't have buttons to press, run this command again.\n\n" + this.hands[user.id].map(e => {
                return this.getCardString(e);
            }).join(" `|` "));
    }

    protected setHand(user: GuildMember, isTurn: boolean = false) {
        this.bot.hands[user.id] = async (msg) => {
            try {
                var rows: ActionRowBuilder[] = [];

                if (isTurn) {
                    var canPlay: Card[] = [];

                    if (this.currentStackType == null) {
                        for (const i of this.hands[user.id]) {
                            if (this.canCardPlay(i)) canPlay.push(i);
                        }
                    } else {
                        for (const i of this.hands[user.id]) {
                            if (i.value === this.currentStackType) canPlay.push(i);
                            else if (this.options.stackAll && (i.value === "+4" || (i.value === "+2" && this.currentStackType !== "+4"))) canPlay.push(i);
                        }
                    }

                    if (canPlay.length != 0) {
                        canPlay = uniqBy(canPlay, i => i.color + i.value);

                        var placeholder = "Select card to play";
                        if (canPlay.length > 25) {
                            canPlay = canPlay.slice(0, 25);
                            placeholder = "Discord won't display more than 25 options :(";
                        }

                        rows.push(new ActionRowBuilder()
                            .addComponents(
                                new StringSelectMenuBuilder()
                                    .setPlaceholder(placeholder)
                                    .setCustomId("card")
                                    .addOptions(canPlay.map(i =>
                                        new StringSelectMenuOptionBuilder().setLabel(this.getCardStringWithoutEmoji(i)).setValue(this.getCardNumber(i).toString())
                                    ))
                            ));
                    }

                    if (this.currentStackType == null) {
                        rows.push(new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder().setLabel("Pick up").setStyle(ButtonStyle.Primary).setCustomId("pickup")
                            ));
                    } else {
                        rows.push(new ActionRowBuilder()
                            .addComponents(
                                new ButtonBuilder().setLabel(`Pick up ${this.currentStack} cards`).setStyle(ButtonStyle.Danger).setCustomId("pickup")
                            ));
                    }
                }

                const reply = await msg.editReply({
                    embeds: [
                        this.getHandEmbed(user)
                    ],

                    // @ts-ignore
                    components: rows
                });

                if (isTurn) {
                    this.lastPickupAmount = 0;

                    const action = await reply.awaitMessageComponent({ filter: i => i.user.id === user.id });

                    if (this.players[this.turn].id !== user.id || !this.hasStarted) {
                        await action.update({
                            embeds: [
                                this.getHandEmbed(user)
                            ], components: []
                        });

                        return;
                    }

                    if (action.isButton()) {
                        if (action.customId === "pickup") {
                            if (this.currentStackType != null) {
                                this.hands[this.players[this.turn].id].push(...this.getRandomCards(this.currentStack));
                                //await this.quickEmbed(`It's ${this.players[this.turn].displayName}'s turn`, `Player has been graciously given ${this.currentStack} cards.`, this.cardInPlay.color);

                                this.currentStack = 0;
                                this.currentStackType = null;

                                this.step();
                                this.sendTurnMessage();

                                this.lastPickupAmount = this.currentStack;

                                await action.update({
                                    embeds: [
                                        this.getHandEmbed(user)
                                    ], components: []
                                });
                            } else if (this.options.pickupMany) {
                                var card: Card;
                                var num = 0;

                                while (true) {
                                    card = this.getRandomCard();
                                    num++;
                                    if (this.canCardPlay(card)) {
                                        break;
                                    }
                                    this.hands[user.id].push(card);
                                }

                                this.lastPickupAmount = num;

                                // if (num == 1) {
                                //     await this.quickEmbed(`It's ${this.players[this.turn].displayName}'s turn`, `${this.players[this.turn].displayName} has picked up a card.`, this.cardInPlay.color);
                                // } else {
                                //     await this.quickEmbed(`It's ${this.players[this.turn].displayName}'s turn`, `${this.players[this.turn].displayName} has picked up ${num} cards.`, this.cardInPlay.color);
                                // }

                                const row = new ActionRowBuilder()
                                    .addComponents(
                                        new ButtonBuilder().setLabel("Play").setStyle(ButtonStyle.Primary).setCustomId("play"),
                                        new ButtonBuilder().setLabel("Keep").setStyle(ButtonStyle.Secondary).setCustomId("keep")
                                    );

                                const optMessage = await action.update({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setTitle("Uno Hand")
                                            .setDescription("You picked up a " + this.getCardString(card))
                                            .addFields({ name: "Total cards picked up", value: num.toString() })
                                    ],
                                    // @ts-ignore
                                    components: [row]
                                });

                                const int = await optMessage.awaitMessageComponent({ filter: i => i.user.id === user.id, componentType: ComponentType.Button });

                                if (int.customId === "play") {
                                    await int.update({
                                        embeds: [
                                            this.getHandEmbed(user)
                                        ], components: []
                                    });
                                    await this.playWithMessage(card, user);
                                } else {
                                    await int.update({
                                        embeds: [
                                            this.getHandEmbed(user)
                                        ], components: []
                                    });

                                    this.hands[user.id].push(card);
                                    this.step();
                                    this.sendTurnMessage();
                                }
                            } else {
                                var card = this.getRandomCard();
                                this.hands[user.id].push(card);

                                this.lastPickupAmount = 1;

                                action.update({
                                    embeds: [
                                        new EmbedBuilder()
                                            .setTitle("Uno Hand")
                                            .setDescription("You picked up a " + this.getCardString(card))
                                    ], components: []
                                });

                                //await this.quickEmbed(`It's ${this.players[this.turn].displayName}'s turn`, `${this.players[this.turn].displayName} has picked up a card.`, this.cardInPlay.color);
                                this.step();
                                this.sendTurnMessage();
                            }
                        }

                        this.sortCards(this.hands[user.id]);
                    } else if (action.isStringSelectMenu()) {
                        var cardIndex = this.hands[user.id].findIndex(i => action.values[0] === this.getCardNumber(i).toString());
                        if (cardIndex == -1) {
                            action.update("How?????????");
                            return;
                        }

                        await action.update({
                            embeds: [
                                this.getHandEmbed(user)
                            ], components: []
                        });

                        var card = this.hands[user.id].splice(cardIndex, 1)[0];
                        this.playWithMessage(card, user);
                    }
                }
            } catch (e) {
                this.log.error(e);
                await this.sendTurnMessage();
            }
        };
    }

    public canCardPlay(card: Card) {
        if (card.color === "DarkGrey") return true;
        if (card.color === this.cardInPlay.color || card.value === this.cardInPlay.value) return true;

        return false;
    }

    protected step() {
        if (this.reversed) this.turn--;
        else this.turn++;

        this.turn = ((this.turn % this.players.length) + this.players.length) % this.players.length;
    }

    protected getNextPlayer() {
        var p = this.turn;

        if (this.reversed) p--;
        else p++;

        p = ((p % this.players.length) + this.players.length) % this.players.length;

        return this.players[p];
    }

    protected async onMessage(user: GuildMember, msg: Message<boolean>) {
        if (!this.hasStarted) return;

        if (this.isUserPlaying(user)) {
            if (msg.content.toLowerCase().trim() === "uno") {
                if (!this.safeUno.includes(user.id)) this.safeUno.push(user.id);
            }

            if (msg.content.toLowerCase().trim() === "uno" && user.id !== this.lastPlayer.id && !this.unoPenalty) {
                if (this.hands[this.lastPlayer.id].length == 1 && !this.safeUno.includes(this.lastPlayer.id)) {
                    this.hands[this.lastPlayer.id].push(...this.getRandomCards(this.options.unoPenalty));
                    this.sortCards(this.hands[this.lastPlayer.id]);
                    await this.quickEmbed(`${this.lastPlayer.displayName} did not say uno!`, `They were given ${this.options.unoPenalty} cards.`, "DarkRed");
                    this.unoPenalty = true;
                } else if (!(this.players[this.turn].id === user.id && this.hands[user.id].length <= 2)) {
                    this.hands[user.id].push(this.getRandomCard());
                    msg.reply("+1. Cope");
                }
            }
        }
    }

    public getRandomCard() {
        return { ...defaultDeck[Math.floor(Math.random() * defaultDeck.length)] };
    }

    public getRandomCards(num: number) {
        var cards: Card[] = [];
        for (let i = 0; i < num; i++) {
            cards.push(this.getRandomCard());
        }
        return cards;
    }

    public sortCards(cards: Card[]) {
        return cards.sort((a, b) => this.getCardNumber(b) - this.getCardNumber(a));
    }

    public getCardNumber(card: Card) {
        var value = 0;

        if (card.color === "DarkGrey") value += 10000;
        else if (card.color === "Red") value += 90000;
        else if (card.color === "Yellow") value += 80000;
        else if (card.color === "Green") value += 70000;
        else if (card.color === "Blue") value += 60000;

        if (card.value === "+4") value += 2;
        else if (card.value === "Wild") value += 1;
        else if (card.value === "+2") value += 12;
        else if (card.value === "Skip") value += 11;
        else if (card.value === "Reverse") value += 10;
        else value += parseInt(card.value);

        return value;
    }

    public getCardString(card: Card) {
        var emoji = "";

        switch (card.color) {
            case "Blue":
                emoji = ":blue_square:";
                break;

            case "Green":
                emoji = ":green_square:";
                break;

            case "Red":
                emoji = ":red_square:";
                break;

            case "Yellow":
                emoji = ":yellow_square:";
                break;

            default:
                emoji = ":black_large_square:";
                break;
        }

        return `${emoji} ${card.value}`;
    }

    public getCardStringWithoutEmoji(card: Card) {
        var color = " ";

        switch (card.color) {
            case "Blue":
                color = "Blue ";
                break;

            case "Green":
                color = "Green ";
                break;

            case "Red":
                color = "Red ";
                break;

            case "Yellow":
                color = "Yellow ";
                break;

            default:
                break;
        }

        return `${color}${card.value}`;
    }

    public leave(user: GuildMember) {
        const ret = super.leave(user);
        if (ret === "DONE" && this.hasStarted == true) {
            if (this.reversed) this.turn--;
            this.turn = ((this.turn % this.players.length) + this.players.length) % this.players.length;
            this.sendTurnMessage();
        }
        return ret;
    }
}

export type Color = "Red" | "Green" | "Blue" | "Yellow" | "DarkGrey";
export type Value = "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "+2" | "+4" | "Reverse" | "Skip" | "Wild";

export interface Card {
    color: Color;
    value: Value;
}

var defaultDeck: Card[] = [];

class UnoOpts extends BasicOpts {
    // @name("7/0")
    // @desc("Playing a 7 switches your hand with another player. Playing a 0 switches everyone's hand in the direction of play. WIP, does nothing yet.")
    // sevenO: boolean = false;

    @name("Pickup until valid")
    @desc("When picking up, pick up until you can play.")
    pickupMany: boolean = false;

    @name("Stack +4s always")
    @desc("+4s can always stack on +2s.")
    stackAll: boolean = false;

    @name("No uno penalty")
    @desc("If a user forgets to call uno they will pick up this number of cards.")
    unoPenalty: number = 2;
}

function buildCards() {
    if (defaultDeck.length == 0) {
        for (const color of ["Red", "Green", "Blue", "Yellow"] as Color[]) {
            defaultDeck.push({ color: color, value: "0" });
            for (let i = 0; i < 2; i++) {
                defaultDeck.push({ color: color, value: "+2" });
                defaultDeck.push({ color: color, value: "Reverse" });
                defaultDeck.push({ color: color, value: "Skip" });
                for (let i = 0; i < 9; i++) {
                    defaultDeck.push({ color: color, value: (i + 1).toString() as Value })
                }
            }
        }

        defaultDeck.push({ color: "DarkGrey", value: "+4" });
        defaultDeck.push({ color: "DarkGrey", value: "+4" });
        defaultDeck.push({ color: "DarkGrey", value: "+4" });
        defaultDeck.push({ color: "DarkGrey", value: "+4" });
        defaultDeck.push({ color: "DarkGrey", value: "Wild" });
        defaultDeck.push({ color: "DarkGrey", value: "Wild" });
        defaultDeck.push({ color: "DarkGrey", value: "Wild" });
        defaultDeck.push({ color: "DarkGrey", value: "Wild" });
    }

    if (defaultDeck.length != 108) throw "Sad alert " + defaultDeck.length;
}

function uniqBy<T>(a: T[], key: (i: T) => any) {
    var seen: { [key: string]: boolean } = {};
    return a.filter(function (item: T) {
        var k = key(item);
        return seen.hasOwnProperty(k) ? false : (seen[k] = true);
    })
}
