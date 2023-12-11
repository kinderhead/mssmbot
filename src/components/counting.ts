import { GuildEmoji, Awaitable, Message, MessageReaction, PartialMessageReaction, PartialUser, User } from "discord.js";
import Component from "../lib/component.js";

import { evaluate } from 'mathjs';
import CountingCommand from "../commands/counting.js";
import MSSMUser from "../data/user.js";

export default class Counting extends Component {
    public init(): Awaitable<void> {
        this.bot.registerCommand(new CountingCommand(this.bot));
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
                var user = this.bot.getUserV2(msg.author.id);

                if (num == this.bot.memory.count + 1) {
                    this.bot.memory.lasttocount = msg.author.id;
                    this.bot.memory.count++;
                    user.times_counted++;
                    await msg.react("✅");
                } else {
                    user.times_failed++;
                    await msg.reply("It appears that you cannot count.");
                    this.log.info(`Someone can't count lol`);

                    if (this.bot.memory.highscore < this.bot.memory.count) {
                        this.bot.memory.highscore = this.bot.memory.count;
                        await msg.channel.send("New high score!");
                        this.log.info("New counting high score", this.bot.memory.highscore);
                    }

                    if (user.saves > 0) {
                        user.saves--;
                        msg.channel.send(`${user.discord.displayName} has used up 1 save. They have ${user.saves} remaining. Next number is ${this.bot.memory.count + 1}`);
                    } else {
                        user.saves = 0;
                        this.bot.memory.count = 0;
                        this.bot.memory.lasttocount = "";

                        msg.channel.send("Next number is 1");
                    }

                    if (user.times_failed == 10) {
                        user.discord.roles.add("787148841655992381");
                        await msg.channel.send(`${user.discord.displayName} has failed to count 10 times and has been given the can't count role`);
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

    public giveSave(user: MSSMUser, amount: number) {
        user.saves += amount;

        if (user.saves > 3) {
            user.saves = 3;
        }
    }
}