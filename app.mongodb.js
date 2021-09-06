const koa = require("koa");
const koaRouter = require("koa-router");
const path = require("path");
const render = require("koa-ejs");
const serve = require("koa-static");
const bodyParser = require("koa-bodyparser");
const mongoose = require("mongoose");
const session = require("koa-session");
const passport = require("koa-passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = new koa();
const router = new koaRouter();

// sessions
app.keys = ["super-secret-key"];
app.use(session(app));

render(app, {
  root: path.join(__dirname, "views"),
  layout: "layout",
  viewExt: "html",
  cache: false,
  debug: false,
});

//middlewares

app.use(bodyParser());
app.use(serve(__dirname + "/public"));

app.use(passport.initialize());
app.use(passport.session());

app.use(async (ctx, next) => {
  if (ctx.isAuthenticated()) {
    ctx.state.logStatus = ctx.isAuthenticated();
  } else {
    ctx.state.logStatus = false;
  }
  await next();
});

app.use(router.routes()).use(router.allowedMethods());

//connect to the Database bloggerblogger
mongoose.connect("mongodb://localhost:27017/bloggerblogger");

//create mongoose schema

const postSchema = new mongoose.Schema({
  post_title: String,
  post_body: String,
  user_id: String,
});

const userSchema = new mongoose.Schema({
  email: String,
  password: String,
});

userSchema.plugin(passportLocalMongoose);
postSchema.plugin(passportLocalMongoose);

//create mongoose model

const Post = mongoose.model("post", postSchema);
const User = mongoose.model("user", userSchema);

// use static authenticate method of model in LocalStrategy
passport.use(User.createStrategy());

// use static serialize and deserialize of model for passport session support
passport.serializeUser(function (user, done) {
  done(null, user._id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

router.get("/", async (ctx) => {
  // console.log(ctx.session.passport.user);
  await ctx.render("index");
});

router.get("/blogs", async (ctx) => {
  try {
    const data = await Post.find({});
    await ctx.render("blogs", { data: data });
  } catch (err) {
    console.log(err);
  }
});

router.get("/blogs/:id", async (ctx) => {
  const { id } = ctx.params;
  try {
    const particularPost = await Post.find({ _id: id });
    await ctx.render("view", { particularPost: particularPost[0] });
  } catch (err) {
    console.log(err);
  }
});

router.get("/posts", async (ctx) => {
  if (!ctx.isAuthenticated()) ctx.redirect("/login");
  else {
    try {
      const data = await Post.find({ user_id: ctx.session.passport.user });
      await ctx.render("posts", { data: data });
    } catch (err) {
      console.log(err);
    }
  }
});

router.get("/register", async (ctx) => {
  await ctx.render("register");
});

router.post("/register", async (ctx, next) => {
  const { username, password } = ctx.request.body;

  try {
    await User.register({ username: username }, password);
    return passport.authenticate("local", (err, user, info, status) => {
      if (user) {
        ctx.login(user);
        console.log("authenticated");
        ctx.redirect("/");
      } else {
        throw err;
      }
    })(ctx, next);
  } catch (err) {
    console.log(err);
  }
});

router.get("/login", async (ctx) => {
  await ctx.render("login");
});

router.post("/login", async (ctx) => {
  try {
  return passport.authenticate("local", (err, user, info, status) => {
    if (user) {
      console.log(user._id);
      ctx.login(user);
      ctx.redirect("/");
    } else {
      // ctx.status = 400;
      // ctx.body = { status: 'error' };
      ctx.redirect("/login");
    }
  })(ctx);
} catch (err) {
    console.log(err);
}
});

router.get("/logout", async (ctx) => {
  await ctx.logout();
  await ctx.redirect("/");
});

router
  .get("/posts/update/:id", async (ctx) => {
    if (!ctx.isAuthenticated()) ctx.redirect("/login");
    else {
      const { id } = ctx.params;
      try {
        const updateTarget = await Post.find({ _id: id });
        await ctx.render("update", { data: updateTarget[0] });
      } catch (err) {
        console.log(err);
      }
    }
  })
  .post("/posts/update/:id", async (ctx) => {
    if (!ctx.isAuthenticated()) ctx.redirect("/login");
    else {
      const { id } = ctx.params;
      const { postTitle, postBody } = ctx.request.body;
      try {
        await Post.updateOne(
          { _id: id },
          { post_title: postTitle, post_body: postBody }
        );
        ctx.redirect("/posts");
      } catch (err) {
        console.log(err);
      }
    }
  })
  .get("/posts/delete/:id", async (ctx) => {
    if (!ctx.isAuthenticated()) ctx.redirect("/login");
    else {
      const { id } = ctx.params;
      try {
        await Post.deleteOne({ _id: id });
        ctx.redirect("/posts");
      } catch (err) {
        console.log(err);
      }
    }
  });
router
  .get("/compose", async (ctx) => {
    // if(! ctx.isAuthenticated()) ctx.redirect("/login");
    await ctx.render("compose");
  })
  .post("/compose", async (ctx) => {
    if (!ctx.isAuthenticated()) ctx.redirect("/login");
    else {
      const { postTitle, postBody } = ctx.request.body;
      try {
        const newPost = new Post({
          post_title: postTitle,
          post_body: postBody,
          user_id: ctx.session.passport.user,
        });
        await newPost.save();
        ctx.redirect("/blogs");
      } catch (err) {
        console.log(err);
      }
    }
  });

app.listen(3000, () => console.log("server is running !"));
