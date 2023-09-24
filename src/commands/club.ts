import { AutocompleteInteraction, CacheType, ChatInputCommandInteraction, EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder, channelMention } from "discord.js";
import MSSM from "../bot.js";
import Command from "../command.js";
import { settingsHelper } from "../lib/utils.js";

export default class ClubCommand extends Command {
    public getName() { return "clubs"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Join and manage clubs")
            .addSubcommand(sbc => sbc
                .setName("join")
                .setDescription("Join a club")
                .addStringOption(opt => opt.setName("club").setDescription("Club to join").setRequired(true).setAutocomplete(true))
            )
            .addSubcommand(sbc => sbc
                .setName("leave")
                .setDescription("Leave a club")
                .addStringOption(opt => opt.setName("club").setDescription("Club to leave").setRequired(true).setAutocomplete(true))
            )
            .addSubcommand(sbc => sbc
                .setName("view")
                .setDescription("View club information")
                .addStringOption(opt => opt.setName("club").setDescription("Club to check").setRequired(true).setAutocomplete(true))
            )
            .addSubcommand(sbc => sbc
                .setName("manage")
                .setDescription("Manage a club")
                .addStringOption(opt => opt.setName("club").setDescription("Club to manage").setRequired(true).setAutocomplete(true))
            );
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        if (msg.options.getSubcommand() === "join") {
            await this.join(msg, bot);
        } else if (msg.options.getSubcommand() === "leave") {
            await this.leave(msg, bot);
        } else if (msg.options.getSubcommand() === "view") {
            await this.view(msg, bot);
        } else if (msg.options.getSubcommand() === "manage") {
            await this.manage(msg, bot);
        }
    }

    public async join(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        await msg.deferReply({ ephemeral: true });
        var club = await bot.db.clubData.findFirst({ where: { name: msg.options.getString("club") } });

        if (!club) {
            await msg.editReply("Club not found");
            return;
        }

        var role = bot.getRole(club.role);

        if (role.members.has(msg.user.id)) {
            await msg.editReply("Already joined club");
            return;
        }

        var user = bot.getUser(msg);
        await user.roles.add(role);

        var channel = bot.getChannel(club.channel);
        await channel.send(`${user.displayName} has joined!`);
        await msg.editReply(`Joined club! Check out their channel: ${channelMention(channel.id)}`);

        this.log.info(`${user.displayName} has joined ${club.name}`);
    }

    public async leave(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        await msg.deferReply({ ephemeral: true });
        var club = await bot.db.clubData.findFirst({ where: { name: msg.options.getString("club") } });

        if (!club) {
            await msg.editReply("Club not found");
            return;
        }

        var role = bot.getRole(club.role);

        if (!role.members.has(msg.user.id)) {
            await msg.editReply("Not in club");
            return;
        }

        var user = bot.getUser(msg);
        await user.roles.remove(role);

        var channel = bot.getChannel(club.channel);
        await channel.send(`${user.displayName} has left.`);
        await msg.editReply(`Left club :(`);

        this.log.info(`${user.displayName} has left ${club.name}`);
    }

    public async view(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        await msg.deferReply();
        var club = await bot.db.clubData.findFirst({ where: { name: msg.options.getString("club") } });

        if (!club) {
            await msg.editReply("Club not found");
            return;
        }

        await msg.editReply({ embeds: [bot.clubs.getClubEmbed(club)] });
    }

    public async manage(msg: ChatInputCommandInteraction<CacheType>, bot: MSSM) {
        await msg.deferReply({ ephemeral: true });
        var club = await bot.db.clubData.findFirst({ where: { name: msg.options.getString("club") } });

        if (!club) {
            await msg.editReply("Club not found");
            return;
        }

        var user = bot.getUser(msg);

        if (club.managerId !== user.id && !user.permissions.has(PermissionFlagsBits.ModerateMembers)) {
            await msg.editReply("Unable to manage club");
            return;
        }

        await settingsHelper(user, msg.editReply.bind(msg), bot, new EmbedBuilder().setTitle("Club Settings"), [
            { default: club.desc, name: "Description", desc: "", on_change: i => { club.desc = i } },
            { default: club.meetingTime ?? "TBD", name: "Meeting time", desc: "", on_change: (i: string) => { club.meetingTime = i } },
            { default: club.meetingLocation ?? "TBD", name: "Meeting location", desc: "", on_change: (i: string) => { club.meetingLocation = i } },
        ], false);

        await bot.db.clubData.update({ where: { id: club.id }, data: club });
        await bot.clubs.refreshClubs();
    }

    public async autocomplete(cmd: AutocompleteInteraction<CacheType>, bot: MSSM): Promise<void> {
        const focusedValue = cmd.options.getFocused();
        const choices = bot.clubs.clubs;
        const filtered = choices.filter(choice => choice.startsWith(focusedValue));

        await cmd.respond(
            filtered.map(choice => ({ name: choice, value: choice })),
        );
    }
}
