// Native
const path = require('path');
const {promisify} = require('util');
const {exec} = require('child_process');

// Packages
const fs = require('fs-extra');
const semver = require('semver');
const {bold} = require('chalk');

// Utilities
const {fail, create: createSpinner} = require('./spinner');

const getVersion = text => ({version: text.split('"')[1]})

const increment = async (type, preSuffix) => {
  const pkgPath = path.join(process.cwd(), 'build.gradle.kts');

  if (!fs.existsSync(pkgPath)) {
    throw new Error(`The "build.gradle.kts" file doesn't exist`);
  }

  let pkgContent;

  try {
    pkg = await fs.readFile(pkgPath, {encoding: 'utf8'});
    pkgContent = getVersion(pkg.split('\n').find(text => text.includes('version = "')));
  } catch (err) {
    console.error(err)
    throw new Error(`Couldn't parse "build.gradle.kts"`);
  }

  if (!pkgContent.version) {
    throw new Error(`No "version" field inside "build.gradle.kts"`);
  }

  const {version: oldVersion} = pkgContent;
  const isPre = semver.prerelease(oldVersion);
  const shouldBePre = type === 'pre';

  if (!isPre && shouldBePre && !preSuffix) {
    preSuffix = 'canary';
  }

  let newVersion;

  if (shouldBePre && preSuffix) {
    newVersion = semver.inc(oldVersion, type, preSuffix);
  } else {
    newVersion = semver.inc(oldVersion, type);
  }

  pkgContent.version = newVersion;

  try {
    pkgContent = pkg.split('\n').map(text => {
      if (text.includes('version = "')) {
        return `version = "${newVersion}"`
      }
      return text
    });
    await fs.writeFile(pkgPath, pkgContent.join('\n'));
  } catch (err) {
    throw new Error(`Couldn't write to "build.gradle.kts"`);
  }

  return newVersion;
};

const runGitCommand = async command => {
  try {
    await promisify(exec)(command);
  } catch (err) {
    if (err.message.includes('Not a git repository')) {
      throw new Error('Directory is not a Git repository');
    }

    throw err;
  }
};

module.exports = async (type, preSuffix) => {
  createSpinner('Bumping version tag');
  let version;

  try {
    version = await increment(type, preSuffix);
  } catch (err) {
    fail(err.message);
  }

  global.spinner.text = `Bumped version tag to ${bold(version)}`;
  createSpinner('Creating release commit');

  try {
    await runGitCommand(`git add -A && git commit -a -m "${version}"`);
  } catch (err) {
    fail(err.message);
  }

  global.spinner.text = `Created release commit`;
  createSpinner('Tagging commit');

  try {
    await runGitCommand(`git tag ${version}`);
  } catch (err) {
    fail(err.message);
  }

  global.spinner.text = `Tagged commit`;
  createSpinner('Pushing everything to remote');

  try {
    await runGitCommand(`git push && git push --tags`);
  } catch (err) {
    fail(err.message);
  }

  global.spinner.succeed(`Pushed everything to remote`);
  global.spinner = null;
};
