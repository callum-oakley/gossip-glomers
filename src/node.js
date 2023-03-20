import { TextLineStream } from "https://deno.land/std@0.180.0/streams/text_line_stream.ts";

export class Node {
  constructor() {
    this.lines = Deno.stdin.readable
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream());
  }

  send(dest, body) {
    const s = JSON.stringify({ src: this.id, dest, body });
    console.error("OUT", s);
    console.log(s);
  }

  reply(msg, body) {
    this.send(msg.src, { ...body, in_reply_to: msg.body.msg_id });
  }

  async run(handlers) {
    for await (const line of this.lines) {
      console.error("IN", line);
      const msg = JSON.parse(line);
      if (msg.body.type === "init") {
        this.id = msg.body.node_id;
        this.peers = msg.body.node_ids.filter((id) => id !== this.id);
        if (handlers.init) {
          handlers.init(msg);
        }
        this.reply(msg, { type: "init_ok" });
      } else if (handlers[msg.body.type]) {
        handlers[msg.body.type](msg);
      } else {
        throw Error(`Unexpected message type ${msg.body.type}`);
      }
    }
  }
}
