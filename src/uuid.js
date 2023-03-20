#! /usr/bin/env -S deno run
import { Node } from "./node.js";

const node = new Node();

node.run({
  generate: (msg) =>
    node.reply(msg, { type: "generate_ok", id: crypto.randomUUID() }),
});
