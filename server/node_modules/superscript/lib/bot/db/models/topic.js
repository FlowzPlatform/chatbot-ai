'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _mongoose = require('mongoose');

var _mongoose2 = _interopRequireDefault(_mongoose);

var _mongoTenant = require('mongo-tenant');

var _mongoTenant2 = _interopRequireDefault(_mongoTenant);

var _async = require('async');

var _async2 = _interopRequireDefault(_async);

var _debugLevels = require('debug-levels');

var _debugLevels2 = _interopRequireDefault(_debugLevels);

var _modelNames = require('../modelNames');

var _modelNames2 = _interopRequireDefault(_modelNames);

var _sort = require('../sort');

var _sort2 = _interopRequireDefault(_sort);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
  Topics are a grouping of gambits.
  The order of the Gambits are important, and a gambit can live in more than one topic.
**/

const debug = (0, _debugLevels2.default)('SS:Topics');

const createTopicModel = function createTopicModel(db) {
  const topicSchema = new _mongoose2.default.Schema({
    name: { type: String, index: true, unique: true },

    system: { type: Boolean, default: false },
    nostay: { type: Boolean, default: false },
    filter: { type: String, default: '' },
    keywords: { type: Array },

    // How we choose gambits can be `random` or `ordered`
    reply_order: { type: String, default: 'random' },

    // How we handle the reply exhaustion can be `keep` or `exhaust`
    reply_exhaustion: { type: String },

    gambits: [{ type: String, ref: _modelNames2.default.gambit }]
  });

  // This will create the Gambit and add it to the model
  topicSchema.methods.createGambit = function (gambitData, callback) {
    if (!gambitData) {
      return callback('No data');
    }

    const Gambit = db.model(_modelNames2.default.gambit).byTenant(this.getTenantId());
    const gambit = new Gambit(gambitData);
    gambit.save(err => {
      if (err) {
        return callback(err);
      }
      this.gambits.addToSet(gambit._id);
      this.save(err => {
        callback(err, gambit);
      });
    });
  };

  topicSchema.methods.sortGambits = function (callback) {
    const expandReorder = (gambitId, cb) => {
      db.model(_modelNames2.default.gambit).byTenant(this.getTenantId()).findById(gambitId, (err, gambit) => {
        if (err) {
          console.log(err);
        }
        cb(null, gambit);
      });
    };

    _async2.default.map(this.gambits, expandReorder, (err, newGambitList) => {
      if (err) {
        console.log(err);
      }

      const newList = _sort2.default.sortTriggerSet(newGambitList);
      this.gambits = newList.map(gambit => gambit._id);
      this.save(callback);
    });
  };

  topicSchema.methods.clearGambits = function (callback) {
    const clearGambit = (gambitId, cb) => {
      this.gambits.pull({ _id: gambitId });
      db.model(_modelNames2.default.gambit).byTenant(this.getTenantId()).findById(gambitId, (err, gambit) => {
        if (err) {
          debug.error(err);
        }

        gambit.clearReplies(() => {
          db.model(_modelNames2.default.gambit).byTenant(this.getTenantId()).remove({ _id: gambitId }, err => {
            if (err) {
              debug.error(err);
            }

            debug.verbose('removed gambit %s', gambitId);

            cb(null, gambitId);
          });
        });
      });
    };

    _async2.default.map(this.gambits, clearGambit, (err, clearedGambits) => {
      this.save(err => {
        callback(err, clearedGambits);
      });
    });
  };

  topicSchema.statics.findByName = function (name, callback) {
    this.findOne({ name }, {}, callback);
  };

  topicSchema.plugin(_mongoTenant2.default);

  return db.model(_modelNames2.default.topic, topicSchema);
};

exports.default = createTopicModel;