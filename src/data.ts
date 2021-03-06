import get = require("get-value");
import PubSub = require("pubsub-js");
import set = require("set-value");

// Logging
import { Logging } from "@hibas123/nodelogging";

export class SCData {
  private data = {};
  private static = {};
  private subscribers = [];
  public set(type, cmd) {
    const p = cmd.split("=");
    const key = p[0];
    const value = p[1] || true;
    // Switch between different set-types
    switch (type) {
      case "LIVE":
        set(this.data, key, value);
        PubSub.publish(key, "SET LIVE " + key + "=" + value);
        break;
      case "STATIC":
        set(this.data, key, value);
        PubSub.publish(key, "SET STATIC " + key + "=" + value);
        set(this.static, key, value);
        // ToDo: Save changes
        break;
      case "LINK":
        // ToDo
        break;
      case "TICK":

        break;
    }
    Logging.debug("SET " + key + " to " + value);
    return "0";
  }
  public sub(key, cb, t) {
    const id = this.subscribers.length;
    const token = PubSub.subscribe(key, (m, d) => {
      cb(m, d, id, t);
    });
    Logging.log("New subscription to " + key);
    this.subscribers[id] = token;
    return { t: token, id };
  }
  public unsub(token) {
    PubSub.unsubscribe(token);
  }
  public unsubId(id) {
    if (this.subscribers[id]) {
      PubSub.unsubscribe(this.subscribers[id]);
      this.subscribers[id] = false;
      return true;
    }
    return false;
  }
  public dump(key) {
    const d = get(this.data, key);
    const dump = [];
    Logging.debug("DUMP " + key);
    if (d) {
      const iterate = (obj, last = key) => {
        Object.keys(obj).forEach((k) => {
          if (typeof obj[k] === "object") {
            const nlast = last + "." + k;
            iterate(obj[k], nlast);
          } else {
            dump.push(last + "." + k + "=" + obj[k]);
          }
        });
      };
      iterate(d);
    }
    return dump;
  }
}
