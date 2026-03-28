fastlane documentation
----

# Installation

Make sure you have the latest version of the Xcode command line tools installed:

```sh
xcode-select --install
```

For _fastlane_ installation instructions, see [Installing _fastlane_](https://docs.fastlane.tools/#installing-fastlane)

# Available Actions

## Android

### android android_preflight_build

```sh
[bundle exec] fastlane android android_preflight_build
```

Validate build prerequisites, signing, and EAS parity checks

### android android_preflight_play

```sh
[bundle exec] fastlane android android_preflight_play
```

Validate Play credentials and package consistency

### android android_set_versions

```sh
[bundle exec] fastlane android android_set_versions
```

Apply CI-provided versionName and monotonic versionCode to app.json

### android android_build

```sh
[bundle exec] fastlane android android_build
```

Build signed Android release artifact

### android android_submit

```sh
[bundle exec] fastlane android android_submit
```

Upload artifact to Google Play track

### android android_promote

```sh
[bundle exec] fastlane android android_promote
```

Promote exact version code between tracks with no rebuild

### android android_release

```sh
[bundle exec] fastlane android android_release
```

Build and upload to internal track

### android android_local_cd

```sh
[bundle exec] fastlane android android_local_cd
```

Run local Android CD flow with optional promotions

----


## iOS

### ios ios_preflight_build

```sh
[bundle exec] fastlane ios ios_preflight_build
```

Validate iOS build prerequisites, signing material, and EAS parity checks

### ios ios_preflight_submit

```sh
[bundle exec] fastlane ios ios_preflight_submit
```

Validate iOS submit prerequisites and App Store Connect credentials

### ios ios_build

```sh
[bundle exec] fastlane ios ios_build
```

Build signed iOS release artifact with EAS-aligned lifecycle ordering

### ios ios_submit

```sh
[bundle exec] fastlane ios ios_submit
```

Submit iOS release artifact based on SemVer routing

### ios ios_release

```sh
[bundle exec] fastlane ios ios_release
```

Build and submit iOS release with SemVer-based routing

----

This README.md is auto-generated and will be re-generated every time [_fastlane_](https://fastlane.tools) is run.

More information about _fastlane_ can be found on [fastlane.tools](https://fastlane.tools).

The documentation of _fastlane_ can be found on [docs.fastlane.tools](https://docs.fastlane.tools).
