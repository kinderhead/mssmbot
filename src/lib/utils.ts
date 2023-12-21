import { TextInputBuilder } from "@discordjs/builders";
import { diffChars } from "diff";
import { APIEmbed, APIEmbedField, APIModalInteractionResponseCallbackData, ActionRowBuilder, AnyComponentBuilder, AutocompleteInteraction, AwaitModalSubmitOptions, ButtonBuilder, ButtonInteraction, ButtonStyle, CacheType, ComponentType, EmbedBuilder, GuildMember, InteractionReplyOptions, InteractionResponse, JSONEncodable, Message, MessagePayload, ModalActionRowComponentBuilder, ModalBuilder, ModalComponentData, ModalSubmitInteraction, StringSelectMenuBuilder, StringSelectMenuInteraction, StringSelectMenuOptionBuilder, TextInputStyle, WebhookMessageEditOptions } from "discord.js";
import MSSM from "../mssm.js";
import { InteractionSendable, createCustomId, embedPager, quickModal, quickMultiModal, shorten } from "botinator";

var embedBuilders: string[] = [];
export async function embedBuilder(user: GuildMember, msg: InteractionSendable, bot: MSSM, embed: EmbedBuilder = undefined, callback: (data: APIEmbed) => void = undefined) {
    bot.log.info(`${user.displayName} is editing an embed`);

    if (embedBuilders.includes(user.id)) {
        var checkId = createCustomId();
        const checkButton = new ButtonBuilder().setLabel("Set title").setCustomId(checkId).setStyle(ButtonStyle.Success);

        var i = await msg({ content: "Warning: you are already performing this action. By continuing you run the risk of losing progress if you interact with the previous session.", components: [new ActionRowBuilder<ButtonBuilder>().addComponents(checkButton)], ephemeral: true });
        await i.awaitMessageComponent({ filter: i => i.customId === checkId });
    }

    embedBuilders.push(user.id);

    var data = bot.getUserV2(user.id);

    var newButtonId = createCustomId();
    var selectButtonId = createCustomId();

    var page = -1;
    var int: ButtonInteraction;
    var embeds = data.embeds.map(i => EmbedBuilder.from(JSON.parse(i)));

    if (embed === undefined) {
        await embedPager(embeds, msg, true, `Choose a message to edit. You have ${embeds.length} stored messages to choose from.`, [
            new ButtonBuilder().setLabel("New").setCustomId(newButtonId).setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setLabel("Select").setCustomId(selectButtonId).setStyle(ButtonStyle.Primary)
        ], {
            [newButtonId]: (p, i) => {
                page = -1;
                int = i;
                return true;
            },
            [selectButtonId]: (p, i) => {
                page = p;
                int = i;
                return true;
            }
        });

        if (page != -1) {
            if (embeds.length == 0) {
                int.update({ content: "Nothing here", components: [] });
                return;
            }
            embed = embeds[page];
        } else {
            embed = new EmbedBuilder().setTitle("Title").setDescription("Description").setAuthor({ name: user.displayName, iconURL: user.displayAvatarURL() });
            embeds.push(embed);
        }
    } else {
        embeds.push(embed);
    }

    var titleButtonId = createCustomId();
    const titleButton = new ButtonBuilder().setLabel("Set title").setCustomId(titleButtonId).setStyle(ButtonStyle.Primary);

    var descButtonId = createCustomId();
    const descButton = new ButtonBuilder().setLabel("Set description").setCustomId(descButtonId).setStyle(ButtonStyle.Primary);

    var imageButtonId = createCustomId();
    const imageButton = new ButtonBuilder().setLabel("Set image").setCustomId(imageButtonId).setStyle(ButtonStyle.Primary);

    var footerButtonId = createCustomId();
    const footerButton = new ButtonBuilder().setLabel("Set footer").setCustomId(footerButtonId).setStyle(ButtonStyle.Primary);

    var createFieldButtonId = createCustomId();
    const createFieldButton = new ButtonBuilder().setLabel("Create field").setCustomId(createFieldButtonId).setStyle(ButtonStyle.Primary);

    var editFieldButtonId = createCustomId();
    const editFieldButton = new ButtonBuilder().setLabel("Edit field").setCustomId(editFieldButtonId).setStyle(ButtonStyle.Primary);

    var deleteFieldButtonId = createCustomId();
    const deleteFieldButton = new ButtonBuilder().setLabel("Delete field").setCustomId(deleteFieldButtonId).setStyle(ButtonStyle.Secondary);

    var inlineFieldButtonId = createCustomId();
    const inlineFieldButton = new ButtonBuilder().setLabel("Toggle field inline").setCustomId(inlineFieldButtonId).setStyle(ButtonStyle.Primary);

    var sendButtonId = createCustomId();
    const sendButton = new ButtonBuilder().setLabel(callback === undefined ? "Send embed" : "Submit embed").setCustomId(sendButtonId).setStyle(ButtonStyle.Success);

    var saveButtonId = createCustomId();
    const saveButton = new ButtonBuilder().setLabel("Save and quit").setCustomId(saveButtonId).setStyle(ButtonStyle.Success);

    var selectFieldId = createCustomId();
    const selectField = new StringSelectMenuBuilder().setCustomId(selectFieldId);

    var rows = [
        new ActionRowBuilder<ButtonBuilder>().addComponents(titleButton, descButton, imageButton, footerButton, createFieldButton),
        new ActionRowBuilder<ButtonBuilder>().addComponents(sendButton)
    ];

    if (callback === undefined) rows[1].addComponents(saveButton);

    var fieldRows = [
        new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectField),
        new ActionRowBuilder<ButtonBuilder>().addComponents(editFieldButton, inlineFieldButton, deleteFieldButton)
    ]

    var res: InteractionResponse | Message;

    if (int === undefined) {
        res = await msg({ content: "Make an edit to show field options", embeds: [embed], components: rows });
    } else {
        res = await int.update({ content: "Make an edit to show field options", embeds: [embed], components: rows });
    }

    const collector = res.createMessageComponentCollector();

    var selectedField = 0;

    collector.on("collect", async i => {
        try {
            if (i.customId === titleButtonId) {
                embed.setTitle(await quickModal("Set title", "Title", embed.data.title, TextInputStyle.Short, i, 256));
            } else if (i.customId === descButtonId) {
                embed.setDescription(await quickModal("Set description", "Description", embed.data.description, TextInputStyle.Paragraph, i, 2048));
            } else if (i.customId === imageButtonId) {
                embed.setThumbnail(await quickModal("Set image", "Url (send the image in chat and copy link)", embed.data.title, TextInputStyle.Short, i));
            } else if (i.customId === footerButtonId) {
                embed.setFooter({ text: await quickModal("Set footer", "Footer", embed.data.footer === undefined ? "Footer" : embed.data.footer.text, TextInputStyle.Short, i, 256) });
            } else if (i.customId === createFieldButtonId) {
                if (embed.data.fields?.length == 25) {
                    await res.edit("Too many fields");
                    return;
                }
                var [title, value] = await quickMultiModal("Create field", "Title", "Title", "Value", "Value", i, 256, 1024);
                embed.addFields({ name: title, value: value });
                selectedField = embed.data.fields.length - 1;
            } else if (i.customId === editFieldButtonId) {
                var [title, value] = await quickMultiModal("Edit field", "Title", embed.data.fields[selectedField].name, "Value", embed.data.fields[selectedField].value, i, 256, 1024);
                embed.data.fields[selectedField].name = title;
                embed.data.fields[selectedField].value = value;
            } else if (i.customId === deleteFieldButtonId) {
                embed.data.fields.splice(selectedField, 1);
            } else if (i.customId === inlineFieldButtonId) {
                embed.data.fields[selectedField].inline = !embed.data.fields[selectedField].inline;
            } else if (i.customId === selectFieldId && i.isStringSelectMenu()) {
                selectedField = parseInt(i.values[0]);
            } else if (i.customId === sendButtonId) {
                if (callback === undefined) {
                    await i.channel.send({ embeds: [embed] });
                } else {
                    data.embeds = embeds.map(e => JSON.stringify(e.toJSON()));

                    i.update({ content: "Submitted", components: [] });
                    callback(embed.toJSON());
                    collector.stop();
                    return;
                }
            } else if (i.customId === saveButtonId) {
                data.embeds = embeds.map(e => JSON.stringify(e.toJSON()));

                collector.stop();
                return;
            }

            if (embed.data.fields !== undefined) {
                selectField.setOptions(embed.data.fields.map((e, edex) => new StringSelectMenuOptionBuilder().setLabel(shorten(e.name)).setValue(edex.toString())));
                if (embed.data.fields.length != 0) {
                    selectField.setPlaceholder(shorten(embed.data.fields[selectedField].name));
                }
            }

            var send: MessagePayload | WebhookMessageEditOptions;
            if (embed.data.fields?.length == 0 || embed.data.fields?.length === undefined) {
                send = { embeds: [embed], components: rows, content: "" };
            } else {
                send = { embeds: [embed], components: (rows as any).concat(fieldRows), content: "" };
            }

            if (i.replied) {
                await i.editReply(send);
            } else {
                await i.update(send);
            }
        } catch (e) {
            bot.log.fatal(e);

            try {
                res.edit({ embeds: [], components: [], content: "You were a little too goated with the sauce. Don't do what you did next time." });
            } catch {

            }
        }
    });

    collector.on("end", async () => {
        embedBuilders.splice(embedBuilders.indexOf(user.id), 1);

        try {
            await res.edit({ embeds: [embed], components: [] });
        } catch {

        }
    })
}