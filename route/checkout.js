const express = require("express")
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY)
const CartServices = require("../services/CartServices")
const bodyParser = require("body-parser")

router.get("/checkout",async(req,res)=>{
    // Create Line Items -- Tell Stripe what cutomer is paying for
    const cartServices = new CartServices(req.session.user.id);
    let allCartItems = await cartServices.getAll();

    let lineItems = [];
    let meta = [];

    for (let cartItem of allCartItems){
        const lineItem = {
            "name": cartItem.related("product").get("name"),
            "amount": cartItem.related("product").get("cost"),
            "quantity": cartItem.get("quantity"),
            "currency": "SGD"
        }
        if(cartItem.related("product").get("image_url")) {
            lineItem.images = [cartItem.related("product").get("image_url")]
        }
        lineItems.push(lineItem)
        meta.push({
            "product_id": cartItem.get("product_id"),
            "quantity": cartItem.get("quantity")
        })
    }
    // Using Stripe -- Create the payment
    // stringify so that later we can use it
    let metaData = JSON.stringify(meta) 
    const payment = {
        payment_method_types: ["card"],
        line_items: lineItems,
        success_url: process.env.STRIPE_SUCCESS_URL + "?sessionId={CHECKOUT_SESSION_ID}",
        cancel_url: process.env.STRIPE_ERROR_URL,
        metadata: {
            "orders": metaData
        }
    }

    // Register the payment
    let stripeSession = await stripe.checkout.sessions.create(payment);

    // Send the payment session id to a hbs file and use JS to redirect.
        res.render("checkout/checkout", {
            "sessionId": stripeSession.id,
            "publishableKey": process.env.STRIPE_PUBLISHABLE_KEY
        })
})

// This post is for stripe to call, not us
router.post("/process_payment", bodyParser.raw({type:"application/json"}), async(req,res)=>{
    let payload = req.body
    let endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;
    let sigHeader = req.headers["stripe-signature"];
    let event;
    try {
        event = stripe.webhooks.constructEvent(payload,sigHeader,endpointSecret)
    } catch (e){
        res.send({
            "error": e.message
        }) 
        console.log(e.message)
    }
    if (event.type == "checkout.session.completed"){
        console.log (event.data.object)
    }
    res.sendStatus(200);
})





module.exports=  router;