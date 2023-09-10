import { TextInputBuilder } from "@discordjs/builders";
import { ActionRowBuilder, APIEmbedField, APIModalInteractionResponseCallbackData, APIEmbed, AwaitModalSubmitOptions, WebhookMessageEditOptions, StringSelectMenuOptionBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, CacheType, CommandInteraction, ComponentType, Embed, EmbedBuilder, GuildMember, InteractionReplyOptions, InteractionResponse, JSONEncodable, Message, MessagePayload, ModalActionRowComponent, ModalActionRowComponentBuilder, ModalBuilder, ModalComponentData, ModalSubmitInteraction, TextInputStyle, AnyComponentBuilder, StringSelectMenuInteraction } from "discord.js";
import MSSM, { DEFAULT_LOGGER } from "../bot.js";

export async function expandAndHandleEmbed(base: EmbedBuilder, fields: APIEmbedField[], chunkSize: number, msg: InteractionSendable) {
    const pages = [];

    for (let i = 0; i < fields.length; i += chunkSize) {
        const chunk = fields.slice(i, i + chunkSize);

        pages.push(EmbedBuilder.from(base.toJSON()).addFields(chunk));
    }

    await embedPager(pages, msg);
}

export async function embedPager(pages: EmbedBuilder[], msg: InteractionSendable, ephemeral: boolean = false, content: string = "", additionalButtons: ButtonBuilder[] = [], callbacks: { [name: string]: (page: number, interaction: ButtonInteraction) => boolean | Promise<boolean> } = {}) {
    var pageIndex = 0;

    var nextId = createCustomId();
    var prevId = createCustomId();
    
    const next = new ButtonBuilder()
        .setCustomId(nextId)
        .setLabel("Next")
        .setStyle(ButtonStyle.Primary);

    const previous = new ButtonBuilder()
        .setCustomId(prevId)
        .setLabel("Previous")
        .setStyle(ButtonStyle.Primary);
    
    const row = new ActionRowBuilder<ButtonBuilder>();
    
    if (pages.length >= 2) {
        row.addComponents(previous, next);
    }

    row.addComponents(...additionalButtons);

    var reply: InteractionResponse | Message;

    if (pages.length == 0) {
        reply = await msg({ content: content, components: row.data.components == undefined ? []: [row], ephemeral: ephemeral });
    } else {
        reply = await msg({ content: content, embeds: [pages[0]], components: [row], ephemeral: ephemeral });
    }

    const collector = reply.createMessageComponentCollector({ componentType: ComponentType.Button, time: 300000 });

    await new Promise<void>(res => {
        collector.on("collect", async i => {
            if (i.customId == nextId) pageIndex++;
            else if (i.customId == prevId) pageIndex--;
            else if (i.customId in callbacks) {
                if (await callbacks[i.customId](pageIndex, i)) {
                    collector.stop();
                    return;
                }
            }
    
            if (pages.length != 0) {
                pageIndex = ((pageIndex % pages.length) + pages.length) % pages.length;
    
                if (i.replied) {
                    i.editReply({ embeds: [pages[pageIndex]], components: [row] });
                } else {
                    i.update({ embeds: [pages[pageIndex]], components: [row] });
                }
            }
        });
    
        collector.on("end", async i => {
            try {
                if (pages.length != 0) {
                    await reply.edit({ embeds: [pages[pageIndex]] });
                }
            } catch {

            }

            res();
        });
    });
}

export type SettingsArgType<T> = { default: T, name: string, desc: string, on_change: (i: T) => void | Promise<void | any> };
export async function settingsHelper(user: GuildMember, msg: InteractionSendable, bot: MSSM, embed: EmbedBuilder, options: SettingsArgType<boolean>[], ephemeral: boolean = true) {
    var custom = createCustomId();

    var int: ButtonInteraction = undefined;
    var message: InteractionResponse | Message = undefined;

    while (true) {
        embed.setFields(...options.map(i => {
            return { name: i.name + ": " + i.default, value: i.desc };
        }));

        var row = quickActionRow(...options.map(i => new ButtonBuilder().setCustomId(custom + i.name).setLabel(`Toggle ${i.name.toLowerCase()}`).setStyle(i.default ? ButtonStyle.Success : ButtonStyle.Danger)));

        if (int === undefined) {
            message = await msg({ embeds: [embed], components: [row], ephemeral: true });
        } else {
            message = await int.update({ embeds: [embed], components: [row] });
        }

        try {
            int = await message.awaitMessageComponent({ filter: i => i.user.id === user.id && options.map(i => custom + i.name).includes(i.customId), componentType: ComponentType.Button });
        } catch (e) {
            DEFAULT_LOGGER.error(e);
            await message.edit({ embeds: [embed], components: [] });
            return;
        }
        
        for (const i of options) {
            if (int.customId === custom + i.name) {
                i.default = !i.default;
                await i.on_change(i.default);

                break;
            }
        }
    }
}

var embedBuilders: string[] = [];
export async function embedBuilder(user: GuildMember, msg: InteractionSendable, bot: MSSM, embed: EmbedBuilder = undefined, callback: (data: APIEmbed) => void = undefined ) {
    bot.log.info(`${user.displayName} is editing an embed`);
    
    if (embedBuilders.includes(user.id)) {
        var checkId = createCustomId();
        const checkButton = new ButtonBuilder().setLabel("Set title").setCustomId(checkId).setStyle(ButtonStyle.Success);

        var i = await msg({ content: "Warning: you are already performing this action. By continuing you run the risk of losing progress if you interact with the previous session.", components: [new ActionRowBuilder<ButtonBuilder>().addComponents(checkButton)] });
        await i.awaitMessageComponent({ filter: i => i.customId === checkId });
    }

    embedBuilders.push(user.id);
    
    var data = await bot.db.userData.findUnique({ where: { id: user.id } });

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
                    await bot.db.userData.update({ where: { id: user.id }, data: { embeds: { set: embeds.map(e => JSON.stringify(e.toJSON())) } } });

                    i.update({ content: "Submitted", components: [] });
                    callback(embed.toJSON());
                    collector.stop();
                    return;
                }
            } else if (i.customId === saveButtonId) {
                await bot.db.userData.update({ where: { id: user.id }, data: { embeds: { set: embeds.map(e => JSON.stringify(e.toJSON())) } } });
                
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

export async function quickModal(title: string, label: string, def: string, style: TextInputStyle, int: { showModal: (modal: APIModalInteractionResponseCallbackData | ModalComponentData | JSONEncodable<APIModalInteractionResponseCallbackData>) => Promise<void>, awaitModalSubmit: (options: AwaitModalSubmitOptions<ModalSubmitInteraction<CacheType>>) => Promise<ModalSubmitInteraction<CacheType>> }, max: number = 4000) {
    //var placeholder = shorten(def);
    
    try {
        var modalId = createCustomId();
        var id = createCustomId();
        const modal = new ModalBuilder().setTitle(title).setCustomId(modalId).addComponents(
            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(new TextInputBuilder().setCustomId(id).setLabel(label).setValue(def).setStyle(style).setMaxLength(max).setRequired(false))
        );

        await int.showModal(modal);

        const res = await int.awaitModalSubmit({ time: 36000000, filter: i => i.customId === modalId });
        res.deferReply().then(i => i.delete());

        const str = res.fields.getTextInputValue(id);
        return str === "" ? def : str;
    } catch (e) {
        DEFAULT_LOGGER.error(e);
        return def;
    }
}

export async function quickMultiModal(title: string, label1: string, def1: string, label2: string, def2: string, int: { showModal: (modal: APIModalInteractionResponseCallbackData | ModalComponentData | JSONEncodable<APIModalInteractionResponseCallbackData>) => Promise<void>, awaitModalSubmit: (options: AwaitModalSubmitOptions<ModalSubmitInteraction<CacheType>>) => Promise<ModalSubmitInteraction<CacheType>> }, max1: number = 4000, max2: number = 4000): Promise<[string, string]> {
    try {
        //var placeholder1 = shorten(def1);
        //var placeholder2 = shorten(def2);
    
        var modalId = createCustomId();
        var id1 = createCustomId();
        var id2 = createCustomId();
        const modal = new ModalBuilder().setTitle(title).setCustomId(modalId).addComponents(
            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                new TextInputBuilder().setCustomId(id1).setLabel(label1).setValue(def1).setStyle(TextInputStyle.Short).setMaxLength(max1).setRequired(false)
            ),
            new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(
                new TextInputBuilder().setCustomId(id2).setLabel(label2).setValue(def2).setStyle(TextInputStyle.Paragraph).setMaxLength(max2).setRequired(false)
            )
        );

        await int.showModal(modal);

        const res = await int.awaitModalSubmit({ time: 36000000, filter: i => i.customId === modalId });
        res.deferReply().then(i => i.delete());

        const str1 = res.fields.getTextInputValue(id1);
        const str2 = res.fields.getTextInputValue(id2);
        return [str1 === "" ? def1 : str1, str2 === "" ? def2 : str2];
    } catch (e) {
        DEFAULT_LOGGER.error(e);
        return [def1, def2];
    }
}

export type ButtonHelperCallback<T> = (int: ButtonInteraction) => T | Promise<T>;
export async function buttonHelper<T = void>(base: EmbedBuilder, buttons: ([QuickButton, ButtonHelperCallback<T>])[], msg: InteractionSendable, ephemeral: boolean = true, allowedId: string = "") {
    const pages = [];
    const cbmap: { [id: string]: ButtonHelperCallback<T> } = {};

    for (let i = 0; i < buttons.length; i += 5) {
        const chunk = buttons.slice(i, i + 5);

        pages.push(quickActionRow(...chunk.map(i => {
            const id = createCustomId();
            cbmap[id] = i[1];
            return new ButtonBuilder().setLabel(i[0].label).setStyle(i[0].style).setCustomId(id);
        })));
    }

    const reply = await msg({ embeds: [base], components: pages, ephemeral: ephemeral });
    const choice = await reply.awaitMessageComponent({
        filter: i => {
            if (allowedId === "") {
                return i.customId in cbmap;
            } else {
                return i.customId in cbmap && i.user.id === allowedId;
            }
        }, componentType: ComponentType.Button });
    try {
        await reply.edit({ embeds: [base], components: [] });
    } catch {

    }
    return await cbmap[choice.customId](choice);
}

export type SelectHelperCallback<T> = (int: StringSelectMenuInteraction) => T | Promise<T>;
export async function selectHelper<T = void>(base: EmbedBuilder, options: { [opt: string]: SelectHelperCallback<T> }, msg: InteractionSendable, ephemeral: boolean = true) {
    const menuId = createCustomId();
    const menu = new StringSelectMenuBuilder()
        .setPlaceholder("Choose post")
        .setCustomId(menuId)
        .setOptions(Object.keys(options).map((i, idex) => new StringSelectMenuOptionBuilder().setLabel(shorten(i)).setValue(idex.toString())));

    const reply = await msg({ content: "", embeds: [base], components: [quickActionRow(menu)], ephemeral: ephemeral });
    const int = await reply.awaitMessageComponent({ filter: i => i.customId === menuId, componentType: ComponentType.StringSelect });
    try {
        await reply.edit({ embeds: [base], components: [] });
    } catch {

    }
    return await options[Object.keys(options)[parseInt(int.values[0])]](int);
}

export function quickActionRow<T extends AnyComponentBuilder>(...components: T[]) {
    return new ActionRowBuilder<T>().addComponents(components);
}

export function shorten(str: string, length: number = 100) {
    var short = str;
    if (short.length >= length) return short.substring(0, length - 3) + "...";
    return short;
}

export function isValidUrl(urlString: string) {
    var urlPattern = new RegExp('^(https?:\\/\\/)?' +
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' +
        '((\\d{1,3}\\.){3}\\d{1,3}))' +
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' +
        '(\\?[;&a-z\\d%_.~+=-]*)?' +
        '(\\#[-a-z\\d_]*)?$', 'i');
    return !!urlPattern.test(urlString);
}

export var createCustomId = () => Math.random().toString();

export type InteractionSendable = (content: string | MessagePayload | InteractionReplyOptions) => Promise<InteractionResponse | Message>;

export interface QuickButton {
    label: string;
    style: ButtonStyle;
}
