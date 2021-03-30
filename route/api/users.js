const express = require("express")
const router = express.Router();
const jwt = require("jsonwebtoken")
const crypto = require("crypto")
const { User, BlacklistedToken } = require("../../models")
const { checkIfAuthenticatedJWT } = require("../../middleware")

const generateAccessToken = (user, secret, expiresIn) => {
    return jwt.sign(user, secret, {
        "expiresIn": expiresIn
    })
}

const getHashedPassword = (password) => {
    const sha256 = crypto.createHash("sha256")
    const hash = sha256.update(password).digest("base64")
    return hash
}

router.post("/login", async (req, res) => {
    //User is loging in with email and password
    let user = await User.where({
        "email": req.body.email
    }).fetch({
        require: false
    })

    if (user && user.get("password") == getHashedPassword(req.body.password)) {
        let accessToken = generateAccessToken({
            "username": user.get("username"),
            "email": user.get("email"),
            "id": user.get("id")
        }, process.env.TOKEN_SECRET, "15m")
        let refreshToken = generateAccessToken({
            "username": user.get("username"),
            "email": user.get("email"),
            "id": user.get("id")
        }, process.env.REFRESH_TOKEN_SECRET, "7d")
        res.send({ accessToken, refreshToken })
    } else {
        res.status(401)
        res.send({
            "Error": "Invalid Email/Password"
        })
    }
})

router.get("/profile", checkIfAuthenticatedJWT, async (req, res) => {
    let user = req.user
    res.send(user)
})

router.post("/refresh", async (req, res) => {
    let refreshToken = req.body.refreshToken
    if (!refreshToken) {
        res.sendStatus(401);
    }
    jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, (err, user) => {
        if (err) {
            res.sendStatus(403)
        } else {
            let accessToken = generateAccessToken({
                "username": user.username,
                "id": user.id,
                "email": user.email
            }, process.env.TOKEN_SECRET, "15m")
            res.send({
                accessToken
            })
        }
    })
})


router.post("/logout", async (req, res) => {
    let refreshToken = req.body.refreshToken;
    if (!refreshToken) {
        res.sendStatus(403);
    } else {
        let blacklistedToken = await BlacklistedToken.where({
            "token":refreshToken
        }).fetch({
            require:false
        })

        if (blacklistedToken){
            res.status(401)
            res.send("Token Expired")
            return
        }
        jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET, async (err, user) => {
            if (err) {
                res.sendStatus(403);
            } else {
                const token = new BlacklistedToken();
                token.set("token", refreshToken)
                token.set("date_created", new Date())
                await token.save()
                res.send({
                    "Message": "Logged Out"
                })
            }
        })
    }
})

module.exports = router