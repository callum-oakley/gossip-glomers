#! /usr/bin/env -S deno run

import { Node } from "./node.js";

const state = {};

const node = new Node();

node.run({
  init: (_) => {
    for (const id of [node.id, ...node.peers]) {
      state[id] = [];
    }
    setInterval(() => {
      for (const peer of node.peers) {
        node.send(peer, { type: "sync", index: state[peer].length });
      }
    }, 10000);
  },
  add: (msg) => {
    state[node.id].push(msg.body.delta);
    for (const peer of node.peers) {
      node.send(peer, {
        type: "update",
        deltas: [msg.body.delta],
        index: state[node.id].length - 1,
      });
    }
    node.reply(msg, { type: "add_ok" });
  },
  update: (msg) => {
    if (msg.body.index === state[msg.src].length) {
      state[msg.src].push(...msg.body.deltas);
    }
  },
  read: (msg) =>
    node.reply(msg, {
      type: "read_ok",
      value: Object.values(state).flat().reduce((x, y) => x + y, 0),
    }),
  sync: (msg) => {
    if (msg.body.index < state[node.id].length) {
      node.send(msg.src, {
        type: "update",
        deltas: state[node.id].slice(msg.body.index),
        index: msg.body.index,
      });
    }
  },
});
