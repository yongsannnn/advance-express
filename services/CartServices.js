const {CartItem} = require("../models")
const cartDataLayer = require("../dal/cart")


class CartServices{
    constructor(user_id) {
        this.user_id = user_id
    }

    async getAll(){
        const allItems = await cartDataLayer.getAllItems(this.user_id)
        return allItems
    }

    async addToCart(productId){
        // Check if item is already in cart
        const cartItem = await cartDataLayer.getCartItemByUserAndProduct(this.user_id, productId)
        // If false, create and save to the cart
        if (!cartItem) {
            let newCartItem = new CartItem();
            newCartItem.set("product_id", productId)
            newCartItem.set("user_id", this.user_id)
            newCartItem.set("quantity", 1)
            await newCartItem.save()
            return newCartItem

        }  else {
            // If true, take item and increase qty by 1
            cartItem.set("quantity", cartItem.get("quantity")+1)
            await cartItem.save()
            return cartItem
        }
    }

    async removeItem(productId){
        return await cartDataLayer.removeItem(this.user_id, productId)
    }

    async updateQuantity(productId, newQuantity){
        return await cartDataLayer.updateQuantity(
            this.user_id,productId,newQuantity
        )
    }
}


module.exports = CartServices;