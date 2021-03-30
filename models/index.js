const bookshelf = require("../bookshelf");

// Create a model for the products table
// the first argument is the name of the model
// the second argument is the config object
const Product = bookshelf.model("Product", {
    tableName: "products", // the Product model (JavaScript class) is using the `products` table
    // Make sure the name of the function is the same as the FK without the _id
    category() {
        // First argument is the name of the model that the current model is related to. (this. refer to product) 
        return this.belongsTo("Category")
    },
    tags() {
        return this.belongsToMany("Tag")
    }
});

const Category = bookshelf.model("Category", {
    tableName: "categories",
    // The name of the function must match the name of the model involved in the relationship, but lowercase and pural.
    products() {
        return this.hasMany("Product")
    }
})

const Tag = bookshelf.model("Tag", {
    tableName: "tags",
    products() {
        return this.belongsToMany("Product")
    }
})

const User = bookshelf.model("User", {
    tableName: "users"
})

const CartItem = bookshelf.model("CartItem", {
    tableName: "cart_items",
    product() {
        return this.belongsTo('Product')
    },
    user() {
        return this.belongsTo('User')
    }
})

const BlacklistedToken = bookshelf.model("BlacklistedToken", {
    tableName: "blacklisted_tokens"
})
module.exports = {
    Product, Category, Tag, User, CartItem, BlacklistedToken
}