import { Message, PartialMessage, Awaitable, EmbedBuilder, channelMention } from "discord.js";
import LogCommand from "../commands/log.js";
import Component from "../lib/component.js";

export default class BotLogger extends Component {
    public init() {
        this.bot.registerCommand(new LogCommand());
    }

    public async onMessageEdit(old: Message<boolean> | PartialMessage, edited: Message<boolean> | PartialMessage) {
        try {
            if (edited.author?.bot) return;

            var user = this.bot.getUser(edited)
            var embed = new EmbedBuilder().setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() }).setTitle(`Message edited in ${channelMention(edited.channelId)}`).setColor(user.displayColor).addFields(
                { name: "Old", value: old.content === "" ? "No text" : old.content, inline: true },
                { name: "New", value: edited.content === "" ? "No text" : edited.content, inline: true }
            );

            if (edited.attachments.size != 0) {
                embed.setImage(edited.attachments.first().url);
            }

            this.bot.logChannel.send({ embeds: [embed] });
        } catch(e) {
            this.log.error(e);
        }
    }

    public async onMessageDelete(msg: Message<boolean>) {
        try {
            if (msg.author?.bot) return;

            var embed: EmbedBuilder;
            if (msg.author != null) {
                var user = this.bot.getUser(msg);

                embed = new EmbedBuilder().setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() }).setTitle(`Message deleted in ${channelMention(msg.channelId)}`).setDescription(msg.content === "" ? "No text" : msg.content).setColor(user.displayColor);
            
                if (msg.attachments.size != 0) {
                    embed.setImage(msg.attachments.first().url);
                }
            } else {
                embed = new EmbedBuilder().setTitle(`Unknown message deleted in ${channelMention(msg.channelId)}`).setDescription("Message was posted before the bot was on. Cope.").setColor("Random");
            }

            this.bot.logChannel.send({ embeds: [embed] });
        } catch (e) {
            this.log.error(e);
        }
    }
}