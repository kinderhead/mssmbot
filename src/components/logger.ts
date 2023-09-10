import { Message, PartialMessage, Awaitable, EmbedBuilder, channelMention, Attachment } from "discord.js";
import LogCommand from "../commands/log.js";
import Component from "../lib/component.js";

export default class BotLogger extends Component {
    public init() {
        this.bot.registerCommand(new LogCommand());
    }

    public async onMessageEdit(old: Message<boolean> | PartialMessage, edited: Message<boolean> | PartialMessage) {
        try {
            if (edited.author?.bot) return;

            edited = await edited.fetch();

            var data = this.bot.createEmbedFromMessage(edited);
            var embed = data[0].setTitle(`Message edited in ${channelMention(edited.channelId)}`).setFields(
                { name: "Old", value: old.content === "" ? "No text" : old.content, inline: true },
                { name: "New", value: edited.content === "" ? "No text" : edited.content, inline: true }
            );

            this.bot.logChannel.send({ embeds: [embed], files: data[1] == null ? [] : [data[1]] });
        } catch(e) {
            this.log.error(e);
        }
    }

    public async onMessageDelete(msg: Message<boolean>) {
        try {
            if (msg.author?.bot) return;

            var embed: EmbedBuilder;
            var data: [EmbedBuilder, Attachment?] = undefined;
            if (msg.author != null) {
                data = this.bot.createEmbedFromMessage(msg);
                embed = data[0].setTitle(`Message deleted in ${channelMention(msg.channelId)}`);
            
                if (msg.attachments.size != 0) {
                    embed.setImage(msg.attachments.first().url);
                }
            } else {
                embed = new EmbedBuilder().setTitle(`Unknown message deleted in ${channelMention(msg.channelId)}`).setDescription("Message was posted before the bot was on. Cope.").setColor("Random");
            }

            this.bot.logChannel.send({ embeds: [embed], files: (!data || data[1] == null) ? [] : [data[1]] });
        } catch (e) {
            this.log.error(e);
        }
    }
}