#! /usr/bin/env -S deno run

import { Node } from "./node.js";
import { randomElement } from "./utils.js";

const node = new Node({});

node.run({
  init: (_) => {
    for (const id of node.nodes) {
      node.state[id] = 0;
    }
    setInterval(() => {
      node.send(randomElement(node.peers), {
        type: "gossip",
        state: node.state,
      });
    }, 100);
  },
  add: (msg) => {
    node.state[node.id] += msg.body.delta;
    node.reply(msg, { type: "add_ok" });
  },
  read: (msg) =>
    node.reply(msg, {
      type: "read_ok",
      value: Object.values(node.state).reduce((x, y) => x + y),
    }),
  gossip: (msg) => {
    for (const id of Object.keys(node.state)) {
      node.state[id] = Math.max(node.state[id], msg.body.state[id]);
    }
  },
});
