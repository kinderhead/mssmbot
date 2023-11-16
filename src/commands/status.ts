import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CacheType, ChatInputCommandInteraction, ComponentType, EmbedBuilder, ModalBuilder, ModalActionRowComponentBuilder, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import MSSM from "../bot.js";
import Command from "../command.js";
import { calcWinLoss } from "../games/chess.js";
import { createCustomId, embedPager, quickModal, shorten } from "../lib/utils.js";

export default class StatusCommand extends Command {
    public getName() { return "status"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Shows data about a user")
            .addUserOption(arg => arg.setName("user").setDescription("User").setRequired(true))
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        await msg.deferReply();

        const user = bot.getUser(msg.options.getUser("user"));

        var data = await bot.db.userData.findUnique({ where: { id: user.id }, include: { questions: true, polls: { where: { channel: "942269186061774870" } }, poll_answers: { where: { poll: { channel: "942269186061774870" } } }, starboard: true, _count: true } });

        var totalStars = 0;

        for (const i of data.starboard) {
            totalStars += i.stars;
        }

        const level = bot.getLevelFromXP(data.xp);
        const defaultEmbed = new EmbedBuilder()
            .setTitle(user.displayName)
            .setThumbnail(user.displayAvatarURL())
            .setDescription(data.bio + (data.bio !== "" ? "\n\n" : "") + (data.minecraft_username !== "" ? "Minecraft username: **" + data.minecraft_username + "**\n\n" : "") + "Member since " + user.joinedAt.toLocaleDateString())
            .setColor(user.displayHexColor)
            .addFields(
                { name: "Level", value: level.toString(), inline: true },
                { name: "Level progress", value: `XP: ${data.xp}/${bot.getXPFromLevel(level + 1) + 1}`, inline: true },
                { name: '\u200B', value: '\u200B' },
                { name: "QOTD posts", value: (data._count.polls + data._count.questions).toString(), inline: true },
                { name: "Polls answered", value: data._count.poll_answers.toString(), inline: true },
                { name: '\u200B', value: '\u200B' },
                { name: "Counted", value: data.times_counted.toString(), inline: true },
                { name: "Failed to count", value: data.times_failed.toString(), inline: true },
                { name: '\u200B', value: '\u200B' },
                { name: 'Starboard stars', value: totalStars.toString(), inline: true },
                { name: 'Starboard posts', value: data._count.starboard.toString(), inline: true },
        );

        var latestQuestions = [];
        data.questions.reverse();
        data.polls.reverse();

        for (let i = 0; i < 5; i++) {
            var q = null;
            if (data._count.questions > i) {
                if (data.questions[i]?.asked === true) {
                    q = { name: "Question: " + data.questions[i].question, value: `[Link](${(await bot.qotd.qotdChannel.messages.fetch(data.questions[i].link)).url})` };
                }
            }

            var p = null;
            if (data._count.polls > i) {
                if (data.polls[i]?.asked === true) {
                    q = { name: "Poll: " + data.polls[i].title, value: `[Link](${(await bot.qotd.qotdChannel.messages.fetch(data.polls[i].link)).url})` };
                }
            }

            if (q !== null) latestQuestions.push(q);
            if (p !== null) latestQuestions.push(p);
        }

        var [chessWin, chessLoss] = await calcWinLoss(user.id, bot);

        var starboardPosts = [];
        data.starboard.sort((a, b) => a.date.getTime() - b.date.getTime());

        for (let i = 0; i < Math.min(5, data._count.starboard); i++) {
            var starboardMsg = await bot.getChannel(data.starboard[i].channelId).messages.fetch(data.starboard[i].id);
            var name = starboardMsg.content === "" ? "No text": starboardMsg.content;
            starboardPosts.push({ name: name, value: `[Link](${starboardMsg.url})` });
        }

        const qotdEmbed = new EmbedBuilder()
            .setTitle(user.displayName)
            .setThumbnail(user.displayAvatarURL())
            .setDescription("Question of the day info\nRecent QOTD posts:")
            .setColor(user.displayHexColor)
            .addFields(
                latestQuestions
        );
        
        const gameEmbed = new EmbedBuilder()
            .setTitle(user.displayName)
            .setThumbnail(user.displayAvatarURL())
            .setDescription("Game stats")
            .setColor(user.displayHexColor)
            .addFields(
                { name: "Uno win/loss ratio", value: `${data.uno_wins}/${data.uno_losses}`, inline: true },
                { name: "Chess win/loss ratio.", value: `${chessWin}/${chessLoss}`, inline: true }
        );
        
        const countingEmbed = new EmbedBuilder()
            .setTitle(user.displayName)
            .setThumbnail(user.displayAvatarURL())
            .setDescription("Counting stats")
            .setColor(user.displayHexColor)
            .addFields(
                { name: "Counted", value: data.times_counted.toString(), inline: true },
                { name: "Failed to count", value: data.times_failed.toString(), inline: true },
                { name: "Saves", value: data.saves.toString(), inline: true },
        );

        const starboardEmbed = new EmbedBuilder()
            .setTitle(user.displayName)
            .setThumbnail(user.displayAvatarURL())
            .setDescription("Starboard stats\nRecent starboard posts:")
            .setColor(user.displayHexColor)
            .addFields(
                starboardPosts
        );
        
        await embedPager([defaultEmbed, qotdEmbed, gameEmbed, countingEmbed, starboardEmbed], msg.editReply.bind(msg), false);
    }
}
