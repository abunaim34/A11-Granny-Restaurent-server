const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const port = process.env.PORT || 5000;

// middleware
const corsOptions = {
    origin: [
        'http://localhost:5173',
        'http://localhost:5174',
    ],
    credentials: true,
    optionSuccessStatus: 200,
}
app.use(cors(corsOptions))
app.use(express.json())

app.get('/', (req, res) => {
    res.send('GRANNY RESTURANT')
})

app.listen(port, () => {
    console.log(`Granny resturant running on port: ${port}`)
})