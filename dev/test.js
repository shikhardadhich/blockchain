const Blockchain = require('./blockchain');

const bitcoin = new Blockchain();

const bc1 = {
    "chain": [
    {
    "index": 1,
    "timestamp": 1625861753098,
    "transactions": [],
    "nonce": 100,
    "hash": "0",
    "previousBlockHash": "0"
    },
    {
    "index": 2,
    "timestamp": 1625861853996,
    "transactions": [],
    "nonce": 18140,
    "hash": "0000b9135b054d1131392c9eb9d03b0111d4b516824a03c35639e12858912100",
    "previousBlockHash": "0"
    },
    {
    "index": 3,
    "timestamp": 1625861896900,
    "transactions": [
    {
    "amount": 12.5,
    "sender": 0,
    "recipient": "c996b48f41fa4684a0248fab83b3994d",
    "transactionId": "f65fa98aa62f4f9d9fba0c3062543ff5"
    }
    ],
    "nonce": 85488,
    "hash": "000017c3f9c810c4e99b4a1b26c6a679fcd461fd39dabe99f1ae86eea2b3ca6b",
    "previousBlockHash": "0000b9135b054d1131392c9eb9d03b0111d4b516824a03c35639e12858912100"
    }
    ],
    "pendingTransactions": [
    {
    "amount": 12.5,
    "sender": 0,
    "recipient": "c996b48f41fa4684a0248fab83b3994d",
    "transactionId": "840c074ab1264525a23ce288d1d6a8e2"
    }
    ],
    "currentNodeUrl": "http://localhost:3001",
    "networkNodes": []
    };
console.log('VALID', bitcoin.chainIsValid(bc1.chain));


    
    
