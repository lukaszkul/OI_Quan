Object.defineProperty(Array.prototype, "isEmpty", {
  get: function () {
    return this.length == 0;
  },
});
Object.defineProperty(Array.prototype, "first", {
  get: function () {
    return this.length == 0 ? null : this[0];
  },
});
Object.defineProperty(Array.prototype, "last", {
  get: function () {
    return this.length == 0 ? null : this[this.length - 1];
  },
});
Array.prototype.putnique = function (x) {
  if (this.isEmpty && this.last == x) {
    return;
  }
  if (this.includes(x)) {
    this.splice(this.indexOf(x), 1);
  }
  this.push(x);
};
Array.prototype.putnique = function (x, key) {
  if (!this.some((i) => i[key] == x[key])) {
    this.push(x);
  } else if (this.last[key] == x[key]) {
    this.pop();
    this.push(x);
  } else {
    this.splice(this.indexOf(this.find((i) => i[key] == x[key])), 1);
    this.push(x);
  }
};
Array.prototype.put = function (x) {
  if (this.isEmpty || this.last > x) {
    this.push(x);
  } else if (this.first < x) {
    this.reverse();
    this.push(x);
    this.reverse();
  } else {
    let temp = [];
    while (this.last < x) {
      temp.push(this.pop());
    }
    this.push(x, ...temp.reverse());
  }
};
Array.prototype.put = function (item, compareKey) {
  if (this.isEmpty || this.last[compareKey] > item[compareKey]) {
    this.push(item);
  } else if (this.first[compareKey] < item[compareKey]) {
    this.reverse();
    this.push(item);
    this.reverse();
  } else {
    let temp = [];
    while (this.last[compareKey] < item[compareKey]) {
      temp.push(this.pop());
    }
    this.push(item, ...temp.reverse());
  }
};
Array.prototype.putOrMerge = function (item, keyKey, valueKey) {
  if (this.isEmpty) {
    this.push(item);
  } else if (!this.some((i) => i[keyKey] == item[keyKey])) {
    this.put(item, valueKey);
  } else {
    let itm = this.splice(
      this.indexOf(this.find((i) => i[keyKey] == item[keyKey])),
      1
    ).first;
    item[valueKey] += itm[valueKey];
    this.put(item, valueKey);
  }
};
