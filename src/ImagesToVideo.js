const path = require('path');
const { spawn } = require('child_process');
const { exec } = require('child_process');


/**
 * Gets the FFMPEG concat input commands.
 * @param  {Array<String>} images List of image files to concat.
 * @param {String?} frameDelay FFMPEG frame delay between each.
 * @return {String} The ffmpeg concat commands.
 */
function getConcatInput(images, frameDelay) {
  var command = "";
  for(var image of images) {
    command += `file '${image}'\n`;

    if(frameDelay) {
      command += `duration ${frameDelay}\n`;
    }
  }

  return command;
}

/**
 * Concatenates a list of videos.
 * @param  {Array<String>} videos   A list of videos.
 * @param  {String} path     The root output path of the video.
 * @param  {String} filename The output filename of the video.
 */
function concatenateVideos(videos, root, filename) {
  //ffmpeg -f concat -safe 0 -i mylist.txt -c copy output
  return new Promise((resolve, reject) => {
    var outputPath = path.format({
      root:root,
      name:filename
    });

    var concatInput = getConcatInput(videos);
    var child = exec(`ffmpeg -f concat -safe 0 -protocol_whitelist "file,pipe" -i pipe: -c:v libx264 -y ${outputPath}`, [0, 1, 2, 'ipc', 'pipe']);

    console.log(`Rendering video collage ${filename}.`);
    child.stdin.setEncoding('utf-8');
    child.stdin.write(concatInput);
    child.stdin.end();
    child.on('exit', function (code, signal) {
      console.log(`Finished rendering video collage ${filename}.`);
      resolve(outputPath);
    });
  });
}

/**
 * Converts a list of images to a video.
 * @param  {Array<String>} images   A list of images.
 * @param  {String} path     The root output path of the video.
 * @param  {String} filename The output filename of the video.
 */
function convertImagesToVideo(images, root, filename) {
  return new Promise((resolve, reject) => {
    var outputPath = path.format({
      root:root,
      name:filename
    });

    var concatInput = getConcatInput(images);
    var child = exec(`ffmpeg -f concat -safe 0 -protocol_whitelist "file,pipe" -r 15 -i pipe: -pix_fmt yuv420p -filter "minterpolate='fps=30'" -y ${outputPath}`, [0, 1, 2, 'ipc', 'pipe']);

    console.log(`Rendering ${filename}.`);
    child.stdin.setEncoding('utf-8');
    child.stdin.write(concatInput);
    child.stdin.end();
    child.on('exit', function (code, signal) {
      console.log(`Finished rendering ${filename}.`);
      resolve(outputPath);
    });
  });
}

module.exports = {
  convertImagesToVideo,
  concatenateVideos
};
