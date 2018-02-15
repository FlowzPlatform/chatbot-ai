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

var _modelNames = require('../modelNames');

var _modelNames2 = _interopRequireDefault(_modelNames);

var _utils = require('../../utils');

var _utils2 = _interopRequireDefault(_utils);

var _sort = require('../sort');

var _sort2 = _interopRequireDefault(_sort);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const createReplyModel = function createReplyModel(db) {
  const replySchema = new _mongoose2.default.Schema({
    id: { type: String, index: true, default: _utils2.default.genId() },
    reply: { type: String, required: '{reply} is required.' },
    keep: { type: Boolean, default: false },
    filter: { type: String, default: '' },
    parent: { type: String, ref: _modelNames2.default.gambit },

    // Replies could referece other gambits
    // This forms the basis for the 'previous' - These are Children
    gambits: [{ type: String, ref: _modelNames2.default.gambit }]
  });

  replySchema.methods.sortGambits = function sortGambits(callback) {
    const self = this;
    const expandReorder = (gambitId, cb) => {
      db.model(_modelNames2.default.gambit).byTenant(this.getTenantId()).findById(gambitId, (err, gambit) => {
        cb(err, gambit);
      });
    };

    _async2.default.map(this.gambits, expandReorder, (err, newGambitList) => {
      if (err) {
        console.log(err);
      }

      const newList = _sort2.default.sortTriggerSet(newGambitList);
      self.gambits = newList.map(g => g._id);
      self.save(callback);
    });
  };

  replySchema.plugin(_mongoTenant2.default);

  return db.model(_modelNames2.default.reply, replySchema);
};

exports.default = createReplyModel;