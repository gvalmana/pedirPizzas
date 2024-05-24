'use strict'

const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();

/* {
    orderId: string,
    name: string,
    address: string,
    pizzas: string[]
} */

module.exports.saveCompletedOrder = (orderData) => {
    console.log('Guardar un pedido fue llamado');
    orderData.delivery_status = "READY_FOR_DELIVERY";
    const dynamoConfigParams = {
        TableName: process.env.COMPLETED_ORDER_TABLE,
        Item: orderData
    };
    return dynamo.put(dynamoConfigParams).promise();
};