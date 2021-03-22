const express = require("express")


// Create a new express router
const router = express.Router();

router.get("/", (req,res)=>{
    res.send("Welcome")
})

router.get("/about", (req,res)=>{
    res.send("about")
})

router.get("/contact", (req,res)=>{
    res.send("contact-us")
})






module.exports = router;