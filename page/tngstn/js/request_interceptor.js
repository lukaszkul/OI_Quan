// REGION: REQUESTS INTERCEPT

/* Request method */
class RequestMethod {
  static GET = new RequestMethod();
  static PUT = new RequestMethod();
  static HEAD = new RequestMethod();
  static POST = new RequestMethod();
  static PATCH = new RequestMethod();
  static DELETE = new RequestMethod();
  static OPTIONS = new RequestMethod();

  get name() {
    if (this._name === undefined) {
      for (const key in RequestMethod) {
        if (RequestMethod[key] === this) {
          this._name = key.toUpperCase();
          break;
        }
      }
    }
    return this._name;
  }

  isMatching(method) {
    return !!method && method.toUpperCase() === this.name;
  }

  static get all() {
    const array = [];
    for (const key in RequestMethod) {
      if (RequestMethod[key] instanceof RequestMethod)
        array.push(RequestMethod[key]);
    }
    return array;
  }
  static match(method) {
    for (const key in RequestMethod) {
      if (
        RequestMethod[key] instanceof RequestMethod &&
        RequestMethod[key].isMatching(method)
      )
        return RequestMethod[key];
    }
    return undefined;
  }
  static ensure(method) {
    if (method instanceof RequestMethod) {
      return method;
    } else if (typeof method === "string") {
      return RequestMethod.match(method);
    }
    return undefined;
  }
}

/* Class containing
      predefined static set
      of observable requests
      handled by interceptor */
class ObservableRequest {
  static Generate = new ObservableRequest(
    "*/v1/generations",
    RequestMethod.POST
  );
  static Track = new ObservableRequest(
    "*/v1/generations/track",
    RequestMethod.POST
  );
  static Limit = new ObservableRequest(
    "*/v1/generations?limit*",
    RequestMethod.GET
  );
  static Cursor = new ObservableRequest(
    "*/v1/generations?cursor*",
    RequestMethod.GET
  );
  static Delete = new ObservableRequest(
    "*/v1/generations/*",
    RequestMethod.DELETE
  );
  static get all() {
    const array = [];
    for (const key in ObservableRequest) {
      if (ObservableRequest[key] instanceof ObservableRequest)
        array.push(ObservableRequest[key]);
    }
    return array;
  }

  constructor(pattern, method) {
    if (!pattern || pattern.length == 0)
      throw new Error("Invalid pattern value!");

    method = RequestMethod.ensure(method);
    if (!method) throw new Error("Invalid method value!");

    this._pattern = pattern;
    this._method = method;
  }

  get name() {
    if (this._name === undefined) {
      for (const key in ObservableRequest) {
        if (ObservableRequest[key] === this) {
          this._name = key;
          break;
        }
      }
    }
    return this._name;
  }
  get pattern() {
    return this._pattern;
  }
  get method() {
    return this._method;
  }

  isMatching(url, method) {
    method = RequestMethod.ensure(method);
    return method === this.method && Matcher.match(this.pattern, url);
  }
  static match(url, method) {
    if (!url) return undefined;
    for (const key in ObservableRequest) {
      if (
        ObservableRequest[key] instanceof ObservableRequest &&
        ObservableRequest[key].isMatching(url, method)
      )
        return ObservableRequest[key];
    }
    return undefined;
  }
}

/* Interceptor */
class Interceptor {
  static _open;
  static _send;
  static _sendHandler;

  static get isInitiated() {
    return !!Interceptor._open && !!Interceptor._send;
  }
  static get hasHandler() {
    return !!Interceptor._sendHandler;
  }

  static init(sendHandler = null) {
    try {
      if (Interceptor.isInitiated) {
        throw new Error("Already initiated!");
      }

      if (typeof sendHandler === "function") {
        Interceptor._sendHandler = sendHandler;
      }

      Interceptor._open = XMLHttpRequest.prototype.open;
      Interceptor._send = XMLHttpRequest.prototype.send;
      XMLHttpRequest.prototype.open = Interceptor._interceptorOpen;
      XMLHttpRequest.prototype.send = Interceptor._interceptorSend;

      Logger.log(
        "Init complete.",
        `${Interceptor.name}.${nameof(Interceptor.init)}`
      );
    } catch (e) {
      Logger.log(e, `${Interceptor.name}.${nameof(Interceptor.init)}`);
      return false;
    }

    return true;
  }
  static applyHandler(sendHandler) {
    try {
      if (Interceptor.hasHandler) {
        throw new Error("Already handled!");
      }

      if (typeof sendHandler !== "function") {
        throw new Error("Handler must be a function!");
      }
      Interceptor._sendHandler = sendHandler;

      Logger.log(
        "Handler applied.",
        `${Interceptor.name}.${nameof(Interceptor.applyHandler)}`
      );
    } catch (e) {
      Logger.log(e, `${Interceptor.name}.${nameof(Interceptor.applyHandler)}`);
      return false;
    }

    return true;
  }

  static _interceptorOpen(method, url, ...rest) {
    this._url = url;
    this._method = method;
    return Interceptor._open.call(this, method, url, ...rest);
  }
  static _interceptorSend(...args) {
    this.addEventListener("load", function () {
      try {
        let content = this.responseText;
        const ct = this.getResponseHeader("content-type") ?? "N/A";
        if (ct === "N/A") {
          const acam = this.getResponseHeader("access-control-allow-methods");
          if (acam) {
            content = acam;
          }
        }

        if (Interceptor.hasHandler) {
          Interceptor._sendHandler(this._url, this._method, ct, content);
        }
      } catch (e) {
        Logger.log(
          e,
          `${Interceptor.name}.${nameof(Interceptor._interceptorSend)}`
        );
      }
    });
    return Interceptor._send.apply(this, args);
  }
}

/* Request handler */
class RequestHandler {
  static _customHandler;

  static get isInitialized() {
    return RequestHandler._initialized;
  }
  static get hasHandler() {
    return typeof RequestHandler._customHandler === "function";
  }

  static init(customHandler = null) {
    try {
      if (RequestHandler.isInitialized) {
        throw new Error("Already initialized!");
      }
      if (typeof customHandler === "function") {
        RequestHandler._customHandler = customHandler;
      }

      RequestHandler._initialized = Interceptor.init(RequestHandler._handle);
      Logger.log(
        "Init complete.",
        `${RequestHandler.name}.${nameof(RequestHandler.init)}`
      );
    } catch (e) {
      Logger.log(e, `${RequestHandler.name}.${nameof(RequestHandler.init)}`);
      return false;
    }

    return RequestHandler.isInitialized;
  }
  static applyHandler(customHandler) {
    try {
      if (RequestHandler.hasHandler) {
        throw new Error("Already handled!");
      }

      if (typeof customHandler !== "function") {
        throw new Error("Handler must be a function!");
      }

      RequestHandler._customHandler = customHandler;

      Logger.log(
        "Handler applied.",
        `${RequestHandler.name}.${nameof(RequestHandler.applyHandler)}`
      );
    } catch (e) {
      Logger.log(
        e,
        `${RequestHandler.name}.${nameof(RequestHandler.applyHandler)}`
      );
      return false;
    }

    return RequestHandler.hasHandler;
  }
  static _handle(url, method, contentType, content) {
    if (RequestHandler.hasHandler) {
      RequestHandler._customHandler(url, method, contentType, content);
    }
  }
}

// ENDREGION: REQUESTS INTERCEPT
