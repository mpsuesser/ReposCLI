# ReposCLI

An Effect-powered CLI foundation. Product commands will be added without
changing the installation and release model established here.

## Run

Run the latest npm release without installing it:

```sh
bunx @mpsuesser/repos-cli --help
```

Or install the `repo` command globally:

```sh
bun add --global @mpsuesser/repos-cli
repo --help
```

Standalone executables for macOS, Linux, and Windows are attached to every
[GitHub release](https://github.com/mpsuesser/ReposCLI/releases). They do not
require Bun to be installed. Download the archive for your platform, verify it
against `SHA256SUMS`, and place `repo` (or `repo.exe`) on your `PATH`.

## Check Conventions

Check the current repository, or pass another repository path:

```sh
repo check
repo check ~/repos/example
```

The repository kind in `repo.toml` selects its convention suite. Violations are
printed as actionable findings and produce exit code `1`. Use `--jsonl` for one
schema-encoded JSON object per convention:

```sh
repo --jsonl check ~/repos/example
```

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
   `mpsuesser/ReposCLI` and workflow file `release.yml`.
3. Disable token-based publishing after trusted publishing is verified.

Subsequent releases use npm OIDC trusted publishing with provenance and need no
repository secret.

## License

[MIT](LICENSE)
