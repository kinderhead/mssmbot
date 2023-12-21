import { Command, buttonHelper, createCustomId, quickActionRow } from "botinator";
import { APIEmbed, ButtonStyle, CacheType, ChatInputCommandInteraction, EmbedBuilder, ModalBuilder, SlashCommandBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import MSSMUser from "../data/user.js";
import MSSM from "../mssm.js";
import { embedBuilder } from "../lib/utils.js";

export default class ApplyCommand extends Command<MSSMUser, MSSM> {
    public getName() { return "apply"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Apply now");
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>, user: MSSMUser) {
        msg.reply({ ephemeral: true, content: "Mod apps are closed at this time." });
        return;

        const embed = new EmbedBuilder()
            .setTitle("Mod Application")
            .setDescription("READ THIS BEFORE STARTING\n\nRequirements:\n* Your application will be shown to everyone for the vote\n* You must be a current student OR know for certain that you will be coming back if you are taking a year off\n* Include who you are and why you want to be mod\n* Include what you will do to improve the server\n* Say something funny (not required)\n* Note that I will remove your application if it does not fulfill these requirements. You can still tweak it and apply again\n\nHow to use this thing:\nYou have 2 options. I recommend pressing the quickstart button, but you can also start from scratch. The thing you are submitting is a special message like ones found in #mssm-this.bot-info or Uno. These messages, called \"embeds\" by discord, can contain a single image, fancy formatting, footers, and more. I've created an editor for it because I was bored and now I'm putting it to good use. Once you submit, you can edit your embed again by using `/apply` and pressing the first button followed by navigating to your embed (if more than one is saved) and selecting it. Complicated, I know. If you need help ping the admin.");

        this.log.info(`${user.discord.displayName} is editing the mod app`);

        const res = await buttonHelper(embed, [
            [{ label: "Create, select, or edit message", style: ButtonStyle.Primary }, async i => {
                await i.update("Loading embed builder...");
                var e = await this.bot.requireResource("embed", user.discord, i.editReply.bind(i), {});
                i.editReply({ content: "Done", embeds: [], components: [] });
                return e;
            }],
            [{ label: "Quickstart new message", style: ButtonStyle.Primary }, async i => {
                const modalId = createCustomId();
                const modal = new ModalBuilder()
                    .setTitle("Quick mod app")
                    .setCustomId(modalId)
                    .addComponents(
                        quickActionRow(new TextInputBuilder().setCustomId("title").setLabel("Campaign title").setStyle(TextInputStyle.Short).setMaxLength(256).setRequired(true)),
                        quickActionRow(new TextInputBuilder().setCustomId("why").setLabel("Why do you want to be mod?").setStyle(TextInputStyle.Paragraph).setMaxLength(1024).setRequired(true)),
                        quickActionRow(new TextInputBuilder().setCustomId("what").setLabel("What will you do?").setStyle(TextInputStyle.Paragraph).setMaxLength(1024).setRequired(true)),
                        quickActionRow(new TextInputBuilder().setCustomId("funny").setLabel("Funny (not required)").setStyle(TextInputStyle.Paragraph).setMaxLength(1024).setRequired(false)),
                        quickActionRow(new TextInputBuilder().setCustomId("slogan").setLabel("Slogan (not required)").setStyle(TextInputStyle.Short).setMaxLength(256).setRequired(false)),
                    );

                await i.showModal(modal);
                const submit = await i.awaitModalSubmit({ filter: i => i.customId === modalId, time: 36000000 });
                var embed = new EmbedBuilder();
                embed.setAuthor({ name: user.discord.displayName, iconURL: user.discord.displayAvatarURL() })
                embed.setTitle(submit.fields.getTextInputValue("title"));
                embed.setDescription(submit.fields.getTextInputValue("slogan") === "" ? "--" : submit.fields.getTextInputValue("slogan"));
                embed.addFields({ name: "Why", value: submit.fields.getTextInputValue("why"), inline: true });
                embed.addFields({ name: "What", value: submit.fields.getTextInputValue("what"), inline: true });

                var funny = submit.fields.getTextInputValue("funny");
                if (funny !== "") {
                    embed.addFields({ name: "The funny", value: funny });
                }

                (await submit.reply({ content: "Loading embed builder...", ephemeral: true })).delete();

                var res: (value: void | PromiseLike<void>) => void;
                var promise = new Promise<void>(i => res = i);

                var e: APIEmbed;
                embedBuilder(user.discord, msg.editReply.bind(msg), this.bot, embed, (i) => {
                    e = i;
                    res();
                });

                await promise;
                i.editReply({ content: "Done", embeds: [], components: [] });
                return e;
            }]
        ], msg.reply.bind(msg));

        this.log.info(`${user.discord.displayName} submitted a mod app`);
        user.mod_application = JSON.stringify(res);
    }
}