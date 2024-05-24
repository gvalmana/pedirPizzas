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
			sendResponse(500, err, callback);
		} else {
			const message = {
				order: orderData,
				messageId: data.MessageId
			};
			sendResponse(200, message, callback);
		}
	});
};

module.exports.prepararPedido = async (event, context, callback) => {
	console.log('Preparar pedido fue llamada');
	const ordersRecords = event.Records;
	ordersRecords.forEach(recordItem => {
		const orderData = JSON.parse(recordItem.body);
		orderMetadataManager.saveCompletedOrder(orderData)
			.then(data => {
				callback();
			})
			.catch(err => {
				callback(err);
			});
	});
};

function sendResponse(statusCode, message, callback) {
	const response = {
		statusCode: statusCode,
		body: JSON.stringify(message)
	};
	callback(null, response);
}