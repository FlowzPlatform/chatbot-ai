'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _requireDir = require('require-dir');

var _requireDir2 = _interopRequireDefault(_requireDir);

var _debugLevels = require('debug-levels');

var _debugLevels2 = _interopRequireDefault(_debugLevels);

var _ssMessage = require('ss-message');

var _ssMessage2 = _interopRequireDefault(_ssMessage);

var _common = require('./reply/common');

var _common2 = _interopRequireDefault(_common);

var _connect = require('./db/connect');

var _connect2 = _interopRequireDefault(_connect);

var _factSystem = require('./factSystem');

var _factSystem2 = _interopRequireDefault(_factSystem);

var _chatSystem = require('./chatSystem');

var _chatSystem2 = _interopRequireDefault(_chatSystem);

var _getReply = require('./getReply');

var _getReply2 = _interopRequireDefault(_getReply);

var _import = require('./db/import');

var _import2 = _interopRequireDefault(_import);

var _logger = require('./logger');

var _logger2 = _interopRequireDefault(_logger);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const debug = (0, _debugLevels2.default)('SS:SuperScript');

class SuperScript {
  constructor(coreChatSystem, coreFactSystem, plugins, scope, editMode, conversationTimeout, historyCheckpoints, tenantId = 'master') {
    this.chatSystem = coreChatSystem.getChatSystem(tenantId);
    this.factSystem = coreFactSystem.getFactSystem(tenantId);

    // We want a place to store bot related data
    this.memory = this.factSystem.createUserDB('botfacts');

    this.scope = scope;
    this.scope.bot = this;
    this.scope.facts = this.factSystem;
    this.scope.chatSystem = this.chatSystem;
    this.scope.botfacts = this.memory;

    this.plugins = plugins;
    this.editMode = editMode;
    this.conversationTimeout = conversationTimeout;
    this.historyCheckpoints = historyCheckpoints;
  }

  importFile(filePath, callback) {
    _import2.default.importFile(this.chatSystem, filePath, err => {
      console.log('Bot is ready for input!');
      debug.verbose('System loaded, waiting for replies');
      callback(err);
    });
  }

  getUsers(callback) {
    this.chatSystem.User.find({}, 'id', callback);
  }

  getUser(userId, callback) {
    this.chatSystem.User.findOne({ id: userId }).slice('history', this.historyCheckpoints).exec(callback);
  }

  findOrCreateUser(userId, callback) {
    this.chatSystem.User.findOneAndUpdate({ id: userId }, {}, {
      upsert: true,
      setDefaultsOnInsert: true,
      new: true
    }).slice('history', this.historyCheckpoints).exec(callback);
  }

  // Converts msg into a message object, then checks for a match
  reply(userId, messageString, callback, extraScope) {
    // TODO: Check if random assignment of existing user ID causes problems
    if (arguments.length === 2 && typeof messageString === 'function') {
      callback = messageString;
      messageString = userId;
      userId = Math.random().toString(36).substr(2, 5);
      extraScope = {};
    }

    debug.log("[ New Message - '%s']- %s", userId, messageString);
    const options = {
      userId,
      extraScope
    };

    this._reply(messageString, options, callback);
  }

  // This is like doing a topicRedirect
  directReply(userId, topicName, messageString, callback) {
    debug.log("[ New DirectReply - '%s']- %s", userId, messageString);
    const options = {
      userId,
      topicName,
      extraScope: {}
    };

    this._reply(messageString, options, callback);
  }

  message(messageString, callback) {
    const options = {
      factSystem: this.factSystem
    };

    _ssMessage2.default.createMessage(messageString, options, (err, msgObj) => {
      callback(null, msgObj);
    });
  }

  _reply(messageString, options, callback) {
    const system = {
      // Pass in the topic if it has been set
      topicName: options.topicName || null,
      plugins: this.plugins,
      scope: this.scope,
      extraScope: options.extraScope,
      chatSystem: this.chatSystem,
      factSystem: this.factSystem,
      editMode: this.editMode,
      conversationTimeout: this.conversationTimeout,
      defaultKeepScheme: 'exhaust',
      defaultOrderScheme: 'random'
    };

    this.findOrCreateUser(options.userId, (err, user) => {
      if (err) {
        debug.error(err);
      }

      const messageOptions = {
        factSystem: this.factSystem
      };

      _ssMessage2.default.createMessage(messageString, messageOptions, (err, messageObject) => {
        _common2.default.getTopic(system.chatSystem, system.topicName).then(topicData => {
          const options = {
            user,
            system,
            depth: 0
          };

          if (topicData) {
            options.pendingTopics = [topicData];
          }

          (0, _getReply2.default)(messageObject, options, (err, replyObj) => {
            if (!replyObj) {
              replyObj = {};
              console.log('There was no response matched.');
            }

            user.updateHistory(messageObject, replyObj, (err, log) => {
              // We send back a smaller message object to the clients.
              const clientObject = {
                replyId: replyObj.replyId,
                createdAt: Date.now(),
                string: replyObj.string || '',
                topicName: replyObj.topicName,
                subReplies: replyObj.subReplies,
                debug: log
              };

              const newClientObject = _lodash2.default.merge(clientObject, replyObj.props || {});

              debug.verbose("Update and Reply to user '%s'", user.id, replyObj.string);
              debug.info("[ Final Reply - '%s']- '%s'", user.id, replyObj.string);

              return callback(err, newClientObject);
            });
          });
        });
      });
    });
  }
}

/**
 *  This a class which has global settings for all bots on a certain database server,
 *  so we can reuse parts of the chat and fact systems and share plugins, whilst still
 *  being able to have multiple bots on different databases per server.
 */
class SuperScriptInstance {
  constructor(coreChatSystem, coreFactSystem, options) {
    this.coreChatSystem = coreChatSystem;
    this.coreFactSystem = coreFactSystem;
    this.plugins = [];

    // This is a kill switch for filterBySeen which is useless in the editor.
    this.editMode = options.editMode || false;
    this.conversationTimeout = options.conversationTimeout;
    this.historyCheckpoints = options.historyCheckpoints;
    this.scope = options.scope || {};

    // Built-in plugins
    this.loadPlugins(`${__dirname}/../plugins`);

    // For user plugins
    if (options.pluginsPath) {
      this.loadPlugins(options.pluginsPath);
    }

    if (options.messagePluginsPath) {
      _ssMessage2.default.loadPlugins(options.messagePluginsPath);
    }
  }

  loadPlugins(path) {
    try {
      const pluginFiles = (0, _requireDir2.default)(path);

      Object.keys(pluginFiles).forEach(file => {
        // For transpiled ES6 plugins with default export
        if (pluginFiles[file].default) {
          pluginFiles[file] = pluginFiles[file].default;
        }

        Object.keys(pluginFiles[file]).forEach(func => {
          debug.verbose('Loading plugin: ', path, func);
          this.plugins[func] = pluginFiles[file][func];
        });
      });
    } catch (e) {
      console.error(`Could not load plugins from ${path}: ${e}`);
    }
  }

  getBot(tenantId) {
    return new SuperScript(this.coreChatSystem, this.coreFactSystem, this.plugins, this.scope, this.editMode, this.conversationTimeout, this.historyCheckpoints, tenantId);
  }
}

const defaultOptions = {
  mongoURI: 'mongodb://localhost/superscriptDB',
  importFile: null,
  factSystem: {
    clean: false,
    importFiles: null
  },
  scope: {},
  editMode: false,
  pluginsPath: `${process.cwd()}/plugins`,
  messagePluginsPath: null,
  logPath: `${process.cwd()}/logs`,
  useMultitenancy: false,
  conversationTimeout: 1000 * 300,
  historyCheckpoints: 10
};

/**
 * Setup SuperScript. You may only run this a single time since it writes to global state.
 * @param {Object} options - Any configuration settings you want to use.
 * @param {String} options.mongoURI - The database URL you want to connect to.
 *                 This will be used for both the chat and fact system.
 * @param {String} options.importFile - Use this if you want to re-import your parsed
 *                 '*.json' file. Otherwise SuperScript will use whatever it currently
 *                 finds in the database.
 * @param {Object} options.factSystem - Settings to use for the fact system.
 * @param {Boolean} options.factSystem.clean - If you want to remove everything in the
 *                  fact system upon launch. Otherwise SuperScript will keep facts from
 *                  the last time it was run.
 * @param {Array} options.factSystem.importFiles - Any additional data you want to
 *                import into the fact system.
 * @param {Object} options.scope - Any extra scope you want to pass into your plugins.
 * @param {Boolean} options.editMode - Used in the editor.
 * @param {String} options.pluginsPath - A path to the plugins written by you. This loads
 *                 the entire directory recursively.
 * @param {String} options.logPath - If null, logging will be off. Otherwise writes
 *                 conversation transcripts to the path.
 * @param {Boolean} options.useMultitenancy - If true, will return a bot instance instead
 *                  of a bot, so you can get different tenancies of a single server. Otherwise,
 *                  returns a default bot in the 'master' tenancy.
 * @param {Number} options.conversationTimeout - The time to wait before a conversation expires,
 *                 so you start matching from the top-level triggers.
 */
const setup = function setup(options = {}, callback) {
  options = _lodash2.default.merge(defaultOptions, options);

  // Uses schemas to create models for the db connection to use
  _factSystem2.default.setupFactSystem(options.mongoURI, options.factSystem, (err, coreFactSystem) => {
    if (err) {
      return callback(err);
    }

    const db = (0, _connect2.default)(options.mongoURI);
    const logger = new _logger2.default(options.logPath);
    const coreChatSystem = _chatSystem2.default.setupChatSystem(db, coreFactSystem, logger);

    const instance = new SuperScriptInstance(coreChatSystem, coreFactSystem, options);

    /**
     *  When you want to use multitenancy, don't return a bot, but instead an instance that can
     *  get bots in different tenancies. Then you can just do:
     *
     *  instance.getBot('myBot');
     */
    if (options.useMultitenancy) {
      return callback(null, instance);
    }

    const bot = instance.getBot('master');
    if (options.importFile) {
      return bot.importFile(options.importFile, err => callback(err, bot));
    }
    return callback(null, bot);
  });
};

exports.default = {
  setup
};