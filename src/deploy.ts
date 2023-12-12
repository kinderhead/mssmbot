import MSSM from "./mssm.js";

var bot = new MSSM();
(async () => {
    console.log(await bot.lichess.postGame(`[Event "?"]
[Site "?"]
[Date "????.??.??"]
[Round "?"]
[White "?"]
[Black "?"]
[Result "*"]

1. e3 d6 {<br /><br />Game may have continued...} (1... d6 2. d4 e5 3. Nc3 Nf6
4. dxe5 dxe5 5. Qxd8+ Kxd8 {+0.30}) *`));
})();
