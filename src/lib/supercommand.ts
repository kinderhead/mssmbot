import { CacheType, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder, SlashCommandSubcommandBuilder } from "discord.js";
import "reflect-metadata";
import Command from "../command.js";
import MSSMUser from "../data/user.js";
import { getFunctionArgs } from "./utils.js";
import MSSM from "../bot.js";

export interface SuperCommandArg {
    index: number;
    name: string;
    description: string;
    required: boolean;
    type: any;
}

export interface SuperCommandRoute {
    name: string;
    description: string;
    args: SuperCommandArg[];
    func: Function;
}

const argsKey = Symbol("args");
export function param(description: string, required: boolean = true) {
    return (target: any, propertyKey: string | symbol, parameterIndex: number) => {
        var argData: SuperCommandArg[] = Reflect.getOwnMetadata(argsKey, target, propertyKey) || [];
        const args = getFunctionArgs(target[propertyKey] as Function);
        argData.push({ index: parameterIndex, description, required, name: args[parameterIndex], type: Reflect.getMetadata("design:paramtypes", target, propertyKey)[parameterIndex] });
        Reflect.defineMetadata(argsKey, argData, target, propertyKey);
    };
}

const routeKey = Symbol("routes")
export function cmd<T extends Function>(description: string) {
    return (target: SuperCommand, propertyName: string, descriptor: TypedPropertyDescriptor<T>) => {
        var method = descriptor.value!;

        var argData: SuperCommandArg[] = Reflect.getOwnMetadata(argsKey, target, propertyName) || [];

        if (argData.length + 1 != getFunctionArgs((target as any)[propertyName] as Function).length) throw new Error(`Command route for ${target.constructor.name} has mismatching number of arguments`);
        argData.reverse();
        var routes: SuperCommandRoute[] = Reflect.getOwnMetadata(routeKey, target) || [];
        routes.push({ args: argData, func: method, name: propertyName, description });
        Reflect.defineMetadata(routeKey, routes, target);

        // @ts-expect-error
        descriptor.value = function () {
            return method.apply(this, arguments);
        }
    }
}

export default abstract class SuperCommand extends Command {
    private cmdBuilder: SlashCommandBuilder;

    public routes: SuperCommandRoute[] = [];

    public abstract get description(): string;
    public abstract get modOnly(): boolean;

    constructor(bot: MSSM) {
        super(bot);
        this.routes = Reflect.getMetadata(routeKey, this) || []
    }

    public createRoute<T extends SlashCommandBuilder | SlashCommandSubcommandBuilder>(cmd: T, route: SuperCommandRoute) {
        for (const i of route.args) {
            if (i.type === String) {
                cmd.addStringOption(opt => opt.setName(i.name).setDescription(i.description).setRequired(i.required));
            } else if (i.type === MSSMUser) {
                cmd.addUserOption(opt => opt.setName(i.name).setDescription(i.description).setRequired(i.required));
            }
        }
        return cmd;
    }

    public create() {
        if (this.cmdBuilder === undefined) {
            this.cmdBuilder = new SlashCommandBuilder()
                .setName(this.getName())
                .setDescription(this.description);

            for (const i of this.routes) {
                if (i.name === "default") {
                    this.createRoute(this.cmdBuilder, i);
                } else {
                    this.cmdBuilder.addSubcommand(cmd => {
                        cmd.setName(i.name);
                        cmd.setDescription(i.description);
                        return this.createRoute(cmd, i);
                    });
                }
            }

            if (this.modOnly) this.cmdBuilder.setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers);
        }

        return this.cmdBuilder;
    }

    public async execute(msg: ChatInputCommandInteraction<CacheType>) {
        var subcmd = msg.options.getSubcommand(false) || "default";

        const route = this.routes.find(i => i.name === subcmd);
        if (route) {
            await route.func.call(this, msg, ...this.processArgs(msg, route.args));
        }
    }

    private processArgs(msg: ChatInputCommandInteraction<CacheType>, args: SuperCommandArg[]) {
        var out: any[] = [];

        for (const i of args) {
            if (i.type === String) {
                out.push(msg.options.getString(i.name));
            } else if (i.type === MSSMUser) {
                out.push(this.bot.getUserV2(msg.options.getUser(i.name).id));
            }
        }

        return out;
    }
}
