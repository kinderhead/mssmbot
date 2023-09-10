import { MessageReaction, PartialMessageReaction, User, PartialUser, Message, EmbedBuilder, channelMention, TextChannel, Awaitable } from "discord.js";
import Component from "../lib/component.js";

export default class Starboard extends Component {
    public readonly starEmojis = ["✨", "⭐", "🌟", "💫"];
    public starboardChannel: TextChannel; 

    public async init() {
        this.starboardChannel = this.bot.getChannel("739336559219703859");

        // for (const i of await this.bot.db.starboardMessage.findMany({ where: { stars: null } })) {
        //     await this.bot.db.starboardMessage.update({ where: { id: i.id }, data: { stars: await this.countStars(await this.starboardChannel.messages.fetch(i.starboardMessageId)) } });
        // }
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

            var data = await this.bot.db.starboardMessage.findUnique({ where: { id: reaction.message.id } });
            if (data) {
                this.log.info(`Starboard message "${msg.content}" now has ${count} stars`);
                (await this.starboardChannel.messages.fetch(data.starboardMessageId)).edit({ embeds: [this.getStarMessage(msg, count)] });
                await this.bot.db.starboardMessage.update({ where: { id: data.id }, data: { stars: count } });
            } else if (count >= 4) {
                this.log.info(`Message "${msg.content}" was sent to starboard with ${count} stars`);
                var starMsg = await this.starboardChannel.send({ embeds: [this.getStarMessage(msg, count)] });
                try {
                    await this.bot.db.userData.update({ where: { id: msg.author.id }, data: { starboard: { create: { id: reaction.message.id, channelId: reaction.message.id, starboardMessageId: starMsg.id, date: new Date(), stars: count } } } });
                } catch {
                    this.log.warn("Marius Cartography rapid fire starboard avoidance technique");
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

    public getStarMessage(msg: Message, count: number) {
        var embed = this.bot.createEmbedFromMessage(msg);
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
        embed.setTimestamp(msg.createdAt);

        return embed;
    }
}