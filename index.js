#!/usr/bin/env node

var Promise = this.Promise || require('rsvp').Promise;
var mversion = require('mversion');
var semver = require('semver');
var fs = require('fs');
var bowerJson = require('bower-json');
var argv = require('minimist')(process.argv);

var polymerVersion = argv.P || argv['polymer-version'];
var bump = argv.b || argv['bump'];

function getBowerJsonPath (directory) {
  directory = directory || process.cwd();

  return new Promise(function(resolve, reject) {
    bowerJson.find(directory, function(err, filename) {
      if (err) {
        reject(err);
      } else {
        resolve(filename);
      }
    });
  });
}

function readJson (path) {
  return new Promise(function(resolve, reject) {
    fs.readFile(path, function(err, contents) {
      if (err) {
        reject(err);
      } else {
        try {
          resolve(JSON.parse(contents.toString()));
        } catch (e) {
          reject(e);
        }
      }
    });
  });
}

function writeObject (path, object) {
  return new Promise(function(resolve, reject) {
    var contents;

    try {
      contents = JSON.stringify(object, null, '  ');
    } catch (e) {
      reject(e);
      return;
    }

    fs.writeFile(path, contents, function (err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    })
  });
}

function bumpVersion () {
  return new Promise(function(resolve, reject) {
    mversion.update({
      version: 'patch'
    }, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
}

function setPolymerVersion(object, version) {
  var dependencies;

  if (!object || !version) {
    return;
  }

  dependencies = object.dependencies = object.dependencies || {};
  dependencies.polymer = 'polymer/polymer#' + version;
}


getBowerJsonPath().then(function (path) {
  return readJson(path).then(function (object) {

    setPolymerVersion(object, polymerVersion);

    return writeObject(path, object);
  }).then(function() {
    if (bump) {
      return bumpVersion();
    }
  });
}).then(function () {
  console.log('Successfully updated bower.json');
}).catch(function (error) {
  console.error(error);
});
