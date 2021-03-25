const checkIfAuthenticated = (req,res,next)=> {
    if (req.session.user){
        // if there is session for this user, go next
        next();
    } else {
        req.flash("error_messages", "Please login first")
        res.redirect("/users/login")
        // when there is error, dont let them go next()
        // this case, redirect all to login page. 
    }
} 

module.exports = {
    checkIfAuthenticated
}