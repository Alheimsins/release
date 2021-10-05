// Native
const { promisify } = require('util');
const { exec } = require('child_process');

// Packages
const { bold } = require('chalk');

// Utilities
const { fail, create: createSpinner } = require('./spinner');
const increment = require('./increment');

const runGitCommand = async (command) => {
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
