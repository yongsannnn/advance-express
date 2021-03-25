const express = require("express")
const router = express.Router();
const crypto = require("crypto")

const { User } = require("../models")

const { createUserForm, bootstrapField, createLoginForm} = require("../forms")

// Creating a hash password

const getHashedPassword = (password) => {
    const sha256 = crypto.createHash("sha256")
    const hash = sha256.update(password).digest("base64")
    return hash
}

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
            // Create the hash version of the password
            userData.password = getHashedPassword(userData.password);
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
    const loginForm = createLoginForm()
    res.render("users/login",{
       "form": loginForm.toHTML(bootstrapField)
   })
})

router.post("/login", async (req,res)=>{
    const loginForm = createLoginForm()
    loginForm.handle(req,{
        "success": async(form)=>{
            // Find use based on the email address
            let user = await User.where({
                "email": form.data.email
            }).fetch();

            // If user exist, check if password matches
            if (user){
                // If password match, authenticate the user and save the user data into session
                if ( user.get("password") == getHashedPassword(form.data.password)) {
                    //Saving data into session
                    req.session.user = {
                        id: user.get("id"),
                        username: user.get("username"),
                        email: user.get("email")
                    }
                    req.flash("success_messages", `Hi ${req.session.user.username}. `)
                    res.redirect("/products")
                } 
            } else {
                // Password does not match
                // Redirect to login page with error message
                req.flash("error_messages", "Login failed, check email and password.")
                res.redirect("/users/login")
            }
        },
        "error": (form)=>{
            res.render("users/login",{
                "form": form.toHTML(bootstrapField)
            })
        }
    })
})

router.get("/profile",(req,res)=>{
    if(!req.session.user){
        // User not logged in 
        req.flash("error_messages", "Please login first.")
        res.redirect("/users/login")
    }else{
        res.render("users/profile",{
            "user": req.session.user
        })
    }
})

router.get("/logout",(req,res)=>{
    req.session.user = null
    req.flash("success_messages","Successfully logout")
    res.redirect("/users/login")
})

module.exports = router
