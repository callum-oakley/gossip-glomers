#! /usr/bin/env -S deno run

// Maintain a map from node ID to an array of the messages originally broadcast
// to that node. When distributing messages, also send the index of the message
// in this array; if this doesn't match what the recipient has locally, they
// know they've missed a message and the update can be discarded. To recover
// from missed messages periodically send a sync request asking for every
// message since the last one we saw (if any).
//
// This strategy doesn't re-send any messages unnecessarily, and results in:
//
//   - messages per operation: ~13
//   - median latency: ~75ms
//   - maximum latency: ~100ms

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
  topology: (msg) => node.reply(msg, { type: "topology_ok" }),
  broadcast: (msg) => {
    state[node.id].push(msg.body.message);
    for (const peer of node.peers) {
      node.send(peer, {
        type: "update",
        messages: [msg.body.message],
        index: state[node.id].length - 1,
      });
    }
    node.reply(msg, { type: "broadcast_ok" });
  },
  update: (msg) => {
    if (msg.body.index === state[msg.src].length) {
      state[msg.src].push(...msg.body.messages);
    }
  },
  read: (msg) =>
    node.reply(msg, {
      type: "read_ok",
      messages: [...new Set(Object.values(state).flat())],
    }),
  sync: (msg) => {
    if (msg.body.index < state[node.id].length) {
      node.send(msg.src, {
        type: "update",
        messages: state[node.id].slice(msg.body.index),
        index: msg.body.index,
      });
    }
  },
});
