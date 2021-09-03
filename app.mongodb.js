const koa = require("koa");
const koaRouter = require("koa-router");
const path = require("path");
const render = require("koa-ejs");
const serve = require("koa-static");
const bodyParser = require("koa-bodyparser");
const mongodb= require('mongodb');
const mongoose= require('mongoose');
const { resolve } = require("path");



const app = new koa();
const router = new koaRouter();

// var data= require("./data");

render(app, {
  root: path.join(__dirname, "views"),
  layout: "layout",
  viewExt: "html",
  cache: false,
  debug: false,
});

app.use(bodyParser());
app.use(serve(__dirname + "/public"));
app.use(router.routes()).use(router.allowedMethods());

//connect to the Database bloggerblogger
 mongoose.connect("mongodb://localhost:27017/bloggerblogger");

 //create mongoose schema

 const postSchema= new mongoose.Schema({
     post_title: String,
     post_body: String
 });

 //create mongoose model

 const Post= mongoose.model("post",postSchema);


router.get("/", async (ctx) => {
  await ctx.render("index");
});

router.get("/blogs", async(ctx) => {
    try{
    const data= await Post.find({});
    await ctx.render("blogs",{data:data});
    }catch(err){
        console.log(err);
    }
  
});

router.get("/blogs/:id", async (ctx) => {
  const { id } = ctx.params;
  try {
    const particularPost = await Post.find({_id:id});
    await ctx.render("view", { particularPost: particularPost[0] });  
  } catch (err) {
      console.log(err);
  }

});

router.get("/posts", async (ctx) => {
    try {
        const data = await Post.find({});
        await ctx.render("posts", { data: data });
    } catch (err) {
        console.log(err);
    }

});

router
  .get("/posts/update/:id", async (ctx) => {
    const { id } = ctx.params;
    try {
        const updateTarget = await Post.find({_id:id});;
        await ctx.render("update", { data: updateTarget[0] });
    } catch (err) {
        console.log(err);
    }

  })
  .post("/posts/update/:id", async (ctx) => {
    const { id } = ctx.params;
    const { postTitle, postBody } = ctx.request.body;
   try {
    await Post.updateOne({_id:id},{post_title:postTitle,post_body:postBody});
    ctx.redirect("/posts"); 
   } catch (err) {
       console.log(err)
   }

  })
  .get("/posts/delete/:id", async (ctx) => {
    const { id } = ctx.params;
    try {
        await Post.deleteOne({_id:id})
        ctx.redirect("/posts");
    } catch (err) {
        console.log(err);
    }

  });
router
  .get("/compose", async (ctx) => {
    await ctx.render("compose");
  })
  .post("/compose", async (ctx) => {
    const { postTitle, postBody } = ctx.request.body;
    try {
        const newPost= new Post({
            post_title: postTitle,
            post_body: postBody
        });
        await newPost.save();
        ctx.redirect("/blogs");
    } catch (err) {
        console.log(err);        
    }

  });

app.listen(3000, () => console.log("server is running !"));
