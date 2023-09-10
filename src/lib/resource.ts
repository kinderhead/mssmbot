import { GuildMember, APIEmbed, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import MSSM from "../bot.js";
import { buttonHelper, createCustomId, embedBuilder, InteractionSendable, quickActionRow, quickModal } from "./utils.js";

export abstract class ResourceType<T, TOpts = {}> {
    public abstract get(user: GuildMember, msg: InteractionSendable, bot: MSSM, opts: TOpts): Promise<T>;
}

export class EmbedResource extends ResourceType<APIEmbed> {
    public async get(user: GuildMember, msg: InteractionSendable, bot: MSSM, opts: {}): Promise<APIEmbed> {
        var res: (value: void | PromiseLike<void>) => void;
        var promise = new Promise<void>(i => res = i);

        var embed: APIEmbed;
        embedBuilder(user, msg, bot, undefined, (i) => {
            embed = i;
            res();
        });

        await promise;
        return embed;
    }
}

export interface StringOpts {
    maxLength: number;
}

export class StringResource extends ResourceType<string, StringOpts> {
    public async get(user: GuildMember, msg: InteractionSendable, bot: MSSM, opts: StringOpts): Promise<string> {
        const embed = new EmbedBuilder()
            .setTitle("Create plain text")
            .setDescription("Due to discord being hard you have to press another button :(")
        
        const int = await buttonHelper(embed, [[{ label: "Press me or else", style: ButtonStyle.Success }, i => i]], msg, true);
        
        return await quickModal("Typing time", "Text:", "Type away", TextInputStyle.Paragraph, int, opts.maxLength);
    }
}
