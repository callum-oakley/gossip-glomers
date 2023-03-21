import { TextLineStream } from "https://deno.land/std@0.180.0/streams/text_line_stream.ts";

export class Node {
  constructor(state) {
    this.lines = Deno.stdin.readable
      .pipeThrough(new TextDecoderStream())
      .pipeThrough(new TextLineStream());
    this.pending = {};
    this.state = state;
  }

  send(dest, body) {
    const s = JSON.stringify({ src: this.id, dest, body });
    console.error(new Date(), "OUT", s);
    console.log(s);
  }

  reply(msg, body) {
    this.send(msg.src, { ...body, in_reply_to: msg.body.msg_id });
  }

  request(dest, body) {
    const msgID = crypto.randomUUID();
    this.send(dest, { ...body, msg_id: msgID });
    return new Promise((resolve, reject) => {
      this.pending[msgID] = { resolve, reject };
    });
  }

  async run(handlers) {
    for await (const line of this.lines) {
      console.error(new Date(), "IN", line);
      const msg = JSON.parse(line);
      if (msg.body.type === "init") {
        this.id = msg.body.node_id;
        this.nodes = msg.body.node_ids;
        this.peers = msg.body.node_ids.filter((id) => id !== this.id);
        if (handlers.init) {
          handlers.init(msg);
        }
        this.reply(msg, { type: "init_ok" });
      } else if (msg.body.in_reply_to) {
        if (msg.body.type === "error") {
          this.pending[msg.body.in_reply_to].reject(msg);
        } else {
          this.pending[msg.body.in_reply_to].resolve(msg);
        }
        delete this.pending[msg.body.in_reply_to];
      } else if (handlers[msg.body.type]) {
        handlers[msg.body.type](msg);
      } else {
        throw Error(`Unexpected message type ${msg.body.type}`);
      }
    }
  }
}
