module.exports = (mismatch) ->
	mismatch
		.map (version, name) ->
			actual   = version.get "actual"
			expected = version.get "expected"

			"Expected #{name} to run #{expected}, currently running: #{actual or "not installed"}"
		.valueSeq()
		.join "\n"
