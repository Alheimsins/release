const path = require('path');
const fs = require('fs-extra');

const supportedManifests = [
	{ filename: 'package.json', type: 'json' },
	{ filename: 'build.gradle.kts', type: 'dsl' },
];

module.exports = () => {
	const manifest = supportedManifests
		.map((m) => ({ ...m, filepath: path.join(process.cwd(), m.filename) }))
		.find((m) => fs.existsSync(m.filepath));

	if (!manifest) {
		throw new Error(
			`No manifest found. Supported: ${supportedManifests
				.map(({ filename }) => filename)
				.join(',')}`
		);
	}

	const readDSL = () => fs.readFile(manifest.filepath, { encoding: 'utf8' });

	const readJSON = () => fs.readJSON(manifest.filepath);

	const read = async () => {
		try {
			if (manifest.type === 'json') {
				manifest.content = await readJSON(manifest.filepath);
			} else if (manifest.type === 'dsl') {
				manifest.content = await readDSL(manifest.filepath);
				manifest.content = manifest.content.split('\n');
			}
		} catch (err) {
			throw new Error(`Couldn't parse "${manifest.filename}"`);
		}
	};

	const writeJSON = () =>
		fs.writeJSON(manifest.filepath, manifest.content, { spaces: 2 });

	const writeDSL = () =>
		fs.writeFile(manifest.filepath, manifest.content.join('\n'));

	const write = async () => {
		try {
			if (manifest.type === 'json') {
				await writeJSON();
			} else if (manifest.type === 'dsl') {
				await writeDSL();
			}
		} catch (err) {
			throw new Error(`Couldn't write to "${manifest.filename}"`);
		}
	};

	const getVersion = async () => {
		await read();
		let version;

		if (manifest.type === 'json') {
			version = manifest.content.version;
		} else if (manifest.type === 'dsl') {
			version = manifest.content
				.find((text) => text.includes('version = "'))
				.split('"')[1];
		}

		if (!version) {
			throw new Error(`No "version" field inside "${manifest.filename}"`);
		}

		return version;
	};

	const bumpVersion = async (newVersion) => {
		if (manifest.type === 'json') {
			manifest.content.version = newVersion;
		} else if (manifest.type === 'dsl') {
			manifest.content = manifest.content.map((text) => {
				return text.includes('version = "')
					? `version = "${newVersion}"`
					: text;
			});
		}

		await write();
	};

	return {
		getVersion,
		bumpVersion,
	};
};
