# Changelog

## [4.8.2]

### Changed

- Treat staging as production, but with a different NODE_ENV

### Fixed

- Bump the amount of max listeners to 15 for MQTT
- Alphabetically sort the groups when adding them to a device
- Reduce the amount of state updates sent by the server

## [4.8.1]

### Added

- Database hosts can now configured through environment variables (comma-separated)
- MQTT host and port can now be configured through environment variables

### Fixed

- Fix outdated Dockerfile from failing to build

## [4.8.0]

### Added

- Highlight devices with an incomplete state as grey in the table
- Prefer configuration Docker and GitLab through environment variables (see [README](README.md))
- Plugins: add functionality to App Layer Control without rebuilding the source

### Changed

- Show effective version for applications instead of the range
- Merge multiple filter fields into a single field

### Fixed

- Fix the inability to add, update or remove a source
- Improve rendering performance for devices by reducing the frequency of sorting and filtering
- Fix bug where adding or updating a source would not update the UI

### Removed

- Remove external sources in favor of a more powerful plugin system
