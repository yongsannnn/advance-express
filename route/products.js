// load in Router to setup the routes
const express = require("express")
const router = express.Router();

// import in the Product model
// STEP 1
const { Product, Category, Tag } = require("../models")

// Alternate
// const models = require("../models")
// to refer to the product model
// we use "models.Product"

//import in the forms
const { createProductForm, bootstrapField } = require("../forms")

router.get("/", async (req, res) => {
    // If this is pure SQL
    // SELECT * FROM Products
    // Previously we did this using mysql2
    // const query = "SELECT * From Products"
    // const [products] = connection.execute(query)

    // STEP 2 Call the model
    let products = await Product.collection().fetch({
        withRelated: ["category"]
    });

    // STEP 3 Pass to the route, must make the variable into JSON file
    res.render("products/index", {
        "products": products.toJSON()
    })
})

router.get("/create", async (req, res) => {
    const allCategories = await Category.fetchAll().map((category) => {
        return [category.get("id"), category.get("name")]
    })

    const allTags = await Tag.fetchAll().map(tag => [tag.get("id"), tag.get("name")])
    const productForm = createProductForm(allCategories, allTags);
    res.render("products/create", {
        "form": productForm.toHTML(bootstrapField)
    })
})

router.post("/create", async (req, res) => {
    const allCategories = await Category.fetchAll().map((category) => {
        return [category.get("id"), category.get("name")]
    })

    const allTags = await Tag.fetchAll().map(tag => [tag.get("id"), tag.get("name")])

    const productForm = createProductForm(allCategories,allTags);
    productForm.handle(req, {
        "success": async (form) => {
            // console.log(form.data)
            let { tags, ...productData } = form.data;
            // we need to seperate because the product table dont have the tags. 
            // console.log("---")
            // console.log(productData)

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


router.get("/:product_id/update", async (req, res) => {
    const allCategories = await Category.fetchAll().map((category) => {
        return [category.get("id"), category.get("name")]
    })
    const allTags = await Tag.fetchAll().map(tag => [tag.get("id"), tag.get("name")])

    // STEP 1 - Get the product that we want to update
    // This is the same as "SELECT * From Products WHERE id = ${product_id}"
    const productToEdit = await Product.where({
        "id": req.params.product_id
    }).fetch({
        required: true,
        withRelated: ["tags"]
    });

    const productJSON = productToEdit.toJSON();
    const selectedTagIds = productJSON.tags.map(t => t.id)
    // res.send(productToEdit)

    // STEP 2 - send the product to the view

    const form = createProductForm(allCategories, allTags);
    form.fields.name.value = productToEdit.get("name");
    form.fields.cost.value = productToEdit.get("cost");
    form.fields.description.value = productToEdit.get("description");
    form.fields.category_id.value = productToEdit.get("category_id");
    form.fields.tags.value = selectedTagIds;

    res.render("products/update", {
        "form": form.toHTML(bootstrapField),
        "product": productJSON
    })
})


router.post("/:product_id/update", async (req, res) => {
    const productToEdit = await Product.where({
        "id": req.params.product_id
    }).fetch({
        required: true,
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

router.get('/:product_id/delete', async (req, res) => {
    // 1. get the product that we want to delete
    // i.e, select * from products where id = ${product_id}
    const productToDelete = await Product.where({
        'id': req.params.product_id
    }).fetch({
        required: true
    });

    res.render('products/delete', {
        'product': productToDelete.toJSON()
    })
})

router.post('/:product_id/delete', async (req, res) => {
    const productToDelete = await Product.where({
        'id': req.params.product_id
    }).fetch({
        required: true
    });

    // delete the product
    await productToDelete.destroy();
    req.flash("success_messages", "Product has been deleted")

    res.redirect('/products');
})

module.exports = router