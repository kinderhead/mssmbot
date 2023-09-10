import { ButtonBuilder, ButtonInteraction, ButtonStyle, CacheType, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import MSSM from "../bot.js";
import Command from "../command.js";
import { createCustomId, embedBuilder, embedPager } from "../lib/utils.js";

export default class EditRulesCommand extends Command {
    public getName() { return "edit-rules"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Edit the rules")
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        var newButtonId = createCustomId();
        var selectButtonId = createCustomId();

        var page = -1;
        var int: ButtonInteraction;

        await embedPager(bot.memory.rulesmessages.map(i => EmbedBuilder.from(i)), msg.reply.bind(msg), true, "Pick a rule section to edit or create a new one. Message me if you want to reorder them. Problems may occur if more than one person is editing these at a time.", [
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
            }
        );

        var embed: EmbedBuilder;
        if (page == -1) {
            embed = new EmbedBuilder().setTitle("Rule section title").setDescription("Generic rule or information which encapsulates the whole section");
            page = bot.memory.rulesmessages.push(embed.data) - 1;
        } else {
            embed = EmbedBuilder.from(bot.memory.rulesmessages[page]);
        }

        await embedBuilder(bot.getUser(msg), int.reply.bind(int), bot, embed, async i => {
            i.author = null;
            bot.memory.rulesmessages[page] = i;
            await bot.sendRules();
        });
    }
}
