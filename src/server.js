const fs = require("fs");
const path = require("path");

const config = require("config");

const express = require("express");
const csrf = require("csurf");
const cookieParser = require("cookie-parser");
const passport = require("passport");
const jwt = require("jsonwebtoken");
const { v4: uuid } = require("uuid");
const { Strategy: SamlStrategy } = require("passport-saml");
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");

const redis = require("./middleware/redis");


const app = express();

app.use(redis(config.redis));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/static", express.static("assets"));

const csrfProtection = csrf({
  cookie: true,
});
app.use(passport.initialize());

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

const jwtSecret = "hogefoo";

const { auth } = config;

let cert;
if (auth.saml.cert && auth.saml.cert.type === "file") {
  cert = fs.readFileSync(path.resolve(__dirname, "../", auth.saml.cert.path), "utf8").trim();
}

const samlStrategy = new SamlStrategy({
  issuer: auth.saml.issuer,
  entryPoint: auth.saml.entryPoint,
  cert,
  passReqToCallback: true,
}, (req, profile, done) => {
  const ott = uuid();
  const user = {
    id: profile.nameID,
  };
  req.ott = ott;
  key = "auth_ott:" + ott;
  req.redisClient.set(key, JSON.stringify(user), () => done(null, user));
});

const jwtStrategy = new JwtStrategy({
  secretOrKey: jwtSecret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
}, (jwtPayload, done) => {
  const { expire } = jwtPayload;
  if (Date.now() / 1000 > expire) {
    return done(null, false);
  }
  done(null, jwtPayload);
});

passport.use(samlStrategy);
passport.use(jwtStrategy);

app.get("/auth/login", csrfProtection, (req, res, next) => {
  const stateToken = req.csrfToken();
  res.cookie("state", stateToken, {
    path: "/",
    sameSite: "Strict",
  });
  next();
}, passport.authenticate("saml"));

app.post("/auth/saml-consume", passport.authenticate("saml"), (req, res) => {
  res.redirect(`${auth.saml.callback}?ott=${req.ott}`);
});

app.post("/auth/token", csrfProtection, async (req, res) => {
  const { ott } = req.body;
  if (!ott) {
    return res.status(400).end();
  }
  const key = "auth_ott:" + ott
  req.redisClient.get(key, (_, val) => {
    req.redisClient.del(key);
    if (!val) {
      return res.status(400).end();
    }
    const user = JSON.parse(val);
    const accessToken = jwt.sign({ ...user, expire: ~~(Date.now() / 1000) + auth.jwt.expire }, jwtSecret);
    res.status(200).json({ accessToken }).end();
  });
});

// The following APIs require bearer authorization header
app.get("/api/test", passport.authenticate("jwt"), (req, res) => {
  res.json({ success: true }).status(200).end();
});

// Global error handler
app.use(function (err, req, res, next) {
  if (err.code !== "EBADCSRFTOKEN") return next(err);

  // handle CSRF token errors here
  res.status(403).json({ messages: ["invalid csrf"] }).end();
});

app.listen(3000, () => console.log("app start!"));
