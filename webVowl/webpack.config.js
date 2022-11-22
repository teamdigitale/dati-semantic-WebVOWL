var path = require("path");
var webpack = require("webpack");
var CopyWebpackPlugin = require("copy-webpack-plugin");
var MiniCssExtractPlugin = require("mini-css-extract-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
	mode: 'development',
	cache: true,
	entry: {
		webvowl: "./src/webvowl/js/entry.js",
		"webvowl.app": "./src/app/js/entry.js"
	},
	devServer: {
		static: {
			directory: path.join(__dirname, './deploy')
		},
		compress: true,
		https: false,
		open: true,
		hot: false,
		historyApiFallback: true,
		port: 3000,
		devMiddleware: {
			writeToDisk: true,
		}
	},
	output: {
		path: path.join(__dirname, "deploy/"),
		publicPath: "",
		filename: "js/[name].js",
		chunkFilename: "js/[chunkhash].js",
		libraryTarget: "assign",
		library: "[name]"
	},
	module: {
		//rulesloaders
		rules: [
			{
				test:/\.css$/,
				use:['style-loader', 'css-loader']
			},
			{
				test:/\.(scss|sass)$/,
				use:['style-loader', 'css -loader','sass-loader']
			},
			{
				test: /\.(js)$/,
				exclude: /node_modules/,
				use: ['babel-loader']
			},
			{
				test:/\.hbs$/,
				use:['handlebars-loader']
			}
		]
	},
	plugins: [

	  	new CopyWebpackPlugin({
		 	patterns:[
		 		{ context: "src/app", from: "data/**/*"	},
				{ from: "node_modules/d3/d3.min.js",  to: "js/"	},
				{ from: "src/index.html",  to: "" },
				{ from: "src/webvowl/css/vowl.css",  to: "css/webvowl.css" },
				{ from: "src/webvowl/css/webvowl.app.css",  to: "css/webvowl.app.css" },
				{ from: "src/favicon.ico",  to: "" }
		 	]
	 	}) ,

		//new HtmlWebpackPlugin({
		//	context: "src/app", from: "data/**/*"
		//}),
		// new ExtractTextPlugin("css/[name].css"),
		//new MiniCssExtractPlugin(),
		new webpack.ProvidePlugin({
			d3: "d3"
		})
	],
	externals: {
		"d3": "d3"
	}
};
