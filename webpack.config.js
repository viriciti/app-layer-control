const ExtractTextPlugin = require('extract-text-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const CopyWebpackPlugin = require('copy-webpack-plugin')
const webpack = require('webpack')
const path = require('path')

const __DEV__ = process.env.NODE_ENV !== 'production'
console.log(`Compiling in ${process.env.NODE_ENV || 'development'} mode`)

const VENDOR_LIBS = [
	'decamelize',
	'camel-case',
	'react',
	'react-dom',
	'react-router',
	'react-router-dom',
	'redux',
	'react-redux',
	'redux-thunk',
	'immutable',
	'react-json-pretty',
	'react-redux-toastr',
	'react-select',
	'redux-form',
	'redux-immutable',
	'reselect',
	'semver',
	'socket.io-client',
	'underscore',
]

const APP_ENTRY = './src/client/main.js'

// ExtractTextPlugin config
const extractSass = new ExtractTextPlugin({
	filename: __DEV__ ? '[name].css' : '[name].[contenthash].css',
	disable:  __DEV__,
})

// Css loader options
const cssLoaderOptions = {
	sourceMap: true,

	minimize: {
		autoprefixer: {
			add:      true,
			remove:   true,
			browsers: ['last 2 versions'],
		},

		discardComments: {
			removeAll: true,
		},

		discardUnused: false,
		mergeIdents:   false,
		reduceIdents:  false,
		safe:          true,
		sourcemap:     true,
	},
}

// Webpack configuration
const webpackConfig = {
	resolve: {
		extensions: ['.wasm', '.mjs', '.js', '.json', '.coffee'],
		alias:      {
			styles: path.resolve(__dirname, 'src/client/styles'),
		},
	},

	// devtool: (__DEV__) ? "eval" : "cheap-module-source-map",
	devtool: 'eval',

	entry: {
		bundle: __DEV__ ? [APP_ENTRY].concat('webpack-hot-middleware/client?path=/__webpack_hmr') : [APP_ENTRY],
		vendor: VENDOR_LIBS,
	},

	output: {
		path:          path.join(__dirname, 'dist/client'),
		filename:      __DEV__ ? '[name].js' : '[name].[chunkhash].js',
		chunkFilename: __DEV__ ? '[name].js' : '[name].[chunkhash].js',
		publicPath:    '/',
	},

	module: {
		rules: [
			{
				test:    /\.js$/,
				use:     ['babel-loader'],
				exclude: /node_modules/,
			},

			{
				test: /\.scss$/,
				use:  extractSass.extract({
					use: [
						{
							loader:  'css-loader',
							options: cssLoaderOptions,
						},
						{
							loader:  'sass-loader',
							options: {
								sourceMap: true,
							},
						},
					],

					fallback: 'style-loader',
				}),
			},

			{
				test: /\.css$/,
				use:  !__DEV__
					? ExtractTextPlugin.extract({
						fallback: 'style-loader',
						use:      [
							{
								loader:  'css-loader',
								options: cssLoaderOptions,
							},
						],
					  }) // eslint-disable-line no-mixed-spaces-and-tabs
					: ['style-loader', 'css-loader'],
			},

			{
				test:   /\.styl$/,
				loader: 'style-loader!css-loader!stylus-loader',
			},

			{
				test: /\.coffee$/,
				use:  [
					{
						loader:  'coffee-loader',
						options: {
							transpile: {
								presets: ['env', 'react'],
							},
						},
					},
				],
			},

			{
				test: /\.(jpe?g|png|gif)$/,
				use:  [
					{
						loader:  'url-loader',
						options: { limit: 40000 },
					},
					'image-webpack-loader',
				],
			},

			{
				test:    /\.(ttf|eot|woff|woff2|svg)$/,
				loader:  'file-loader',
				options: {
					name:  'fonts/[name].[ext]',
					limit: 40000,
				},
			},
		],
	},

	plugins: [
		new webpack.NoEmitOnErrorsPlugin(),
		new webpack.NamedModulesPlugin(),

		new CopyWebpackPlugin([{ from: 'src/client/assets/', to: 'assets/' }]),

		new webpack.optimize.CommonsChunkPlugin({
			// add duplicate modules only to the vendor.js bundle
			names: ['vendor', 'manifest'],
		}),

		new HtmlWebpackPlugin({
			template: 'src/client/index.html',
			filename: 'index.html',
			minify:   {
				collapseWhitespace: true,
			},
		}),

		new webpack.DefinePlugin({
			// Used to define windows variables
			'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
		}),

		new webpack.optimize.UglifyJsPlugin({
			parallel: {
				cache:   true,
				workers: 4,
			},
			sourceMap: true,
			comments:  false,
			compress:  {
				warnings:     false,
				screw_ie8:    true,
				conditionals: true,
				unused:       true,
				comparisons:  true,
				sequences:    true,
				dead_code:    true,
				evaluate:     true,
				if_return:    true,
				join_vars:    true,
			},
		}),

		extractSass,
		// new (require('webpack-bundle-analyzer').BundleAnalyzerPlugin)()
	],
}

// Add HMR if in development mode
if (__DEV__) webpackConfig.plugins.push(new webpack.HotModuleReplacementPlugin())

module.exports = webpackConfig
