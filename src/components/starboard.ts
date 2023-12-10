import { MessageReaction, PartialMessageReaction, User, PartialUser, Message, EmbedBuilder, channelMention, TextChannel, Awaitable, Attachment } from "discord.js";
import Component from "../lib/component.js";
import StarboardData from "../data/starboard.js";

export default class Starboard extends Component {
    public readonly starEmojis = ["✨", "⭐", "🌟", "💫"];
    public starboardChannel: TextChannel; 

    public starboardPosts: { [id: string]: StarboardData } = {};

    public async refreshDatamaps() {
        for (const i in this.starboardPosts) {
            await this.starboardPosts[i].refresh();
        }
    }

    public async init() {
        this.starboardChannel = this.bot.getChannel("739336559219703859");
    }

    public async onReaction(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
        await this.refreshMessage(reaction);
    }

    public async onReactionRemove(reaction: MessageReaction | PartialMessageReaction, user: User | PartialUser) {
        await this.refreshMessage(reaction);
    }

    public async refreshMessage(reaction: MessageReaction | PartialMessageReaction) {
        if (this.starEmojis.includes(reaction.emoji.name)) {
            var msg = await reaction.message.fetch();
            var count = await this.countStars(msg);

            var data = this.starboardPosts[reaction.message.id];
            if (data) {
                this.log.info(`Starboard message "${msg.content}" now has ${count} stars`);
                (await this.starboardChannel.messages.fetch(data.starboardMessageId)).edit({ embeds: [this.getStarMessage(msg, count)[0]] });
                data.stars = count;
            } else if (count >= 4) {
                if (!this.bot.userExists(msg.author.id)) {
                    this.log.info(`Starboard message "${msg.content}" does not have a user`);
                    return;
                }

                var user = this.bot.getUserV2(msg.author.id);

                this.log.info(`Message "${msg.content}" was sent to starboard with ${count} stars`);
                var msgData = this.getStarMessage(msg, count);
                var starMsg = await this.starboardChannel.send({ embeds: [msgData[0]], files: msgData[1] === null ? [] : [msgData[1]] });
                try {
                    await user.createStarboardPost(msg.id, reaction.message.channelId, starMsg.id, new Date(), count);
                } catch (e) {
                    this.log.warn("Marius Cartography rapid fire starboard avoidance technique", e);
                    await starMsg.delete();
                    return;
                }
                await this.bot.addXP(msg.author.id, 10);
            }
        }
    }

    public async countStars(msg: Message) {
        var count = 0;

        var users: string[] = [msg.author.id];

        for (const i of this.starEmojis) {
            var reaction = msg.reactions.cache.find(e => e.emoji.name === i);
            if (reaction) {
                count += reaction.count;

                for (const e of await reaction.users.fetch()) {
                    if (users.includes(e[1].id)) {
                        count--;
                    }

                    users.push(e[1].id);
                }
            }
        }

        return count;
    }

    public getStarMessage(msg: Message, count: number): [EmbedBuilder, Attachment] {
        var [embed, attachment] = this.bot.createEmbedFromMessage(msg);
        var emoji = this.starEmojis[0];

        if (count >= 16) {
            emoji = this.starEmojis[3];
        } else if (count >= 12) {
            emoji = this.starEmojis[2];
        } else if (count >= 8) {
            emoji = this.starEmojis[1];
        }

        embed.setTitle(`${count} ${emoji} ${channelMention(msg.channelId)}`);
        embed.setURL(msg.url);
        embed.addFields({ name: "Link", value: `[here](${msg.url})` });
        embed.setTimestamp(msg.createdAt);

        return [embed, attachment];
    }
}