const bookshelf = require("../bookshelf");

// Create a model for the products table
// the first argument is the name of the model
// the second argument is the config object
const Product = bookshelf.model("Product", {
    tableName:"products" // the Product model (JavaScript class) is using the `products` table
}); 

module.exports = {
    Product
}