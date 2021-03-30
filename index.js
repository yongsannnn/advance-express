const express = require("express");
const hbs = require("hbs");
const wax = require("wax-on");
require("dotenv").config();
const session = require("express-session")
const FileStore = require('session-file-store')(session);
const flash = require("connect-flash")
const csurf = require("csurf")

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
    "store": new FileStore(),
    "secret": process.env.SESSION_SECRET_KEY,
    "resave": false, //if session never change, it will not resave
    "saveUninitialized": true //if client connect without session, immediately create one
}))

// Setup flash (It require session, thus line must be below setup sessions)
app.use(flash())

// Setup CSURF (It require session, thus line must be below setup sessions)
const csurfInstance = csurf();
app.use(function (req, res, next) {
    console.log(req.url)
    if (req.url === "/checkout/process_payment" || req.url.slice(0, 5) == "/api/") {
        return next();
    }
    csurfInstance(req, res, next);
})

app.use(function (err, req, res, next) {
    console.log(err)
    if (err && err.code == "EBADCSRFTOKEN") {
        req.flash("error_messages", "Form has expired.")
        res.redirect("back");
    } else {
        next()
    }
})



// Global middleware -> affect all hbs files
// a middleware
// something that sit between the route and the user
// Flash middleware
app.use(function (req, res, next) {
    // Inject into the hbs file the success and error message
    res.locals.success_messages = req.flash("success_messages")
    res.locals.error_messages = req.flash("error_messages")
    next()
})

//Global middleware to inject the req.session.use object into the local variable, which are accessible by hbs_files
app.use(function (req, res, next) {
    res.locals.user = req.session.user;
    next()
})

app.use(function (req, res, next) {
    if (req.csrfToken) {
        res.locals.csrfToken = req.csrfToken();
    }
    next()
})

// Import in the routes
const landingRoutes = require("./route/landing")
const corporateRoutes = require("./route/corporate")
const productRoutes = require("./route/products")
const userRoutes = require("./route/users")
const cloudinaryRoute = require("./route/cloudinary")
const shoppingCartRoute = require("./route/shoppingCart")
const checkoutRoute = require("./route/checkout")

// API Routes
const api = {
    "products": require("./route/api/products"),
    "users": require("./route/api/users")
}

async function main() {
    // Prefix
    // If the url begins with the forward slash, use the landingRoutes
    app.use("/", landingRoutes)
    app.use("/corporate", corporateRoutes)
    app.use("/products", productRoutes)
    app.use("/users", userRoutes)
    app.use("/cloudinary", cloudinaryRoute)
    app.use("/shoppingCart", shoppingCartRoute)
    app.use("/checkout", checkoutRoute)
    app.use("/api/products", express.json(), api.products)
    app.use("/api/users", express.json(), api.users)
}

main();

app.listen(3000, () => {
    console.log("Server has started");
});