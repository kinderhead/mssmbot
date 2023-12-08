import { ClubData } from "@prisma/client";
import { EmbedBuilder, channelMention } from "discord.js";
import ClubCommand from "../commands/club.js";
import CreateClubCommand from "../commands/create_club.js";
import Component from "../lib/component.js";
import SetClubsCommand from "../commands/set_clubs.js";
import Club from "../data/club.js";
import { getValuesFromObject } from "../lib/utils.js";

export default class Clubs extends Component {
    public clubs: string[] = [];
    public clubData: { [id: number]: Club } = {};

    public async init() {
        this.bot.registerCommand(new ClubCommand());
        this.bot.registerCommand(new CreateClubCommand());
        this.bot.registerCommand(new SetClubsCommand());
    }

    public getClubEmbed(club: Club) {
        const role = this.bot.getRole(club.role);
        return new EmbedBuilder()
            .setTitle(club.name)
            .setDescription(`${club.desc}\n\nMember count: ${role.members.size}\nJoin to view club channel: ${channelMention(club.channel)}`)
            .setColor(role.color)
            .addFields(
                { name: "Time", value: club.meetingTime ?? "TBD", inline: true },
                { name: "Location", value: club.meetingLocation ?? "TBD", inline: true }
            );
    }

    public async refreshClubs() {
        this.log.info("Refreshing club names for autocomplete");
        var data = getValuesFromObject(this.clubData);
        
        this.clubs = [];
        for (const i of data) {
            this.clubs.push(i.name);

            if (this.bot.memory.clubchannelid === "") continue;

            if (i.infomsg === "") {
                var msg = await this.bot.getChannel(this.bot.memory.clubchannelid).send({ embeds: [this.getClubEmbed(i)] });
                i.infomsg = msg.id;
            } else {
                (await this.bot.getChannel(this.bot.memory.clubchannelid).messages.fetch(i.infomsg)).edit(({ embeds: [this.getClubEmbed(i)] }));
            }
        }
    }

    public async refreshDatamaps() {
        for (const i in this.clubData) {
            await this.clubData[i].refresh();
        }

        await this.refreshClubs();
    }
}