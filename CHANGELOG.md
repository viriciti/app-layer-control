# Changelog

[Unreleased]

### Added

- Devices with an incomplete state now appear greyed out in the table
- Configuring Docker and GitLab can now be done through environment variables (see [README](README.md))
- Plugins: add functionality to App Layer Control without rebuilding the source

### Changed

- Show effective version for applications instead of the range
- Filtering has been merged into a single field

### Fixed

- The inability to add, update or remove a source from the frontend
- Rendering performance for Devices improved by reducing the frequency of sorting and filtering

### Removed

- External sources have been removed for a more powerful plugin system
