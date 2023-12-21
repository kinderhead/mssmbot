import { Command, embedPager } from "botinator";
import { CacheType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from "discord.js";
import MSSMUser from "../data/user.js";
import { calcWinLoss } from "../games/chess.js";
import MSSM from "../mssm.js";

export default class StatusCommand extends Command<MSSMUser, MSSM> {
    public getName() { return "status"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Shows data about a user")
            .addUserOption(arg => arg.setName("user").setDescription("User").setRequired(true))
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>) {
        await msg.deferReply();

        var user = this.bot.getUserV2(msg.options.getUser("user").id);

        var totalStars = 0;

        for (const i of user.starboard) {
            totalStars += i.stars;
        }

        const level = this.bot.getLevelFromXP(user.xp);
        const defaultEmbed = new EmbedBuilder()
            .setTitle(user.discord.displayName)
            .setThumbnail(user.discord.displayAvatarURL())
            .setDescription(user.bio + (user.bio !== "" ? "\n\n" : "") + (user.minecraft_username !== "" ? "Minecraft username: **" + user.minecraft_username + "**\n\n" : "") + "Member since " + user.discord.joinedAt.toLocaleDateString())
            .setColor(user.discord.displayHexColor)
            .addFields(
                { name: "Level", value: level.toString(), inline: true },
                { name: "Level progress", value: `XP: ${user.xp}/${this.bot.getXPFromLevel(level + 1) + 1}`, inline: true },
                { name: '\u200B', value: '\u200B' },
                { name: "QOTD posts", value: (user.polls.length + user.questions.length).toString(), inline: true },
                { name: "Polls answered", value: user.poll_answers.length.toString(), inline: true },
                { name: '\u200B', value: '\u200B' },
                { name: "Counted", value: user.times_counted.toString(), inline: true },
                { name: "Failed to count", value: user.times_failed.toString(), inline: true },
                { name: '\u200B', value: '\u200B' },
                { name: 'Starboard stars', value: totalStars.toString(), inline: true },
                { name: 'Starboard posts', value: user.starboard.length.toString(), inline: true },
            );

        var latestQuestions = [];

        for (let i = 0; i < 5; i++) {
            var q = null;
            if (user.questions.length > i) {
                if (user.questions[i]?.asked === true) {
                    try {
                        q = { name: "Question: " + user.questions[i].question, value: `[Link](${(await this.bot.qotd.qotdChannel.messages.fetch(user.questions[i].link)).url})` };
                    } catch {

                    }
                }
            }

            var p = null;
            if (user.polls.length > i) {
                if (user.polls[i]?.asked === true) {
                    try {
                        q = { name: "Poll: " + user.polls[i].title, value: `[Link](${(await this.bot.qotd.qotdChannel.messages.fetch(user.polls[i].link)).url})` };
                    } catch {

                    }
                }
            }

            if (q !== null) latestQuestions.push(q);
            if (p !== null) latestQuestions.push(p);
        }

        var [chessWin, chessLoss] = await calcWinLoss(user.id, this.bot);

        var starboardPosts = [];
        user.starboard.sort((a, b) => a.date.getTime() - b.date.getTime());

        for (let i = 0; i < Math.min(5, user.starboard.length); i++) {
            try {
                var starboardMsg = await this.bot.getChannel(user.starboard[i].channelId).messages.fetch(user.starboard[i].id);
                var name = starboardMsg.content === "" ? "No text" : starboardMsg.content;
                starboardPosts.push({ name: name, value: `[Link](${starboardMsg.url})` });
            } catch (e) {
                this.log.warn(e);
            }
        }

        const qotdEmbed = new EmbedBuilder()
            .setTitle(user.discord.displayName)
            .setThumbnail(user.discord.displayAvatarURL())
            .setDescription("Question of the day info\nRecent QOTD posts:")
            .setColor(user.discord.displayHexColor)
            .addFields(
                latestQuestions
            );

        const gameEmbed = new EmbedBuilder()
            .setTitle(user.discord.displayName)
            .setThumbnail(user.discord.displayAvatarURL())
            .setDescription("Game stats")
            .setColor(user.discord.displayHexColor)
            .addFields(
                { name: "Uno win/loss ratio", value: `${user.uno_wins}/${user.uno_losses}`, inline: true },
                { name: "Chess win/loss ratio.", value: `${chessWin}/${chessLoss}`, inline: true }
            );

        const countingEmbed = new EmbedBuilder()
            .setTitle(user.discord.displayName)
            .setThumbnail(user.discord.displayAvatarURL())
            .setDescription("Counting stats")
            .setColor(user.discord.displayHexColor)
            .addFields(
                { name: "Counted", value: user.times_counted.toString(), inline: true },
                { name: "Failed to count", value: user.times_failed.toString(), inline: true },
                { name: "Saves", value: user.saves.toString(), inline: true },
            );

        const starboardEmbed = new EmbedBuilder()
            .setTitle(user.discord.displayName)
            .setThumbnail(user.discord.displayAvatarURL())
            .setDescription("Starboard stats\nRecent starboard posts:")
            .setColor(user.discord.displayHexColor)
            .addFields(
                starboardPosts
            );

        await embedPager([defaultEmbed, qotdEmbed, gameEmbed, countingEmbed, starboardEmbed], msg.editReply.bind(msg), false);
    }
}
