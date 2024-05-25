'use strict';

const uuid = require('uuid');
const AWS = require('aws-sdk');

var sqs = new AWS.SQS({ region: process.env.REGION });
const QUEUE_URL = process.env.PENDING_ORDERS_QUEUE;
const orderMetadataManager = require('./orderMetadataManager');

module.exports.hacerPedido = (event, context, callback) => {
	console.log('HacerPedido fue llamada');
	const payload = JSON.parse(event.body);
	const orderData = {
		"orderId": uuid.v1(),
		"name": payload.name,
		"address": payload.address,
		"pizzas": payload.pizzas,
		"timestamp": new Date().getTime().toString()
	};
	const params = {
		MessageBody: JSON.stringify(orderData),
		QueueUrl: QUEUE_URL
	};

	sqs.sendMessage(params, function(err, data) {
		if (err) {
			console.log('error:', 'Fail Send Message' + err);
			sendResponse(500, 'Error al enviar el mensaje', callback);
		} else {
			const message = {
				order: orderData,
				messageId: data.MessageId
			};
			console.log('message:', message);
			sendResponse(200, message, callback);
		}
	});
};

module.exports.prepararPedido = (event, context, callback) => {
	console.log('Preparar pedido fue llamada');
	const order = event.Records[0].body;
	const orderData = JSON.parse(order);
	orderMetadataManager
		.saveCompletedOrder(orderData)
		.then(data => {
			callback();
		})
		.catch(error => {
			callback(error);
		});
};

module.exports.enviarPedido = (event, context, callback) => {
	console.log('EnviarPedido fue llamada');

	const record = event.Records[0];
	if (record.eventName === 'INSERT') {
		console.log('deliverOrder');

		const orderId = record.dynamodb.Keys.orderId.S;
		console.log(record);
		orderMetadataManager
			.deliverOrder(orderId)
			.then(data => {
				console.log(data);
				callback();
			})
			.catch(error => {
				callback(error);
			});
	} else {
		console.log('is not a new record');
		callback();
	}
};

module.exports.obtenerDetallePedido = (event, context, callback) => {
	console.log('ObtenerDetallePedido fue llamada');
	const orderId = event.pathParameters.orderId;
	orderMetadataManager
		.getCompletedOrder(orderId)
		.then(data => {
			console.log(data);
			sendResponse(200, data, callback);
		})
		.catch(error => {
			console.log(error);
			sendResponse(500, error, callback);
		});
}

function sendResponse(statusCode, message, callback) {
	const response = {
		statusCode: statusCode,
		body: JSON.stringify(message)
	};
	callback(null, response);
}