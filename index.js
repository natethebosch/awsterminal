
var AWS = require('aws-sdk');
var fs = require("fs");
var s3;

const readline = require('readline');
const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

var cmds;

/**
 * @param  {{name:prompt}}
 * @return {{name:value}}
 */
var getUserInputs = function(opts){
	return new Promise(function(resolve){
		var out = {};

		var next = function(){
			if(Object.keys(opts).length == 0){
				resolve(out);
				return;
			}

			var k = Object.keys(opts).shift();
			rl.question(opts[k] + ": ", function(input){
				out[k] = input.trim();
				delete opts[k];
				next();
			});
		};

		next();
	});
}

var putObject = function(){
	return new Promise(function(resolve){

		getUserInputs({
			bucket: "Enter a Bucket",
			key: "Enter a Key",
			file: "Enter a full file path",
			acl: "Enter ACL (private|public-read|public-read-write|authenticated-read)",
		}).then(function(params){

			// "/Users/natebosscher/Downloads/Release Notes (rev) copy/Data/October-19-2016.png"
			var f = fs.createReadStream(params.file);	
			var opts = {
				Bucket: params.bucket,
				Key: params.key,
				Body: f,
				ACL: params.acl,
			};

			s3.putObject(opts, function(err, data){
				if(err){
					console.log(err);
				}else{
					console.log("Successfully uploaded");
					console.log(data);
				}

				resolve();
			});

		});
	});
}

var deleteObject = function(){
	return new Promise(function(resolve){

		s3.deleteObject({
			Bucket:myBucket,
			Key: key,
		}, function(err, data){
			if (err) console.log(err, err.stack); // an error occurred
			else     console.log(data);           // successful response
		});
		resolve();
	});
}

var listBuckets = function(){
	return new Promise(function(resolve){

		s3.listBuckets(function(err, data) {
		  if (err) console.log(err, err.stack); // an error occurred
		  else     console.log(data);           // successful response

		  resolve();
		});

	});
}

var listObjects = function(){
	return new Promise(function(resolve){

		getUserInputs({
			"bucket": "Enter a Bucket",
			"prefix": "Enter a Key prefix [enter to return all]",
		}).then(function(params){

			s3.listObjects({
				Bucket: params.bucket,
				Prefix: params.prefix,
			}, function(err, data){
				if (err) console.log(err, err.stack); // an error occurred
				else     console.log(data);           // successful response

				resolve();
			})	
		})
	});
}

var listCommands = function(){

	return new Promise(function(resolve){

		console.log("Available commands:");
		for(var i in cmds){
			console.log("\t" + i);
		}

		resolve();
	});
};

var quit = function(){
	return new Promise(function(resolve, reject){
		reject();
	});
}

cmds = {
	"putObject": putObject,
	"deleteObject": deleteObject,
	"listBuckets": listBuckets,
	"listObjects": listObjects,
	"help": listCommands,
	"quit": quit,
};


console.log("AWS Terminal [Limited]");

s3 = new AWS.S3();
s3.config = new AWS.Config({
	accessKeyId: "<aws-access-key>",
	secretAccessKey: "<aws-secrete-key>",
	region: '<aws-region>'
});

var enterCommand = function(){
	rl.question("Enter a command: ", function(input){
		var v = input.trim();
		if(cmds[v] == undefined){
			console.log("we don't have a command '" + v + "'");
			listCommands();
			return;
		}

		cmds[v]()
			.then(function(){
				enterCommand();
			}, function(){
				console.log("bye");
				process.exit();
				return;
			});
	});
};

listCommands()
	.then(function(){
		enterCommand();
	}, function(){});
