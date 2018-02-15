'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _gambit = require('./db/models/gambit');

var _gambit2 = _interopRequireDefault(_gambit);

var _reply = require('./db/models/reply');

var _reply2 = _interopRequireDefault(_reply);

var _topic = require('./db/models/topic');

var _topic2 = _interopRequireDefault(_topic);

var _user = require('./db/models/user');

var _user2 = _interopRequireDefault(_user);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
  I want to create a more organic approach to authoring new gambits, topics and replies.
  Right now, the system parses flat files to a intermediate JSON object that SS reads and
  creates an in-memory topic representation.

  I believe by introducing a Topic DB with a clean API we can have a faster more robust authoring
  expierence parseing input will become more intergrated into the topics, and Im propising
  changing the existing parse inerface with a import/export to make sharing SuperScript
  data (and advanced authoring?) easier.

  We also want to put more focus on the Gambit, and less on topics. A Gambit should be
  able to live in several topics.
 */

const setupChatSystem = function setupChatSystem(db, coreFactSystem, logger) {
  const GambitCore = (0, _gambit2.default)(db, coreFactSystem);
  const ReplyCore = (0, _reply2.default)(db);
  const TopicCore = (0, _topic2.default)(db);
  const UserCore = (0, _user2.default)(db, coreFactSystem, logger);

  const getChatSystem = function getChatSystem(tenantId = 'master') {
    const Gambit = GambitCore.byTenant(tenantId);
    const Reply = ReplyCore.byTenant(tenantId);
    const Topic = TopicCore.byTenant(tenantId);
    const User = UserCore.byTenant(tenantId);

    return {
      Gambit,
      Reply,
      Topic,
      User
    };
  };

  return { getChatSystem };
};

exports.default = {
  setupChatSystem
};