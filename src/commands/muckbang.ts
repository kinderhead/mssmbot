import { AutocompleteInteraction, ButtonInteraction, ButtonStyle, CacheType, ChatInputCommandInteraction, EmbedBuilder, GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel, GuildVoiceChannelResolvable, PermissionFlagsBits, SlashCommandBuilder, VoiceBasedChannel, channelMention, hideLinkEmbed, time } from "discord.js";
import MSSM, { choose } from "../bot.js";
import Command from "../command.js";
import { autocompleteOptions, buttonHelper, expandAndHandleEmbed, getNextDayOfWeek, getValuesFromObject } from "../lib/utils.js";
import MSSMUser from "../data/user.js";
import MuckbangGame from "../data/muckbang_game.js";

export default class MuckbangCommand extends Command {
    public getName() { return "muckbang"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Muckbang related commands")
            .addSubcommand(sbc => sbc
                .setName("add")
                .setDescription("Adds a game to the rotation (MOD ONLY)")
                .addStringOption(opt => opt.setName("name").setDescription("Name").setRequired(true))
                .addStringOption(opt => opt.setName("download").setDescription("download").setRequired(true))
                .addStringOption(opt => opt.setName("image").setDescription("Image").setRequired(true))
            )
            .addSubcommand(sbc => sbc
                .setName("list")
                .setDescription("List all games in rotation")
            )
            .addSubcommand(sbc => sbc
                .setName("select")
                .setDescription("Select a game (MOD ONLY)")
                .addStringOption(opt => opt.setName("game").setDescription("Force a game").setRequired(false).setAutocomplete(true))
                .addStringOption(opt => opt.setName("time").setDescription("Time to game").setRequired(false).setChoices(
                    { name: "1:30", value: "0" },
                    { name: "6:00", value: "1" }
                ))
            );
    }

    public async autocomplete(cmd: AutocompleteInteraction<CacheType>, bot: MSSM) {
        await autocompleteOptions(cmd, getValuesFromObject(bot.muckbang.games).map(i => i.name));
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM, user: MSSMUser) {
        // Pleb commands
        if (msg.options.getSubcommand() === "list") {
            await this.list(msg, bot);
            return;
        }

        if (!user.discord.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            await msg.reply("Nuh uh");
            this.log.info(`${user.discord.displayName} tried to run a mod command. smh`)
        }

        // Mod commands
        if (msg.options.getSubcommand() === "add") {
            await this.add(msg, bot);
        } else if (msg.options.getSubcommand() === "select") {
            await this.select(msg, bot);
        }
    }

    public async list(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        await msg.deferReply();

        var embed = new EmbedBuilder().setTitle("The Grand Muckbang \"Rotation\"").setColor("Green");
        var games = getValuesFromObject(bot.muckbang.games);

        await expandAndHandleEmbed(embed, games.map(i => { return { name: i.name, value: `[Download](${i.downloadLink})`, inline: true }; }), 25, msg.editReply.bind(msg));
    }

    public async add(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        await msg.deferReply({ ephemeral: true });

        var game = await MuckbangGame.create(bot, msg.options.getString("name"), msg.options.getString("download"), msg.options.getString("image"));

        await bot.muckbang.channel.send({ content: "New game added to rotation", embeds: [bot.muckbang.getGameEmbed(game)] });
        this.log.info(`Added ${game.name} to muckbang`);

        await msg.editReply("Done");
    }

    public async select(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        await msg.deferReply({ ephemeral: true });

        var gameName = msg.options.getString("game");

        if (!gameName) {
            gameName = choose(Object.keys(bot.muckbang.games));
        }

        var game = getValuesFromObject(bot.muckbang.games).find(i => i.name === gameName);
        if (!game) {
            await msg.editReply("Invalid game");
        }

        var timeIndex = msg.options.getString("time") ?? "1";
        var date = getNextDayOfWeek(new Date(), 6);
        
        if (timeIndex === "0") {
            date.setHours(13, 30, 0, 0);
        } else {
            date.setHours(18, 0, 0, 0);
        }

        var embed = bot.muckbang.getGameEmbed(game);
        embed.setDescription(`Play this game at ${time(date)}?\n\n${embed.data.description}`);

        if (await buttonHelper(embed, [[{ label: "Confirm", style: ButtonStyle.Primary }, msg => { msg.update({ content: "Done", embeds: [], components: [] }); return true }], [{ label: "Cancel", style: ButtonStyle.Secondary }, msg => { msg.update({ content: "Done", embeds: [], components: [] }); return false }]], msg.editReply.bind(msg), true)) {
            this.log.info(`Next muckbang game: ${gameName}`);

            embed = bot.muckbang.getGameEmbed(game);
            embed.setTitle("Next game: " + gameName);
            embed.setTimestamp(date);

            var event = await msg.guild.scheduledEvents.create({
                entityType: GuildScheduledEventEntityType.Voice,
                name: `Muckbang: ${gameName}`,
                privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
                channel: bot.getChannel<VoiceBasedChannel>("760655658051174461"),
                description: `${channelMention(bot.muckbang.channel.id)}`,
                image: game.imageLink,
                reason: "Gaming",
                scheduledStartTime: date
            });

            embed.setDescription(`Event link: ${event.url}\n\n${embed.data.description}`);

            bot.muckbang.channel.send({ embeds: [embed] });
        }
    }
}
