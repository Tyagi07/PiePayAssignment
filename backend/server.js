const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// In-memory storage
const pricesData = {};

//POST/api/prices
app.post('/api/prices', (req, res) => {
    const { productTitle, wowDealPrice } = req.body;
    
    pricesData[productTitle] = {
        wowDealPrice,
        timestamp: new Date()
    };
    
    console.log('Price stored:', { productTitle, wowDealPrice });
    res.json({ success: true, message: 'Price stored' });
});

//GET /api/prices/:productTitle
app.get('/api/prices/:productTitle', (req, res) => {
    const { productTitle } = req.params;
    const stored = pricesData[productTitle];
    
    const flipkartPrice = 85000; // Static price
    const wowDealPrice = stored?.wowDealPrice || flipkartPrice;
    
    // Calculate savings percentage
    let savingsPercentage = 0;
    if (stored?.wowDealPrice) {
        const dealAmount = parseInt(stored.wowDealPrice.replace(/[₹,]/g, ''));
        savingsPercentage = Math.round(((flipkartPrice - dealAmount) / flipkartPrice) * 100);
    }
    res.json({
        flipkartPrice,
        wowDealPrice,
        productImgUri: "https://via.placeholder.com/300x200/FF6B35/FFFFFF?text=PiePay+Deal",
        savingsPercentage
    });
});

const PORT = 3000;
app.listen(PORT,()=>{
    console.log(`backend running on port: ${PORT}`);
});