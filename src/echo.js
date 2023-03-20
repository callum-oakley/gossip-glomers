#! /usr/bin/env -S deno run
import { Node } from "./node.js";

const node = new Node();

node.run({
  echo: (msg) => node.reply(msg, { type: "echo_ok", echo: msg.body.echo }),
});
