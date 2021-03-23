// load in Router to setup the routes
const express = require("express")
const router = express.Router();

// import in the Product model
// STEP 1
const {Product, Category} = require("../models")

// Alternate
// const models = require("../models")
// to refer to the product model
// we use "models.Product"

//import in the forms
const {createProductForm, bootstrapField}=require("../forms")

router.get("/", async (req,res)=>{
    // If this is pure SQL
    // SELECT * FROM Products
    // Previously we did this using mysql2
    // const query = "SELECT * From Products"
    // const [products] = connection.execute(query)

    // STEP 2 Call the model
    let products = await Product.collection().fetch({
        withRelated:["category"]
    }); 

    // STEP 3 Pass to the route, must make the variable into JSON file
    res.render("products/index", {
        "products": products.toJSON()
    })
})

router.get("/create", async (req,res)=>{
    const allCategories = await Category.fetchAll().map((category)=>{
        return [category.get("id"), category.get("name")]
    })
    const productForm = createProductForm(allCategories);
    res.render("products/create", {
        "form": productForm.toHTML(bootstrapField)
    })
})

router.post("/create", (req,res)=>{
    const productForm = createProductForm();
    productForm.handle(req,{
        "success": async(form) => {
            // use the Product model to save a new instance of Product
            // Create a new row in the Products table
            const newProduct = new Product();
            newProduct.set("name",form.data.name);
            newProduct.set("cost",form.data.cost);
            newProduct.set("description",form.data.description);
            newProduct.set("category_id",form.data.category_id);
            await newProduct.save();
            res.redirect("/products")
        },
        "error":(form)=> {
            res.render("products/create", {
                "form": form.toHTML(bootstrapField)
            })
        }
    })
})


router.get("/:product_id/update", async(req,res)=>{
    const allCategories = await Category.fetchAll().map((category)=>{
        return [category.get("id"), category.get("name")]
    })
    // STEP 1 - Get the product that we want to update
    // This is the same as "SELEC * From Products WHERE id = ${product_id}"
    const productToEdit = await Product.where({
        "id": req.params.product_id
    }).fetch({
        required:true
    });
    // res.send(productToEdit)
    
    // STEP 2 - send the product to the view

    const form = createProductForm(allCategories);
    form.fields.name.value = productToEdit.get("name");
    form.fields.cost.value = productToEdit.get("cost");
    form.fields.description.value = productToEdit.get("description");
    form.fields.category_id.value = productToEdit.get("category_id");

    res.render("products/update", {
        "form": form.toHTML(bootstrapField),
        "product": productToEdit.toJSON()
    })
})


router.post("/:product_id/update", async(req,res)=>{
    const productToEdit = await Product.where({
        "id": req.params.product_id
    }).fetch({
        required:true
    });

    const productForm = createProductForm();

    // This shortcut will only work when the name of the table is the same as the name of the value
    productForm.handle(req,{
        "success": async(form) =>{
            productToEdit.set(form.data)
            productToEdit.save()
            res.redirect("/products")
        },
        "error": async(form)=> {
            res.render("products/update", {
                "form": form.toHTML(bootstrapField)
            })
        }
    })
})

router.get('/:product_id/delete', async (req,res)=>{
    // 1. get the product that we want to delete
    // i.e, select * from products where id = ${product_id}
    const productToDelete = await Product.where({
        'id': req.params.product_id
    }).fetch({
        required: true
    });

    res.render('products/delete.hbs', {
        'product': productToDelete.toJSON()
    })
})

router.post('/:product_id/delete', async(req,res)=>{
    const productToDelete = await Product.where({
        'id': req.params.product_id
    }).fetch({
        required: true
    });

    // delete the product
    await productToDelete.destroy();
    res.redirect('/products');
})

module.exports = router