const path = require("path");
const express = require("express");
const webpack = require("webpack");
const webpackDevMiddleware = require("webpack-dev-middleware");
const webpackHotMiddleware = require("webpack-hot-middleware");
const config = require(path.join(__dirname, "../webpack.config.js"));
const compiler = webpack(config);
const app = express();

const { script } = require("./script");

app.use(webpackDevMiddleware(compiler, config.devServer));
app.use(webpackHotMiddleware(compiler));
app.use(express.static(path.join(__dirname, '../build')));

app.get("/api/getData/:username", async (req, res) => {
    console.log(`starting script for user ${req.params.username}`);
    const data = await script(req.params.username);
    console.log(`stopping script for user ${req.params.username}`);
    res.send(data);
});

app.get('/*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

app.listen(4000);