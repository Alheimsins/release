// Packages
const semver = require('semver');
const manifestControl = require('./manifest');

module.exports = async (type, preSuffix) => {
	const manifest = manifestControl();

	const oldVersion = await manifest.getVersion();

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

	await manifest.bumpVersion(newVersion);

	return newVersion;
};
