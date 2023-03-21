#! /usr/bin/env -S deno run

// If you ignore the seq-kv service and maintain a map from node ID to the last
// known value on that node, this feels like an easier version of the last
// problem? What do we gain by moving that state out of memory and in to the
// key-value store?

import { Node } from "./node.js";

const state = {};

const node = new Node();

function updatePeers() {
  for (const peer of node.peers) {
    node.send(peer, { type: "update", value: state[node.id] });
  }
}

node.run({
  init: (_) => {
    for (const id of [node.id, ...node.peers]) {
      state[id] = 0;
    }
    setInterval(updatePeers, 10000);
  },
  add: (msg) => {
    state[node.id] += msg.body.delta;
    updatePeers();
    node.reply(msg, { type: "add_ok" });
  },
  update: (msg) => {
    state[msg.src] = msg.body.value;
  },
  read: (msg) =>
    node.reply(msg, {
      type: "read_ok",
      value: Object.values(state).reduce((x, y) => x + y),
    }),
});
