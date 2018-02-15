'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _debugLevels = require('debug-levels');

var _debugLevels2 = _interopRequireDefault(_debugLevels);

var _utils = require('../utils');

var _utils2 = _interopRequireDefault(_utils);

var _processTags = require('../processTags');

var _processTags2 = _interopRequireDefault(_processTags);

var _getPendingTopics = require('./getPendingTopics');

var _getPendingTopics2 = _interopRequireDefault(_getPendingTopics);

var _filterFunction = require('./filterFunction');

var _filterFunction2 = _interopRequireDefault(_filterFunction);

var _filterSeen = require('./filterSeen');

var _filterSeen2 = _interopRequireDefault(_filterSeen);

var _processReplyTags = require('./processReplyTags');

var _processReplyTags2 = _interopRequireDefault(_processReplyTags);

var _helpers = require('./helpers');

var _helpers2 = _interopRequireDefault(_helpers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; } /* eslint-disable no-use-before-define */

const debug = (0, _debugLevels2.default)('SS:GetReply');

/**
 * The real craziness to retreive a reply.
 * @param {Object} messageObject - The instance of the Message class for the user input.
 * @param {Object} options.system - The system.
 * @param {Object} options.user - The user.
 * @param {Number} options.depth - The depth of how many times this function has been recursively called.
 * @param {Array} options.pendingTopics - A list of topics that have been specified to specifically search (usually via topicRedirect etc).
 * @param {Function} callback - Callback function once the reply has been found.
 */
const getReply = (() => {
  var _ref = _asyncToGenerator(function* (messageObject, options, callback) {
    if (options.depth) {
      debug.verbose('Called recursively', options.depth);
      if (options.depth >= 20) {
        console.error('getReply was called recursively 20 times - returning null reply.');
        return callback(null, null);
      }
    }

    let matches = [];
    try {
      const pendingTopics = yield (0, _getPendingTopics2.default)(messageObject, options);
      matches = yield findMatches(pendingTopics, messageObject, options);
    } catch (err) {
      console.error(err);
    }

    const data = afterHandle(matches);
    // One day, everything will be async/await and everything will be happy. Until
    // then, catch exceptions in the callback and throw them at top-level on next tick.
    try {
      return callback(null, data);
    } catch (err) {
      process.nextTick(function () {
        throw err;
      });
    }
  });

  function getReply(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  }

  return getReply;
})();

const findMatches = (() => {
  var _ref2 = _asyncToGenerator(function* (pendingTopics, messageObject, options) {
    debug.verbose(`Found pending topics/conversations: ${JSON.stringify(pendingTopics)}`);

    const replies = [];
    let stopSearching = false;

    // We use a for loop here because we can break on finding a reply.
    // The error is our escape hatch when we have a reply WITH data.
    for (let i = 0; i < pendingTopics.length && !stopSearching; ++i) {
      const topic = pendingTopics[i];
      let unfilteredMatches = yield topicItorHandle(topic, messageObject, options);

      // Remove the empty topics, and flatten the array down.
      unfilteredMatches = _lodash2.default.flatten(_lodash2.default.filter(unfilteredMatches, function (n) {
        return n;
      }));

      debug.info('Matching unfiltered gambits are: ');
      unfilteredMatches.forEach(function (match) {
        debug.info(`Trigger: ${match.gambit.input}`);
        debug.info(`Replies: ${match.gambit.replies.map(function (reply) {
          return reply.reply;
        }).join('\n')}`);
      });

      for (let j = 0; j < unfilteredMatches.length && !stopSearching; ++j) {
        const match = unfilteredMatches[j];
        const reply = yield matchItorHandle(match, messageObject, options);

        if (!_lodash2.default.isEmpty(reply)) {
          replies.push(reply);
          if (reply.continueMatching === false) {
            debug.info('Continue matching is set to false: returning.');
            stopSearching = true;
          } else if (reply.continueMatching === true || reply.reply.reply === '') {
            debug.info('Continue matching is set to true or reply is empty: continuing.');
          } else {
            debug.info('Reply is not empty: returning.');
            stopSearching = true;
          }
        }
      }
    }

    return replies;
  });

  function findMatches(_x4, _x5, _x6) {
    return _ref2.apply(this, arguments);
  }

  return findMatches;
})();

// Topic iterator, we call this on each topic or conversation reply looking for a match.
// All the matches are stored and returned in the callback.
const topicItorHandle = (() => {
  var _ref3 = _asyncToGenerator(function* (topicData, messageObject, options) {
    const system = options.system;

    if (topicData.type === 'TOPIC') {
      const topic = yield system.chatSystem.Topic.findById(topicData.id, '_id name filter gambits').populate({ path: 'gambits', populate: { path: 'replies' } }).lean().exec();
      if (topic) {
        // We do realtime post processing on the input against the user object
        if (topic.filter) {
          debug.verbose(`Topic filter function found: ${topic.filter}`);

          const filterScope = _lodash2.default.merge({}, system.scope);
          filterScope.user = options.user;
          filterScope.message = messageObject;
          filterScope.topic = topic;
          filterScope.message_props = options.system.extraScope;

          try {
            var _ref4 = yield _utils2.default.runPluginFunc(topic.filter, filterScope, system.plugins),
                _ref5 = _slicedToArray(_ref4, 1);

            const filterReply = _ref5[0];

            if (filterReply === 'true' || filterReply === true) {
              return false;
            }
          } catch (err) {
            console.error(err);
            return false;
          }
        }

        options.topic = topic.name;
        return _helpers2.default.findMatchingGambitsForMessage('topic', topic, messageObject, options);
      }
      // We call back if there is no topic Object
      // Non-existant topics return false
      return false;
    } else if (topicData.type === 'REPLY') {
      const reply = yield system.chatSystem.Reply.findById(topicData.id, '_id name filter gambits').populate({ path: 'gambits', populate: { path: 'replies' } }).lean().exec();
      debug.verbose('Conversation reply thread: ', reply);
      if (reply) {
        return _helpers2.default.findMatchingGambitsForMessage('reply', reply, messageObject, options);
      }
      return false;
    }

    debug.verbose("We shouldn't hit this! 'topicData.type' should be 'TOPIC' or 'REPLY'");
    return false;
  });

  function topicItorHandle(_x7, _x8, _x9) {
    return _ref3.apply(this, arguments);
  }

  return topicItorHandle;
})();

// Iterates through matched gambits
const matchItorHandle = (() => {
  var _ref6 = _asyncToGenerator(function* (match, message, options) {
    const system = options.system;
    options.message = message;

    debug.verbose('Match itor: ', match.gambit);

    const topic = yield _helpers2.default.getRootTopic(match.gambit, system.chatSystem);

    let stars = match.stars;
    if (!_lodash2.default.isEmpty(message.stars)) {
      stars = message.stars;
    }

    const potentialReplies = [];

    for (let i = 0; i < match.gambit.replies.length; i++) {
      const reply = match.gambit.replies[i];
      const replyData = {
        id: reply.id,
        topic: topic.name,
        stars,
        reply,

        // For the logs
        trigger: match.gambit.input,
        trigger_id: match.gambit.id,
        trigger_id2: match.gambit._id
      };
      potentialReplies.push(replyData);
    }

    // Find a reply for the match.
    let filtered = yield (0, _filterFunction2.default)(potentialReplies, options);
    filtered = yield (0, _filterSeen2.default)(filtered, options);

    const pickScheme = match.gambit.reply_order;

    debug.verbose('Filtered Results', filtered);
    debug.verbose('Pick Scheme:', pickScheme);

    debug.verbose('Default Keep', options.system.defaultKeepScheme);
    debug.verbose('Topic Keep', topic.reply_exhaustion);
    debug.verbose('Gambit Keep', match.gambit.reply_exhaustion);

    let keepScheme = options.system.defaultKeepScheme;
    if (match.gambit.reply_exhaustion) {
      keepScheme = match.gambit.reply_exhaustion;
    } else if (topic.reply_exhaustion) {
      keepScheme = topic.reply_exhaustion;
    }

    let filteredNew = [];
    debug.verbose('Using KeepScheme', keepScheme);

    if (keepScheme === 'exhaust' || keepScheme === 'reload') {
      filteredNew = _lodash2.default.filter(filtered, function (reply) {
        return reply.seenCount === 0 || reply.reply.keep;
      });
    }

    // We reload the replies if we have nothing else to show.
    if (keepScheme === 'reload' && _lodash2.default.isEmpty(filteredNew)) {
      debug.verbose('Reloading Replies');
      filteredNew = filtered;
    } else if (keepScheme === 'keep') {
      filteredNew = filtered;
    }

    // Orderd or Random
    const picked = pickScheme === 'ordered' ? filteredNew.shift() : _utils2.default.pickItem(filteredNew);

    // If we have an item lets use it, otherwise retutn null and keep matching.
    debug.verbose('Picked', picked);
    return picked ? (0, _processReplyTags2.default)(picked, options) : null;
  });

  function matchItorHandle(_x10, _x11, _x12) {
    return _ref6.apply(this, arguments);
  }

  return matchItorHandle;
})();

const afterHandle = function afterHandle(matches) {
  debug.verbose(`Set of matches: ${matches}`);

  const debugAll = [];
  let props = {};
  let clearConversation = false;
  let lastTopicToMatch = null;
  let lastStarSet = null;
  let lastReplyId = null;
  let replyString = '';
  let lastSubReplies = null;
  let lastContinueMatching = null;
  let lastReplyIds = null;

  matches.forEach(match => {
    const debugMatch = {
      topic: match.matched_topic_string || match.topic,
      input: match.trigger,
      reply: match.matched_reply_string
    };

    if (!_lodash2.default.isEmpty(match.debug)) {
      debugMatch.subset = match.debug;
    } else {
      debugMatch.output = match.reply.reply;
    }

    debugAll.push(debugMatch);

    if (match.reply && match.reply.reply) {
      if (replyString === '') {
        replyString += `${match.reply.reply}`;
      } else {
        replyString += ` ${match.reply.reply}`;
      }
    }

    props = _lodash2.default.assign(props, match.props);
    lastTopicToMatch = match.topic;
    lastStarSet = match.stars;
    lastReplyId = match.reply._id;
    lastSubReplies = match.subReplies;
    lastContinueMatching = match.continueMatching;
    lastReplyIds = match.replyIds;

    if (match.clearConversation) {
      clearConversation = match.clearConversation;
    }
  });

  let threadsArr = [];
  if (_lodash2.default.isEmpty(lastSubReplies)) {
    threadsArr = _processTags2.default.processThreadTags(replyString);
  } else {
    threadsArr[0] = replyString;
    threadsArr[1] = lastSubReplies;
  }

  const data = {
    replyId: lastReplyId,
    replyIds: lastReplyIds,
    props,
    clearConversation,
    topicName: lastTopicToMatch,
    debug: debugAll,
    string: threadsArr[0],
    subReplies: threadsArr[1],
    stars: lastStarSet,
    continueMatching: lastContinueMatching
  };

  debug.verbose('afterHandle', data);

  return data;
};

exports.default = getReply;