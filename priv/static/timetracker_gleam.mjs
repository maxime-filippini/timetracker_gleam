// build/dev/javascript/prelude.mjs
var CustomType = class {
  withFields(fields) {
    let properties = Object.keys(this).map(
      (label2) => label2 in fields ? fields[label2] : this[label2]
    );
    return new this.constructor(...properties);
  }
};
var List = class {
  static fromArray(array3, tail) {
    let t = tail || new Empty();
    for (let i = array3.length - 1; i >= 0; --i) {
      t = new NonEmpty(array3[i], t);
    }
    return t;
  }
  [Symbol.iterator]() {
    return new ListIterator(this);
  }
  toArray() {
    return [...this];
  }
  // @internal
  atLeastLength(desired) {
    for (let _ of this) {
      if (desired <= 0)
        return true;
      desired--;
    }
    return desired <= 0;
  }
  // @internal
  hasLength(desired) {
    for (let _ of this) {
      if (desired <= 0)
        return false;
      desired--;
    }
    return desired === 0;
  }
  countLength() {
    let length4 = 0;
    for (let _ of this)
      length4++;
    return length4;
  }
};
function prepend(element2, tail) {
  return new NonEmpty(element2, tail);
}
function toList(elements, tail) {
  return List.fromArray(elements, tail);
}
var ListIterator = class {
  #current;
  constructor(current) {
    this.#current = current;
  }
  next() {
    if (this.#current instanceof Empty) {
      return { done: true };
    } else {
      let { head, tail } = this.#current;
      this.#current = tail;
      return { value: head, done: false };
    }
  }
};
var Empty = class extends List {
};
var NonEmpty = class extends List {
  constructor(head, tail) {
    super();
    this.head = head;
    this.tail = tail;
  }
};
var BitArray = class _BitArray {
  constructor(buffer) {
    if (!(buffer instanceof Uint8Array)) {
      throw "BitArray can only be constructed from a Uint8Array";
    }
    this.buffer = buffer;
  }
  // @internal
  get length() {
    return this.buffer.length;
  }
  // @internal
  byteAt(index2) {
    return this.buffer[index2];
  }
  // @internal
  floatFromSlice(start4, end, isBigEndian) {
    return byteArrayToFloat(this.buffer, start4, end, isBigEndian);
  }
  // @internal
  intFromSlice(start4, end, isBigEndian, isSigned) {
    return byteArrayToInt(this.buffer, start4, end, isBigEndian, isSigned);
  }
  // @internal
  binaryFromSlice(start4, end) {
    return new _BitArray(this.buffer.slice(start4, end));
  }
  // @internal
  sliceAfter(index2) {
    return new _BitArray(this.buffer.slice(index2));
  }
};
function byteArrayToInt(byteArray, start4, end, isBigEndian, isSigned) {
  let value3 = 0;
  if (isBigEndian) {
    for (let i = start4; i < end; i++) {
      value3 = value3 * 256 + byteArray[i];
    }
  } else {
    for (let i = end - 1; i >= start4; i--) {
      value3 = value3 * 256 + byteArray[i];
    }
  }
  if (isSigned) {
    const byteSize = end - start4;
    const highBit = 2 ** (byteSize * 8 - 1);
    if (value3 >= highBit) {
      value3 -= highBit * 2;
    }
  }
  return value3;
}
function byteArrayToFloat(byteArray, start4, end, isBigEndian) {
  const view5 = new DataView(byteArray.buffer);
  const byteSize = end - start4;
  if (byteSize === 8) {
    return view5.getFloat64(start4, !isBigEndian);
  } else if (byteSize === 4) {
    return view5.getFloat32(start4, !isBigEndian);
  } else {
    const msg = `Sized floats must be 32-bit or 64-bit on JavaScript, got size of ${byteSize * 8} bits`;
    throw new globalThis.Error(msg);
  }
}
var Result = class _Result extends CustomType {
  // @internal
  static isResult(data) {
    return data instanceof _Result;
  }
};
var Ok = class extends Result {
  constructor(value3) {
    super();
    this[0] = value3;
  }
  // @internal
  isOk() {
    return true;
  }
};
var Error = class extends Result {
  constructor(detail) {
    super();
    this[0] = detail;
  }
  // @internal
  isOk() {
    return false;
  }
};
function isEqual(x, y) {
  let values = [x, y];
  while (values.length) {
    let a2 = values.pop();
    let b = values.pop();
    if (a2 === b)
      continue;
    if (!isObject(a2) || !isObject(b))
      return false;
    let unequal = !structurallyCompatibleObjects(a2, b) || unequalDates(a2, b) || unequalBuffers(a2, b) || unequalArrays(a2, b) || unequalMaps(a2, b) || unequalSets(a2, b) || unequalRegExps(a2, b);
    if (unequal)
      return false;
    const proto = Object.getPrototypeOf(a2);
    if (proto !== null && typeof proto.equals === "function") {
      try {
        if (a2.equals(b))
          continue;
        else
          return false;
      } catch {
      }
    }
    let [keys2, get2] = getters(a2);
    for (let k of keys2(a2)) {
      values.push(get2(a2, k), get2(b, k));
    }
  }
  return true;
}
function getters(object3) {
  if (object3 instanceof Map) {
    return [(x) => x.keys(), (x, y) => x.get(y)];
  } else {
    let extra = object3 instanceof globalThis.Error ? ["message"] : [];
    return [(x) => [...extra, ...Object.keys(x)], (x, y) => x[y]];
  }
}
function unequalDates(a2, b) {
  return a2 instanceof Date && (a2 > b || a2 < b);
}
function unequalBuffers(a2, b) {
  return a2.buffer instanceof ArrayBuffer && a2.BYTES_PER_ELEMENT && !(a2.byteLength === b.byteLength && a2.every((n, i) => n === b[i]));
}
function unequalArrays(a2, b) {
  return Array.isArray(a2) && a2.length !== b.length;
}
function unequalMaps(a2, b) {
  return a2 instanceof Map && a2.size !== b.size;
}
function unequalSets(a2, b) {
  return a2 instanceof Set && (a2.size != b.size || [...a2].some((e) => !b.has(e)));
}
function unequalRegExps(a2, b) {
  return a2 instanceof RegExp && (a2.source !== b.source || a2.flags !== b.flags);
}
function isObject(a2) {
  return typeof a2 === "object" && a2 !== null;
}
function structurallyCompatibleObjects(a2, b) {
  if (typeof a2 !== "object" && typeof b !== "object" && (!a2 || !b))
    return false;
  let nonstructural = [Promise, WeakSet, WeakMap, Function];
  if (nonstructural.some((c) => a2 instanceof c))
    return false;
  return a2.constructor === b.constructor;
}
function remainderInt(a2, b) {
  if (b === 0) {
    return 0;
  } else {
    return a2 % b;
  }
}
function divideInt(a2, b) {
  return Math.trunc(divideFloat(a2, b));
}
function divideFloat(a2, b) {
  if (b === 0) {
    return 0;
  } else {
    return a2 / b;
  }
}
function makeError(variant, module, line, fn, message, extra) {
  let error = new globalThis.Error(message);
  error.gleam_error = variant;
  error.module = module;
  error.line = line;
  error.fn = fn;
  for (let k in extra)
    error[k] = extra[k];
  return error;
}

// build/dev/javascript/gleam_stdlib/gleam/option.mjs
var Some = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var None = class extends CustomType {
};
function to_result(option2, e) {
  if (option2 instanceof Some) {
    let a2 = option2[0];
    return new Ok(a2);
  } else {
    return new Error(e);
  }
}

// build/dev/javascript/gleam_stdlib/gleam/int.mjs
function to_string2(x) {
  return to_string(x);
}

// build/dev/javascript/gleam_stdlib/gleam/list.mjs
function do_reverse(loop$remaining, loop$accumulator) {
  while (true) {
    let remaining = loop$remaining;
    let accumulator = loop$accumulator;
    if (remaining.hasLength(0)) {
      return accumulator;
    } else {
      let item = remaining.head;
      let rest$1 = remaining.tail;
      loop$remaining = rest$1;
      loop$accumulator = prepend(item, accumulator);
    }
  }
}
function reverse(xs) {
  return do_reverse(xs, toList([]));
}
function do_filter(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list2 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list2.hasLength(0)) {
      return reverse(acc);
    } else {
      let x = list2.head;
      let xs = list2.tail;
      let new_acc = (() => {
        let $ = fun(x);
        if ($) {
          return prepend(x, acc);
        } else {
          return acc;
        }
      })();
      loop$list = xs;
      loop$fun = fun;
      loop$acc = new_acc;
    }
  }
}
function filter(list2, predicate) {
  return do_filter(list2, predicate, toList([]));
}
function do_map(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list2 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list2.hasLength(0)) {
      return reverse(acc);
    } else {
      let x = list2.head;
      let xs = list2.tail;
      loop$list = xs;
      loop$fun = fun;
      loop$acc = prepend(fun(x), acc);
    }
  }
}
function map(list2, fun) {
  return do_map(list2, fun, toList([]));
}
function do_index_map(loop$list, loop$fun, loop$index, loop$acc) {
  while (true) {
    let list2 = loop$list;
    let fun = loop$fun;
    let index2 = loop$index;
    let acc = loop$acc;
    if (list2.hasLength(0)) {
      return reverse(acc);
    } else {
      let x = list2.head;
      let xs = list2.tail;
      let acc$1 = prepend(fun(x, index2), acc);
      loop$list = xs;
      loop$fun = fun;
      loop$index = index2 + 1;
      loop$acc = acc$1;
    }
  }
}
function index_map(list2, fun) {
  return do_index_map(list2, fun, 0, toList([]));
}
function do_try_map(loop$list, loop$fun, loop$acc) {
  while (true) {
    let list2 = loop$list;
    let fun = loop$fun;
    let acc = loop$acc;
    if (list2.hasLength(0)) {
      return new Ok(reverse(acc));
    } else {
      let x = list2.head;
      let xs = list2.tail;
      let $ = fun(x);
      if ($.isOk()) {
        let y = $[0];
        loop$list = xs;
        loop$fun = fun;
        loop$acc = prepend(y, acc);
      } else {
        let error = $[0];
        return new Error(error);
      }
    }
  }
}
function try_map(list2, fun) {
  return do_try_map(list2, fun, toList([]));
}
function drop(loop$list, loop$n) {
  while (true) {
    let list2 = loop$list;
    let n = loop$n;
    let $ = n <= 0;
    if ($) {
      return list2;
    } else {
      if (list2.hasLength(0)) {
        return toList([]);
      } else {
        let xs = list2.tail;
        loop$list = xs;
        loop$n = n - 1;
      }
    }
  }
}
function do_take(loop$list, loop$n, loop$acc) {
  while (true) {
    let list2 = loop$list;
    let n = loop$n;
    let acc = loop$acc;
    let $ = n <= 0;
    if ($) {
      return reverse(acc);
    } else {
      if (list2.hasLength(0)) {
        return reverse(acc);
      } else {
        let x = list2.head;
        let xs = list2.tail;
        loop$list = xs;
        loop$n = n - 1;
        loop$acc = prepend(x, acc);
      }
    }
  }
}
function take(list2, n) {
  return do_take(list2, n, toList([]));
}
function do_append(loop$first, loop$second) {
  while (true) {
    let first3 = loop$first;
    let second2 = loop$second;
    if (first3.hasLength(0)) {
      return second2;
    } else {
      let item = first3.head;
      let rest$1 = first3.tail;
      loop$first = rest$1;
      loop$second = prepend(item, second2);
    }
  }
}
function append2(first3, second2) {
  return do_append(reverse(first3), second2);
}
function reverse_and_prepend(loop$prefix, loop$suffix) {
  while (true) {
    let prefix = loop$prefix;
    let suffix = loop$suffix;
    if (prefix.hasLength(0)) {
      return suffix;
    } else {
      let first$1 = prefix.head;
      let rest$1 = prefix.tail;
      loop$prefix = rest$1;
      loop$suffix = prepend(first$1, suffix);
    }
  }
}
function do_concat(loop$lists, loop$acc) {
  while (true) {
    let lists = loop$lists;
    let acc = loop$acc;
    if (lists.hasLength(0)) {
      return reverse(acc);
    } else {
      let list2 = lists.head;
      let further_lists = lists.tail;
      loop$lists = further_lists;
      loop$acc = reverse_and_prepend(list2, acc);
    }
  }
}
function concat(lists) {
  return do_concat(lists, toList([]));
}
function fold(loop$list, loop$initial, loop$fun) {
  while (true) {
    let list2 = loop$list;
    let initial = loop$initial;
    let fun = loop$fun;
    if (list2.hasLength(0)) {
      return initial;
    } else {
      let x = list2.head;
      let rest$1 = list2.tail;
      loop$list = rest$1;
      loop$initial = fun(initial, x);
      loop$fun = fun;
    }
  }
}

// build/dev/javascript/gleam_stdlib/gleam/result.mjs
function map2(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(fun(x));
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function map_error(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return new Ok(x);
  } else {
    let error = result[0];
    return new Error(fun(error));
  }
}
function try$(result, fun) {
  if (result.isOk()) {
    let x = result[0];
    return fun(x);
  } else {
    let e = result[0];
    return new Error(e);
  }
}
function then$(result, fun) {
  return try$(result, fun);
}

// build/dev/javascript/gleam_stdlib/gleam/string_builder.mjs
function from_strings(strings) {
  return concat2(strings);
}
function from_string(string3) {
  return identity(string3);
}
function to_string3(builder) {
  return identity(builder);
}
function split2(iodata, pattern) {
  return split(iodata, pattern);
}

// build/dev/javascript/gleam_stdlib/gleam/dynamic.mjs
var DecodeError = class extends CustomType {
  constructor(expected, found, path) {
    super();
    this.expected = expected;
    this.found = found;
    this.path = path;
  }
};
function classify(data) {
  return classify_dynamic(data);
}
function int(data) {
  return decode_int(data);
}
function shallow_list(value3) {
  return decode_list(value3);
}
function any(decoders) {
  return (data) => {
    if (decoders.hasLength(0)) {
      return new Error(
        toList([new DecodeError("another type", classify(data), toList([]))])
      );
    } else {
      let decoder = decoders.head;
      let decoders$1 = decoders.tail;
      let $ = decoder(data);
      if ($.isOk()) {
        let decoded = $[0];
        return new Ok(decoded);
      } else {
        return any(decoders$1)(data);
      }
    }
  };
}
function all_errors(result) {
  if (result.isOk()) {
    return toList([]);
  } else {
    let errors = result[0];
    return errors;
  }
}
function push_path(error, name2) {
  let name$1 = identity(name2);
  let decoder = any(
    toList([string, (x) => {
      return map2(int(x), to_string2);
    }])
  );
  let name$2 = (() => {
    let $ = decoder(name$1);
    if ($.isOk()) {
      let name$22 = $[0];
      return name$22;
    } else {
      let _pipe = toList(["<", classify(name$1), ">"]);
      let _pipe$1 = from_strings(_pipe);
      return to_string3(_pipe$1);
    }
  })();
  return error.withFields({ path: prepend(name$2, error.path) });
}
function list(decoder_type) {
  return (dynamic) => {
    return try$(
      shallow_list(dynamic),
      (list2) => {
        let _pipe = list2;
        let _pipe$1 = try_map(_pipe, decoder_type);
        return map_errors(
          _pipe$1,
          (_capture) => {
            return push_path(_capture, "*");
          }
        );
      }
    );
  };
}
function map_errors(result, f) {
  return map_error(
    result,
    (_capture) => {
      return map(_capture, f);
    }
  );
}
function string(data) {
  return decode_string(data);
}
function field(name2, inner_type) {
  return (value3) => {
    let missing_field_error = new DecodeError("field", "nothing", toList([]));
    return try$(
      decode_field(value3, name2),
      (maybe_inner) => {
        let _pipe = maybe_inner;
        let _pipe$1 = to_result(_pipe, toList([missing_field_error]));
        let _pipe$2 = try$(_pipe$1, inner_type);
        return map_errors(
          _pipe$2,
          (_capture) => {
            return push_path(_capture, name2);
          }
        );
      }
    );
  };
}
function decode2(constructor, t1, t2) {
  return (value3) => {
    let $ = t1(value3);
    let $1 = t2(value3);
    if ($.isOk() && $1.isOk()) {
      let a2 = $[0];
      let b = $1[0];
      return new Ok(constructor(a2, b));
    } else {
      let a2 = $;
      let b = $1;
      return new Error(concat(toList([all_errors(a2), all_errors(b)])));
    }
  };
}
function decode3(constructor, t1, t2, t3) {
  return (value3) => {
    let $ = t1(value3);
    let $1 = t2(value3);
    let $2 = t3(value3);
    if ($.isOk() && $1.isOk() && $2.isOk()) {
      let a2 = $[0];
      let b = $1[0];
      let c = $2[0];
      return new Ok(constructor(a2, b, c));
    } else {
      let a2 = $;
      let b = $1;
      let c = $2;
      return new Error(
        concat(toList([all_errors(a2), all_errors(b), all_errors(c)]))
      );
    }
  };
}

// build/dev/javascript/gleam_stdlib/dict.mjs
var referenceMap = /* @__PURE__ */ new WeakMap();
var tempDataView = new DataView(new ArrayBuffer(8));
var referenceUID = 0;
function hashByReference(o) {
  const known = referenceMap.get(o);
  if (known !== void 0) {
    return known;
  }
  const hash = referenceUID++;
  if (referenceUID === 2147483647) {
    referenceUID = 0;
  }
  referenceMap.set(o, hash);
  return hash;
}
function hashMerge(a2, b) {
  return a2 ^ b + 2654435769 + (a2 << 6) + (a2 >> 2) | 0;
}
function hashString(s) {
  let hash = 0;
  const len = s.length;
  for (let i = 0; i < len; i++) {
    hash = Math.imul(31, hash) + s.charCodeAt(i) | 0;
  }
  return hash;
}
function hashNumber(n) {
  tempDataView.setFloat64(0, n);
  const i = tempDataView.getInt32(0);
  const j = tempDataView.getInt32(4);
  return Math.imul(73244475, i >> 16 ^ i) ^ j;
}
function hashBigInt(n) {
  return hashString(n.toString());
}
function hashObject(o) {
  const proto = Object.getPrototypeOf(o);
  if (proto !== null && typeof proto.hashCode === "function") {
    try {
      const code = o.hashCode(o);
      if (typeof code === "number") {
        return code;
      }
    } catch {
    }
  }
  if (o instanceof Promise || o instanceof WeakSet || o instanceof WeakMap) {
    return hashByReference(o);
  }
  if (o instanceof Date) {
    return hashNumber(o.getTime());
  }
  let h = 0;
  if (o instanceof ArrayBuffer) {
    o = new Uint8Array(o);
  }
  if (Array.isArray(o) || o instanceof Uint8Array) {
    for (let i = 0; i < o.length; i++) {
      h = Math.imul(31, h) + getHash(o[i]) | 0;
    }
  } else if (o instanceof Set) {
    o.forEach((v) => {
      h = h + getHash(v) | 0;
    });
  } else if (o instanceof Map) {
    o.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
  } else {
    const keys2 = Object.keys(o);
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      const v = o[k];
      h = h + hashMerge(getHash(v), hashString(k)) | 0;
    }
  }
  return h;
}
function getHash(u) {
  if (u === null)
    return 1108378658;
  if (u === void 0)
    return 1108378659;
  if (u === true)
    return 1108378657;
  if (u === false)
    return 1108378656;
  switch (typeof u) {
    case "number":
      return hashNumber(u);
    case "string":
      return hashString(u);
    case "bigint":
      return hashBigInt(u);
    case "object":
      return hashObject(u);
    case "symbol":
      return hashByReference(u);
    case "function":
      return hashByReference(u);
    default:
      return 0;
  }
}
var SHIFT = 5;
var BUCKET_SIZE = Math.pow(2, SHIFT);
var MASK = BUCKET_SIZE - 1;
var MAX_INDEX_NODE = BUCKET_SIZE / 2;
var MIN_ARRAY_NODE = BUCKET_SIZE / 4;
var ENTRY = 0;
var ARRAY_NODE = 1;
var INDEX_NODE = 2;
var COLLISION_NODE = 3;
var EMPTY = {
  type: INDEX_NODE,
  bitmap: 0,
  array: []
};
function mask(hash, shift) {
  return hash >>> shift & MASK;
}
function bitpos(hash, shift) {
  return 1 << mask(hash, shift);
}
function bitcount(x) {
  x -= x >> 1 & 1431655765;
  x = (x & 858993459) + (x >> 2 & 858993459);
  x = x + (x >> 4) & 252645135;
  x += x >> 8;
  x += x >> 16;
  return x & 127;
}
function index(bitmap, bit) {
  return bitcount(bitmap & bit - 1);
}
function cloneAndSet(arr, at, val) {
  const len = arr.length;
  const out = new Array(len);
  for (let i = 0; i < len; ++i) {
    out[i] = arr[i];
  }
  out[at] = val;
  return out;
}
function spliceIn(arr, at, val) {
  const len = arr.length;
  const out = new Array(len + 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  out[g++] = val;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function spliceOut(arr, at) {
  const len = arr.length;
  const out = new Array(len - 1);
  let i = 0;
  let g = 0;
  while (i < at) {
    out[g++] = arr[i++];
  }
  ++i;
  while (i < len) {
    out[g++] = arr[i++];
  }
  return out;
}
function createNode(shift, key1, val1, key2hash, key2, val2) {
  const key1hash = getHash(key1);
  if (key1hash === key2hash) {
    return {
      type: COLLISION_NODE,
      hash: key1hash,
      array: [
        { type: ENTRY, k: key1, v: val1 },
        { type: ENTRY, k: key2, v: val2 }
      ]
    };
  }
  const addedLeaf = { val: false };
  return assoc(
    assocIndex(EMPTY, shift, key1hash, key1, val1, addedLeaf),
    shift,
    key2hash,
    key2,
    val2,
    addedLeaf
  );
}
function assoc(root2, shift, hash, key, val, addedLeaf) {
  switch (root2.type) {
    case ARRAY_NODE:
      return assocArray(root2, shift, hash, key, val, addedLeaf);
    case INDEX_NODE:
      return assocIndex(root2, shift, hash, key, val, addedLeaf);
    case COLLISION_NODE:
      return assocCollision(root2, shift, hash, key, val, addedLeaf);
  }
}
function assocArray(root2, shift, hash, key, val, addedLeaf) {
  const idx = mask(hash, shift);
  const node = root2.array[idx];
  if (node === void 0) {
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root2.size + 1,
      array: cloneAndSet(root2.array, idx, { type: ENTRY, k: key, v: val })
    };
  }
  if (node.type === ENTRY) {
    if (isEqual(key, node.k)) {
      if (val === node.v) {
        return root2;
      }
      return {
        type: ARRAY_NODE,
        size: root2.size,
        array: cloneAndSet(root2.array, idx, {
          type: ENTRY,
          k: key,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: ARRAY_NODE,
      size: root2.size,
      array: cloneAndSet(
        root2.array,
        idx,
        createNode(shift + SHIFT, node.k, node.v, hash, key, val)
      )
    };
  }
  const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
  if (n === node) {
    return root2;
  }
  return {
    type: ARRAY_NODE,
    size: root2.size,
    array: cloneAndSet(root2.array, idx, n)
  };
}
function assocIndex(root2, shift, hash, key, val, addedLeaf) {
  const bit = bitpos(hash, shift);
  const idx = index(root2.bitmap, bit);
  if ((root2.bitmap & bit) !== 0) {
    const node = root2.array[idx];
    if (node.type !== ENTRY) {
      const n = assoc(node, shift + SHIFT, hash, key, val, addedLeaf);
      if (n === node) {
        return root2;
      }
      return {
        type: INDEX_NODE,
        bitmap: root2.bitmap,
        array: cloneAndSet(root2.array, idx, n)
      };
    }
    const nodeKey = node.k;
    if (isEqual(key, nodeKey)) {
      if (val === node.v) {
        return root2;
      }
      return {
        type: INDEX_NODE,
        bitmap: root2.bitmap,
        array: cloneAndSet(root2.array, idx, {
          type: ENTRY,
          k: key,
          v: val
        })
      };
    }
    addedLeaf.val = true;
    return {
      type: INDEX_NODE,
      bitmap: root2.bitmap,
      array: cloneAndSet(
        root2.array,
        idx,
        createNode(shift + SHIFT, nodeKey, node.v, hash, key, val)
      )
    };
  } else {
    const n = root2.array.length;
    if (n >= MAX_INDEX_NODE) {
      const nodes = new Array(32);
      const jdx = mask(hash, shift);
      nodes[jdx] = assocIndex(EMPTY, shift + SHIFT, hash, key, val, addedLeaf);
      let j = 0;
      let bitmap = root2.bitmap;
      for (let i = 0; i < 32; i++) {
        if ((bitmap & 1) !== 0) {
          const node = root2.array[j++];
          nodes[i] = node;
        }
        bitmap = bitmap >>> 1;
      }
      return {
        type: ARRAY_NODE,
        size: n + 1,
        array: nodes
      };
    } else {
      const newArray = spliceIn(root2.array, idx, {
        type: ENTRY,
        k: key,
        v: val
      });
      addedLeaf.val = true;
      return {
        type: INDEX_NODE,
        bitmap: root2.bitmap | bit,
        array: newArray
      };
    }
  }
}
function assocCollision(root2, shift, hash, key, val, addedLeaf) {
  if (hash === root2.hash) {
    const idx = collisionIndexOf(root2, key);
    if (idx !== -1) {
      const entry = root2.array[idx];
      if (entry.v === val) {
        return root2;
      }
      return {
        type: COLLISION_NODE,
        hash,
        array: cloneAndSet(root2.array, idx, { type: ENTRY, k: key, v: val })
      };
    }
    const size = root2.array.length;
    addedLeaf.val = true;
    return {
      type: COLLISION_NODE,
      hash,
      array: cloneAndSet(root2.array, size, { type: ENTRY, k: key, v: val })
    };
  }
  return assoc(
    {
      type: INDEX_NODE,
      bitmap: bitpos(root2.hash, shift),
      array: [root2]
    },
    shift,
    hash,
    key,
    val,
    addedLeaf
  );
}
function collisionIndexOf(root2, key) {
  const size = root2.array.length;
  for (let i = 0; i < size; i++) {
    if (isEqual(key, root2.array[i].k)) {
      return i;
    }
  }
  return -1;
}
function find(root2, shift, hash, key) {
  switch (root2.type) {
    case ARRAY_NODE:
      return findArray(root2, shift, hash, key);
    case INDEX_NODE:
      return findIndex(root2, shift, hash, key);
    case COLLISION_NODE:
      return findCollision(root2, key);
  }
}
function findArray(root2, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root2.array[idx];
  if (node === void 0) {
    return void 0;
  }
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findIndex(root2, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root2.bitmap & bit) === 0) {
    return void 0;
  }
  const idx = index(root2.bitmap, bit);
  const node = root2.array[idx];
  if (node.type !== ENTRY) {
    return find(node, shift + SHIFT, hash, key);
  }
  if (isEqual(key, node.k)) {
    return node;
  }
  return void 0;
}
function findCollision(root2, key) {
  const idx = collisionIndexOf(root2, key);
  if (idx < 0) {
    return void 0;
  }
  return root2.array[idx];
}
function without(root2, shift, hash, key) {
  switch (root2.type) {
    case ARRAY_NODE:
      return withoutArray(root2, shift, hash, key);
    case INDEX_NODE:
      return withoutIndex(root2, shift, hash, key);
    case COLLISION_NODE:
      return withoutCollision(root2, key);
  }
}
function withoutArray(root2, shift, hash, key) {
  const idx = mask(hash, shift);
  const node = root2.array[idx];
  if (node === void 0) {
    return root2;
  }
  let n = void 0;
  if (node.type === ENTRY) {
    if (!isEqual(node.k, key)) {
      return root2;
    }
  } else {
    n = without(node, shift + SHIFT, hash, key);
    if (n === node) {
      return root2;
    }
  }
  if (n === void 0) {
    if (root2.size <= MIN_ARRAY_NODE) {
      const arr = root2.array;
      const out = new Array(root2.size - 1);
      let i = 0;
      let j = 0;
      let bitmap = 0;
      while (i < idx) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      ++i;
      while (i < arr.length) {
        const nv = arr[i];
        if (nv !== void 0) {
          out[j] = nv;
          bitmap |= 1 << i;
          ++j;
        }
        ++i;
      }
      return {
        type: INDEX_NODE,
        bitmap,
        array: out
      };
    }
    return {
      type: ARRAY_NODE,
      size: root2.size - 1,
      array: cloneAndSet(root2.array, idx, n)
    };
  }
  return {
    type: ARRAY_NODE,
    size: root2.size,
    array: cloneAndSet(root2.array, idx, n)
  };
}
function withoutIndex(root2, shift, hash, key) {
  const bit = bitpos(hash, shift);
  if ((root2.bitmap & bit) === 0) {
    return root2;
  }
  const idx = index(root2.bitmap, bit);
  const node = root2.array[idx];
  if (node.type !== ENTRY) {
    const n = without(node, shift + SHIFT, hash, key);
    if (n === node) {
      return root2;
    }
    if (n !== void 0) {
      return {
        type: INDEX_NODE,
        bitmap: root2.bitmap,
        array: cloneAndSet(root2.array, idx, n)
      };
    }
    if (root2.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root2.bitmap ^ bit,
      array: spliceOut(root2.array, idx)
    };
  }
  if (isEqual(key, node.k)) {
    if (root2.bitmap === bit) {
      return void 0;
    }
    return {
      type: INDEX_NODE,
      bitmap: root2.bitmap ^ bit,
      array: spliceOut(root2.array, idx)
    };
  }
  return root2;
}
function withoutCollision(root2, key) {
  const idx = collisionIndexOf(root2, key);
  if (idx < 0) {
    return root2;
  }
  if (root2.array.length === 1) {
    return void 0;
  }
  return {
    type: COLLISION_NODE,
    hash: root2.hash,
    array: spliceOut(root2.array, idx)
  };
}
function forEach(root2, fn) {
  if (root2 === void 0) {
    return;
  }
  const items = root2.array;
  const size = items.length;
  for (let i = 0; i < size; i++) {
    const item = items[i];
    if (item === void 0) {
      continue;
    }
    if (item.type === ENTRY) {
      fn(item.v, item.k);
      continue;
    }
    forEach(item, fn);
  }
}
var Dict = class _Dict {
  /**
   * @template V
   * @param {Record<string,V>} o
   * @returns {Dict<string,V>}
   */
  static fromObject(o) {
    const keys2 = Object.keys(o);
    let m = _Dict.new();
    for (let i = 0; i < keys2.length; i++) {
      const k = keys2[i];
      m = m.set(k, o[k]);
    }
    return m;
  }
  /**
   * @template K,V
   * @param {Map<K,V>} o
   * @returns {Dict<K,V>}
   */
  static fromMap(o) {
    let m = _Dict.new();
    o.forEach((v, k) => {
      m = m.set(k, v);
    });
    return m;
  }
  static new() {
    return new _Dict(void 0, 0);
  }
  /**
   * @param {undefined | Node<K,V>} root
   * @param {number} size
   */
  constructor(root2, size) {
    this.root = root2;
    this.size = size;
  }
  /**
   * @template NotFound
   * @param {K} key
   * @param {NotFound} notFound
   * @returns {NotFound | V}
   */
  get(key, notFound) {
    if (this.root === void 0) {
      return notFound;
    }
    const found = find(this.root, 0, getHash(key), key);
    if (found === void 0) {
      return notFound;
    }
    return found.v;
  }
  /**
   * @param {K} key
   * @param {V} val
   * @returns {Dict<K,V>}
   */
  set(key, val) {
    const addedLeaf = { val: false };
    const root2 = this.root === void 0 ? EMPTY : this.root;
    const newRoot = assoc(root2, 0, getHash(key), key, val, addedLeaf);
    if (newRoot === this.root) {
      return this;
    }
    return new _Dict(newRoot, addedLeaf.val ? this.size + 1 : this.size);
  }
  /**
   * @param {K} key
   * @returns {Dict<K,V>}
   */
  delete(key) {
    if (this.root === void 0) {
      return this;
    }
    const newRoot = without(this.root, 0, getHash(key), key);
    if (newRoot === this.root) {
      return this;
    }
    if (newRoot === void 0) {
      return _Dict.new();
    }
    return new _Dict(newRoot, this.size - 1);
  }
  /**
   * @param {K} key
   * @returns {boolean}
   */
  has(key) {
    if (this.root === void 0) {
      return false;
    }
    return find(this.root, 0, getHash(key), key) !== void 0;
  }
  /**
   * @returns {[K,V][]}
   */
  entries() {
    if (this.root === void 0) {
      return [];
    }
    const result = [];
    this.forEach((v, k) => result.push([k, v]));
    return result;
  }
  /**
   *
   * @param {(val:V,key:K)=>void} fn
   */
  forEach(fn) {
    forEach(this.root, fn);
  }
  hashCode() {
    let h = 0;
    this.forEach((v, k) => {
      h = h + hashMerge(getHash(v), getHash(k)) | 0;
    });
    return h;
  }
  /**
   * @param {unknown} o
   * @returns {boolean}
   */
  equals(o) {
    if (!(o instanceof _Dict) || this.size !== o.size) {
      return false;
    }
    let equal = true;
    this.forEach((v, k) => {
      equal = equal && isEqual(o.get(k, !v), v);
    });
    return equal;
  }
};

// build/dev/javascript/gleam_stdlib/gleam_stdlib.mjs
var Nil = void 0;
var NOT_FOUND = {};
function identity(x) {
  return x;
}
function to_string(term) {
  return term.toString();
}
function string_length(string3) {
  if (string3 === "") {
    return 0;
  }
  const iterator = graphemes_iterator(string3);
  if (iterator) {
    let i = 0;
    for (const _ of iterator) {
      i++;
    }
    return i;
  } else {
    return string3.match(/./gsu).length;
  }
}
function graphemes(string3) {
  const iterator = graphemes_iterator(string3);
  if (iterator) {
    return List.fromArray(Array.from(iterator).map((item) => item.segment));
  } else {
    return List.fromArray(string3.match(/./gsu));
  }
}
function graphemes_iterator(string3) {
  if (globalThis.Intl && Intl.Segmenter) {
    return new Intl.Segmenter().segment(string3)[Symbol.iterator]();
  }
}
function split(xs, pattern) {
  return List.fromArray(xs.split(pattern));
}
function concat2(xs) {
  let result = "";
  for (const x of xs) {
    result = result + x;
  }
  return result;
}
var unicode_whitespaces = [
  " ",
  // Space
  "	",
  // Horizontal tab
  "\n",
  // Line feed
  "\v",
  // Vertical tab
  "\f",
  // Form feed
  "\r",
  // Carriage return
  "\x85",
  // Next line
  "\u2028",
  // Line separator
  "\u2029"
  // Paragraph separator
].join("");
var left_trim_regex = new RegExp(`^([${unicode_whitespaces}]*)`, "g");
var right_trim_regex = new RegExp(`([${unicode_whitespaces}]*)$`, "g");
function map_get(map7, key) {
  const value3 = map7.get(key, NOT_FOUND);
  if (value3 === NOT_FOUND) {
    return new Error(Nil);
  }
  return new Ok(value3);
}
function classify_dynamic(data) {
  if (typeof data === "string") {
    return "String";
  } else if (typeof data === "boolean") {
    return "Bool";
  } else if (data instanceof Result) {
    return "Result";
  } else if (data instanceof List) {
    return "List";
  } else if (data instanceof BitArray) {
    return "BitArray";
  } else if (data instanceof Dict) {
    return "Dict";
  } else if (Number.isInteger(data)) {
    return "Int";
  } else if (Array.isArray(data)) {
    return `Tuple of ${data.length} elements`;
  } else if (typeof data === "number") {
    return "Float";
  } else if (data === null) {
    return "Null";
  } else if (data === void 0) {
    return "Nil";
  } else {
    const type = typeof data;
    return type.charAt(0).toUpperCase() + type.slice(1);
  }
}
function decoder_error(expected, got) {
  return decoder_error_no_classify(expected, classify_dynamic(got));
}
function decoder_error_no_classify(expected, got) {
  return new Error(
    List.fromArray([new DecodeError(expected, got, List.fromArray([]))])
  );
}
function decode_string(data) {
  return typeof data === "string" ? new Ok(data) : decoder_error("String", data);
}
function decode_int(data) {
  return Number.isInteger(data) ? new Ok(data) : decoder_error("Int", data);
}
function decode_list(data) {
  if (Array.isArray(data)) {
    return new Ok(List.fromArray(data));
  }
  return data instanceof List ? new Ok(data) : decoder_error("List", data);
}
function decode_field(value3, name2) {
  const not_a_map_error = () => decoder_error("Dict", value3);
  if (value3 instanceof Dict || value3 instanceof WeakMap || value3 instanceof Map) {
    const entry = map_get(value3, name2);
    return new Ok(entry.isOk() ? new Some(entry[0]) : new None());
  } else if (value3 === null) {
    return not_a_map_error();
  } else if (Object.getPrototypeOf(value3) == Object.prototype) {
    return try_get_field(value3, name2, () => new Ok(new None()));
  } else {
    return try_get_field(value3, name2, not_a_map_error);
  }
}
function try_get_field(value3, field2, or_else) {
  try {
    return field2 in value3 ? new Ok(new Some(value3[field2])) : or_else();
  } catch {
    return or_else();
  }
}

// build/dev/javascript/gleam_stdlib/gleam/iterator.mjs
var Stop = class extends CustomType {
};
var Continue2 = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};
var Iterator = class extends CustomType {
  constructor(continuation) {
    super();
    this.continuation = continuation;
  }
};
var Next = class extends CustomType {
  constructor(element2, accumulator) {
    super();
    this.element = element2;
    this.accumulator = accumulator;
  }
};
function stop() {
  return new Stop();
}
function do_unfold(initial, f) {
  return () => {
    let $ = f(initial);
    if ($ instanceof Next) {
      let x = $.element;
      let acc = $.accumulator;
      return new Continue2(x, do_unfold(acc, f));
    } else {
      return new Stop();
    }
  };
}
function unfold(initial, f) {
  let _pipe = initial;
  let _pipe$1 = do_unfold(_pipe, f);
  return new Iterator(_pipe$1);
}
function repeatedly(f) {
  return unfold(void 0, (_) => {
    return new Next(f(), void 0);
  });
}
function repeat2(x) {
  return repeatedly(() => {
    return x;
  });
}
function do_fold(loop$continuation, loop$f, loop$accumulator) {
  while (true) {
    let continuation = loop$continuation;
    let f = loop$f;
    let accumulator = loop$accumulator;
    let $ = continuation();
    if ($ instanceof Continue2) {
      let elem = $[0];
      let next = $[1];
      loop$continuation = next;
      loop$f = f;
      loop$accumulator = f(accumulator, elem);
    } else {
      return accumulator;
    }
  }
}
function fold2(iterator, initial, f) {
  let _pipe = iterator.continuation;
  return do_fold(_pipe, f, initial);
}
function to_list(iterator) {
  let _pipe = iterator;
  let _pipe$1 = fold2(
    _pipe,
    toList([]),
    (acc, e) => {
      return prepend(e, acc);
    }
  );
  return reverse(_pipe$1);
}
function do_take2(continuation, desired) {
  return () => {
    let $ = desired > 0;
    if (!$) {
      return new Stop();
    } else {
      let $1 = continuation();
      if ($1 instanceof Stop) {
        return new Stop();
      } else {
        let e = $1[0];
        let next = $1[1];
        return new Continue2(e, do_take2(next, desired - 1));
      }
    }
  };
}
function take2(iterator, desired) {
  let _pipe = iterator.continuation;
  let _pipe$1 = do_take2(_pipe, desired);
  return new Iterator(_pipe$1);
}
function do_append2(first3, second2) {
  let $ = first3();
  if ($ instanceof Continue2) {
    let e = $[0];
    let first$1 = $[1];
    return new Continue2(e, () => {
      return do_append2(first$1, second2);
    });
  } else {
    return second2();
  }
}
function append3(first3, second2) {
  let _pipe = () => {
    return do_append2(first3.continuation, second2.continuation);
  };
  return new Iterator(_pipe);
}
function once(f) {
  let _pipe = () => {
    return new Continue2(f(), stop);
  };
  return new Iterator(_pipe);
}
function single(elem) {
  return once(() => {
    return elem;
  });
}

// build/dev/javascript/gleam_stdlib/gleam/string.mjs
function length2(string3) {
  return string_length(string3);
}
function concat3(strings) {
  let _pipe = strings;
  let _pipe$1 = from_strings(_pipe);
  return to_string3(_pipe$1);
}
function do_slice(string3, idx, len) {
  let _pipe = string3;
  let _pipe$1 = graphemes(_pipe);
  let _pipe$2 = drop(_pipe$1, idx);
  let _pipe$3 = take(_pipe$2, len);
  return concat3(_pipe$3);
}
function slice(string3, idx, len) {
  let $ = len < 0;
  if ($) {
    return "";
  } else {
    let $1 = idx < 0;
    if ($1) {
      let translated_idx = length2(string3) + idx;
      let $2 = translated_idx < 0;
      if ($2) {
        return "";
      } else {
        return do_slice(string3, translated_idx, len);
      }
    } else {
      return do_slice(string3, idx, len);
    }
  }
}
function split3(x, substring) {
  if (substring === "") {
    return graphemes(x);
  } else {
    let _pipe = x;
    let _pipe$1 = from_string(_pipe);
    let _pipe$2 = split2(_pipe$1, substring);
    return map(_pipe$2, to_string3);
  }
}
function padding(size, pad_string) {
  let pad_length = length2(pad_string);
  let num_pads = divideInt(size, pad_length);
  let extra = remainderInt(size, pad_length);
  let _pipe = repeat2(pad_string);
  let _pipe$1 = take2(_pipe, num_pads);
  return append3(
    _pipe$1,
    single(slice(pad_string, 0, extra))
  );
}
function pad_left(string3, desired_length, pad_string) {
  let current_length = length2(string3);
  let to_pad_length = desired_length - current_length;
  let _pipe = padding(to_pad_length, pad_string);
  let _pipe$1 = append3(_pipe, single(string3));
  let _pipe$2 = to_list(_pipe$1);
  return concat3(_pipe$2);
}

// build/dev/javascript/gleam_stdlib/gleam/uri.mjs
var Uri = class extends CustomType {
  constructor(scheme, userinfo, host, port, path, query, fragment) {
    super();
    this.scheme = scheme;
    this.userinfo = userinfo;
    this.host = host;
    this.port = port;
    this.path = path;
    this.query = query;
    this.fragment = fragment;
  }
};
function do_remove_dot_segments(loop$input, loop$accumulator) {
  while (true) {
    let input2 = loop$input;
    let accumulator = loop$accumulator;
    if (input2.hasLength(0)) {
      return reverse(accumulator);
    } else {
      let segment = input2.head;
      let rest = input2.tail;
      let accumulator$1 = (() => {
        if (segment === "") {
          let accumulator$12 = accumulator;
          return accumulator$12;
        } else if (segment === ".") {
          let accumulator$12 = accumulator;
          return accumulator$12;
        } else if (segment === ".." && accumulator.hasLength(0)) {
          return toList([]);
        } else if (segment === ".." && accumulator.atLeastLength(1)) {
          let accumulator$12 = accumulator.tail;
          return accumulator$12;
        } else {
          let segment$1 = segment;
          let accumulator$12 = accumulator;
          return prepend(segment$1, accumulator$12);
        }
      })();
      loop$input = rest;
      loop$accumulator = accumulator$1;
    }
  }
}
function remove_dot_segments(input2) {
  return do_remove_dot_segments(input2, toList([]));
}
function path_segments(path) {
  return remove_dot_segments(split3(path, "/"));
}

// build/dev/javascript/gleam_stdlib/gleam/bool.mjs
function guard(requirement, consequence, alternative) {
  if (requirement) {
    return consequence;
  } else {
    return alternative();
  }
}

// build/dev/javascript/gleam_json/gleam_json_ffi.mjs
function decode(string3) {
  try {
    const result = JSON.parse(string3);
    return new Ok(result);
  } catch (err) {
    return new Error(getJsonDecodeError(err, string3));
  }
}
function getJsonDecodeError(stdErr, json) {
  if (isUnexpectedEndOfInput(stdErr))
    return new UnexpectedEndOfInput();
  return toUnexpectedByteError(stdErr, json);
}
function isUnexpectedEndOfInput(err) {
  const unexpectedEndOfInputRegex = /((unexpected (end|eof))|(end of data)|(unterminated string)|(json( parse error|\.parse)\: expected '(\:|\}|\])'))/i;
  return unexpectedEndOfInputRegex.test(err.message);
}
function toUnexpectedByteError(err, json) {
  let converters = [
    v8UnexpectedByteError,
    oldV8UnexpectedByteError,
    jsCoreUnexpectedByteError,
    spidermonkeyUnexpectedByteError
  ];
  for (let converter of converters) {
    let result = converter(err, json);
    if (result)
      return result;
  }
  return new UnexpectedByte("", 0);
}
function v8UnexpectedByteError(err) {
  const regex = /unexpected token '(.)', ".+" is not valid JSON/i;
  const match = regex.exec(err.message);
  if (!match)
    return null;
  const byte = toHex(match[1]);
  return new UnexpectedByte(byte, -1);
}
function oldV8UnexpectedByteError(err) {
  const regex = /unexpected token (.) in JSON at position (\d+)/i;
  const match = regex.exec(err.message);
  if (!match)
    return null;
  const byte = toHex(match[1]);
  const position = Number(match[2]);
  return new UnexpectedByte(byte, position);
}
function spidermonkeyUnexpectedByteError(err, json) {
  const regex = /(unexpected character|expected .*) at line (\d+) column (\d+)/i;
  const match = regex.exec(err.message);
  if (!match)
    return null;
  const line = Number(match[2]);
  const column = Number(match[3]);
  const position = getPositionFromMultiline(line, column, json);
  const byte = toHex(json[position]);
  return new UnexpectedByte(byte, position);
}
function jsCoreUnexpectedByteError(err) {
  const regex = /unexpected (identifier|token) "(.)"/i;
  const match = regex.exec(err.message);
  if (!match)
    return null;
  const byte = toHex(match[2]);
  return new UnexpectedByte(byte, 0);
}
function toHex(char) {
  return "0x" + char.charCodeAt(0).toString(16).toUpperCase();
}
function getPositionFromMultiline(line, column, string3) {
  if (line === 1)
    return column - 1;
  let currentLn = 1;
  let position = 0;
  string3.split("").find((char, idx) => {
    if (char === "\n")
      currentLn += 1;
    if (currentLn === line) {
      position = idx + column;
      return true;
    }
    return false;
  });
  return position;
}

// build/dev/javascript/gleam_json/gleam/json.mjs
var UnexpectedEndOfInput = class extends CustomType {
};
var UnexpectedByte = class extends CustomType {
  constructor(byte, position) {
    super();
    this.byte = byte;
    this.position = position;
  }
};
var UnexpectedFormat = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
function do_decode(json, decoder) {
  return then$(
    decode(json),
    (dynamic_value) => {
      let _pipe = decoder(dynamic_value);
      return map_error(
        _pipe,
        (var0) => {
          return new UnexpectedFormat(var0);
        }
      );
    }
  );
}
function decode4(json, decoder) {
  return do_decode(json, decoder);
}

// build/dev/javascript/lustre/lustre/effect.mjs
var Effect = class extends CustomType {
  constructor(all) {
    super();
    this.all = all;
  }
};
function from(effect) {
  return new Effect(toList([(dispatch, _) => {
    return effect(dispatch);
  }]));
}
function none() {
  return new Effect(toList([]));
}
function batch(effects) {
  return new Effect(
    fold(
      effects,
      toList([]),
      (b, _use1) => {
        let a2 = _use1.all;
        return append2(b, a2);
      }
    )
  );
}
function map4(effect, f) {
  return new Effect(
    map(
      effect.all,
      (eff) => {
        return (dispatch, emit2) => {
          return eff((msg) => {
            return dispatch(f(msg));
          }, emit2);
        };
      }
    )
  );
}

// build/dev/javascript/lustre/lustre/internals/vdom.mjs
var Text = class extends CustomType {
  constructor(content) {
    super();
    this.content = content;
  }
};
var Element = class extends CustomType {
  constructor(key, namespace, tag, attrs, children, self_closing, void$) {
    super();
    this.key = key;
    this.namespace = namespace;
    this.tag = tag;
    this.attrs = attrs;
    this.children = children;
    this.self_closing = self_closing;
    this.void = void$;
  }
};
var Map2 = class extends CustomType {
  constructor(subtree) {
    super();
    this.subtree = subtree;
  }
};
var Fragment = class extends CustomType {
  constructor(elements, key) {
    super();
    this.elements = elements;
    this.key = key;
  }
};
var Attribute = class extends CustomType {
  constructor(x0, x1, as_property) {
    super();
    this[0] = x0;
    this[1] = x1;
    this.as_property = as_property;
  }
};
var Event = class extends CustomType {
  constructor(x0, x1) {
    super();
    this[0] = x0;
    this[1] = x1;
  }
};

// build/dev/javascript/lustre/lustre/attribute.mjs
function attribute(name2, value3) {
  return new Attribute(name2, identity(value3), false);
}
function property(name2, value3) {
  return new Attribute(name2, identity(value3), true);
}
function on(name2, handler) {
  return new Event("on" + name2, handler);
}
function map5(attr, f) {
  if (attr instanceof Attribute) {
    let name$1 = attr[0];
    let value$1 = attr[1];
    let as_property = attr.as_property;
    return new Attribute(name$1, value$1, as_property);
  } else {
    let on$1 = attr[0];
    let handler = attr[1];
    return new Event(on$1, (e) => {
      return map2(handler(e), f);
    });
  }
}
function class$(name2) {
  return attribute("class", name2);
}
function id(name2) {
  return attribute("id", name2);
}
function type_(name2) {
  return attribute("type", name2);
}
function value(val) {
  return attribute("value", val);
}
function disabled(is_disabled) {
  return property("disabled", is_disabled);
}
function name(name2) {
  return attribute("name", name2);
}
function for$(id2) {
  return attribute("for", id2);
}
function href(uri) {
  return attribute("href", uri);
}

// build/dev/javascript/lustre/lustre/element.mjs
function element(tag, attrs, children) {
  if (tag === "area") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "base") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "br") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "col") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "embed") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "hr") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "img") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "input") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "link") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "meta") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "param") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "source") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "track") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else if (tag === "wbr") {
    return new Element("", "", tag, attrs, toList([]), false, true);
  } else {
    return new Element("", "", tag, attrs, children, false, false);
  }
}
function text(content) {
  return new Text(content);
}
function map6(element2, f) {
  if (element2 instanceof Text) {
    let content = element2.content;
    return new Text(content);
  } else if (element2 instanceof Map2) {
    let subtree = element2.subtree;
    return new Map2(() => {
      return map6(subtree(), f);
    });
  } else if (element2 instanceof Element) {
    let key = element2.key;
    let namespace = element2.namespace;
    let tag = element2.tag;
    let attrs = element2.attrs;
    let children = element2.children;
    let self_closing = element2.self_closing;
    let void$ = element2.void;
    return new Map2(
      () => {
        return new Element(
          key,
          namespace,
          tag,
          map(
            attrs,
            (_capture) => {
              return map5(_capture, f);
            }
          ),
          map(children, (_capture) => {
            return map6(_capture, f);
          }),
          self_closing,
          void$
        );
      }
    );
  } else {
    let elements = element2.elements;
    let key = element2.key;
    return new Map2(
      () => {
        return new Fragment(
          map(elements, (_capture) => {
            return map6(_capture, f);
          }),
          key
        );
      }
    );
  }
}

// build/dev/javascript/lustre/lustre/internals/runtime.mjs
var Debug = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Dispatch = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var Shutdown = class extends CustomType {
};
var ForceModel = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};

// build/dev/javascript/lustre/vdom.ffi.mjs
function morph(prev, next, dispatch, isComponent = false) {
  let out;
  let stack = [{ prev, next, parent: prev.parentNode }];
  while (stack.length) {
    let { prev: prev2, next: next2, parent } = stack.pop();
    if (next2.subtree !== void 0)
      next2 = next2.subtree();
    if (next2.content !== void 0) {
      if (!prev2) {
        const created = document.createTextNode(next2.content);
        parent.appendChild(created);
        out ??= created;
      } else if (prev2.nodeType === Node.TEXT_NODE) {
        if (prev2.textContent !== next2.content)
          prev2.textContent = next2.content;
        out ??= prev2;
      } else {
        const created = document.createTextNode(next2.content);
        parent.replaceChild(created, prev2);
        out ??= created;
      }
    } else if (next2.tag !== void 0) {
      const created = createElementNode({
        prev: prev2,
        next: next2,
        dispatch,
        stack,
        isComponent
      });
      if (!prev2) {
        parent.appendChild(created);
      } else if (prev2 !== created) {
        parent.replaceChild(created, prev2);
      }
      out ??= created;
    } else if (next2.elements !== void 0) {
      iterateElement(next2, (fragmentElement) => {
        stack.unshift({ prev: prev2, next: fragmentElement, parent });
        prev2 = prev2?.nextSibling;
      });
    } else if (next2.subtree !== void 0) {
      stack.push({ prev: prev2, next: next2, parent });
    }
  }
  return out;
}
function createElementNode({ prev, next, dispatch, stack }) {
  const namespace = next.namespace || "http://www.w3.org/1999/xhtml";
  const canMorph = prev && prev.nodeType === Node.ELEMENT_NODE && prev.localName === next.tag && prev.namespaceURI === (next.namespace || "http://www.w3.org/1999/xhtml");
  const el2 = canMorph ? prev : namespace ? document.createElementNS(namespace, next.tag) : document.createElement(next.tag);
  let handlersForEl;
  if (!registeredHandlers.has(el2)) {
    const emptyHandlers = /* @__PURE__ */ new Map();
    registeredHandlers.set(el2, emptyHandlers);
    handlersForEl = emptyHandlers;
  } else {
    handlersForEl = registeredHandlers.get(el2);
  }
  const prevHandlers = canMorph ? new Set(handlersForEl.keys()) : null;
  const prevAttributes = canMorph ? new Set(Array.from(prev.attributes, (a2) => a2.name)) : null;
  let className = null;
  let style = null;
  let innerHTML = null;
  for (const attr of next.attrs) {
    const name2 = attr[0];
    const value3 = attr[1];
    if (attr.as_property) {
      if (el2[name2] !== value3)
        el2[name2] = value3;
      if (canMorph)
        prevAttributes.delete(name2);
    } else if (name2.startsWith("on")) {
      const eventName = name2.slice(2);
      const callback = dispatch(value3);
      if (!handlersForEl.has(eventName)) {
        el2.addEventListener(eventName, lustreGenericEventHandler);
      }
      handlersForEl.set(eventName, callback);
      if (canMorph)
        prevHandlers.delete(eventName);
    } else if (name2.startsWith("data-lustre-on-")) {
      const eventName = name2.slice(15);
      const callback = dispatch(lustreServerEventHandler);
      if (!handlersForEl.has(eventName)) {
        el2.addEventListener(eventName, lustreGenericEventHandler);
      }
      handlersForEl.set(eventName, callback);
      el2.setAttribute(name2, value3);
    } else if (name2 === "class") {
      className = className === null ? value3 : className + " " + value3;
    } else if (name2 === "style") {
      style = style === null ? value3 : style + value3;
    } else if (name2 === "dangerous-unescaped-html") {
      innerHTML = value3;
    } else {
      if (el2.getAttribute(name2) !== value3)
        el2.setAttribute(name2, value3);
      if (name2 === "value" || name2 === "selected")
        el2[name2] = value3;
      if (canMorph)
        prevAttributes.delete(name2);
    }
  }
  if (className !== null) {
    el2.setAttribute("class", className);
    if (canMorph)
      prevAttributes.delete("class");
  }
  if (style !== null) {
    el2.setAttribute("style", style);
    if (canMorph)
      prevAttributes.delete("style");
  }
  if (canMorph) {
    for (const attr of prevAttributes) {
      el2.removeAttribute(attr);
    }
    for (const eventName of prevHandlers) {
      handlersForEl.delete(eventName);
      el2.removeEventListener(eventName, lustreGenericEventHandler);
    }
  }
  if (next.key !== void 0 && next.key !== "") {
    el2.setAttribute("data-lustre-key", next.key);
  } else if (innerHTML !== null) {
    el2.innerHTML = innerHTML;
    return el2;
  }
  let prevChild = el2.firstChild;
  let seenKeys = null;
  let keyedChildren = null;
  let incomingKeyedChildren = null;
  let firstChild = next.children[Symbol.iterator]().next().value;
  if (canMorph && firstChild !== void 0 && // Explicit checks are more verbose but truthy checks force a bunch of comparisons
  // we don't care about: it's never gonna be a number etc.
  firstChild.key !== void 0 && firstChild.key !== "") {
    seenKeys = /* @__PURE__ */ new Set();
    keyedChildren = getKeyedChildren(prev);
    incomingKeyedChildren = getKeyedChildren(next);
  }
  for (const child of next.children) {
    iterateElement(child, (currElement) => {
      if (currElement.key !== void 0 && seenKeys !== null) {
        prevChild = diffKeyedChild(
          prevChild,
          currElement,
          el2,
          stack,
          incomingKeyedChildren,
          keyedChildren,
          seenKeys
        );
      } else {
        stack.unshift({ prev: prevChild, next: currElement, parent: el2 });
        prevChild = prevChild?.nextSibling;
      }
    });
  }
  while (prevChild) {
    const next2 = prevChild.nextSibling;
    el2.removeChild(prevChild);
    prevChild = next2;
  }
  return el2;
}
var registeredHandlers = /* @__PURE__ */ new WeakMap();
function lustreGenericEventHandler(event2) {
  const target = event2.currentTarget;
  if (!registeredHandlers.has(target)) {
    target.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  const handlersForEventTarget = registeredHandlers.get(target);
  if (!handlersForEventTarget.has(event2.type)) {
    target.removeEventListener(event2.type, lustreGenericEventHandler);
    return;
  }
  handlersForEventTarget.get(event2.type)(event2);
}
function lustreServerEventHandler(event2) {
  const el2 = event2.currentTarget;
  const tag = el2.getAttribute(`data-lustre-on-${event2.type}`);
  const data = JSON.parse(el2.getAttribute("data-lustre-data") || "{}");
  const include = JSON.parse(el2.getAttribute("data-lustre-include") || "[]");
  switch (event2.type) {
    case "input":
    case "change":
      include.push("target.value");
      break;
  }
  return {
    tag,
    data: include.reduce(
      (data2, property2) => {
        const path = property2.split(".");
        for (let i = 0, o = data2, e = event2; i < path.length; i++) {
          if (i === path.length - 1) {
            o[path[i]] = e[path[i]];
          } else {
            o[path[i]] ??= {};
            e = e[path[i]];
            o = o[path[i]];
          }
        }
        return data2;
      },
      { data }
    )
  };
}
function getKeyedChildren(el2) {
  const keyedChildren = /* @__PURE__ */ new Map();
  if (el2) {
    for (const child of el2.children) {
      iterateElement(child, (currElement) => {
        const key = currElement?.key || currElement?.getAttribute?.("data-lustre-key");
        if (key)
          keyedChildren.set(key, currElement);
      });
    }
  }
  return keyedChildren;
}
function diffKeyedChild(prevChild, child, el2, stack, incomingKeyedChildren, keyedChildren, seenKeys) {
  while (prevChild && !incomingKeyedChildren.has(prevChild.getAttribute("data-lustre-key"))) {
    const nextChild = prevChild.nextSibling;
    el2.removeChild(prevChild);
    prevChild = nextChild;
  }
  if (keyedChildren.size === 0) {
    iterateElement(child, (currChild) => {
      stack.unshift({ prev: prevChild, next: currChild, parent: el2 });
      prevChild = prevChild?.nextSibling;
    });
    return prevChild;
  }
  if (seenKeys.has(child.key)) {
    console.warn(`Duplicate key found in Lustre vnode: ${child.key}`);
    stack.unshift({ prev: null, next: child, parent: el2 });
    return prevChild;
  }
  seenKeys.add(child.key);
  const keyedChild = keyedChildren.get(child.key);
  if (!keyedChild && !prevChild) {
    stack.unshift({ prev: null, next: child, parent: el2 });
    return prevChild;
  }
  if (!keyedChild && prevChild !== null) {
    const placeholder = document.createTextNode("");
    el2.insertBefore(placeholder, prevChild);
    stack.unshift({ prev: placeholder, next: child, parent: el2 });
    return prevChild;
  }
  if (!keyedChild || keyedChild === prevChild) {
    stack.unshift({ prev: prevChild, next: child, parent: el2 });
    prevChild = prevChild?.nextSibling;
    return prevChild;
  }
  el2.insertBefore(keyedChild, prevChild);
  stack.unshift({ prev: keyedChild, next: child, parent: el2 });
  return prevChild;
}
function iterateElement(element2, processElement) {
  if (element2.elements !== void 0) {
    for (const currElement of element2.elements) {
      iterateElement(currElement, processElement);
    }
  } else if (element2.subtree !== void 0) {
    iterateElement(element2.subtree(), processElement);
  } else {
    processElement(element2);
  }
}

// build/dev/javascript/lustre/client-runtime.ffi.mjs
var LustreClientApplication2 = class _LustreClientApplication {
  #root = null;
  #queue = [];
  #effects = [];
  #didUpdate = false;
  #isComponent = false;
  #model = null;
  #update = null;
  #view = null;
  static start(flags, selector, init9, update5, view5) {
    if (!is_browser())
      return new Error(new NotABrowser());
    const root2 = selector instanceof HTMLElement ? selector : document.querySelector(selector);
    if (!root2)
      return new Error(new ElementNotFound(selector));
    const app = new _LustreClientApplication(init9(flags), update5, view5, root2);
    return new Ok((msg) => app.send(msg));
  }
  constructor([model, effects], update5, view5, root2 = document.body, isComponent = false) {
    this.#model = model;
    this.#update = update5;
    this.#view = view5;
    this.#root = root2;
    this.#effects = effects.all.toArray();
    this.#didUpdate = true;
    this.#isComponent = isComponent;
    window.requestAnimationFrame(() => this.#tick());
  }
  send(action) {
    switch (true) {
      case action instanceof Dispatch: {
        this.#queue.push(action[0]);
        this.#tick();
        return;
      }
      case action instanceof Shutdown: {
        this.#shutdown();
        return;
      }
      case action instanceof Debug: {
        this.#debug(action[0]);
        return;
      }
      default:
        return;
    }
  }
  emit(event2, data) {
    this.#root.dispatchEvent(
      new CustomEvent(event2, {
        bubbles: true,
        detail: data,
        composed: true
      })
    );
  }
  #tick() {
    this.#flush_queue();
    if (this.#didUpdate) {
      const vdom = this.#view(this.#model);
      const dispatch = (handler) => (e) => {
        const result = handler(e);
        if (result instanceof Ok) {
          this.send(new Dispatch(result[0]));
        }
      };
      this.#didUpdate = false;
      this.#root = morph(this.#root, vdom, dispatch, this.#isComponent);
    }
  }
  #flush_queue(iterations = 0) {
    while (this.#queue.length) {
      const [next, effects] = this.#update(this.#model, this.#queue.shift());
      this.#didUpdate ||= this.#model !== next;
      this.#model = next;
      this.#effects = this.#effects.concat(effects.all.toArray());
    }
    while (this.#effects.length) {
      this.#effects.shift()(
        (msg) => this.send(new Dispatch(msg)),
        (event2, data) => this.emit(event2, data)
      );
    }
    if (this.#queue.length) {
      if (iterations < 5) {
        this.#flush_queue(++iterations);
      } else {
        window.requestAnimationFrame(() => this.#tick());
      }
    }
  }
  #debug(action) {
    switch (true) {
      case action instanceof ForceModel: {
        const vdom = this.#view(action[0]);
        const dispatch = (handler) => (e) => {
          const result = handler(e);
          if (result instanceof Ok) {
            this.send(new Dispatch(result[0]));
          }
        };
        this.#queue = [];
        this.#effects = [];
        this.#didUpdate = false;
        this.#root = morph(this.#root, vdom, dispatch, this.#isComponent);
      }
    }
  }
  #shutdown() {
    this.#root.remove();
    this.#root = null;
    this.#model = null;
    this.#queue = [];
    this.#effects = [];
    this.#didUpdate = false;
    this.#update = () => {
    };
    this.#view = () => {
    };
  }
};
var start = (app, selector, flags) => LustreClientApplication2.start(
  flags,
  selector,
  app.init,
  app.update,
  app.view
);
var is_browser = () => globalThis.window && window.document;
var prevent_default = (event2) => event2.preventDefault();

// build/dev/javascript/lustre/lustre.mjs
var App = class extends CustomType {
  constructor(init9, update5, view5, on_attribute_change) {
    super();
    this.init = init9;
    this.update = update5;
    this.view = view5;
    this.on_attribute_change = on_attribute_change;
  }
};
var ElementNotFound = class extends CustomType {
  constructor(selector) {
    super();
    this.selector = selector;
  }
};
var NotABrowser = class extends CustomType {
};
function application(init9, update5, view5) {
  return new App(init9, update5, view5, new None());
}
function start3(app, selector, flags) {
  return guard(
    !is_browser(),
    new Error(new NotABrowser()),
    () => {
      return start(app, selector, flags);
    }
  );
}

// build/dev/javascript/lustre/lustre/element/html.mjs
function text2(content) {
  return text(content);
}
function h1(attrs, children) {
  return element("h1", attrs, children);
}
function h2(attrs, children) {
  return element("h2", attrs, children);
}
function nav(attrs, children) {
  return element("nav", attrs, children);
}
function div(attrs, children) {
  return element("div", attrs, children);
}
function li(attrs, children) {
  return element("li", attrs, children);
}
function p(attrs, children) {
  return element("p", attrs, children);
}
function ul(attrs, children) {
  return element("ul", attrs, children);
}
function a(attrs, children) {
  return element("a", attrs, children);
}
function table(attrs, children) {
  return element("table", attrs, children);
}
function tbody(attrs, children) {
  return element("tbody", attrs, children);
}
function td(attrs, children) {
  return element("td", attrs, children);
}
function th(attrs, children) {
  return element("th", attrs, children);
}
function thead(attrs, children) {
  return element("thead", attrs, children);
}
function tr(attrs, children) {
  return element("tr", attrs, children);
}
function button(attrs, children) {
  return element("button", attrs, children);
}
function form(attrs, children) {
  return element("form", attrs, children);
}
function input(attrs) {
  return element("input", attrs, toList([]));
}
function label(attrs, children) {
  return element("label", attrs, children);
}
function option(attrs, label2) {
  return element("option", attrs, toList([text(label2)]));
}
function select(attrs, children) {
  return element("select", attrs, children);
}

// build/dev/javascript/modem/modem.ffi.mjs
var defaults = {
  handle_external_links: false,
  handle_internal_links: true
};
var initial_location = window?.location?.href;
var do_init = (dispatch, options = defaults) => {
  document.addEventListener("click", (event2) => {
    const a2 = find_anchor(event2.target);
    if (!a2)
      return;
    try {
      const url = new URL(a2.href);
      const uri = uri_from_url(url);
      const is_external = url.host !== window.location.host;
      if (!options.handle_external_links && is_external)
        return;
      if (!options.handle_internal_links && !is_external)
        return;
      event2.preventDefault();
      if (!is_external) {
        window.history.pushState({}, "", a2.href);
        window.requestAnimationFrame(() => {
          if (url.hash) {
            document.getElementById(url.hash.slice(1))?.scrollIntoView();
          }
        });
      }
      return dispatch(uri);
    } catch {
      return;
    }
  });
  window.addEventListener("popstate", (e) => {
    e.preventDefault();
    const url = new URL(window.location.href);
    const uri = uri_from_url(url);
    window.requestAnimationFrame(() => {
      if (url.hash) {
        document.getElementById(url.hash.slice(1))?.scrollIntoView();
      }
    });
    dispatch(uri);
  });
  window.addEventListener("modem-push", ({ detail }) => {
    dispatch(detail);
  });
  window.addEventListener("modem-replace", ({ detail }) => {
    dispatch(detail);
  });
};
var find_anchor = (el2) => {
  if (!el2 || el2.tagName === "BODY") {
    return null;
  } else if (el2.tagName === "A") {
    return el2;
  } else {
    return find_anchor(el2.parentElement);
  }
};
var uri_from_url = (url) => {
  return new Uri(
    /* scheme   */
    url.protocol ? new Some(url.protocol.slice(0, -1)) : new None(),
    /* userinfo */
    new None(),
    /* host     */
    url.hostname ? new Some(url.hostname) : new None(),
    /* port     */
    url.port ? new Some(Number(url.port)) : new None(),
    /* path     */
    url.pathname,
    /* query    */
    url.search ? new Some(url.search.slice(1)) : new None(),
    /* fragment */
    url.hash ? new Some(url.hash.slice(1)) : new None()
  );
};

// build/dev/javascript/modem/modem.mjs
function init2(handler) {
  return from(
    (dispatch) => {
      return guard(
        !is_browser(),
        void 0,
        () => {
          return do_init(
            (uri) => {
              let _pipe = uri;
              let _pipe$1 = handler(_pipe);
              return dispatch(_pipe$1);
            }
          );
        }
      );
    }
  );
}

// build/dev/javascript/timetracker_gleam/components/basic.mjs
function horizontal_bar() {
  return div(
    toList([class$("border-b-2 border-b-surface-0")]),
    toList([])
  );
}
function header() {
  return div(
    toList([]),
    toList([
      h1(
        toList([class$("text-3xl")]),
        toList([text("Time tracker")])
      ),
      p(
        toList([]),
        toList([
          text("A small app to track your time spent on work items.")
        ])
      )
    ])
  );
}

// build/dev/javascript/timetracker_gleam/ffi.mjs
function readModelInfoFromLocalStorage() {
  let count = window.localStorage.getItem("count");
  let workItems = window.localStorage.getItem("work_items");
  let records = window.localStorage.getItem("records");
  count = count ? JSON.parse(count) : 0;
  workItems = workItems ? JSON.parse(workItems) : [];
  records = records ? JSON.parse(records) : [];
  let out = JSON.stringify({
    count,
    work_items: workItems,
    records
  });
  console.log(out);
  return out;
}
function linkedListToArray(list2) {
  if (list2 instanceof Empty) {
    return [];
  } else {
    return [list2.head].concat(linkedListToArray(list2.tail));
  }
}
function writeWorkItemsToLocalStorage(lst) {
  let js_lst = linkedListToArray(lst);
  window.localStorage.setItem("work_items", JSON.stringify(js_lst));
}
function writeRecordsToLocalStorage(lst) {
  let js_lst = linkedListToArray(lst);
  window.localStorage.setItem("records", JSON.stringify(js_lst));
}
function focusInput(id2) {
  window.requestAnimationFrame(() => {
    window.setTimeout(() => document.getElementById(id2).focus(), 0);
  });
}
function every(interval, cb) {
  window.__timer = window.setInterval(cb, interval);
}
function stop2(id2) {
  window.clearInterval(window.__timer);
}

// build/dev/javascript/timetracker_gleam/router.mjs
var Tracker = class extends CustomType {
};
var WorkItems = class extends CustomType {
};
var Analytics = class extends CustomType {
};
function on_route_change(uri) {
  let $ = path_segments(uri.path);
  if ($.hasLength(1) && $.head === "work-items") {
    return new WorkItems();
  } else if ($.hasLength(1) && $.head === "analytics") {
    return new Analytics();
  } else {
    return new Tracker();
  }
}
function init3() {
  return new Tracker();
}

// build/dev/javascript/timetracker_gleam/time.mjs
var Time = class extends CustomType {
  constructor(hours, minutes, seconds) {
    super();
    this.hours = hours;
    this.minutes = minutes;
    this.seconds = seconds;
  }
};
function from_seconds(s) {
  let seconds = remainderInt(s, 60);
  let minutes = remainderInt(divideInt(s, 60), 60);
  let hours = divideInt(divideInt(s, 60), 60);
  return new Time(hours, minutes, seconds);
}
function to_string7(t, simple) {
  let hours = (() => {
    let $ = t.hours;
    if ($ === 0 && simple) {
      return "";
    } else {
      let h = $;
      return to_string2(h) + ":";
    }
  })();
  let minutes = (() => {
    let $ = t.minutes;
    let $1 = t.hours;
    if ($ === 0 && $1 === 0 && simple) {
      return "";
    } else if ($1 === 0 && simple) {
      let m = $;
      return to_string2(m) + ":";
    } else {
      let m = $;
      return pad_left(to_string2(m), 2, "0") + ":";
    }
  })();
  let seconds = (() => {
    let $ = t.seconds;
    let $1 = t.minutes;
    if ($1 === 0 && simple) {
      let s = $;
      return to_string2(s);
    } else {
      let s = $;
      return pad_left(to_string2(s), 2, "0");
    }
  })();
  return hours + minutes + seconds;
}

// build/dev/javascript/timetracker_gleam/data/global.mjs
var WorkItem = class extends CustomType {
  constructor(id2, label2) {
    super();
    this.id = id2;
    this.label = label2;
  }
};
var Record = class extends CustomType {
  constructor(time, work_item_id, description) {
    super();
    this.time = time;
    this.work_item_id = work_item_id;
    this.description = description;
  }
};
var Model = class extends CustomType {
  constructor(current_route, work_items, records) {
    super();
    this.current_route = current_route;
    this.work_items = work_items;
    this.records = records;
  }
};
var LocalStorageModel = class extends CustomType {
  constructor(count, work_items, records) {
    super();
    this.count = count;
    this.work_items = work_items;
    this.records = records;
  }
};
function local_storage_model() {
  let work_item = decode2(
    (var0, var1) => {
      return new WorkItem(var0, var1);
    },
    field("id", string),
    field("label", string)
  );
  let time_decoder = decode3(
    (var0, var1, var2) => {
      return new Time(var0, var1, var2);
    },
    field("hours", int),
    field("minutes", int),
    field("seconds", int)
  );
  let record = decode3(
    (var0, var1, var2) => {
      return new Record(var0, var1, var2);
    },
    field("time", time_decoder),
    field("work_item_id", string),
    field("description", string)
  );
  return decode3(
    (var0, var1, var2) => {
      return new LocalStorageModel(var0, var1, var2);
    },
    field("count", int),
    field("work_items", list(work_item)),
    field("records", list(record))
  );
}
function init4() {
  let str_local_storage = readModelInfoFromLocalStorage();
  let $ = decode4(str_local_storage, local_storage_model());
  if (!$.isOk()) {
    throw makeError(
      "assignment_no_match",
      "data/global",
      65,
      "init",
      "Assignment pattern did not match",
      { value: $ }
    );
  }
  let local_storage_model$1 = $[0];
  return new Model(
    init3(),
    local_storage_model$1.work_items,
    local_storage_model$1.records
  );
}

// build/dev/javascript/lustre/lustre/event.mjs
function on2(name2, handler) {
  return on(name2, handler);
}
function on_click(msg) {
  return on2("click", (_) => {
    return new Ok(msg);
  });
}
function value2(event2) {
  let _pipe = event2;
  return field("target", field("value", string))(
    _pipe
  );
}
function on_input(msg) {
  return on2(
    "input",
    (event2) => {
      let _pipe = value2(event2);
      return map2(_pipe, msg);
    }
  );
}
function on_submit(msg) {
  return on2(
    "submit",
    (event2) => {
      let $ = prevent_default(event2);
      return new Ok(msg);
    }
  );
}

// build/dev/javascript/timetracker_gleam/pages/analytics.mjs
var Model2 = class extends CustomType {
  constructor(records) {
    super();
    this.records = records;
  }
};
function init5(global_model) {
  return new Model2(global_model.records);
}
function update(model, msg) {
  return [model, none()];
}
function analytics_table(model) {
  let headers = (() => {
    let _pipe = toList(["Work item ID", "Description", "Time"]);
    return map(
      _pipe,
      (label2) => {
        return th(
          toList([class$("w-1/3")]),
          toList([text2(label2)])
        );
      }
    );
  })();
  let rows = (() => {
    let _pipe = model.records;
    return index_map(
      _pipe,
      (rec, ix) => {
        let tr_cls = (() => {
          let $ = remainderInt(ix, 2) === 0;
          if ($) {
            return "";
          } else {
            return "bg-surface-0";
          }
        })();
        return tr(
          toList([class$(tr_cls)]),
          toList([
            td(
              toList([class$("text-center")]),
              toList([text2(rec.work_item_id)])
            ),
            td(
              toList([class$("text-center")]),
              toList([text2(rec.description)])
            ),
            td(
              toList([class$("text-center")]),
              toList([text2(to_string7(rec.time, false))])
            )
          ])
        );
      }
    );
  })();
  return table(
    toList([class$("w-full table-auto rounded-md")]),
    toList([
      thead(
        toList([class$("")]),
        toList([
          tr(
            toList([class$("bg-surface-2 text-white")]),
            headers
          )
        ])
      ),
      tbody(toList([]), rows)
    ])
  );
}
function view(model) {
  return analytics_table(model);
}

// build/dev/javascript/timetracker_gleam/pages/tracker.mjs
var Model3 = class extends CustomType {
  constructor(active, current_time, id2, description, work_items) {
    super();
    this.active = active;
    this.current_time = current_time;
    this.id = id2;
    this.description = description;
    this.work_items = work_items;
  }
};
var UserStartedTimer = class extends CustomType {
};
var UserStoppedTimer = class extends CustomType {
};
var UserUpdatedId = class extends CustomType {
  constructor(id2) {
    super();
    this.id = id2;
  }
};
var UserUpdatedDescription = class extends CustomType {
  constructor(desc) {
    super();
    this.desc = desc;
  }
};
var TimerUpdate = class extends CustomType {
};
var AddRecord = class extends CustomType {
  constructor(record) {
    super();
    this.record = record;
  }
};
function init6(global_model) {
  let id2 = (() => {
    let $ = global_model.work_items;
    if ($.atLeastLength(1)) {
      let first3 = $.head;
      return first3.id;
    } else {
      return "";
    }
  })();
  return new Model3(false, 0, id2, "", global_model.work_items);
}
function update2(model, msg) {
  if (msg instanceof TimerUpdate) {
    return [
      model.withFields({ current_time: model.current_time + 1 }),
      none()
    ];
  } else if (msg instanceof UserStartedTimer) {
    return [
      model.withFields({ active: true, current_time: 0 }),
      from(
        (dispatch) => {
          return every(
            1e3,
            () => {
              return dispatch(new TimerUpdate());
            }
          );
        }
      )
    ];
  } else if (msg instanceof UserStoppedTimer) {
    return [
      model.withFields({ active: false }),
      from(
        (dispatch) => {
          let record = new Record(
            from_seconds(model.current_time),
            model.id,
            model.description
          );
          stop2("__timer");
          return dispatch(new AddRecord(record));
        }
      )
    ];
  } else if (msg instanceof AddRecord) {
    return [model, none()];
  } else if (msg instanceof UserUpdatedId) {
    let id2 = msg.id;
    return [model.withFields({ id: id2 }), none()];
  } else {
    let desc = msg.desc;
    return [model.withFields({ description: desc }), none()];
  }
}
function timer_button(model) {
  let start_button = button(
    toList([
      class$(
        "rounded-full sm:h-4/5 h-32 aspect-square bg-green-500 hover:bg-green-600 duration-200 border-[3px] border-green-900 flex items-center justify-center"
      ),
      on_click(new UserStartedTimer())
    ]),
    toList([
      div(
        toList([
          class$(
            "ml-2 border-t-[15px] border-t-transparent border-b-transparent w-0 h-0 border-b-[15px] border-l-[25px] border-white"
          )
        ]),
        toList([])
      )
    ])
  );
  let timer = from_seconds(model.current_time);
  let style = (() => {
    if (timer instanceof Time && timer.hours === 0 && timer.minutes === 0) {
      return "text-3xl";
    } else if (timer instanceof Time && timer.hours === 0) {
      return "text-2xl";
    } else {
      return "text-xl";
    }
  })();
  let stop_button = button(
    toList([
      class$(
        "rounded-full sm:h-4/5 h-32 aspect-square bg-red-500 hover:bg-red-600 duration-200 border-[3px] border-red-900 flex items-center justify-center"
      ),
      on_click(new UserStoppedTimer())
    ]),
    toList([
      div(
        toList([class$("text-white text-semibold " + style)]),
        toList([text2(to_string7(timer, true))])
      )
    ])
  );
  let $ = model.active;
  if ($) {
    return stop_button;
  } else {
    return start_button;
  }
}
function view2(model) {
  return div(
    toList([class$("grow")]),
    toList([
      div(
        toList([
          class$(
            "w-full sm:h-32 h-96 rounded-lg bg-surface-0 flex sm:flex-nowrap  flex-wrap sm:px-8 py-2 items-center justify-center"
          )
        ]),
        toList([
          div(
            toList([class$("flex-col px-8")]),
            toList([
              form(
                toList([class$("flex flex-col gap-4 sm:w-full w-64")]),
                toList([
                  div(
                    toList([
                      class$(
                        "flex gap-2 sm:flex-nowrap flex-wrap justify-center"
                      )
                    ]),
                    toList([
                      label(
                        toList([
                          for$("work-item"),
                          class$(
                            "sm:min-w-32 min-w-full text-center"
                          )
                        ]),
                        toList([text2("Work item")])
                      ),
                      select(
                        toList([
                          name("selected-work-item"),
                          id("work-item"),
                          disabled(model.active),
                          class$(
                            "text-bg pl-2 rounded-md sm:min-w-64 min-w-full"
                          ),
                          value(model.id),
                          on_input(
                            (var0) => {
                              return new UserUpdatedId(var0);
                            }
                          )
                        ]),
                        (() => {
                          let _pipe = model.work_items;
                          return map(
                            _pipe,
                            (work_item) => {
                              return option(
                                toList([value(work_item.id)]),
                                work_item.label
                              );
                            }
                          );
                        })()
                      )
                    ])
                  ),
                  div(
                    toList([
                      class$(
                        "flex gap-2 sm:flex-nowrap flex-wrap justify-center"
                      )
                    ]),
                    toList([
                      label(
                        toList([
                          for$("work-item"),
                          class$(
                            "sm:min-w-32 min-w-full text-center"
                          )
                        ]),
                        toList([text2("Description")])
                      ),
                      input(
                        toList([
                          name("task-description"),
                          id("task-description"),
                          disabled(model.active),
                          class$(
                            "text-bg pl-2 rounded-md sm:min-w-64 min-w-full"
                          ),
                          value(model.description),
                          on_input(
                            (var0) => {
                              return new UserUpdatedDescription(var0);
                            }
                          )
                        ])
                      )
                    ])
                  )
                ])
              )
            ])
          ),
          div(
            toList([
              class$(
                "sm:grow-0 sm:h-full grow flex items-center justify-center"
              )
            ]),
            toList([timer_button(model)])
          )
        ])
      )
    ])
  );
}

// build/dev/javascript/timetracker_gleam/pages/work_items.mjs
var Model4 = class extends CustomType {
  constructor(modal_open, work_items, new_work_item_id, new_work_item_label) {
    super();
    this.modal_open = modal_open;
    this.work_items = work_items;
    this.new_work_item_id = new_work_item_id;
    this.new_work_item_label = new_work_item_label;
  }
};
var UserOpenedNewItemModal = class extends CustomType {
};
var UserClosedNewItemModal = class extends CustomType {
};
var UserUpdatedInputOfNewWorkItemId = class extends CustomType {
  constructor(id2) {
    super();
    this.id = id2;
  }
};
var UserUpdatedInputOfNewWorkItemLabel = class extends CustomType {
  constructor(label2) {
    super();
    this.label = label2;
  }
};
var UserAttemptedToAddNewItem = class extends CustomType {
  constructor(id2, label2) {
    super();
    this.id = id2;
    this.label = label2;
  }
};
var UserDeletedWorkItem = class extends CustomType {
  constructor(work_item) {
    super();
    this.work_item = work_item;
  }
};
function init7(global_model) {
  return new Model4(false, global_model.work_items, "", "");
}
function update3(model, msg) {
  if (msg instanceof UserOpenedNewItemModal) {
    return [
      model.withFields({
        modal_open: true,
        new_work_item_id: "",
        new_work_item_label: ""
      }),
      from((_) => {
        return focusInput("id-work-item");
      })
    ];
  } else if (msg instanceof UserDeletedWorkItem) {
    let wi = msg.work_item;
    let work_items = (() => {
      let _pipe = model.work_items;
      return filter(_pipe, (wi_) => {
        return wi_.id !== wi.id;
      });
    })();
    return [
      model.withFields({ work_items }),
      from(
        (_) => {
          return writeWorkItemsToLocalStorage(work_items);
        }
      )
    ];
  } else if (msg instanceof UserUpdatedInputOfNewWorkItemId) {
    let new_work_item_id = msg.id;
    return [
      model.withFields({ new_work_item_id }),
      none()
    ];
  } else if (msg instanceof UserUpdatedInputOfNewWorkItemLabel) {
    let new_work_item_label = msg.label;
    return [
      model.withFields({ new_work_item_label }),
      none()
    ];
  } else if (msg instanceof UserClosedNewItemModal) {
    return [model.withFields({ modal_open: false }), none()];
  } else {
    let id2 = msg.id;
    let label2 = msg.label;
    let work_item = new WorkItem(id2, label2);
    let work_items = append2(model.work_items, toList([work_item]));
    return [
      model.withFields({ work_items }),
      from(
        (dispatch) => {
          writeWorkItemsToLocalStorage(work_items);
          return dispatch(new UserClosedNewItemModal());
        }
      )
    ];
  }
}
function work_items_table(model) {
  let headers = (() => {
    let _pipe = toList(["ID", "Label", "Action"]);
    return map(
      _pipe,
      (label2) => {
        return th(
          toList([class$("w-1/3")]),
          toList([text2(label2)])
        );
      }
    );
  })();
  let rows = (() => {
    let _pipe = model.work_items;
    return index_map(
      _pipe,
      (wi, ix) => {
        let tr_cls = (() => {
          let $ = remainderInt(ix, 2) === 0;
          if ($) {
            return "";
          } else {
            return "bg-surface-0";
          }
        })();
        return tr(
          toList([class$(tr_cls)]),
          toList([
            td(
              toList([class$("text-center")]),
              toList([text2(wi.id)])
            ),
            td(
              toList([class$("text-center")]),
              toList([text2(wi.label)])
            ),
            td(
              toList([class$("text-center")]),
              toList([
                div(
                  toList([class$("")]),
                  toList([
                    button(
                      toList([
                        class$(
                          "px-4 py-1 my-3 hover:bg-red-700 bg-red-500 text-white duration-300 rounded-full"
                        ),
                        on_click(new UserDeletedWorkItem(wi))
                      ]),
                      toList([text2("Delete")])
                    )
                  ])
                )
              ])
            )
          ])
        );
      }
    );
  })();
  return table(
    toList([class$("w-full table-auto rounded-md")]),
    toList([
      thead(
        toList([class$("")]),
        toList([
          tr(
            toList([class$("bg-surface-2 text-white")]),
            headers
          )
        ])
      ),
      tbody(toList([]), rows)
    ])
  );
}
function work_item_modal(model) {
  let $ = (() => {
    let $1 = model.modal_open;
    if ($1) {
      return ["block", ""];
    } else {
      return ["hidden", "scale-75"];
    }
  })();
  let modal_display_cls = $[0];
  let modal_size = $[1];
  let actual_modal = div(
    toList([
      id("modal-add-work-item"),
      class$(
        "max-w-5xl w-full absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface-1 opacity-100 rounded-lg flex flex-col gap-4 p-4 z-999 duration-2000 transition " + modal_size
      )
    ]),
    toList([
      h2(
        toList([class$("text-xl font-semibold")]),
        toList([text2("Add new work item")])
      ),
      form(
        toList([
          class$("flex flex-col gap-4"),
          on_submit(
            new UserAttemptedToAddNewItem(
              model.new_work_item_id,
              model.new_work_item_label
            )
          )
        ]),
        toList([
          div(
            toList([class$("flex justify-center gap-4")]),
            toList([
              label(
                toList([class$("mb-1 mt-1 min-w-32")]),
                toList([text2("ID:")])
              ),
              input(
                toList([
                  id("id-work-item"),
                  type_("text"),
                  class$("text-bg rounded-md grow py-1 px-4"),
                  value(model.new_work_item_id),
                  on_input(
                    (var0) => {
                      return new UserUpdatedInputOfNewWorkItemId(var0);
                    }
                  )
                ])
              )
            ])
          ),
          div(
            toList([class$("flex justify-center gap-4")]),
            toList([
              label(
                toList([class$("mb-1 mt-1 min-w-32")]),
                toList([text2("Label:")])
              ),
              input(
                toList([
                  id("label-work-item"),
                  type_("text"),
                  class$("text-bg rounded-md grow px-4 py-1"),
                  value(model.new_work_item_label),
                  on_input(
                    (var0) => {
                      return new UserUpdatedInputOfNewWorkItemLabel(var0);
                    }
                  )
                ])
              )
            ])
          ),
          div(
            toList([class$("flex w-full gap-4")]),
            toList([
              input(
                toList([
                  class$(
                    "h-8 rounded-lg bg-teal-300 text-bg w-1/2 cursor-pointer"
                  ),
                  type_("submit"),
                  value("Save")
                ])
              ),
              button(
                toList([
                  class$("h-8 rounded-lg bg-red-400 text-bg w-1/2"),
                  on_click(new UserClosedNewItemModal()),
                  type_("button")
                ]),
                toList([text2("Cancel")])
              )
            ])
          )
        ])
      )
    ])
  );
  let background = div(
    toList([
      id("modal-bg"),
      class$("bg-bg opacity-90 w-screen h-screen z-990"),
      on_click(new UserClosedNewItemModal())
    ]),
    toList([])
  );
  return div(
    toList([
      id("modal-add-work-item-container"),
      class$(
        "absolute top-0 left-0 w-screen h-screen overflow-hidden z-1 flex flex-col " + modal_display_cls
      )
    ]),
    toList([
      div(
        toList([class$("w-full h-full relative")]),
        toList([background, actual_modal])
      )
    ])
  );
}
function view3(model) {
  return div(
    toList([class$("flex flex-col gap-4")]),
    toList([
      work_items_table(model),
      button(
        toList([
          class$("bg-catp-green w-full h-8 rounded-lg text-bg"),
          on_click(new UserOpenedNewItemModal())
        ]),
        toList([text2("Add new item")])
      ),
      work_item_modal(model)
    ])
  );
}

// build/dev/javascript/timetracker_gleam/timetracker_gleam.mjs
var Model5 = class extends CustomType {
  constructor(global, tracker, work_items, analytics) {
    super();
    this.global = global;
    this.tracker = tracker;
    this.work_items = work_items;
    this.analytics = analytics;
  }
};
var OnRouteChange = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var UpdatedWorkItems = class extends CustomType {
  constructor(work_items) {
    super();
    this.work_items = work_items;
  }
};
var AddRecord2 = class extends CustomType {
  constructor(rec) {
    super();
    this.rec = rec;
  }
};
var FromTrackerPage = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var FromWorkItemPage = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var FromAnalyticsPage = class extends CustomType {
  constructor(x0) {
    super();
    this[0] = x0;
  }
};
var NavItem = class extends CustomType {
  constructor(url, title, route) {
    super();
    this.url = url;
    this.title = title;
    this.route = route;
  }
};
function on_url_change(uri) {
  let _pipe = on_route_change(uri);
  return new OnRouteChange(_pipe);
}
function init8(_) {
  let global_model = init4();
  let model = new Model5(
    global_model,
    init6(global_model),
    init7(global_model),
    init5(global_model)
  );
  let my_effect = batch(toList([init2(on_url_change)]));
  return [model, my_effect];
}
function update4(model, msg) {
  let $ = (() => {
    if (msg instanceof OnRouteChange) {
      let route = msg[0];
      return [
        model.withFields({
          global: model.global.withFields({ current_route: route })
        }),
        none()
      ];
    } else if (msg instanceof FromAnalyticsPage) {
      let msg$1 = msg[0];
      let $1 = update(model.analytics, msg$1);
      let m = $1[0];
      let e = $1[1];
      return [
        model.withFields({ analytics: m }),
        map4(e, (var0) => {
          return new FromAnalyticsPage(var0);
        })
      ];
    } else if (msg instanceof FromTrackerPage) {
      let msg$1 = msg[0];
      let $1 = update2(model.tracker, msg$1);
      let m = $1[0];
      let e = $1[1];
      let e$1 = map4(e, (var0) => {
        return new FromTrackerPage(var0);
      });
      let global_effect = from(
        (dispatch) => {
          if (msg$1 instanceof AddRecord) {
            let rec = msg$1.record;
            dispatch(new AddRecord2(rec));
          } else {
          }
          return void 0;
        }
      );
      return [
        model.withFields({ tracker: m }),
        batch(toList([e$1, global_effect]))
      ];
    } else if (msg instanceof FromWorkItemPage) {
      let msg$1 = msg[0];
      let $1 = update3(model.work_items, msg$1);
      let m = $1[0];
      let e = $1[1];
      let e$1 = map4(e, (var0) => {
        return new FromWorkItemPage(var0);
      });
      let global_effect = (dispatch) => {
        if (msg$1 instanceof UserAttemptedToAddNewItem) {
          return dispatch(new UpdatedWorkItems(m.work_items));
        } else if (msg$1 instanceof UserDeletedWorkItem) {
          return dispatch(new UpdatedWorkItems(m.work_items));
        } else {
          return void 0;
        }
      };
      return [
        model.withFields({ work_items: m }),
        batch(toList([e$1, from(global_effect)]))
      ];
    } else if (msg instanceof UpdatedWorkItems) {
      let wis = msg.work_items;
      let global = model.global.withFields({ work_items: wis });
      let tracker = model.tracker.withFields({ work_items: wis });
      return [
        model.withFields({ global, tracker }),
        none()
      ];
    } else {
      let rec = msg.rec;
      let recs = append2(model.global.records, toList([rec]));
      let global = model.global.withFields({ records: recs });
      let analytics = new Model2(recs);
      return [
        model.withFields({ global, analytics }),
        from(
          (_) => {
            return writeRecordsToLocalStorage(recs);
          }
        )
      ];
    }
  })();
  let model$1 = $[0];
  let effect_ = $[1];
  return [model$1, effect_];
}
function nav_bar(items) {
  return div(
    toList([class$("w-full h-8 flex flex-col justify-center")]),
    toList([
      nav(
        toList([class$("w-full")]),
        toList([
          ul(
            toList([class$("flex w-full")]),
            (() => {
              let _pipe = items;
              return map(
                _pipe,
                (item) => {
                  return li(
                    toList([class$("mx-auto")]),
                    toList([
                      a(
                        toList([href(item.url)]),
                        toList([text2(item.title)])
                      )
                    ])
                  );
                }
              );
            })()
          )
        ])
      )
    ])
  );
}
function view4(model) {
  let nav_items = toList([
    new NavItem("/", "Tracker", new Tracker()),
    new NavItem("/work-items", "Work Items", new WorkItems()),
    new NavItem("/analytics", "Analytics", new Analytics())
  ]);
  let contents = (() => {
    let $ = model.global.current_route;
    if ($ instanceof Tracker) {
      let _pipe = view2(model.tracker);
      return map6(
        _pipe,
        (var0) => {
          return new FromTrackerPage(var0);
        }
      );
    } else if ($ instanceof Analytics) {
      let _pipe = view(model.analytics);
      return map6(
        _pipe,
        (var0) => {
          return new FromAnalyticsPage(var0);
        }
      );
    } else {
      let _pipe = view3(model.work_items);
      return map6(
        _pipe,
        (var0) => {
          return new FromWorkItemPage(var0);
        }
      );
    }
  })();
  return div(
    toList([
      class$(
        "text-white container p-4 mx-auto max-w-5xl sm:mt-8 mt-4 flex flex-col gap-4"
      )
    ]),
    toList([
      header(),
      horizontal_bar(),
      nav_bar(nav_items),
      horizontal_bar(),
      contents
    ])
  );
}
function main() {
  let app = application(init8, update4, view4);
  let $ = start3(app, "#app", void 0);
  if (!$.isOk()) {
    throw makeError(
      "assignment_no_match",
      "timetracker_gleam",
      189,
      "main",
      "Assignment pattern did not match",
      { value: $ }
    );
  }
  return void 0;
}

// build/.lustre/entry.mjs
main();
