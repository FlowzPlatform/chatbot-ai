'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _debugLevels = require('debug-levels');

var _debugLevels2 = _interopRequireDefault(_debugLevels);

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _mongoTenant = require('mongo-tenant');

var _mongoTenant2 = _interopRequireDefault(_mongoTenant);

var _modelNames = require('../modelNames');

var _modelNames2 = _interopRequireDefault(_modelNames);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _asyncToGenerator(fn) { return function () { var gen = fn.apply(this, arguments); return new Promise(function (resolve, reject) { function step(key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { return Promise.resolve(value).then(function (value) { step("next", value); }, function (err) { step("throw", err); }); } } return step("next"); }); }; }

const debug = (0, _debugLevels2.default)('SS:User');

const createUserModel = function createUserModel(db, factSystem, logger) {
  const userSchema = _mongoose2.default.Schema({
    id: String,
    currentTopic: { type: String, default: 'random' },
    pendingTopic: String,
    lastMessageSentAt: Date,
    prevAns: Number,
    conversationState: Object,
    history: [{
      input: Object,
      reply: Object,
      topic: Object,
      stars: Object
    }]
  });

  userSchema.pre('save', function (next) {
    debug.verbose('Pre-Save Hook');
    // save a full log of user conversations, but just in case a user has a
    // super long conversation, don't take up too much storage space
    this.history = this.history.slice(0, 500);
    next();
  });

  userSchema.methods.clearConversationState = function (callback) {
    this.conversationState = {};
    this.save(callback);
  };

  userSchema.methods.setTopic = (() => {
    var _ref = _asyncToGenerator(function* (topic = '') {
      debug.verbose('Set topic', topic);

      if (topic === '') {
        debug.warn('Trying to set topic to something invalid');
        return;
      }

      this.pendingTopic = topic;
      yield this.save();
      debug.verbose('Set topic Complete');
    });

    return function () {
      return _ref.apply(this, arguments);
    };
  })();

  userSchema.methods.getTopic = function () {
    debug.verbose('getTopic', this.currentTopic);
    return this.currentTopic;
  };

  userSchema.methods.updateHistory = function (message, reply, cb) {
    if (!_lodash2.default.isNull(message)) {
      this.lastMessageSentAt = Date.now();
    }

    const log = {
      user_id: this.id,
      raw_input: message.original,
      normalized_input: message.clean,
      matched_gambit: reply.debug,
      final_output: reply.original,
      timestamp: message.createdAt
    };

    const cleanId = this.id.replace(/\W/g, '');
    logger.log(`${JSON.stringify(log)}\r\n`, `${cleanId}_trans.txt`);

    debug.verbose('Updating History');

    const stars = reply.stars;

    const messageToSave = {
      original: message.original,
      clean: message.clean,
      timestamp: message.createdAt
    };

    reply.createdAt = Date.now();

    this.history.unshift({
      stars,
      input: messageToSave,
      reply,
      topic: this.currentTopic
    });

    if (this.pendingTopic !== undefined && this.pendingTopic !== '') {
      const pendingTopic = this.pendingTopic;
      this.pendingTopic = null;

      db.model(_modelNames2.default.topic).byTenant(this.getTenantId()).findOne({ name: pendingTopic }, (err, topicData) => {
        if (topicData && topicData.nostay === true) {
          this.currentTopic = this.history[0].topic;
        } else {
          this.currentTopic = pendingTopic;
        }
        this.save(err => {
          if (err) {
            console.error(err);
          }
          debug.verbose('Saved user');
          cb(err, log);
        });
      });
    } else {
      cb(null, log);
    }
  };

  userSchema.methods.getVar = function (key, cb) {
    debug.verbose('getVar', key);

    this.memory.db.get({ subject: key, predicate: this.id }, (err, res) => {
      if (res && res.length !== 0) {
        cb(err, res[0].object);
      } else {
        cb(err, null);
      }
    });
  };

  userSchema.methods.setVar = function (key, value, cb) {
    debug.verbose('setVar', key, value);
    const self = this;

    self.memory.db.get({ subject: key, predicate: self.id }, (err, results) => {
      if (err) {
        console.log(err);
      }

      if (!_lodash2.default.isEmpty(results)) {
        self.memory.db.del(results[0], () => {
          const opt = { subject: key, predicate: self.id, object: value };
          self.memory.db.put(opt, () => {
            cb();
          });
        });
      } else {
        const opt = { subject: key, predicate: self.id, object: value };
        self.memory.db.put(opt, err2 => {
          if (err2) {
            console.log(err2);
          }

          cb();
        });
      }
    });
  };

  userSchema.plugin(_mongoTenant2.default);

  userSchema.virtual('memory').get(function () {
    return factSystem.getFactSystem(this.getTenantId()).createUserDB(this.id);
  });

  return db.model(_modelNames2.default.user, userSchema);
};

exports.default = createUserModel;