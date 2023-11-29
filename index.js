const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
require('dotenv').config()
const port = process.env.PORT || 5001;

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
const UserCollection = client.db("newVilla").collection("users");
const ReviewCollection = client.db("newVilla").collection("reviews");
const PropertiesCollection = client.db("newVilla").collection("properties");
const WishlistCollection = client.db("newVilla").collection("wishlists");
const OfferCollection = client.db("newVilla").collection("proposal");

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        // JWT api
        app.post('/jwt', async (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
            res.send({token})
        })

        const verifyToken = (req, res, next) => {
            console.log('inside verify in the middleware', headers);
            if (req.headers.authorization) {
                return res.status(401).send({ message: 'unauthorized access'})
            }
            const token = req.headers.authorization.split(' ')[1];
            jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
                if (err) {
                    return res.status(401).send({ message: 'unauthorized access' })
                }
                req.decoded = decoded;
                next();
            })
        }
        // use verify admin after verifyToken
        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded?.email;
            const query = { email: email };
            const user = await UserCollection.findOne(query);
            const isAdmin = user?.role === 'admin';
            if (!isAdmin) {
                return res.status(403).send({ message: 'forbidden access' });
            }
            next();
        }

        // user collection
        app.post('/users', async (req, res) => {
            const user = req.body;
            const query = { email: user.email }
            const existingUser = await UserCollection.findOne(query);

            if (existingUser) {
                return res.send({ message: 'user already exists', insertedId: null })
            }
            const result = await UserCollection.insertOne(user);
            res.send(result);
        });

    
        app.get('/users',  async (req, res) => {

            let queryObj = {};
            if (req.query && req.query.email) {
                queryObj.email = req.query.email;
            }
            // console.log(req.headers);
            const result = await UserCollection.find(queryObj).toArray();
            res.send(result);
        });

        // admin get 
        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params?.email;

            // if (email !== req.decoded?.email) {
            //     return res.status(403).send({ message: 'forbidden access' })
            // }

            const query = { email: email };
            const user = await UserCollection.findOne(query);
            let admin = false;
            if (user) {
                admin = user?.role === 'admin';
            }
            res.send({ admin });
        })
        app.delete('/users/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await UserCollection.deleteOne(query);
            res.send(result);
        })

        app.patch('/users/agent/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: 'agent'
                }
            }
            const result = await UserCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })
        app.patch('/users/fraud/:id', verifyToken, verifyAdmin, async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: 'fraud'
                }
            }
            const result = await UserCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        app.patch('/users/admin/:id', verifyToken, verifyAdmin,  async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    role: 'admin'
                }
            }
            const result = await UserCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        // reviews collection
        app.get('/reviews', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await ReviewCollection.find(query).toArray();
            res.send(result)
        })

        // properties collection
        app.get('/properties', async (req, res) => {
            const result = await PropertiesCollection.find().toArray();
            res.send(result)
        })

        app.get('/properties/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await PropertiesCollection.findOne(query);
            res.send(result)
        })
        
        app.patch('/properties/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updatedDoc = {
                $set: {
                    status: 'verify' 
                }
            }
            const result = await PropertiesCollection.updateOne(filter, updatedDoc);
            res.send(result);
        })

        // wishlist collection
        app.post('/wishlist', async (req, res) => {
            const addItem = req.body;
            const result = await WishlistCollection.insertOne(addItem)
            res.send(result)
        })

        app.get('/wishlist', async (req, res) => {
            let queryObj = {}
            const userEmail = req.query?.userEmail;

            if (userEmail) {
                queryObj.userEmail = userEmail
            }
           
            const result = await WishlistCollection.find(queryObj).toArray();
            res.send(result)
        })

        app.get('/wishlist/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await WishlistCollection.findOne(query);
            res.send(result)
        })

        app.delete('/wishlist/:id', async (req, res) => {
            const id = req.params.id;
            const query = {
                _id: new ObjectId(id),
            };
            const result = await WishlistCollection.deleteOne(query);
            res.send(result);
        })

        // Proposal Collection
        app.post('/proposal', async (req, res) => {
            const addItem = req.body;
            const result = await OfferCollection.insertOne(addItem)
            res.send(result)
        })

        app.get('/proposal', async (req, res) => {
            let queryObj = {}
            const userEmail = req.query?.userEmail;

            if (userEmail) {
                queryObj.userEmail = userEmail
            }

            const result = await OfferCollection.find(queryObj).toArray();
            res.send(result)
        })

        app.get('/proposal/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await OfferCollection.findOne(query);
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