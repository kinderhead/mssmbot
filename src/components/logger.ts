import { Component, discordDiff } from "botinator";
import { Attachment, EmbedBuilder, Message, PartialMessage, channelMention } from "discord.js";
import LogCommand from "../commands/log.js";
import MSSMUser from "../data/user.js";
import MSSM from "../mssm.js";

export default class BotLogger extends Component<MSSMUser, MSSM> {
    public ignoreIds: string[] = [];

    public init() {
        this.bot.registerCommand(new LogCommand(this.bot));
    }

    public async onMessageEdit(old: Message<boolean> | PartialMessage, edited: Message<boolean> | PartialMessage) {
        try {
            if (this.ignoreIds.includes(edited.id)) {
                this.ignoreIds.splice(this.ignoreIds.indexOf(edited.id), 1);
                return;
            }

            edited = await edited.fetch();

            if (edited.author.bot) return;

            var data = this.bot.createEmbedFromMessage(edited);
            var embed = data[0].setTitle(`Message edited in ${channelMention(edited.channelId)}`);
            embed.setDescription(discordDiff(old.content === "" ? "No text" : old.content, edited.content === "" ? "No text" : edited.content))

            this.bot.logChannel.send({ embeds: [embed], files: data[1] == null ? [] : [data[1]] });
        } catch (e) {
            this.log.warn(e);
        }
    }

    public async onMessageDelete(msg: Message<boolean>) {
        try {
            if (msg.author?.bot) return;

            if (this.ignoreIds.includes(msg.id)) {
                this.ignoreIds.splice(this.ignoreIds.indexOf(msg.id), 1);
                return;
            }

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
            this.log.warn(e);
        }
    }
}