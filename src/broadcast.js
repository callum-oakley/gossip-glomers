#! /usr/bin/env -S deno run

// Results for parts d and e:
//
//   - messages per operation: ~19
//   - median latency: ~300ms
//   - maximum latency: ~500ms

import { Node } from "./node.js";
import { randomElement } from "./utils.js";

const node = new Node(new Set());

node.run({
  init: (_) => {
    if (node.peers.length == 0) {
      return;
    }
    setTimeout(
      () =>
        setInterval(() => {
          node.send(randomElement(node.peers), {
            type: "gossip",
            state: [...node.state],
          });
        }, 20),
      100
    );
  },
  topology: (msg) => node.reply(msg, { type: "topology_ok" }),
  broadcast: (msg) => {
    node.state.add(msg.body.message);
    node.reply(msg, { type: "broadcast_ok" });
  },
  read: (msg) =>
    node.reply(msg, {
      type: "read_ok",
      messages: [...node.state],
    }),
  gossip: (msg) => {
    for (const message of msg.body.state) {
      node.state.add(message);
    }
  },
});
