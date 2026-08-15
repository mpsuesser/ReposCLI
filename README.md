# project

An Effect-powered CLI foundation. Product commands will be added without
changing the installation and release model established here.

## Run

Run the latest npm release without installing it:

```sh
bunx @mpsuesser/project-cli --help
```

Or install the `project` command globally:

```sh
bun add --global @mpsuesser/project-cli
project --help
```

Standalone executables for macOS, Linux, and Windows are attached to every
[GitHub release](https://github.com/mpsuesser/project/releases). They do not
require Bun to be installed. Download the archive for your platform, verify it
against `SHA256SUMS`, and place `project` (or `project.exe`) on your `PATH`.

## Develop

Requires [Bun](https://bun.com/) 1.3.14 or newer.

```sh
bun install
bun run start --help
bun run check
```

The root command and Bun runtime boundary are defined in `src/main.ts`.

## Release

Commits use [Conventional Commits](https://www.conventionalcommits.org/).
Pushing changes to `main` updates an automated Release Please pull request.
Merging that pull request creates the version tag and GitHub release, publishes
the npm package, and attaches cross-platform binaries.

The npm package requires one manual bootstrap before tokenless releases can
work:

1. Before merging the first release PR, publish the bootstrap `0.0.0` package
   with `npm publish --access public` while authenticated as an owner of the
   `@mpsuesser` scope.
2. In the npm package settings, configure GitHub Actions trusted publishing for
   `mpsuesser/project` and workflow file `release.yml`.
3. Disable token-based publishing after trusted publishing is verified.

Subsequent releases use npm OIDC trusted publishing with provenance and need no
repository secret.

## License

[MIT](LICENSE)
