import { Command } from "botinator";
import { createObjectCsvWriter } from "csv-writer";
import { CacheType, ChatInputCommandInteraction, Message, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import MSSMUser from "../data/user.js";
import MSSM from "../mssm.js";

export default class SyscallCommand extends Command<MSSMUser, MSSM> {
    public getName() { return "syscall"; }

    public create() {
        return new SlashCommandBuilder()
            .setName(this.getName())
            .setDescription("Run a system command. Pls don't run this if you don't know what you're doing.")
            .addStringOption(arg => arg.setName("cmd").setDescription("cmd").setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>) {
        await msg.deferReply();

        if (msg.options.getString("cmd") === "msg-count") {
            await this.msgCount(msg);
        }

        await msg.editReply("Done");
    }

    public async msgCount(msg: ChatInputCommandInteraction<CacheType>) {
        var msgs: Message[] = [];

        var last = (await this.bot.levelChannel.messages.fetch({ limit: 1 })).first().id;
        for (let set = 1; set <= 5; set++) {
            msgs.push(...(await this.bot.levelChannel.messages.fetch({ limit: 100, before: last })).values());
            last = msgs[msgs.length - 1].id;
        }

        var regex = /(?<=There were )([0-9]+)(?= messages yesterday)+/g;
        msgs = msgs.filter(i => i.author.bot && i.content.match(regex) !== null);

        const csv = createObjectCsvWriter({ path: "msg-count.csv", header: [{ id: "date", title: "Date" }, { id: "count", title: "Count" }] });

        await csv.writeRecords(msgs.map(i => { return { date: i.createdAt.toISOString(), count: i.content.match(regex)[0] } }));
    }
}
