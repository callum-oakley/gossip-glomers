#! /usr/bin/env -S deno run

import { Node } from "./node.js";
import { randomElement } from "./utils.js";

const node = new Node({});

function shard(key) {
  // Exploit the fact that keys are always (stringy) integers
  return node.nodes[parseInt(key) % node.nodes.length];
}

node.run({
  init: (_) => {
    if (node.peers.length) {
      setInterval(async () => {
        const state = {};
        for (const key in node.state) {
          state[key] = {
            offset: node.state[key].offset,
            committed: node.state[key].committed,
          };
        }
        const res = await node.request(randomElement(node.peers), {
          type: "gossip",
          state,
        });
        for (const key in res.body.state) {
          if (!node.state[key]) {
            node.state[key] = { msgs: [], offset: 0, committed: 0 };
          }
          for (const msg of res.body.state[key].msgs) {
            if (msg[0] === node.state[key].offset) {
              node.state[key].offset++;
              node.state[key].msgs.push(msg);
            }
          }
          node.state[key].committed = Math.max(
            node.state[key].committed,
            res.body.state[key].committed
          );
        }
      }, 100);
    }
  },
  send: async (msg) => {
    const owner = shard(msg.body.key);
    if (owner === node.id) {
      if (!node.state[msg.body.key]) {
        node.state[msg.body.key] = { msgs: [], offset: 0, committed: 0 };
      }
      const offset = node.state[msg.body.key].offset;
      node.state[msg.body.key].offset++;
      node.state[msg.body.key].msgs.push([offset, msg.body.msg]);
      node.reply(msg, { type: "send_ok", offset });
    } else {
      const res = await node.request(owner, msg.body);
      node.reply(msg, res.body);
    }
  },
  poll: (msg) => {
    const msgs = {};
    for (const key in msg.body.offsets) {
      if (node.state[key]) {
        msgs[key] = node.state[key].msgs.slice(msg.body.offsets[key]);
      }
    }
    node.reply(msg, { type: "poll_ok", msgs });
  },
  commit_offsets: (msg) => {
    for (const key in msg.body.offsets) {
      node.state[key].committed = msg.body.offsets[key];
    }
    node.reply(msg, { type: "commit_offsets_ok" });
  },
  list_committed_offsets: (msg) => {
    const offsets = {};
    for (const key of msg.body.keys) {
      if (node.state[key]) {
        offsets[key] = node.state[key].committed;
      }
    }
    node.reply(msg, { type: "list_committed_offsets_ok", offsets });
  },
  gossip: (msg) => {
    const state = {};
    for (const key in node.state) {
      const msgs = node.state[key].msgs.slice(msg.body.state[key]?.offset ?? 0);
      const committed = node.state[key].committed;
      if (
        !msg.body.state[key] ||
        committed > msg.body.state[key].committed ||
        msgs.length > 0
      ) {
        state[key] = { msgs, committed };
      }
    }
    node.reply(msg, { type: "gossip_ok", state });
  },
});
