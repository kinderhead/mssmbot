import { APIEmbed, CacheType, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import MSSM from "../bot.js";
import Command from "../command.js";

export default class QOTDQueueCommand extends Command {
    public getName() { return "qotd-queue"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Check the QOTD queue")
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        const embed = new EmbedBuilder()
            .setTitle("QOTD Queue")
            .addFields(await Promise.all(bot.qotd.questionQueue.queue.map(async (i, idex) => {
                idex++;

                if (i.type === "question") {
                    var data = await bot.db.questionData.findUnique({ where: { id: i.id } });
                    return { name: idex + ". " + (data.isEmbed ? `Embed: ${(i.question as APIEmbed).title}` : i.question as string), value: "Question by " + bot.getUser(data.authorId).displayName + ". ID: " + i.id };
                } else {
                    return { name: idex + ". " + i.title, value: "Poll by " + bot.getUser((await bot.db.pollData.findUnique({ where: { id: i.id } })).authorId).displayName + ". ID: " + i.id };
                }
            })));

        if (bot.qotd.questionQueue.queue.length === 0) {
            embed.addFields({ name: "Queue is empty", value: "Sad alert" });
        }

        await msg.reply({ embeds: [embed] });
    }
}
