# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased

### Changed

- Cancel click when the user is trying to copy the text in the devices table.
- Allow database name to be configured from environment variable.

### Removed
- Remove support for read-only mode (MQTT).

## 4.9.3

### Fixed

- Do not reset search query when navigating away from the page.
- Fix incorrect sorting for devices.

## 4.9.2

### Fixed

- Fix state updates (from plugins) not being persisted after receiving state from App Layer Agent.

## 4.9.1

### Fixed

- Set both replSet and replicaSet values for MongoDB.

## 4.9.0

### Changed

- Completely hide devices with incomplete state from the devices table.
- Update the way sources are handled internally: create them if they do not exist in the database, leave as is if they do exist. **Note**: you must remove the current sources in order for this to have effect.

### Fixed

- Fix controls not updating their async activity due to incorrect state update.
- Fix jumping table by enforcing a fixed table layout.
  **Note**: This requires you to specify a width when adding a source.
- Fix logs not appearing for devices.
- Fix memory leak caused by incorrectly assigning IDs (LastSeenInterval).
- Fix preview from not responding to changes to the position.

## 4.8.2

### Changed

- Treat staging as production, but with a different `NODE_ENV`.
- Reduce visibility of devices with incomplete state from the devices table.
- Alphabetically sort the groups when adding them to a device.
- Reduce the amount of state updates sent by the server.

### Fixed

- Bump the amount of max listeners to 15 for MQTT to prevent memory leak warning.

## 4.8.1

### Changed

- Database hosts can now configured through environment variables (comma-separated).
- MQTT host and port can now be configured through environment variables.

### Fixed

- Fix outdated Dockerfile from failing to build.

## 4.8.0

### Added

- Highlight devices with an incomplete state as grey in the table.
- Prefer configuration Docker and GitLab through environment variables (see [README](README.md)).
- Plugins: add functionality to App Layer Control without rebuilding the source.

### Changed

- Show effective version for applications instead of the range.
- Merge multiple filter fields into a single field.
- Improve rendering performance for devices by reducing the frequency of sorting and filtering.

### Fixed

- Fix the inability to add, update or remove a source.
- Fix bug where adding or updating a source would not update the UI.

### Removed

- Remove external sources in favor of a more powerful plugin system.
