![](https://raw.githubusercontent.com/vercel/art/e0348ab1848337de87ccbb713fa33345aa0ba153/release/repo-banner.png)

[Forked from vercel/release](https://github.com/vercel/release)

Hacked to support build.gradle.kts DSL.

When run, this command line interface automatically generates a new [GitHub Release](https://help.github.com/articles/creating-releases/) and populates it with the changes (commits) made since the last release.

## Usage

Firstly, install the package from [npm](https://npmjs.com/release) (you'll need at least Node.js 7.6.0):

Without installation:

```bash
npx alheimsins/release
```

To install it globally:

```bash
npm install -g release
```

Alternatively, you can use [Yarn](https://yarnpkg.com/en/) to install it:

```bash
yarn global add release
```

Once that's done, you can run this command inside your project's directory:

```bash
release <type>
```

As you can see, a `<type>` argument can be passed. If you leave it out, a [GitHub Release](https://help.github.com/articles/creating-releases/) will be created from the most recent commit and tag.

According to the [SemVer](https://semver.org) spec, the argument can have one of these values:

- `major`: Incompatible API changes were introduced
- `minor`: Functionality was added in a backwards-compatible manner
- `patch`: Backwards-compatible bug fixes were applied

In addition to those values, we also support creating pre-releases like `3.0.0-canary.1`:

```bash
release pre
```

You can also apply a custom suffix in place of "canary" like this:

```bash
release pre <suffix>
```

Assuming that you provide "beta" as the `<suffix>` your release will then be `3.0.0-beta.1` – and so on...

## Options

The following command will show you a list of all available options:

```bash
release help
```

## Pre-Defining Types

If you want to automate `release` even further, specify the change type of your commits by adding it to the **title** or **description** within parenthesis:

> Error logging works now (patch)

Assuming that you've defined it for a certain commit, `release` won't ask you to set a type for it manually. This will make the process of creating a release even faster.

To pre-define that a commit should be excluded from the list, you can use this keyword:

> This is a commit message (ignore)

## Custom Hook

Sometimes you might want to filter the information that gets inserted into new releases by adding an intro text, replacing certain data or just changing the order of the changes.

With a custom hook, the examples above (and many more) are very easy to accomplish:

By default, release will look for a file named `release.js` in the root directory of your project. This file should export a function with two parameters and always return a `String` (the final release):

```js
module.exports = async (markdown, metaData) => {
	// Use the available data to create a custom release
	return markdown;
};
```

In the example above, `markdown` contains the release as a `String` (if you just want to replace something). In addition, `metaData` contains these properties:

| Property Name    | Content                                               |
| ---------------- | ----------------------------------------------------- |
| `changeTypes`    | The types of changes and their descriptions           |
| `commits`        | A list of commits since the latest release            |
| `groupedCommits` | Similar to `commits`, but grouped by the change types |
| `authors`        | The GitHub usernames of the release collaborators     |

**Hint:** You can specify a custom location for the hook file using the `--hook` or `-H` flag, which takes in a path relative to the current working directory.
