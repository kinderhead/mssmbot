import { GuildEmoji, Awaitable, Message, MessageReaction, PartialMessageReaction, PartialUser, User } from "discord.js";
import Component from "../lib/component.js";

import { evaluate } from 'mathjs';
import CountingCommand from "../commands/counting.js";

export default class Counting extends Component {
    public init(): Awaitable<void> {
        this.bot.registerCommand(new CountingCommand());
    }

    public async onMessage(msg: Message<boolean>) {
        if (msg.channelId === this.bot.memory.countingchannelid) {
            await this.handleCounting(msg);
        }
    }

    public async handleCounting(msg: Message) {
        try {
            var num: number;
            try {
                num = evaluate(msg.content.trim().replaceAll("\\", ""));
            } catch {
                // evaluate is not a number
                return;
            }

            if (Number.isInteger(num) && num > 0 && this.bot.memory.lasttocount !== msg.author.id) {
                if (num == this.bot.memory.count + 1) {
                    this.bot.memory.lasttocount = msg.author.id;
                    this.bot.memory.count += 1;
                    await this.bot.db.userData.update({ where: { id: msg.author.id }, data: { times_counted: { increment: 1 } } });
                    await msg.react("✅");
                } else {
                    var data = await this.bot.db.userData.update({ where: { id: msg.author.id }, data: { times_failed: { increment: 1 } } });
                    await msg.reply("It appears that you cannot count.");
                    this.log.info(`Someone can't count lol`);

                    if (this.bot.memory.highscore < this.bot.memory.count) {
                        this.bot.memory.highscore = this.bot.memory.count;
                        await msg.channel.send("New high score!");
                        this.log.info("New counting high score", this.bot.memory.highscore);
                    }

                    if (data.saves > 0) {
                        data = await this.bot.db.userData.update({ where: { id: msg.author.id }, data: { saves: { increment: -1 } } });
                        msg.channel.send(`${this.bot.getUser(data).displayName} has used up 1 save. They have ${data.saves} remaining. Next number is ${this.bot.memory.count + 1}`);
                    } else {
                        this.bot.memory.count = 0;
                        this.bot.memory.lasttocount = "";

                        msg.channel.send("Next number is 1");
                    }

                    if (data.times_failed == 10) {
                        this.bot.getUser(data).roles.add("787148841655992381");
                        await msg.channel.send(`${this.bot.getUser(data).displayName} has failed to count 10 times and has been given the can't count role`);
                    }
                }

                this.bot.memory.save();
            }
        } catch (e) {
            this.log.fatal(e);
            await msg.reply(`There was an error processing this message. The next number is ${this.bot.memory.count + 1}.`);
        }
    }

    public async onReaction(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
        if (reaction.message.channelId === this.bot.memory.countingchannelid) {
            if (reaction.emoji.name === "✅" && !reaction.users.cache.has(this.bot.client.user.id)) {
                await reaction.remove();
            }
        }
    }

    public async giveSave(user: string, amount: number) {
        const data = await this.bot.db.userData.findUnique({ where: { id: user } });
        data.saves += amount;

        if (data.saves > 3) {
            data.saves = 3;
        }

        await this.bot.db.userData.update({ where: { id: user }, data: { saves: data.saves } });
    }
}