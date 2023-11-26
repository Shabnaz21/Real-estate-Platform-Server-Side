const express = require('express');
const cors = require('cors');
const app = express();
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleWare 
app.use(cors(
    {
        origin: [
            'http://localhost:5173'

        ],
        credentials: true
    }
));
app.use(express.json());


// Server Collect
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.0s8hpk2.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

// Connection Collection
const ReviewCollection = client.db("newVilla").collection("reviews");
const PropertiesCollection = client.db("newVilla").collection("properties");

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        // reviews Part
       
        app.get('/reviews', async (req, res) => {
            const result = await ReviewCollection.find().toArray();
            res.send(result)
        })

        // properties part
        app.get('/properties', async (req, res) => {
            const result = await PropertiesCollection.find().toArray();
            res.send(result)
        })

        // per properties
        app.get('/properties/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await PropertiesCollection.findOne(query);
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


// checking server
app.get('/', (req, res) => {
    res.send('NewVilla Server is running');
})

app.listen(port, () => {
    console.log(`NewVilla Server is running on port: ${port}`);
})