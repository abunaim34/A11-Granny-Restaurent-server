const express = require('express')
const cors = require('cors')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
        'https://granny-resturant.web.app',
        'https://granny-resturant.firebaseapp.com',
    ],
    credentials: true,
    optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zyfftle.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const foodsCollection = client.db('FoodsDB').collection('foods')
        const purchaseFoodCollection = client.db('FoodsDB').collection('purchase')

        app.get('/foods', async (req, res) => {
            const cursor = foodsCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get('/foods/:email', async (req, res) => {
            const cursor = foodsCollection.find({ email: req.params.email })
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get('/food/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await foodsCollection.findOne(query)
            res.send(result)
        })

        app.post('/foods', async (req, res) => {
            const addFoods = req.body
            const result = await foodsCollection.insertOne(addFoods)
            res.send(result)
        })

        app.put('/updatefood/:id', async (req, res) => {
            const id = req.params.id
            const filter = { _id: new ObjectId(id) }
            const options = { upsert: true };
            const updateFood = req.body
            const foodItems = {
                $set: {
                  name: updateFood.name,
                  price: updateFood.price,
                  quantity: updateFood.quantity,
                  food_origin: updateFood.food_origin,
                  category: updateFood.category,
                  image: updateFood.image,
                  description: updateFood.description,
                },
              };
              const result = await foodsCollection.updateOne(filter, foodItems, options)
              res.send(result)
        })


        // purchase food
        app.get('/purchase', async(req, res) => {
            const cursor = purchaseFoodCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get('/purchase/:buyer_email', async(req, res) => {
            const cursor = purchaseFoodCollection.find({ buyer_email: req.params.buyer_email })
            const result = await cursor.toArray()
            res.send(result)
        })

        app.post('/purchase', async(req, res) => {
            const addPurchase = req.body
            const result = await purchaseFoodCollection.insertOne(addPurchase)
            res.send(result)
        })

        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('GRANNY RESTURANT')
})

app.listen(port, () => {
    console.log(`Granny resturant running on port: ${port}`)
})