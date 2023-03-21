#! /usr/bin/env -S deno run

import { Node } from "./node.js";

const node = new Node();

node.run({
  init: (_) =>
    node.request("seq-kv", {
      type: "write",
      key: "counter",
      value: { version: 0, count: 0 },
    }),
  add: async (msg) => {
    while (true) {
      try {
        const res = await node.request("seq-kv", {
          type: "read",
          key: "counter",
        });
        await node.request("seq-kv", {
          type: "cas",
          key: "counter",
          from: res.body.value,
          to: {
            version: res.body.value.version + 1,
            count: res.body.value.count + msg.body.delta,
          },
        });
        node.reply(msg, { type: "add_ok" });
        break;
      } catch (err) {
        if (err.body.code !== 22) {
          throw err;
        }
      }
    }
  },
  read: async (msg) => {
    const res = await node.request("seq-kv", { type: "read", key: "counter" });
    node.reply(msg, {
      type: "read_ok",
      value: res.body.value.count,
    });
  },
});
