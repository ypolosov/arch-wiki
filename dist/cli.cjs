#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
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

// src/cli/main.ts
var path4 = __toESM(require("node:path"));

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
  const parse = (match) => {
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
    res.push(parse(angledMatch));
  }
  let squareMatch;
  while (squareMatch = SQUARE_BRACKET_RE_GLOBAL.exec(v)) {
    res.push(parse(squareMatch));
  }
  return res;
};
var getMriOptions = (options) => {
  const result = { alias: {}, boolean: [] };
  for (const [index, option] of options.entries()) {
    if (option.names.length > 1) {
      result.alias[option.names[0]] = option.names.slice(1);
    }
    if (option.isBoolean) {
      if (option.negated) {
        const hasStringTypeOption = options.some((o, i) => {
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
var padRight = (str, length) => {
  return str.length >= length ? str : `${str}${" ".repeat(length - str.length)}`;
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
    let options = this.isGlobalCommand ? globalOptions : [...this.options, ...globalOptions || []];
    if (!this.isGlobalCommand && !this.isDefaultCommand) {
      options = options.filter((option) => option.name !== "version");
    }
    if (options.length > 0) {
      const longestOptionName = findLongest(options.map((option) => option.rawName));
      sections.push({
        title: "Options",
        body: options.map((option) => {
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
    const { options, globalCommand } = this.cli;
    if (!this.config.allowUnknownOptions) {
      for (const name of Object.keys(options)) {
        if (name !== "--" && !this.hasOption(name) && !globalCommand.hasOption(name)) {
          throw new CACError(`Unknown option \`${name.length > 1 ? `--${name}` : `-${name}`}\``);
        }
      }
    }
  }
  checkOptionValue() {
    const { options: parsedOptions, globalCommand } = this.cli;
    const options = [...globalCommand.options, ...this.options];
    for (const option of options) {
      const value = parsedOptions[option.name.split(".")[0]];
      if (option.required) {
        const hasNegated = options.some((o) => o.negated && o.names.includes(option.name));
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
  setParsedInfo({ args, options }, matchedCommand, matchedCommandName) {
    this.args = args;
    this.options = options;
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
    const options = {
      "--": argsAfterDoubleDashes
    };
    const ignoreDefault = command && command.config.ignoreOptionDefaultValue ? command.config.ignoreOptionDefaultValue : this.globalCommand.config.ignoreOptionDefaultValue;
    let transforms = /* @__PURE__ */ Object.create(null);
    for (const cliOption of cliOptions) {
      if (!ignoreDefault && cliOption.config.default !== void 0) {
        for (const name of cliOption.names) {
          options[name] = cliOption.config.default;
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
        setDotProp(options, keys, parsed[key]);
        setByType(options, transforms);
      }
    }
    return {
      args,
      options
    };
  }
  runMatchedCommand() {
    const { args, options, matchedCommand: command } = this;
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
    actionArgs.push(options);
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
  async list(absDir) {
    try {
      return await import_node_fs.promises.readdir(absDir);
    } catch (err) {
      if (err.code === "ENOENT") return [];
      throw err;
    }
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
};

// src/adapters/repo/FoamWikiRepository.ts
var path3 = __toESM(require("node:path"));

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

// src/adapters/repo/FoamWikiRepository.ts
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
    return path3.join(this.root, relPath);
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
  async read(relPath) {
    return this.fs.readFile(this.abs(relPath));
  }
  async appendHubLink(hubRelPath, basename, bullet) {
    const abs = this.abs(hubRelPath);
    if (!await this.fs.exists(abs)) return false;
    const content = await this.fs.readFile(abs);
    if (content.includes(`[[${basename}`)) return true;
    const sep = content.length === 0 || content.endsWith("\n") ? "" : "\n";
    await this.fs.writeFile(abs, `${content}${sep}${bullet}
`);
    return true;
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

// src/application/usecases/ScaffoldArtifact.ts
function isoDate(d) {
  return d.toISOString().slice(0, 10);
}
async function scaffoldArtifact(input, deps) {
  const { spec } = input;
  const { repo, templates, clock } = deps;
  const warnings = [];
  const needsSlug = spec.kind !== "iteration";
  const slug = needsSlug ? input.slug?.trim() || requireSlug(input.title) : "";
  let id = null;
  if (spec.prefix) {
    id = nextId(spec, await repo.existingNumbers(spec));
  }
  const filename = spec.filename(id, slug);
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
  await repo.write(relPath, output);
  let hubUpdated = false;
  if (spec.hubFile) {
    const base = filename.replace(/\.md$/, "");
    const label = id ? `${id.toString()} \xB7 ${input.title}` : input.title;
    hubUpdated = await repo.appendHubLink(spec.hubFile, base, `- [[${base}|${label}]]`);
    if (!hubUpdated) warnings.push(`hub not found, skipped backlink: ${spec.hubFile}`);
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

// src/cli/version.ts
var PLUGIN_VERSION = "0.2.0";

// src/cli/main.ts
function pluginRoot() {
  return process.env.ARCH_WIKI_PLUGIN_ROOT ?? path4.resolve(__dirname, "..");
}
function templatesDir() {
  return process.env.ARCH_WIKI_TEMPLATES_DIR ?? path4.join(pluginRoot(), "templates");
}
function wikiRoot(opts) {
  const cwd = opts.cwd ?? process.cwd();
  const root = opts.root ?? "docs/architecture";
  return path4.isAbsolute(root) ? root : path4.join(cwd, root);
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
      const result = await scaffoldArtifact(
        { spec, title: String(opts.title), slug: opts.slug, drivers, dryRun: !!opts.dryRun },
        { repo, templates, clock: new SystemClock() }
      );
      emit({ ok: true, command: "scaffold", data: result, warnings: result.warnings });
    } catch (err) {
      fail("scaffold", err);
    }
  });
  cli.command("doctor", "environment preflight").action(async () => {
    try {
      const fs2 = new NodeFileSystem();
      const tdir = templatesDir();
      emit({
        ok: true,
        command: "doctor",
        data: {
          node: process.version,
          pluginVersion: PLUGIN_VERSION,
          pluginRoot: pluginRoot(),
          templatesDir: tdir,
          templatesPresent: await fs2.exists(tdir)
        }
      });
    } catch (err) {
      fail("doctor", err);
    }
  });
  cli.command("version", "print plugin and node versions").action(() => {
    emit({ ok: true, command: "version", data: { plugin: PLUGIN_VERSION, node: process.version } });
  });
  cli.help();
  cli.parse(process.argv, { run: false });
  await cli.runMatchedCommand();
}
main().catch((err) => fail("arch-wiki", err));
//# sourceMappingURL=cli.cjs.map
