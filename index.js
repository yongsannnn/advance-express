const express = require("express");
const hbs = require("hbs");
const wax = require("wax-on");
require("dotenv").config();
const session = require("express-session")
const flash = require("connect-flash")


// create an instance of express app
let app = express();

// set the view engine
app.set("view engine", "hbs");

// static folder
app.use(express.static("public"));

// setup wax-on
wax.on(hbs.handlebars);
wax.setLayoutPath("./views/layouts");

// enable forms
app.use(
  express.urlencoded({
    extended: false
  })
);

//setup sessions
app.use(session({
    "secret": "whatever",
    "resave": false, //if session never change, it will not resave
    "saveUninitialized": true //if client connect without session, immediately create one

}))

// Setup flash
app.use(flash())

// a middleware
// something that sit between the route and the user
app.use(function(req,res,next){
    // Inject into the hbs file the success and error message
    res.locals.success_messages = req.flash("success_messages")
    res.locals.error_messages = req.flash("error_messages")
    next()
})

// Import in the routes
const landingRoutes = require("./route/landing")
const corporateRoutes = require("./route/corporate")
const productRoutes = require("./route/products")
async function main() {
    // Prefix
    // If the url begins with the forward slash, use the landingRoutes
  app.use("/", landingRoutes)
  app.use("/corporate", corporateRoutes)
    app.use("/products", productRoutes)
}

main();

app.listen(3000, () => {
  console.log("Server has started");
});