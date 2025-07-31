// REGION: BROADCASTING

class ChannelMessage {
  title;
  message;
  channel;
  source;
  target;
  timestamp;

  constructor(
    title,
    message,
    channel = null,
    source = null,
    target = null,
    timestamp = null
  ) {
    this.title = title;
    this.message = message;
    this.channel = channel;
    this.source = source;
    this.target = target;
    this.timestamp = !!timestamp ? timestamp : Gimme.currentTime;
  }

  update() {
    this.timestamp = Gimme.currentTime;
  }

  static createMessage(content, channel) {
    return new ChannelMessage("untitled", content, channel);
  }
  static createMessage(data) {
    if (!data) return null;

    if (typeof data === "string") {
      try {
        const msg = JSON.parse(json);
        data = msg;
      } catch (e) {
        data = { message: data };
      }
    }

    if (ChannelMessage.isStrict(data)) {
      return new ChannelMessage(
        data.title,
        data.message,
        data.channel,
        data.source,
        data.target,
        data.timestamp
      );
    } else if (ChannelMessage.isValid(data)) {
      return new ChannelMessage(
        !!data.title ? data.title : "untitled",
        data.message,
        !!data.channel ? data.channel : undefined,
        !!data.source ? data.source : undefined,
        !!data.target ? data.target : undefined,
        !!data.timestamp ? data.timestamp : undefined
      );
    } else {
      return new ChannelMessage("untitled", JSON.stringify(data));
    }
  }

  static isValid(data) {
    return !!data.message;
  }
  static isStrict(data) {
    return (
      ChannelMessage.isValid(data) &&
      !!data.title &&
      !!data.channel &&
      !!data.source &&
      !!data.target
    );
  }
  static targetsAll(data) {
    return data.target === "all";
  }
  static isPing(data) {
    return data.title === "handshake" && data.message === "ping";
  }
  static isPong(data) {
    return data.title === "handshake" && data.message === "pong";
  }
}

class Channel {
  static isValidName(name) {
    return !!name && name.length > 0;
  }
  static isValidHandler(handler) {
    return typeof handler === "function";
  }

  _channel = null;
  _onmessage = undefined;

  get isOpen() {
    return !!this._channel;
  }
  get channelName() {
    return this._channel ? this._channel.name : "N/A";
  }

  constructor(name, handler = undefined) {
    try {
      if (!Channel.isValidName(name)) {
        throw new Error("Invalid channel name!");
      }
      if (handler !== undefined && !Channel.isValidHandler(handler)) {
        throw new Error("Handler must be a function!");
      }
      this._channel = new BroadcastChannel(name);
      this._channel.onmessage = this.onMessage.bind(this);
      this.adjust(handler);
    } catch (e) {
      Logger.log(e, `${Channel.name}.constructor`);
      throw e;
    }
  }

  adjust(handler) {
    if (this._onmessage || !Channel.isValidHandler(handler)) {
      return false;
    }
    this._onmessage = handler;
    return true;
  }
  close() {
    if (!this.isOpen) {
      return false;
    }
    this._channel.close();
    this._channel = null;
    return true;
  }
  broadcast(data) {
    if (!this.isOpen || !data) {
      return false;
    }

    if (data instanceof ChannelMessage) data.update();
    else data = new ChannelMessage("untitled", data, this.channelName);

    this._channel.postMessage(data);
    return true;
  }
  onMessage(event) {
    if (this._onmessage) {
      this._onmessage(event);
    }
  }
}

class Broadcaster {
  static get _channelName() {
    return `${Broadcaster.name}-internal`;
  }
  static get _pingPongContinues() {
    return true;
  }

  static _id;
  static _channels;
  static _internal;
  static _others;

  static get id() {
    return Broadcaster._id;
  }

  static init() {
    if (Broadcaster._initialized) {
      return;
    }

    Broadcaster._id = Gimme.randomUuid;
    Broadcaster._channels = [];
    Broadcaster._others = [];
    Broadcaster._internal = new Channel(
      Broadcaster._channelName,
      Broadcaster._onInternalMessage.bind(this)
    );

    Broadcaster._initialized = true;
    Logger.log(
      "Init complete.",
      `${Broadcaster.name}.${nameof(Broadcaster.init)}`
    );
    Logger.log(
      "Arranging handshakes...",
      `${Broadcaster.name}.${nameof(Broadcaster.init)}`
    );
    Broadcaster._internalBroadcast("handshake", "ping", "all");
  }

  static addChannel(name) {
    try {
      if (!Channel.isValidName(name)) {
        throw new Error("Invalid channel name!");
      }
      if (Broadcaster._channels.some((c) => c.channelName == name)) {
        throw new Error(`Channel #${name} already exists!`);
      }
      Broadcaster._channels.push(new Channel(name));
      Logger.log(
        `Channel #${name} has been added.`,
        `${Broadcaster.name}.${nameof(Broadcaster.addChannel)}`
      );
    } catch (e) {
      Logger.log(e, `${Broadcaster.name}.${nameof(Broadcaster.addChannel)}`);
      return false;
    }
    return true;
  }
  static getChannel(name) {
    if (!Channel.isValidName(name)) {
      return null;
    }
    return Broadcaster._channels.find((c) => c.channelName === name);
  }
  static adjustChannel(name, handler) {
    const channel = Broadcaster.getChannel(name);
    if (!channel) {
      return false;
    }
    Logger.log(
      `[${Broadcaster._id}] Adjusting #${name} ...`,
      `${Broadcaster.name}.${nameof(Broadcaster.adjustChannel)}`
    );
    return channel.adjust(handler);
  }
  static broadcast(message) {
    if (!message || !(message instanceof ChannelMessage)) {
      return false;
    }
    const channel = Broadcaster.getChannel(message.channel);
    if (!channel) {
      return false;
    }
    //Logger.log(`Broadcasting on channel #${channel.channelName} ...`, `${Broadcaster.name}.${nameof(Broadcaster.broadcast)}`);
    return channel.broadcast(message);
  }
  static broadcastOnChannel(name, message) {
    const channel = Broadcaster.getChannel(name);
    if (!channel) {
      return false;
    }
    //Logger.log(`Broadcasting on channel #${name} ...`, `${Broadcaster.name}.${nameof(Broadcaster.broadcastOnChannel)}`);
    return channel.broadcast(message);
  }
  static closeChannel(name, notify = true) {
    const channel = Broadcaster.getChannel(name);
    if (!channel) {
      return false;
    }

    if (notify) {
      Broadcaster._internalBroadcast("closing_channel", name, "all");
      channel.broadcast(new ChannelMessage("admin", "closing channel"));
    }

    setTimeout(() => {
      channel.close();
      Broadcaster._channels = Broadcaster._channels.filter(
        (c) => c.channelName != name
      );
      Logger.log(
        `Channel #${name} has been closed!`,
        `${Broadcaster.name}.${nameof(Broadcaster.closeChannel)}`
      );
    }, 3693);

    return true;
  }

  static _internalBroadcast(title, message, target) {
    Logger.log(
      `Sending ${title}.${message} to ${target}`,
      `${Broadcaster.name}.${nameof(Broadcaster._internalBroadcast)}`
    );
    Broadcaster._internal.broadcast(
      new ChannelMessage(
        title,
        message,
        Broadcaster._channelName,
        Broadcaster.id,
        target
      )
    );
  }
  static _onInternalMessage(event) {
    const data = event.data;
    if (!ChannelMessage.isStrict(data)) {
      return false;
    }

    if (ChannelMessage.targetsAll(data)) {
      if (ChannelMessage.isPing(data)) {
        Logger.log(
          `Received ${data.title}.${data.message} from ${data.source}`,
          `${Broadcaster.name}.${nameof(Broadcaster._onInternalMessage)}`
        );
        if (!Broadcaster._isKnownSource(data.source)) {
          Broadcaster._others.push(data.source);
        }
        Broadcaster._internalBroadcast("handshake", "pong", data.source);
        return true;
      }

      if (
        data.title == "closing_channel" &&
        Broadcaster._isKnownSource(data.source)
      ) {
        return Broadcaster.closeChannel(data.message, false);
      }
    } else if (Broadcaster._isValidTarget(data)) {
      if (ChannelMessage.isPing(data) && Broadcaster._pingPongContinues) {
        setTimeout(() => {
          Logger.log(
            `Received ${data.title}.${data.message} from ${data.source}`,
            `${Broadcaster.name}.${nameof(Broadcaster._onInternalMessage)}`
          );
          Broadcaster._internalBroadcast("handshake", "pong", data.source);
        }, Math.random() * (3963 - 369) + 369);
        return true;
      }
      if (ChannelMessage.isPong(data)) {
        if (!Broadcaster._isKnownSource(data.source)) {
          Logger.log(
            `Received ${data.title}.${data.message} from ${data.source}`,
            `${Broadcaster.name}.${nameof(Broadcaster._onInternalMessage)}`
          );
          Broadcaster._others.push(data.source);

          if (Broadcaster._pingPongContinues) {
            Broadcaster._internalBroadcast("handshake", "ping", data.source);
          }
        } else if (Broadcaster._pingPongContinues) {
          setTimeout(() => {
            Logger.log(
              `Received ${data.title}.${data.message} from ${data.source}`,
              `${Broadcaster.name}.${nameof(Broadcaster._onInternalMessage)}`
            );
            Broadcaster._internalBroadcast("handshake", "ping", data.source);
          }, Math.random() * (3963 - 369) + 369);
        }
        return true;
      }
    }

    return false;
  }
  static _isValidTarget(data) {
    return data.target === Broadcaster.id;
  }
  static _isKnownSource(data) {
    return Broadcaster._others.includes(data.source);
  }
}

// ENDREGION: BROADCASTING
