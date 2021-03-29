const express = require("express")
const router = express.Router()
const CartServices = require("../services/CartServices")

router.get("/", async(req,res)=>{
    let cartServices = new CartServices(req.session.user.id)
    const allItems = await cartServices.getAll();
    res.render("shoppingCart/index",{
        "allItems": allItems.toJSON()
    })
    console.log(allItems.toJSON())
})

router.get("/:product_id/add", async (req,res)=>{
    let cartServices = new CartServices(req.session.user.id);
    await cartServices.addToCart(req.params.product_id)
    req.flash("success_messages", "The product has been added to your shopping cart")
    res.redirect("back")
})


module.exports = router