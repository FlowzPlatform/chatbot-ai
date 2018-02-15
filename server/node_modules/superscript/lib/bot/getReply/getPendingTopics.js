'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.findPendingTopicsForUser = undefined;

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _debugLevels = require('debug-levels');

var _debugLevels2 = _interopRequireDefault(_debugLevels);

var _natural = require('natural');

var _natural2 = _interopRequireDefault(_natural);

var _helpers = require('./helpers');

var _helpers2 = _interopRequireDefault(_helpers);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const debug = (0, _debugLevels2.default)('SS:Topics');

const TfIdf = _natural2.default.TfIdf;

_natural2.default.PorterStemmer.attach();

// Function to score the topics by TF-IDF
const scoreTopics = function scoreTopics(message, tfidf) {
  let topics = [];
  const tasMessage = message.lemString.tokenizeAndStem();
  debug.verbose('Tokenised and stemmed words: ', tasMessage);

  // Score the input against the topic keywords to come up with a topic order.
  tfidf.tfidfs(tasMessage, (index, score, name) => {
    // Filter out system topic pre/post
    if (name !== '__pre__' && name !== '__post__') {
      topics.push({ name, score, type: 'TOPIC' });
    }
  });

  // Removes duplicate entries.
  topics = _lodash2.default.uniqBy(topics, 'name');

  const topicOrder = _lodash2.default.sortBy(topics, 'score').reverse();
  debug.verbose('Scored topics: ', topicOrder);

  return topicOrder;
};

const removeMissingTopics = function removeMissingTopics(topics) {
  return _lodash2.default.filter(topics, topic => topic.id);
};

const findConversationTopics = (() => {
  var _ref = _asyncToGenerator(function* (pendingTopics, user, chatSystem, conversationTimeout) {
    if (user.history.length === 0) {
      return pendingTopics;
    }

    // If we are currently in a conversation, we want the entire chain added
    // to the topics to search
    const lastReply = user.history[0].reply;
    if (!_lodash2.default.isEmpty(lastReply)) {
      // If the message is less than _ minutes old we continue
      const delta = Date.now() - lastReply.createdAt;
      if (delta <= conversationTimeout) {
        debug.verbose(`Last reply string: ${lastReply.original}`);
        debug.verbose(`Last reply sequence: ${lastReply.replyIds}`);
        debug.verbose(`Clear conversation: ${lastReply.clearConversation}`);

        if (lastReply.clearConversation) {
          debug.verbose('Conversation RESET since clearConversation was true');
          return pendingTopics;
        }

        const replies = yield chatSystem.Reply.find({ _id: { $in: lastReply.replyIds } }).lean().exec();
        if (replies === []) {
          debug.verbose("We couldn't match the last reply. Continuing.");
          return pendingTopics;
        }

        let replyThreads = [];

        yield Promise.all(replies.map((() => {
          var _ref2 = _asyncToGenerator(function* (reply) {
            const threads = yield _helpers2.default.walkReplyParent(reply._id, chatSystem);
            debug.verbose(`Threads found by walkReplyParent: ${threads}`);
            threads.forEach(function (thread) {
              return replyThreads.push(thread);
            });
          });

          return function (_x5) {
            return _ref2.apply(this, arguments);
          };
        })()));

        replyThreads = replyThreads.map(function (item) {
          return { id: item, type: 'REPLY' };
        });
        // This inserts the array replyThreads into pendingTopics after the first topic
        pendingTopics.splice(1, 0, ...replyThreads);
        return pendingTopics;
      }

      debug.info('The conversation thread was to old to continue it.');
      return pendingTopics;
    }
  });

  function findConversationTopics(_x, _x2, _x3, _x4) {
    return _ref.apply(this, arguments);
  }

  return findConversationTopics;
})();

const findPendingTopicsForUser = exports.findPendingTopicsForUser = (() => {
  var _ref3 = _asyncToGenerator(function* (user, message, chatSystem, conversationTimeout) {
    const allTopics = yield chatSystem.Topic.find({}).lean().exec();

    const tfidf = new TfIdf();

    allTopics.forEach(function (topic) {
      const keywords = topic.keywords.join(' ');
      if (keywords) {
        tfidf.addDocument(keywords.tokenizeAndStem(), topic.name);
      }
    });

    const scoredTopics = scoreTopics(message, tfidf);

    const currentTopic = user.getTopic();

    // Add the current topic to the front of the array.
    scoredTopics.unshift({ name: currentTopic, type: 'TOPIC' });

    let otherTopics = _lodash2.default.map(allTopics, function (topic) {
      return { id: topic._id, name: topic.name, system: topic.system };
    });

    // This gets a list if all the remaining topics.
    otherTopics = _lodash2.default.filter(otherTopics, function (topic) {
      return !_lodash2.default.find(scoredTopics, { name: topic.name });
    });

    // We remove the system topics
    otherTopics = _lodash2.default.filter(otherTopics, function (topic) {
      return topic.system === false;
    });

    const pendingTopics = [];
    pendingTopics.push({ name: '__pre__', type: 'TOPIC' });

    for (let i = 0; i < scoredTopics.length; i++) {
      if (scoredTopics[i].name !== '__pre__' && scoredTopics[i].name !== '__post__') {
        pendingTopics.push(scoredTopics[i]);
      }
    }

    // Search random as the highest priority after current topic and pre
    if (!_lodash2.default.find(pendingTopics, { name: 'random' }) && _lodash2.default.find(otherTopics, { name: 'random' })) {
      pendingTopics.push({ name: 'random', type: 'TOPIC' });
    }

    for (let i = 0; i < otherTopics.length; i++) {
      if (otherTopics[i].name !== '__pre__' && otherTopics[i].name !== '__post__') {
        otherTopics[i].type = 'TOPIC';
        pendingTopics.push(otherTopics[i]);
      }
    }

    pendingTopics.push({ name: '__post__', type: 'TOPIC' });

    debug.verbose(`Pending topics before conversations: ${JSON.stringify(pendingTopics, null, 2)}`);

    // Lets assign the ids to the topics
    for (let i = 0; i < pendingTopics.length; i++) {
      const topicName = pendingTopics[i].name;
      for (let n = 0; n < allTopics.length; n++) {
        if (allTopics[n].name === topicName) {
          pendingTopics[i].id = allTopics[n]._id;
        }
      }
    }

    const allFoundTopics = yield findConversationTopics(pendingTopics, user, chatSystem, conversationTimeout);
    return removeMissingTopics(allFoundTopics);
  });

  function findPendingTopicsForUser(_x6, _x7, _x8, _x9) {
    return _ref3.apply(this, arguments);
  }

  return findPendingTopicsForUser;
})();

const getPendingTopics = (() => {
  var _ref4 = _asyncToGenerator(function* (messageObject, options) {
    // We already have a pre-set list of potential topics from directReply, respond or topicRedirect
    if (!_lodash2.default.isEmpty(_lodash2.default.reject(options.pendingTopics, _lodash2.default.isNull))) {
      debug.verbose('Using pre-set topic list via directReply, respond or topicRedirect');
      debug.info('Topics to check: ', options.pendingTopics.map(function (topic) {
        return topic.name;
      }));
      return options.pendingTopics;
    }

    // Find potential topics for the response based on the message (tfidfs)
    return findPendingTopicsForUser(options.user, messageObject, options.system.chatSystem, options.system.conversationTimeout);
  });

  function getPendingTopics(_x10, _x11) {
    return _ref4.apply(this, arguments);
  }

  return getPendingTopics;
})();

exports.default = getPendingTopics;