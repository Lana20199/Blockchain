/* ===== SHA256 with Crypto-js ===============================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');
const levelDB = require('./levelSandbox.js');

/* ===== Block Class ==============================
|  Class with a constructor for block 			   |
|  ===============================================*/

class Block{
	constructor(data){
     this.hash = "",
     this.height = 0,
     this.body = data,
     this.time = 0,
     this.previousBlockHash = ""
    }
}

/* ===== Blockchain Class ==========================
|  Class with a constructor for new blockchain 		|
|  ================================================*/

class Blockchain{
  constructor(){
    this.getBlockHeight()
      .then((height) => {
        if(height === -1) {
          this.addBlock(new Block("First block in the chain - Genesis block"));
        }
      });    
  }

    // Add new block
    async addBlock(newBlock){
      const height = parseInt(await this.getBlockHeight());
      newBlock.height = height + 1;
      // UTC timestamp
      newBlock.time = new Date().getTime().toString().slice(0,-3);
  
      if(newBlock.height > 0) {
         const previousBlock = await this.getBlock(height);
         newBlock.previousBlockHash = previousBlock.hash;
      }
      
      newBlock.hash = SHA256(JSON.stringify(newBlock)).toString()
 
      // Adding block object to chain
      await levelDB.addLevelDBData(newBlock.height, JSON.stringify(newBlock));
    }
  
    // Get block height
    async getBlockHeight(){
      return JSON.parse(await levelDB.getBlocksCount());
    }

    // get block
    async getBlock(blockHeight){
      const rblock = JSON.parse(await levelDB.getLevelDBData(blockHeight));
      console.log(rblock);
      return rblock; 
    }

    //validate block
    async validateBlock(blockHeight){
      // get block object
      let block = await this.getBlock(blockHeight);
      // get block hash
      let blockHash = block.hash;
      // remove block hash to test block integrity
      block.hash = '';
      // generate block hash
      let validBlockHash = SHA256(JSON.stringify(block)).toString();
   
      if (blockHash===validBlockHash) {
        return true;
        } else {
          console.log('Block #'+blockHeight+' invalid hash:\n'+blockHash+'<>'+validBlockHash);
        return false;
        }
    }

   //Validate blockchain
    async validateChain(){
      console.log("validating chain");
      let errorLog = [];
      let chainLength = await this.getBlockHeight();
      let validBlock = false;
      let previousHash = "";
      
      for (var i = 0; i <= chainLength; i++) {

        this.getBlock(i).then((block) => {
          validBlock = this.validateBlock(block.height);

          //validate the block
          if(!validBlock) {
            errorLog.push(i);
          }

          if(block.previousBlockHash !== previousHash) {
            errorLog.push(i);
          }
          previousHash = block.hash;

          if (errorLog.length>0) {
            console.log('Block errors = ' + errorLog.length);
            console.log('Blocks: '+errorLog);
          } else {
            console.log('No errors detected');
          }
        
        })
      }
    }
}


let myBlockChain= new Blockchain();

(function theLoop (i) {
    setTimeout(function () {
        let blockTest = new Block("Test Block - " + (i + 1));
        myBlockChain.addBlock(blockTest).then((result) => {
            console.log(result);
            i++;
            if (i < 10) theLoop(i);
        });
    }, 10000);
  })(0);

  // myBlockChain.getBlockHeight();
  // myBlockChain.validateBlock(5);
  // myBlockChain.validateChain();
  // myBlockChain.getBlock(1);