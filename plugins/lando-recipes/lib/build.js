'use strict';

// Modules
const _ = require('lodash');
const path = require('path');
const utils = require('./../../../lib/utils');

// Helper to kill a run
const killRun = config => ({
  id: config.id,
  compose: config.compose,
  project: config.project,
  opts: {
    purge: true,
    mode: 'attach',
  },
});

// Helper to get a build array of run thingz
exports.buildRun = (configs, defaults = {}) => _(configs)
  .map(config => _.merge({}, defaults, config))
  .map(config => ({
    id: config.id,
    compose: config.compose,
    project: config.project,
    cmd: config.cmd,
    opts: {
      mode: 'attach',
      user: config.user,
      services: ['init'],
      autoRemove: true,
    },
  }))
  .value();

// Helper to run
exports.run = (lando, run) => lando.engine.run(run).catch(err => {
  return lando.engine.stop(killRun(run))
  .then(() => lando.engine.destroy(killRun(run)))
  .then(() => lando.Promise.reject(err));
});

// Helper to get run defaults
exports.runDefaults = (lando, options) => {
  // Handle all the compose stuff
  const LandoUtil = lando.factory.get('_init');
  const utilData = new LandoUtil(lando.config.userConfRoot, lando.config.home, options.destination);
  const utilDir = path.join(lando.config.userConfRoot, 'init', options.name);
  const utilFiles = lando.utils.dumpComposeData(utilData, utilDir);
  // Start to build out some propz and shiz
  const project = 'landoinit' + _.uniqueId(utils.dockerComposify(options.name));
  // Return
  return {
    id: `${project}_init_1`,
    project,
    user: 'www-data',
    compose: utilFiles,
  };
};
