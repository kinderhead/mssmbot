import { Command } from "botinator";
import { APIEmbed, CacheType, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import MSSMUser from "../data/user.js";
import MSSM from "../mssm.js";

export default class QOTDQueueCommand extends Command<MSSMUser, MSSM> {
    public getName() { return "qotd-queue"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Check the QOTD queue")
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>) {
        const embed = new EmbedBuilder()
            .setTitle("QOTD Queue")
            .addFields(await Promise.all(this.bot.qotd.questionQueue.queue.map(async (i, idex) => {
                idex++;

                if (i.type === "question") {
                    var data = this.bot.qotd.questions[i.id];
                    return { name: idex + ". " + (data.isEmbed ? `Embed: ${(i.question as APIEmbed).title}` : i.question as string), value: "Question by " + this.bot.getUser(data.authorId).displayName + ". ID: " + i.id };
                } else {
                    return { name: idex + ". " + i.title, value: "Poll by " + this.bot.qotd.polls[i.id].author.discord.displayName + ". ID: " + i.id };
                }
            })));

        if (this.bot.qotd.questionQueue.queue.length === 0) {
            embed.addFields({ name: "Queue is empty", value: "Sad alert" });
        }

        await msg.reply({ embeds: [embed] });
    }
}
