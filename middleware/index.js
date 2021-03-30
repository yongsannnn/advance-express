const jwt = require("jsonwebtoken")

const checkIfAuthenticated = (req, res, next) => {
    if (req.session.user) {
        // if there is session for this user, go next
        next();
    } else {
        req.flash("error_messages", "Please login first")
        res.redirect("/users/login")
        // when there is error, dont let them go next()
        // this case, redirect all to login page. 
    }
}

const checkIfAuthenticatedJWT = (req, res, next) => {
    const authHeader = req.headers.authorization
    if (authHeader) {
        const token = authHeader.split(" ")[1]
        jwt.verify(token, process.env.TOKEN_SECRET, (err, user) => {
            if (err) {
                res.sendStatus(403)
            }
            req.user = user;
            next();
        })
    } else {
        res.status(401)
        res.send({
            "Message": "Login Required"
        })
    }
}

module.exports = {
    checkIfAuthenticated,checkIfAuthenticatedJWT
}