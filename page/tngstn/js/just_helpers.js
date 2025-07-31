// REGION: JUST HELPERS

/* Just a
 * nameof */
class Name {
  static of(o) {
    if (o == undefined || o == null) {
      return o;
    }

    let name = undefined;
    try {
      if (typeof o === "object") {
        name = o.name;
        if (name === undefined) {
          for (let prop in o) {
            if (o.hasOwnProperty(prop)) {
              name = prop;
              break;
            }
          }
        }
      } else if (typeof o === "function") {
        let body = o.toString();
        let head = body
          .substr(0, Math.min(body.indexOf("("), body.indexOf("{")))
          .trim();
        let parts = head.split(" ");
        name = parts[parts.length - 1];
      }
    } catch (e) {}

    return name;
  }
}
function nameof(o) {
  return Name.of(o);
}

/* Just a
 * getter */
class Gimme {
  static get currentTime() {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, "0");
    const mm = String(now.getMinutes()).padStart(2, "0");
    const ss = String(now.getSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }
  static get currentDate() {
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, "0");
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const yyyy = String(now.getFullYear());
    return `${dd}.${mm}.${yyyy}`;
  }
  static get randomUuid() {
    var s = new Array(36);
    var hexDigits = "0123456789abcdef";
    for (var i = 0; i < 36; i++) {
      s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1);
    }
    s[14] = "4";
    s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1);
    s[8] = s[13] = s[18] = s[23] = "-";
    var uuid = s.join("");
    return uuid;
  }
}

/* Just a
 * logger */
class Logger {
  static log(content, source = "") {
    const src = source == "" ? "" : ` [${source}]`;
    console.log(`${Gimme.currentTime}${src}: ${content}`);
  }
  static error(content, source = "") {
    const src = source == "" ? "" : ` [${source}]`;
    console.error(`${Gimme.currentTime}${src}: ${content}`);
  }
}

/* Just a
 * matcher */
class Matcher {
  static get wildCard() {
    return "*";
  }
  static get wildRegex() {
    return /\{\?[1-9][0-9]*\}/gm;
  }
  static match(pattern, text) {
    if (text === pattern) return true;
    if (!text || !pattern) return false;

    const prts = pattern.split(Matcher.wildCard);
    const last = prts.length - 1;
    const strt = prts[0];
    const end = prts[last];

    return (
      text.startsWith(strt) &&
      text.endsWith(end) &&
      prts.filter((p) => !text.includes(p)).length == 0
    );
  }
}

const just_helpers_initialized = true;
// ENDREGION: JUST HELPERS
