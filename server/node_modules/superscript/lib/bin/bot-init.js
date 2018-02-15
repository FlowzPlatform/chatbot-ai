#!/usr/bin/env node
'use strict';

var _commander = require('commander');

var _commander2 = _interopRequireDefault(_commander);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

_commander2.default.version('1.0.0').usage('botname [options]').option('-c, --clients [telnet]', 'Bot clients (express, hangout, slack, telegram, telnet, twilio) [default: telnet]', 'telnet').parse(process.argv);

if (!_commander2.default.args[0]) {
  _commander2.default.help();
  process.exit(1);
}

const botName = _commander2.default.args[0];
const botPath = _path2.default.join(process.cwd(), botName);
const ssRoot = _path2.default.join(__dirname, '..', '..');

const write = function write(path, str, mode = 0o666) {
  _fs2.default.writeFileSync(path, str, { mode });
  console.log(`   \x1b[36mcreate\x1b[0m : ${path}`);
};

// Creating the path for your bot.
_fs2.default.mkdir(botPath, err => {
  if (err && err.code === 'EEXIST') {
    console.error(`\n\nThere is already a bot named ${botName} at ${botPath}.\nPlease remove it or pick a new name for your bot before continuing.\n`);
    process.exit(1);
  } else if (err) {
    console.error(`We could not create the bot: ${err}`);
    process.exit(1);
  }

  _fs2.default.mkdirSync(_path2.default.join(botPath, 'chat'));
  _fs2.default.mkdirSync(_path2.default.join(botPath, 'plugins'));
  _fs2.default.mkdirSync(_path2.default.join(botPath, 'src'));

  // package.json
  const pkg = {
    name: botName,
    version: '0.0.0',
    private: true,
    dependencies: {
      superscript: '^1.0.0'
    },
    devDependencies: {
      'babel-cli': '^6.16.0',
      'babel-preset-es2015': '^6.16.0'
    },
    scripts: {
      build: 'babel src --presets babel-preset-es2015 --out-dir lib'
    }
  };

  const clients = _commander2.default.clients.split(',');

  clients.forEach(client => {
    const clientName = client.toLowerCase();

    if (['express', 'hangout', 'slack', 'telegram', 'telnet', 'twilio'].indexOf(clientName) === -1) {
      console.log(`Cannot create bot with client type: ${clientName}`);
      return;
    }

    console.log(`Creating ${_commander2.default.args[0]} bot with a ${clientName} client.`);

    // TODO: Pull out plugins that have dialogue and move them to the new bot.
    _fs2.default.createReadStream(_path2.default.join(ssRoot, 'clients', `${clientName}.js`)).pipe(_fs2.default.createWriteStream(_path2.default.join(botPath, 'src', `server-${clientName}.js`)));

    pkg.scripts.parse = 'parse -f';
    pkg.scripts[`start-${clientName}`] = `npm run build && node lib/server-${clientName}.js`;

    if (client === 'express') {
      pkg.dependencies.express = '4.x';
      pkg.dependencies['body-parser'] = '1.x';
    } else if (client === 'hangout') {
      pkg.dependencies['simple-xmpp'] = '1.x';
    } else if (client === 'slack') {
      pkg.dependencies['slack-client'] = '1.x';
    } else if (client === 'telegram') {
      pkg.dependencies['node-telegram-bot-api'] = '0.25.x';
    } else if (client === 'twilio') {
      pkg.dependencies.express = '4.x';
      pkg.dependencies['express-session'] = '1.x';
      pkg.dependencies['body-parser'] = '1.x';
      pkg.dependencies['connect-mongo'] = '1.x';
      pkg.dependencies.twilio = '2.x';
    }
  });

  const firstRule = "+ {^hasTag('hello')} *~2\n- Hi!\n- Hi, how are you?\n- How are you?\n- Hello\n- Howdy\n- Ola";

  write(_path2.default.join(botPath, 'package.json'), JSON.stringify(pkg, null, 2));
  write(_path2.default.join(botPath, 'chat', 'main.ss'), firstRule);
});