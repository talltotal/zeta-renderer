#!/usr/bin/env node
var commander = require('commander')
var _ = require('lodash')
var pjson = require('../package.json')

var renderer = require('../lib')

var env = process.env.NODE_ENV || 'dev'

var configFilePath = 'renderer.json'
var port = 8080

if (env !== 'test') {
  commander.version('renderer version: ' + pjson.version)
    .usage('[options] [file], file default: renderer.json')
    .option('-p, --port [port]', 'Use the specified port, will override port config in config.json.')
  commander.on('--help', function () {
    console.log('  Examples:')
    console.log('')
    console.log('    $ renderer')
    console.log('    $ renderer config.json')
    console.log('    $ renderer -p 8000')
  })
  commander.parse(process.argv)
  if (!_.isEmpty(commander.args)) {
    configFilePath = commander.args[0]
  }
  if (commander.port !== void 0) {
    port = parseInt(commander.port)
    if (_.isNaN(port)) {
      commander.help()
    }
  }
}

renderer({ port, configFilePath })
