// load in Router to setup the routes
const express = require("express")
const router = express.Router();

// import in the Product, Categor and tag model
// STEP 1
const { Product, Category, Tag } = require("../models")

// Alternate
// const models = require("../models")
// to refer to the product model
// we use "models.Product"

//import in the forms
const { createProductForm, bootstrapField, createProductSearchForm } = require("../forms")

//import DAL (Usually import everything because there are multiple functions inside we want to use)
const productDataLayer = require("../dal/products")

//import in checkIfAuthenticated middleware
const { checkIfAuthenticated } = require("../middleware")
router.get("/", async (req, res) => {
    // If this is pure SQL
    // SELECT * FROM Products
    // Previously we did this using mysql2
    // const query = "SELECT * From Products"
    // const [products] = connection.execute(query)

    const allCategories = await productDataLayer.getAllCategories()

    //manually make a index 0 and make it infront of the form
    allCategories.unshift([0,"-------"])
    const allTags = await productDataLayer.getAllTags()
    const searchForm = createProductSearchForm(allCategories, allTags);

    // creating a base query (i.e SELECT * from products)
    // a.k.a query builder 
    let q = Product.collection();
    // let products = await q.fetch({
    //             withRelated: ["category", "tags"]
    //         });

    //         res.render("products/index", {
    //             "products": products.toJSON(),
    //             "form": searchForm.toHTML(bootstrapField)
    //         })
    searchForm.handle(req, {
        "empty": async (form) => {
            //if the form is empty, display all 
            // STEP 2 Call the model
            let products = await q.fetch({
                withRelated: ["category", "tags"]
            });
            
            // STEP 3 Pass to the route, must make the variable into JSON file
            res.render("products/index", {
                "products": products.toJSON(),
                "form": form.toHTML(bootstrapField)
            })


        },
        "error": async(form) =>{
            let products = await q.fetch({
                withRelated: ["category", "tags"]
            });

            res.render("products/index", {
                "products": products.toJSON(),
                "form": form.toHTML(bootstrapField)
            })
        },
        "success": async(form)=>{
            
            if (form.data.name){
                // add a where name like "%name%"
                q = q.where("name","like", "%"+ form.data.name+"%")
            }

            if (form.data.category_id !== "0"){
                q = q.where("category_id", "=", form.data.category_id)
            }
             
            if (form.data.min_cost) {
                q = q.where("cost", ">=", form.data.min_cost)
            }

            if (form.data.max_cost) {
                q = q.where("cost", "<=", form.data.max_cost)
            }

            if (form.data.tags){
                q = q.query("join", " products_tags", "products.id", "product_id").where("tag_id","in", form.data.tags.split(","))
            }

            let products = await q.fetch({
                withRelated: ["category", "tags"]
            });
            res.render("products/index", {
                "products": products.toJSON(),
                "form": form.toHTML(bootstrapField)
            })
        }
        
    })


})

router.get("/create", checkIfAuthenticated, async (req, res) => {
    const allCategories = await Category.fetchAll().map((category) => {
        return [category.get("id"), category.get("name")]
    })

    const allTags = await Tag.fetchAll().map(tag => [tag.get("id"), tag.get("name")])
    const productForm = createProductForm(allCategories, allTags);
    res.render("products/create", {
        "form": productForm.toHTML(bootstrapField),
        "cloudinaryName": process.env.CLOUDINARY_NAME,
        "cloudinaryApiKey": process.env.CLOUDINARY_API_KEY,
        "cloudinaryPreset": process.env.CLOUDINARY_UPLOAD_PRESET
    })
})

router.post("/create", checkIfAuthenticated, async (req, res) => {
    const allCategories = await Category.fetchAll().map((category) => {
        return [category.get("id"), category.get("name")]
    })

    const allTags = await Tag.fetchAll().map(tag => [tag.get("id"), tag.get("name")])

    const productForm = createProductForm(allCategories, allTags);
    productForm.handle(req, {
        "success": async (form) => {
            let { tags, ...productData } = form.data;
            // we need to seperate because the product table dont have the tags. 

            // use the Product model to save a new instance of Product
            // Create a new row in the Products table
            const newProduct = new Product();
            // This will only work when the form.data field and the field you want to set is the same. 
            newProduct.set(productData);

            // Alternative method
            // newProduct.set("name",form.data.name);
            // newProduct.set("cost",form.data.cost);
            // newProduct.set("description",form.data.description);
            // newProduct.set("category_id",form.data.category_id);
            await newProduct.save();

            // Check if any tags are selected
            // attach() is for many to many relationship
            if (tags) {
                await newProduct.tags().attach(tags.split(","))
            }

            // Display a success message
            // ... add a flash message which is stored in the session
            req.flash("success_messages", "New product has been created successfully")
            res.redirect("/products")
        },
        "error": (form) => {

            req.flash("error_messages", "Failed to create a product. Correct all error and retry.")
            res.render("products/create", {
                "form": form.toHTML(bootstrapField)
            })
        }
    })
})


router.get("/:product_id/update", checkIfAuthenticated, async (req, res) => {
    const allCategories = await productDataLayer.getAllCategories()
    const allTags = await productDataLayer.getAllTags()
    const productToEdit = await productDataLayer.getProductById(req.params.product_id)

    const productJSON = productToEdit.toJSON();
    const selectedTagIds = productJSON.tags.map(t => t.id)


    const form = createProductForm(allCategories, allTags);
    form.fields.name.value = productToEdit.get("name");
    form.fields.cost.value = productToEdit.get("cost");
    form.fields.description.value = productToEdit.get("description");
    form.fields.category_id.value = productToEdit.get("category_id");
    form.fields.tags.value = selectedTagIds;

    res.render("products/update", {
        "form": form.toHTML(bootstrapField),
        "product": productJSON,
        "cloudinaryName": process.env.CLOUDINARY_NAME,
        "cloudinaryApiKey": process.env.CLOUDINARY_API_KEY,
        "cloudinaryPreset": process.env.CLOUDINARY_UPLOAD_PRESET
    })
})


router.post("/:product_id/update", checkIfAuthenticated, async (req, res) => {
    const productToEdit = await Product.where({
        "id": req.params.product_id
    }).fetch({
        require: true,
        withRelated: ["tags"]
    });
    const productJSON = productToEdit.toJSON();
    const selectedTagIds = productJSON.tags.map(t => t.id)
    const productForm = createProductForm();

    // This shortcut will only work when the name of the table is the same as the name of the value
    productForm.handle(req, {
        "success": async (form) => {
            let { tags, ...productData } = form.data;
            productToEdit.set(productData)
            productToEdit.save()

            // The complex solution -> Check which one is inside and remove those that is not
            // // remove all the tags that don't belong to the product
            let newTagsId = tags.split(",")
            // let toRemove = selectedTagIds.filter( id => newTagsId.includes(id) === false)
            // await productToEdit.tags().detach(toRemove);

            // // add in all the tags selected in the form
            // // i.e select all the tags that are in the form but not added to the products yet
            // let toAdd = newTagsId.filter(id=> selectedTagIds.includes(id) === false);
            // await productToEdit.tags().attach(toAdd);

            // Alternate solution -> throw everything
            productToEdit.tags().detach(selectedTagIds);
            productToEdit.tags().attach(newTagsId)

            req.flash("success_messages", "Product has been updated")
            res.redirect("/products")
        },
        "error": async (form) => {
            res.render("products/update", {
                "form": form.toHTML(bootstrapField)
            })
        }
    })
})

router.get('/:product_id/delete', checkIfAuthenticated, async (req, res) => {
    // 1. get the product that we want to delete
    // i.e, select * from products where id = ${product_id}
    const productToDelete = await Product.where({
        'id': req.params.product_id
    }).fetch({
        require: true
    });

    res.render('products/delete', {
        'product': productToDelete.toJSON()
    })
})

router.post('/:product_id/delete', checkIfAuthenticated, async (req, res) => {
    const productToDelete = await Product.where({
        'id': req.params.product_id
    }).fetch({
        require: true
    });

    // delete the product
    await productToDelete.destroy();
    req.flash("success_messages", "Product has been deleted")

    res.redirect('/products');
})

module.exports = router