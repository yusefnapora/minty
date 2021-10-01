// TODO: MOVE TO @onflow/util-batch
const { spawn, send, INIT } = require("@onflow/util-actor");
const { uid } = require("@onflow/util-uid");

const TICK = 500;
const BUFFER_SIZE = 10;

const SET_CALLBACK = "SET_CALLBACK";
const PROCESS = "PROCESS";
const MAYBE_PROCESS = "MAYBE_PROCESS";
const TIMEOUT = "TIMEOUT";
const ENQUEUE = "ENQUEUE";
const RESOLVE = "RESOLVE";

const HANDLERS = {
  [INIT]: (ctx) => {
    ctx.put("need", new Set());
    ctx.put("processing", new Set());
    ctx.put("hold", {});
    setInterval(() => ctx.sendSelf(TIMEOUT), TICK);
  },

  [SET_CALLBACK]: (ctx, letter, callback) => {
    ctx.put("callback", async (...args) => callback(...args));
    ctx.sendSelf(MAYBE_PROCESS);
  },

  [ENQUEUE]: (ctx, letter, args) => {
    const id = uid();
    const hold = { id, args, reply: letter.reply };
    ctx.update("need", (n) => {
      n.add(id);
      return n;
    });
    ctx.update("hold", (h) => ({ ...h, [id]: hold }));
    ctx.sendSelf(MAYBE_PROCESS);
  },

  [TIMEOUT]: (ctx) => {
    if (ctx.get("need").size) ctx.sendSelf(PROCESS);
  },

  [MAYBE_PROCESS]: (ctx) => {
    if (ctx.get("need") >= BUFFER_SIZE) ctx.sendSelf(PROCESS);
  },

  [PROCESS]: (ctx) => {
    const callback = ctx.get("callback");
    if (typeof callback !== "function") return;

    const need = ctx.get("need");
    ctx.update("processing", (p) => new Set([...p, ...need]));
    ctx.put("need", new Set());

    const hold = ctx.get("hold");
    const payload = [...need].reduce(
      (acc, key) => ({ ...acc, [key]: hold[key].args }),
      {}
    );

    callback(payload).then((result) => {
      ctx.sendSelf(RESOLVE, result);
    });
  },
  [RESOLVE]: (ctx, _, results) => {
    const have = Object.keys(results);
    for (let h of have) {
      const hold = ctx.get("hold");
      hold[h].reply(results[h]);
      ctx.update("processing", (p) => {
        p.delete(h);
        return p;
      });
      ctx.update("hold", (hold) => {
        delete hold[h];
        return hold;
      });
    }
  }
};

const batch = (name, callback) => {
  spawn(HANDLERS, name);
  send(name, SET_CALLBACK, callback);

  return {
    enqueue(...args) {
      return send(name, ENQUEUE, args, { expectReply: true, timeout: 0 });
    }
  };
};

module.exports = batch;
