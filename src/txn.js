#! /usr/bin/env -S deno run

import { Node } from "./node.js";
import { randomElement } from "./utils.js";

const node = new Node({ updated: Date.now(), keys: {} });

node.run({
  init: (_) => {
    if (node.peers.length) {
      setInterval(() => {
        node.send(randomElement(node.peers), {
          type: "gossip",
          state: node.state,
        });
      }, 100);
    }
  },
  txn: (msg) =>
    node.reply(msg, {
      type: "txn_ok",
      txn: msg.body.txn.map(([op, k, v]) => {
        switch (op) {
          case "r":
            v = node.state.keys[k];
            break;
          case "w":
            node.state.keys[k] = v;
            node.state.updated = Date.now();
            break;
        }
        return [op, k, v];
      }),
    }),
  gossip: (msg) => {
    // A simple last update wins strategy passes all the tests...
    if (msg.body.state.updated > node.state.updated) {
      node.state = msg.body.state;
    }
  },
});
