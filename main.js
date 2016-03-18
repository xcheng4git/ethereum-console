#!/usr/bin/env node

/*
	Run by default in interactive mode. When called in script mode, process.exit() should be called in your script to exit the nodejs app.
	Arguments:
	- a path which target a JavaScript file to execute (.js extension).
	- a path which target an ipc path.
*/

var Web3 = require('web3');
var web3admin = require('./web3Admin.js');
var repl = require('repl');
var net = require('net');
var fs = require('fs')
var vm = require('vm');
var ipcpath = require('./getIpcPath.js');

var ipcPath = ipcpath();
var jsScript;
var help = false;
if (!processArguments())
	return;

if (help)
{
	logHelp();
	return;
}

process.on('uncaughtException', function(err) {
	console.error("Uncaught exception: " + err);
});

console.log("Connecting to node at " + ipcPath);
web3 = new Web3(new Web3.providers.IpcProvider(ipcPath, net));
web3admin.extend(web3);
web3.eth.getBlockNumber(function(err, number)
{
	if (err)
		console.error("Could not connect to node. Please start an Ethereum node first.");
	else
	{
		console.log("Connection successful.");
		console.log("Current block number: " + number);
		if (jsScript)
			executeScript();
		else
		{
			console.log("Entering interactive mode.");
			repl.start({});
		}
	}
});

function processArguments()
{
	var notRecognized = false;
	for (var k = 2; k < process.argv.length; k++)
	{
		var arg = process.argv[k];
		if (arg.endsWith('.js'))
			jsScript = arg;
		else if (arg === "help" || arg === "--help" || arg === "-h")
			help = true;
		else if (arg.startsWith("ipc:") || arg.endsWith(".ipc"))
			ipcPath = arg.startsWith("ipc:") ? arg.substring(4) : arg;
		else
		{
			notRecognized = true;
			console.log("Argument not recognized " + arg);
		}
	}
	if (notRecognized)
	{
		logHelp();
		return false;
	}
	return true;
}

function executeScript()
{
	console.log("Executing " + jsScript + " ...");
	fs.readFile(jsScript, 'utf8', function (err, data)
	{
		if (err)
		{
			console.log(err);
			process.exit();
		}
		else
		{
			var script = new vm.Script(data);
			script.runInThisContext();
		}
	});
}

function logHelp()
{
	console.log("Run by default in interactive mode. When called in script mode, process.exit() should be called in your script to exit the nodejs app.")
	console.log("Arguments:")
	console.log("- a path to a JavaScript file to execute (.js extension).")
	console.log("- a path to an ipc path.")
}
