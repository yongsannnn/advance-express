const express = require("express");
const hbs = require("hbs");
const wax = require("wax-on");
require("dotenv").config();

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