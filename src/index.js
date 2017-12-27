#!/usr/bin/env node
const commandLineArgs = require('command-line-args');
const getUsage = require('command-line-usage');
const timelapse = require('./Timelapse');

// Pull in the options.
const options = commandLineArgs(timelapse.optionDefinitions);

// Check to see if the options should be printed out.
if(options.help || process.argv.length <= 2) {
  // Generate the usage documentation.
  const usage = getUsage([
    {
      header: 'Node.js Command Line Timelapse Stitcher',
      content: 'This is a command line interface that works with a pre-installed ' +
      'version of ffmpeg. It is useful for optimally and easily stitching together ' +
      'many images into one big timelapse.'
    },
    {
      header: 'Options',
      optionList: optionDefinitions
    },
    {
      content: 'Project home: [underline]{https://github.com/malbanese/node-cli-timelapse-stitcher}'
    }
  ])

  console.log(usage);
  return;
}

timelapse.renderTimelapse(options);
