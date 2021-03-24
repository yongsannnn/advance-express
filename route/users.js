const express = require("express")
const router = express.Router();

const { User } = require("../models")

const { createUserForm, bootstrapField } = require("../forms")


router.get("/register",(req,res)=>{
    const registrationForm = createUserForm();

    res.render("users/register",{
        form: registrationForm.toHTML(bootstrapField)
    })
})

router.post("/register", (req,res)=>{
    const registrationForm = createUserForm();
    registrationForm.handle(req,{
        "success": async(form)=>{
            let {confirm_password, ...userData} = form.data
            const user= new User(userData)

            await user.save();
            req.flash("success_messages", "New user created")
            res.redirect("/users/login")


            // const user=new User({
            //     "username": form.data.username,
            //     "password": form.data.password,
            //     "email": form.data.email
            // })
        },
        "error": (form)=>{
            res.render("users/register",{
                "form": form.toHTML(bootstrapField)
            })
        }
    })
})
router.get("/login",(req,res)=>{

    res.render("users/login")
})


module.exports = router
