'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.doesMatchTopic = exports.doesMatch = undefined;

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _debugLevels = require('debug-levels');

var _debugLevels2 = _interopRequireDefault(_debugLevels);

var _safeEval = require('safe-eval');

var _safeEval2 = _interopRequireDefault(_safeEval);

var _postParse = require('../postParse');

var _postParse2 = _interopRequireDefault(_postParse);

var _utils = require('../utils');

var _utils2 = _interopRequireDefault(_utils);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const debug = (0, _debugLevels2.default)('SS:Helpers');

// This will find all the gambits to process by parent (topic or conversation)
// and return ones that match the message
const findMatchingGambitsForMessage = (() => {
  var _ref = _asyncToGenerator(function* (type, parent, message, options) {
    const matches = yield Promise.all(parent.gambits.map((() => {
      var _ref2 = _asyncToGenerator(function* (gambit) {
        const match = yield eachGambitHandle(gambit, message, options);
        return match;
      });

      return function (_x5) {
        return _ref2.apply(this, arguments);
      };
    })()));

    return _lodash2.default.flatten(matches);
  });

  function findMatchingGambitsForMessage(_x, _x2, _x3, _x4) {
    return _ref.apply(this, arguments);
  }

  return findMatchingGambitsForMessage;
})();

const processStars = function processStars(match, gambit, topic) {
  debug.verbose(`Match found: ${gambit.input} in topic: ${topic}`);
  const stars = [];
  if (match.length > 1) {
    for (let j = 1; j < match.length; j++) {
      if (match[j]) {
        let starData = _utils2.default.trim(match[j]);
        // Concepts are not allowed to be stars or captured input.
        starData = starData[0] === '~' ? starData.substr(1) : starData;
        stars.push(starData);
      }
    }
  }

  const data = { stars, gambit };
  if (topic !== 'reply') {
    data.topic = topic;
  }

  const matches = [data];
  return matches;
};

/* This is a function to determine whether a certain key has been set to a certain value.
 * The double percentage sign (%%) syntax is used in the script to denote that a gambit
 * must meet a condition before being executed, e.g.
 *
 * %% (userKilledAlice === true)
 * + I love you.
 * - I still haven't forgiven you, you know.
 *
 * The context is whatever a user has previously set in any replies. So in this example,
 * if a user has set {userKilledAlice = true}, then the gambit is matched.
 */
const processConditions = function processConditions(conditions, options) {
  const context = options.user.conversationState || {};

  return _lodash2.default.every(conditions, condition => {
    debug.verbose('Check condition - Context: ', context);
    debug.verbose('Check condition - Condition: ', condition);

    try {
      const result = (0, _safeEval2.default)(condition, context);
      if (result) {
        debug.verbose('--- Condition TRUE ---');
        return true;
      }
      debug.verbose('--- Condition FALSE ---');
      return false;
    } catch (e) {
      debug.verbose(`Error in condition checking: ${e.stack}`);
      return false;
    }
  });
};

/**
 * Takes a gambit and a message, and returns non-null if they match.
 */
const doesMatch = exports.doesMatch = (() => {
  var _ref3 = _asyncToGenerator(function* (gambit, message, options) {
    if (gambit.conditions && gambit.conditions.length > 0) {
      const conditionsMatch = processConditions(gambit.conditions, options);
      if (!conditionsMatch) {
        debug.verbose('Conditions did not match');
        return false;
      }
    }

    let match = false;

    // Replace <noun1>, <adverb1> etc. with the actual words in user message
    const regexp = (0, _postParse2.default)(gambit.trigger, message, options.user);

    const pattern = new RegExp(`^${regexp}$`, 'i');

    debug.verbose(`Try to match (clean)'${message.clean}' against '${gambit.trigger}' (${pattern})`);
    debug.verbose(`Try to match (lemma)'${message.lemString}' against '${gambit.trigger}' (${pattern})`);

    // Match on isQuestion
    if (gambit.isQuestion && message.isQuestion) {
      debug.verbose('Gambit and message are questions, testing against question types');
      match = message.clean.match(pattern);
      if (!match) {
        match = message.lemString.match(pattern);
      }
    } else if (!gambit.isQuestion) {
      match = message.clean.match(pattern);
      if (!match) {
        match = message.lemString.match(pattern);
      }
    }

    debug.verbose(`Match at the end of doesMatch was: ${match}`);

    return match;
  });

  function doesMatch(_x6, _x7, _x8) {
    return _ref3.apply(this, arguments);
  }

  return doesMatch;
})();

// TODO: This only exists for testing, ideally we should get rid of this
const doesMatchTopic = exports.doesMatchTopic = (() => {
  var _ref4 = _asyncToGenerator(function* (topicName, message, options) {
    const topic = yield options.chatSystem.Topic.findOne({ name: topicName }, 'gambits').populate('gambits').lean().exec();

    return Promise.all(topic.gambits.map((() => {
      var _ref5 = _asyncToGenerator(function* (gambit) {
        return doesMatch(gambit, message, options);
      });

      return function (_x12) {
        return _ref5.apply(this, arguments);
      };
    })()));
  });

  function doesMatchTopic(_x9, _x10, _x11) {
    return _ref4.apply(this, arguments);
  }

  return doesMatchTopic;
})();

// This is the main function that looks for a matching entry
// This takes a gambit that is a child of a topic or reply and checks if
// it matches the user's message or not.
const eachGambitHandle = (() => {
  var _ref6 = _asyncToGenerator(function* (gambit, message, options) {
    const plugins = options.system.plugins;
    const scope = options.system.scope;
    const topic = options.topic || 'reply';
    const chatSystem = options.system.chatSystem;

    const match = yield doesMatch(gambit, message, options);
    if (!match) {
      return [];
    }

    // A filter is syntax that calls a plugin function such as:
    // - {^functionX(true)} Yes, you are.
    if (gambit.filter) {
      debug.verbose(`We have a filter function: ${gambit.filter}`);

      // The filterScope is what 'this' is during the execution of the plugin.
      // This is so you can write plugins that can access, e.g. this.user or this.chatSystem
      // Here we augment the global scope (system.scope) with any additional local scope for
      // the current reply.
      const filterScope = _lodash2.default.merge({}, scope);
      filterScope.message = message;
      // filterScope.message_props = options.localOptions.messageScope;
      filterScope.user = options.user;

      let filterReply;
      try {
        var _ref7 = yield _utils2.default.runPluginFunc(gambit.filter, filterScope, plugins);

        var _ref8 = _slicedToArray(_ref7, 1);

        filterReply = _ref8[0];
      } catch (err) {
        console.error(err);
        return [];
      }

      debug.verbose(`Reply from filter function was: ${filterReply}`);

      if (filterReply !== 'true' && filterReply !== true) {
        debug.verbose('Gambit is not matched since the filter function returned false');
        return [];
      }
    }

    if (gambit.redirect !== '') {
      debug.verbose('Gambit has a redirect', topic);
      // FIXME: ensure this works
      const redirectedGambit = yield chatSystem.Gambit.findOne({ input: gambit.redirect }).populate({ path: 'replies' }).lean().exec();
      return processStars(match, redirectedGambit, topic);
    }

    // Tag the message with the found Trigger we matched on
    message.gambitId = gambit._id;
    return processStars(match, gambit, topic);
  });

  function eachGambitHandle(_x13, _x14, _x15) {
    return _ref6.apply(this, arguments);
  }

  return eachGambitHandle;
})();

const walkGambitParent = (() => {
  var _ref9 = _asyncToGenerator(function* (gambitId, chatSystem) {
    const gambitIds = [];
    try {
      const gambit = yield chatSystem.Gambit.findById(gambitId, '_id parent').populate('parent').lean().exec();
      debug.verbose('Walk', gambit);

      if (gambit) {
        gambitIds.push(gambit._id);
        if (gambit.parent && gambit.parent.parent) {
          const parents = yield walkGambitParent(gambit.parent.parent, chatSystem);
          return gambitIds.concat(parents);
        }
      }
    } catch (err) {
      console.error(err);
    }
    return gambitIds;
  });

  function walkGambitParent(_x16, _x17) {
    return _ref9.apply(this, arguments);
  }

  return walkGambitParent;
})();

const walkReplyParent = (() => {
  var _ref10 = _asyncToGenerator(function* (replyId, chatSystem) {
    const replyIds = [];
    try {
      const reply = yield chatSystem.Reply.findById(replyId, '_id parent').populate('parent').lean().exec();
      debug.verbose('Walk', reply);

      if (reply) {
        replyIds.push(reply._id);
        if (reply.parent && reply.parent.parent) {
          const parents = yield walkReplyParent(reply.parent.parent, chatSystem);
          return replyIds.concat(parents);
        }
      }
    } catch (err) {
      console.error(err);
    }
    return replyIds;
  });

  function walkReplyParent(_x18, _x19) {
    return _ref10.apply(this, arguments);
  }

  return walkReplyParent;
})();

const getRootTopic = (() => {
  var _ref11 = _asyncToGenerator(function* (gambit, chatSystem) {
    if (!gambit.parent) {
      return chatSystem.Topic.findOne({ gambits: { $in: [gambit._id] } }).lean().exec();
    }

    const gambits = yield walkGambitParent(gambit._id, chatSystem);
    if (gambits.length !== 0) {
      return chatSystem.Topic.findOne({ gambits: { $in: [gambits.pop()] } }).lean().exec();
    }

    return chatSystem.Topic.findOne({ name: 'random' }).lean().exec();
  });

  function getRootTopic(_x20, _x21) {
    return _ref11.apply(this, arguments);
  }

  return getRootTopic;
})();

exports.default = {
  findMatchingGambitsForMessage,
  getRootTopic,
  walkReplyParent
};