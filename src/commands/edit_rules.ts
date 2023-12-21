import { Command, createCustomId, embedPager } from "botinator";
import { ButtonBuilder, ButtonInteraction, ButtonStyle, CacheType, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import MSSMUser from "../data/user.js";
import MSSM from "../mssm.js";
import { embedBuilder } from "../lib/utils.js";

export default class EditRulesCommand extends Command<MSSMUser, MSSM> {
    public getName() { return "edit-rules"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Edit the rules")
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>) {
        var newButtonId = createCustomId();
        var selectButtonId = createCustomId();

        var page = -1;
        var int: ButtonInteraction;

        await embedPager(this.bot.memory.rulesmessages.map(i => EmbedBuilder.from(i)), msg.reply.bind(msg), true, "Pick a rule section to edit or create a new one. Message me if you want to reorder them. Problems may occur if more than one person is editing these at a time.", [
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
            page = this.bot.memory.rulesmessages.push(embed.data) - 1;
        } else {
            embed = EmbedBuilder.from(this.bot.memory.rulesmessages[page]);
        }

        await embedBuilder(this.bot.getUser(msg), int.reply.bind(int), this.bot, embed, async i => {
            i.author = null;
            this.bot.memory.rulesmessages[page] = i;
            await this.bot.sendRules();
        });
    }
}
