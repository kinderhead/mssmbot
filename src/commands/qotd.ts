import { PollData, QuestionData, UserData } from "@prisma/client";
import { APIEmbed, ActionRowBuilder, ButtonBuilder, ButtonStyle, CacheType, ChatInputCommandInteraction, ComponentType, EmbedBuilder, ModalActionRowComponentBuilder, ModalBuilder, ModalSubmitInteraction, PermissionFlagsBits, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, StringSelectMenuOptionBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import Command from "../command.js";
import { Poll, Question } from "../lib/storage.js";
import { createCustomId, embedBuilder } from "../lib/utils.js";
import MSSMUser from "../data/user.js";

export default class QOTDCommand extends Command {
    private activeManagers: string[] = [];

    public getName() { return "qotd"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Add something to the Question of the Day queue")
            .addSubcommand(sbc => sbc
                .setName("ask")
                .setDescription("Ask a question")
                .addStringOption(opt => opt.setName("question").setDescription("Question").setRequired(true)))
            .addSubcommand(sbc => sbc
                .setName("ask-fancy")
                .setDescription("Ask a question using fancy discord this.bot messages"))
            .addSubcommand(sbc => sbc
                .setName("poll")
                .setDescription("Creates a poll which will close the following day")
                .addStringOption(opt => opt.setName("title").setDescription("Title").setRequired(true))
                .addStringOption(opt => opt.setName("option1").setDescription("Option 1").setRequired(false))
                .addStringOption(opt => opt.setName("option2").setDescription("Option 2").setRequired(false))
                .addStringOption(opt => opt.setName("option3").setDescription("Option 3").setRequired(false))
                .addStringOption(opt => opt.setName("option4").setDescription("Option 4").setRequired(false))
                .addStringOption(opt => opt.setName("option5").setDescription("Option 5").setRequired(false))
                .addStringOption(opt => opt.setName("option6").setDescription("Option 6").setRequired(false))
                .addStringOption(opt => opt.setName("option7").setDescription("Option 7").setRequired(false))
                .addStringOption(opt => opt.setName("option8").setDescription("Option 8").setRequired(false))
                .addStringOption(opt => opt.setName("option9").setDescription("Option 9").setRequired(false))
            )
            .addSubcommand(sbc => sbc
                .setName("manage")
                .setDescription("Edit qotd posts before they are sent"))
            .addSubcommand(sbc => sbc
                .setName("doomsday")
                .setDescription("Finds the last day there will be a QOTD post if no more are added"));
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>, user: MSSMUser) {
        if (msg.options.getSubcommand() === "ask") {
            await this.ask(msg, user);
        } else if (msg.options.getSubcommand() === "ask-fancy") {
            await this.askFancy(msg, user);
        } else if (msg.options.getSubcommand() === "poll") {
            await this.poll(msg, user);
        } else if (msg.options.getSubcommand() === "manage") {
            if (user.discord.permissions.missing(PermissionFlagsBits.ModerateMembers)) {
                await msg.reply({ ephemeral: true, content: "This command is under construction" });
            }
            await this.manage(msg, user);
        } else if (msg.options.getSubcommand() === "doomsday") {
            await this.doomsday(msg);
        } else {
            await msg.reply({ content: "Subcommand not recognized", ephemeral: true });
        }
    }

    private async ask(msg: ChatInputCommandInteraction<CacheType>, user: MSSMUser) {
        const question = msg.options.getString("question");

        if (question.length > 256) {
            await msg.reply({ content: "Question is too long", ephemeral: true });
            return;
        }

        const qdata = await user.createQuestion(question);

        this.bot.qotd.questionQueue.queue.push({ type: "question", question: question, id: qdata.id });
        this.bot.qotd.questionQueue.save();

        await this.bot.addXP(user, 5);

        await msg.reply({ content: "Question queued", ephemeral: true });

        this.log.info("New question: " + question);
    }

    private async askFancy(msg: ChatInputCommandInteraction<CacheType>, user: MSSMUser) {
        const embed = await this.bot.requireResource("embed", this.bot.getUser(msg), msg.reply.bind(msg), {});
        const question = JSON.stringify(embed);

        const qdata = await user.createQuestion(question, true);

        this.bot.qotd.questionQueue.queue.push({ type: "question", question: question, id: qdata.id });
        this.bot.qotd.questionQueue.save();

        await this.bot.addXP(user, 5);

        await msg.editReply({ content: "Question queued", embeds: [], components: [] });

        this.log.info("New question: fancy embed");
    }

    private async poll(msg: ChatInputCommandInteraction<CacheType>, user: MSSMUser) {
        const title = msg.options.getString("title");
        var options: string[] = [];

        for (let i = 1; i < 10; i++) {
            options.push(msg.options.getString(`option${i}`, false));
        }

        options = options.filter(i => i !== undefined && i !== null);

        if (title.length > 256) {
            await msg.reply({ content: "Title is too long", ephemeral: true });
            return;
        }

        if (options.length > 9) {
            await msg.reply({ content: "Too many options. Please try again", ephemeral: true });
            return;
        }

        const poll = await user.createPoll(title, options);

        this.bot.qotd.questionQueue.queue.push({ type: "poll", title: title, options: options, id: poll.id });
        this.bot.qotd.questionQueue.save();

        var lvlup = await this.bot.addXP(user, 8);

        await msg.reply({ content: "Poll queued", ephemeral: true });

        this.log.info("New poll: " + title);
    }

    private async manage(msg: ChatInputCommandInteraction<CacheType>, user: MSSMUser) {
        const embed = new EmbedBuilder()
            .setTitle("Manage QOTD posts");

        if (this.activeManagers.indexOf(user.id) != -1) {
            this.log.warn(`User tried to open multiple instances of /qotd manage`);
            embed.setDescription("Another `/qotd manage` session is in progress. Try again later or use that post");

            msg.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        this.activeManagers.push(user.id);

        const optionsID = createCustomId();

        var options = new StringSelectMenuBuilder()
            .setCustomId(optionsID)
            .setPlaceholder("Select a post")

        var found = false;
        for (let idex = 0; idex < this.bot.qotd.questionQueue.queue.length; idex++) {
            const i = this.bot.qotd.questionQueue.queue[idex];

            if (i.type === "question") {
                if (user.questions.findIndex(q => q.id === i.id) == -1) continue;

                var label = "Question: " + (typeof i.question === "string" ? i.question : i.question.title);
                if (label.length >= 100) {
                    label = label.slice(0, 96) + "...";
                }

                options.addOptions(new StringSelectMenuOptionBuilder().setLabel(label).setValue(idex.toString()));
                found = true;
            } else if (i.type === "poll") {
                if (user.polls.findIndex(q => q.id === i.id) == -1) continue;

                var label = "Poll: " + i.title;
                if (label.length >= 100) {
                    label = label.slice(0, 96) + "...";
                }

                options.addOptions(new StringSelectMenuOptionBuilder().setLabel(label).setValue(idex.toString()));
                found = true;
            }
        }

        const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(options);

        if (!found) {
            embed.addFields({ name: "No posts", value: "Try adding some" });
            await msg.reply({ embeds: [embed], ephemeral: true });
            return;
        }

        const response = await msg.reply({ embeds: [embed], components: [row], ephemeral: true });

        try {
            const selection = await response.awaitMessageComponent({ filter: i => i.user.id === msg.user.id, time: 120000 });

            if (selection.customId === optionsID) {
                if (selection.isStringSelectMenu()) {
                    await response.delete();
                    await this.managePostManager(parseInt(selection.values[0]), selection, user);
                } else {
                    throw "Not string select menu option";
                }
            }
        } catch (e) {
            this.log.error(e);
        } finally {
            this.activeManagers.splice(this.activeManagers.indexOf(user.id), 1);
        }
    }

    private async managePostManager(idex: number, msg: ChatInputCommandInteraction<CacheType> | ModalSubmitInteraction<CacheType> | StringSelectMenuInteraction<CacheType>, user: MSSMUser) {
        const post = this.bot.qotd.questionQueue.queue[idex];
        const embed = new EmbedBuilder().setTitle("Manage QOTD posts");

        const edit = new ButtonBuilder()
            .setCustomId("edit")
            .setLabel("Edit")
            .setStyle(ButtonStyle.Primary);

        const remove = new ButtonBuilder()
            .setCustomId("delete")
            .setLabel("Delete")
            .setStyle(ButtonStyle.Danger);

        const hijack = new ButtonBuilder()
            .setCustomId("hijack")
            .setLabel("Hijack")
            .setStyle(ButtonStyle.Success);

        const cancel = new ButtonBuilder()
            .setCustomId("cancel")
            .setLabel("Cancel")
            .setStyle(ButtonStyle.Secondary);

        const row = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(edit, remove, cancel);

        if (user.discord.permissions.has(PermissionFlagsBits.ModerateMembers)) row.addComponents(hijack);

        if (post.type == "question") {
            embed.setDescription(typeof post.question === "string" ? post.question : (post.question as APIEmbed).title);
        } else if (post.type == "poll") {
            embed.setDescription(post.title);
            embed.addFields(post.options.map((i, idex) => {
                return { name: "Option " + (idex + 1).toString(), value: i };
            }));
        }

        embed.addFields({ name: "\u200B", value: "Id: " + post.id });

        const response = await msg.reply({ embeds: [embed], components: [row], ephemeral: true });

        const collector = response.createMessageComponentCollector({ componentType: ComponentType.Button, filter: async i => i.user.id === msg.user.id, time: 240000 });

        var waitingForEdit = false;

        collector.on("collect", async selection => {
            try {
                if (selection.customId === "cancel") {
                    await response.delete();
                    await selection.reply({ content: "Cancelled", ephemeral: true });
                    collector.stop();
                    return;
                } else if (selection.customId === "hijack") {
                    var thing = this.bot.qotd.questionQueue.queue.splice(idex, 1)[0];
                    this.bot.qotd.questionQueue.queue.unshift(thing);
                    this.bot.qotd.questionQueue.save();
                    await selection.reply({ content: "This will now be the next question asked", ephemeral: true });
                    collector.stop();
                    return;
                }

                const editModal = new ModalBuilder()
                    .setCustomId("edit-modal")
                    .setTitle("Edit");

                var showModal = true;
                if (post.type == "question") {
                    if (selection.customId === "edit") {
                        if (typeof post.question === "string") {
                            var question = post.question;

                            // if (question.length >= 100) {
                            //     question = question.slice(0, 96) + "...";
                            // }

                            editModal.addComponents(new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(new TextInputBuilder().setCustomId("edit-modal-input").setLabel("Question").setValue(question).setStyle(TextInputStyle.Short)));
                        } else {
                            var question = post.question.title;

                            if (question.length >= 100) {
                                question = question.slice(0, 96) + "...";
                            }

                            showModal = false;

                            await embedBuilder(user.discord, selection.reply.bind(selection), this.bot, EmbedBuilder.from(post.question), e => {
                                (this.bot.qotd.questionQueue.queue[idex] as Question).question = e;
                                this.bot.db.questionData.update({ where: { id: post.id }, data: { question: JSON.stringify(e) } });
                                this.bot.qotd.questionQueue.save();
                            });
                            return;
                        }
                    } else if (selection.customId === "delete") {
                        this.bot.qotd.questionQueue.queue.splice(idex, 1);
                        await this.bot.db.userData.update({ where: { id: user.id }, data: { questions: { delete: { id: post.id } } } });
                        this.bot.db.questionData.delete({ where: { id: post.id } });
                    }
                } else if (post.type == "poll") {
                    if (selection.customId === "edit") {
                        var title = post.title;
                        var opts = post.options.join("|");

                        // if (title.length >= 100) {
                        //     title = title.slice(0, 96) + "...";
                        // }

                        // if (opts.length >= 100) {
                        //     opts = opts.slice(0, 96) + "...";
                        // }

                        editModal.addComponents(new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                            new TextInputBuilder().setCustomId("edit-modal-title").setLabel("Title").setValue(title).setStyle(TextInputStyle.Short),
                        ), new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                            new TextInputBuilder().setCustomId("edit-modal-options").setLabel("Options").setValue(opts).setStyle(TextInputStyle.Short)
                        ));
                    } else if (selection.customId === "delete") {
                        this.bot.qotd.questionQueue.queue.splice(idex, 1);
                        await this.bot.db.userData.update({ where: { id: user.id }, data: { polls: { delete: { id: post.id } } } });
                        this.bot.db.pollData.delete({ where: { id: post.id } });
                    }
                }


                if (selection.customId === "edit") {
                    if (showModal) {
                        await selection.showModal(editModal);
                        if (!waitingForEdit) {
                            const result = await selection.awaitModalSubmit({ filter: i => i.customId === "edit-modal", time: 60000 });
                            waitingForEdit = true;

                            if (post.type == "question") {
                                var newQuestion = result.fields.getTextInputValue("edit-modal-input");
                                newQuestion = newQuestion === "" ? post.question as string : newQuestion;

                                (this.bot.qotd.questionQueue.queue[idex] as Question).question = newQuestion;
                                await this.bot.db.questionData.update({ where: { id: post.id }, data: { question: newQuestion } });
                            } else if (post.type == "poll") {
                                var newTitle = result.fields.getTextInputValue("edit-modal-title");
                                newTitle = newTitle === "" ? post.title : newTitle;
                                var newOptions = result.fields.getTextInputValue("edit-modal-options").split("|");
                                newOptions = newOptions.length <= 1 ? post.options : newOptions;

                                (this.bot.qotd.questionQueue.queue[idex] as Poll).title = newTitle;
                                (this.bot.qotd.questionQueue.queue[idex] as Poll).options = newOptions;

                                await this.bot.db.pollData.update({ where: { id: post.id }, data: { options: { deleteMany: {} } } });
                                await this.bot.db.pollData.update({ where: { id: post.id }, data: { title: newTitle, options: { createMany: { data: newOptions.map(i => { return { option: i }; }) } } } });
                            }

                            await response.delete();

                            await result.reply({ content: "Edit successful", ephemeral: true });
                        }
                    }
                } else if (selection.customId === "delete") {
                    await response.delete();
                    await selection.reply({ content: "Deletion successful", ephemeral: true });
                }
            } catch (e) {
                this.log.error(e);
            } finally {
                this.bot.qotd.questionQueue.save();
            }
        });
    }

    public async doomsday(msg: ChatInputCommandInteraction<CacheType>) {
        var time = new Date(Date.now());

        var modifier = 0;
        if (time.getHours() < 12) modifier = -1;

        time.setDate(time.getDate() + this.bot.qotd.questionQueue.queue.length + modifier);

        msg.reply(`Doomsday is ${time.toDateString()}`);
    }
}