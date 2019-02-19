# Changelog

[4.8.0]

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
