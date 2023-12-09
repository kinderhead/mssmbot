import ts from "typescript";
import MSSM from "../bot.js";
import Loggable from "../lib/logutils.js";

export default abstract class DataMapper<TOriginal extends { id: string | number }> extends Loggable {
    public bot: MSSM;

    protected obj: TOriginal;

    protected timeSinceLastReload: Date;

    public constructor(bot: MSSM, data: TOriginal, registry: { [key: string | number]: DataMapper<TOriginal> }) {
        super();
        if (registry.hasOwnProperty(data.id)) {
            return registry[data.id];
        }
        
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
                    target.obj[prop as keyof typeof target.obj] = value;
                    target.set(prop as keyof typeof target.obj, value);
                } else {
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
        if (this.timeSinceLastReload.getTime() > Date.now() + (5 * 60000)) {
            this.timeSinceLastReload = new Date();
            this.log.debug("Refreshing object with id " + this.obj.id);
            await this.reload();
        }
    }

    protected fetchArrayFactory<T, TBase>(res: T[], data: TBase[], factory: new (bot: MSSM, data: TBase) => T) {
        res.length = 0;
        for (const i of data) {
            res.push(new factory(this.bot, i));
        }
    }
}
