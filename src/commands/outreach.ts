import { Command, SuperCommand, cmd, settingsHelper } from "botinator";
import { CacheType, ChannelType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder, SnowflakeUtil, ThreadAutoArchiveDuration, channelLink, roleMention, userMention } from "discord.js";
import MSSMUser from "../data/user.js";
import MSSM from "../mssm.js";

export default class OutreachCommand extends SuperCommand<MSSMUser, MSSM> {
    public static CHANNEL = "1212799151847247892";
    public static ROLE_ID = "1214608351967846451";

    get description(): string {
        return "Set up a private channel with Student Support in <#1212799151847247892>"
    }

    get modOnly(): boolean {
        return false;
    }

    public getName() { return "outreach"; }

    @cmd("")
    public async default(msg: ChatInputCommandInteraction) {
        await msg.deferReply({ ephemeral: true });

        const thread = await this.bot.getChannel(OutreachCommand.CHANNEL).threads.create({
            name: "Ticket-" + SnowflakeUtil.generate(),
            autoArchiveDuration: ThreadAutoArchiveDuration.OneWeek,
            type: ChannelType.PrivateThread,
            reason: "Outreach"
        });

        await thread.send(userMention(msg.user.id));
        await thread.send(roleMention(OutreachCommand.ROLE_ID));

        await msg.editReply(channelLink(thread.id));
    }
}
