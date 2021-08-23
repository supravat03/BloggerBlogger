const fs= require("fs");
const koa = require("koa");
const koaRouter = require("koa-router");
const path = require("path");
const render = require("koa-ejs");
const serve = require("koa-static");
const bodyParser= require('koa-bodyparser');

const app = new koa();
const router = new koaRouter();

const data= require("./data");


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





router.get("/", async (ctx) => {
    await ctx.render("index");
});
router.get("/blogs", async (ctx) => {
    await ctx.render("blogs",{data: data});
});

router.get("/blogs/:id", async (ctx)=>{
    const {id}= ctx.params;
    const particularPost= data.find((blog)=>blog.blogId== Number(id));
    // console.log(particularPost);
    await ctx.render("view",{particularPost:particularPost});
})


router.get("/posts", async (ctx)=>{
    await ctx.render("posts",{data: data})
})

router.get("/posts/update/:id", async (ctx)=>{
    const {id}= ctx.params;
    const updateTarget= data.find(blog=> blog.blogId===id);
    await ctx.render("update",{data: updateTarget})
    
})
.post("/posts/update/:id", async (ctx)=>{
    const {id}= ctx.params;
    const{blogTitle,blogBody}= ctx.request.body;

    let targetPost= data.find(blog=> blog.blogId==id);
    targetPost.blogTitle=blogTitle;
    targetPost.blogBody= blogBody;

    ctx.redirect("/posts");
})


router.get("/compose", async (ctx)=>{
    await ctx.render("compose")
})
.post("/compose",async (ctx)=>{
    const{blogTitle,blogBody}= ctx.request.body;
    console.log(blogBody);
    const newBlogId= Number(data[data.length-1].blogId)+1;
    data.push({
        "blogId":newBlogId,
        "blogTitle":blogTitle,
        "blogBody" :blogBody
    })
    ctx.redirect("/blogs");

})






app.listen(3000, () => console.log("server is running !"));
