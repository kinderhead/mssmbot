import { ButtonInteraction, ButtonStyle, CacheType, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder, ThreadAutoArchiveDuration, roleMention } from "discord.js";
import Command from "../command.js";
import { ButtonHelperCallback, QuickButton, SelectHelperCallback, buttonHelper, selectHelper, shorten } from "../lib/utils.js";
import { MetaQuestion, PollData } from "@prisma/client";
import MetaQuestionData from "../data/meta_question.js";
import Poll from "../data/poll.js";
import MSSMUser from "../data/user.js";

export default class MetaQuestionsCommand extends Command {
    public getName() { return "meta-board"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("We do be questioning though")
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
            .addSubcommand(sbc => sbc
                .setName("post")
                .setDescription("Post a simple question")
                .addStringOption(opt => opt.setName("question").setRequired(true).setDescription("Question to ask")))
            .addSubcommand(sbc => sbc
                .setName("poll")
                .setDescription("Post a poll")
                .addStringOption(opt => opt.setName("title").setRequired(true).setDescription("Title"))
                .addStringOption(opt => opt.setName("options").setRequired(true).setDescription("Options, like OQTD")))
            .addSubcommand(sbc => sbc
                .setName("manage")
                .setDescription("Manage all posts and polls"));
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>, user: MSSMUser) {
        await msg.deferReply({ ephemeral: true });

        if (msg.options.getSubcommand() === "post") {
            await this.post(msg);
        } else if (msg.options.getSubcommand() === "manage") {
            await this.manage(msg);
        } else if (msg.options.getSubcommand() === "poll") {
            await this.poll(msg, user);
        }

        await this.bot.qotd.refreshMetaMessage();
    }

    private async post(msg: ChatInputCommandInteraction<CacheType>) {
        const user = this.bot.getUser(msg);

        const embed = new EmbedBuilder()
            .setTitle(msg.options.getString("question"))
            .setColor("DarkNavy")
            .setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() });

        const res = await this.bot.qotd.metaQuestionsChannel.send({ embeds: [embed] });
        const thread = await res.startThread({ name: shorten(msg.options.getString("question")), autoArchiveDuration: ThreadAutoArchiveDuration.OneDay, reason: "Discussion" });
        thread.send(roleMention("1139635551406931990"));
        await MetaQuestionData.create(this.bot, msg.options.getString("question"), res.id);

        this.log.info(`Posted meta question:`, msg.options.getString("question"));

        await msg.editReply({ content: "Done" });
    }

    private async manage(msg: ChatInputCommandInteraction<CacheType>) {
        var choices: (MetaQuestionData | Poll)[] = [];
        choices.push(...this.bot.qotd.getActiveMetaQuestions());
        choices.push(...this.bot.qotd.getActiveMetaPolls());

        if (choices.length == 0) {
            await msg.editReply("No active posts");
            return;
        }

        var builtChoices: { [opt: string]: SelectHelperCallback<number> } = {};
        for (let idex = 0; idex < choices.length; idex++) {
            const i = choices[idex];
            if ("question" in i) {
                builtChoices[i.question] = async int => {
                    await int.update({ components: [] });
                    return idex;
                };
            } else {
                builtChoices[i.title] = async int => {
                    await int.update({ components: [] });
                    return idex;
                };
            }
        }

        const embed = new EmbedBuilder()
            .setTitle("Manage posts");
        
        const choice = choices[await selectHelper(embed, builtChoices, msg.editReply.bind(msg))];

        if ("question" in choice) {
            const opt = await buttonHelper(new EmbedBuilder().setTitle("Choose").setDescription(choice.question), [
                [{ label: "Resolve", style: ButtonStyle.Success }, async (int) => { await int.update({ components: [] }); return true; }],
                [{ label: "Cancel", style: ButtonStyle.Secondary }, async (int) => { await int.update({ components: [] }); return false; }]
            ], msg.editReply.bind(msg));

            if (opt) {
                var message = await this.bot.qotd.metaQuestionsChannel.messages.fetch(choice.link);
                await message.thread.setLocked(true);
                await message.delete();
                await msg.editReply({ content: "Done", embeds: [] });
                choice.active = false;
                this.log.info(`Resolved meta question "${choice.question}"`);
            }
        } else {
            var args: [QuickButton, ButtonHelperCallback<string>][] = [
                [{ label: "Resolve", style: ButtonStyle.Success }, async (int: ButtonInteraction) => { await int.update({ components: [] }); return "resolve"; }],
                [{ label: "Cancel", style: ButtonStyle.Secondary }, async (int: ButtonInteraction) => { await int.update({ components: [] }); return "cancel"; }]
            ];

            if (choice.open) {
                args.unshift([{ label: "Close", style: ButtonStyle.Danger }, async (int: ButtonInteraction) => { await int.update({ components: [] }); return "close"; }])
            }

            const opt = await buttonHelper(new EmbedBuilder().setTitle("Choose").setDescription(choice.title), args, msg.editReply.bind(msg));
            if (opt === "resolve") {
                var message = await this.bot.qotd.metaQuestionsChannel.messages.fetch(choice.link);
                if (!message.thread.archived) {
                    await message.thread.setLocked(true);
                }
                await message.delete();
                await msg.editReply({ content: "Done", embeds: [] });
                choice.open = false;
                choice.meta_is_done = true;
                this.log.info(`Resolved meta question "${choice.title}"`);
            } else if (opt === "close") {
                await this.bot.qotd.closePoll(choice, false);
            }
        }
    }

    private async poll(msg: ChatInputCommandInteraction<CacheType>, user: MSSMUser) {
        var title = msg.options.getString("title");
        var options = msg.options.getString("options").split("|");

        if (title.length > 256) {
            await msg.reply({ content: "Title is too long", ephemeral: true });
            return;
        }

        if (options.length > 9) {
            await msg.reply({ content: "Too many options. Please try again", ephemeral: true });
            return;
        }

        const poll = await user.createPoll(title, options, new Date(), "1139634512230367335", true);

        var pmsg = await this.bot.qotd.sendBasicPoll({ id: poll.id, options: options, title: title, type: "poll" }, this.bot.qotd.metaQuestionsChannel, "", this.bot.getUser(msg));
        this.bot.qotd.scheduleMetaPoll(poll);

        const thread = await pmsg.startThread({ name: shorten(title), autoArchiveDuration: ThreadAutoArchiveDuration.OneDay, reason: "Discussion" });
        thread.send(roleMention("1139635551406931990"));

        await msg.editReply({ content: "Done" });
    }
}
