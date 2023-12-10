import ts from "typescript";
import MSSM from "../bot.js";
import Loggable from "../lib/logutils.js";

export default abstract class DataMapper<TOriginal extends { id: string | number }> extends Loggable {
    public bot: MSSM;

    protected obj: TOriginal;

    protected timeSinceLastReload: Date;

    public constructor(bot: MSSM, data: TOriginal, registry: { [key: string | number]: DataMapper<TOriginal> }) {
        if (registry.hasOwnProperty(data.id)) {
            throw new Error("This object already exists, and this makes me sad :(");
        }

        super();
        
        this.bot = bot;
        this.obj = data;

        this.timeSinceLastReload = new Date();

        var proxy = new Proxy(this, {
            get(target, prop) {
                target.checkForRefresh();
                if (target.obj.hasOwnProperty(prop)) {
                    return target.obj[prop as keyof typeof target.obj];
                }
                return target[prop as keyof typeof target];
            },
            set(target, prop, value) {
                if (target.obj.hasOwnProperty(prop)) {
                    if (value == undefined) throw new Error("Tried to set value to undefined");

                    target.obj[prop as keyof typeof target.obj] = value;
                    target.set(prop as keyof typeof target.obj, value);
                } else {
                    if (value == undefined) console.trace(prop, value);
                    target[prop as keyof typeof target] = value;
                }
                return true;
            }
        });

        registry[data.id] = proxy;

        return proxy;
    }

    public abstract refresh(): Promise<void>;
    public abstract reload(): Promise<void>;
    protected abstract set<TKey extends keyof TOriginal>(name: TKey, value: TOriginal[TKey]): void;

    protected async checkForRefresh() {
        if (Date.now() > this.timeSinceLastReload.getTime() + (5 * 60000)) {
            this.timeSinceLastReload = new Date();
            this.log.debug("Refreshing a " + this.constructor.name + " with id " + this.obj.id);
            await this.reload();
        }
    }

    protected fetchArrayFactory<T, TBase extends { id: string | number }>(data: TBase[], factory: new (bot: MSSM, data: TBase) => T, registry: { [key: string | number]: T }) {
        var res: T[] = [];
        for (const i of data) {
            if (registry.hasOwnProperty(i.id)) res.push(registry[i.id])
            else res.push(new factory(this.bot, i));
        }
        return res;
    }

    protected fetchFactory<T, TBase extends { id: string | number }>(data: TBase, factory: new (bot: MSSM, data: TBase) => T, registry: { [key: string | number]: T }) {
        if (registry.hasOwnProperty(data.id)) return registry[data.id];
        else return new factory(this.bot, data);
    }
}
