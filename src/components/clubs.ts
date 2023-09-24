import { ClubData } from "@prisma/client";
import { EmbedBuilder, channelMention } from "discord.js";
import ClubCommand from "../commands/club.js";
import CreateClubCommand from "../commands/create_club.js";
import Component from "../lib/component.js";
import SetClubsCommand from "../commands/set_clubs.js";

export default class Clubs extends Component {
    public clubs: string[] = [];

    public async init() {
        this.bot.registerCommand(new ClubCommand());
        this.bot.registerCommand(new CreateClubCommand());
        this.bot.registerCommand(new SetClubsCommand());

        await this.refreshClubs();
    }

    public getClubEmbed(club: ClubData) {
        const role = this.bot.getRole(club.role);
        return new EmbedBuilder()
            .setTitle(club.name)
            .setDescription(`${club.desc}\n\nMember count: ${role.members.size}\nClub channel: ${channelMention(club.channel)} (join to view)`)
            .setColor(role.color)
            .addFields(
                { name: "Time", value: club.meetingTime ?? "TBD", inline: true },
                { name: "Location", value: club.meetingLocation ?? "TBD", inline: true }
            );
    }

    public async refreshClubs() {
        this.log.info("Refreshing club names for autocomplete");
        var data = await this.bot.db.clubData.findMany();
        
        this.clubs = [];
        for (const i of data) {
            this.clubs.push(i.name);

            if (this.bot.memory.clubchannelid === "") continue;

            if (i.infomsg === "") {
                var msg = await this.bot.getChannel(this.bot.memory.clubchannelid).send({ embeds: [this.getClubEmbed(i)] });
                await this.bot.db.clubData.update({ where: { id: i.id }, data: { infomsg: msg.id } });
            } else {
                (await this.bot.getChannel(this.bot.memory.clubchannelid).messages.fetch(i.infomsg)).edit(({ embeds: [this.getClubEmbed(i)] }));
            }
        }
    }
}