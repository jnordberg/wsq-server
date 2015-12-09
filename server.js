#!/usr/bin/env node

var BlobStore = require('fs-blob-store')
var bunyan = require('bunyan')
var fs = require('fs')
var leveldown = require('leveldown')
var os = require('os')
var path = require('path')
var Server = require('wsq/server')
var wsqVersion = require('wsq/package').version

function defaultDatadir() {
	var name = 'wsq-server'
	if (os.platform() != 'win32') {
		name = '.' + name
	}
	var dir = path.join(os.homedir(), name)
	try { fs.mkdirSync(dir) } catch (error) { if (error.code !== 'EEXIST') throw error }
	return dir
}

var serverPort = 5000
if (process.env['WSQ_PORT'] || process.env['PORT']) {
	serverPort = Number(process.env['WSQ_PORT'] || process.env['PORT'])
}

var storageLocation
if (process.env['WSQ_STORAGE']) {
	storageLocation = process.env['WSQ_STORAGE']
} else {
	storageLocation = path.join(defaultDatadir(), 'storage')
}

var databaseLocation
if (process.env['WSQ_DATABASE']) {
	databaseLocation = process.env['WSQ_DATABASE']
} else {
	databaseLocation = path.join(defaultDatadir(), 'database')
}

var logLevel = 'debug'
if (process.env['WSQ_LOG_LEVEL'] || process.env['LOG_LEVEL']) {
	logLevel = process.env['WSQ_LOG_LEVEL'] || process.env['LOG_LEVEL']
}

var options = {
	database: databaseLocation,
	logLevel: logLevel,
	port: serverPort,
	storage: storageLocation,
}

var log = bunyan.createLogger({name: 'wsq-server', level: logLevel})
log.info({options: options, version: wsqVersion}, 'Starting server')

var server = new Server({
	blobStore: new BlobStore(storageLocation),
	dbLocation: databaseLocation,
	dbOptions: {db: leveldown},
	socketOptions: {port: serverPort},
})

server.on('ready', function() {
	var queues = {}
	for (var key in server.queues) {
		queues[key] = {
			active: server.queues[key].getActive().length,
			completed: server.queues[key].getCompleted().length,
			failed: server.queues[key].getFailed().length,
			waiting: server.queues[key].getWaiting().length,
		}
	}
	log.info({queues: queues}, 'Server ready')
})

server.on('connection', function(connection) {
	var clientLog = log.child({connectionId: connection.id})
	clientLog.info('Client connected')
	connection.on('close', function() {
		clientLog.info('Client disconnected')
	})
	connection.on('error', function(error) {
		clientLog.error(error)
	})
})

server.on('error', function(error) {
	log.error(error)
})

server.on('worker added', function(worker) {
	log.info({workerId: worker.id, connectionId: worker.connection}, 'Worker added')
})

server.on('worker removed', function(worker) {
	log.info({workerId: worker.id, connectionId: worker.connection}, 'Worker removed')
})

server.on('worker started', function(worker, task) {
	var meta = {
		workerId: worker.id,
		connectionId: worker.connection,
		taskId: task.id
	}
	log.info(meta, 'Worker started')
})

server.on('task added', function(task) {
	log.info({queue: task.queue, options: task.options, taskId: task.id}, 'Task added')
})

server.on('task queued', function(task) {
	log.debug({queue: task.queue, taskId: task.id}, 'Task queued')
})

server.on('task started', function(task) {
	log.info({queue: task.queue, taskId: task.id}, 'Task started')
})

server.on('task failed', function(task) {
	log.warn({queue: task.queue, taskId: task.id, error: task.error}, 'Task failed')
})

server.on('task completed', function(task) {
	log.info({queue: task.queue, taskId: task.id}, 'Task completed')
})


module.exports = server
