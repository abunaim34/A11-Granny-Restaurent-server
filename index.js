const express = require('express')
const cors = require('cors')
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
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
app.use(cookieParser())


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.zyfftle.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

const verifyToken = (req, res, next) => {
    const token = req.cookies?.token
    if(!token) return res.status(401).send({message: 'unauthorized access'})
    if (token) {
        jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
            if (err) {
                console.log(err);
                return res.status(401).send({message: 'unauthorized access'})
            }
            req.user = decoded
            next()
        })
    }
}

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect();

        const foodsCollection = client.db('FoodsDB').collection('foods')
        const purchaseFoodCollection = client.db('FoodsDB').collection('purchase')

        // token
        app.post('/jwt', async (req, res) => {
            const user = req.body
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '30d' })
            res.cookie('token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            })
                .send({ success: true })
        })

        app.get('/logOut', (req, res) => {
            res.clearCookie('token', {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
                maxAge: 0
            })
                .send({ success: true })
        })

        // foods
        app.get('/allFoods', async (req, res) => {
            const search = req.query.search
            const query = {
                name: { $regex: `${search}`, $options: 'i' }
            }
            const cursor = foodsCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get('/foods', async (req, res) => {
            const result = await foodsCollection.find().toArray()
            res.send(result)
        })

        app.get('/foods/:email', verifyToken, async (req, res) => {
            const tokenEmail = req.user.email
            const email  = req.params.email
            if(tokenEmail !== email){
                return res.status(403).send({message: 'forbidden access'})
            }
            const query = {email: email}
            const cursor = foodsCollection.find(query)
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
        app.get('/purchase', async (req, res) => {
            const cursor = purchaseFoodCollection.find()
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get('/purchaseUser/:buyer_email', verifyToken, async (req, res) => {
            const tokenEmail = req.user.email
            const email = req.params.buyer_email
            if(tokenEmail !== email){
                return res.status(403).send({message: 'forbidden access'})
            }
            const query = {buyer_email: email}
            const cursor = purchaseFoodCollection.find(query)
            const result = await cursor.toArray()
            res.send(result)
        })
        app.get('/purchase/:category', async (req, res) => {
            const cursor = purchaseFoodCollection.find({ category: req.params.category })
            const result = await cursor.toArray()
            res.send(result)
        })

        app.get('/purchaseFood/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await purchaseFoodCollection.findOne(query)
            res.send(result)
        })

        app.post('/purchase', async (req, res) => {
            const addPurchase = req.body
            const result = await purchaseFoodCollection.insertOne(addPurchase)
            res.send(result)
        })

        app.delete('/deletePurchase/:id', async (req, res) => {
            const id = req.params.id
            const query = { _id: new ObjectId(id) }
            const result = await purchaseFoodCollection.deleteOne(query)
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