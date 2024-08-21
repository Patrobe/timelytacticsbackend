const { MongoClient } = require('mongodb');

const uri = "mongodb+srv://20221737:GavRWImyMNYVnQVA@timelytacticsdb.wwbuf.mongodb.net/?retryWrites=true&w=majority&appName=TimelyTacticsDb";

const client = new MongoClient(uri);

async function run() {
    try {
        await client.connect();
        console.log("Connected successfully to server");
    } catch (err) {
        console.error(err);
    } finally {
        await client.close();
    }
}

run().catch(console.dir);
