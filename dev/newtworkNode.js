const express = require('express')
const Blockchain = require('./blockchain')

const port = process.argv[2];
const rp = require('request-promise');



const { v4: uuidv4 } = require('uuid');
const { json } = require('express');
const requestPromise = require('request-promise');
const app = express()

const cors = require("cors");
app.use(cors());
const bitcoin = new Blockchain();
const nodeAddress = uuidv4().split('-').join('');
app.use(express.urlencoded({ extended: false }))
app.use(express.json())




app.get('/blockchain', function (req, res) {

    res.send(bitcoin)
});

app.post('/transaction', function (req, res) {
    const newTransaction = req.body;

    const blockIndex = bitcoin.addTransactionToPendingTransactions(newTransaction);
    res.json({ 'note': 'Transaction will be added in block' + blockIndex });
});

app.post('/transaction/boardcast', function (req, res) {
    const newTransaction = bitcoin.createNewTranscation(req.body.amount, req.body.sender, req.body.recipient);

    bitcoin.addTransactionToPendingTransactions(newTransaction);

    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/transaction',
            method: 'POST',
            body: newTransaction,
            json: true
        };
        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises)
        .then(data => {
            res.json({ 'note': 'Transaction created and broadcat successfully' });
        });
});

app.post('/register-and-broadcast-node', function (req, res) {
    const newNodeUrl = req.body.newNodeUrl;
    if (bitcoin.networkNodes.indexOf(newNodeUrl) == -1) {
        bitcoin.networkNodes.push(newNodeUrl);

    }
    const regNodesPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        console.log("inside foreach" + networkNodeUrl);
        if (networkNodeUrl !== newNodeUrl) {
            const requestOptions = {
                uri: networkNodeUrl + '/register-node',
                method: 'POST',
                body: { newNodeUrl: newNodeUrl },
                json: true
            };
            console.log(requestOptions);
            regNodesPromises.push(rp(requestOptions));
        }
        console.log("foreach complete");
    });
    Promise.all(regNodesPromises)
        .then(data => {
            console.log("inside promise all");

            const bulkRegisterOptions = {
                uri: newNodeUrl + '/register-node-bulk',
                method: 'POST',
                body: { allNetworkNodes: [...bitcoin.networkNodes, bitcoin.currentNodeUrl] },
                json: true
            }

            return rp(bulkRegisterOptions);
        })
        .then(data => {
            console.log("inside final all");
            res.json({ "note": "New node registered successfully!" });
        })
});

app.post('/register-node', function (req, res) {
    console.log("Inside Register Node" + req.body.newNodeUrl);
    const newNodeUrl = req.body.newNodeUrl;
    const notCurrentNodeUrl = bitcoin.currentNodeUrl !== newNodeUrl;
    const newNodeNotPresent = bitcoin.networkNodes.indexOf(newNodeUrl) == -1;
    if (newNodeNotPresent && notCurrentNodeUrl) {
        bitcoin.networkNodes.push(newNodeUrl);
        res.json({ "note": "New Node registred succcessfully." });
    }
});


app.post('/register-node-bulk', function (req, res) {
    const allNetworkNodes = req.body.allNetworkNodes;



    allNetworkNodes.forEach(networkNodeUrl => {
        console.log(networkNodeUrl);
        const notCurrentNodeUrl = bitcoin.currentNodeUrl !== networkNodeUrl;
        const newNodeNotPresent = bitcoin.networkNodes.indexOf(networkNodeUrl) == -1;
        if (newNodeNotPresent && notCurrentNodeUrl) {
            bitcoin.networkNodes.push(networkNodeUrl);
        }
    });
    res.json({ "note": "Bulk Node registration succcessfull." });

});

app.get('/mine', function (req, res) {
    const lastBlock = bitcoin.getLastBlock();
    const previousBlockHash = lastBlock['hash'];
    const currentBlockData = {
        transactions: bitcoin.pendingTransactions,
        index: lastBlock['index'] + 1
    };
    const nonce = bitcoin.proofOfWork(previousBlockHash,currentBlockData);
    const hashBlock = bitcoin.hashBlock(previousBlockHash, currentBlockData, nonce);



    const newBlock = bitcoin.createNewBlock(nonce, previousBlockHash, hashBlock);


    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {
            uri: networkNodeUrl + '/receive-new-block',
            method: 'POST',
            body: { newBlock: newBlock },
            json: true
        };
        requestPromises.push(rp(requestOptions));
    });

    Promise.all(requestPromises)
        .then(data => {

            const requestOptions = {
                uri: bitcoin.currentNodeUrl + '/transaction/boardcast',
                method: 'POST',
                body: { amount: 12.5, sender: 00, recipient: nodeAddress },
                json: true
            };
            return rp(requestOptions);
        })
        .then(data => {

            res.json({
                "note": "New Block mined and broadcat successfully.",
                "block": newBlock
            });
        });
});

app.get('/consensus', function(req,res){
    const requestPromises = [];
    bitcoin.networkNodes.forEach(networkNodeUrl => {
        const requestOptions = {

            uri:networkNodeUrl + "/blockchain",
            method: 'GET',
            json:true
        }
        requestPromises.push(rp(requestOptions));

    });
    Promise.all(requestPromises)
    .then(blockchains =>{

        const currentChianLength = bitcoin.chain.length;
        let maxChainLength = currentChianLength;
        let newLongestChain = null;
        let newPendingTransactions  =null;
        blockchains.forEach(blockchain =>{
            if(blockchain.chain.length > maxChainLength){
                maxChainLength = blockchain.chain.length;
                newLongestChain = blockchain.chain;
                newPendingTransactions = blockchain.pendingTransactions;
            }

        });

        if(!newLongestChain || (newLongestChain && !bitcoin.chainIsValid(newLongestChain))){
            res.json({
                note:'Current chain has not been replaced',
                chain: bitcoin.chain
            })
        } else {
        bitcoin.chain = newLongestChain;
        bitcoin.pendingTransactions = newPendingTransactions;
            res.json({
                note:'This chain has been replaced',
                chain: bitcoin.chain
            });
        }
    
    })
});

app.post('/receive-new-block', function (req, res) {
    const newBlock = req.body.newBlock;
    const lastBlock = bitcoin.getLastBlock();
    const correntHash = lastBlock.hash === newBlock.previousBlockHash;
    const correctIndex = lastBlock['index'] + 1 === newBlock['index'];
        if(correctIndex && correntHash) {
            bitcoin.chain.push(newBlock);
            bitcoin.pendingTransactions = [];
            res.json({note: 'New Block received and accepted.',newBlock:newBlock});
        }else {
            res.json({note: 'Error-  New Block rejected.',newBlock:newBlock});
        }
});

app.get('/block-explorer',function(req,res){

    res.sendFile('./block-explorer/index.html',{root:__dirname});
});

app.listen(port, function () {
    console.log("Listning to port " + port);
});