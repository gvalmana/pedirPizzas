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

module.exports.deliverOrder = (orderId) => {
    console.log('Entregar pedido fue llamado');
    const dynamoConfigParams = {
        TableName: process.env.COMPLETED_ORDER_TABLE,
        Key: {
            orderId
        },
        ConditionExpression: 'attribute_exists(orderId)',
        UpdateExpression: 'set delivery_status = :new_status',
        ExpressionAttributeValues: {
            ':new_status': 'DELIVERED'
        },
        ReturnValues: 'ALL_NEW'
    };
    return dynamo.update(dynamoConfigParams).promise()
        .then(response => {
            console.log('Orden entregada');
            return response.Attributes;
        });
}

module.exports.getCompletedOrder = (orderId) => {
    console.log('Obtener pedido completado fue llamado');
    const dynamoConfigParams = {
        TableName: process.env.COMPLETED_ORDER_TABLE,
        Key: {
            orderId
        }
    };
    return dynamo.get(dynamoConfigParams).promise()
        .then(response => {
            return response.Item;
        });
}