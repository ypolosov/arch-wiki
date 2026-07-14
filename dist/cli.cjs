#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/kind-of/index.js
var require_kind_of = __commonJS({
  "node_modules/kind-of/index.js"(exports2, module2) {
    var toString = Object.prototype.toString;
    module2.exports = function kindOf(val) {
      if (val === void 0) return "undefined";
      if (val === null) return "null";
      var type = typeof val;
      if (type === "boolean") return "boolean";
      if (type === "string") return "string";
      if (type === "number") return "number";
      if (type === "symbol") return "symbol";
      if (type === "function") {
        return isGeneratorFn(val) ? "generatorfunction" : "function";
      }
      if (isArray(val)) return "array";
      if (isBuffer(val)) return "buffer";
      if (isArguments(val)) return "arguments";
      if (isDate(val)) return "date";
      if (isError(val)) return "error";
      if (isRegexp(val)) return "regexp";
      switch (ctorName(val)) {
        case "Symbol":
          return "symbol";
        case "Promise":
          return "promise";
        // Set, Map, WeakSet, WeakMap
        case "WeakMap":
          return "weakmap";
        case "WeakSet":
          return "weakset";
        case "Map":
          return "map";
        case "Set":
          return "set";
        // 8-bit typed arrays
        case "Int8Array":
          return "int8array";
        case "Uint8Array":
          return "uint8array";
        case "Uint8ClampedArray":
          return "uint8clampedarray";
        // 16-bit typed arrays
        case "Int16Array":
          return "int16array";
        case "Uint16Array":
          return "uint16array";
        // 32-bit typed arrays
        case "Int32Array":
          return "int32array";
        case "Uint32Array":
          return "uint32array";
        case "Float32Array":
          return "float32array";
        case "Float64Array":
          return "float64array";
      }
      if (isGeneratorObj(val)) {
        return "generator";
      }
      type = toString.call(val);
      switch (type) {
        case "[object Object]":
          return "object";
        // iterators
        case "[object Map Iterator]":
          return "mapiterator";
        case "[object Set Iterator]":
          return "setiterator";
        case "[object String Iterator]":
          return "stringiterator";
        case "[object Array Iterator]":
          return "arrayiterator";
      }
      return type.slice(8, -1).toLowerCase().replace(/\s/g, "");
    };
    function ctorName(val) {
      return typeof val.constructor === "function" ? val.constructor.name : null;
    }
    function isArray(val) {
      if (Array.isArray) return Array.isArray(val);
      return val instanceof Array;
    }
    function isError(val) {
      return val instanceof Error || typeof val.message === "string" && val.constructor && typeof val.constructor.stackTraceLimit === "number";
    }
    function isDate(val) {
      if (val instanceof Date) return true;
      return typeof val.toDateString === "function" && typeof val.getDate === "function" && typeof val.setDate === "function";
    }
    function isRegexp(val) {
      if (val instanceof RegExp) return true;
      return typeof val.flags === "string" && typeof val.ignoreCase === "boolean" && typeof val.multiline === "boolean" && typeof val.global === "boolean";
    }
    function isGeneratorFn(name, val) {
      return ctorName(name) === "GeneratorFunction";
    }
    function isGeneratorObj(val) {
      return typeof val.throw === "function" && typeof val.return === "function" && typeof val.next === "function";
    }
    function isArguments(val) {
      try {
        if (typeof val.length === "number" && typeof val.callee === "function") {
          return true;
        }
      } catch (err) {
        if (err.message.indexOf("callee") !== -1) {
          return true;
        }
      }
      return false;
    }
    function isBuffer(val) {
      if (val.constructor && typeof val.constructor.isBuffer === "function") {
        return val.constructor.isBuffer(val);
      }
      return false;
    }
  }
});

// node_modules/is-extendable/index.js
var require_is_extendable = __commonJS({
  "node_modules/is-extendable/index.js"(exports2, module2) {
    "use strict";
    module2.exports = function isExtendable(val) {
      return typeof val !== "undefined" && val !== null && (typeof val === "object" || typeof val === "function");
    };
  }
});

// node_modules/extend-shallow/index.js
var require_extend_shallow = __commonJS({
  "node_modules/extend-shallow/index.js"(exports2, module2) {
    "use strict";
    var isObject = require_is_extendable();
    module2.exports = function extend(o) {
      if (!isObject(o)) {
        o = {};
      }
      var len = arguments.length;
      for (var i = 1; i < len; i++) {
        var obj = arguments[i];
        if (isObject(obj)) {
          assign(o, obj);
        }
      }
      return o;
    };
    function assign(a, b) {
      for (var key in b) {
        if (hasOwn(b, key)) {
          a[key] = b[key];
        }
      }
    }
    function hasOwn(obj, key) {
      return Object.prototype.hasOwnProperty.call(obj, key);
    }
  }
});

// node_modules/section-matter/index.js
var require_section_matter = __commonJS({
  "node_modules/section-matter/index.js"(exports2, module2) {
    "use strict";
    var typeOf = require_kind_of();
    var extend = require_extend_shallow();
    module2.exports = function(input, options2) {
      if (typeof options2 === "function") {
        options2 = { parse: options2 };
      }
      var file = toObject(input);
      var defaults = { section_delimiter: "---", parse: identity };
      var opts = extend({}, defaults, options2);
      var delim = opts.section_delimiter;
      var lines = file.content.split(/\r?\n/);
      var sections = null;
      var section = createSection();
      var content = [];
      var stack = [];
      function initSections(val) {
        file.content = val;
        sections = [];
        content = [];
      }
      function closeSection(val) {
        if (stack.length) {
          section.key = getKey(stack[0], delim);
          section.content = val;
          opts.parse(section, sections);
          sections.push(section);
          section = createSection();
          content = [];
          stack = [];
        }
      }
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i];
        var len = stack.length;
        var ln = line.trim();
        if (isDelimiter(ln, delim)) {
          if (ln.length === 3 && i !== 0) {
            if (len === 0 || len === 2) {
              content.push(line);
              continue;
            }
            stack.push(ln);
            section.data = content.join("\n");
            content = [];
            continue;
          }
          if (sections === null) {
            initSections(content.join("\n"));
          }
          if (len === 2) {
            closeSection(content.join("\n"));
          }
          stack.push(ln);
          continue;
        }
        content.push(line);
      }
      if (sections === null) {
        initSections(content.join("\n"));
      } else {
        closeSection(content.join("\n"));
      }
      file.sections = sections;
      return file;
    };
    function isDelimiter(line, delim) {
      if (line.slice(0, delim.length) !== delim) {
        return false;
      }
      if (line.charAt(delim.length + 1) === delim.slice(-1)) {
        return false;
      }
      return true;
    }
    function toObject(input) {
      if (typeOf(input) !== "object") {
        input = { content: input };
      }
      if (typeof input.content !== "string" && !isBuffer(input.content)) {
        throw new TypeError("expected a buffer or string");
      }
      input.content = input.content.toString();
      input.sections = [];
      return input;
    }
    function getKey(val, delim) {
      return val ? val.slice(delim.length).trim() : "";
    }
    function createSection() {
      return { key: "", data: "", content: "" };
    }
    function identity(val) {
      return val;
    }
    function isBuffer(val) {
      if (val && val.constructor && typeof val.constructor.isBuffer === "function") {
        return val.constructor.isBuffer(val);
      }
      return false;
    }
  }
});

// node_modules/js-yaml/lib/js-yaml/common.js
var require_common = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/common.js"(exports2, module2) {
    "use strict";
    function isNothing(subject) {
      return typeof subject === "undefined" || subject === null;
    }
    function isObject(subject) {
      return typeof subject === "object" && subject !== null;
    }
    function toArray(sequence) {
      if (Array.isArray(sequence)) return sequence;
      else if (isNothing(sequence)) return [];
      return [sequence];
    }
    function extend(target, source) {
      var index, length, key, sourceKeys;
      if (source) {
        sourceKeys = Object.keys(source);
        for (index = 0, length = sourceKeys.length; index < length; index += 1) {
          key = sourceKeys[index];
          target[key] = source[key];
        }
      }
      return target;
    }
    function repeat(string, count) {
      var result = "", cycle;
      for (cycle = 0; cycle < count; cycle += 1) {
        result += string;
      }
      return result;
    }
    function isNegativeZero(number) {
      return number === 0 && Number.NEGATIVE_INFINITY === 1 / number;
    }
    module2.exports.isNothing = isNothing;
    module2.exports.isObject = isObject;
    module2.exports.toArray = toArray;
    module2.exports.repeat = repeat;
    module2.exports.isNegativeZero = isNegativeZero;
    module2.exports.extend = extend;
  }
});

// node_modules/js-yaml/lib/js-yaml/exception.js
var require_exception = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/exception.js"(exports2, module2) {
    "use strict";
    function YAMLException(reason, mark) {
      Error.call(this);
      this.name = "YAMLException";
      this.reason = reason;
      this.mark = mark;
      this.message = (this.reason || "(unknown reason)") + (this.mark ? " " + this.mark.toString() : "");
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, this.constructor);
      } else {
        this.stack = new Error().stack || "";
      }
    }
    YAMLException.prototype = Object.create(Error.prototype);
    YAMLException.prototype.constructor = YAMLException;
    YAMLException.prototype.toString = function toString(compact) {
      var result = this.name + ": ";
      result += this.reason || "(unknown reason)";
      if (!compact && this.mark) {
        result += " " + this.mark.toString();
      }
      return result;
    };
    module2.exports = YAMLException;
  }
});

// node_modules/js-yaml/lib/js-yaml/mark.js
var require_mark = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/mark.js"(exports2, module2) {
    "use strict";
    var common = require_common();
    function Mark(name, buffer, position, line, column) {
      this.name = name;
      this.buffer = buffer;
      this.position = position;
      this.line = line;
      this.column = column;
    }
    Mark.prototype.getSnippet = function getSnippet(indent, maxLength) {
      var head, start, tail, end, snippet;
      if (!this.buffer) return null;
      indent = indent || 4;
      maxLength = maxLength || 75;
      head = "";
      start = this.position;
      while (start > 0 && "\0\r\n\x85\u2028\u2029".indexOf(this.buffer.charAt(start - 1)) === -1) {
        start -= 1;
        if (this.position - start > maxLength / 2 - 1) {
          head = " ... ";
          start += 5;
          break;
        }
      }
      tail = "";
      end = this.position;
      while (end < this.buffer.length && "\0\r\n\x85\u2028\u2029".indexOf(this.buffer.charAt(end)) === -1) {
        end += 1;
        if (end - this.position > maxLength / 2 - 1) {
          tail = " ... ";
          end -= 5;
          break;
        }
      }
      snippet = this.buffer.slice(start, end);
      return common.repeat(" ", indent) + head + snippet + tail + "\n" + common.repeat(" ", indent + this.position - start + head.length) + "^";
    };
    Mark.prototype.toString = function toString(compact) {
      var snippet, where = "";
      if (this.name) {
        where += 'in "' + this.name + '" ';
      }
      where += "at line " + (this.line + 1) + ", column " + (this.column + 1);
      if (!compact) {
        snippet = this.getSnippet();
        if (snippet) {
          where += ":\n" + snippet;
        }
      }
      return where;
    };
    module2.exports = Mark;
  }
});

// node_modules/js-yaml/lib/js-yaml/type.js
var require_type = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type.js"(exports2, module2) {
    "use strict";
    var YAMLException = require_exception();
    var TYPE_CONSTRUCTOR_OPTIONS = [
      "kind",
      "resolve",
      "construct",
      "instanceOf",
      "predicate",
      "represent",
      "defaultStyle",
      "styleAliases"
    ];
    var YAML_NODE_KINDS = [
      "scalar",
      "sequence",
      "mapping"
    ];
    function compileStyleAliases(map) {
      var result = {};
      if (map !== null) {
        Object.keys(map).forEach(function(style) {
          map[style].forEach(function(alias) {
            result[String(alias)] = style;
          });
        });
      }
      return result;
    }
    function Type(tag, options2) {
      options2 = options2 || {};
      Object.keys(options2).forEach(function(name) {
        if (TYPE_CONSTRUCTOR_OPTIONS.indexOf(name) === -1) {
          throw new YAMLException('Unknown option "' + name + '" is met in definition of "' + tag + '" YAML type.');
        }
      });
      this.tag = tag;
      this.kind = options2["kind"] || null;
      this.resolve = options2["resolve"] || function() {
        return true;
      };
      this.construct = options2["construct"] || function(data) {
        return data;
      };
      this.instanceOf = options2["instanceOf"] || null;
      this.predicate = options2["predicate"] || null;
      this.represent = options2["represent"] || null;
      this.defaultStyle = options2["defaultStyle"] || null;
      this.styleAliases = compileStyleAliases(options2["styleAliases"] || null);
      if (YAML_NODE_KINDS.indexOf(this.kind) === -1) {
        throw new YAMLException('Unknown kind "' + this.kind + '" is specified for "' + tag + '" YAML type.');
      }
    }
    module2.exports = Type;
  }
});

// node_modules/js-yaml/lib/js-yaml/schema.js
var require_schema = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/schema.js"(exports2, module2) {
    "use strict";
    var common = require_common();
    var YAMLException = require_exception();
    var Type = require_type();
    function compileList(schema, name, result) {
      var exclude = [];
      schema.include.forEach(function(includedSchema) {
        result = compileList(includedSchema, name, result);
      });
      schema[name].forEach(function(currentType) {
        result.forEach(function(previousType, previousIndex) {
          if (previousType.tag === currentType.tag && previousType.kind === currentType.kind) {
            exclude.push(previousIndex);
          }
        });
        result.push(currentType);
      });
      return result.filter(function(type, index) {
        return exclude.indexOf(index) === -1;
      });
    }
    function compileMap() {
      var result = {
        scalar: {},
        sequence: {},
        mapping: {},
        fallback: {}
      }, index, length;
      function collectType(type) {
        result[type.kind][type.tag] = result["fallback"][type.tag] = type;
      }
      for (index = 0, length = arguments.length; index < length; index += 1) {
        arguments[index].forEach(collectType);
      }
      return result;
    }
    function Schema(definition) {
      this.include = definition.include || [];
      this.implicit = definition.implicit || [];
      this.explicit = definition.explicit || [];
      this.implicit.forEach(function(type) {
        if (type.loadKind && type.loadKind !== "scalar") {
          throw new YAMLException("There is a non-scalar type in the implicit list of a schema. Implicit resolving of such types is not supported.");
        }
      });
      this.compiledImplicit = compileList(this, "implicit", []);
      this.compiledExplicit = compileList(this, "explicit", []);
      this.compiledTypeMap = compileMap(this.compiledImplicit, this.compiledExplicit);
    }
    Schema.DEFAULT = null;
    Schema.create = function createSchema() {
      var schemas, types;
      switch (arguments.length) {
        case 1:
          schemas = Schema.DEFAULT;
          types = arguments[0];
          break;
        case 2:
          schemas = arguments[0];
          types = arguments[1];
          break;
        default:
          throw new YAMLException("Wrong number of arguments for Schema.create function");
      }
      schemas = common.toArray(schemas);
      types = common.toArray(types);
      if (!schemas.every(function(schema) {
        return schema instanceof Schema;
      })) {
        throw new YAMLException("Specified list of super schemas (or a single Schema object) contains a non-Schema object.");
      }
      if (!types.every(function(type) {
        return type instanceof Type;
      })) {
        throw new YAMLException("Specified list of YAML types (or a single Type object) contains a non-Type object.");
      }
      return new Schema({
        include: schemas,
        explicit: types
      });
    };
    module2.exports = Schema;
  }
});

// node_modules/js-yaml/lib/js-yaml/type/str.js
var require_str = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/str.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    module2.exports = new Type("tag:yaml.org,2002:str", {
      kind: "scalar",
      construct: function(data) {
        return data !== null ? data : "";
      }
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/seq.js
var require_seq = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/seq.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    module2.exports = new Type("tag:yaml.org,2002:seq", {
      kind: "sequence",
      construct: function(data) {
        return data !== null ? data : [];
      }
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/map.js
var require_map = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/map.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    module2.exports = new Type("tag:yaml.org,2002:map", {
      kind: "mapping",
      construct: function(data) {
        return data !== null ? data : {};
      }
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/schema/failsafe.js
var require_failsafe = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/schema/failsafe.js"(exports2, module2) {
    "use strict";
    var Schema = require_schema();
    module2.exports = new Schema({
      explicit: [
        require_str(),
        require_seq(),
        require_map()
      ]
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/null.js
var require_null = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/null.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    function resolveYamlNull(data) {
      if (data === null) return true;
      var max = data.length;
      return max === 1 && data === "~" || max === 4 && (data === "null" || data === "Null" || data === "NULL");
    }
    function constructYamlNull() {
      return null;
    }
    function isNull(object) {
      return object === null;
    }
    module2.exports = new Type("tag:yaml.org,2002:null", {
      kind: "scalar",
      resolve: resolveYamlNull,
      construct: constructYamlNull,
      predicate: isNull,
      represent: {
        canonical: function() {
          return "~";
        },
        lowercase: function() {
          return "null";
        },
        uppercase: function() {
          return "NULL";
        },
        camelcase: function() {
          return "Null";
        }
      },
      defaultStyle: "lowercase"
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/bool.js
var require_bool = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/bool.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    function resolveYamlBoolean(data) {
      if (data === null) return false;
      var max = data.length;
      return max === 4 && (data === "true" || data === "True" || data === "TRUE") || max === 5 && (data === "false" || data === "False" || data === "FALSE");
    }
    function constructYamlBoolean(data) {
      return data === "true" || data === "True" || data === "TRUE";
    }
    function isBoolean(object) {
      return Object.prototype.toString.call(object) === "[object Boolean]";
    }
    module2.exports = new Type("tag:yaml.org,2002:bool", {
      kind: "scalar",
      resolve: resolveYamlBoolean,
      construct: constructYamlBoolean,
      predicate: isBoolean,
      represent: {
        lowercase: function(object) {
          return object ? "true" : "false";
        },
        uppercase: function(object) {
          return object ? "TRUE" : "FALSE";
        },
        camelcase: function(object) {
          return object ? "True" : "False";
        }
      },
      defaultStyle: "lowercase"
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/int.js
var require_int = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/int.js"(exports2, module2) {
    "use strict";
    var common = require_common();
    var Type = require_type();
    function isHexCode(c) {
      return 48 <= c && c <= 57 || 65 <= c && c <= 70 || 97 <= c && c <= 102;
    }
    function isOctCode(c) {
      return 48 <= c && c <= 55;
    }
    function isDecCode(c) {
      return 48 <= c && c <= 57;
    }
    function resolveYamlInteger(data) {
      if (data === null) return false;
      var max = data.length, index = 0, hasDigits = false, ch;
      if (!max) return false;
      ch = data[index];
      if (ch === "-" || ch === "+") {
        ch = data[++index];
      }
      if (ch === "0") {
        if (index + 1 === max) return true;
        ch = data[++index];
        if (ch === "b") {
          index++;
          for (; index < max; index++) {
            ch = data[index];
            if (ch === "_") continue;
            if (ch !== "0" && ch !== "1") return false;
            hasDigits = true;
          }
          return hasDigits && ch !== "_";
        }
        if (ch === "x") {
          index++;
          for (; index < max; index++) {
            ch = data[index];
            if (ch === "_") continue;
            if (!isHexCode(data.charCodeAt(index))) return false;
            hasDigits = true;
          }
          return hasDigits && ch !== "_";
        }
        for (; index < max; index++) {
          ch = data[index];
          if (ch === "_") continue;
          if (!isOctCode(data.charCodeAt(index))) return false;
          hasDigits = true;
        }
        return hasDigits && ch !== "_";
      }
      if (ch === "_") return false;
      for (; index < max; index++) {
        ch = data[index];
        if (ch === "_") continue;
        if (ch === ":") break;
        if (!isDecCode(data.charCodeAt(index))) {
          return false;
        }
        hasDigits = true;
      }
      if (!hasDigits || ch === "_") return false;
      if (ch !== ":") return true;
      return /^(:[0-5]?[0-9])+$/.test(data.slice(index));
    }
    function constructYamlInteger(data) {
      var value = data, sign = 1, ch, base, digits = [];
      if (value.indexOf("_") !== -1) {
        value = value.replace(/_/g, "");
      }
      ch = value[0];
      if (ch === "-" || ch === "+") {
        if (ch === "-") sign = -1;
        value = value.slice(1);
        ch = value[0];
      }
      if (value === "0") return 0;
      if (ch === "0") {
        if (value[1] === "b") return sign * parseInt(value.slice(2), 2);
        if (value[1] === "x") return sign * parseInt(value, 16);
        return sign * parseInt(value, 8);
      }
      if (value.indexOf(":") !== -1) {
        value.split(":").forEach(function(v) {
          digits.unshift(parseInt(v, 10));
        });
        value = 0;
        base = 1;
        digits.forEach(function(d) {
          value += d * base;
          base *= 60;
        });
        return sign * value;
      }
      return sign * parseInt(value, 10);
    }
    function isInteger(object) {
      return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 === 0 && !common.isNegativeZero(object));
    }
    module2.exports = new Type("tag:yaml.org,2002:int", {
      kind: "scalar",
      resolve: resolveYamlInteger,
      construct: constructYamlInteger,
      predicate: isInteger,
      represent: {
        binary: function(obj) {
          return obj >= 0 ? "0b" + obj.toString(2) : "-0b" + obj.toString(2).slice(1);
        },
        octal: function(obj) {
          return obj >= 0 ? "0" + obj.toString(8) : "-0" + obj.toString(8).slice(1);
        },
        decimal: function(obj) {
          return obj.toString(10);
        },
        /* eslint-disable max-len */
        hexadecimal: function(obj) {
          return obj >= 0 ? "0x" + obj.toString(16).toUpperCase() : "-0x" + obj.toString(16).toUpperCase().slice(1);
        }
      },
      defaultStyle: "decimal",
      styleAliases: {
        binary: [2, "bin"],
        octal: [8, "oct"],
        decimal: [10, "dec"],
        hexadecimal: [16, "hex"]
      }
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/float.js
var require_float = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/float.js"(exports2, module2) {
    "use strict";
    var common = require_common();
    var Type = require_type();
    var YAML_FLOAT_PATTERN = new RegExp(
      // 2.5e4, 2.5 and integers
      "^(?:[-+]?(?:0|[1-9][0-9_]*)(?:\\.[0-9_]*)?(?:[eE][-+]?[0-9]+)?|\\.[0-9_]+(?:[eE][-+]?[0-9]+)?|[-+]?[0-9][0-9_]*(?::[0-5]?[0-9])+\\.[0-9_]*|[-+]?\\.(?:inf|Inf|INF)|\\.(?:nan|NaN|NAN))$"
    );
    function resolveYamlFloat(data) {
      if (data === null) return false;
      if (!YAML_FLOAT_PATTERN.test(data) || // Quick hack to not allow integers end with `_`
      // Probably should update regexp & check speed
      data[data.length - 1] === "_") {
        return false;
      }
      return true;
    }
    function constructYamlFloat(data) {
      var value, sign, base, digits;
      value = data.replace(/_/g, "").toLowerCase();
      sign = value[0] === "-" ? -1 : 1;
      digits = [];
      if ("+-".indexOf(value[0]) >= 0) {
        value = value.slice(1);
      }
      if (value === ".inf") {
        return sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
      } else if (value === ".nan") {
        return NaN;
      } else if (value.indexOf(":") >= 0) {
        value.split(":").forEach(function(v) {
          digits.unshift(parseFloat(v, 10));
        });
        value = 0;
        base = 1;
        digits.forEach(function(d) {
          value += d * base;
          base *= 60;
        });
        return sign * value;
      }
      return sign * parseFloat(value, 10);
    }
    var SCIENTIFIC_WITHOUT_DOT = /^[-+]?[0-9]+e/;
    function representYamlFloat(object, style) {
      var res;
      if (isNaN(object)) {
        switch (style) {
          case "lowercase":
            return ".nan";
          case "uppercase":
            return ".NAN";
          case "camelcase":
            return ".NaN";
        }
      } else if (Number.POSITIVE_INFINITY === object) {
        switch (style) {
          case "lowercase":
            return ".inf";
          case "uppercase":
            return ".INF";
          case "camelcase":
            return ".Inf";
        }
      } else if (Number.NEGATIVE_INFINITY === object) {
        switch (style) {
          case "lowercase":
            return "-.inf";
          case "uppercase":
            return "-.INF";
          case "camelcase":
            return "-.Inf";
        }
      } else if (common.isNegativeZero(object)) {
        return "-0.0";
      }
      res = object.toString(10);
      return SCIENTIFIC_WITHOUT_DOT.test(res) ? res.replace("e", ".e") : res;
    }
    function isFloat(object) {
      return Object.prototype.toString.call(object) === "[object Number]" && (object % 1 !== 0 || common.isNegativeZero(object));
    }
    module2.exports = new Type("tag:yaml.org,2002:float", {
      kind: "scalar",
      resolve: resolveYamlFloat,
      construct: constructYamlFloat,
      predicate: isFloat,
      represent: representYamlFloat,
      defaultStyle: "lowercase"
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/schema/json.js
var require_json = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/schema/json.js"(exports2, module2) {
    "use strict";
    var Schema = require_schema();
    module2.exports = new Schema({
      include: [
        require_failsafe()
      ],
      implicit: [
        require_null(),
        require_bool(),
        require_int(),
        require_float()
      ]
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/schema/core.js
var require_core = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/schema/core.js"(exports2, module2) {
    "use strict";
    var Schema = require_schema();
    module2.exports = new Schema({
      include: [
        require_json()
      ]
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/timestamp.js
var require_timestamp = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/timestamp.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    var YAML_DATE_REGEXP = new RegExp(
      "^([0-9][0-9][0-9][0-9])-([0-9][0-9])-([0-9][0-9])$"
    );
    var YAML_TIMESTAMP_REGEXP = new RegExp(
      "^([0-9][0-9][0-9][0-9])-([0-9][0-9]?)-([0-9][0-9]?)(?:[Tt]|[ \\t]+)([0-9][0-9]?):([0-9][0-9]):([0-9][0-9])(?:\\.([0-9]*))?(?:[ \\t]*(Z|([-+])([0-9][0-9]?)(?::([0-9][0-9]))?))?$"
    );
    function resolveYamlTimestamp(data) {
      if (data === null) return false;
      if (YAML_DATE_REGEXP.exec(data) !== null) return true;
      if (YAML_TIMESTAMP_REGEXP.exec(data) !== null) return true;
      return false;
    }
    function constructYamlTimestamp(data) {
      var match, year, month, day, hour, minute, second, fraction = 0, delta = null, tz_hour, tz_minute, date;
      match = YAML_DATE_REGEXP.exec(data);
      if (match === null) match = YAML_TIMESTAMP_REGEXP.exec(data);
      if (match === null) throw new Error("Date resolve error");
      year = +match[1];
      month = +match[2] - 1;
      day = +match[3];
      if (!match[4]) {
        return new Date(Date.UTC(year, month, day));
      }
      hour = +match[4];
      minute = +match[5];
      second = +match[6];
      if (match[7]) {
        fraction = match[7].slice(0, 3);
        while (fraction.length < 3) {
          fraction += "0";
        }
        fraction = +fraction;
      }
      if (match[9]) {
        tz_hour = +match[10];
        tz_minute = +(match[11] || 0);
        delta = (tz_hour * 60 + tz_minute) * 6e4;
        if (match[9] === "-") delta = -delta;
      }
      date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
      if (delta) date.setTime(date.getTime() - delta);
      return date;
    }
    function representYamlTimestamp(object) {
      return object.toISOString();
    }
    module2.exports = new Type("tag:yaml.org,2002:timestamp", {
      kind: "scalar",
      resolve: resolveYamlTimestamp,
      construct: constructYamlTimestamp,
      instanceOf: Date,
      represent: representYamlTimestamp
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/merge.js
var require_merge = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/merge.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    function resolveYamlMerge(data) {
      return data === "<<" || data === null;
    }
    module2.exports = new Type("tag:yaml.org,2002:merge", {
      kind: "scalar",
      resolve: resolveYamlMerge
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/binary.js
var require_binary = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/binary.js"(exports2, module2) {
    "use strict";
    var NodeBuffer;
    try {
      _require = require;
      NodeBuffer = _require("buffer").Buffer;
    } catch (__) {
    }
    var _require;
    var Type = require_type();
    var BASE64_MAP = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r";
    function resolveYamlBinary(data) {
      if (data === null) return false;
      var code, idx, bitlen = 0, max = data.length, map = BASE64_MAP;
      for (idx = 0; idx < max; idx++) {
        code = map.indexOf(data.charAt(idx));
        if (code > 64) continue;
        if (code < 0) return false;
        bitlen += 6;
      }
      return bitlen % 8 === 0;
    }
    function constructYamlBinary(data) {
      var idx, tailbits, input = data.replace(/[\r\n=]/g, ""), max = input.length, map = BASE64_MAP, bits = 0, result = [];
      for (idx = 0; idx < max; idx++) {
        if (idx % 4 === 0 && idx) {
          result.push(bits >> 16 & 255);
          result.push(bits >> 8 & 255);
          result.push(bits & 255);
        }
        bits = bits << 6 | map.indexOf(input.charAt(idx));
      }
      tailbits = max % 4 * 6;
      if (tailbits === 0) {
        result.push(bits >> 16 & 255);
        result.push(bits >> 8 & 255);
        result.push(bits & 255);
      } else if (tailbits === 18) {
        result.push(bits >> 10 & 255);
        result.push(bits >> 2 & 255);
      } else if (tailbits === 12) {
        result.push(bits >> 4 & 255);
      }
      if (NodeBuffer) {
        return NodeBuffer.from ? NodeBuffer.from(result) : new NodeBuffer(result);
      }
      return result;
    }
    function representYamlBinary(object) {
      var result = "", bits = 0, idx, tail, max = object.length, map = BASE64_MAP;
      for (idx = 0; idx < max; idx++) {
        if (idx % 3 === 0 && idx) {
          result += map[bits >> 18 & 63];
          result += map[bits >> 12 & 63];
          result += map[bits >> 6 & 63];
          result += map[bits & 63];
        }
        bits = (bits << 8) + object[idx];
      }
      tail = max % 3;
      if (tail === 0) {
        result += map[bits >> 18 & 63];
        result += map[bits >> 12 & 63];
        result += map[bits >> 6 & 63];
        result += map[bits & 63];
      } else if (tail === 2) {
        result += map[bits >> 10 & 63];
        result += map[bits >> 4 & 63];
        result += map[bits << 2 & 63];
        result += map[64];
      } else if (tail === 1) {
        result += map[bits >> 2 & 63];
        result += map[bits << 4 & 63];
        result += map[64];
        result += map[64];
      }
      return result;
    }
    function isBinary(object) {
      return NodeBuffer && NodeBuffer.isBuffer(object);
    }
    module2.exports = new Type("tag:yaml.org,2002:binary", {
      kind: "scalar",
      resolve: resolveYamlBinary,
      construct: constructYamlBinary,
      predicate: isBinary,
      represent: representYamlBinary
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/omap.js
var require_omap = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/omap.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    var _hasOwnProperty = Object.prototype.hasOwnProperty;
    var _toString = Object.prototype.toString;
    function resolveYamlOmap(data) {
      if (data === null) return true;
      var objectKeys = [], index, length, pair, pairKey, pairHasKey, object = data;
      for (index = 0, length = object.length; index < length; index += 1) {
        pair = object[index];
        pairHasKey = false;
        if (_toString.call(pair) !== "[object Object]") return false;
        for (pairKey in pair) {
          if (_hasOwnProperty.call(pair, pairKey)) {
            if (!pairHasKey) pairHasKey = true;
            else return false;
          }
        }
        if (!pairHasKey) return false;
        if (objectKeys.indexOf(pairKey) === -1) objectKeys.push(pairKey);
        else return false;
      }
      return true;
    }
    function constructYamlOmap(data) {
      return data !== null ? data : [];
    }
    module2.exports = new Type("tag:yaml.org,2002:omap", {
      kind: "sequence",
      resolve: resolveYamlOmap,
      construct: constructYamlOmap
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/pairs.js
var require_pairs = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/pairs.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    var _toString = Object.prototype.toString;
    function resolveYamlPairs(data) {
      if (data === null) return true;
      var index, length, pair, keys, result, object = data;
      result = new Array(object.length);
      for (index = 0, length = object.length; index < length; index += 1) {
        pair = object[index];
        if (_toString.call(pair) !== "[object Object]") return false;
        keys = Object.keys(pair);
        if (keys.length !== 1) return false;
        result[index] = [keys[0], pair[keys[0]]];
      }
      return true;
    }
    function constructYamlPairs(data) {
      if (data === null) return [];
      var index, length, pair, keys, result, object = data;
      result = new Array(object.length);
      for (index = 0, length = object.length; index < length; index += 1) {
        pair = object[index];
        keys = Object.keys(pair);
        result[index] = [keys[0], pair[keys[0]]];
      }
      return result;
    }
    module2.exports = new Type("tag:yaml.org,2002:pairs", {
      kind: "sequence",
      resolve: resolveYamlPairs,
      construct: constructYamlPairs
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/set.js
var require_set = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/set.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    var _hasOwnProperty = Object.prototype.hasOwnProperty;
    function resolveYamlSet(data) {
      if (data === null) return true;
      var key, object = data;
      for (key in object) {
        if (_hasOwnProperty.call(object, key)) {
          if (object[key] !== null) return false;
        }
      }
      return true;
    }
    function constructYamlSet(data) {
      return data !== null ? data : {};
    }
    module2.exports = new Type("tag:yaml.org,2002:set", {
      kind: "mapping",
      resolve: resolveYamlSet,
      construct: constructYamlSet
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/schema/default_safe.js
var require_default_safe = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/schema/default_safe.js"(exports2, module2) {
    "use strict";
    var Schema = require_schema();
    module2.exports = new Schema({
      include: [
        require_core()
      ],
      implicit: [
        require_timestamp(),
        require_merge()
      ],
      explicit: [
        require_binary(),
        require_omap(),
        require_pairs(),
        require_set()
      ]
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/js/undefined.js
var require_undefined = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/js/undefined.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    function resolveJavascriptUndefined() {
      return true;
    }
    function constructJavascriptUndefined() {
      return void 0;
    }
    function representJavascriptUndefined() {
      return "";
    }
    function isUndefined(object) {
      return typeof object === "undefined";
    }
    module2.exports = new Type("tag:yaml.org,2002:js/undefined", {
      kind: "scalar",
      resolve: resolveJavascriptUndefined,
      construct: constructJavascriptUndefined,
      predicate: isUndefined,
      represent: representJavascriptUndefined
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/js/regexp.js
var require_regexp = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/js/regexp.js"(exports2, module2) {
    "use strict";
    var Type = require_type();
    function resolveJavascriptRegExp(data) {
      if (data === null) return false;
      if (data.length === 0) return false;
      var regexp = data, tail = /\/([gim]*)$/.exec(data), modifiers = "";
      if (regexp[0] === "/") {
        if (tail) modifiers = tail[1];
        if (modifiers.length > 3) return false;
        if (regexp[regexp.length - modifiers.length - 1] !== "/") return false;
      }
      return true;
    }
    function constructJavascriptRegExp(data) {
      var regexp = data, tail = /\/([gim]*)$/.exec(data), modifiers = "";
      if (regexp[0] === "/") {
        if (tail) modifiers = tail[1];
        regexp = regexp.slice(1, regexp.length - modifiers.length - 1);
      }
      return new RegExp(regexp, modifiers);
    }
    function representJavascriptRegExp(object) {
      var result = "/" + object.source + "/";
      if (object.global) result += "g";
      if (object.multiline) result += "m";
      if (object.ignoreCase) result += "i";
      return result;
    }
    function isRegExp(object) {
      return Object.prototype.toString.call(object) === "[object RegExp]";
    }
    module2.exports = new Type("tag:yaml.org,2002:js/regexp", {
      kind: "scalar",
      resolve: resolveJavascriptRegExp,
      construct: constructJavascriptRegExp,
      predicate: isRegExp,
      represent: representJavascriptRegExp
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/type/js/function.js
var require_function = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/type/js/function.js"(exports2, module2) {
    "use strict";
    var esprima;
    try {
      _require = require;
      esprima = _require("esprima");
    } catch (_) {
      if (typeof window !== "undefined") esprima = window.esprima;
    }
    var _require;
    var Type = require_type();
    function resolveJavascriptFunction(data) {
      if (data === null) return false;
      try {
        var source = "(" + data + ")", ast = esprima.parse(source, { range: true });
        if (ast.type !== "Program" || ast.body.length !== 1 || ast.body[0].type !== "ExpressionStatement" || ast.body[0].expression.type !== "ArrowFunctionExpression" && ast.body[0].expression.type !== "FunctionExpression") {
          return false;
        }
        return true;
      } catch (err) {
        return false;
      }
    }
    function constructJavascriptFunction(data) {
      var source = "(" + data + ")", ast = esprima.parse(source, { range: true }), params = [], body;
      if (ast.type !== "Program" || ast.body.length !== 1 || ast.body[0].type !== "ExpressionStatement" || ast.body[0].expression.type !== "ArrowFunctionExpression" && ast.body[0].expression.type !== "FunctionExpression") {
        throw new Error("Failed to resolve function");
      }
      ast.body[0].expression.params.forEach(function(param) {
        params.push(param.name);
      });
      body = ast.body[0].expression.body.range;
      if (ast.body[0].expression.body.type === "BlockStatement") {
        return new Function(params, source.slice(body[0] + 1, body[1] - 1));
      }
      return new Function(params, "return " + source.slice(body[0], body[1]));
    }
    function representJavascriptFunction(object) {
      return object.toString();
    }
    function isFunction(object) {
      return Object.prototype.toString.call(object) === "[object Function]";
    }
    module2.exports = new Type("tag:yaml.org,2002:js/function", {
      kind: "scalar",
      resolve: resolveJavascriptFunction,
      construct: constructJavascriptFunction,
      predicate: isFunction,
      represent: representJavascriptFunction
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/schema/default_full.js
var require_default_full = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/schema/default_full.js"(exports2, module2) {
    "use strict";
    var Schema = require_schema();
    module2.exports = Schema.DEFAULT = new Schema({
      include: [
        require_default_safe()
      ],
      explicit: [
        require_undefined(),
        require_regexp(),
        require_function()
      ]
    });
  }
});

// node_modules/js-yaml/lib/js-yaml/loader.js
var require_loader = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/loader.js"(exports2, module2) {
    "use strict";
    var common = require_common();
    var YAMLException = require_exception();
    var Mark = require_mark();
    var DEFAULT_SAFE_SCHEMA = require_default_safe();
    var DEFAULT_FULL_SCHEMA = require_default_full();
    var _hasOwnProperty = Object.prototype.hasOwnProperty;
    var CONTEXT_FLOW_IN = 1;
    var CONTEXT_FLOW_OUT = 2;
    var CONTEXT_BLOCK_IN = 3;
    var CONTEXT_BLOCK_OUT = 4;
    var CHOMPING_CLIP = 1;
    var CHOMPING_STRIP = 2;
    var CHOMPING_KEEP = 3;
    var PATTERN_NON_PRINTABLE = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
    var PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
    var PATTERN_FLOW_INDICATORS = /[,\[\]\{\}]/;
    var PATTERN_TAG_HANDLE = /^(?:!|!!|![a-z\-]+!)$/i;
    var PATTERN_TAG_URI = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
    function _class(obj) {
      return Object.prototype.toString.call(obj);
    }
    function is_EOL(c) {
      return c === 10 || c === 13;
    }
    function is_WHITE_SPACE(c) {
      return c === 9 || c === 32;
    }
    function is_WS_OR_EOL(c) {
      return c === 9 || c === 32 || c === 10 || c === 13;
    }
    function is_FLOW_INDICATOR(c) {
      return c === 44 || c === 91 || c === 93 || c === 123 || c === 125;
    }
    function fromHexCode(c) {
      var lc;
      if (48 <= c && c <= 57) {
        return c - 48;
      }
      lc = c | 32;
      if (97 <= lc && lc <= 102) {
        return lc - 97 + 10;
      }
      return -1;
    }
    function escapedHexLen(c) {
      if (c === 120) {
        return 2;
      }
      if (c === 117) {
        return 4;
      }
      if (c === 85) {
        return 8;
      }
      return 0;
    }
    function fromDecimalCode(c) {
      if (48 <= c && c <= 57) {
        return c - 48;
      }
      return -1;
    }
    function simpleEscapeSequence(c) {
      return c === 48 ? "\0" : c === 97 ? "\x07" : c === 98 ? "\b" : c === 116 ? "	" : c === 9 ? "	" : c === 110 ? "\n" : c === 118 ? "\v" : c === 102 ? "\f" : c === 114 ? "\r" : c === 101 ? "\x1B" : c === 32 ? " " : c === 34 ? '"' : c === 47 ? "/" : c === 92 ? "\\" : c === 78 ? "\x85" : c === 95 ? "\xA0" : c === 76 ? "\u2028" : c === 80 ? "\u2029" : "";
    }
    function charFromCodepoint(c) {
      if (c <= 65535) {
        return String.fromCharCode(c);
      }
      return String.fromCharCode(
        (c - 65536 >> 10) + 55296,
        (c - 65536 & 1023) + 56320
      );
    }
    function setProperty(object, key, value) {
      if (key === "__proto__") {
        Object.defineProperty(object, key, {
          configurable: true,
          enumerable: true,
          writable: true,
          value
        });
      } else {
        object[key] = value;
      }
    }
    var simpleEscapeCheck = new Array(256);
    var simpleEscapeMap = new Array(256);
    for (i = 0; i < 256; i++) {
      simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
      simpleEscapeMap[i] = simpleEscapeSequence(i);
    }
    var i;
    function State(input, options2) {
      this.input = input;
      this.filename = options2["filename"] || null;
      this.schema = options2["schema"] || DEFAULT_FULL_SCHEMA;
      this.onWarning = options2["onWarning"] || null;
      this.legacy = options2["legacy"] || false;
      this.json = options2["json"] || false;
      this.listener = options2["listener"] || null;
      this.implicitTypes = this.schema.compiledImplicit;
      this.typeMap = this.schema.compiledTypeMap;
      this.length = input.length;
      this.position = 0;
      this.line = 0;
      this.lineStart = 0;
      this.lineIndent = 0;
      this.documents = [];
    }
    function generateError(state, message) {
      return new YAMLException(
        message,
        new Mark(state.filename, state.input, state.position, state.line, state.position - state.lineStart)
      );
    }
    function throwError(state, message) {
      throw generateError(state, message);
    }
    function throwWarning(state, message) {
      if (state.onWarning) {
        state.onWarning.call(null, generateError(state, message));
      }
    }
    var directiveHandlers = {
      YAML: function handleYamlDirective(state, name, args) {
        var match, major, minor;
        if (state.version !== null) {
          throwError(state, "duplication of %YAML directive");
        }
        if (args.length !== 1) {
          throwError(state, "YAML directive accepts exactly one argument");
        }
        match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
        if (match === null) {
          throwError(state, "ill-formed argument of the YAML directive");
        }
        major = parseInt(match[1], 10);
        minor = parseInt(match[2], 10);
        if (major !== 1) {
          throwError(state, "unacceptable YAML version of the document");
        }
        state.version = args[0];
        state.checkLineBreaks = minor < 2;
        if (minor !== 1 && minor !== 2) {
          throwWarning(state, "unsupported YAML version of the document");
        }
      },
      TAG: function handleTagDirective(state, name, args) {
        var handle, prefix;
        if (args.length !== 2) {
          throwError(state, "TAG directive accepts exactly two arguments");
        }
        handle = args[0];
        prefix = args[1];
        if (!PATTERN_TAG_HANDLE.test(handle)) {
          throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
        }
        if (_hasOwnProperty.call(state.tagMap, handle)) {
          throwError(state, 'there is a previously declared suffix for "' + handle + '" tag handle');
        }
        if (!PATTERN_TAG_URI.test(prefix)) {
          throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
        }
        state.tagMap[handle] = prefix;
      }
    };
    function captureSegment(state, start, end, checkJson) {
      var _position, _length, _character, _result;
      if (start < end) {
        _result = state.input.slice(start, end);
        if (checkJson) {
          for (_position = 0, _length = _result.length; _position < _length; _position += 1) {
            _character = _result.charCodeAt(_position);
            if (!(_character === 9 || 32 <= _character && _character <= 1114111)) {
              throwError(state, "expected valid JSON character");
            }
          }
        } else if (PATTERN_NON_PRINTABLE.test(_result)) {
          throwError(state, "the stream contains non-printable characters");
        }
        state.result += _result;
      }
    }
    function mergeMappings(state, destination, source, overridableKeys) {
      var sourceKeys, key, index, quantity;
      if (!common.isObject(source)) {
        throwError(state, "cannot merge mappings; the provided source object is unacceptable");
      }
      sourceKeys = Object.keys(source);
      for (index = 0, quantity = sourceKeys.length; index < quantity; index += 1) {
        key = sourceKeys[index];
        if (!_hasOwnProperty.call(destination, key)) {
          setProperty(destination, key, source[key]);
          overridableKeys[key] = true;
        }
      }
    }
    function storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, startLine, startPos) {
      var index, quantity;
      if (Array.isArray(keyNode)) {
        keyNode = Array.prototype.slice.call(keyNode);
        for (index = 0, quantity = keyNode.length; index < quantity; index += 1) {
          if (Array.isArray(keyNode[index])) {
            throwError(state, "nested arrays are not supported inside keys");
          }
          if (typeof keyNode === "object" && _class(keyNode[index]) === "[object Object]") {
            keyNode[index] = "[object Object]";
          }
        }
      }
      if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") {
        keyNode = "[object Object]";
      }
      keyNode = String(keyNode);
      if (_result === null) {
        _result = {};
      }
      if (keyTag === "tag:yaml.org,2002:merge") {
        if (Array.isArray(valueNode)) {
          for (index = 0, quantity = valueNode.length; index < quantity; index += 1) {
            mergeMappings(state, _result, valueNode[index], overridableKeys);
          }
        } else {
          mergeMappings(state, _result, valueNode, overridableKeys);
        }
      } else {
        if (!state.json && !_hasOwnProperty.call(overridableKeys, keyNode) && _hasOwnProperty.call(_result, keyNode)) {
          state.line = startLine || state.line;
          state.position = startPos || state.position;
          throwError(state, "duplicated mapping key");
        }
        setProperty(_result, keyNode, valueNode);
        delete overridableKeys[keyNode];
      }
      return _result;
    }
    function readLineBreak(state) {
      var ch;
      ch = state.input.charCodeAt(state.position);
      if (ch === 10) {
        state.position++;
      } else if (ch === 13) {
        state.position++;
        if (state.input.charCodeAt(state.position) === 10) {
          state.position++;
        }
      } else {
        throwError(state, "a line break is expected");
      }
      state.line += 1;
      state.lineStart = state.position;
    }
    function skipSeparationSpace(state, allowComments, checkIndent) {
      var lineBreaks = 0, ch = state.input.charCodeAt(state.position);
      while (ch !== 0) {
        while (is_WHITE_SPACE(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        if (allowComments && ch === 35) {
          do {
            ch = state.input.charCodeAt(++state.position);
          } while (ch !== 10 && ch !== 13 && ch !== 0);
        }
        if (is_EOL(ch)) {
          readLineBreak(state);
          ch = state.input.charCodeAt(state.position);
          lineBreaks++;
          state.lineIndent = 0;
          while (ch === 32) {
            state.lineIndent++;
            ch = state.input.charCodeAt(++state.position);
          }
        } else {
          break;
        }
      }
      if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
        throwWarning(state, "deficient indentation");
      }
      return lineBreaks;
    }
    function testDocumentSeparator(state) {
      var _position = state.position, ch;
      ch = state.input.charCodeAt(_position);
      if ((ch === 45 || ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
        _position += 3;
        ch = state.input.charCodeAt(_position);
        if (ch === 0 || is_WS_OR_EOL(ch)) {
          return true;
        }
      }
      return false;
    }
    function writeFoldedLines(state, count) {
      if (count === 1) {
        state.result += " ";
      } else if (count > 1) {
        state.result += common.repeat("\n", count - 1);
      }
    }
    function readPlainScalar(state, nodeIndent, withinFlowCollection) {
      var preceding, following, captureStart, captureEnd, hasPendingContent, _line, _lineStart, _lineIndent, _kind = state.kind, _result = state.result, ch;
      ch = state.input.charCodeAt(state.position);
      if (is_WS_OR_EOL(ch) || is_FLOW_INDICATOR(ch) || ch === 35 || ch === 38 || ch === 42 || ch === 33 || ch === 124 || ch === 62 || ch === 39 || ch === 34 || ch === 37 || ch === 64 || ch === 96) {
        return false;
      }
      if (ch === 63 || ch === 45) {
        following = state.input.charCodeAt(state.position + 1);
        if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
          return false;
        }
      }
      state.kind = "scalar";
      state.result = "";
      captureStart = captureEnd = state.position;
      hasPendingContent = false;
      while (ch !== 0) {
        if (ch === 58) {
          following = state.input.charCodeAt(state.position + 1);
          if (is_WS_OR_EOL(following) || withinFlowCollection && is_FLOW_INDICATOR(following)) {
            break;
          }
        } else if (ch === 35) {
          preceding = state.input.charCodeAt(state.position - 1);
          if (is_WS_OR_EOL(preceding)) {
            break;
          }
        } else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && is_FLOW_INDICATOR(ch)) {
          break;
        } else if (is_EOL(ch)) {
          _line = state.line;
          _lineStart = state.lineStart;
          _lineIndent = state.lineIndent;
          skipSeparationSpace(state, false, -1);
          if (state.lineIndent >= nodeIndent) {
            hasPendingContent = true;
            ch = state.input.charCodeAt(state.position);
            continue;
          } else {
            state.position = captureEnd;
            state.line = _line;
            state.lineStart = _lineStart;
            state.lineIndent = _lineIndent;
            break;
          }
        }
        if (hasPendingContent) {
          captureSegment(state, captureStart, captureEnd, false);
          writeFoldedLines(state, state.line - _line);
          captureStart = captureEnd = state.position;
          hasPendingContent = false;
        }
        if (!is_WHITE_SPACE(ch)) {
          captureEnd = state.position + 1;
        }
        ch = state.input.charCodeAt(++state.position);
      }
      captureSegment(state, captureStart, captureEnd, false);
      if (state.result) {
        return true;
      }
      state.kind = _kind;
      state.result = _result;
      return false;
    }
    function readSingleQuotedScalar(state, nodeIndent) {
      var ch, captureStart, captureEnd;
      ch = state.input.charCodeAt(state.position);
      if (ch !== 39) {
        return false;
      }
      state.kind = "scalar";
      state.result = "";
      state.position++;
      captureStart = captureEnd = state.position;
      while ((ch = state.input.charCodeAt(state.position)) !== 0) {
        if (ch === 39) {
          captureSegment(state, captureStart, state.position, true);
          ch = state.input.charCodeAt(++state.position);
          if (ch === 39) {
            captureStart = state.position;
            state.position++;
            captureEnd = state.position;
          } else {
            return true;
          }
        } else if (is_EOL(ch)) {
          captureSegment(state, captureStart, captureEnd, true);
          writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
          captureStart = captureEnd = state.position;
        } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
          throwError(state, "unexpected end of the document within a single quoted scalar");
        } else {
          state.position++;
          captureEnd = state.position;
        }
      }
      throwError(state, "unexpected end of the stream within a single quoted scalar");
    }
    function readDoubleQuotedScalar(state, nodeIndent) {
      var captureStart, captureEnd, hexLength, hexResult, tmp, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch !== 34) {
        return false;
      }
      state.kind = "scalar";
      state.result = "";
      state.position++;
      captureStart = captureEnd = state.position;
      while ((ch = state.input.charCodeAt(state.position)) !== 0) {
        if (ch === 34) {
          captureSegment(state, captureStart, state.position, true);
          state.position++;
          return true;
        } else if (ch === 92) {
          captureSegment(state, captureStart, state.position, true);
          ch = state.input.charCodeAt(++state.position);
          if (is_EOL(ch)) {
            skipSeparationSpace(state, false, nodeIndent);
          } else if (ch < 256 && simpleEscapeCheck[ch]) {
            state.result += simpleEscapeMap[ch];
            state.position++;
          } else if ((tmp = escapedHexLen(ch)) > 0) {
            hexLength = tmp;
            hexResult = 0;
            for (; hexLength > 0; hexLength--) {
              ch = state.input.charCodeAt(++state.position);
              if ((tmp = fromHexCode(ch)) >= 0) {
                hexResult = (hexResult << 4) + tmp;
              } else {
                throwError(state, "expected hexadecimal character");
              }
            }
            state.result += charFromCodepoint(hexResult);
            state.position++;
          } else {
            throwError(state, "unknown escape sequence");
          }
          captureStart = captureEnd = state.position;
        } else if (is_EOL(ch)) {
          captureSegment(state, captureStart, captureEnd, true);
          writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
          captureStart = captureEnd = state.position;
        } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
          throwError(state, "unexpected end of the document within a double quoted scalar");
        } else {
          state.position++;
          captureEnd = state.position;
        }
      }
      throwError(state, "unexpected end of the stream within a double quoted scalar");
    }
    function readFlowCollection(state, nodeIndent) {
      var readNext = true, _line, _tag = state.tag, _result, _anchor = state.anchor, following, terminator, isPair, isExplicitPair, isMapping, overridableKeys = {}, keyNode, keyTag, valueNode, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch === 91) {
        terminator = 93;
        isMapping = false;
        _result = [];
      } else if (ch === 123) {
        terminator = 125;
        isMapping = true;
        _result = {};
      } else {
        return false;
      }
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = _result;
      }
      ch = state.input.charCodeAt(++state.position);
      while (ch !== 0) {
        skipSeparationSpace(state, true, nodeIndent);
        ch = state.input.charCodeAt(state.position);
        if (ch === terminator) {
          state.position++;
          state.tag = _tag;
          state.anchor = _anchor;
          state.kind = isMapping ? "mapping" : "sequence";
          state.result = _result;
          return true;
        } else if (!readNext) {
          throwError(state, "missed comma between flow collection entries");
        }
        keyTag = keyNode = valueNode = null;
        isPair = isExplicitPair = false;
        if (ch === 63) {
          following = state.input.charCodeAt(state.position + 1);
          if (is_WS_OR_EOL(following)) {
            isPair = isExplicitPair = true;
            state.position++;
            skipSeparationSpace(state, true, nodeIndent);
          }
        }
        _line = state.line;
        composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
        keyTag = state.tag;
        keyNode = state.result;
        skipSeparationSpace(state, true, nodeIndent);
        ch = state.input.charCodeAt(state.position);
        if ((isExplicitPair || state.line === _line) && ch === 58) {
          isPair = true;
          ch = state.input.charCodeAt(++state.position);
          skipSeparationSpace(state, true, nodeIndent);
          composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
          valueNode = state.result;
        }
        if (isMapping) {
          storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode);
        } else if (isPair) {
          _result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode));
        } else {
          _result.push(keyNode);
        }
        skipSeparationSpace(state, true, nodeIndent);
        ch = state.input.charCodeAt(state.position);
        if (ch === 44) {
          readNext = true;
          ch = state.input.charCodeAt(++state.position);
        } else {
          readNext = false;
        }
      }
      throwError(state, "unexpected end of the stream within a flow collection");
    }
    function readBlockScalar(state, nodeIndent) {
      var captureStart, folding, chomping = CHOMPING_CLIP, didReadContent = false, detectedIndent = false, textIndent = nodeIndent, emptyLines = 0, atMoreIndented = false, tmp, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch === 124) {
        folding = false;
      } else if (ch === 62) {
        folding = true;
      } else {
        return false;
      }
      state.kind = "scalar";
      state.result = "";
      while (ch !== 0) {
        ch = state.input.charCodeAt(++state.position);
        if (ch === 43 || ch === 45) {
          if (CHOMPING_CLIP === chomping) {
            chomping = ch === 43 ? CHOMPING_KEEP : CHOMPING_STRIP;
          } else {
            throwError(state, "repeat of a chomping mode identifier");
          }
        } else if ((tmp = fromDecimalCode(ch)) >= 0) {
          if (tmp === 0) {
            throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
          } else if (!detectedIndent) {
            textIndent = nodeIndent + tmp - 1;
            detectedIndent = true;
          } else {
            throwError(state, "repeat of an indentation width identifier");
          }
        } else {
          break;
        }
      }
      if (is_WHITE_SPACE(ch)) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (is_WHITE_SPACE(ch));
        if (ch === 35) {
          do {
            ch = state.input.charCodeAt(++state.position);
          } while (!is_EOL(ch) && ch !== 0);
        }
      }
      while (ch !== 0) {
        readLineBreak(state);
        state.lineIndent = 0;
        ch = state.input.charCodeAt(state.position);
        while ((!detectedIndent || state.lineIndent < textIndent) && ch === 32) {
          state.lineIndent++;
          ch = state.input.charCodeAt(++state.position);
        }
        if (!detectedIndent && state.lineIndent > textIndent) {
          textIndent = state.lineIndent;
        }
        if (is_EOL(ch)) {
          emptyLines++;
          continue;
        }
        if (state.lineIndent < textIndent) {
          if (chomping === CHOMPING_KEEP) {
            state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
          } else if (chomping === CHOMPING_CLIP) {
            if (didReadContent) {
              state.result += "\n";
            }
          }
          break;
        }
        if (folding) {
          if (is_WHITE_SPACE(ch)) {
            atMoreIndented = true;
            state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
          } else if (atMoreIndented) {
            atMoreIndented = false;
            state.result += common.repeat("\n", emptyLines + 1);
          } else if (emptyLines === 0) {
            if (didReadContent) {
              state.result += " ";
            }
          } else {
            state.result += common.repeat("\n", emptyLines);
          }
        } else {
          state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
        }
        didReadContent = true;
        detectedIndent = true;
        emptyLines = 0;
        captureStart = state.position;
        while (!is_EOL(ch) && ch !== 0) {
          ch = state.input.charCodeAt(++state.position);
        }
        captureSegment(state, captureStart, state.position, false);
      }
      return true;
    }
    function readBlockSequence(state, nodeIndent) {
      var _line, _tag = state.tag, _anchor = state.anchor, _result = [], following, detected = false, ch;
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = _result;
      }
      ch = state.input.charCodeAt(state.position);
      while (ch !== 0) {
        if (ch !== 45) {
          break;
        }
        following = state.input.charCodeAt(state.position + 1);
        if (!is_WS_OR_EOL(following)) {
          break;
        }
        detected = true;
        state.position++;
        if (skipSeparationSpace(state, true, -1)) {
          if (state.lineIndent <= nodeIndent) {
            _result.push(null);
            ch = state.input.charCodeAt(state.position);
            continue;
          }
        }
        _line = state.line;
        composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
        _result.push(state.result);
        skipSeparationSpace(state, true, -1);
        ch = state.input.charCodeAt(state.position);
        if ((state.line === _line || state.lineIndent > nodeIndent) && ch !== 0) {
          throwError(state, "bad indentation of a sequence entry");
        } else if (state.lineIndent < nodeIndent) {
          break;
        }
      }
      if (detected) {
        state.tag = _tag;
        state.anchor = _anchor;
        state.kind = "sequence";
        state.result = _result;
        return true;
      }
      return false;
    }
    function readBlockMapping(state, nodeIndent, flowIndent) {
      var following, allowCompact, _line, _pos, _tag = state.tag, _anchor = state.anchor, _result = {}, overridableKeys = {}, keyTag = null, keyNode = null, valueNode = null, atExplicitKey = false, detected = false, ch;
      if (state.anchor !== null) {
        state.anchorMap[state.anchor] = _result;
      }
      ch = state.input.charCodeAt(state.position);
      while (ch !== 0) {
        following = state.input.charCodeAt(state.position + 1);
        _line = state.line;
        _pos = state.position;
        if ((ch === 63 || ch === 58) && is_WS_OR_EOL(following)) {
          if (ch === 63) {
            if (atExplicitKey) {
              storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
              keyTag = keyNode = valueNode = null;
            }
            detected = true;
            atExplicitKey = true;
            allowCompact = true;
          } else if (atExplicitKey) {
            atExplicitKey = false;
            allowCompact = true;
          } else {
            throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
          }
          state.position += 1;
          ch = following;
        } else if (composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
          if (state.line === _line) {
            ch = state.input.charCodeAt(state.position);
            while (is_WHITE_SPACE(ch)) {
              ch = state.input.charCodeAt(++state.position);
            }
            if (ch === 58) {
              ch = state.input.charCodeAt(++state.position);
              if (!is_WS_OR_EOL(ch)) {
                throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
              }
              if (atExplicitKey) {
                storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
                keyTag = keyNode = valueNode = null;
              }
              detected = true;
              atExplicitKey = false;
              allowCompact = false;
              keyTag = state.tag;
              keyNode = state.result;
            } else if (detected) {
              throwError(state, "can not read an implicit mapping pair; a colon is missed");
            } else {
              state.tag = _tag;
              state.anchor = _anchor;
              return true;
            }
          } else if (detected) {
            throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
          } else {
            state.tag = _tag;
            state.anchor = _anchor;
            return true;
          }
        } else {
          break;
        }
        if (state.line === _line || state.lineIndent > nodeIndent) {
          if (composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
            if (atExplicitKey) {
              keyNode = state.result;
            } else {
              valueNode = state.result;
            }
          }
          if (!atExplicitKey) {
            storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, valueNode, _line, _pos);
            keyTag = keyNode = valueNode = null;
          }
          skipSeparationSpace(state, true, -1);
          ch = state.input.charCodeAt(state.position);
        }
        if (state.lineIndent > nodeIndent && ch !== 0) {
          throwError(state, "bad indentation of a mapping entry");
        } else if (state.lineIndent < nodeIndent) {
          break;
        }
      }
      if (atExplicitKey) {
        storeMappingPair(state, _result, overridableKeys, keyTag, keyNode, null);
      }
      if (detected) {
        state.tag = _tag;
        state.anchor = _anchor;
        state.kind = "mapping";
        state.result = _result;
      }
      return detected;
    }
    function readTagProperty(state) {
      var _position, isVerbatim = false, isNamed = false, tagHandle, tagName, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch !== 33) return false;
      if (state.tag !== null) {
        throwError(state, "duplication of a tag property");
      }
      ch = state.input.charCodeAt(++state.position);
      if (ch === 60) {
        isVerbatim = true;
        ch = state.input.charCodeAt(++state.position);
      } else if (ch === 33) {
        isNamed = true;
        tagHandle = "!!";
        ch = state.input.charCodeAt(++state.position);
      } else {
        tagHandle = "!";
      }
      _position = state.position;
      if (isVerbatim) {
        do {
          ch = state.input.charCodeAt(++state.position);
        } while (ch !== 0 && ch !== 62);
        if (state.position < state.length) {
          tagName = state.input.slice(_position, state.position);
          ch = state.input.charCodeAt(++state.position);
        } else {
          throwError(state, "unexpected end of the stream within a verbatim tag");
        }
      } else {
        while (ch !== 0 && !is_WS_OR_EOL(ch)) {
          if (ch === 33) {
            if (!isNamed) {
              tagHandle = state.input.slice(_position - 1, state.position + 1);
              if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
                throwError(state, "named tag handle cannot contain such characters");
              }
              isNamed = true;
              _position = state.position + 1;
            } else {
              throwError(state, "tag suffix cannot contain exclamation marks");
            }
          }
          ch = state.input.charCodeAt(++state.position);
        }
        tagName = state.input.slice(_position, state.position);
        if (PATTERN_FLOW_INDICATORS.test(tagName)) {
          throwError(state, "tag suffix cannot contain flow indicator characters");
        }
      }
      if (tagName && !PATTERN_TAG_URI.test(tagName)) {
        throwError(state, "tag name cannot contain such characters: " + tagName);
      }
      if (isVerbatim) {
        state.tag = tagName;
      } else if (_hasOwnProperty.call(state.tagMap, tagHandle)) {
        state.tag = state.tagMap[tagHandle] + tagName;
      } else if (tagHandle === "!") {
        state.tag = "!" + tagName;
      } else if (tagHandle === "!!") {
        state.tag = "tag:yaml.org,2002:" + tagName;
      } else {
        throwError(state, 'undeclared tag handle "' + tagHandle + '"');
      }
      return true;
    }
    function readAnchorProperty(state) {
      var _position, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch !== 38) return false;
      if (state.anchor !== null) {
        throwError(state, "duplication of an anchor property");
      }
      ch = state.input.charCodeAt(++state.position);
      _position = state.position;
      while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      if (state.position === _position) {
        throwError(state, "name of an anchor node must contain at least one character");
      }
      state.anchor = state.input.slice(_position, state.position);
      return true;
    }
    function readAlias(state) {
      var _position, alias, ch;
      ch = state.input.charCodeAt(state.position);
      if (ch !== 42) return false;
      ch = state.input.charCodeAt(++state.position);
      _position = state.position;
      while (ch !== 0 && !is_WS_OR_EOL(ch) && !is_FLOW_INDICATOR(ch)) {
        ch = state.input.charCodeAt(++state.position);
      }
      if (state.position === _position) {
        throwError(state, "name of an alias node must contain at least one character");
      }
      alias = state.input.slice(_position, state.position);
      if (!_hasOwnProperty.call(state.anchorMap, alias)) {
        throwError(state, 'unidentified alias "' + alias + '"');
      }
      state.result = state.anchorMap[alias];
      skipSeparationSpace(state, true, -1);
      return true;
    }
    function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
      var allowBlockStyles, allowBlockScalars, allowBlockCollections, indentStatus = 1, atNewLine = false, hasContent = false, typeIndex, typeQuantity, type, flowIndent, blockIndent;
      if (state.listener !== null) {
        state.listener("open", state);
      }
      state.tag = null;
      state.anchor = null;
      state.kind = null;
      state.result = null;
      allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
      if (allowToSeek) {
        if (skipSeparationSpace(state, true, -1)) {
          atNewLine = true;
          if (state.lineIndent > parentIndent) {
            indentStatus = 1;
          } else if (state.lineIndent === parentIndent) {
            indentStatus = 0;
          } else if (state.lineIndent < parentIndent) {
            indentStatus = -1;
          }
        }
      }
      if (indentStatus === 1) {
        while (readTagProperty(state) || readAnchorProperty(state)) {
          if (skipSeparationSpace(state, true, -1)) {
            atNewLine = true;
            allowBlockCollections = allowBlockStyles;
            if (state.lineIndent > parentIndent) {
              indentStatus = 1;
            } else if (state.lineIndent === parentIndent) {
              indentStatus = 0;
            } else if (state.lineIndent < parentIndent) {
              indentStatus = -1;
            }
          } else {
            allowBlockCollections = false;
          }
        }
      }
      if (allowBlockCollections) {
        allowBlockCollections = atNewLine || allowCompact;
      }
      if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
        if (CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext) {
          flowIndent = parentIndent;
        } else {
          flowIndent = parentIndent + 1;
        }
        blockIndent = state.position - state.lineStart;
        if (indentStatus === 1) {
          if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) {
            hasContent = true;
          } else {
            if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) {
              hasContent = true;
            } else if (readAlias(state)) {
              hasContent = true;
              if (state.tag !== null || state.anchor !== null) {
                throwError(state, "alias node should not have any properties");
              }
            } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
              hasContent = true;
              if (state.tag === null) {
                state.tag = "?";
              }
            }
            if (state.anchor !== null) {
              state.anchorMap[state.anchor] = state.result;
            }
          }
        } else if (indentStatus === 0) {
          hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
        }
      }
      if (state.tag !== null && state.tag !== "!") {
        if (state.tag === "?") {
          if (state.result !== null && state.kind !== "scalar") {
            throwError(state, 'unacceptable node kind for !<?> tag; it should be "scalar", not "' + state.kind + '"');
          }
          for (typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex += 1) {
            type = state.implicitTypes[typeIndex];
            if (type.resolve(state.result)) {
              state.result = type.construct(state.result);
              state.tag = type.tag;
              if (state.anchor !== null) {
                state.anchorMap[state.anchor] = state.result;
              }
              break;
            }
          }
        } else if (_hasOwnProperty.call(state.typeMap[state.kind || "fallback"], state.tag)) {
          type = state.typeMap[state.kind || "fallback"][state.tag];
          if (state.result !== null && type.kind !== state.kind) {
            throwError(state, "unacceptable node kind for !<" + state.tag + '> tag; it should be "' + type.kind + '", not "' + state.kind + '"');
          }
          if (!type.resolve(state.result)) {
            throwError(state, "cannot resolve a node with !<" + state.tag + "> explicit tag");
          } else {
            state.result = type.construct(state.result);
            if (state.anchor !== null) {
              state.anchorMap[state.anchor] = state.result;
            }
          }
        } else {
          throwError(state, "unknown tag !<" + state.tag + ">");
        }
      }
      if (state.listener !== null) {
        state.listener("close", state);
      }
      return state.tag !== null || state.anchor !== null || hasContent;
    }
    function readDocument(state) {
      var documentStart = state.position, _position, directiveName, directiveArgs, hasDirectives = false, ch;
      state.version = null;
      state.checkLineBreaks = state.legacy;
      state.tagMap = {};
      state.anchorMap = {};
      while ((ch = state.input.charCodeAt(state.position)) !== 0) {
        skipSeparationSpace(state, true, -1);
        ch = state.input.charCodeAt(state.position);
        if (state.lineIndent > 0 || ch !== 37) {
          break;
        }
        hasDirectives = true;
        ch = state.input.charCodeAt(++state.position);
        _position = state.position;
        while (ch !== 0 && !is_WS_OR_EOL(ch)) {
          ch = state.input.charCodeAt(++state.position);
        }
        directiveName = state.input.slice(_position, state.position);
        directiveArgs = [];
        if (directiveName.length < 1) {
          throwError(state, "directive name must not be less than one character in length");
        }
        while (ch !== 0) {
          while (is_WHITE_SPACE(ch)) {
            ch = state.input.charCodeAt(++state.position);
          }
          if (ch === 35) {
            do {
              ch = state.input.charCodeAt(++state.position);
            } while (ch !== 0 && !is_EOL(ch));
            break;
          }
          if (is_EOL(ch)) break;
          _position = state.position;
          while (ch !== 0 && !is_WS_OR_EOL(ch)) {
            ch = state.input.charCodeAt(++state.position);
          }
          directiveArgs.push(state.input.slice(_position, state.position));
        }
        if (ch !== 0) readLineBreak(state);
        if (_hasOwnProperty.call(directiveHandlers, directiveName)) {
          directiveHandlers[directiveName](state, directiveName, directiveArgs);
        } else {
          throwWarning(state, 'unknown document directive "' + directiveName + '"');
        }
      }
      skipSeparationSpace(state, true, -1);
      if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 && state.input.charCodeAt(state.position + 1) === 45 && state.input.charCodeAt(state.position + 2) === 45) {
        state.position += 3;
        skipSeparationSpace(state, true, -1);
      } else if (hasDirectives) {
        throwError(state, "directives end mark is expected");
      }
      composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
      skipSeparationSpace(state, true, -1);
      if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
        throwWarning(state, "non-ASCII line breaks are interpreted as content");
      }
      state.documents.push(state.result);
      if (state.position === state.lineStart && testDocumentSeparator(state)) {
        if (state.input.charCodeAt(state.position) === 46) {
          state.position += 3;
          skipSeparationSpace(state, true, -1);
        }
        return;
      }
      if (state.position < state.length - 1) {
        throwError(state, "end of the stream or a document separator is expected");
      } else {
        return;
      }
    }
    function loadDocuments(input, options2) {
      input = String(input);
      options2 = options2 || {};
      if (input.length !== 0) {
        if (input.charCodeAt(input.length - 1) !== 10 && input.charCodeAt(input.length - 1) !== 13) {
          input += "\n";
        }
        if (input.charCodeAt(0) === 65279) {
          input = input.slice(1);
        }
      }
      var state = new State(input, options2);
      var nullpos = input.indexOf("\0");
      if (nullpos !== -1) {
        state.position = nullpos;
        throwError(state, "null byte is not allowed in input");
      }
      state.input += "\0";
      while (state.input.charCodeAt(state.position) === 32) {
        state.lineIndent += 1;
        state.position += 1;
      }
      while (state.position < state.length - 1) {
        readDocument(state);
      }
      return state.documents;
    }
    function loadAll(input, iterator, options2) {
      if (iterator !== null && typeof iterator === "object" && typeof options2 === "undefined") {
        options2 = iterator;
        iterator = null;
      }
      var documents = loadDocuments(input, options2);
      if (typeof iterator !== "function") {
        return documents;
      }
      for (var index = 0, length = documents.length; index < length; index += 1) {
        iterator(documents[index]);
      }
    }
    function load(input, options2) {
      var documents = loadDocuments(input, options2);
      if (documents.length === 0) {
        return void 0;
      } else if (documents.length === 1) {
        return documents[0];
      }
      throw new YAMLException("expected a single document in the stream, but found more");
    }
    function safeLoadAll(input, iterator, options2) {
      if (typeof iterator === "object" && iterator !== null && typeof options2 === "undefined") {
        options2 = iterator;
        iterator = null;
      }
      return loadAll(input, iterator, common.extend({ schema: DEFAULT_SAFE_SCHEMA }, options2));
    }
    function safeLoad(input, options2) {
      return load(input, common.extend({ schema: DEFAULT_SAFE_SCHEMA }, options2));
    }
    module2.exports.loadAll = loadAll;
    module2.exports.load = load;
    module2.exports.safeLoadAll = safeLoadAll;
    module2.exports.safeLoad = safeLoad;
  }
});

// node_modules/js-yaml/lib/js-yaml/dumper.js
var require_dumper = __commonJS({
  "node_modules/js-yaml/lib/js-yaml/dumper.js"(exports2, module2) {
    "use strict";
    var common = require_common();
    var YAMLException = require_exception();
    var DEFAULT_FULL_SCHEMA = require_default_full();
    var DEFAULT_SAFE_SCHEMA = require_default_safe();
    var _toString = Object.prototype.toString;
    var _hasOwnProperty = Object.prototype.hasOwnProperty;
    var CHAR_TAB = 9;
    var CHAR_LINE_FEED = 10;
    var CHAR_CARRIAGE_RETURN = 13;
    var CHAR_SPACE = 32;
    var CHAR_EXCLAMATION = 33;
    var CHAR_DOUBLE_QUOTE = 34;
    var CHAR_SHARP = 35;
    var CHAR_PERCENT = 37;
    var CHAR_AMPERSAND = 38;
    var CHAR_SINGLE_QUOTE = 39;
    var CHAR_ASTERISK = 42;
    var CHAR_COMMA = 44;
    var CHAR_MINUS = 45;
    var CHAR_COLON = 58;
    var CHAR_EQUALS = 61;
    var CHAR_GREATER_THAN = 62;
    var CHAR_QUESTION = 63;
    var CHAR_COMMERCIAL_AT = 64;
    var CHAR_LEFT_SQUARE_BRACKET = 91;
    var CHAR_RIGHT_SQUARE_BRACKET = 93;
    var CHAR_GRAVE_ACCENT = 96;
    var CHAR_LEFT_CURLY_BRACKET = 123;
    var CHAR_VERTICAL_LINE = 124;
    var CHAR_RIGHT_CURLY_BRACKET = 125;
    var ESCAPE_SEQUENCES = {};
    ESCAPE_SEQUENCES[0] = "\\0";
    ESCAPE_SEQUENCES[7] = "\\a";
    ESCAPE_SEQUENCES[8] = "\\b";
    ESCAPE_SEQUENCES[9] = "\\t";
    ESCAPE_SEQUENCES[10] = "\\n";
    ESCAPE_SEQUENCES[11] = "\\v";
    ESCAPE_SEQUENCES[12] = "\\f";
    ESCAPE_SEQUENCES[13] = "\\r";
    ESCAPE_SEQUENCES[27] = "\\e";
    ESCAPE_SEQUENCES[34] = '\\"';
    ESCAPE_SEQUENCES[92] = "\\\\";
    ESCAPE_SEQUENCES[133] = "\\N";
    ESCAPE_SEQUENCES[160] = "\\_";
    ESCAPE_SEQUENCES[8232] = "\\L";
    ESCAPE_SEQUENCES[8233] = "\\P";
    var DEPRECATED_BOOLEANS_SYNTAX = [
      "y",
      "Y",
      "yes",
      "Yes",
      "YES",
      "on",
      "On",
      "ON",
      "n",
      "N",
      "no",
      "No",
      "NO",
      "off",
      "Off",
      "OFF"
    ];
    function compileStyleMap(schema, map) {
      var result, keys, index, length, tag, style, type;
      if (map === null) return {};
      result = {};
      keys = Object.keys(map);
      for (index = 0, length = keys.length; index < length; index += 1) {
        tag = keys[index];
        style = String(map[tag]);
        if (tag.slice(0, 2) === "!!") {
          tag = "tag:yaml.org,2002:" + tag.slice(2);
        }
        type = schema.compiledTypeMap["fallback"][tag];
        if (type && _hasOwnProperty.call(type.styleAliases, style)) {
          style = type.styleAliases[style];
        }
        result[tag] = style;
      }
      return result;
    }
    function encodeHex(character) {
      var string, handle, length;
      string = character.toString(16).toUpperCase();
      if (character <= 255) {
        handle = "x";
        length = 2;
      } else if (character <= 65535) {
        handle = "u";
        length = 4;
      } else if (character <= 4294967295) {
        handle = "U";
        length = 8;
      } else {
        throw new YAMLException("code point within a string may not be greater than 0xFFFFFFFF");
      }
      return "\\" + handle + common.repeat("0", length - string.length) + string;
    }
    function State(options2) {
      this.schema = options2["schema"] || DEFAULT_FULL_SCHEMA;
      this.indent = Math.max(1, options2["indent"] || 2);
      this.noArrayIndent = options2["noArrayIndent"] || false;
      this.skipInvalid = options2["skipInvalid"] || false;
      this.flowLevel = common.isNothing(options2["flowLevel"]) ? -1 : options2["flowLevel"];
      this.styleMap = compileStyleMap(this.schema, options2["styles"] || null);
      this.sortKeys = options2["sortKeys"] || false;
      this.lineWidth = options2["lineWidth"] || 80;
      this.noRefs = options2["noRefs"] || false;
      this.noCompatMode = options2["noCompatMode"] || false;
      this.condenseFlow = options2["condenseFlow"] || false;
      this.implicitTypes = this.schema.compiledImplicit;
      this.explicitTypes = this.schema.compiledExplicit;
      this.tag = null;
      this.result = "";
      this.duplicates = [];
      this.usedDuplicates = null;
    }
    function indentString(string, spaces) {
      var ind = common.repeat(" ", spaces), position = 0, next = -1, result = "", line, length = string.length;
      while (position < length) {
        next = string.indexOf("\n", position);
        if (next === -1) {
          line = string.slice(position);
          position = length;
        } else {
          line = string.slice(position, next + 1);
          position = next + 1;
        }
        if (line.length && line !== "\n") result += ind;
        result += line;
      }
      return result;
    }
    function generateNextLine(state, level) {
      return "\n" + common.repeat(" ", state.indent * level);
    }
    function testImplicitResolving(state, str2) {
      var index, length, type;
      for (index = 0, length = state.implicitTypes.length; index < length; index += 1) {
        type = state.implicitTypes[index];
        if (type.resolve(str2)) {
          return true;
        }
      }
      return false;
    }
    function isWhitespace(c) {
      return c === CHAR_SPACE || c === CHAR_TAB;
    }
    function isPrintable(c) {
      return 32 <= c && c <= 126 || 161 <= c && c <= 55295 && c !== 8232 && c !== 8233 || 57344 <= c && c <= 65533 && c !== 65279 || 65536 <= c && c <= 1114111;
    }
    function isNsChar(c) {
      return isPrintable(c) && !isWhitespace(c) && c !== 65279 && c !== CHAR_CARRIAGE_RETURN && c !== CHAR_LINE_FEED;
    }
    function isPlainSafe(c, prev) {
      return isPrintable(c) && c !== 65279 && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && c !== CHAR_COLON && (c !== CHAR_SHARP || prev && isNsChar(prev));
    }
    function isPlainSafeFirst(c) {
      return isPrintable(c) && c !== 65279 && !isWhitespace(c) && c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_EQUALS && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
    }
    function needIndentIndicator(string) {
      var leadingSpaceRe = /^\n* /;
      return leadingSpaceRe.test(string);
    }
    var STYLE_PLAIN = 1;
    var STYLE_SINGLE = 2;
    var STYLE_LITERAL = 3;
    var STYLE_FOLDED = 4;
    var STYLE_DOUBLE = 5;
    function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType) {
      var i;
      var char, prev_char;
      var hasLineBreak = false;
      var hasFoldableLine = false;
      var shouldTrackWidth = lineWidth !== -1;
      var previousLineBreak = -1;
      var plain = isPlainSafeFirst(string.charCodeAt(0)) && !isWhitespace(string.charCodeAt(string.length - 1));
      if (singleLineOnly) {
        for (i = 0; i < string.length; i++) {
          char = string.charCodeAt(i);
          if (!isPrintable(char)) {
            return STYLE_DOUBLE;
          }
          prev_char = i > 0 ? string.charCodeAt(i - 1) : null;
          plain = plain && isPlainSafe(char, prev_char);
        }
      } else {
        for (i = 0; i < string.length; i++) {
          char = string.charCodeAt(i);
          if (char === CHAR_LINE_FEED) {
            hasLineBreak = true;
            if (shouldTrackWidth) {
              hasFoldableLine = hasFoldableLine || // Foldable line = too long, and not more-indented.
              i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
              previousLineBreak = i;
            }
          } else if (!isPrintable(char)) {
            return STYLE_DOUBLE;
          }
          prev_char = i > 0 ? string.charCodeAt(i - 1) : null;
          plain = plain && isPlainSafe(char, prev_char);
        }
        hasFoldableLine = hasFoldableLine || shouldTrackWidth && (i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ");
      }
      if (!hasLineBreak && !hasFoldableLine) {
        return plain && !testAmbiguousType(string) ? STYLE_PLAIN : STYLE_SINGLE;
      }
      if (indentPerLevel > 9 && needIndentIndicator(string)) {
        return STYLE_DOUBLE;
      }
      return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
    }
    function writeScalar(state, string, level, iskey) {
      state.dump = function() {
        if (string.length === 0) {
          return "''";
        }
        if (!state.noCompatMode && DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1) {
          return "'" + string + "'";
        }
        var indent = state.indent * Math.max(1, level);
        var lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
        var singleLineOnly = iskey || state.flowLevel > -1 && level >= state.flowLevel;
        function testAmbiguity(string2) {
          return testImplicitResolving(state, string2);
        }
        switch (chooseScalarStyle(string, singleLineOnly, state.indent, lineWidth, testAmbiguity)) {
          case STYLE_PLAIN:
            return string;
          case STYLE_SINGLE:
            return "'" + string.replace(/'/g, "''") + "'";
          case STYLE_LITERAL:
            return "|" + blockHeader(string, state.indent) + dropEndingNewline(indentString(string, indent));
          case STYLE_FOLDED:
            return ">" + blockHeader(string, state.indent) + dropEndingNewline(indentString(foldString(string, lineWidth), indent));
          case STYLE_DOUBLE:
            return '"' + escapeString(string, lineWidth) + '"';
          default:
            throw new YAMLException("impossible error: invalid scalar style");
        }
      }();
    }
    function blockHeader(string, indentPerLevel) {
      var indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
      var clip = string[string.length - 1] === "\n";
      var keep = clip && (string[string.length - 2] === "\n" || string === "\n");
      var chomp = keep ? "+" : clip ? "" : "-";
      return indentIndicator + chomp + "\n";
    }
    function dropEndingNewline(string) {
      return string[string.length - 1] === "\n" ? string.slice(0, -1) : string;
    }
    function foldString(string, width) {
      var lineRe = /(\n+)([^\n]*)/g;
      var result = function() {
        var nextLF = string.indexOf("\n");
        nextLF = nextLF !== -1 ? nextLF : string.length;
        lineRe.lastIndex = nextLF;
        return foldLine(string.slice(0, nextLF), width);
      }();
      var prevMoreIndented = string[0] === "\n" || string[0] === " ";
      var moreIndented;
      var match;
      while (match = lineRe.exec(string)) {
        var prefix = match[1], line = match[2];
        moreIndented = line[0] === " ";
        result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") + foldLine(line, width);
        prevMoreIndented = moreIndented;
      }
      return result;
    }
    function foldLine(line, width) {
      if (line === "" || line[0] === " ") return line;
      var breakRe = / [^ ]/g;
      var match;
      var start = 0, end, curr = 0, next = 0;
      var result = "";
      while (match = breakRe.exec(line)) {
        next = match.index;
        if (next - start > width) {
          end = curr > start ? curr : next;
          result += "\n" + line.slice(start, end);
          start = end + 1;
        }
        curr = next;
      }
      result += "\n";
      if (line.length - start > width && curr > start) {
        result += line.slice(start, curr) + "\n" + line.slice(curr + 1);
      } else {
        result += line.slice(start);
      }
      return result.slice(1);
    }
    function escapeString(string) {
      var result = "";
      var char, nextChar;
      var escapeSeq;
      for (var i = 0; i < string.length; i++) {
        char = string.charCodeAt(i);
        if (char >= 55296 && char <= 56319) {
          nextChar = string.charCodeAt(i + 1);
          if (nextChar >= 56320 && nextChar <= 57343) {
            result += encodeHex((char - 55296) * 1024 + nextChar - 56320 + 65536);
            i++;
            continue;
          }
        }
        escapeSeq = ESCAPE_SEQUENCES[char];
        result += !escapeSeq && isPrintable(char) ? string[i] : escapeSeq || encodeHex(char);
      }
      return result;
    }
    function writeFlowSequence(state, level, object) {
      var _result = "", _tag = state.tag, index, length;
      for (index = 0, length = object.length; index < length; index += 1) {
        if (writeNode(state, level, object[index], false, false)) {
          if (index !== 0) _result += "," + (!state.condenseFlow ? " " : "");
          _result += state.dump;
        }
      }
      state.tag = _tag;
      state.dump = "[" + _result + "]";
    }
    function writeBlockSequence(state, level, object, compact) {
      var _result = "", _tag = state.tag, index, length;
      for (index = 0, length = object.length; index < length; index += 1) {
        if (writeNode(state, level + 1, object[index], true, true)) {
          if (!compact || index !== 0) {
            _result += generateNextLine(state, level);
          }
          if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
            _result += "-";
          } else {
            _result += "- ";
          }
          _result += state.dump;
        }
      }
      state.tag = _tag;
      state.dump = _result || "[]";
    }
    function writeFlowMapping(state, level, object) {
      var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, pairBuffer;
      for (index = 0, length = objectKeyList.length; index < length; index += 1) {
        pairBuffer = "";
        if (index !== 0) pairBuffer += ", ";
        if (state.condenseFlow) pairBuffer += '"';
        objectKey = objectKeyList[index];
        objectValue = object[objectKey];
        if (!writeNode(state, level, objectKey, false, false)) {
          continue;
        }
        if (state.dump.length > 1024) pairBuffer += "? ";
        pairBuffer += state.dump + (state.condenseFlow ? '"' : "") + ":" + (state.condenseFlow ? "" : " ");
        if (!writeNode(state, level, objectValue, false, false)) {
          continue;
        }
        pairBuffer += state.dump;
        _result += pairBuffer;
      }
      state.tag = _tag;
      state.dump = "{" + _result + "}";
    }
    function writeBlockMapping(state, level, object, compact) {
      var _result = "", _tag = state.tag, objectKeyList = Object.keys(object), index, length, objectKey, objectValue, explicitPair, pairBuffer;
      if (state.sortKeys === true) {
        objectKeyList.sort();
      } else if (typeof state.sortKeys === "function") {
        objectKeyList.sort(state.sortKeys);
      } else if (state.sortKeys) {
        throw new YAMLException("sortKeys must be a boolean or a function");
      }
      for (index = 0, length = objectKeyList.length; index < length; index += 1) {
        pairBuffer = "";
        if (!compact || index !== 0) {
          pairBuffer += generateNextLine(state, level);
        }
        objectKey = objectKeyList[index];
        objectValue = object[objectKey];
        if (!writeNode(state, level + 1, objectKey, true, true, true)) {
          continue;
        }
        explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
        if (explicitPair) {
          if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
            pairBuffer += "?";
          } else {
            pairBuffer += "? ";
          }
        }
        pairBuffer += state.dump;
        if (explicitPair) {
          pairBuffer += generateNextLine(state, level);
        }
        if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
          continue;
        }
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
          pairBuffer += ":";
        } else {
          pairBuffer += ": ";
        }
        pairBuffer += state.dump;
        _result += pairBuffer;
      }
      state.tag = _tag;
      state.dump = _result || "{}";
    }
    function detectType(state, object, explicit) {
      var _result, typeList, index, length, type, style;
      typeList = explicit ? state.explicitTypes : state.implicitTypes;
      for (index = 0, length = typeList.length; index < length; index += 1) {
        type = typeList[index];
        if ((type.instanceOf || type.predicate) && (!type.instanceOf || typeof object === "object" && object instanceof type.instanceOf) && (!type.predicate || type.predicate(object))) {
          state.tag = explicit ? type.tag : "?";
          if (type.represent) {
            style = state.styleMap[type.tag] || type.defaultStyle;
            if (_toString.call(type.represent) === "[object Function]") {
              _result = type.represent(object, style);
            } else if (_hasOwnProperty.call(type.represent, style)) {
              _result = type.represent[style](object, style);
            } else {
              throw new YAMLException("!<" + type.tag + '> tag resolver accepts not "' + style + '" style');
            }
            state.dump = _result;
          }
          return true;
        }
      }
      return false;
    }
    function writeNode(state, level, object, block, compact, iskey) {
      state.tag = null;
      state.dump = object;
      if (!detectType(state, object, false)) {
        detectType(state, object, true);
      }
      var type = _toString.call(state.dump);
      if (block) {
        block = state.flowLevel < 0 || state.flowLevel > level;
      }
      var objectOrArray = type === "[object Object]" || type === "[object Array]", duplicateIndex, duplicate;
      if (objectOrArray) {
        duplicateIndex = state.duplicates.indexOf(object);
        duplicate = duplicateIndex !== -1;
      }
      if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) {
        compact = false;
      }
      if (duplicate && state.usedDuplicates[duplicateIndex]) {
        state.dump = "*ref_" + duplicateIndex;
      } else {
        if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
          state.usedDuplicates[duplicateIndex] = true;
        }
        if (type === "[object Object]") {
          if (block && Object.keys(state.dump).length !== 0) {
            writeBlockMapping(state, level, state.dump, compact);
            if (duplicate) {
              state.dump = "&ref_" + duplicateIndex + state.dump;
            }
          } else {
            writeFlowMapping(state, level, state.dump);
            if (duplicate) {
              state.dump = "&ref_" + duplicateIndex + " " + state.dump;
            }
          }
        } else if (type === "[object Array]") {
          var arrayLevel = state.noArrayIndent && level > 0 ? level - 1 : level;
          if (block && state.dump.length !== 0) {
            writeBlockSequence(state, arrayLevel, state.dump, compact);
            if (duplicate) {
              state.dump = "&ref_" + duplicateIndex + state.dump;
            }
          } else {
            writeFlowSequence(state, arrayLevel, state.dump);
            if (duplicate) {
              state.dump = "&ref_" + duplicateIndex + " " + state.dump;
            }
          }
        } else if (type === "[object String]") {
          if (state.tag !== "?") {
            writeScalar(state, state.dump, level, iskey);
          }
        } else {
          if (state.skipInvalid) return false;
          throw new YAMLException("unacceptable kind of an object to dump " + type);
        }
        if (state.tag !== null && state.tag !== "?") {
          state.dump = "!<" + state.tag + "> " + state.dump;
        }
      }
      return true;
    }
    function getDuplicateReferences(object, state) {
      var objects = [], duplicatesIndexes = [], index, length;
      inspectNode(object, objects, duplicatesIndexes);
      for (index = 0, length = duplicatesIndexes.length; index < length; index += 1) {
        state.duplicates.push(objects[duplicatesIndexes[index]]);
      }
      state.usedDuplicates = new Array(length);
    }
    function inspectNode(object, objects, duplicatesIndexes) {
      var objectKeyList, index, length;
      if (object !== null && typeof object === "object") {
        index = objects.indexOf(object);
        if (index !== -1) {
          if (duplicatesIndexes.indexOf(index) === -1) {
            duplicatesIndexes.push(index);
          }
        } else {
          objects.push(object);
          if (Array.isArray(object)) {
            for (index = 0, length = object.length; index < length; index += 1) {
              inspectNode(object[index], objects, duplicatesIndexes);
            }
          } else {
            objectKeyList = Object.keys(object);
            for (index = 0, length = objectKeyList.length; index < length; index += 1) {
              inspectNode(object[objectKeyList[index]], objects, duplicatesIndexes);
            }
          }
        }
      }
    }
    function dump(input, options2) {
      options2 = options2 || {};
      var state = new State(options2);
      if (!state.noRefs) getDuplicateReferences(input, state);
      if (writeNode(state, 0, input, true, true)) return state.dump + "\n";
      return "";
    }
    function safeDump(input, options2) {
      return dump(input, common.extend({ schema: DEFAULT_SAFE_SCHEMA }, options2));
    }
    module2.exports.dump = dump;
    module2.exports.safeDump = safeDump;
  }
});

// node_modules/js-yaml/lib/js-yaml.js
var require_js_yaml = __commonJS({
  "node_modules/js-yaml/lib/js-yaml.js"(exports2, module2) {
    "use strict";
    var loader = require_loader();
    var dumper = require_dumper();
    function deprecated(name) {
      return function() {
        throw new Error("Function " + name + " is deprecated and cannot be used.");
      };
    }
    module2.exports.Type = require_type();
    module2.exports.Schema = require_schema();
    module2.exports.FAILSAFE_SCHEMA = require_failsafe();
    module2.exports.JSON_SCHEMA = require_json();
    module2.exports.CORE_SCHEMA = require_core();
    module2.exports.DEFAULT_SAFE_SCHEMA = require_default_safe();
    module2.exports.DEFAULT_FULL_SCHEMA = require_default_full();
    module2.exports.load = loader.load;
    module2.exports.loadAll = loader.loadAll;
    module2.exports.safeLoad = loader.safeLoad;
    module2.exports.safeLoadAll = loader.safeLoadAll;
    module2.exports.dump = dumper.dump;
    module2.exports.safeDump = dumper.safeDump;
    module2.exports.YAMLException = require_exception();
    module2.exports.MINIMAL_SCHEMA = require_failsafe();
    module2.exports.SAFE_SCHEMA = require_default_safe();
    module2.exports.DEFAULT_SCHEMA = require_default_full();
    module2.exports.scan = deprecated("scan");
    module2.exports.parse = deprecated("parse");
    module2.exports.compose = deprecated("compose");
    module2.exports.addConstructor = deprecated("addConstructor");
  }
});

// node_modules/js-yaml/index.js
var require_js_yaml2 = __commonJS({
  "node_modules/js-yaml/index.js"(exports2, module2) {
    "use strict";
    var yaml2 = require_js_yaml();
    module2.exports = yaml2;
  }
});

// node_modules/gray-matter/lib/engines.js
var require_engines = __commonJS({
  "node_modules/gray-matter/lib/engines.js"(exports, module) {
    "use strict";
    var yaml = require_js_yaml2();
    var engines = exports = module.exports;
    engines.yaml = {
      parse: yaml.safeLoad.bind(yaml),
      stringify: yaml.safeDump.bind(yaml)
    };
    engines.json = {
      parse: JSON.parse.bind(JSON),
      stringify: function(obj, options2) {
        const opts = Object.assign({ replacer: null, space: 2 }, options2);
        return JSON.stringify(obj, opts.replacer, opts.space);
      }
    };
    engines.javascript = {
      parse: function parse(str, options, wrap) {
        try {
          if (wrap !== false) {
            str = "(function() {\nreturn " + str.trim() + ";\n}());";
          }
          return eval(str) || {};
        } catch (err) {
          if (wrap !== false && /(unexpected|identifier)/i.test(err.message)) {
            return parse(str, options, false);
          }
          throw new SyntaxError(err);
        }
      },
      stringify: function() {
        throw new Error("stringifying JavaScript is not supported");
      }
    };
  }
});

// node_modules/strip-bom-string/index.js
var require_strip_bom_string = __commonJS({
  "node_modules/strip-bom-string/index.js"(exports2, module2) {
    "use strict";
    module2.exports = function(str2) {
      if (typeof str2 === "string" && str2.charAt(0) === "\uFEFF") {
        return str2.slice(1);
      }
      return str2;
    };
  }
});

// node_modules/gray-matter/lib/utils.js
var require_utils = __commonJS({
  "node_modules/gray-matter/lib/utils.js"(exports2) {
    "use strict";
    var stripBom = require_strip_bom_string();
    var typeOf = require_kind_of();
    exports2.define = function(obj, key, val) {
      Reflect.defineProperty(obj, key, {
        enumerable: false,
        configurable: true,
        writable: true,
        value: val
      });
    };
    exports2.isBuffer = function(val) {
      return typeOf(val) === "buffer";
    };
    exports2.isObject = function(val) {
      return typeOf(val) === "object";
    };
    exports2.toBuffer = function(input) {
      return typeof input === "string" ? Buffer.from(input) : input;
    };
    exports2.toString = function(input) {
      if (exports2.isBuffer(input)) return stripBom(String(input));
      if (typeof input !== "string") {
        throw new TypeError("expected input to be a string or buffer");
      }
      return stripBom(input);
    };
    exports2.arrayify = function(val) {
      return val ? Array.isArray(val) ? val : [val] : [];
    };
    exports2.startsWith = function(str2, substr, len) {
      if (typeof len !== "number") len = substr.length;
      return str2.slice(0, len) === substr;
    };
  }
});

// node_modules/gray-matter/lib/defaults.js
var require_defaults = __commonJS({
  "node_modules/gray-matter/lib/defaults.js"(exports2, module2) {
    "use strict";
    var engines2 = require_engines();
    var utils = require_utils();
    module2.exports = function(options2) {
      const opts = Object.assign({}, options2);
      opts.delimiters = utils.arrayify(opts.delims || opts.delimiters || "---");
      if (opts.delimiters.length === 1) {
        opts.delimiters.push(opts.delimiters[0]);
      }
      opts.language = (opts.language || opts.lang || "yaml").toLowerCase();
      opts.engines = Object.assign({}, engines2, opts.parsers, opts.engines);
      return opts;
    };
  }
});

// node_modules/gray-matter/lib/engine.js
var require_engine = __commonJS({
  "node_modules/gray-matter/lib/engine.js"(exports2, module2) {
    "use strict";
    module2.exports = function(name, options2) {
      let engine = options2.engines[name] || options2.engines[aliase(name)];
      if (typeof engine === "undefined") {
        throw new Error('gray-matter engine "' + name + '" is not registered');
      }
      if (typeof engine === "function") {
        engine = { parse: engine };
      }
      return engine;
    };
    function aliase(name) {
      switch (name.toLowerCase()) {
        case "js":
        case "javascript":
          return "javascript";
        case "coffee":
        case "coffeescript":
        case "cson":
          return "coffee";
        case "yaml":
        case "yml":
          return "yaml";
        default: {
          return name;
        }
      }
    }
  }
});

// node_modules/gray-matter/lib/stringify.js
var require_stringify = __commonJS({
  "node_modules/gray-matter/lib/stringify.js"(exports2, module2) {
    "use strict";
    var typeOf = require_kind_of();
    var getEngine = require_engine();
    var defaults = require_defaults();
    module2.exports = function(file, data, options2) {
      if (data == null && options2 == null) {
        switch (typeOf(file)) {
          case "object":
            data = file.data;
            options2 = {};
            break;
          case "string":
            return file;
          default: {
            throw new TypeError("expected file to be a string or object");
          }
        }
      }
      const str2 = file.content;
      const opts = defaults(options2);
      if (data == null) {
        if (!opts.data) return file;
        data = opts.data;
      }
      const language = file.language || opts.language;
      const engine = getEngine(language, opts);
      if (typeof engine.stringify !== "function") {
        throw new TypeError('expected "' + language + '.stringify" to be a function');
      }
      data = Object.assign({}, file.data, data);
      const open = opts.delimiters[0];
      const close = opts.delimiters[1];
      const matter3 = engine.stringify(data, options2).trim();
      let buf = "";
      if (matter3 !== "{}") {
        buf = newline(open) + newline(matter3) + newline(close);
      }
      if (typeof file.excerpt === "string" && file.excerpt !== "") {
        if (str2.indexOf(file.excerpt.trim()) === -1) {
          buf += newline(file.excerpt) + newline(close);
        }
      }
      return buf + newline(str2);
    };
    function newline(str2) {
      return str2.slice(-1) !== "\n" ? str2 + "\n" : str2;
    }
  }
});

// node_modules/gray-matter/lib/excerpt.js
var require_excerpt = __commonJS({
  "node_modules/gray-matter/lib/excerpt.js"(exports2, module2) {
    "use strict";
    var defaults = require_defaults();
    module2.exports = function(file, options2) {
      const opts = defaults(options2);
      if (file.data == null) {
        file.data = {};
      }
      if (typeof opts.excerpt === "function") {
        return opts.excerpt(file, opts);
      }
      const sep2 = file.data.excerpt_separator || opts.excerpt_separator;
      if (sep2 == null && (opts.excerpt === false || opts.excerpt == null)) {
        return file;
      }
      const delimiter = typeof opts.excerpt === "string" ? opts.excerpt : sep2 || opts.delimiters[0];
      const idx = file.content.indexOf(delimiter);
      if (idx !== -1) {
        file.excerpt = file.content.slice(0, idx);
      }
      return file;
    };
  }
});

// node_modules/gray-matter/lib/to-file.js
var require_to_file = __commonJS({
  "node_modules/gray-matter/lib/to-file.js"(exports2, module2) {
    "use strict";
    var typeOf = require_kind_of();
    var stringify = require_stringify();
    var utils = require_utils();
    module2.exports = function(file) {
      if (typeOf(file) !== "object") {
        file = { content: file };
      }
      if (typeOf(file.data) !== "object") {
        file.data = {};
      }
      if (file.contents && file.content == null) {
        file.content = file.contents;
      }
      utils.define(file, "orig", utils.toBuffer(file.content));
      utils.define(file, "language", file.language || "");
      utils.define(file, "matter", file.matter || "");
      utils.define(file, "stringify", function(data, options2) {
        if (options2 && options2.language) {
          file.language = options2.language;
        }
        return stringify(file, data, options2);
      });
      file.content = utils.toString(file.content);
      file.isEmpty = false;
      file.excerpt = "";
      return file;
    };
  }
});

// node_modules/gray-matter/lib/parse.js
var require_parse = __commonJS({
  "node_modules/gray-matter/lib/parse.js"(exports2, module2) {
    "use strict";
    var getEngine = require_engine();
    var defaults = require_defaults();
    module2.exports = function(language, str2, options2) {
      const opts = defaults(options2);
      const engine = getEngine(language, opts);
      if (typeof engine.parse !== "function") {
        throw new TypeError('expected "' + language + '.parse" to be a function');
      }
      return engine.parse(str2, opts);
    };
  }
});

// node_modules/gray-matter/index.js
var require_gray_matter = __commonJS({
  "node_modules/gray-matter/index.js"(exports2, module2) {
    "use strict";
    var fs2 = require("fs");
    var sections = require_section_matter();
    var defaults = require_defaults();
    var stringify = require_stringify();
    var excerpt = require_excerpt();
    var engines2 = require_engines();
    var toFile = require_to_file();
    var parse2 = require_parse();
    var utils = require_utils();
    function matter3(input, options2) {
      if (input === "") {
        return { data: {}, content: input, excerpt: "", orig: input };
      }
      let file = toFile(input);
      const cached = matter3.cache[file.content];
      if (!options2) {
        if (cached) {
          file = Object.assign({}, cached);
          file.orig = cached.orig;
          return file;
        }
        matter3.cache[file.content] = file;
      }
      return parseMatter(file, options2);
    }
    function parseMatter(file, options2) {
      const opts = defaults(options2);
      const open = opts.delimiters[0];
      const close = "\n" + opts.delimiters[1];
      let str2 = file.content;
      if (opts.language) {
        file.language = opts.language;
      }
      const openLen = open.length;
      if (!utils.startsWith(str2, open, openLen)) {
        excerpt(file, opts);
        return file;
      }
      if (str2.charAt(openLen) === open.slice(-1)) {
        return file;
      }
      str2 = str2.slice(openLen);
      const len = str2.length;
      const language = matter3.language(str2, opts);
      if (language.name) {
        file.language = language.name;
        str2 = str2.slice(language.raw.length);
      }
      let closeIndex = str2.indexOf(close);
      if (closeIndex === -1) {
        closeIndex = len;
      }
      file.matter = str2.slice(0, closeIndex);
      const block = file.matter.replace(/^\s*#[^\n]+/gm, "").trim();
      if (block === "") {
        file.isEmpty = true;
        file.empty = file.content;
        file.data = {};
      } else {
        file.data = parse2(file.language, file.matter, opts);
      }
      if (closeIndex === len) {
        file.content = "";
      } else {
        file.content = str2.slice(closeIndex + close.length);
        if (file.content[0] === "\r") {
          file.content = file.content.slice(1);
        }
        if (file.content[0] === "\n") {
          file.content = file.content.slice(1);
        }
      }
      excerpt(file, opts);
      if (opts.sections === true || typeof opts.section === "function") {
        sections(file, opts.section);
      }
      return file;
    }
    matter3.engines = engines2;
    matter3.stringify = function(file, data, options2) {
      if (typeof file === "string") file = matter3(file, options2);
      return stringify(file, data, options2);
    };
    matter3.read = function(filepath, options2) {
      const str2 = fs2.readFileSync(filepath, "utf8");
      const file = matter3(str2, options2);
      file.path = filepath;
      return file;
    };
    matter3.test = function(str2, options2) {
      return utils.startsWith(str2, defaults(options2).delimiters[0]);
    };
    matter3.language = function(str2, options2) {
      const opts = defaults(options2);
      const open = opts.delimiters[0];
      if (matter3.test(str2)) {
        str2 = str2.slice(open.length);
      }
      const language = str2.slice(0, str2.search(/\r?\n/));
      return {
        raw: language,
        name: language ? language.trim() : ""
      };
    };
    matter3.cache = {};
    matter3.clearCache = function() {
      matter3.cache = {};
    };
    module2.exports = matter3;
  }
});

// src/cli/main.ts
var path8 = __toESM(require("node:path"));
var import_node_crypto = require("node:crypto");

// node_modules/cac/dist/index.mjs
var import_events = require("events");
function toArr(any) {
  return any == null ? [] : Array.isArray(any) ? any : [any];
}
function toVal(out, key, val, opts) {
  var x, old = out[key], nxt = !!~opts.string.indexOf(key) ? val == null || val === true ? "" : String(val) : typeof val === "boolean" ? val : !!~opts.boolean.indexOf(key) ? val === "false" ? false : val === "true" || (out._.push((x = +val, x * 0 === 0) ? x : val), !!val) : (x = +val, x * 0 === 0) ? x : val;
  out[key] = old == null ? nxt : Array.isArray(old) ? old.concat(nxt) : [old, nxt];
}
function mri2(args, opts) {
  args = args || [];
  opts = opts || {};
  var k, arr, arg, name, val, out = { _: [] };
  var i = 0, j = 0, idx = 0, len = args.length;
  const alibi = opts.alias !== void 0;
  const strict = opts.unknown !== void 0;
  const defaults = opts.default !== void 0;
  opts.alias = opts.alias || {};
  opts.string = toArr(opts.string);
  opts.boolean = toArr(opts.boolean);
  if (alibi) {
    for (k in opts.alias) {
      arr = opts.alias[k] = toArr(opts.alias[k]);
      for (i = 0; i < arr.length; i++) {
        (opts.alias[arr[i]] = arr.concat(k)).splice(i, 1);
      }
    }
  }
  for (i = opts.boolean.length; i-- > 0; ) {
    arr = opts.alias[opts.boolean[i]] || [];
    for (j = arr.length; j-- > 0; ) opts.boolean.push(arr[j]);
  }
  for (i = opts.string.length; i-- > 0; ) {
    arr = opts.alias[opts.string[i]] || [];
    for (j = arr.length; j-- > 0; ) opts.string.push(arr[j]);
  }
  if (defaults) {
    for (k in opts.default) {
      name = typeof opts.default[k];
      arr = opts.alias[k] = opts.alias[k] || [];
      if (opts[name] !== void 0) {
        opts[name].push(k);
        for (i = 0; i < arr.length; i++) {
          opts[name].push(arr[i]);
        }
      }
    }
  }
  const keys = strict ? Object.keys(opts.alias) : [];
  for (i = 0; i < len; i++) {
    arg = args[i];
    if (arg === "--") {
      out._ = out._.concat(args.slice(++i));
      break;
    }
    for (j = 0; j < arg.length; j++) {
      if (arg.charCodeAt(j) !== 45) break;
    }
    if (j === 0) {
      out._.push(arg);
    } else if (arg.substring(j, j + 3) === "no-") {
      name = arg.substring(j + 3);
      if (strict && !~keys.indexOf(name)) {
        return opts.unknown(arg);
      }
      out[name] = false;
    } else {
      for (idx = j + 1; idx < arg.length; idx++) {
        if (arg.charCodeAt(idx) === 61) break;
      }
      name = arg.substring(j, idx);
      val = arg.substring(++idx) || (i + 1 === len || ("" + args[i + 1]).charCodeAt(0) === 45 || args[++i]);
      arr = j === 2 ? [name] : name;
      for (idx = 0; idx < arr.length; idx++) {
        name = arr[idx];
        if (strict && !~keys.indexOf(name)) return opts.unknown("-".repeat(j) + name);
        toVal(out, name, idx + 1 < arr.length || val, opts);
      }
    }
  }
  if (defaults) {
    for (k in opts.default) {
      if (out[k] === void 0) {
        out[k] = opts.default[k];
      }
    }
  }
  if (alibi) {
    for (k in out) {
      arr = opts.alias[k] || [];
      while (arr.length > 0) {
        out[arr.shift()] = out[k];
      }
    }
  }
  return out;
}
var removeBrackets = (v) => v.replace(/[<[].+/, "").trim();
var findAllBrackets = (v) => {
  const ANGLED_BRACKET_RE_GLOBAL = /<([^>]+)>/g;
  const SQUARE_BRACKET_RE_GLOBAL = /\[([^\]]+)\]/g;
  const res = [];
  const parse2 = (match) => {
    let variadic = false;
    let value = match[1];
    if (value.startsWith("...")) {
      value = value.slice(3);
      variadic = true;
    }
    return {
      required: match[0].startsWith("<"),
      value,
      variadic
    };
  };
  let angledMatch;
  while (angledMatch = ANGLED_BRACKET_RE_GLOBAL.exec(v)) {
    res.push(parse2(angledMatch));
  }
  let squareMatch;
  while (squareMatch = SQUARE_BRACKET_RE_GLOBAL.exec(v)) {
    res.push(parse2(squareMatch));
  }
  return res;
};
var getMriOptions = (options2) => {
  const result = { alias: {}, boolean: [] };
  for (const [index, option] of options2.entries()) {
    if (option.names.length > 1) {
      result.alias[option.names[0]] = option.names.slice(1);
    }
    if (option.isBoolean) {
      if (option.negated) {
        const hasStringTypeOption = options2.some((o, i) => {
          return i !== index && o.names.some((name) => option.names.includes(name)) && typeof o.required === "boolean";
        });
        if (!hasStringTypeOption) {
          result.boolean.push(option.names[0]);
        }
      } else {
        result.boolean.push(option.names[0]);
      }
    }
  }
  return result;
};
var findLongest = (arr) => {
  return arr.sort((a, b) => {
    return a.length > b.length ? -1 : 1;
  })[0];
};
var padRight = (str2, length) => {
  return str2.length >= length ? str2 : `${str2}${" ".repeat(length - str2.length)}`;
};
var camelcase = (input) => {
  return input.replace(/([a-z])-([a-z])/g, (_, p1, p2) => {
    return p1 + p2.toUpperCase();
  });
};
var setDotProp = (obj, keys, val) => {
  let i = 0;
  let length = keys.length;
  let t = obj;
  let x;
  for (; i < length; ++i) {
    x = t[keys[i]];
    t = t[keys[i]] = i === length - 1 ? val : x != null ? x : !!~keys[i + 1].indexOf(".") || !(+keys[i + 1] > -1) ? {} : [];
  }
};
var setByType = (obj, transforms) => {
  for (const key of Object.keys(transforms)) {
    const transform = transforms[key];
    if (transform.shouldTransform) {
      obj[key] = Array.prototype.concat.call([], obj[key]);
      if (typeof transform.transformFunction === "function") {
        obj[key] = obj[key].map(transform.transformFunction);
      }
    }
  }
};
var getFileName = (input) => {
  const m = /([^\\\/]+)$/.exec(input);
  return m ? m[1] : "";
};
var camelcaseOptionName = (name) => {
  return name.split(".").map((v, i) => {
    return i === 0 ? camelcase(v) : v;
  }).join(".");
};
var CACError = class extends Error {
  constructor(message) {
    super(message);
    this.name = this.constructor.name;
    if (typeof Error.captureStackTrace === "function") {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
  }
};
var Option = class {
  constructor(rawName, description, config) {
    this.rawName = rawName;
    this.description = description;
    this.config = Object.assign({}, config);
    rawName = rawName.replace(/\.\*/g, "");
    this.negated = false;
    this.names = removeBrackets(rawName).split(",").map((v) => {
      let name = v.trim().replace(/^-{1,2}/, "");
      if (name.startsWith("no-")) {
        this.negated = true;
        name = name.replace(/^no-/, "");
      }
      return camelcaseOptionName(name);
    }).sort((a, b) => a.length > b.length ? 1 : -1);
    this.name = this.names[this.names.length - 1];
    if (this.negated && this.config.default == null) {
      this.config.default = true;
    }
    if (rawName.includes("<")) {
      this.required = true;
    } else if (rawName.includes("[")) {
      this.required = false;
    } else {
      this.isBoolean = true;
    }
  }
};
var processArgs = process.argv;
var platformInfo = `${process.platform}-${process.arch} node-${process.version}`;
var Command = class {
  constructor(rawName, description, config = {}, cli) {
    this.rawName = rawName;
    this.description = description;
    this.config = config;
    this.cli = cli;
    this.options = [];
    this.aliasNames = [];
    this.name = removeBrackets(rawName);
    this.args = findAllBrackets(rawName);
    this.examples = [];
  }
  usage(text) {
    this.usageText = text;
    return this;
  }
  allowUnknownOptions() {
    this.config.allowUnknownOptions = true;
    return this;
  }
  ignoreOptionDefaultValue() {
    this.config.ignoreOptionDefaultValue = true;
    return this;
  }
  version(version, customFlags = "-v, --version") {
    this.versionNumber = version;
    this.option(customFlags, "Display version number");
    return this;
  }
  example(example) {
    this.examples.push(example);
    return this;
  }
  option(rawName, description, config) {
    const option = new Option(rawName, description, config);
    this.options.push(option);
    return this;
  }
  alias(name) {
    this.aliasNames.push(name);
    return this;
  }
  action(callback) {
    this.commandAction = callback;
    return this;
  }
  isMatched(name) {
    return this.name === name || this.aliasNames.includes(name);
  }
  get isDefaultCommand() {
    return this.name === "" || this.aliasNames.includes("!");
  }
  get isGlobalCommand() {
    return this instanceof GlobalCommand;
  }
  hasOption(name) {
    name = name.split(".")[0];
    return this.options.find((option) => {
      return option.names.includes(name);
    });
  }
  outputHelp() {
    const { name, commands } = this.cli;
    const {
      versionNumber,
      options: globalOptions,
      helpCallback
    } = this.cli.globalCommand;
    let sections = [
      {
        body: `${name}${versionNumber ? `/${versionNumber}` : ""}`
      }
    ];
    sections.push({
      title: "Usage",
      body: `  $ ${name} ${this.usageText || this.rawName}`
    });
    const showCommands = (this.isGlobalCommand || this.isDefaultCommand) && commands.length > 0;
    if (showCommands) {
      const longestCommandName = findLongest(commands.map((command) => command.rawName));
      sections.push({
        title: "Commands",
        body: commands.map((command) => {
          return `  ${padRight(command.rawName, longestCommandName.length)}  ${command.description}`;
        }).join("\n")
      });
      sections.push({
        title: `For more info, run any command with the \`--help\` flag`,
        body: commands.map((command) => `  $ ${name}${command.name === "" ? "" : ` ${command.name}`} --help`).join("\n")
      });
    }
    let options2 = this.isGlobalCommand ? globalOptions : [...this.options, ...globalOptions || []];
    if (!this.isGlobalCommand && !this.isDefaultCommand) {
      options2 = options2.filter((option) => option.name !== "version");
    }
    if (options2.length > 0) {
      const longestOptionName = findLongest(options2.map((option) => option.rawName));
      sections.push({
        title: "Options",
        body: options2.map((option) => {
          return `  ${padRight(option.rawName, longestOptionName.length)}  ${option.description} ${option.config.default === void 0 ? "" : `(default: ${option.config.default})`}`;
        }).join("\n")
      });
    }
    if (this.examples.length > 0) {
      sections.push({
        title: "Examples",
        body: this.examples.map((example) => {
          if (typeof example === "function") {
            return example(name);
          }
          return example;
        }).join("\n")
      });
    }
    if (helpCallback) {
      sections = helpCallback(sections) || sections;
    }
    console.log(sections.map((section) => {
      return section.title ? `${section.title}:
${section.body}` : section.body;
    }).join("\n\n"));
  }
  outputVersion() {
    const { name } = this.cli;
    const { versionNumber } = this.cli.globalCommand;
    if (versionNumber) {
      console.log(`${name}/${versionNumber} ${platformInfo}`);
    }
  }
  checkRequiredArgs() {
    const minimalArgsCount = this.args.filter((arg) => arg.required).length;
    if (this.cli.args.length < minimalArgsCount) {
      throw new CACError(`missing required args for command \`${this.rawName}\``);
    }
  }
  checkUnknownOptions() {
    const { options: options2, globalCommand } = this.cli;
    if (!this.config.allowUnknownOptions) {
      for (const name of Object.keys(options2)) {
        if (name !== "--" && !this.hasOption(name) && !globalCommand.hasOption(name)) {
          throw new CACError(`Unknown option \`${name.length > 1 ? `--${name}` : `-${name}`}\``);
        }
      }
    }
  }
  checkOptionValue() {
    const { options: parsedOptions, globalCommand } = this.cli;
    const options2 = [...globalCommand.options, ...this.options];
    for (const option of options2) {
      const value = parsedOptions[option.name.split(".")[0]];
      if (option.required) {
        const hasNegated = options2.some((o) => o.negated && o.names.includes(option.name));
        if (value === true || value === false && !hasNegated) {
          throw new CACError(`option \`${option.rawName}\` value is missing`);
        }
      }
    }
  }
};
var GlobalCommand = class extends Command {
  constructor(cli) {
    super("@@global@@", "", {}, cli);
  }
};
var __assign = Object.assign;
var CAC = class extends import_events.EventEmitter {
  constructor(name = "") {
    super();
    this.name = name;
    this.commands = [];
    this.rawArgs = [];
    this.args = [];
    this.options = {};
    this.globalCommand = new GlobalCommand(this);
    this.globalCommand.usage("<command> [options]");
  }
  usage(text) {
    this.globalCommand.usage(text);
    return this;
  }
  command(rawName, description, config) {
    const command = new Command(rawName, description || "", config, this);
    command.globalCommand = this.globalCommand;
    this.commands.push(command);
    return command;
  }
  option(rawName, description, config) {
    this.globalCommand.option(rawName, description, config);
    return this;
  }
  help(callback) {
    this.globalCommand.option("-h, --help", "Display this message");
    this.globalCommand.helpCallback = callback;
    this.showHelpOnExit = true;
    return this;
  }
  version(version, customFlags = "-v, --version") {
    this.globalCommand.version(version, customFlags);
    this.showVersionOnExit = true;
    return this;
  }
  example(example) {
    this.globalCommand.example(example);
    return this;
  }
  outputHelp() {
    if (this.matchedCommand) {
      this.matchedCommand.outputHelp();
    } else {
      this.globalCommand.outputHelp();
    }
  }
  outputVersion() {
    this.globalCommand.outputVersion();
  }
  setParsedInfo({ args, options: options2 }, matchedCommand, matchedCommandName) {
    this.args = args;
    this.options = options2;
    if (matchedCommand) {
      this.matchedCommand = matchedCommand;
    }
    if (matchedCommandName) {
      this.matchedCommandName = matchedCommandName;
    }
    return this;
  }
  unsetMatchedCommand() {
    this.matchedCommand = void 0;
    this.matchedCommandName = void 0;
  }
  parse(argv = processArgs, {
    run = true
  } = {}) {
    this.rawArgs = argv;
    if (!this.name) {
      this.name = argv[1] ? getFileName(argv[1]) : "cli";
    }
    let shouldParse = true;
    for (const command of this.commands) {
      const parsed = this.mri(argv.slice(2), command);
      const commandName = parsed.args[0];
      if (command.isMatched(commandName)) {
        shouldParse = false;
        const parsedInfo = __assign(__assign({}, parsed), {
          args: parsed.args.slice(1)
        });
        this.setParsedInfo(parsedInfo, command, commandName);
        this.emit(`command:${commandName}`, command);
      }
    }
    if (shouldParse) {
      for (const command of this.commands) {
        if (command.name === "") {
          shouldParse = false;
          const parsed = this.mri(argv.slice(2), command);
          this.setParsedInfo(parsed, command);
          this.emit(`command:!`, command);
        }
      }
    }
    if (shouldParse) {
      const parsed = this.mri(argv.slice(2));
      this.setParsedInfo(parsed);
    }
    if (this.options.help && this.showHelpOnExit) {
      this.outputHelp();
      run = false;
      this.unsetMatchedCommand();
    }
    if (this.options.version && this.showVersionOnExit && this.matchedCommandName == null) {
      this.outputVersion();
      run = false;
      this.unsetMatchedCommand();
    }
    const parsedArgv = { args: this.args, options: this.options };
    if (run) {
      this.runMatchedCommand();
    }
    if (!this.matchedCommand && this.args[0]) {
      this.emit("command:*");
    }
    return parsedArgv;
  }
  mri(argv, command) {
    const cliOptions = [
      ...this.globalCommand.options,
      ...command ? command.options : []
    ];
    const mriOptions = getMriOptions(cliOptions);
    let argsAfterDoubleDashes = [];
    const doubleDashesIndex = argv.indexOf("--");
    if (doubleDashesIndex > -1) {
      argsAfterDoubleDashes = argv.slice(doubleDashesIndex + 1);
      argv = argv.slice(0, doubleDashesIndex);
    }
    let parsed = mri2(argv, mriOptions);
    parsed = Object.keys(parsed).reduce((res, name) => {
      return __assign(__assign({}, res), {
        [camelcaseOptionName(name)]: parsed[name]
      });
    }, { _: [] });
    const args = parsed._;
    const options2 = {
      "--": argsAfterDoubleDashes
    };
    const ignoreDefault = command && command.config.ignoreOptionDefaultValue ? command.config.ignoreOptionDefaultValue : this.globalCommand.config.ignoreOptionDefaultValue;
    let transforms = /* @__PURE__ */ Object.create(null);
    for (const cliOption of cliOptions) {
      if (!ignoreDefault && cliOption.config.default !== void 0) {
        for (const name of cliOption.names) {
          options2[name] = cliOption.config.default;
        }
      }
      if (Array.isArray(cliOption.config.type)) {
        if (transforms[cliOption.name] === void 0) {
          transforms[cliOption.name] = /* @__PURE__ */ Object.create(null);
          transforms[cliOption.name]["shouldTransform"] = true;
          transforms[cliOption.name]["transformFunction"] = cliOption.config.type[0];
        }
      }
    }
    for (const key of Object.keys(parsed)) {
      if (key !== "_") {
        const keys = key.split(".");
        setDotProp(options2, keys, parsed[key]);
        setByType(options2, transforms);
      }
    }
    return {
      args,
      options: options2
    };
  }
  runMatchedCommand() {
    const { args, options: options2, matchedCommand: command } = this;
    if (!command || !command.commandAction)
      return;
    command.checkUnknownOptions();
    command.checkOptionValue();
    command.checkRequiredArgs();
    const actionArgs = [];
    command.args.forEach((arg, index) => {
      if (arg.variadic) {
        actionArgs.push(args.slice(index));
      } else {
        actionArgs.push(args[index]);
      }
    });
    actionArgs.push(options2);
    return command.commandAction.apply(this, actionArgs);
  }
};
var cac = (name = "") => new CAC(name);

// src/adapters/fs/NodeFileSystem.ts
var import_node_fs = require("node:fs");
var path = __toESM(require("node:path"));
var NodeFileSystem = class {
  async exists(absPath) {
    try {
      await import_node_fs.promises.access(absPath);
      return true;
    } catch {
      return false;
    }
  }
  readFile(absPath) {
    return import_node_fs.promises.readFile(absPath, "utf8");
  }
  async writeFile(absPath, content) {
    await import_node_fs.promises.mkdir(path.dirname(absPath), { recursive: true });
    await import_node_fs.promises.writeFile(absPath, content, "utf8");
  }
  async remove(absPath) {
    await import_node_fs.promises.rm(absPath, { force: true });
  }
  async list(absDir) {
    try {
      return await import_node_fs.promises.readdir(absDir);
    } catch (err) {
      if (err.code === "ENOENT") return [];
      throw err;
    }
  }
  async walk(absDir) {
    let entries;
    try {
      entries = await import_node_fs.promises.readdir(absDir, { withFileTypes: true });
    } catch (err) {
      if (err.code === "ENOENT") return [];
      throw err;
    }
    const out = [];
    for (const e of entries) {
      const full = path.join(absDir, e.name);
      if (e.isDirectory()) out.push(...await this.walk(full));
      else if (e.isFile()) out.push(full);
    }
    return out;
  }
};

// src/adapters/clock/SystemClock.ts
var SystemClock = class {
  now() {
    const override = process.env.ARCH_WIKI_NOW;
    return override ? new Date(override) : /* @__PURE__ */ new Date();
  }
};

// src/adapters/template/PluginTemplateStore.ts
var path2 = __toESM(require("node:path"));

// src/domain/errors.ts
var DomainError = class extends Error {
  constructor(message, exitCode = 2) {
    super(message);
    this.name = "DomainError";
    this.exitCode = exitCode;
  }
};

// src/adapters/template/PluginTemplateStore.ts
var PluginTemplateStore = class {
  constructor(dir, fs2) {
    this.dir = dir;
    this.fs = fs2;
  }
  async load(spec) {
    const p = path2.join(this.dir, spec.template);
    if (!await this.fs.exists(p)) {
      throw new DomainError(`template not found: ${spec.template} (looked in ${this.dir})`, 3);
    }
    return this.fs.readFile(p);
  }
  async listAll() {
    const names = (await this.fs.list(this.dir)).filter((n) => n.endsWith(".md")).sort();
    const out = [];
    for (const name of names) {
      out.push({ name, body: await this.fs.readFile(path2.join(this.dir, name)) });
    }
    return out;
  }
};

// src/adapters/template/FilePayloadTemplateStore.ts
var path3 = __toESM(require("node:path"));
var FilePayloadTemplateStore = class {
  constructor(dir, fs2) {
    this.dir = dir;
    this.fs = fs2;
  }
  async loadByName(name) {
    const p = path3.join(this.dir, name);
    if (!await this.fs.exists(p)) {
      throw new DomainError(`payload template not found: ${name} (looked in ${this.dir})`, 3);
    }
    return this.fs.readFile(p);
  }
};

// src/adapters/repo/FoamWikiRepository.ts
var path4 = __toESM(require("node:path"));
var import_gray_matter = __toESM(require_gray_matter());

// src/domain/model/ArtifactId.ts
var ID_RE = /^([A-Z]+)-(\d+)$/;
var ArtifactId = class _ArtifactId {
  constructor(prefix, num, pad) {
    this.prefix = prefix;
    this.num = num;
    this.pad = pad;
    if (!/^[A-Z]+$/.test(prefix)) throw new DomainError(`invalid id prefix: "${prefix}"`);
    if (!Number.isInteger(num) || num < 0) throw new DomainError(`invalid id number: ${num}`);
    if (!Number.isInteger(pad) || pad < 1) throw new DomainError(`invalid id pad: ${pad}`);
  }
  /** The zero-padded number, e.g. `007`. */
  get padded() {
    return String(this.num).padStart(this.pad, "0");
  }
  /** The full id, e.g. `QA-007`. */
  toString() {
    return `${this.prefix}-${this.padded}`;
  }
  /** Parse `QA-007` → ArtifactId(QA, 7, 3). Returns null if it does not match. */
  static parse(value) {
    const m = ID_RE.exec(value.trim());
    if (!m) return null;
    const prefix = m[1];
    const digits = m[2];
    return new _ArtifactId(prefix, Number(digits), digits.length);
  }
};

// src/domain/model/ArtifactType.ts
var named = (slug) => `${slug}.md`;
var prefixed = (id, slug) => {
  if (!id) throw new DomainError("numbered artifact requires an id");
  return `${id.prefix}-${id.padded}-${slug}.md`;
};
var ARTIFACT_SPECS = {
  "use-case": {
    kind: "use-case",
    prefix: "UC",
    pad: 3,
    folder: "drivers/use-cases",
    filename: prefixed,
    template: "use-case.md",
    hubFile: "arc42/01-introduction-and-goals.md",
    frontmatter: { type: "use-case", tags: ["uc"] }
  },
  "quality-attribute": {
    kind: "quality-attribute",
    prefix: "QA",
    pad: 3,
    folder: "drivers/quality-attributes",
    filename: prefixed,
    template: "quality-attribute.md",
    hubFile: "arc42/10-quality-requirements.md",
    frontmatter: { type: "quality-attribute", tags: ["qa"] }
  },
  "constraint": {
    kind: "constraint",
    prefix: "CON",
    pad: 3,
    folder: "drivers/constraints",
    filename: prefixed,
    template: "constraint.md",
    hubFile: "arc42/02-constraints.md",
    frontmatter: { type: "constraint", tags: ["con"] }
  },
  "concern": {
    kind: "concern",
    prefix: "CONC",
    pad: 3,
    folder: "drivers/concerns",
    filename: prefixed,
    template: "concern.md",
    hubFile: "arc42/08-crosscutting-concepts.md",
    frontmatter: { type: "concern", tags: ["conc"] }
  },
  "adr": {
    kind: "adr",
    prefix: "ADR",
    pad: 4,
    folder: "adrs",
    // MADR filename: 4-digit, zero-padded, NO `ADR-` prefix.
    filename: (id, slug) => {
      if (!id) throw new DomainError("adr requires an id");
      return `${id.padded}-${slug}.md`;
    },
    template: "adr.md",
    hubFile: "arc42/09-architecture-decisions.md",
    frontmatter: { type: "adr", status: "proposed", tags: ["adr", "adr/proposed"] }
  },
  "iteration": {
    kind: "iteration",
    prefix: "ITER",
    pad: 2,
    folder: "iterations",
    // ITER-NN.md — no slug.
    filename: (id) => {
      if (!id) throw new DomainError("iteration requires an id");
      return `${id.prefix}-${id.padded}.md`;
    },
    template: "iteration.md",
    hubFile: "arc42/04-solution-strategy.md",
    frontmatter: { type: "iteration", tags: ["iteration"] }
  },
  "entity": {
    kind: "entity",
    prefix: null,
    pad: 0,
    folder: "entities",
    filename: (_id, slug) => named(slug),
    template: "entity.md",
    hubFile: null,
    frontmatter: { type: "entity" }
  },
  "concept": {
    kind: "concept",
    prefix: null,
    pad: 0,
    folder: "concepts",
    filename: (_id, slug) => named(slug),
    template: "concept.md",
    hubFile: null,
    frontmatter: { type: "concept" }
  },
  "arc42": {
    kind: "arc42",
    prefix: null,
    pad: 0,
    folder: "arc42",
    filename: (_id, slug) => named(slug),
    template: "arc42-hub.md",
    hubFile: null,
    frontmatter: { type: "arc42" }
  }
};
var KIND_ALIASES = {
  uc: "use-case",
  "use-case": "use-case",
  qa: "quality-attribute",
  "quality-attribute": "quality-attribute",
  con: "constraint",
  constraint: "constraint",
  conc: "concern",
  concern: "concern",
  adr: "adr",
  iter: "iteration",
  iteration: "iteration",
  entity: "entity",
  concept: "concept",
  arc42: "arc42"
};
function resolveKind(token) {
  const kind = KIND_ALIASES[token.toLowerCase()];
  if (!kind) {
    const valid = Object.keys(KIND_ALIASES).sort().join(", ");
    throw new DomainError(`unknown artifact type "${token}" (valid: ${valid})`, 1);
  }
  return ARTIFACT_SPECS[kind];
}

// src/domain/services/WikilinkScanner.ts
var WIKILINK = /(!?)\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]/g;
var MDLINK = /\[[^\]]*\]\(([^)]+)\)/g;
var HEADING = /^#{1,6}\s+(.+?)\s*$/;
var LABEL = /^\s*\*\*([^*]+?):\*\*/;
function normalizeSection(s) {
  return s.trim().replace(/^\*\*\s*/, "").replace(/\s*\*\*$/, "").replace(/\s*:\s*$/, "").replace(/\s+/g, " ").trim().toLowerCase();
}
function scanLinks(body) {
  const links = [];
  for (const m of body.matchAll(WIKILINK)) {
    const target = m[2].replace(/\\+$/, "").trim();
    if (!target) continue;
    const alias = m[3]?.trim();
    links.push({ target, alias: alias || void 0, kind: m[1] ? "embed" : "wikilink" });
  }
  const mdLinks = [];
  for (const m of body.matchAll(MDLINK)) {
    const href = m[1].trim();
    if (/^[a-z][a-z0-9+.-]*:\/\//i.test(href) || href.startsWith("#") || href.startsWith("mailto:")) {
      continue;
    }
    const pathPart = href.split("#")[0].split(/\s/)[0];
    if (pathPart.endsWith(".md")) mdLinks.push(pathPart);
  }
  return { links, mdLinks };
}
function scanPage(body) {
  const { links, mdLinks } = scanLinks(body);
  const headings = [];
  const labels = [];
  const sectionWikilinkCounts = /* @__PURE__ */ new Map();
  let current = "";
  for (const line of body.split("\n")) {
    const h = HEADING.exec(line);
    if (h) {
      headings.push(h[1]);
      current = normalizeSection(h[1]);
    } else {
      const lb = LABEL.exec(line);
      if (lb) {
        labels.push(lb[1]);
        current = normalizeSection(lb[1]);
      }
    }
    if (!current) continue;
    let n = 0;
    for (const m of line.matchAll(WIKILINK)) if (!m[1]) n += 1;
    if (n > 0) sectionWikilinkCounts.set(current, (sectionWikilinkCounts.get(current) ?? 0) + n);
  }
  return { links, mdLinks, headings, labels, sectionWikilinkCounts };
}

// src/adapters/repo/FoamWikiRepository.ts
var EXCLUDED_TOP = /* @__PURE__ */ new Set(["raw", "c4", ".foam", ".arch-wiki", "out", "node_modules", ".git"]);
var PREFIX_TO_SPEC = {};
for (const kind of Object.keys(ARTIFACT_SPECS)) {
  const spec = ARTIFACT_SPECS[kind];
  if (spec.prefix) PREFIX_TO_SPEC[spec.prefix] = spec;
}
var FoamWikiRepository = class {
  constructor(root, fs2) {
    this.root = root;
    this.fs = fs2;
  }
  abs(relPath) {
    return path4.join(this.root, relPath);
  }
  async readLintBaseline() {
    return this.readBaselineFile(".arch-wiki/lint-baseline.json");
  }
  async readC4Baseline() {
    return this.readBaselineFile(".arch-wiki/c4-baseline.json");
  }
  async readBaselineFile(relPath) {
    const f = this.abs(relPath);
    if (!await this.fs.exists(f)) return [];
    try {
      const parsed = JSON.parse(await this.fs.readFile(f));
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  async listFiles() {
    const files = await this.fs.walk(this.root);
    return files.map((abs) => path4.relative(this.root, abs).split(path4.sep).join("/")).filter((rel) => !rel.startsWith(".git/") && !rel.startsWith("node_modules/"));
  }
  async loadPages() {
    const files = await this.fs.walk(this.root);
    const pages = [];
    for (const absFile of files) {
      if (!absFile.endsWith(".md")) continue;
      const rel = path4.relative(this.root, absFile).split(path4.sep).join("/");
      const top = rel.split("/")[0];
      if (EXCLUDED_TOP.has(top)) continue;
      const raw = await this.fs.readFile(absFile);
      const parsed = (0, import_gray_matter.default)(raw);
      const { links, mdLinks, headings, labels, sectionWikilinkCounts } = scanPage(parsed.content);
      const dir = path4.posix.dirname(rel);
      pages.push({
        relPath: rel,
        basename: path4.basename(rel, ".md"),
        folder: dir === "." ? "" : dir,
        frontmatter: parsed.data ?? {},
        links,
        mdLinks,
        headings,
        labels,
        sectionWikilinkCounts
      });
    }
    return pages;
  }
  numberFromFilename(spec, filename) {
    if (!filename.endsWith(".md")) return null;
    if (spec.kind === "adr") {
      const m = /^(\d+)-/.exec(filename);
      return m ? Number(m[1]) : null;
    }
    if (spec.prefix) {
      const m = new RegExp(`^${spec.prefix}-(\\d+)`).exec(filename);
      return m ? Number(m[1]) : null;
    }
    return null;
  }
  async existingNumbers(spec) {
    const files = await this.fs.list(this.abs(spec.folder));
    const nums = [];
    for (const f of files) {
      const n = this.numberFromFilename(spec, f);
      if (n != null) nums.push(n);
    }
    return nums;
  }
  async resolveBasename(idText) {
    const id = ArtifactId.parse(idText);
    if (!id) return null;
    const spec = PREFIX_TO_SPEC[id.prefix];
    if (!spec) return null;
    const files = await this.fs.list(this.abs(spec.folder));
    const prefixMatch = spec.kind === "adr" ? `${id.padded}-` : `${id.prefix}-${id.padded}`;
    for (const f of files) {
      if (!f.endsWith(".md")) continue;
      const isExact = f === `${prefixMatch}.md`;
      if (f.startsWith(prefixMatch) || isExact) return f.replace(/\.md$/, "");
    }
    return null;
  }
  async exists(relPath) {
    return this.fs.exists(this.abs(relPath));
  }
  async write(relPath, content) {
    await this.fs.writeFile(this.abs(relPath), content);
  }
  async deleteFile(relPath) {
    await this.fs.remove(this.abs(relPath));
  }
  async read(relPath) {
    return this.fs.readFile(this.abs(relPath));
  }
  async readParsed(relPath) {
    const parsed = (0, import_gray_matter.default)(await this.fs.readFile(this.abs(relPath)));
    return { frontmatter: parsed.data ?? {}, content: parsed.content };
  }
  async appendHubLink(hubRelPath, basename2, bullet) {
    const abs = this.abs(hubRelPath);
    if (!await this.fs.exists(abs)) return false;
    const content = await this.fs.readFile(abs);
    if (content.includes(`[[${basename2}`)) return true;
    const sep2 = content.length === 0 || content.endsWith("\n") ? "" : "\n";
    await this.fs.writeFile(abs, `${content}${sep2}${bullet}
`);
    return true;
  }
};

// src/adapters/version/FileVersionStore.ts
var path5 = __toESM(require("node:path"));
var FileVersionStore = class {
  constructor(root, fs2) {
    this.root = root;
    this.fs = fs2;
  }
  file() {
    return path5.join(this.root, ".arch-wiki", "version.json");
  }
  async read() {
    const f = this.file();
    if (!await this.fs.exists(f)) return null;
    return JSON.parse(await this.fs.readFile(f));
  }
  async write(marker) {
    await this.fs.writeFile(this.file(), `${JSON.stringify(marker, null, 2)}
`);
  }
};

// src/adapters/config/FileProjectConfigStore.ts
var path6 = __toESM(require("node:path"));

// node_modules/zod/v3/external.js
var external_exports = {};
__export(external_exports, {
  BRAND: () => BRAND,
  DIRTY: () => DIRTY,
  EMPTY_PATH: () => EMPTY_PATH,
  INVALID: () => INVALID,
  NEVER: () => NEVER,
  OK: () => OK,
  ParseStatus: () => ParseStatus,
  Schema: () => ZodType,
  ZodAny: () => ZodAny,
  ZodArray: () => ZodArray,
  ZodBigInt: () => ZodBigInt,
  ZodBoolean: () => ZodBoolean,
  ZodBranded: () => ZodBranded,
  ZodCatch: () => ZodCatch,
  ZodDate: () => ZodDate,
  ZodDefault: () => ZodDefault,
  ZodDiscriminatedUnion: () => ZodDiscriminatedUnion,
  ZodEffects: () => ZodEffects,
  ZodEnum: () => ZodEnum,
  ZodError: () => ZodError,
  ZodFirstPartyTypeKind: () => ZodFirstPartyTypeKind,
  ZodFunction: () => ZodFunction,
  ZodIntersection: () => ZodIntersection,
  ZodIssueCode: () => ZodIssueCode,
  ZodLazy: () => ZodLazy,
  ZodLiteral: () => ZodLiteral,
  ZodMap: () => ZodMap,
  ZodNaN: () => ZodNaN,
  ZodNativeEnum: () => ZodNativeEnum,
  ZodNever: () => ZodNever,
  ZodNull: () => ZodNull,
  ZodNullable: () => ZodNullable,
  ZodNumber: () => ZodNumber,
  ZodObject: () => ZodObject,
  ZodOptional: () => ZodOptional,
  ZodParsedType: () => ZodParsedType,
  ZodPipeline: () => ZodPipeline,
  ZodPromise: () => ZodPromise,
  ZodReadonly: () => ZodReadonly,
  ZodRecord: () => ZodRecord,
  ZodSchema: () => ZodType,
  ZodSet: () => ZodSet,
  ZodString: () => ZodString,
  ZodSymbol: () => ZodSymbol,
  ZodTransformer: () => ZodEffects,
  ZodTuple: () => ZodTuple,
  ZodType: () => ZodType,
  ZodUndefined: () => ZodUndefined,
  ZodUnion: () => ZodUnion,
  ZodUnknown: () => ZodUnknown,
  ZodVoid: () => ZodVoid,
  addIssueToContext: () => addIssueToContext,
  any: () => anyType,
  array: () => arrayType,
  bigint: () => bigIntType,
  boolean: () => booleanType,
  coerce: () => coerce,
  custom: () => custom,
  date: () => dateType,
  datetimeRegex: () => datetimeRegex,
  defaultErrorMap: () => en_default,
  discriminatedUnion: () => discriminatedUnionType,
  effect: () => effectsType,
  enum: () => enumType,
  function: () => functionType,
  getErrorMap: () => getErrorMap,
  getParsedType: () => getParsedType,
  instanceof: () => instanceOfType,
  intersection: () => intersectionType,
  isAborted: () => isAborted,
  isAsync: () => isAsync,
  isDirty: () => isDirty,
  isValid: () => isValid,
  late: () => late,
  lazy: () => lazyType,
  literal: () => literalType,
  makeIssue: () => makeIssue,
  map: () => mapType,
  nan: () => nanType,
  nativeEnum: () => nativeEnumType,
  never: () => neverType,
  null: () => nullType,
  nullable: () => nullableType,
  number: () => numberType,
  object: () => objectType,
  objectUtil: () => objectUtil,
  oboolean: () => oboolean,
  onumber: () => onumber,
  optional: () => optionalType,
  ostring: () => ostring,
  pipeline: () => pipelineType,
  preprocess: () => preprocessType,
  promise: () => promiseType,
  quotelessJson: () => quotelessJson,
  record: () => recordType,
  set: () => setType,
  setErrorMap: () => setErrorMap,
  strictObject: () => strictObjectType,
  string: () => stringType,
  symbol: () => symbolType,
  transformer: () => effectsType,
  tuple: () => tupleType,
  undefined: () => undefinedType,
  union: () => unionType,
  unknown: () => unknownType,
  util: () => util,
  void: () => voidType
});

// node_modules/zod/v3/helpers/util.js
var util;
(function(util2) {
  util2.assertEqual = (_) => {
  };
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
var ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
var getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return Number.isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};

// node_modules/zod/v3/ZodError.js
var ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
var quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};
var ZodError = class _ZodError extends Error {
  get errors() {
    return this.issues;
  }
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error) => {
      for (const issue of error.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof _ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        const firstEl = sub.path[0];
        fieldErrors[firstEl] = fieldErrors[firstEl] || [];
        fieldErrors[firstEl].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
};
ZodError.create = (issues) => {
  const error = new ZodError(issues);
  return error;
};

// node_modules/zod/v3/locales/en.js
var errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "bigint")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
var en_default = errorMap;

// node_modules/zod/v3/errors.js
var overrideErrorMap = en_default;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}

// node_modules/zod/v3/helpers/parseUtil.js
var makeIssue = (params) => {
  const { data, path: path9, errorMaps, issueData } = params;
  const fullPath = [...path9, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
var EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      // contextual error map is first priority
      ctx.schemaErrorMap,
      // then schema-bound map if available
      overrideMap,
      // then global override map
      overrideMap === en_default ? void 0 : en_default
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
var ParseStatus = class _ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return _ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
};
var INVALID = Object.freeze({
  status: "aborted"
});
var DIRTY = (value) => ({ status: "dirty", value });
var OK = (value) => ({ status: "valid", value });
var isAborted = (x) => x.status === "aborted";
var isDirty = (x) => x.status === "dirty";
var isValid = (x) => x.status === "valid";
var isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;

// node_modules/zod/v3/helpers/errorUtil.js
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (errorUtil = {}));

// node_modules/zod/v3/types.js
var ParseInputLazyPath = class {
  constructor(parent, value, path9, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path9;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (Array.isArray(this._key)) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
};
var handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error = new ZodError(ctx.common.issues);
        this._error = error;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message ?? ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: message ?? required_error ?? ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: message ?? invalid_type_error ?? ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
var ZodType = class {
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    const ctx = {
      common: {
        issues: [],
        async: params?.async ?? false,
        contextualErrorMap: params?.errorMap
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  "~validate"(data) {
    const ctx = {
      common: {
        issues: [],
        async: !!this["~standard"].async
      },
      path: [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    if (!this["~standard"].async) {
      try {
        const result = this._parseSync({ data, path: [], parent: ctx });
        return isValid(result) ? {
          value: result.value
        } : {
          issues: ctx.common.issues
        };
      } catch (err) {
        if (err?.message?.toLowerCase()?.includes("encountered")) {
          this["~standard"].async = true;
        }
        ctx.common = {
          issues: [],
          async: true
        };
      }
    }
    return this._parseAsync({ data, path: [], parent: ctx }).then((result) => isValid(result) ? {
      value: result.value
    } : {
      issues: ctx.common.issues
    });
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params?.errorMap,
        async: true
      },
      path: params?.path || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
    this["~standard"] = {
      version: 1,
      vendor: "zod",
      validate: (data) => this["~validate"](data)
    };
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
};
var cuidRegex = /^c[^\s-]{8,}$/i;
var cuid2Regex = /^[0-9a-z]+$/;
var ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
var uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
var nanoidRegex = /^[a-z0-9_-]{21}$/i;
var jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
var durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
var emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
var _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
var emojiRegex;
var ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
var ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
var ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
var ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
var base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
var base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
var dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
var dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let secondsRegexSource = `[0-5]\\d`;
  if (args.precision) {
    secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
  }
  const secondsQuantifier = args.precision ? "+" : "?";
  return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
function isValidJWT(jwt, alg) {
  if (!jwtRegex.test(jwt))
    return false;
  try {
    const [header] = jwt.split(".");
    if (!header)
      return false;
    const base64 = header.replace(/-/g, "+").replace(/_/g, "/").padEnd(header.length + (4 - header.length % 4) % 4, "=");
    const decoded = JSON.parse(atob(base64));
    if (typeof decoded !== "object" || decoded === null)
      return false;
    if ("typ" in decoded && decoded?.typ !== "JWT")
      return false;
    if (!decoded.alg)
      return false;
    if (alg && decoded.alg !== alg)
      return false;
    return true;
  } catch {
    return false;
  }
}
function isValidCidr(ip, version) {
  if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
    return true;
  }
  return false;
}
var ZodString = class _ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "jwt") {
        if (!isValidJWT(input.data, check.alg)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "jwt",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cidr") {
        if (!isValidCidr(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cidr",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64url") {
        if (!base64urlRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation, message) {
    return this.refinement((data) => regex.test(data), {
      validation,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  base64url(message) {
    return this._addCheck({
      kind: "base64url",
      ...errorUtil.errToObj(message)
    });
  }
  jwt(options2) {
    return this._addCheck({ kind: "jwt", ...errorUtil.errToObj(options2) });
  }
  ip(options2) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options2) });
  }
  cidr(options2) {
    return this._addCheck({ kind: "cidr", ...errorUtil.errToObj(options2) });
  }
  datetime(options2) {
    if (typeof options2 === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options2
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof options2?.precision === "undefined" ? null : options2?.precision,
      offset: options2?.offset ?? false,
      local: options2?.local ?? false,
      ...errorUtil.errToObj(options2?.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options2) {
    if (typeof options2 === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options2
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof options2?.precision === "undefined" ? null : options2?.precision,
      ...errorUtil.errToObj(options2?.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options2) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options2?.position,
      ...errorUtil.errToObj(options2?.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * Equivalent to `.min(1)`
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new _ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isCIDR() {
    return !!this._def.checks.find((ch) => ch.kind === "cidr");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get isBase64url() {
    return !!this._def.checks.find((ch) => ch.kind === "base64url");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodString.create = (params) => {
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / 10 ** decCount;
}
var ZodNumber = class _ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null;
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
};
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodBigInt = class _ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      try {
        input.data = BigInt(input.data);
      } catch {
        return this._getInvalidInput(input);
      }
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      return this._getInvalidInput(input);
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _getInvalidInput(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.bigint,
      received: ctx.parsedType
    });
    return INVALID;
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new _ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new _ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
};
ZodBigInt.create = (params) => {
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: params?.coerce ?? false,
    ...processCreateParams(params)
  });
};
var ZodBoolean = class extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: params?.coerce || false,
    ...processCreateParams(params)
  });
};
var ZodDate = class _ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (Number.isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new _ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
};
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: params?.coerce || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
var ZodSymbol = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
var ZodUndefined = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
var ZodNull = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
var ZodAny = class extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
var ZodUnknown = class extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
};
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
var ZodNever = class extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
};
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
var ZodVoid = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
};
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
var ZodArray = class _ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new _ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new _ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new _ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
var ZodObject = class _ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    this._cached = { shape, keys };
    return this._cached;
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") {
      } else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: errorUtil.errToObj(message).message ?? defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new _ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new _ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new _ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new _ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    for (const key of util.objectKeys(mask)) {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    for (const key of util.objectKeys(this.shape)) {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    }
    return new _ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
};
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
var ZodUnion = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options2 = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options2.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options2) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
};
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
var getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
var ZodDiscriminatedUnion = class _ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options2, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options2) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new _ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options: options2,
      optionsMap,
      ...processCreateParams(params)
    });
  }
};
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
var ZodIntersection = class extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
};
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
var ZodTuple = class _ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new _ZodTuple({
      ...this._def,
      rest
    });
  }
};
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
var ZodRecord = class _ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new _ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new _ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
};
var ZodMap = class extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
};
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
var ZodSet = class _ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new _ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new _ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
};
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
var ZodFunction = class _ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error
        }
      });
    }
    function makeReturnsIssue(returns, error) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, getErrorMap(), en_default].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error.addIssue(makeArgsIssue(args, e));
          throw error;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error.addIssue(makeReturnsIssue(result, e));
          throw error;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new _ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new _ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new _ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
};
var ZodLazy = class extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
};
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
var ZodLiteral = class extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
};
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
var ZodEnum = class _ZodEnum extends ZodType {
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(this._def.values);
    }
    if (!this._cache.has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return _ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return _ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
};
ZodEnum.create = createZodEnum;
var ZodNativeEnum = class extends ZodType {
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!this._cache) {
      this._cache = new Set(util.getValidEnumValues(this._def.values));
    }
    if (!this._cache.has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
};
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
var ZodPromise = class extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
};
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
var ZodEffects = class extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base))
          return INVALID;
        const result = effect.transform(base.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
          if (!isValid(base))
            return INVALID;
          return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
            status: status.value,
            value: result
          }));
        });
      }
    }
    util.assertNever(effect);
  }
};
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
var ZodOptional = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
var ZodNullable = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
var ZodDefault = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
};
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
var ZodCatch = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
};
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
var ZodNaN = class extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
};
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
var BRAND = Symbol("zod_brand");
var ZodBranded = class extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
};
var ZodPipeline = class _ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new _ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
};
var ZodReadonly = class extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
};
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function cleanParams(params, data) {
  const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
  const p2 = typeof p === "string" ? { message: p } : p;
  return p2;
}
function custom(check, _params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      const r = check(data);
      if (r instanceof Promise) {
        return r.then((r2) => {
          if (!r2) {
            const params = cleanParams(_params, data);
            const _fatal = params.fatal ?? fatal ?? true;
            ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
          }
        });
      }
      if (!r) {
        const params = cleanParams(_params, data);
        const _fatal = params.fatal ?? fatal ?? true;
        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
      }
      return;
    });
  return ZodAny.create();
}
var late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
var instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
var stringType = ZodString.create;
var numberType = ZodNumber.create;
var nanType = ZodNaN.create;
var bigIntType = ZodBigInt.create;
var booleanType = ZodBoolean.create;
var dateType = ZodDate.create;
var symbolType = ZodSymbol.create;
var undefinedType = ZodUndefined.create;
var nullType = ZodNull.create;
var anyType = ZodAny.create;
var unknownType = ZodUnknown.create;
var neverType = ZodNever.create;
var voidType = ZodVoid.create;
var arrayType = ZodArray.create;
var objectType = ZodObject.create;
var strictObjectType = ZodObject.strictCreate;
var unionType = ZodUnion.create;
var discriminatedUnionType = ZodDiscriminatedUnion.create;
var intersectionType = ZodIntersection.create;
var tupleType = ZodTuple.create;
var recordType = ZodRecord.create;
var mapType = ZodMap.create;
var setType = ZodSet.create;
var functionType = ZodFunction.create;
var lazyType = ZodLazy.create;
var literalType = ZodLiteral.create;
var enumType = ZodEnum.create;
var nativeEnumType = ZodNativeEnum.create;
var promiseType = ZodPromise.create;
var effectsType = ZodEffects.create;
var optionalType = ZodOptional.create;
var nullableType = ZodNullable.create;
var preprocessType = ZodEffects.createWithPreprocess;
var pipelineType = ZodPipeline.create;
var ostring = () => stringType().optional();
var onumber = () => numberType().optional();
var oboolean = () => booleanType().optional();
var coerce = {
  string: (arg) => ZodString.create({ ...arg, coerce: true }),
  number: (arg) => ZodNumber.create({ ...arg, coerce: true }),
  boolean: (arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  }),
  bigint: (arg) => ZodBigInt.create({ ...arg, coerce: true }),
  date: (arg) => ZodDate.create({ ...arg, coerce: true })
};
var NEVER = INVALID;

// src/domain/model/ProjectConfigSchema.ts
var ArtifactKindEnum = external_exports.enum([
  "use-case",
  "quality-attribute",
  "constraint",
  "concern",
  "adr",
  "iteration",
  "entity",
  "concept",
  "arc42"
]);
var Arc42MapSchema = external_exports.record(ArtifactKindEnum, external_exports.string().min(1)).optional();
var C4ConsistencySchema = external_exports.object({
  requireDocumentation: external_exports.array(external_exports.string().min(1)).optional(),
  severity: external_exports.enum(["high", "medium", "low"]).optional(),
  ignore: external_exports.array(external_exports.string().min(1)).optional()
}).strict().optional();
var C4Schema = external_exports.object({
  dir: external_exports.string().min(1),
  validate: external_exports.string().min(1),
  build: external_exports.string().min(1).optional(),
  export: external_exports.string().min(1).optional(),
  consistency: C4ConsistencySchema
}).strict().optional();
var TaskKindEnum = external_exports.enum(["arch", "techdesign"]);
var TasksSchema = external_exports.object({
  language: external_exports.string().min(2),
  prefixes: external_exports.record(TaskKindEnum, external_exports.string().min(1)),
  rolePrefixes: external_exports.record(external_exports.string().min(1), external_exports.string().min(1)).optional()
}).strict().optional();
var RequiredSectionSchema = external_exports.object({
  marker: external_exports.string().min(1),
  minWikilinks: external_exports.number().int().min(0).default(0),
  severity: external_exports.enum(["high", "medium", "low"]).default("medium")
}).strict();
var RequiredSectionsSchema = external_exports.record(ArtifactKindEnum, external_exports.array(RequiredSectionSchema)).optional();
var UpstreamSchema = external_exports.object({
  userStoryLog: external_exports.object({
    cloudId: external_exports.string().min(1),
    pageId: external_exports.string().min(1),
    childTitlePrefix: external_exports.string().min(1).optional()
  }).strict().optional()
}).strict().optional();
var IntegrationsSchema = external_exports.object({
  jira: external_exports.object({
    board: external_exports.string(),
    projectKey: external_exports.string(),
    // CAP-2 reverse trace edge (v0.8): Atlassian site base URL for absolute Jira
    // browse links (<siteUrl>/browse/<KEY>) on the mirror page. Absent → Core falls
    // back to confluence.siteUrl (same Atlassian site); absent both → no reverse link.
    siteUrl: external_exports.string().url()
  }).partial().strict().optional(),
  confluence: external_exports.object({
    space: external_exports.string(),
    cloudId: external_exports.string(),
    // CAP-2 (v0.8): the NUMERIC Confluence space id (e.g. "163845"). createConfluencePage
    // requires the numeric id, NOT the space KEY (passing the key → HTTP 400). `space`
    // stays the KEY (used for the /wiki/spaces/<KEY>/pages/<id> cross-link URLs). Look it
    // up once via getConfluenceSpaces(keys:[<KEY>]). Optional → publish preflight warns if missing.
    // MUST be all-digits — accepting the KEY here would pass preflight and then fail mid-publish
    // with the exact HTTP 400 the numeric id exists to prevent (R4, v0.8).
    spaceId: external_exports.string().regex(/^\d+$/, "integrations.confluence.spaceId must be the NUMERIC space id, not the KEY"),
    // CAP-2 (v0.7): the Atlassian site base URL (e.g. https://acme.atlassian.net).
    // Used to build ABSOLUTE Confluence links inside Jira issues (issue→mirror trace,
    // render-issue) — Jira ADF wants an absolute href; cloudId is a UUID, not the host.
    // Absent → render-issue emits root-relative /wiki links (work from Jira on the same
    // site, but absolute is preferred). The in-Confluence mirror itself stays root-relative.
    siteUrl: external_exports.string().url(),
    // CAP-2 RU projection (v0.6, plan §13): when `language` is set the mirror is a
    // translated PRESENTATION projection (canon stays English in Layer-2). Absent →
    // publish English as-is (backward-compatible). `preserveTerms` is a denylist of
    // terms the translation must keep verbatim (Core also merges glossary.md bold terms).
    language: external_exports.string().min(2),
    preserveTerms: external_exports.array(external_exports.string().min(1)),
    // CAP-2 visibility filter: ADR statuses + register basenames hidden from the
    // stakeholder mirror (per-page frontmatter `confluence`/`audience` overrides).
    exclude: external_exports.object({
      statuses: external_exports.array(external_exports.string().min(1)).optional(),
      basenames: external_exports.array(external_exports.string().min(1)).optional()
    }).strict().optional()
  }).partial().strict().optional(),
  upstream: UpstreamSchema,
  notifications: external_exports.object({
    channel: external_exports.enum(["discord", "slack", "none"]).default("none"),
    channelId: external_exports.string().optional()
  }).strict().optional()
}).strict().optional();
var ProjectConfigSchema = external_exports.object({
  $schema: external_exports.string().optional(),
  _doc: external_exports.string().optional(),
  // human note; Core ignores it
  arc42Map: Arc42MapSchema,
  c4: C4Schema,
  tasks: TasksSchema,
  requiredSections: RequiredSectionsSchema,
  integrations: IntegrationsSchema
}).strict();

// src/adapters/config/FileProjectConfigStore.ts
var FileProjectConfigStore = class {
  constructor(root, fs2) {
    this.root = root;
    this.fs = fs2;
  }
  file() {
    return path6.join(this.root, ".arch-wiki", "config.json");
  }
  async read() {
    const f = this.file();
    if (!await this.fs.exists(f)) return null;
    let raw;
    try {
      raw = JSON.parse(await this.fs.readFile(f));
    } catch (e) {
      throw new DomainError(`malformed config.json: ${e.message}`, 2);
    }
    const r = ProjectConfigSchema.safeParse(raw);
    if (!r.success) {
      throw new DomainError(
        `invalid config.json: ${r.error.issues.map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`).join("; ")}`,
        2
      );
    }
    return r.data;
  }
};

// src/adapters/ledger/FileLedgerStore.ts
var path7 = __toESM(require("node:path"));
var ISSUES_FILE = "created-issues.json";
var PAGES_FILE = "published-pages.json";
var PULLED_FILE = "pulled-sources.json";
var SCHEMA_VERSION = 1;
var FileLedgerStore = class {
  constructor(root, fs2) {
    this.root = root;
    this.fs = fs2;
  }
  file(name) {
    return path7.join(this.root, ".arch-wiki", name);
  }
  async readArray(name, field) {
    const f = this.file(name);
    if (!await this.fs.exists(f)) return [];
    const parsed = JSON.parse(await this.fs.readFile(f));
    const rows = parsed[field];
    return Array.isArray(rows) ? rows : [];
  }
  async writeArray(name, field, rows) {
    await this.fs.writeFile(this.file(name), `${JSON.stringify({ schemaVersion: SCHEMA_VERSION, [field]: rows }, null, 2)}
`);
  }
  async readIssues() {
    return this.readArray(ISSUES_FILE, "issues");
  }
  async appendIssue(row) {
    const rows = await this.readIssues();
    const idx = rows.findIndex(
      (r) => r.key === row.key && r.sourceId === row.sourceId && r.kind === row.kind && r.role === row.role
    );
    if (idx >= 0) {
      if (rows[idx].contentHash === row.contentHash) return false;
      rows[idx] = row;
    } else {
      rows.push(row);
    }
    rows.sort((a, b) => a.key.localeCompare(b.key));
    await this.writeArray(ISSUES_FILE, "issues", rows);
    return true;
  }
  async readPages() {
    return this.readArray(PAGES_FILE, "pages");
  }
  async appendPage(row) {
    const rows = await this.readPages();
    const idx = rows.findIndex((r) => r.page === row.page && r.source === row.source);
    if (idx >= 0) {
      const existing = rows[idx];
      const merged = row.pageVersion == null && existing.pageVersion != null ? { ...row, pageVersion: existing.pageVersion } : row;
      if (existing.contentHash === merged.contentHash && existing.pageVersion === merged.pageVersion) {
        return false;
      }
      rows[idx] = merged;
    } else {
      rows.push(row);
    }
    rows.sort((a, b) => a.page.localeCompare(b.page));
    await this.writeArray(PAGES_FILE, "pages", rows);
    return true;
  }
  async removePage(source) {
    const rows = await this.readPages();
    const next = rows.filter((r) => r.source !== source);
    if (next.length === rows.length) return false;
    await this.writeArray(PAGES_FILE, "pages", next);
    return true;
  }
  async readPulled() {
    return this.readArray(PULLED_FILE, "pulled");
  }
  async appendPulled(row) {
    const rows = await this.readPulled();
    const idx = rows.findIndex((r) => r.pageId === row.pageId);
    if (idx >= 0) {
      const cur = rows[idx];
      if (cur.contentHash === row.contentHash && cur.relPath === row.relPath) return false;
      rows[idx] = row;
    } else {
      rows.push(row);
    }
    rows.sort((a, b) => a.pageId.localeCompare(b.pageId));
    await this.writeArray(PULLED_FILE, "pulled", rows);
    return true;
  }
  async removePulled(pageId) {
    const rows = await this.readPulled();
    const next = rows.filter((r) => r.pageId !== pageId);
    if (next.length === rows.length) return false;
    await this.writeArray(PULLED_FILE, "pulled", next);
    return true;
  }
};

// src/adapters/frontmatter/GrayMatterParser.ts
var import_gray_matter2 = __toESM(require_gray_matter());
function sortKeysDeep(value) {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === "object") {
    const out = {};
    for (const k of Object.keys(value).sort()) {
      out[k] = sortKeysDeep(value[k]);
    }
    return out;
  }
  return value;
}
var GrayMatterParser = class {
  parse(raw) {
    const r = (0, import_gray_matter2.default)(raw);
    return { frontmatter: r.data ?? {}, content: r.content };
  }
  stringify(doc) {
    if (Object.keys(doc.frontmatter).length === 0) return doc.content;
    return import_gray_matter2.default.stringify(doc.content, sortKeysDeep(doc.frontmatter));
  }
};

// src/domain/services/ProjectConfig.ts
var ProjectConfig = class _ProjectConfig {
  constructor(cfg) {
    this.cfg = cfg;
  }
  static from(file) {
    return new _ProjectConfig(file ?? {});
  }
  /** OPTIONAL+default. Never throws (override ?? ARTIFACT_SPECS). */
  hubFile(kind) {
    return this.cfg.arc42Map?.[kind] ?? ARTIFACT_SPECS[kind].hubFile;
  }
  /** OPTIONAL. Never throws (?? []). */
  requiredSections(kind) {
    return this.cfg.requiredSections?.[kind] ?? [];
  }
  /** OPTIONAL. Never throws (?? {channel:'none'}). */
  notificationTarget() {
    return this.cfg.integrations?.notifications ?? { channel: "none" };
  }
  /** REQUIRED-WHEN-USED. Throws exit 2 if absent (no guess). */
  c4() {
    if (!this.cfg.c4) {
      throw new DomainError(
        "project has no [c4] config; required by cartographer/validate-graph C4 step",
        2
      );
    }
    return this.cfg.c4;
  }
  /**
   * OPTIONAL+default. The C4↔wiki consistency policy for `validate-c4`. Never
   * throws — validate-c4 works with sensible defaults even without a [c4] block
   * (the model arrives via --model-json, not from c4().dir). Default keeps the
   * check low-noise: only `system`+`container` elements must be documented.
   */
  c4Consistency() {
    const c = this.cfg.c4?.consistency;
    return {
      requireDocumentation: c?.requireDocumentation ?? ["system", "container"],
      severity: c?.severity ?? "medium",
      ignore: c?.ignore ?? []
    };
  }
  /** REQUIRED-WHEN-USED. Throws exit 2 if absent (no guess). */
  taskPrefix(kind, role) {
    const t = this.cfg.tasks;
    if (!t) throw new DomainError("project has no [tasks] config; required by render-issue", 2);
    if (kind === "techdesign" && role) {
      const rp = t.rolePrefixes?.[role];
      if (!rp) throw new DomainError(`no task prefix for role "${role}"`, 2);
      return rp;
    }
    const p = t.prefixes?.[kind];
    if (!p) throw new DomainError(`no task prefix for "${kind}"`, 2);
    return p;
  }
  /** REQUIRED-WHEN-USED. Throws exit 2 if absent — no RU default in code (§1.2). */
  language() {
    const l = this.cfg.tasks?.language;
    if (!l) throw new DomainError("project has no [tasks.language]; required by render-issue", 2);
    return l;
  }
  /** OPTIONAL. The wiki language if declared, else null (informational for the mirror). */
  languageOrNull() {
    return this.cfg.tasks?.language ?? null;
  }
  /** OPTIONAL. Returns null; the CALLER fails fast when it actually needs Jira. */
  jira() {
    return this.cfg.integrations?.jira ?? null;
  }
  /** OPTIONAL. Returns null; the CALLER fails fast when it actually needs Confluence (publish). */
  confluence() {
    return this.cfg.integrations?.confluence ?? null;
  }
  /**
   * OPTIONAL. The Atlassian site base URL for ABSOLUTE Confluence links in Jira issues
   * (issue→mirror trace). Null = build root-relative /wiki links instead (caller warns).
   * Trailing slash stripped so callers can append `/wiki/...` safely.
   */
  confluenceSiteUrl() {
    const u = this.cfg.integrations?.confluence?.siteUrl;
    return u ? u.replace(/\/+$/, "") : null;
  }
  /** OPTIONAL. The NUMERIC Confluence space id (createConfluencePage needs it, not the KEY); null if unset. */
  confluenceSpaceId() {
    return this.cfg.integrations?.confluence?.spaceId ?? null;
  }
  /** OPTIONAL. The Confluence cloudId (create/update require it); null if unset. */
  confluenceCloudId() {
    return this.cfg.integrations?.confluence?.cloudId ?? null;
  }
  /**
   * OPTIONAL. Atlassian site base URL for Jira browse links (reverse trace edge). Prefers
   * integrations.jira.siteUrl, falls back to confluence.siteUrl (same Atlassian site); null if neither.
   */
  jiraSiteUrl() {
    const u = this.cfg.integrations?.jira?.siteUrl ?? this.cfg.integrations?.confluence?.siteUrl;
    return u ? u.replace(/\/+$/, "") : null;
  }
  /** REQUIRED-WHEN-USED. Throws exit 2 if absent — the PO User Story Log source (pull-stories). */
  userStoryLog() {
    const u = this.cfg.integrations?.upstream?.userStoryLog;
    if (!u) {
      throw new DomainError(
        "project has no [integrations.upstream.userStoryLog]; required by pull-stories",
        2
      );
    }
    return u;
  }
};

// src/domain/services/IdAllocator.ts
function nextNumber(existing) {
  let max = 0;
  for (const n of existing) if (n > max) max = n;
  return max + 1;
}
function nextId(spec, existing) {
  if (!spec.prefix) {
    throw new DomainError(`artifact kind "${spec.kind}" has no numeric id scheme`, 1);
  }
  return new ArtifactId(spec.prefix, nextNumber(existing), spec.pad);
}

// src/application/usecases/AllocateNextId.ts
async function allocateNextId(spec, repo) {
  const existing = await repo.existingNumbers(spec);
  return nextId(spec, existing);
}

// src/domain/services/KebabSlug.ts
var COMBINING_MARKS = new RegExp("[\\u0300-\\u036f]", "g");
function slugify(title) {
  return title.normalize("NFKD").replace(COMBINING_MARKS, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/-{2,}/g, "-").replace(/^-+|-+$/g, "");
}
function requireSlug(title) {
  const slug = slugify(title);
  if (!slug) {
    throw new DomainError(
      `cannot derive a slug from title "${title}" (no latin characters); pass an explicit --slug`,
      1
    );
  }
  return slug;
}

// src/domain/services/TemplateEngine.ts
var TOKEN = /\{\{(\w+)\}\}/g;
function render(template, vars) {
  const unresolved = /* @__PURE__ */ new Set();
  const output = template.replace(TOKEN, (_match, key) => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) return vars[key];
    unresolved.add(key);
    return `{{${key}}}`;
  });
  return { output, unresolved: [...unresolved] };
}

// src/domain/services/DeepMerge.ts
function isPlainObject(v) {
  return v != null && typeof v === "object" && !Array.isArray(v);
}
function deepMerge(base, override) {
  const out = { ...base };
  for (const key of Object.keys(override)) {
    const o = override[key];
    const b = out[key];
    out[key] = isPlainObject(b) && isPlainObject(o) ? deepMerge(b, o) : o;
  }
  return out;
}

// src/application/usecases/ScaffoldArtifact.ts
function isoDate(d) {
  return d.toISOString().slice(0, 10);
}
async function scaffoldArtifact(input, deps) {
  const { spec } = input;
  const { repo, templates, clock, config, frontmatter } = deps;
  const warnings = [];
  const needsSlug = spec.kind !== "iteration";
  const slug = needsSlug ? input.slug?.trim() || requireSlug(input.title) : "";
  let id = null;
  if (spec.prefix) {
    id = nextId(spec, await repo.existingNumbers(spec));
  }
  const fileSlug = input.slugPrefix ? `${input.slugPrefix}-${slug}` : slug;
  const filename = spec.filename(id, fileSlug);
  const relPath = `${spec.folder}/${filename}`;
  if (await repo.exists(relPath)) {
    throw new DomainError(`artifact already exists: ${relPath}`, 2);
  }
  const wired = [];
  const unresolvedDrivers = [];
  const driverBullets = [];
  for (const d of input.drivers ?? []) {
    const base = await repo.resolveBasename(d);
    if (base) {
      driverBullets.push(`- [[${base}|${d}]]`);
      wired.push(d);
    } else {
      driverBullets.push(`- [[${d}]]`);
      unresolvedDrivers.push(d);
    }
  }
  const driversText = driverBullets.length ? driverBullets.join("\n") : "<!-- none yet -->";
  const template = await templates.load(spec);
  const { output, unresolved: tokens } = render(template, {
    id: id ? id.toString() : "",
    title: input.title,
    slug,
    date: isoDate(clock.now()),
    drivers: driversText
  });
  if (tokens.length) warnings.push(`unresolved template tokens: ${tokens.join(", ")}`);
  if (unresolvedDrivers.length) {
    warnings.push(`unresolved drivers (placeholders): ${unresolvedDrivers.join(", ")}`);
  }
  if (input.dryRun) {
    return {
      id: id?.toString() ?? null,
      path: relPath,
      created: false,
      hubUpdated: false,
      wired,
      unresolvedDrivers,
      warnings
    };
  }
  let finalOutput = output;
  if (input.frontmatter && Object.keys(input.frontmatter).length > 0) {
    const doc = frontmatter.parse(output);
    const merged = deepMerge(doc.frontmatter, input.frontmatter);
    finalOutput = frontmatter.stringify({ frontmatter: merged, content: doc.content });
  }
  await repo.write(relPath, finalOutput);
  let hubUpdated = false;
  const hub = config.hubFile(spec.kind);
  if (hub) {
    const base = filename.replace(/\.md$/, "");
    const label = id ? `${id.toString()} \xB7 ${input.title}` : input.title;
    hubUpdated = await repo.appendHubLink(hub, base, `- [[${base}|${label}]]`);
    if (!hubUpdated) warnings.push(`hub not found, skipped backlink: ${hub}`);
  }
  return {
    id: id?.toString() ?? null,
    path: relPath,
    created: true,
    hubUpdated,
    wired,
    unresolvedDrivers,
    warnings
  };
}

// src/domain/services/KeyedTable.ts
function upsertKeyedRow(content, keyLine, row, spec) {
  if (content == null) {
    return { content: `${spec.scaffold}${row}
`, changed: true };
  }
  const lines = content.split("\n");
  const idx = lines.findIndex((l) => l.includes(keyLine));
  if (idx >= 0) {
    if (lines[idx] === row) return { content, changed: false };
    lines[idx] = row;
    return { content: lines.join("\n"), changed: true };
  }
  const base = content.length === 0 || content.endsWith("\n") ? content : `${content}
`;
  const next = content.includes(spec.headerMark) ? `${base}${row}
` : `${base}
${spec.header}${row}
`;
  return { content: next, changed: true };
}

// src/application/usecases/UpdateKanban.ts
var KANBAN_COLUMNS = ["backlog", "in-progress", "done"];
var KANBAN_FILE = "kanban.md";
var HEADER = "| Card | Column |\n| --- | --- |\n";
var SPEC = {
  headerMark: "| Card |",
  header: HEADER,
  scaffold: "---\ntype: kanban\ntags: [kanban]\n---\n\n# Kanban\n\nBacklog of drivers and tasks. Maintained by `arch-wiki update-kanban` \u2014\none card per id; moving a card needs an explicit `--column`.\n\n" + HEADER
};
function columnOf(line) {
  const m = /\|\s*([a-z-]+)\s*\|?\s*$/.exec(line.trim());
  const c = m?.[1];
  return KANBAN_COLUMNS.includes(c ?? "") ? c : "backlog";
}
async function updateKanban(input, deps) {
  const { repo } = deps;
  const id = input.add.trim();
  if (!id) throw new DomainError("update-kanban: missing --add", 1);
  if (input.column && !KANBAN_COLUMNS.includes(input.column)) {
    throw new DomainError(`update-kanban: invalid --column "${input.column}"`, 1);
  }
  const exists = await repo.exists(KANBAN_FILE);
  const content = exists ? await repo.read(KANBAN_FILE) : null;
  const keyLine = `[[${id}]]`;
  if (content != null && content.includes(keyLine) && !input.column) {
    const cur = content.split("\n").find((l) => l.includes(keyLine));
    return { path: KANBAN_FILE, created: false, changed: false, column: columnOf(cur) };
  }
  const column = input.column ?? "backlog";
  const row = `| [[${id}]] | ${column} |`;
  const r = upsertKeyedRow(content, keyLine, row, SPEC);
  if (r.changed) await repo.write(KANBAN_FILE, r.content);
  return { path: KANBAN_FILE, created: !exists, changed: r.changed, column };
}

// src/application/usecases/ScaffoldHypothesis.ts
async function scaffoldHypothesis(input, deps) {
  const { repo } = deps;
  if (!input.title?.trim()) throw new DomainError("hypothesis: missing --title", 1);
  if (input.from && !await repo.exists(input.from)) {
    throw new DomainError(`hypothesis: --from not found: ${input.from}`, 2);
  }
  const frontmatter = { status: "hypothesis" };
  if (input.from) frontmatter.source = input.from;
  if (input.driverCandidate) frontmatter.realizes_driver = [input.driverCandidate];
  const result = await scaffoldArtifact(
    {
      spec: ARTIFACT_SPECS["concept"],
      title: input.title,
      slug: input.slug,
      slugPrefix: "hypothesis",
      frontmatter,
      dryRun: input.dryRun
    },
    deps
  );
  if (input.dryRun) return { ...result, kanbanCard: null };
  const card = result.path.replace(/^.*\//, "").replace(/\.md$/, "");
  await updateKanban({ add: card }, { repo });
  return { ...result, kanbanCard: card };
}

// src/application/usecases/ScaffoldQuestionnaire.ts
var QUESTIONNAIRE_METHODS = ["qaw", "rozanski", "driver-gap"];
function isoDate2(d) {
  return d.toISOString().slice(0, 10);
}
async function scaffoldQuestionnaire(input, deps) {
  const { repo, payloads, clock, frontmatter } = deps;
  if (!QUESTIONNAIRE_METHODS.includes(input.method)) {
    throw new DomainError(
      `unknown questionnaire method "${input.method}" (valid: ${QUESTIONNAIRE_METHODS.join(", ")})`,
      1
    );
  }
  if (!input.topic?.trim()) throw new DomainError("questionnaire: missing --topic", 1);
  const date = isoDate2(clock.now());
  const topicSlug = input.slug?.trim() || requireSlug(input.topic);
  const relPath = `raw/questionnaires/${input.method}-${date}-${topicSlug}.md`;
  if (await repo.exists(relPath)) {
    throw new DomainError(`questionnaire already exists: ${relPath}`, 2);
  }
  const related = input.relatedDrivers ?? [];
  const template = await payloads.loadByName(`questionnaire-${input.method}.md`);
  const { output, unresolved } = render(template, {
    topic: input.topic,
    date,
    related_drivers: related.length ? related.map((d) => `[[${d}]]`).join(", ") : "\u2014"
  });
  const warnings = unresolved.length ? [`unresolved template tokens: ${unresolved.join(", ")}`] : [];
  const doc = frontmatter.parse(output);
  const merged = deepMerge(doc.frontmatter, {
    method: input.method,
    topic: input.topic,
    date,
    status: "open",
    related_drivers: related
  });
  const finalOutput = frontmatter.stringify({ frontmatter: merged, content: doc.content });
  if (input.dryRun) {
    return { path: relPath, created: false, method: input.method, warnings };
  }
  await repo.write(relPath, finalOutput);
  return { path: relPath, created: true, method: input.method, warnings };
}

// src/application/usecases/ParseQuestionnaire.ts
var ID = /^[A-Za-z]+-\d+$/;
var HEADING2 = /^#{1,6}\s+(.+?)\s*$/;
var CLOSES = /(?:^|\s)closes:\s*([A-Za-z]+-\d+)/i;
var CONTRADICTION = /(?:^|\s)contradiction:\s*(.+?)\s*$/i;
async function parseQuestionnaire(input, deps) {
  const { repo } = deps;
  const from = input.from?.trim();
  if (!from) throw new DomainError("ingest-questionnaire: missing --from", 1);
  if (!from.startsWith("raw/")) {
    throw new DomainError(`ingest-questionnaire: --from must be under raw/: ${from}`, 2);
  }
  if (!await repo.exists(from)) {
    throw new DomainError(`ingest-questionnaire: --from not found: ${from}`, 2);
  }
  const { frontmatter, content } = await repo.readParsed(from);
  const hasFm = Object.keys(frontmatter).length > 0;
  let method = null;
  let relatedDrivers = [];
  if (hasFm) {
    const status = String(frontmatter.status ?? "").toLowerCase();
    if (status === "open") {
      throw new DomainError("ingest-questionnaire: questionnaire not yet answered (status: open)", 2);
    }
    const m = frontmatter.method;
    if (typeof m !== "string" || !m) {
      throw new DomainError("ingest-questionnaire: questionnaire missing method frontmatter", 2);
    }
    method = m;
    const rd = frontmatter.related_drivers;
    if (!Array.isArray(rd)) {
      throw new DomainError("ingest-questionnaire: questionnaire missing related_drivers frontmatter", 2);
    }
    relatedDrivers = rd.map(String).filter((d) => ID.test(d));
  }
  const answers = [];
  const contradictions = [];
  let section = "";
  for (const line of content.split("\n")) {
    const h = HEADING2.exec(line);
    if (h) {
      section = h[1];
      continue;
    }
    const c = CLOSES.exec(line);
    if (c) answers.push({ section, closesDriver: c[1] });
    const x = CONTRADICTION.exec(line);
    if (x) contradictions.push({ section, conflict: x[1] });
  }
  const closed = new Set(answers.map((a) => a.closesDriver));
  const unanswered = relatedDrivers.filter((d) => !closed.has(d)).sort();
  answers.sort((a, b) => a.closesDriver.localeCompare(b.closesDriver) || a.section.localeCompare(b.section));
  contradictions.sort((a, b) => a.section.localeCompare(b.section) || a.conflict.localeCompare(b.conflict));
  return { source: from, method, relatedDrivers, answers, unanswered, contradictions };
}

// src/domain/model/WikiPage.ts
var FOLDER_TO_KIND = {};
for (const k of Object.keys(ARTIFACT_SPECS)) {
  FOLDER_TO_KIND[ARTIFACT_SPECS[k].folder] = k;
}
function kindOfPage(page) {
  return FOLDER_TO_KIND[page.folder] ?? null;
}
function kindOfRelPath(relPath) {
  const folder = relPath.includes("/") ? relPath.replace(/\/[^/]+$/, "") : "";
  return FOLDER_TO_KIND[folder] ?? null;
}

// src/domain/model/Graph.ts
function buildGraph(pages) {
  const byBasename = /* @__PURE__ */ new Map();
  for (const p of pages) byBasename.set(p.basename, p);
  return { pages, byBasename };
}
function inboundCounts(g) {
  const counts = /* @__PURE__ */ new Map();
  for (const p of g.pages) {
    for (const l of p.links) counts.set(l.target, (counts.get(l.target) ?? 0) + 1);
  }
  return counts;
}
function pagesOfKind(g, kinds) {
  const set = new Set(kinds);
  return g.pages.filter((p) => {
    const k = kindOfPage(p);
    return k != null && set.has(k);
  });
}

// src/domain/services/ConfluenceTree.ts
var DEFAULT_EXCLUDE = {
  statuses: ["proposed", "rejected"],
  // `CLAUDE` = the Layer-3 schema/contributor doc (docs/architecture/CLAUDE.md): all git internals
  // (raw/, .foam/, c4/src/, register names), not stakeholder content → excluded from the mirror (v0.8.2 D).
  // `epistemic-debt` = the FPF B.3.4 decay register — an internal health doc, like gap-analysis.
  basenames: ["risks", "gap-analysis", "kanban", "epistemic-debt", "CLAUDE"]
};
var WIKILINK_RE = /(!?)\[\[([^\]|#]+)(?:#([^\]|]*))?(?:\|([^\]]*))?\]\]/g;
function isPageExcluded(page, exclude) {
  const fm = page.frontmatter;
  if (fm.confluence === true) return false;
  if (fm.confluence === false || fm.audience === "internal") return true;
  if (exclude.basenames.includes(page.basename)) return true;
  if (kindOfPage(page) === "adr") {
    const st = String(fm.status ?? "").toLowerCase();
    if (st && exclude.statuses.includes(st)) return true;
  }
  return false;
}
function parentSourceOf(page, hubMap, includedSources, indexSource) {
  if (page.relPath === indexSource) return null;
  const kind = kindOfPage(page);
  if (kind && kind !== "arc42") {
    const hub = hubMap.get(kind) ?? null;
    if (hub && hub !== page.relPath && includedSources.has(hub)) return hub;
  }
  return indexSource && indexSource !== page.relPath ? indexSource : null;
}
function depthOf(relPath, parents) {
  let depth = 0;
  let cur = parents.get(relPath) ?? null;
  const seen = /* @__PURE__ */ new Set([relPath]);
  while (cur != null && !seen.has(cur)) {
    seen.add(cur);
    depth += 1;
    cur = parents.get(cur) ?? null;
  }
  return depth;
}
function sortParentFirst(relPaths, parents) {
  return [...relPaths].sort(
    (a, b) => depthOf(a, parents) - depthOf(b, parents) || a.localeCompare(b)
  );
}
var PENDING_PAGE_ID = "pending";
function resolveCrossLinks(content, g, publishedMap, includedSources, spaceKey, reserveUnresolved = false) {
  const crossLinks = [];
  let renamed = false;
  const body = content.replace(
    WIKILINK_RE,
    (_m, _bang, target, anchor, alias) => {
      const label = (alias ?? target).trim();
      const page = g.byBasename.get(target);
      const included = page ? includedSources.has(page.relPath) : false;
      const pageId = included ? publishedMap.get(page.relPath) : void 0;
      if (pageId) {
        crossLinks.push({ target, resolved: true, pageId });
        return `[${label}](/wiki/spaces/${spaceKey}/pages/${pageId})`;
      }
      const phrase = included ? "" : humanizeRepoRef(target);
      if (phrase) {
        renamed = true;
        const aliasId = alias?.trim() ?? "";
        if (RECORD_ID_RE.test(aliasId)) return aliasId;
        const anchorId = (anchor ?? "").replace(/^\^/, "").trim();
        if (RECORD_ID_RE.test(anchorId)) return anchorId;
        return phrase;
      }
      if (reserveUnresolved && included) {
        crossLinks.push({ target, resolved: false });
        return `[${label}](/wiki/spaces/${spaceKey}/pages/${PENDING_PAGE_ID})`;
      }
      crossLinks.push({ target, resolved: false });
      return label;
    }
  );
  const linked = transformOutsideCode(
    body,
    (chunk) => chunk.replace(MD_LINK_RE, (m, mdLabel, url) => {
      if (KEEP_LINK_URL.test(url)) return m;
      const noAnchor = url.replace(/[#?].*$/, "");
      if (!/\.md$/i.test(noAnchor)) return m;
      const base = noAnchor.replace(/^.*\//, "").replace(/\.md$/i, "");
      const page = g.byBasename.get(base);
      const pageId = page && includedSources.has(page.relPath) ? publishedMap.get(page.relPath) : void 0;
      if (pageId) {
        crossLinks.push({ target: base, resolved: true, pageId });
        return `[${mdLabel}](/wiki/spaces/${spaceKey}/pages/${pageId})`;
      }
      return m;
    })
  );
  return { body: renamed ? tidyRenamedPhrases(linked) : linked, crossLinks };
}
function splitTitle(title) {
  const m = /^\s*([A-Za-z]+-\d+\S*:)\s*(.*)$/.exec(title);
  if (m) return { prefix: m[1], label: m[2].trim() };
  return { prefix: "", label: title.trim() };
}
var KEEP_LINK_URL = /^(?:https?:|mailto:|#|\/wiki\/)/;
var MD_LINK_RE = /(?<!!)\[([^\]]*)\]\(([^)\s]+)\)/g;
var CODE_SPAN_RE = /~~~[\s\S]*?~~~|```[\s\S]*?```|``[\s\S]*?``|`[^`\n]*`/g;
function transformOutsidePattern(content, pattern, fn) {
  let out = "";
  let last = 0;
  for (const m of content.matchAll(pattern)) {
    const start = m.index;
    out += fn(content.slice(last, start)) + m[0];
    last = start + m[0].length;
  }
  return out + fn(content.slice(last));
}
function transformOutsideCode(content, fn) {
  return transformOutsidePattern(content, CODE_SPAN_RE, fn);
}
function protectAutolinkLabel(label) {
  return /^\S+$/.test(label) && label.includes(".") && !label.includes("`") ? `\`${label}\`` : label;
}
function neutralizeRepoRelativeLinks(content) {
  const stripped = [];
  const body = transformOutsideCode(
    content,
    (chunk) => chunk.replace(MD_LINK_RE, (m, label, url) => {
      if (KEEP_LINK_URL.test(url)) return m;
      stripped.push(url);
      const lbl = /^[\w-]+\/$/.test(label) ? label.slice(0, -1) : label;
      return protectAutolinkLabel(lbl);
    })
  );
  return { body, stripped: [...new Set(stripped)].sort((a, b) => a.localeCompare(b)) };
}
var SOURCES_HEADING_RE = /^##[ \t]+Sources[ \t]*$/i;
var TOP_HEADING_RE = /^#{1,2}[ \t]/;
var FENCE_LINE_RE = /^[ \t]*(?:```|~~~)/;
function stripSourcesSection(content) {
  const lines = content.split("\n");
  const out = [];
  let inFence = false;
  let stripped = false;
  for (let i = 0; i < lines.length; ) {
    const line = lines[i];
    if (FENCE_LINE_RE.test(line)) {
      inFence = !inFence;
      out.push(line);
      i += 1;
      continue;
    }
    if (!inFence && SOURCES_HEADING_RE.test(line)) {
      stripped = true;
      i += 1;
      let fenced = false;
      while (i < lines.length) {
        const l = lines[i];
        if (FENCE_LINE_RE.test(l)) {
          fenced = !fenced;
          i += 1;
          continue;
        }
        if (!fenced && TOP_HEADING_RE.test(l)) break;
        i += 1;
      }
      continue;
    }
    out.push(line);
    i += 1;
  }
  return { body: out.join("\n").replace(/\n[ \t\n]*$/, "\n"), stripped };
}
var REPO_PATH_SRC = "(?:(?:\\.{1,2}/)*(?:raw|c4|\\.foam|docs/architecture)/[\\w./\\-*]*|[\\w./\\-]*[\\w\\-]\\.(?:c4|csv)\\b|(?:risks|gap-analysis|kanban|glossary|utility-tree|CLAUDE)\\.md\\b)";
var REPO_PATH_RE = new RegExp(`(?<![\\w./\\-])${REPO_PATH_SRC}`, "g");
var REPO_PATH_CONTAINS_RE = new RegExp(`(?<![\\w./\\-])${REPO_PATH_SRC}`);
var REPO_PATH_ANCHORED_RE = new RegExp(`^${REPO_PATH_SRC}$`);
function isRepoInternalPath(token) {
  return REPO_PATH_ANCHORED_RE.test(token.trim());
}
var REGISTER_PHRASES = {
  risks: "the risk register",
  "gap-analysis": "the gap analysis",
  kanban: "the backlog",
  glossary: "the glossary",
  "utility-tree": "the utility tree",
  // "the contributor guide" (NOT "the schema contract", v0.8.6): CLAUDE.md is the schema/contributor
  // doc, and renaming it to "schema contract" collided with prose that already says "schema contract"
  // (`the schema contract lives in the schema contract`).
  claude: "the contributor guide"
};
function humanizeRepoRef(token) {
  const base = token.trim().replace(/^[`'"]+|[`'"]+$/g, "").replace(/[#?].*$/, "").replace(/\/+$/, "").toLowerCase();
  if (/\.c4\b/.test(base) || /(?:^|\/)c4(?:\/|$)/.test(base)) {
    if (/(?:^|\/)views?\.c4\b/.test(base)) return "the C4 views";
    if (/(?:^|\/)deployment\.c4\b/.test(base)) return "the C4 deployment view";
    return "the C4 model";
  }
  if (/\.csv\b/.test(base)) return "the data file";
  if (!base.includes("/")) {
    const reg = REGISTER_PHRASES[base.replace(/\.md$/, "")];
    if (reg) return reg;
  }
  if (/(?:^|\/)raw(?:\/|$)/.test(base)) return "the source brief";
  if (/(?:^|\/)\.foam(?:\/|$)/.test(base)) return "";
  if (/(?:^|\/)docs\/architecture(?:\/|$)/.test(base)) return "the architecture wiki";
  return "";
}
var RECORD_ID_RE = /^[A-Za-z]{1,4}-\d+$/;
var REPO_PHRASES = [
  "the risk register",
  "the gap analysis",
  "the backlog",
  "the glossary",
  "the utility tree",
  "the C4 deployment view",
  "the C4 views",
  "the C4 model",
  "the source brief",
  "the data file",
  "the architecture wiki",
  "the contributor guide"
];
var PHRASE_ALT = REPO_PHRASES.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|");
var ADJACENT_PHRASE_RE = new RegExp(`(${PHRASE_ALT})(?:[ \\t]*[\\/,;][ \\t]*\\1\\b)+`, "g");
var DOUBLE_THE_RE = /\b([Tt]he)[ \t]+the\b/g;
var INDEF_THE_RE = /\b([Aa])n?[ \t]+the\b/g;
function tidyRenamedPhrases(s) {
  return s.replace(DOUBLE_THE_RE, "$1").replace(INDEF_THE_RE, (_m, a) => a === "A" ? "The" : "the").replace(ADJACENT_PHRASE_RE, "$1");
}
var SOURCE_FIELD_RE = /^(\s*[-*]?\s*\*\*Source[^*\n]*:\*\*)(.*)$/i;
function stripSourceProvenanceLines(content) {
  const lines = content.split("\n");
  const out = [];
  let inFence = false;
  let stripped = false;
  for (const line of lines) {
    if (FENCE_LINE_RE.test(line)) {
      inFence = !inFence;
      out.push(line);
      continue;
    }
    if (!inFence) {
      const m = SOURCE_FIELD_RE.exec(line);
      if (m && REPO_PATH_CONTAINS_RE.test(m[2])) {
        stripped = true;
        const { body: cleanedValue } = neutralizeRepoPaths(m[2]);
        if (!/[A-Za-z0-9]/.test(cleanedValue)) continue;
        out.push((m[1] + cleanedValue).replace(/[ \t]+$/, ""));
        continue;
      }
    }
    out.push(line);
  }
  return { body: out.join("\n").replace(/\n[ \t\n]*$/, "\n"), stripped };
}
var B_SKIP_RE = /~~~[\s\S]*?~~~|```[\s\S]*?```|\]\([^)\n]*\)|https?:\/\/[^\s)\]]+/g;
var EMPTY_PROVENANCE_PAREN_RE = /\((?:from|see|source):?[ \t]*\)/gi;
var INLINE_CODE_SPAN_RE = /`[^`\n]+`/g;
function neutralizeRepoPaths(content) {
  let neutralized = false;
  const body = transformOutsidePattern(content, B_SKIP_RE, (chunk) => {
    let s = chunk;
    s = s.replace(INLINE_CODE_SPAN_RE, (m) => {
      const inner = m.slice(1, -1);
      if (isRepoInternalPath(inner)) {
        neutralized = true;
        return humanizeRepoRef(inner);
      }
      return m;
    });
    s = s.replace(REPO_PATH_RE, (m) => {
      neutralized = true;
      return humanizeRepoRef(m);
    });
    if (s === chunk) return chunk;
    return tidyRenamedPhrases(s).replace(EMPTY_PROVENANCE_PAREN_RE, "").replace(/\([ \t]*[,;][ \t]*/g, "(").replace(/\([ \t]+/g, "(").replace(/\([ \t]*\)/g, "").replace(/([^.\n])\.[ \t]*\.(?!\.)/g, "$1.").replace(/[ \t]{2,}/g, " ").replace(/[ \t]+([.,;:!?)])/g, "$1").replace(/[ \t]+\n/g, "\n");
  });
  return { body, neutralized };
}
function confluencePageUrl(siteUrl, spaceKey, pageId) {
  const base = siteUrl ? siteUrl.replace(/\/+$/, "") : "";
  return `${base}/wiki/spaces/${spaceKey}/pages/${pageId}`;
}
function jiraBrowseUrl(siteUrl, key) {
  return `${siteUrl.replace(/\/+$/, "")}/browse/${key}`;
}
var LOCAL_IMAGE_RE = /!\[([\s\S]*?)\]\((?!https?:)([^)\s]+)\)/g;
function stubLocalImages(content) {
  const stubbed = [];
  const body = transformOutsideCode(
    content,
    (chunk) => chunk.replace(LOCAL_IMAGE_RE, (_m, alt, src) => {
      stubbed.push(src);
      const descriptor = alt.trim() || humanizeRepoRef(src) || "a diagram";
      return `\u{1F4D0} C4 diagram placeholder \u2014 ${descriptor} _(attachment embedding pending)_`;
    })
  );
  return { body, stubbed: [...new Set(stubbed)].sort((a, b) => a.localeCompare(b)) };
}
var PROTECT_PREFIX = "%%AWP";
var PROTECT_SUFFIX = "%%";
var STRUCTURAL_PATTERNS = [
  /~~~[\s\S]*?~~~|```[\s\S]*?```|``[\s\S]*?``|`[^`\n]*`/g,
  // fenced + inline code (linear, see CODE_SPAN_RE)
  /(?<=\]\()[^)\s]+(?=\))/g,
  // markdown/image link URL
  /\b(?:UC|QA|CONC|CON|ADR|ITER)-\d{2,4}\b/g
  // artifact-id tokens
];
function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function protectStructuralSpans(body, preserveTerms = []) {
  let prefix = PROTECT_PREFIX;
  while (body.includes(prefix)) prefix += "X";
  const tokenRe = new RegExp(`${escapeRegExp(prefix)}\\d+${escapeRegExp(PROTECT_SUFFIX)}`, "g");
  const restore = [];
  let masked = body;
  let n = 0;
  const emit2 = (m) => {
    const token = `${prefix}${n}${PROTECT_SUFFIX}`;
    n += 1;
    restore.push({ token, original: m });
    return token;
  };
  for (const re of STRUCTURAL_PATTERNS) masked = masked.replace(re, emit2);
  const terms = [...new Set(preserveTerms)].filter((t) => t.trim().length > 0).sort((a, b) => b.length - a.length || a.localeCompare(b));
  for (const term of terms) {
    const termRe = new RegExp(`(?<![A-Za-z0-9-])${escapeRegExp(term)}(?![A-Za-z0-9-])`, "g");
    masked = transformOutsidePattern(masked, tokenRe, (chunk) => chunk.replace(termRe, emit2));
  }
  return { masked, restore };
}
function applyRestore(text, restore) {
  let body = text;
  const missing = [];
  for (const { token, original } of restore) {
    if (!body.includes(token)) {
      missing.push(token);
      continue;
    }
    body = body.split(token).join(original);
  }
  return { body, missing };
}
function extractGlossaryTerms(glossaryMarkdown) {
  const terms = /* @__PURE__ */ new Set();
  for (const m of glossaryMarkdown.matchAll(/\*\*(.+?)\*\*/g)) {
    const t = m[1].trim();
    if (t) terms.add(t);
  }
  return [...terms].sort((a, b) => a.localeCompare(b));
}

// src/application/usecases/RenderIssuePayload.ts
var ISSUE_KINDS = ["arch", "techdesign"];
var ISSUE_ROLES = ["be", "fe", "do"];
function cleanTitle(heading) {
  return heading.replace(/^\s*[A-Za-z]+-\d+\S*:\s*/, "").trim();
}
function idOf(heading) {
  if (!heading) return null;
  const m = /^\s*([A-Za-z]+-\d+\S*?):/.exec(heading);
  return m ? m[1] : null;
}
function resolveTraceLinks(args) {
  const { from, title, sourcePage, graph, publishedMap, space, siteUrl } = args;
  if (!space || !sourcePage) return { traceLinks: [], warnings: [] };
  const warnings = [];
  const byUrl = /* @__PURE__ */ new Map();
  const add = (relPath, id, ttl) => {
    const pid = publishedMap.get(relPath);
    if (!pid) return false;
    const url = confluencePageUrl(siteUrl, space, pid);
    if (!byUrl.has(url)) byUrl.set(url, { id, title: ttl, url });
    return true;
  };
  if (!add(sourcePage.relPath, from, title)) {
    warnings.push(`source ${from} is not yet mirrored to Confluence (no trace link); run /arch-wiki:publish first`);
  }
  for (const l of sourcePage.links) {
    const tp = graph.byBasename.get(l.target);
    if (tp && tp.relPath !== sourcePage.relPath) {
      add(tp.relPath, idOf(tp.headings[0]), cleanTitle(tp.headings[0] ?? tp.basename));
    }
  }
  const traceLinks = [...byUrl.values()];
  if (siteUrl == null && traceLinks.length > 0) {
    warnings.push(
      "integrations.confluence.siteUrl not set \u2014 trace links are root-relative (resolve from Jira on the same Atlassian site; set siteUrl for absolute links)"
    );
  }
  return { traceLinks, warnings };
}
async function renderIssuePayload(input, deps) {
  const { repo, payloads, config, ledger, hash } = deps;
  const from = input.from?.trim();
  if (!from) throw new DomainError("render-issue: missing --from", 1);
  if (!ISSUE_KINDS.includes(input.kind)) {
    throw new DomainError(`render-issue: --kind must be one of ${ISSUE_KINDS.join("|")}`, 1);
  }
  if (input.kind === "techdesign" && !input.role) {
    throw new DomainError("render-issue: --role is required for --kind techdesign", 1);
  }
  if (input.role && !ISSUE_ROLES.includes(input.role)) {
    throw new DomainError(`render-issue: --role must be one of ${ISSUE_ROLES.join("|")}`, 1);
  }
  const role = input.role ?? null;
  const prefix = config.taskPrefix(input.kind, input.role);
  const language = config.language();
  const basename2 = await repo.resolveBasename(from);
  if (!basename2) throw new DomainError(`render-issue: cannot resolve --from "${from}"`, 2);
  const pages = await repo.loadPages();
  const graph = buildGraph(pages);
  const sourcePage = pages.find((p) => p.basename === basename2) ?? null;
  const title = sourcePage?.headings[0] ? cleanTitle(sourcePage.headings[0]) : basename2;
  const driverLink = `[[${basename2}|${from}]]`;
  const { traceLinks, warnings: traceWarnings } = resolveTraceLinks({
    from,
    title,
    sourcePage,
    graph,
    publishedMap: new Map((await ledger.readPages()).map((r) => [r.source, r.page])),
    space: config.confluence()?.space ?? null,
    siteUrl: config.confluenceSiteUrl()
  });
  const templateName = input.kind === "arch" ? "issue-arch.md" : "issue-techdesign.md";
  const template = await payloads.loadByName(templateName);
  const { output, unresolved } = render(template, {
    prefix,
    title,
    source: basename2,
    driver: driverLink
  });
  const warnings = [
    ...unresolved.length ? [`unresolved template tokens: ${unresolved.join(", ")}`] : [],
    ...traceWarnings
  ];
  const canonical = JSON.stringify({ kind: input.kind, role, prefix, language, title, source: basename2, drivers: [driverLink] });
  const contentHash = hash(canonical);
  const existing = (await ledger.readIssues()).find(
    (r) => r.sourceId === from && r.kind === input.kind && r.role === role
  );
  return {
    kind: input.kind,
    role,
    prefix,
    language,
    title,
    issueTitle: `${prefix} ${title}`,
    sourceId: from,
    drivers: [driverLink],
    traceLinks,
    contentHash,
    payload: output,
    alreadyCreated: existing != null,
    drifted: existing != null && existing.contentHash !== contentHash,
    key: existing?.key ?? null,
    warnings
  };
}

// src/application/usecases/RecordIssue.ts
async function recordIssue(input, deps) {
  const { repo, ledger, frontmatter, clock } = deps;
  const id = input.id?.trim();
  const key = input.key?.trim();
  if (!id) throw new DomainError("record-issue: missing --id", 1);
  if (!key) throw new DomainError("record-issue: missing --key", 1);
  if (!ISSUE_KINDS.includes(input.kind)) {
    throw new DomainError(`record-issue: --kind must be one of ${ISSUE_KINDS.join("|")}`, 1);
  }
  if (input.kind === "techdesign" && !input.role) {
    throw new DomainError("record-issue: --role is required for --kind techdesign", 1);
  }
  if (input.role && !ISSUE_ROLES.includes(input.role)) {
    throw new DomainError(`record-issue: --role must be one of ${ISSUE_ROLES.join("|")}`, 1);
  }
  if (!input.hash?.trim()) throw new DomainError("record-issue: missing --hash", 1);
  const ledgerAppended = await ledger.appendIssue({
    key,
    sourceId: id,
    kind: input.kind,
    role: input.role ?? null,
    contentHash: input.hash,
    createdAt: clock.now().toISOString(),
    system: input.system?.trim() || "jira"
  });
  let frontmatterUpdated = false;
  let pagePath = null;
  const basename2 = await repo.resolveBasename(id);
  if (basename2) {
    const page = (await repo.loadPages()).find((p) => p.basename === basename2);
    if (page) {
      pagePath = page.relPath;
      const { frontmatter: fm, content } = await repo.readParsed(page.relPath);
      const existing = Array.isArray(fm.realized_by) ? fm.realized_by.map(String) : [];
      if (!existing.includes(key)) {
        const merged = deepMerge(fm, { realized_by: [...existing, key].sort() });
        await repo.write(page.relPath, frontmatter.stringify({ frontmatter: merged, content }));
        frontmatterUpdated = true;
      }
    }
  }
  return { key, ledgerAppended, frontmatterUpdated, path: pagePath };
}

// src/domain/services/Assurance.ts
var DRIVER_KINDS = [
  "use-case",
  "quality-attribute",
  "constraint",
  "concern"
];
function computeAssurance(g, ctx = {}) {
  const ledgerKeys = ctx.ledgerIssueKeys ?? /* @__PURE__ */ new Set();
  const liveCov = /* @__PURE__ */ new Map();
  const nonLiveCov = /* @__PURE__ */ new Map();
  for (const c of pagesOfKind(g, ["adr", "iteration"])) {
    const isIter = kindOfPage(c) === "iteration";
    const status = isIter ? "accepted" : String(c.frontmatter.status ?? "").toLowerCase();
    const live = isIter || status === "accepted";
    for (const l of c.links) {
      if (live) {
        const arr = liveCov.get(l.target);
        if (arr) arr.push(c.basename);
        else liveCov.set(l.target, [c.basename]);
      } else {
        const label = `${c.basename} [${status || "no status"}]`;
        const arr = nonLiveCov.get(l.target);
        if (arr) arr.push(label);
        else nonLiveCov.set(l.target, [label]);
      }
    }
  }
  const out = [];
  for (const d of pagesOfKind(g, DRIVER_KINDS)) {
    const kind = kindOfPage(d);
    const liveCoverers = [...new Set(liveCov.get(d.basename) ?? [])].sort();
    const nonLiveCoverers = [...new Set(nonLiveCov.get(d.basename) ?? [])].sort();
    const rb = d.frontmatter.realized_by;
    const realizedBy = Array.isArray(rb) ? [...new Set(rb.map(String))].filter((k) => ledgerKeys.has(k)).sort() : [];
    let level;
    let reason;
    if (liveCoverers.length === 0) {
      level = "L0";
      reason = nonLiveCoverers.length > 0 ? `no live decision \u2014 only non-accepted: ${nonLiveCoverers.join(", ")}` : "no accepted ADR or iteration covers it";
    } else if (realizedBy.length > 0) {
      level = "L2";
      reason = `live-covered by ${liveCoverers.join(", ")}; realized by ${realizedBy.join(", ")}`;
    } else {
      level = "L1";
      reason = `live-covered by ${liveCoverers.join(", ")}; not yet realized`;
    }
    out.push({
      driver: d.basename,
      file: d.relPath,
      kind,
      level,
      liveCoverers,
      nonLiveCoverers,
      realizedBy,
      reason
    });
  }
  return out.sort((a, b) => a.driver.localeCompare(b.driver));
}
function summarizeAssurance(rows) {
  const s = { L0: 0, L1: 0, L2: 0, total: rows.length };
  for (const r of rows) s[r.level]++;
  return s;
}

// src/application/usecases/Trace.ts
var DRIVER_KINDS2 = ["use-case", "quality-attribute", "constraint", "concern"];
async function trace(id, deps) {
  const { repo, ledger } = deps;
  const wanted = id?.trim();
  if (!wanted) throw new DomainError("trace: missing <ID>", 1);
  const basename2 = await repo.resolveBasename(wanted);
  if (!basename2) throw new DomainError(`trace: cannot resolve "${wanted}"`, 2);
  const [pages, allFiles, ledgerIssues, ledgerPages] = await Promise.all([
    repo.loadPages(),
    repo.listFiles(),
    ledger.readIssues(),
    ledger.readPages()
  ]);
  const g = buildGraph(pages);
  const page = g.byBasename.get(basename2);
  const kind = kindOfPage(page);
  const fileSet = new Set(allFiles);
  const raw = [];
  const source = page.frontmatter.source;
  if (typeof source === "string" && source) {
    raw.push({ raw: source, exists: fileSet.has(source) });
  }
  const driverSet = new Set(pagesOfKind(g, DRIVER_KINDS2).map((p) => p.basename));
  const drivers = page.links.map((l) => l.target).filter((t) => driverSet.has(t) && t !== basename2);
  const adrSet = new Set(pagesOfKind(g, ["adr"]).map((p) => p.basename));
  let adrs;
  if (kind != null && DRIVER_KINDS2.includes(kind)) {
    adrs = pagesOfKind(g, ["adr", "iteration"]).filter((c) => c.links.some((l) => l.target === basename2)).map((c) => c.basename);
  } else {
    adrs = page.links.map((l) => l.target).filter((t) => adrSet.has(t));
  }
  const ledgerKeys = new Map(ledgerIssues.map((r) => [r.key, r]));
  const realizedBy = page.frontmatter.realized_by;
  const issues = [];
  const seen = /* @__PURE__ */ new Set();
  if (Array.isArray(realizedBy)) {
    for (const k of realizedBy.map(String)) {
      const row = ledgerKeys.get(k);
      issues.push({ key: k, system: row?.system, stale: row == null });
      seen.add(k);
    }
  }
  for (const r of ledgerIssues) {
    if (r.sourceId === wanted && !seen.has(r.key)) {
      issues.push({ key: r.key, system: r.system, stale: false });
      seen.add(r.key);
    }
  }
  const showcase = ledgerPages.filter((r) => r.source === basename2 || r.source === page.relPath || r.source === wanted).map((r) => ({ page: r.page, hash: r.contentHash }));
  let assuranceLevel;
  let assuranceReason;
  if (kind != null && DRIVER_KINDS2.includes(kind)) {
    const row = computeAssurance(g, {
      ledgerIssueKeys: new Set(ledgerIssues.map((r) => r.key))
    }).find((a) => a.driver === basename2);
    assuranceLevel = row?.level;
    assuranceReason = row?.reason;
  }
  return {
    id: wanted,
    basename: basename2,
    kind,
    raw,
    drivers: [...new Set(drivers)].sort(),
    adrs: [...new Set(adrs)].sort(),
    issues: issues.sort((a, b) => a.key.localeCompare(b.key)),
    showcase: showcase.sort((a, b) => a.page.localeCompare(b.page)),
    assuranceLevel,
    assuranceReason
  };
}

// src/application/usecases/RenderStoryPullPlan.ts
async function renderStoryPullPlan(deps) {
  const u = deps.config.userStoryLog();
  return {
    cloudId: u.cloudId,
    rootPageId: u.pageId,
    childTitlePrefix: u.childTitlePrefix ?? "Story:",
    alreadyPulled: await deps.ledger.readPulled()
  };
}

// src/application/usecases/RecordStorySnapshot.ts
var SYNC_DIR = "raw/_synced/user-story-log";
var MAX_BODY_BYTES = 512 * 1024;
function normalizeBody(s) {
  return `${s.replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "").replace(/\n+$/, "")}
`;
}
async function recordStorySnapshot(input, deps) {
  if (!input.pageId) throw new DomainError("record-story: missing --page", 1);
  if (!input.title) throw new DomainError("record-story: missing --title", 1);
  const body = input.body ?? "";
  if (body.trim() === "") throw new DomainError("record-story: empty page body", 2);
  if (Buffer.byteLength(body, "utf8") > MAX_BODY_BYTES) {
    throw new DomainError("record-story: page body exceeds 512KB", 2);
  }
  const slug = input.slug ?? requireSlug(input.title);
  const relPath = `${SYNC_DIR}/${input.pageId}-${slug}.md`;
  const content = normalizeBody(body);
  const contentHash = deps.hash(content);
  const rows = await deps.ledger.readPulled();
  const existing = rows.find((r) => r.pageId === input.pageId);
  if (existing && existing.contentHash === contentHash && existing.relPath === relPath) {
    return { relPath, written: false, drifted: false, contentHash };
  }
  const pulledAt = input.pulledAt ?? deps.clock.now().toISOString();
  const frontmatter = {
    source: "confluence",
    pageId: input.pageId,
    title: input.title,
    version: input.version,
    pulledAt,
    contentHash
  };
  if (input.parentId) frontmatter.parentId = input.parentId;
  if (existing && existing.relPath !== relPath) await deps.repo.deleteFile(existing.relPath);
  await deps.repo.write(relPath, deps.frontmatter.stringify({ frontmatter, content }));
  await deps.ledger.appendPulled({
    pageId: input.pageId,
    relPath,
    title: input.title,
    version: input.version,
    contentHash,
    pulledAt,
    source: "confluence"
  });
  return { relPath, written: true, drifted: existing != null, contentHash };
}

// src/application/usecases/PruneStorySnapshots.ts
async function pruneStorySnapshots(livePageIds, deps, options2 = {}) {
  const commit = options2.commit === true;
  const live = new Set(livePageIds);
  const rows = await deps.ledger.readPulled();
  const orphans = rows.filter((r) => !live.has(r.pageId));
  if (commit) {
    for (const o of orphans) {
      await deps.repo.deleteFile(o.relPath);
      await deps.ledger.removePulled(o.pageId);
    }
  }
  return {
    committed: commit,
    pruned: orphans.map((o) => ({ pageId: o.pageId, relPath: o.relPath })).sort((a, b) => a.pageId.localeCompare(b.pageId))
  };
}

// src/application/usecases/RenderConfluencePayload.ts
function normalizeBody2(s) {
  return `${s.replace(/\r\n/g, "\n").replace(/[ \t]+$/gm, "").replace(/\n+$/, "")}
`;
}
function titleOf(page) {
  return page.headings[0]?.trim() || page.basename;
}
async function renderConfluencePayload(deps) {
  const conf = deps.config.confluence();
  const spaceKey = conf?.space;
  if (!spaceKey) {
    throw new DomainError(
      "project has no [integrations.confluence.space]; required by render-confluence",
      2
    );
  }
  const language = conf?.language ?? null;
  const spaceIdNumeric = deps.config.confluenceSpaceId();
  const cloudId = deps.config.confluenceCloudId();
  const jiraSiteUrl = deps.config.jiraSiteUrl();
  const planWarnings = [];
  if (!spaceIdNumeric) {
    planWarnings.push(
      `integrations.confluence.spaceId (numeric) is not set \u2014 createConfluencePage needs it (the space KEY "${spaceKey}" returns HTTP 400); look it up once via getConfluenceSpaces(keys:["${spaceKey}"])`
    );
  }
  if (!cloudId) {
    planWarnings.push("integrations.confluence.cloudId is not set \u2014 create/updateConfluencePage require it");
  }
  const rawExclude = conf.exclude;
  const exclude = {
    statuses: rawExclude?.statuses ?? DEFAULT_EXCLUDE.statuses,
    basenames: rawExclude?.basenames ?? DEFAULT_EXCLUDE.basenames
  };
  const pages = await deps.repo.loadPages();
  const graph = buildGraph(pages);
  let preserveTerms = [];
  if (language) {
    const configTerms = conf.preserveTerms ?? [];
    const glossaryPage = pages.find((p) => p.basename === "glossary") ?? null;
    const glossaryTerms = glossaryPage ? extractGlossaryTerms((await deps.repo.readParsed(glossaryPage.relPath)).content) : [];
    preserveTerms = [.../* @__PURE__ */ new Set([...configTerms, ...glossaryTerms])].sort((a, b) => a.localeCompare(b));
  }
  const included = pages.filter((p) => !isPageExcluded(p, exclude));
  const includedSources = new Set(included.map((p) => p.relPath));
  const hubMap = /* @__PURE__ */ new Map();
  for (const kind of Object.keys(ARTIFACT_SPECS)) {
    hubMap.set(kind, deps.config.hubFile(kind));
  }
  const indexPage = included.find((p) => p.basename === "index") ?? null;
  const indexSource = indexPage?.relPath ?? null;
  const parents = /* @__PURE__ */ new Map();
  for (const p of included) {
    parents.set(p.relPath, parentSourceOf(p, hubMap, includedSources, indexSource));
  }
  const ledgerRows = await deps.ledger.readPages();
  const publishedMap = /* @__PURE__ */ new Map();
  const ledgerHash = /* @__PURE__ */ new Map();
  const ledgerVersion = /* @__PURE__ */ new Map();
  for (const r of ledgerRows) {
    publishedMap.set(r.source, r.page);
    ledgerHash.set(r.source, r.contentHash);
    if (r.pageVersion != null) ledgerVersion.set(r.source, r.pageVersion);
  }
  const issueSystem = /* @__PURE__ */ new Map();
  for (const r of await deps.ledger.readIssues()) issueSystem.set(r.key, r.system);
  const envelopes = /* @__PURE__ */ new Map();
  for (const p of included) {
    const parsed = await deps.repo.readParsed(p.relPath);
    const { body: noSources, stripped: sourcesStripped } = stripSourcesSection(normalizeBody2(parsed.content));
    const { body: noFields, stripped: fieldsStripped } = stripSourceProvenanceLines(noSources);
    const { body: resolved, crossLinks } = resolveCrossLinks(
      noFields,
      graph,
      publishedMap,
      includedSources,
      spaceKey,
      // the space KEY → /wiki/spaces/<key>/pages/<id> (NOT the numeric create id)
      // Translation mode reserves a masked-link slot for not-yet-published targets so the
      // translatable body is stable across the 2-pass publish (no re-translation on pass 2).
      language != null
    );
    const { body: linkClean, stripped } = neutralizeRepoRelativeLinks(resolved);
    const { body: curated, neutralized: pathsNeutralized } = neutralizeRepoPaths(linkClean);
    const { body: stubbedBody, stubbed } = stubLocalImages(curated);
    const realizedKeys = Array.isArray(parsed.frontmatter.realized_by) ? parsed.frontmatter.realized_by.map(String) : [];
    const realizedBy = realizedKeys.map((key) => {
      const sys = issueSystem.get(key);
      const url = jiraSiteUrl && (sys === void 0 || sys === "jira") ? jiraBrowseUrl(jiraSiteUrl, key) : null;
      return { key, url };
    });
    const linked = realizedBy.filter((r) => r.url);
    const reverseEdge = linked.length ? `

**Realized by:** ${linked.map((r) => `[\`${r.key}\`](${r.url})`).join(", ")}
` : "";
    const englishBody = `${stubbedBody.replace(/\n+$/, "")}${reverseEdge ? reverseEdge : "\n"}`;
    const title = titleOf(p);
    const { prefix: titlePrefix, label: titleLabel } = splitTitle(title);
    const parentSource = parents.get(p.relPath) ?? null;
    const contentHash = deps.hash(
      JSON.stringify(
        language ? { title, parentSource, body: englishBody, language } : { title, parentSource, body: englishBody }
      )
    );
    const { masked, restore } = language ? protectStructuralSpans(englishBody, preserveTerms) : { masked: englishBody, restore: [] };
    const alreadyPublished = publishedMap.has(p.relPath);
    const warnings = [];
    if (crossLinks.some((c) => !c.resolved)) {
      warnings.push(
        language != null ? "some cross-link targets are not yet published (reserved as pending links; resolve on pass 2)" : "some cross-link targets are not yet published (rendered as plain text)"
      );
    }
    if (stripped.length > 0) {
      warnings.push(`neutralized ${stripped.length} repo-relative link(s) to plain text: ${stripped.join(", ")}`);
    }
    if (stubbed.length > 0) {
      warnings.push(`stubbed ${stubbed.length} local image(s) as C4 diagram placeholder(s): ${stubbed.join(", ")}`);
    }
    if (sourcesStripped) {
      warnings.push("stripped the `## Sources` provenance section (git source-of-truth is not mirrored)");
    }
    if (fieldsStripped) {
      warnings.push("stripped a `**Source:**` field citing the git source-of-truth");
    }
    if (pathsNeutralized) {
      warnings.push("neutralized repo-internal path reference(s) \u2014 git source-of-truth is not mirrored");
    }
    const unlinked = realizedBy.filter((r) => !r.url);
    if (unlinked.length > 0) {
      warnings.push(
        jiraSiteUrl ? `realized_by non-Jira issue(s) \u2014 no browse link yet: ${unlinked.map((r) => r.key).join(", ")}` : `realized_by issue(s) present but no jira.siteUrl/confluence.siteUrl \u2014 reverse trace link omitted: ${unlinked.map((r) => r.key).join(", ")}`
      );
    }
    envelopes.set(p.relPath, {
      source: p.relPath,
      basename: p.basename,
      title,
      titlePrefix,
      titleLabel,
      spaceKey,
      parentSource,
      language,
      body: masked,
      crossLinks,
      restore,
      contentHash,
      alreadyPublished,
      drifted: alreadyPublished && ledgerHash.get(p.relPath) !== contentHash,
      pageId: publishedMap.get(p.relPath) ?? null,
      ledgerPageVersion: ledgerVersion.get(p.relPath) ?? null,
      realizedBy,
      warnings
    });
  }
  const ordered = sortParentFirst([...envelopes.keys()], parents).map((s) => envelopes.get(s));
  const orphans = ledgerRows.filter((r) => !includedSources.has(r.source)).map((r) => ({ page: r.page, source: r.source })).sort((a, b) => a.source.localeCompare(b.source));
  return {
    spaceKey,
    spaceId: spaceIdNumeric,
    cloudId,
    language,
    preserveTerms,
    pages: ordered,
    orphans,
    warnings: planWarnings
  };
}

// src/application/usecases/RecordPage.ts
async function recordPage(input, deps) {
  const { repo, ledger, frontmatter, clock } = deps;
  const source = input.source?.trim();
  if (!source) throw new DomainError("record-page: missing --source", 1);
  if (input.del) {
    const ledgerRemoved = await ledger.removePage(source);
    let frontmatterUpdated2 = false;
    if (await repo.exists(source)) {
      const { frontmatter: fm, content } = await repo.readParsed(source);
      if (Array.isArray(fm.published_as)) {
        const next = { ...fm };
        delete next.published_as;
        await repo.write(source, frontmatter.stringify({ frontmatter: next, content }));
        frontmatterUpdated2 = true;
      }
    }
    return { source, page: null, ledgerAppended: false, ledgerRemoved, frontmatterUpdated: frontmatterUpdated2 };
  }
  const page = input.page?.trim();
  if (!page) throw new DomainError("record-page: missing --page", 1);
  if (!input.hash?.trim()) throw new DomainError("record-page: missing --hash", 1);
  const system = input.system?.trim() || "confluence";
  const ledgerAppended = await ledger.appendPage({
    source,
    page,
    contentHash: input.hash,
    publishedAt: clock.now().toISOString(),
    system,
    ...input.pageVersion != null ? { pageVersion: input.pageVersion } : {}
  });
  let frontmatterUpdated = false;
  if (await repo.exists(source)) {
    const { frontmatter: fm, content } = await repo.readParsed(source);
    const tag = `${system}:${page}`;
    const existing = Array.isArray(fm.published_as) ? fm.published_as.map(String) : [];
    if (!existing.includes(tag)) {
      const merged = deepMerge(fm, { published_as: [...existing, tag].sort() });
      await repo.write(source, frontmatter.stringify({ frontmatter: merged, content }));
      frontmatterUpdated = true;
    }
  }
  return { source, page, ledgerAppended, ledgerRemoved: false, frontmatterUpdated };
}

// src/application/usecases/EnrichDriver.ts
var HEADING3 = "## Related Patterns";
var START = "<!-- arch-wiki:enrich:start -->";
var END = "<!-- arch-wiki:enrich:end -->";
var NONE = "<!-- arch-wiki:enrich none -->";
var KEY_PREFIX = "enrich:";
function oneLine(s) {
  return s.replace(/\r?\n/g, " ").trim();
}
function sortHits(hits) {
  return [...hits].sort((a, b) => b.score - a.score || a.source.localeCompare(b.source));
}
function buildSection(hits) {
  const body = hits.length ? sortHits(hits).map((h) => `- ${h.source} \xB7 ${h.score} \xB7 ${oneLine(h.excerpt)}`).join("\n") : NONE;
  return `${HEADING3}
${START}
${body}
${END}`;
}
function applySection(content, section) {
  const marker = `${HEADING3}
${START}`;
  const mIdx = content.indexOf(marker);
  if (mIdx >= 0) {
    const eIdx = content.indexOf(END, mIdx);
    if (eIdx >= 0) return content.slice(0, mIdx) + section + content.slice(eIdx + END.length);
  }
  const base = content.length === 0 || content.endsWith("\n") ? content : `${content}
`;
  return `${base}
${section}
`;
}
async function enrichDriver(input, deps) {
  const { repo } = deps;
  const pages = await repo.loadPages();
  const enriched = [];
  const unresolved = [];
  for (const answer of input.answers) {
    if (!answer.key.startsWith(KEY_PREFIX)) {
      unresolved.push(answer.key);
      continue;
    }
    const driver = answer.key.slice(KEY_PREFIX.length);
    const basename2 = await repo.resolveBasename(driver);
    const page = basename2 ? pages.find((p) => p.basename === basename2) : void 0;
    if (!page) {
      unresolved.push(driver);
      continue;
    }
    const content = await repo.read(page.relPath);
    await repo.write(page.relPath, applySection(content, buildSection(answer.hits)));
    enriched.push({ driver, path: page.relPath, hits: answer.hits.length });
  }
  enriched.sort((a, b) => a.driver.localeCompare(b.driver));
  unresolved.sort();
  return { enriched, unresolved };
}

// src/adapters/rag/BooksRagPlanner.ts
var ROZANSKI_VIEWPOINTS = [
  "functional",
  "information",
  "concurrency",
  "development",
  "deployment",
  "operational"
];
var BooksRagPlanner = class {
  renderPlan(input) {
    const queries = this.queriesFor(input).slice().sort((a, b) => a.key.localeCompare(b.key));
    return {
      corpus: "local-rag",
      mcpTool: "mcp__local-rag__query_documents",
      queries,
      optional: input.site === "enrich"
    };
  }
  queriesFor(input) {
    switch (input.site) {
      case "hypothesis": {
        const hints = (input.kindHints ?? []).filter(Boolean);
        const scope = hints.length ? ` (${hints.join(", ")})` : "";
        return [
          {
            key: "hypothesis:patterns",
            query: `architecture patterns and tactics relevant to "${input.topic}"${scope}`,
            limit: 10,
            purpose: "patterns to inform the hypothesis prose"
          }
        ];
      }
      case "questionnaire-rozanski": {
        const viewpoints = (input.viewpoints?.length ? input.viewpoints : ROZANSKI_VIEWPOINTS).filter(Boolean);
        return viewpoints.map((v) => ({
          key: `questionnaire:viewpoint:${v}`,
          query: `${v} viewpoint concerns and example questions for "${input.topic}"`,
          limit: 5,
          purpose: `Rozanski/Woods ${v} viewpoint examples`
        }));
      }
      case "enrich": {
        return input.drivers.filter(Boolean).map((d) => ({
          key: `enrich:${d}`,
          query: `architecture patterns related to ${d}`,
          limit: 5,
          purpose: `Related Patterns enrichment for ${d}`
        }));
      }
    }
  }
};

// src/domain/services/Levenshtein.ts
function levenshtein(a, b) {
  if (a === b) return 0;
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1).fill(0);
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(prev[j] + 1, curr[j - 1] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

// src/domain/services/PathUtil.ts
function isProtectedWritePath(p) {
  const posix2 = p.split("\\").join("/");
  if (posix2.endsWith(".snap")) return true;
  return /(^|\/)docs\/architecture\/raw\//.test(posix2);
}
function posixResolve(base, rel) {
  const parts = (base ? base.split("/") : []).concat(rel.split("/"));
  const stack = [];
  for (const p of parts) {
    if (p === "" || p === ".") continue;
    if (p === "..") stack.pop();
    else stack.push(p);
  }
  return stack.join("/");
}

// src/domain/services/LintRuleSet.ts
var SEVERITY_RANK = { low: 1, medium: 2, high: 3 };
var STRUCTURAL = /* @__PURE__ */ new Set([
  "index",
  "CLAUDE",
  // the schema/contract file (Layer 3), not a wiki page
  "README",
  "glossary",
  "risks",
  "gap-analysis",
  "epistemic-debt",
  // FPF B.3.4 decay register (arch-wiki update-epistemic-debt)
  "utility-tree",
  "kanban"
]);
var DRIVER_KINDS3 = ["use-case", "quality-attribute", "constraint", "concern"];
function runLint(g, ctx = {}) {
  const findings = [];
  const inbound = inboundCounts(g);
  const present = g.byBasename;
  for (const p of g.pages) {
    for (const l of p.links) {
      if (present.has(l.target)) continue;
      let near;
      for (const b of present.keys()) {
        if (Math.abs(b.length - l.target.length) > 2) continue;
        if (levenshtein(b, l.target) <= 2) {
          near = b;
          break;
        }
      }
      if (near) {
        findings.push({
          rule: "broken-wikilink",
          severity: "high",
          file: p.relPath,
          message: `[[${l.target}]] looks like a typo of [[${near}]]`
        });
      }
    }
    for (const md of p.mdLinks) {
      let missing;
      if (ctx.allFiles) {
        missing = !ctx.allFiles.has(posixResolve(p.folder, md));
      } else {
        missing = !present.has(md.replace(/^.*\//, "").replace(/\.md$/, ""));
      }
      if (missing) {
        findings.push({
          rule: "broken-mdlink",
          severity: "high",
          file: p.relPath,
          message: `broken link to missing file: ${md}`
        });
      }
    }
  }
  const byName = /* @__PURE__ */ new Map();
  for (const p of g.pages) {
    const arr = byName.get(p.basename);
    if (arr) arr.push(p);
    else byName.set(p.basename, [p]);
  }
  for (const [name, ps] of byName) {
    if (ps.length < 2) continue;
    for (const p of ps) {
      const others = ps.filter((o) => o.relPath !== p.relPath).map((o) => o.relPath).sort();
      findings.push({
        rule: "duplicate-basename",
        severity: "high",
        file: p.relPath,
        message: `duplicate basename [[${name}]] also at ${others.join(", ")}`
      });
    }
  }
  for (const p of g.pages) {
    if (kindOfPage(p) === "arc42") continue;
    if (STRUCTURAL.has(p.basename)) continue;
    if ((inbound.get(p.basename) ?? 0) === 0) {
      findings.push({
        rule: "orphan",
        severity: "medium",
        file: p.relPath,
        message: `orphan: nothing links to [[${p.basename}]]`
      });
    }
  }
  const coveredAny = /* @__PURE__ */ new Set();
  const coveredLive = /* @__PURE__ */ new Set();
  const nonLiveLinkers = /* @__PURE__ */ new Map();
  for (const c of pagesOfKind(g, ["adr", "iteration"])) {
    const isIter = kindOfPage(c) === "iteration";
    const status = isIter ? "accepted" : String(c.frontmatter.status ?? "").toLowerCase();
    const live = isIter || status === "accepted";
    for (const l of c.links) {
      coveredAny.add(l.target);
      if (live) {
        coveredLive.add(l.target);
      } else {
        const label = `${c.basename} [${status || "no status"}]`;
        const arr = nonLiveLinkers.get(l.target);
        if (arr) arr.push(label);
        else nonLiveLinkers.set(l.target, [label]);
      }
    }
  }
  for (const d of pagesOfKind(g, [...DRIVER_KINDS3])) {
    if (!coveredAny.has(d.basename)) {
      findings.push({
        rule: "uncovered-driver",
        severity: "medium",
        file: d.relPath,
        message: `driver ${d.basename} is not covered by any ADR or iteration`
      });
    } else if (!coveredLive.has(d.basename)) {
      const linkers = [...new Set(nonLiveLinkers.get(d.basename) ?? [])].sort().join(", ");
      findings.push({
        rule: "driver-not-live-covered",
        severity: "low",
        file: d.relPath,
        message: `driver ${d.basename} is linked only by non-accepted ADR(s) (${linkers}) \u2014 not yet live-covered`
      });
    }
  }
  for (const adr of pagesOfKind(g, ["adr"])) {
    const status = String(adr.frontmatter.status ?? "").toLowerCase();
    if (status !== "superseded" && status !== "deprecated") continue;
    const hasSuccessor = adr.links.some((l) => {
      const t = present.get(l.target);
      return t != null && kindOfPage(t) === "adr";
    });
    if (!hasSuccessor) {
      findings.push({
        rule: "superseded-no-successor",
        severity: "high",
        file: adr.relPath,
        message: `ADR ${adr.basename} is ${status} but links to no successor ADR`
      });
    }
  }
  for (const p of g.pages) {
    const kind = kindOfPage(p);
    if (kind == null) continue;
    const required = ctx.requiredSections?.get(kind);
    if (!required || required.length === 0) continue;
    const present2 = new Set([...p.headings, ...p.labels].map(normalizeSection));
    for (const sec of required) {
      const key = normalizeSection(sec.marker);
      if (!present2.has(key)) {
        findings.push({
          rule: "missing-required-section",
          severity: sec.severity,
          file: p.relPath,
          message: `${kind} page is missing required section "${sec.marker}"`
        });
        continue;
      }
      if (sec.minWikilinks >= 1 && (p.sectionWikilinkCounts.get(key) ?? 0) < sec.minWikilinks) {
        findings.push({
          rule: "required-section-underlinked",
          severity: sec.severity,
          file: p.relPath,
          message: `${kind} section "${sec.marker}" has fewer than ${sec.minWikilinks} [[wikilink]]`
        });
      }
    }
  }
  return sortFindings(findings);
}
var MARKER_INDEPENDENT_RULES = /* @__PURE__ */ new Set(["missing-required-section", "required-section-underlinked"]);
function baselineKey(f) {
  const file = f.file ?? "";
  if (MARKER_INDEPENDENT_RULES.has(f.rule)) {
    return `${f.rule}|${file}|${kindOfRelPath(file) ?? ""}`;
  }
  return `${f.rule}|${file}|${f.message}`;
}
function gatherSupersededCitations(g) {
  const sup = /* @__PURE__ */ new Map();
  for (const adr of pagesOfKind(g, ["adr"])) {
    const s = String(adr.frontmatter.status ?? "").toLowerCase();
    if (s === "superseded" || s === "deprecated") sup.set(adr.basename, s);
  }
  const out = [];
  for (const p of g.pages) {
    const kind = kindOfPage(p);
    if (kind === "adr" || kind === "iteration") continue;
    if (STRUCTURAL.has(p.basename)) continue;
    for (const l of p.links) {
      const st = sup.get(l.target);
      if (st) {
        out.push({ citingFile: p.relPath, citingKind: kind, targetAdr: l.target, targetStatus: st });
      }
    }
  }
  return out.sort(
    (a, b) => a.citingFile.localeCompare(b.citingFile) || a.targetAdr.localeCompare(b.targetAdr)
  );
}
function sortFindings(findings) {
  return [...findings].sort(
    (a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || a.rule.localeCompare(b.rule) || (a.file ?? "").localeCompare(b.file ?? "") || a.message.localeCompare(b.message)
  );
}

// src/application/usecases/LintWiki.ts
async function lintWiki(repo, opts = {}) {
  const [pages, allFilesList, baselineList] = await Promise.all([
    repo.loadPages(),
    repo.listFiles(),
    repo.readLintBaseline()
  ]);
  const graph = buildGraph(pages);
  const requiredSections = /* @__PURE__ */ new Map();
  if (opts.config) {
    for (const kind of Object.keys(ARTIFACT_SPECS)) {
      const rs = opts.config.requiredSections(kind);
      if (rs.length) requiredSections.set(kind, rs);
    }
  }
  let findings = runLint(graph, { allFiles: new Set(allFilesList), requiredSections });
  if (baselineList.length) {
    const baseline = new Set(baselineList);
    findings = findings.filter((f) => !baseline.has(baselineKey(f)));
  }
  if (opts.changed && opts.changed.length) {
    const set = new Set(opts.changed);
    findings = findings.filter((f) => f.file != null && set.has(f.file));
  }
  if (opts.severity) {
    const min = SEVERITY_RANK[opts.severity];
    findings = findings.filter((f) => SEVERITY_RANK[f.severity] >= min);
  }
  const counts = { high: 0, medium: 0, low: 0 };
  for (const f of findings) counts[f.severity] += 1;
  return { findings, counts, supersededCitations: gatherSupersededCitations(graph) };
}

// src/domain/services/C4Consistency.ts
var WIKI_C4_KINDS = ["entity"];
function lastSegment(id) {
  const i = id.lastIndexOf(".");
  return i >= 0 ? id.slice(i + 1) : id;
}
function norm(s) {
  return slugify(s);
}
function explicitC4(page) {
  const v = page.frontmatter.c4;
  if (v === false || v === "none" || v === "false") return "opt-out";
  if (typeof v === "string" && v.trim()) return v.trim();
  return null;
}
function checkC4Consistency(model, g, policy) {
  const findings = [];
  const ignore = new Set(policy.ignore);
  const required = new Set(policy.requireDocumentation.map((k) => k.toLowerCase()));
  const entities = pagesOfKind(g, WIKI_C4_KINDS);
  const byExplicit = /* @__PURE__ */ new Map();
  const byName = /* @__PURE__ */ new Map();
  for (const p of entities) {
    const ex = explicitC4(p);
    if (typeof ex === "string") byExplicit.set(ex, p);
    byName.set(norm(p.basename), p);
  }
  const matchElement = (el) => {
    const ex = byExplicit.get(el.id) ?? byExplicit.get(lastSegment(el.id));
    if (ex) return ex;
    return byName.get(norm(el.title)) ?? byName.get(norm(lastSegment(el.id))) ?? null;
  };
  const sortedElements = [...model.elements].sort((a, b) => a.id.localeCompare(b.id));
  const matchedBasenames = /* @__PURE__ */ new Set();
  const elementMatch = /* @__PURE__ */ new Map();
  for (const el of sortedElements) {
    const m = matchElement(el);
    elementMatch.set(el.id, m);
    if (m) matchedBasenames.add(m.basename);
  }
  for (const el of sortedElements) {
    if (!required.has(el.kind.toLowerCase())) continue;
    if (ignore.has(el.id)) continue;
    if (!elementMatch.get(el.id)) {
      findings.push({
        rule: "c4-element-without-wiki-entity",
        severity: policy.severity,
        message: `C4 ${el.kind} "${el.id}" has no wiki entity`
      });
    }
  }
  for (const p of entities) {
    if (ignore.has(p.basename)) continue;
    if (explicitC4(p) === "opt-out") continue;
    if (matchedBasenames.has(p.basename)) continue;
    findings.push({
      rule: "wiki-entity-without-c4-element",
      severity: policy.severity,
      file: p.relPath,
      message: `entity ${p.basename} has no matching C4 element`
    });
  }
  return sortFindings(findings.filter((f) => !ignore.has(f.rule)));
}

// src/application/usecases/ValidateC4.ts
var C4_BASELINE_FILE = ".arch-wiki/c4-baseline.json";
async function validateC4(model, repo, opts) {
  const graph = buildGraph(await repo.loadPages());
  const entityCount = pagesOfKind(graph, ["entity"]).length;
  const all = checkC4Consistency(model, graph, opts.policy);
  if (opts.establishBaseline) {
    const keys = [...new Set(all.map(baselineKey))].sort();
    await repo.write(C4_BASELINE_FILE, `${JSON.stringify(keys, null, 2)}
`);
    return {
      findings: [],
      counts: { high: 0, medium: 0, low: 0 },
      elementCount: model.elements.length,
      entityCount,
      baselineEstablished: keys.length
    };
  }
  const baselineList = await repo.readC4Baseline();
  let findings = all;
  if (baselineList.length) {
    const baseline = new Set(baselineList);
    findings = findings.filter((f) => !baseline.has(baselineKey(f)));
  }
  if (opts.severity) {
    const min = SEVERITY_RANK[opts.severity];
    findings = findings.filter((f) => SEVERITY_RANK[f.severity] >= min);
  }
  const counts = { high: 0, medium: 0, low: 0 };
  for (const f of findings) counts[f.severity] += 1;
  return { findings, counts, elementCount: model.elements.length, entityCount };
}

// src/adapters/c4/LikeC4ModelReader.ts
function lastSegment2(id) {
  const i = id.lastIndexOf(".");
  return i >= 0 ? id.slice(i + 1) : id;
}
function asRecord(v) {
  return v && typeof v === "object" && !Array.isArray(v) ? v : null;
}
function pickElements(root) {
  if (root.elements !== void 0) return root.elements;
  const model = asRecord(root.model);
  if (model?.elements !== void 0) return model.elements;
  const project = asRecord(root.project);
  if (project?.elements !== void 0) return project.elements;
  return void 0;
}
function toElement(raw, key) {
  const id = String(raw.id ?? key ?? "");
  const title = String(raw.title ?? raw.name ?? lastSegment2(id) ?? "");
  const tags = Array.isArray(raw.tags) ? raw.tags.map(String) : void 0;
  return { id, kind: String(raw.kind ?? ""), title, tags };
}
function normalizeC4ModelJson(raw) {
  const root = asRecord(raw);
  if (!root) return { elements: [] };
  const container = pickElements(root);
  const elements = [];
  if (Array.isArray(container)) {
    for (const e of container) {
      const rec = asRecord(e);
      if (rec) elements.push(toElement(rec, void 0));
    }
  } else {
    const map = asRecord(container);
    if (map) for (const [key, e] of Object.entries(map)) {
      const rec = asRecord(e);
      if (rec) elements.push(toElement(rec, key));
    }
  }
  return { elements: elements.filter((e) => e.id !== "" && e.kind !== "") };
}
function parseC4Sources(text) {
  const elements = [];
  const seen = /* @__PURE__ */ new Set();
  const push = (id, kind, title) => {
    if (!id || !kind || seen.has(id)) return;
    seen.add(id);
    elements.push({ id, kind, title: (title ?? id).trim() });
  };
  const src = text.replace(/\/\/[^\n]*/g, "").replace(/\/\*[\s\S]*?\*\//g, "");
  const assign = /(^|[\s{])([A-Za-z_]\w*)\s*=\s*([A-Za-z_]\w*)\s*(?:'([^']*)'|"([^"]*)")?/g;
  for (let m; m = assign.exec(src); ) push(m[2], m[3], m[4] ?? m[5]);
  const decl = /(^|[\s{])([A-Za-z_]\w*)\s+([A-Za-z_]\w*)\s*(?:'([^']*)'|"([^"]*)")/g;
  for (let m; m = decl.exec(src); ) push(m[3], m[2], m[4] ?? m[5]);
  return { elements: elements.sort((a, b) => a.id.localeCompare(b.id)) };
}

// src/application/usecases/RecordRisk.ts
var RISK_FILE = "risks.md";
var HEADER_MARK = "| Key |";
var TABLE_HEADER = "| Key | Date | Source | Related | Description | Status |\n| --- | --- | --- | --- | --- | --- |\n";
var SCAFFOLD = "---\ntype: risk-register\ntags: [risks]\n---\n\n# Risks & Contradictions\n\nMaintained by `arch-wiki record-risk` \u2014 one row per detected risk or\ncontradiction, keyed by a content hash so re-recording is idempotent.\n\n" + TABLE_HEADER;
function cell(value) {
  return value.replace(/\r?\n/g, " ").replace(/\|/g, "\\|").trim();
}
async function recordRisk(input, deps) {
  const { repo, hash } = deps;
  const source = input.source.trim();
  const conflict = input.conflict.trim();
  if (!source) throw new DomainError("record-risk: missing source", 1);
  if (!conflict) throw new DomainError("record-risk: missing conflict", 1);
  const id = (input.id ?? "").trim();
  const key = hash(`${source}\0${id}\0${conflict}`).slice(0, 12);
  const row = `| ${key} | ${input.date} | ${cell(source)} | ${cell(id) || "\u2014"} | ${cell(conflict)} | open |`;
  const exists = await repo.exists(RISK_FILE);
  if (!exists) {
    await repo.write(RISK_FILE, `${SCAFFOLD}${row}
`);
    return { key, created: true, path: RISK_FILE };
  }
  const cur = await repo.read(RISK_FILE);
  if (cur.includes(`| ${key} |`)) {
    return { key, created: false, path: RISK_FILE };
  }
  const base = cur.length === 0 || cur.endsWith("\n") ? cur : `${cur}
`;
  const next = cur.includes(HEADER_MARK) ? `${base}${row}
` : `${base}
${TABLE_HEADER}${row}
`;
  await repo.write(RISK_FILE, next);
  return { key, created: true, path: RISK_FILE };
}

// src/application/usecases/UpdateUtilityTree.ts
var FILE = "utility-tree.md";
var HEADER2 = "| Driver | Scenario | Priority |\n| --- | --- | --- |\n";
var SPEC2 = {
  headerMark: "| Driver |",
  header: HEADER2,
  scaffold: "---\ntype: utility-tree\ntags: [utility-tree]\n---\n\n# Utility Tree\n\nQAW output. Maintained by `arch-wiki update-utility-tree` \u2014 one row per\nquality-attribute driver, keyed by id.\n\n" + HEADER2
};
function cell2(value) {
  return value.replace(/\r?\n/g, " ").replace(/\|/g, "\\|").trim();
}
async function updateUtilityTree(input, deps) {
  const { repo } = deps;
  const from = input.from.trim();
  if (!from) throw new DomainError("update-utility-tree: missing --from", 1);
  const exists = await repo.exists(FILE);
  const content = exists ? await repo.read(FILE) : null;
  const keyLine = `[[${from}]]`;
  const row = `| [[${from}]] | ${cell2(input.scenario ?? "") || "\u2014"} | ${cell2(input.priority ?? "") || "\u2014"} |`;
  const r = upsertKeyedRow(content, keyLine, row, SPEC2);
  if (r.changed) await repo.write(FILE, r.content);
  return { path: FILE, created: !exists, changed: r.changed };
}

// src/domain/services/ManagedRegion.ts
function between(start, end, body) {
  return body ? `${start}
${body}
${end}` : `${start}
${end}`;
}
function anchorIndex(lines) {
  const h1 = lines.findIndex((l) => /^#\s/.test(l));
  if (h1 >= 0) return h1 + 1;
  if (lines[0] === "---") {
    const close = lines.indexOf("---", 1);
    if (close >= 0) return close + 1;
  }
  return 0;
}
function replaceManagedRegion(content, startMark, endMark, body, newFileScaffold) {
  const region = between(startMark, endMark, body);
  if (content == null) {
    const sep2 = newFileScaffold.endsWith("\n") ? "" : "\n";
    return `${newFileScaffold}${sep2}${region}
`;
  }
  const s = content.indexOf(startMark);
  const e = content.indexOf(endMark);
  if (s >= 0 && e >= 0 && e > s) {
    return `${content.slice(0, s)}${region}${content.slice(e + endMark.length)}`;
  }
  const lines = content.split("\n");
  lines.splice(anchorIndex(lines), 0, "", region, "");
  const out = lines.join("\n");
  return out.endsWith("\n") ? out : `${out}
`;
}

// src/application/usecases/UpdateGapAnalysis.ts
var FILE2 = "gap-analysis.md";
var START2 = "<!-- arch-wiki:gaps:start -->";
var END2 = "<!-- arch-wiki:gaps:end -->";
var SCAFFOLD2 = "---\ntype: gap-analysis\ntags: [gap-analysis]\n---\n\n# Gap Analysis\n\nOpen gaps below are regenerated by `arch-wiki update-gap-analysis` between the\nmarkers. Notes outside the managed region are preserved.\n\n";
async function updateGapAnalysis(input, deps) {
  const { repo } = deps;
  const sorted = [...input.gaps].sort((a, b) => a.driver.localeCompare(b.driver));
  const body = sorted.map((g) => `- [[${g.driver}]] \u2014 ${g.reason}`).join("\n");
  const exists = await repo.exists(FILE2);
  const content = exists ? await repo.read(FILE2) : null;
  const next = replaceManagedRegion(content, START2, END2, body, SCAFFOLD2);
  await repo.write(FILE2, next);
  return { path: FILE2, created: !exists, gapCount: sorted.length };
}

// src/application/usecases/DriverAssurance.ts
async function reportDriverAssurance(deps) {
  const [pages, issues] = await Promise.all([deps.repo.loadPages(), deps.ledger.readIssues()]);
  const g = buildGraph(pages);
  const drivers = computeAssurance(g, { ledgerIssueKeys: new Set(issues.map((r) => r.key)) });
  return { drivers, summary: summarizeAssurance(drivers) };
}

// src/domain/services/EpistemicDebt.ts
function gatherEpistemicDebt(g, ctx) {
  const rows = [];
  for (const c of gatherSupersededCitations(g)) {
    rows.push({
      kind: "superseded-citation",
      subject: c.citingFile.replace(/^.*\//, "").replace(/\.md$/, ""),
      detail: `cites ${c.targetStatus} ADR [[${c.targetAdr}]]`
    });
  }
  for (const a of computeAssurance(g, { ledgerIssueKeys: ctx.ledgerIssueKeys })) {
    if (a.level === "L0" && a.nonLiveCoverers.length > 0) {
      rows.push({
        kind: "paper-coverage",
        subject: a.driver,
        detail: `covered only by non-accepted ADR(s): ${a.nonLiveCoverers.join(", ")}`
      });
    }
  }
  for (const p of g.pages) {
    const rb = p.frontmatter.realized_by;
    if (!Array.isArray(rb)) continue;
    for (const k of [...new Set(rb.map(String))].sort()) {
      if (!ctx.ledgerIssueKeys.has(k)) {
        rows.push({
          kind: "stale-issue",
          subject: p.basename,
          detail: `realized_by ${k} has no ledger row (stale trace)`
        });
      }
    }
  }
  for (const p of g.pages) {
    const src = p.frontmatter.source;
    if (typeof src === "string" && src && !ctx.fileSet.has(src)) {
      rows.push({
        kind: "missing-source",
        subject: p.basename,
        detail: `source \`${src}\` no longer exists on disk`
      });
    }
  }
  const seen = /* @__PURE__ */ new Set();
  const deduped = rows.filter((r) => {
    const key = `${r.kind}|${r.subject}|${r.detail}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return deduped.sort(
    (a, b) => a.kind.localeCompare(b.kind) || a.subject.localeCompare(b.subject) || a.detail.localeCompare(b.detail)
  );
}

// src/application/usecases/UpdateEpistemicDebt.ts
var FILE3 = "epistemic-debt.md";
var START3 = "<!-- arch-wiki:debt:start -->";
var END3 = "<!-- arch-wiki:debt:end -->";
var SCAFFOLD3 = "---\ntype: epistemic-debt\ntags: [epistemic-debt]\n---\n\n# Epistemic Debt\n\nDecay signals below are regenerated by `arch-wiki update-epistemic-debt` between\nthe markers (FPF B.3.4 \u2014 evidence is perishable). Notes outside the managed region\nare preserved. This is an internal health register (excluded from the Confluence mirror).\n\n";
var LABEL2 = {
  "superseded-citation": "Superseded citation",
  "paper-coverage": "Paper coverage",
  "stale-issue": "Stale issue",
  "missing-source": "Missing source"
};
async function updateEpistemicDebt(deps) {
  const { repo, ledger } = deps;
  const [pages, files, issues] = await Promise.all([
    repo.loadPages(),
    repo.listFiles(),
    ledger.readIssues()
  ]);
  const g = buildGraph(pages);
  const rows = gatherEpistemicDebt(g, {
    ledgerIssueKeys: new Set(issues.map((r) => r.key)),
    fileSet: new Set(files)
  });
  const body = rows.map((r) => `- **${LABEL2[r.kind]}** \xB7 [[${r.subject}]] \u2014 ${r.detail}`).join("\n");
  const exists = await repo.exists(FILE3);
  const content = exists ? await repo.read(FILE3) : null;
  const next = replaceManagedRegion(content, START3, END3, body, SCAFFOLD3);
  await repo.write(FILE3, next);
  const byKind = {};
  for (const r of rows) byKind[r.kind] = (byKind[r.kind] ?? 0) + 1;
  return { path: FILE3, created: !exists, debtCount: rows.length, byKind };
}

// src/application/usecases/SyncTemplates.ts
var FOAM_DIR = ".foam/templates";
var MARKER_RE = /<!-- arch-wiki:template sha256=([0-9a-f]+) -->/;
function managed(body, bodyHash) {
  return `${body.replace(/\s+$/, "")}

<!-- arch-wiki:template sha256=${bodyHash} -->
`;
}
async function syncTemplates(input, deps) {
  const { templates, repo, hash } = deps;
  const entries = [];
  const wrote = [];
  for (const { name, body } of await templates.listAll()) {
    const bodyHash = hash(body);
    const rel = `${FOAM_DIR}/${name}`;
    let status;
    let cur = "";
    if (!await repo.exists(rel)) {
      status = "missing";
    } else {
      cur = await repo.read(rel);
      const m = MARKER_RE.exec(cur);
      if (m && m[1] === bodyHash) status = "synced";
      else if (m) status = "stale";
      else status = "curated";
    }
    const entry = { name, status, wrote: false };
    if (input.write && (status === "missing" || status === "stale")) {
      if (status === "stale") {
        const bak = `${rel}.bak`;
        await repo.write(bak, cur);
        entry.backedUp = bak;
      }
      await repo.write(rel, managed(body, bodyHash));
      entry.wrote = true;
      wrote.push(rel);
    }
    entries.push(entry);
  }
  const counts = { synced: 0, missing: 0, stale: 0, curated: 0 };
  for (const e of entries) counts[e.status]++;
  const actionable = counts.missing + counts.stale;
  return { entries, counts, actionable, drift: actionable > 0, wrote };
}

// src/migrations/0001-introduce-version-marker/up.ts
var TEMPLATES_DIR = ".foam/templates";
var migration0001 = {
  from: 0,
  to: 1,
  description: "introduce .arch-wiki marker; snapshot templates + lint baseline (adopt existing wiki)",
  async up(ctx) {
    const log = [];
    const snapshot = {};
    for (const name of (await ctx.fs.list(ctx.abs(TEMPLATES_DIR))).sort()) {
      if (!name.endsWith(".md")) continue;
      const content = await ctx.fs.readFile(ctx.abs(`${TEMPLATES_DIR}/${name}`));
      snapshot[name] = ctx.hash(content);
    }
    await ctx.fs.writeFile(
      ctx.abs(".arch-wiki/template-snapshot.json"),
      `${JSON.stringify(snapshot, null, 2)}
`
    );
    log.push(`snapshotted ${Object.keys(snapshot).length} curated template(s)`);
    const baseline = (await ctx.lint()).map(baselineKey).sort();
    await ctx.fs.writeFile(
      ctx.abs(".arch-wiki/lint-baseline.json"),
      `${JSON.stringify(baseline, null, 2)}
`
    );
    log.push(`recorded lint baseline: ${baseline.length} pre-existing finding(s)`);
    return log;
  }
};

// src/migrations/0002-introduce-project-config/up.ts
var CONFIG = ".arch-wiki/config.json";
var STUB = `${JSON.stringify(
  {
    _doc: "arch-wiki project profile, read deterministically by the CLI. Human contract: ../CLAUDE.md. Fill c4 / tasks / requiredSections / integrations to override; absence = agnostic defaults."
  },
  null,
  2
)}
`;
var migration0002 = {
  from: 1,
  to: 2,
  description: "introduce .arch-wiki/config.json project profile (empty behavior-preserving stub)",
  async up(ctx) {
    const log = [];
    const p = ctx.abs(CONFIG);
    if (await ctx.fs.exists(p)) {
      log.push("config.json already present, skipped");
      return log;
    }
    await ctx.fs.writeFile(p, STUB);
    log.push("seeded empty project profile (.arch-wiki/config.json); fill it to override agnostic defaults");
    return log;
  }
};

// src/migrations/registry.ts
var CURRENT_SCHEMA_VERSION = 2;
var MIGRATIONS = [migration0001, migration0002];

// src/application/usecases/Migrate.ts
function planMigration(current, target, registry = MIGRATIONS) {
  if (target < current) {
    throw new DomainError(`cannot migrate down (schema v${current} \u2192 v${target})`, 1);
  }
  const chain = [];
  let at = current;
  while (at < target) {
    const next = registry.find((m) => m.from === at);
    if (!next) throw new DomainError(`no migration from schema v${at}`, 4);
    chain.push(next);
    at = next.to;
  }
  return chain;
}
async function applyMigration(store, ctx, opts) {
  const marker = await store.read();
  const current = marker?.schemaVersion ?? 0;
  const target = opts.to ?? CURRENT_SCHEMA_VERSION;
  const chain = planMigration(current, target);
  const pending = chain.map((m) => ({ from: m.from, to: m.to, description: m.description }));
  const applied = [];
  if (!opts.dryRun) {
    for (const m of chain) {
      const log = await m.up(ctx);
      await store.write({
        schemaVersion: m.to,
        pluginVersion: opts.pluginVersion,
        lastMigratedAt: ctx.now().toISOString()
      });
      applied.push({ to: m.to, description: m.description, log });
    }
  }
  return { from: current, to: target, pending, applied };
}

// src/domain/services/SemVer.ts
function parseSemver(v) {
  const m = /^(\d+)\.(\d+)\.(\d+)/.exec(v.trim());
  return m ? [Number(m[1]), Number(m[2]), Number(m[3])] : null;
}
function isNewerVersion(candidate, current) {
  const a = parseSemver(candidate);
  const b = parseSemver(current);
  if (!a || !b) return false;
  for (let i = 0; i < 3; i++) {
    if (a[i] !== b[i]) return a[i] > b[i];
  }
  return false;
}

// src/cli/version.ts
var PLUGIN_VERSION = "0.9.0";

// src/cli/main.ts
var WIKI_MARKER = "docs/architecture/";
function readStdin() {
  return new Promise((resolve2) => {
    if (process.stdin.isTTY) {
      resolve2("");
      return;
    }
    let data = "";
    process.stdin.setEncoding("utf8");
    process.stdin.on("data", (c) => data += c);
    process.stdin.on("end", () => resolve2(data));
  });
}
function hookFilePath(stdinJson) {
  try {
    return JSON.parse(stdinJson)?.tool_input?.file_path ?? "";
  } catch {
    return "";
  }
}
function migrationContext(opts) {
  const root = wikiRoot(opts);
  const fs2 = new NodeFileSystem();
  const repo = new FoamWikiRepository(root, fs2);
  const clock = new SystemClock();
  return {
    abs: (relPath) => path8.join(root, relPath),
    fs: fs2,
    // Baseline must be computed with the SAME required-sections the runtime lint
    // uses, or suppression keys won't match (plan §3.7 fix #8).
    lint: async () => (await lintWiki(repo, { config: await loadProjectConfig(opts) })).findings,
    hash: (content) => (0, import_node_crypto.createHash)("sha256").update(content).digest("hex"),
    now: () => clock.now()
  };
}
function csv(value) {
  return value ? String(value).split(",").map((s) => s.trim()).filter(Boolean) : [];
}
function sha256(content) {
  return (0, import_node_crypto.createHash)("sha256").update(content).digest("hex");
}
function positiveIntFlag(name, value) {
  const s = String(value).trim();
  const n = Number(s);
  if (!/^\d+$/.test(s) || !Number.isSafeInteger(n) || n < 1) {
    throw new DomainError(`${name} must be a positive integer, got "${String(value)}"`, 1);
  }
  return n;
}
async function readPlanPages(fs2, planArg, cwd) {
  const planText = await fs2.readFile(path8.isAbsolute(planArg) ? planArg : path8.join(cwd, planArg));
  let parsed;
  try {
    parsed = JSON.parse(planText);
  } catch (e) {
    throw new DomainError(`malformed plan JSON: ${e.message}`, 2);
  }
  const env = parsed;
  const pages = env.data?.pages ?? env.pages;
  if (!Array.isArray(pages)) throw new DomainError("plan has no data.pages[]", 2);
  return pages;
}
function pluginRoot() {
  return process.env.ARCH_WIKI_PLUGIN_ROOT ?? path8.resolve(__dirname, "..");
}
function templatesDir() {
  return process.env.ARCH_WIKI_TEMPLATES_DIR ?? path8.join(pluginRoot(), "templates");
}
async function newerInstalledVersion(fs2) {
  try {
    let dir = pluginRoot();
    for (let i = 0; i < 8; i++) {
      const candidate = path8.join(dir, "installed_plugins.json");
      if (await fs2.exists(candidate)) {
        const json = JSON.parse(await fs2.readFile(candidate));
        for (const [key, entries] of Object.entries(json.plugins ?? {})) {
          if (!/^arch-wiki@/.test(key)) continue;
          for (const e of entries ?? []) {
            if (e?.version && isNewerVersion(e.version, PLUGIN_VERSION)) return e.version;
          }
        }
        return null;
      }
      const parent = path8.dirname(dir);
      if (parent === dir) break;
      dir = parent;
    }
  } catch {
  }
  return null;
}
function staleBinaryWarning(newer) {
  return newer ? [
    `a newer arch-wiki (${newer}) is installed but this PATH binary is ${PLUGIN_VERSION} \u2014 restart the Claude Code session (the binary + MCP registry resolve at session start), or call the new version by full path`
  ] : void 0;
}
function payloadsDir() {
  return path8.join(templatesDir(), "payloads");
}
function wikiRoot(opts) {
  const cwd = opts.cwd ?? process.cwd();
  const root = opts.root ?? "docs/architecture";
  return path8.isAbsolute(root) ? root : path8.join(cwd, root);
}
async function loadProjectConfig(opts) {
  const store = new FileProjectConfigStore(wikiRoot(opts), new NodeFileSystem());
  return ProjectConfig.from(await store.read());
}
async function assertWikiRootExists(opts) {
  const root = wikiRoot(opts);
  if (!await new NodeFileSystem().exists(root)) {
    throw new DomainError(
      `wiki root "${root}" does not exist \u2014 run from the repo root, or pass --cwd <repo> / --root <dir>. If you are inside docs/architecture, cd up to the repo root (the default --root re-appends docs/architecture).`,
      1
    );
  }
}
function emit(env) {
  process.stdout.write(`${JSON.stringify(env)}
`);
}
function fail(command, err) {
  const message = err instanceof Error ? err.message : String(err);
  const code = err instanceof DomainError ? err.exitCode : 3;
  process.stderr.write(`${JSON.stringify({ ok: false, command, errors: [message] })}
`);
  process.exit(code);
}
async function main() {
  const cli = cac("arch-wiki");
  cli.option("--cwd <dir>", "target repo root (default: process.cwd())");
  cli.option("--root <dir>", "wiki root relative to cwd", { default: "docs/architecture" });
  cli.command("next-id <type>", "allocate the next id for an artifact type").action(async (type, opts) => {
    try {
      const spec = resolveKind(type);
      const repo = new FoamWikiRepository(wikiRoot(opts), new NodeFileSystem());
      const id = await allocateNextId(spec, repo);
      emit({ ok: true, command: "next-id", data: { id: id.toString() } });
    } catch (err) {
      fail("next-id", err);
    }
  });
  cli.command("scaffold <type>", "scaffold a new artifact from its template").option("--title <title>", "artifact title").option("--slug <slug>", "explicit kebab slug (for non-latin titles)").option("--drivers <ids>", "comma-separated driver ids to wire").option("--dry-run", "compute and validate without writing").action(async (type, opts) => {
    try {
      const spec = resolveKind(type);
      if (!opts.title) throw new DomainError("missing --title", 1);
      const fs2 = new NodeFileSystem();
      const repo = new FoamWikiRepository(wikiRoot(opts), fs2);
      const templates = new PluginTemplateStore(templatesDir(), fs2);
      const drivers = opts.drivers ? String(opts.drivers).split(",").map((s) => s.trim()).filter(Boolean) : [];
      const config = await loadProjectConfig(opts);
      const result = await scaffoldArtifact(
        { spec, title: String(opts.title), slug: opts.slug, drivers, dryRun: !!opts.dryRun },
        { repo, templates, clock: new SystemClock(), config, frontmatter: new GrayMatterParser() }
      );
      emit({ ok: true, command: "scaffold", data: result, warnings: result.warnings });
    } catch (err) {
      fail("scaffold", err);
    }
  });
  cli.command("hypothesis", "scaffold a hypothesis (concept) with traceability + a kanban card").option("--title <title>", "hypothesis title").option("--slug <slug>", "explicit kebab slug (for non-latin titles)").option("--from <path>", "originating raw/<file> back-reference (must exist)").option("--driver-candidate <id>", "forward-ref driver candidate (placeholder)").option("--dry-run", "compute and validate without writing").action(async (opts) => {
    try {
      if (!opts.title) throw new DomainError("missing --title", 1);
      const fs2 = new NodeFileSystem();
      const repo = new FoamWikiRepository(wikiRoot(opts), fs2);
      const templates = new PluginTemplateStore(templatesDir(), fs2);
      const config = await loadProjectConfig(opts);
      const result = await scaffoldHypothesis(
        {
          title: String(opts.title),
          slug: opts.slug,
          from: opts.from != null ? String(opts.from) : void 0,
          driverCandidate: opts["driverCandidate"] != null ? String(opts["driverCandidate"]) : void 0,
          dryRun: !!opts.dryRun
        },
        { repo, templates, clock: new SystemClock(), config, frontmatter: new GrayMatterParser() }
      );
      emit({ ok: true, command: "hypothesis", data: result, warnings: result.warnings });
    } catch (err) {
      fail("hypothesis", err);
    }
  });
  cli.command("questionnaire <method>", "scaffold a qaw|rozanski|driver-gap questionnaire skeleton").option("--topic <topic>", "questionnaire topic").option("--slug <slug>", "explicit kebab slug (for non-latin topics)").option("--related-drivers <ids>", "comma-separated driver ids this relates to").option("--dry-run", "compute and validate without writing").action(async (method, opts) => {
    try {
      if (!opts.topic) throw new DomainError("missing --topic", 1);
      const fs2 = new NodeFileSystem();
      const repo = new FoamWikiRepository(wikiRoot(opts), fs2);
      const payloads = new FilePayloadTemplateStore(payloadsDir(), fs2);
      const result = await scaffoldQuestionnaire(
        {
          method,
          topic: String(opts.topic),
          slug: opts.slug,
          relatedDrivers: opts["relatedDrivers"] ? csv(opts["relatedDrivers"]) : void 0,
          dryRun: !!opts.dryRun
        },
        { repo, payloads, clock: new SystemClock(), frontmatter: new GrayMatterParser() }
      );
      emit({ ok: true, command: "questionnaire", data: result, warnings: result.warnings });
    } catch (err) {
      fail("questionnaire", err);
    }
  });
  cli.command("render-issue", "render a deterministic issue payload (IntentEnvelope) from a driver/ADR").option("--from <id>", "source artifact id (e.g. QA-007)").option("--kind <kind>", "arch|techdesign").option("--role <role>", "be|fe|do (required for techdesign)").action(async (opts) => {
    try {
      if (!opts.from) throw new DomainError("missing --from", 1);
      if (!opts.kind) throw new DomainError("missing --kind", 1);
      const fs2 = new NodeFileSystem();
      const root = wikiRoot(opts);
      const repo = new FoamWikiRepository(root, fs2);
      const payloads = new FilePayloadTemplateStore(payloadsDir(), fs2);
      const result = await renderIssuePayload(
        { from: String(opts.from), kind: opts.kind, role: opts.role },
        { repo, payloads, config: await loadProjectConfig(opts), ledger: new FileLedgerStore(root, fs2), hash: sha256 }
      );
      emit({ ok: true, command: "render-issue", data: result, warnings: result.warnings });
    } catch (err) {
      fail("render-issue", err);
    }
  });
  cli.command("record-issue", "record a created issue in the ledger + driver frontmatter (two-way trace)").option("--id <id>", "source artifact id (e.g. QA-007)").option("--key <key>", "external issue key (e.g. GRM-431)").option("--kind <kind>", "arch|techdesign").option("--role <role>", "be|fe|do (required for techdesign)").option("--hash <hash>", "content hash from render-issue").option("--system <system>", "external system (default jira)").action(async (opts) => {
    try {
      if (!opts.id) throw new DomainError("missing --id", 1);
      if (!opts.key) throw new DomainError("missing --key", 1);
      if (!opts.kind) throw new DomainError("missing --kind", 1);
      if (!opts.hash) throw new DomainError("missing --hash", 1);
      const fs2 = new NodeFileSystem();
      const root = wikiRoot(opts);
      const repo = new FoamWikiRepository(root, fs2);
      const result = await recordIssue(
        {
          id: String(opts.id),
          key: String(opts.key),
          kind: opts.kind,
          role: opts.role,
          hash: String(opts.hash),
          system: opts.system != null ? String(opts.system) : void 0
        },
        { repo, ledger: new FileLedgerStore(root, fs2), frontmatter: new GrayMatterParser(), clock: new SystemClock() }
      );
      emit({ ok: true, command: "record-issue", data: result });
    } catch (err) {
      fail("record-issue", err);
    }
  });
  cli.command("ingest-questionnaire", "parse an answered questionnaire into a traceability report").option("--from <path>", "raw/questionnaires/<file> to parse").action(async (opts) => {
    try {
      if (!opts.from) throw new DomainError("missing --from", 1);
      const repo = new FoamWikiRepository(wikiRoot(opts), new NodeFileSystem());
      const result = await parseQuestionnaire({ from: String(opts.from) }, { repo });
      emit({ ok: true, command: "ingest-questionnaire", data: result });
    } catch (err) {
      fail("ingest-questionnaire", err);
    }
  });
  cli.command("books-plan <site>", "render a deterministic books-rag query plan (local-rag)").option("--topic <topic>", "topic (hypothesis | questionnaire-rozanski)").option("--drivers <ids>", "comma-separated driver ids (enrich)").option("--kind-hints <kinds>", "comma-separated kind hints (hypothesis)").option("--viewpoints <names>", "comma-separated viewpoints (questionnaire-rozanski)").action(async (site, opts) => {
    try {
      let input;
      if (site === "hypothesis") {
        if (!opts.topic) throw new DomainError("missing --topic", 1);
        input = { site, topic: String(opts.topic), kindHints: opts["kindHints"] ? csv(opts["kindHints"]) : void 0 };
      } else if (site === "questionnaire-rozanski") {
        if (!opts.topic) throw new DomainError("missing --topic", 1);
        input = { site, topic: String(opts.topic), viewpoints: opts.viewpoints ? csv(opts.viewpoints) : void 0 };
      } else if (site === "enrich") {
        if (!opts.drivers) throw new DomainError("missing --drivers", 1);
        input = { site, drivers: csv(opts.drivers) };
      } else {
        throw new DomainError(`unknown books-plan site "${site}" (valid: hypothesis, questionnaire-rozanski, enrich)`, 1);
      }
      emit({ ok: true, command: "books-plan", data: new BooksRagPlanner().renderPlan(input) });
    } catch (err) {
      fail("books-plan", err);
    }
  });
  cli.command("ingest", "ingest helper: --enrich writes ## Related Patterns from books-rag answers").option("--enrich", "enrich drivers with Related Patterns").option("--rag-results <json>", "BooksAnswer[] JSON from local-rag (keyed enrich:<id>)").action(async (opts) => {
    try {
      if (!opts.enrich) throw new DomainError("ingest: only --enrich is supported as a CLI step", 1);
      if (!opts["ragResults"]) throw new DomainError("ingest --enrich: missing --rag-results", 2);
      let answers;
      try {
        const parsed = JSON.parse(String(opts["ragResults"]));
        if (!Array.isArray(parsed)) throw new Error("not an array");
        answers = parsed;
      } catch (e) {
        throw new DomainError(`ingest --enrich: malformed --rag-results: ${e.message}`, 2);
      }
      const repo = new FoamWikiRepository(wikiRoot(opts), new NodeFileSystem());
      const result = await enrichDriver({ answers }, { repo });
      emit({ ok: true, command: "ingest", data: result });
    } catch (err) {
      fail("ingest", err);
    }
  });
  cli.command("trace <id>", "walk raw \u2192 driver \u2192 ADR \u2192 issue \u2192 showcase for an artifact").action(async (id, opts) => {
    try {
      const fs2 = new NodeFileSystem();
      const root = wikiRoot(opts);
      const repo = new FoamWikiRepository(root, fs2);
      const result = await trace(id, { repo, ledger: new FileLedgerStore(root, fs2) });
      emit({ ok: true, command: "trace", data: result });
    } catch (err) {
      fail("trace", err);
    }
  });
  cli.command("pull-stories", "render the deterministic plan to pull the PO User Story Log (CAP-1)").option("--plan", "emit the enumeration plan (cloudId/rootPageId/alreadyPulled) \u2014 default").action(async (opts) => {
    try {
      const fs2 = new NodeFileSystem();
      const plan = await renderStoryPullPlan({
        config: await loadProjectConfig(opts),
        ledger: new FileLedgerStore(wikiRoot(opts), fs2)
      });
      emit({ ok: true, command: "pull-stories", data: plan });
    } catch (err) {
      fail("pull-stories", err);
    }
  });
  cli.command("record-story", "write a READ-ONLY User Story snapshot into raw/_synced (body via stdin)").option("--page <id>", "upstream Confluence page id").option("--title <title>", "story title").option("--page-version <n>", "upstream Confluence page version (cac reserves --version)").option("--parent <id>", "parent page id").option("--slug <slug>", "explicit kebab slug (for non-latin titles)").action(async (opts) => {
    try {
      if (!opts.page) throw new DomainError("missing --page", 1);
      if (!opts.title) throw new DomainError("missing --title", 1);
      const body = await readStdin();
      const fs2 = new NodeFileSystem();
      const root = wikiRoot(opts);
      const result = await recordStorySnapshot(
        {
          pageId: String(opts.page),
          title: String(opts.title),
          version: opts.pageVersion != null ? positiveIntFlag("--page-version", opts.pageVersion) : 0,
          body,
          parentId: opts.parent != null ? String(opts.parent) : void 0,
          slug: opts.slug
        },
        {
          repo: new FoamWikiRepository(root, fs2),
          ledger: new FileLedgerStore(root, fs2),
          clock: new SystemClock(),
          hash: sha256,
          frontmatter: new GrayMatterParser()
        }
      );
      emit({ ok: true, command: "record-story", data: result });
    } catch (err) {
      fail("record-story", err);
    }
  });
  cli.command("prune-stories", "orphan-reconcile pulled snapshots against the live upstream page-id set").option("--live <ids>", "comma-separated upstream page-ids still present (empty = prune all)").option("--commit", "delete the orphan snapshots + ledger rows (default: plan only \u2014 deletes nothing)").action(async (opts) => {
    try {
      if (opts.live == null) {
        throw new DomainError("prune-stories: missing --live (pass empty only to prune all)", 1);
      }
      const fs2 = new NodeFileSystem();
      const root = wikiRoot(opts);
      const result = await pruneStorySnapshots(
        csv(opts.live),
        {
          repo: new FoamWikiRepository(root, fs2),
          ledger: new FileLedgerStore(root, fs2)
        },
        { commit: !!opts.commit }
      );
      emit({ ok: true, command: "prune-stories", data: result });
    } catch (err) {
      fail("prune-stories", err);
    }
  });
  cli.command("render-confluence", "render the full Confluence KB-mirror plan (CAP-2; MCP-free)").option("--all", "mirror the whole wiki (default)").option("--page <path>", "restrict the emitted plan to a single wiki source path (testing/incremental)").action(async (opts) => {
    try {
      await assertWikiRootExists(opts);
      const fs2 = new NodeFileSystem();
      const root = wikiRoot(opts);
      const plan = await renderConfluencePayload({
        repo: new FoamWikiRepository(root, fs2),
        ledger: new FileLedgerStore(root, fs2),
        config: await loadProjectConfig(opts),
        hash: sha256
      });
      let data = plan;
      if (opts.page) {
        const bySource = new Map(plan.pages.map((p) => [p.source, p]));
        const target = bySource.get(String(opts.page));
        if (!target) {
          throw new DomainError(
            `render-confluence --page: no mirror page with source "${opts.page}" \u2014 check the path, or it may be excluded by the visibility filter (confluence:false / audience:internal / proposed|rejected ADR / register page)`,
            2
          );
        }
        const chain = /* @__PURE__ */ new Set();
        let cur = target.source;
        while (cur != null && !chain.has(cur)) {
          chain.add(cur);
          cur = bySource.get(cur)?.parentSource ?? null;
        }
        data = { ...plan, pages: plan.pages.filter((p) => chain.has(p.source)) };
      }
      emit({ ok: true, command: "render-confluence", data });
    } catch (err) {
      fail("render-confluence", err);
    }
  });
  cli.command("record-page", "record a published Confluence page in the ledger + published_as frontmatter").option("--source <path>", "wiki-relative source path (the ledger key)").option("--page <id>", "external Confluence page id").option("--hash <hash>", "content hash from render-confluence").option("--page-version <n>", "Confluence page version returned by create/update (destination-drift baseline)").option("--from-plan <file>", "read --hash (+ --page if absent) for --source from a saved render-confluence plan (avoids a stale hand-copied hash; pass-2 resolves cross-links \u2192 the hash changes)").option("--system <system>", "external system (default confluence)").option("--delete", "reconcile a deleted orphan: drop the ledger row + published_as").action(async (opts) => {
    try {
      if (!opts.source) throw new DomainError("missing --source", 1);
      const fs2 = new NodeFileSystem();
      const root = wikiRoot(opts);
      let hash = opts.hash != null ? String(opts.hash) : void 0;
      let page = opts.page != null ? String(opts.page) : void 0;
      if (opts["fromPlan"]) {
        const pages = await readPlanPages(fs2, String(opts["fromPlan"]), opts.cwd ?? process.cwd());
        const p = pages.find((x) => x.source === String(opts.source));
        if (!p) {
          throw new DomainError(`record-page: no page with source "${opts.source}" in the plan`, 2);
        }
        if (p.contentHash != null) hash = String(p.contentHash);
        if (page == null && p.pageId != null) page = String(p.pageId);
      }
      const result = await recordPage(
        {
          source: String(opts.source),
          page,
          hash,
          pageVersion: opts.pageVersion != null ? positiveIntFlag("--page-version", opts.pageVersion) : void 0,
          system: opts.system != null ? String(opts.system) : void 0,
          del: !!opts["delete"]
        },
        {
          repo: new FoamWikiRepository(root, fs2),
          ledger: new FileLedgerStore(root, fs2),
          frontmatter: new GrayMatterParser(),
          clock: new SystemClock()
        }
      );
      emit({ ok: true, command: "record-page", data: result });
    } catch (err) {
      fail("record-page", err);
    }
  });
  cli.command("finalize-confluence", "restore protected spans into a TRANSLATED Confluence page body (CAP-2 RU)").option("--source <path>", "wiki source path of the page (key into the render-confluence plan)").option("--plan <file>", "the saved `render-confluence --all` plan JSON (carries each page restore map)").action(async (opts) => {
    try {
      if (!opts.source) throw new DomainError("finalize-confluence: missing --source", 1);
      if (!opts.plan) throw new DomainError("finalize-confluence: missing --plan", 1);
      const fs2 = new NodeFileSystem();
      const planArg = String(opts.plan);
      const planText = await fs2.readFile(
        path8.isAbsolute(planArg) ? planArg : path8.join(opts.cwd ?? process.cwd(), planArg)
      );
      let parsed;
      try {
        parsed = JSON.parse(planText);
      } catch (e) {
        throw new DomainError(`finalize-confluence: malformed plan JSON: ${e.message}`, 2);
      }
      const env = parsed;
      const pages = env.data?.pages ?? env.pages;
      if (!Array.isArray(pages)) throw new DomainError("finalize-confluence: plan has no data.pages[]", 2);
      const page = pages.find((p) => p.source === String(opts.source));
      if (!page) {
        throw new DomainError(`finalize-confluence: no page with source "${opts.source}" in the plan`, 2);
      }
      const translated = await readStdin();
      const { body, missing } = applyRestore(translated, page.restore ?? []);
      emit({ ok: missing.length === 0, command: "finalize-confluence", data: { body, missing } });
      if (missing.length > 0) process.exit(2);
    } catch (err) {
      fail("finalize-confluence", err);
    }
  });
  cli.command("guard-path", "PreToolUse hook: block writes to raw/ and .likec4 snapshots").option("--stdin", "read the hook payload from stdin").action(async () => {
    try {
      const fp = hookFilePath(await readStdin());
      if (fp && isProtectedWritePath(fp)) {
        process.stderr.write(`arch-wiki: blocked write to immutable path: ${fp}
`);
        process.exit(2);
      }
    } catch {
    }
    process.exit(0);
  });
  cli.command("hook-lint-changed", "PostToolUse hook: lint the changed wiki file (high only)").option("--stdin", "read the hook payload from stdin").action(async () => {
    try {
      const fp = hookFilePath(await readStdin()).split("\\").join("/");
      const idx = fp.indexOf(WIKI_MARKER);
      if (idx < 0 || !fp.endsWith(".md")) process.exit(0);
      const root = fp.slice(0, idx + WIKI_MARKER.length - 1);
      const rel = fp.slice(idx + WIKI_MARKER.length);
      const fs2 = new NodeFileSystem();
      const repo = new FoamWikiRepository(root, fs2);
      const config = ProjectConfig.from(await new FileProjectConfigStore(root, fs2).read());
      const report = await lintWiki(repo, { changed: [rel], severity: "high", config });
      if (report.findings.length > 0) {
        process.stdout.write(`${JSON.stringify({ ok: false, command: "hook-lint-changed", data: report })}
`);
        process.exit(2);
      }
    } catch {
    }
    process.exit(0);
  });
  cli.command("doctor", "environment preflight").action(async (opts) => {
    try {
      const fs2 = new NodeFileSystem();
      const tdir = templatesDir();
      let config;
      try {
        const file = await new FileProjectConfigStore(wikiRoot(opts), fs2).read();
        config = { present: file !== null, valid: true };
      } catch (e) {
        config = { present: true, valid: false, error: e instanceof Error ? e.message : String(e) };
      }
      emit({
        ok: config.valid,
        command: "doctor",
        data: {
          node: process.version,
          pluginVersion: PLUGIN_VERSION,
          pluginRoot: pluginRoot(),
          templatesDir: tdir,
          templatesPresent: await fs2.exists(tdir),
          config
        },
        warnings: staleBinaryWarning(await newerInstalledVersion(fs2))
      });
    } catch (err) {
      fail("doctor", err);
    }
  });
  cli.command("config", "load + validate the project profile (.arch-wiki/config.json)").option("--check", "validate only (default); exit 2 on invalid").option("--show", "show per-kind effective resolution (override vs default)").action(async (opts) => {
    try {
      const store = new FileProjectConfigStore(wikiRoot(opts), new NodeFileSystem());
      const file = await store.read();
      const cfg = ProjectConfig.from(file);
      if (opts.show) {
        const resolved = Object.keys(ARTIFACT_SPECS).map((kind) => ({
          kind,
          hubFile: cfg.hubFile(kind),
          requiredSections: cfg.requiredSections(kind)
        }));
        emit({
          ok: true,
          command: "config",
          data: { present: file !== null, resolved, notifications: cfg.notificationTarget() }
        });
      } else {
        emit({ ok: true, command: "config", data: { present: file !== null, valid: true, profile: file } });
      }
    } catch (err) {
      fail("config", err);
    }
  });
  cli.command("lint", "audit graph integrity with deterministic rules").option("--json", "emit JSON (always on; accepted for compatibility)").option("--changed <files>", "comma-separated wiki-relative paths to scope to").option("--severity <level>", "minimum severity: low|medium|high").action(async (opts) => {
    try {
      const repo = new FoamWikiRepository(wikiRoot(opts), new NodeFileSystem());
      const report = await lintWiki(repo, {
        changed: opts.changed ? csv(opts.changed) : void 0,
        severity: opts.severity,
        config: await loadProjectConfig(opts)
      });
      emit({ ok: report.findings.length === 0, command: "lint", data: report });
      if (report.findings.length > 0) process.exit(2);
    } catch (err) {
      fail("lint", err);
    }
  });
  cli.command("validate-graph", "check links, orphans, coverage (broken links block)").action(async (opts) => {
    try {
      const repo = new FoamWikiRepository(wikiRoot(opts), new NodeFileSystem());
      const report = await lintWiki(repo, { config: await loadProjectConfig(opts) });
      const broken = report.findings.filter((f) => f.rule.startsWith("broken"));
      emit({
        ok: broken.length === 0,
        command: "validate-graph",
        data: { findings: report.findings, counts: report.counts, brokenCount: broken.length }
      });
      if (broken.length > 0) process.exit(2);
    } catch (err) {
      fail("validate-graph", err);
    }
  });
  cli.command("validate-c4", "check C4 model \u27F7 wiki entity consistency (deterministic, MCP-free)").option("--stdin", "read the normalized C4 model JSON from stdin (LikeC4 MCP / likec4 export json)").option("--model-json <file>", "read the normalized C4 model JSON from a file").option("--source <mode>", "json|regex (default json; regex reads c4().dir *.c4 \u2014 lossy fallback)").option("--establish-baseline", "record current mismatches as the known baseline (no findings emitted)").option("--severity <level>", "minimum severity: low|medium|high").action(async (opts) => {
    try {
      const fs2 = new NodeFileSystem();
      const root = wikiRoot(opts);
      const repo = new FoamWikiRepository(root, fs2);
      const config = await loadProjectConfig(opts);
      const policy = config.c4Consistency();
      const source = opts.source != null ? String(opts.source) : "json";
      let model;
      if (source === "regex") {
        let c4SourceDir;
        try {
          c4SourceDir = config.c4().dir;
        } catch {
          throw new DomainError(
            'validate-c4 --source regex needs a [c4] config (e.g. {"c4":{"dir":"c4/src"}} in .arch-wiki/config.json); or use --stdin / --model-json (LikeC4 MCP / `likec4 export json`), which need no [c4] config',
            2
          );
        }
        const c4dir = path8.join(root, c4SourceDir);
        const files = await fs2.exists(c4dir) ? (await fs2.walk(c4dir)).filter((f) => f.endsWith(".c4")) : [];
        const text = (await Promise.all(files.map((f) => fs2.readFile(f)))).join("\n");
        model = parseC4Sources(text);
      } else if (source === "json") {
        let text;
        if (opts.stdin) {
          text = await readStdin();
        } else if (opts["modelJson"]) {
          const arg = String(opts["modelJson"]);
          text = await fs2.readFile(path8.isAbsolute(arg) ? arg : path8.join(opts.cwd ?? process.cwd(), arg));
        } else {
          throw new DomainError("validate-c4: provide --stdin or --model-json <file> (or --source regex)", 1);
        }
        let raw;
        try {
          raw = JSON.parse(text);
        } catch (e) {
          throw new DomainError(`validate-c4: malformed model JSON: ${e.message}`, 2);
        }
        model = normalizeC4ModelJson(raw);
      } else {
        throw new DomainError(`validate-c4: unknown --source "${source}" (valid: json, regex)`, 1);
      }
      const report = await validateC4(model, repo, {
        policy,
        establishBaseline: !!opts["establishBaseline"],
        severity: opts.severity
      });
      emit({ ok: report.findings.length === 0, command: "validate-c4", data: report });
      if (!opts["establishBaseline"] && report.findings.length > 0) process.exit(2);
    } catch (err) {
      fail("validate-c4", err);
    }
  });
  cli.command("list <type>", "list existing artifacts of a type").action(async (type, opts) => {
    try {
      const spec = resolveKind(type);
      const repo = new FoamWikiRepository(wikiRoot(opts), new NodeFileSystem());
      const pages = await repo.loadPages();
      const items = pages.filter((p) => kindOfPage(p) === spec.kind).map((p) => ({ basename: p.basename, path: p.relPath })).sort((a, b) => a.basename.localeCompare(b.basename));
      emit({ ok: true, command: "list", data: { kind: spec.kind, items } });
    } catch (err) {
      fail("list", err);
    }
  });
  cli.command("record-risk", "idempotently record a risk/contradiction row in risks.md").option("--source <name>", "where it was detected (e.g. ingest, lint)").option("--id <id>", "related artifact id (e.g. QA-007)").option("--conflict <text>", "one-line description of the risk/contradiction").action(async (opts) => {
    try {
      if (!opts.source) throw new DomainError("missing --source", 1);
      if (!opts.conflict) throw new DomainError("missing --conflict", 1);
      const repo = new FoamWikiRepository(wikiRoot(opts), new NodeFileSystem());
      const date = new SystemClock().now().toISOString().slice(0, 10);
      const result = await recordRisk(
        {
          source: String(opts.source),
          id: opts.id != null ? String(opts.id) : void 0,
          conflict: String(opts.conflict),
          date
        },
        { repo, hash: sha256 }
      );
      emit({ ok: true, command: "record-risk", data: result });
    } catch (err) {
      fail("record-risk", err);
    }
  });
  cli.command("update-kanban", "idempotently add/move a card in kanban.md (intent source-of-truth)").option("--add <id>", "card id/basename to add (rendered as a wikilink)").option("--column <col>", "backlog|in-progress|done (default backlog on a new card)").action(async (opts) => {
    try {
      if (!opts.add) throw new DomainError("missing --add", 1);
      const repo = new FoamWikiRepository(wikiRoot(opts), new NodeFileSystem());
      const result = await updateKanban(
        { add: String(opts.add), column: opts.column },
        { repo }
      );
      emit({ ok: true, command: "update-kanban", data: result });
    } catch (err) {
      fail("update-kanban", err);
    }
  });
  cli.command("update-utility-tree", "idempotently upsert a QAW row into utility-tree.md").option("--from <id>", "quality-attribute driver id (keyed; placeholder if absent)").option("--scenario <text>", "quality scenario one-liner").option("--priority <text>", "priority marker (e.g. H/M/L)").action(async (opts) => {
    try {
      if (!opts.from) throw new DomainError("missing --from", 1);
      const repo = new FoamWikiRepository(wikiRoot(opts), new NodeFileSystem());
      const result = await updateUtilityTree(
        {
          from: String(opts.from),
          scenario: opts.scenario != null ? String(opts.scenario) : void 0,
          priority: opts.priority != null ? String(opts.priority) : void 0
        },
        { repo }
      );
      emit({ ok: true, command: "update-utility-tree", data: result });
    } catch (err) {
      fail("update-utility-tree", err);
    }
  });
  cli.command("update-gap-analysis", "regenerate the open-gaps region of gap-analysis.md from lint").action(async (opts) => {
    try {
      const repo = new FoamWikiRepository(wikiRoot(opts), new NodeFileSystem());
      const report = await lintWiki(repo, { config: await loadProjectConfig(opts) });
      const gaps = report.findings.filter((f) => f.rule === "uncovered-driver" && f.file).map((f) => ({ driver: f.file.replace(/^.*\//, "").replace(/\.md$/, ""), reason: f.message }));
      const result = await updateGapAnalysis({ gaps }, { repo });
      emit({ ok: true, command: "update-gap-analysis", data: result });
    } catch (err) {
      fail("update-gap-analysis", err);
    }
  });
  cli.command("assurance", "compute AssuranceLevel L0/L1/L2 per driver (FPF B.3.3, deterministic)").action(async (opts) => {
    try {
      await assertWikiRootExists(opts);
      const fs2 = new NodeFileSystem();
      const root = wikiRoot(opts);
      const repo = new FoamWikiRepository(root, fs2);
      const report = await reportDriverAssurance({ repo, ledger: new FileLedgerStore(root, fs2) });
      emit({ ok: true, command: "assurance", data: report });
    } catch (err) {
      fail("assurance", err);
    }
  });
  cli.command("update-epistemic-debt", "regenerate the epistemic-debt.md decay register (FPF B.3.4)").action(async (opts) => {
    try {
      await assertWikiRootExists(opts);
      const fs2 = new NodeFileSystem();
      const root = wikiRoot(opts);
      const repo = new FoamWikiRepository(root, fs2);
      const result = await updateEpistemicDebt({ repo, ledger: new FileLedgerStore(root, fs2) });
      emit({ ok: true, command: "update-epistemic-debt", data: result });
    } catch (err) {
      fail("update-epistemic-debt", err);
    }
  });
  cli.command("sync-templates", "sync plugin templates into target .foam/templates (non-destructive)").option("--check", "report drift only (default; exits 2 on missing/stale)").option("--force", "create missing and update stale templates (curated files preserved)").option("--dry-run", "preview without writing or failing").action(async (opts) => {
    try {
      const fs2 = new NodeFileSystem();
      const repo = new FoamWikiRepository(wikiRoot(opts), fs2);
      const templates = new PluginTemplateStore(templatesDir(), fs2);
      const write = !!opts.force;
      const result = await syncTemplates({ write }, { templates, repo, hash: sha256 });
      const warnings = result.counts.curated > 0 ? [`${result.counts.curated} curated template(s) preserved (not arch-wiki-managed)`] : void 0;
      emit({ ok: true, command: "sync-templates", data: result, warnings });
      if (!write && !opts.dryRun && result.actionable > 0) process.exit(2);
    } catch (err) {
      fail("sync-templates", err);
    }
  });
  cli.command("migrate", "apply schema migrations sequentially to the target wiki").option("--to <n>", "target schema version (default: current)").option("--status", "report current/target/pending without applying").option("--dry-run", "plan without writing").action(async (opts) => {
    try {
      const store = new FileVersionStore(wikiRoot(opts), new NodeFileSystem());
      const to = opts.to != null ? Number(opts.to) : void 0;
      const result = await applyMigration(store, migrationContext(opts), {
        to,
        dryRun: !!opts.dryRun || !!opts.status,
        pluginVersion: PLUGIN_VERSION
      });
      emit({ ok: true, command: "migrate", data: result });
    } catch (err) {
      fail("migrate", err);
    }
  });
  cli.command("adopt", "onboard an existing (populated) wiki onto the contract \u2014 first-time").option("--dry-run", "plan without writing").action(async (opts) => {
    try {
      const store = new FileVersionStore(wikiRoot(opts), new NodeFileSystem());
      const existing = await store.read();
      if (existing && !opts.dryRun) {
        throw new DomainError(
          `already adopted (schema v${existing.schemaVersion}); use 'migrate' instead`,
          1
        );
      }
      const result = await applyMigration(store, migrationContext(opts), {
        dryRun: !!opts.dryRun,
        pluginVersion: PLUGIN_VERSION
      });
      emit({ ok: true, command: "adopt", data: result });
    } catch (err) {
      fail("adopt", err);
    }
  });
  cli.command("version", "print plugin/schema versions").option("--target", "include the target wiki schema version").action(async (opts) => {
    const data = {
      plugin: PLUGIN_VERSION,
      schema: CURRENT_SCHEMA_VERSION,
      node: process.version
    };
    if (opts.target) {
      const marker = await new FileVersionStore(wikiRoot(opts), new NodeFileSystem()).read();
      data.targetSchema = marker?.schemaVersion ?? null;
      data.migrationNeeded = (marker?.schemaVersion ?? 0) < CURRENT_SCHEMA_VERSION;
    }
    emit({
      ok: true,
      command: "version",
      data,
      warnings: staleBinaryWarning(await newerInstalledVersion(new NodeFileSystem()))
    });
  });
  cli.help();
  cli.parse(process.argv, { run: false });
  await cli.runMatchedCommand();
}
main().catch((err) => fail("arch-wiki", err));
/*! Bundled license information:

is-extendable/index.js:
  (*!
   * is-extendable <https://github.com/jonschlinkert/is-extendable>
   *
   * Copyright (c) 2015, Jon Schlinkert.
   * Licensed under the MIT License.
   *)

strip-bom-string/index.js:
  (*!
   * strip-bom-string <https://github.com/jonschlinkert/strip-bom-string>
   *
   * Copyright (c) 2015, 2017, Jon Schlinkert.
   * Released under the MIT License.
   *)
*/
//# sourceMappingURL=cli.cjs.map
