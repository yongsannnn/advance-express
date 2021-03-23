// load in Router to setup the routes
const express = require("express")
const router = express.Router();

// import in the Product model
// STEP 1
const {Product} = require("../models")

// Alternate
// const models = require("../models")
// to refer to the product model
// we use "models.Product"


router.get("/", async (req,res)=>{
    // If this is pure SQL
    // SELECT * FROM Products
    // Previously we did this using mysql2
    // const query = "SELECT * From Products"
    // const [products] = connection.execute(query)

    // STEP 2 Call the model
    let products = await Product.collection().fetch(); 

    // STEP 3 Pass to the route, must make the variable into JSON file
    res.render("products/index", {
        "products": products.toJSON()
    })
})

module.exports = router