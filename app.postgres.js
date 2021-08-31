const connection = require("./dbConfigPostgres");
const koa = require("koa");
const koaRouter = require("koa-router");
const path = require("path");
const render = require("koa-ejs");
const serve = require("koa-static");
const bodyParser = require("koa-bodyparser");

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

connection.connect((err) => {
  if (err) console.log(err);
  else console.log("postgres connected");
});

//return promise for any query

const query = (queryString) => {
  return new Promise((resolve, reject) => {
    connection.query(queryString, (err, results) => {
      if (err) {
        throw err;
      }
      resolve(results.rows);
     
    });
  });
};

router.get("/", async (ctx) => {
  await ctx.render("index");
});

router.get("/blogs", async (ctx) => {
  const sql = "SELECT * FROM posts";
  const data = await query(sql);
  await ctx.render("blogs", { data: data });
});

router.get("/blogs/:id", async (ctx) => {
  const { id } = ctx.params;
  const sql = {
    text: 'SELECT * FROM posts WHERE post_id= $1',
    values: [id],
  }
  const particularPost = await query(sql);
  await ctx.render("view", { particularPost: particularPost[0] });
});

router.get("/posts", async (ctx) => {
  const sql = "SELECT * FROM posts";
  const data = await query(sql);
  await ctx.render("posts", { data: data });
});

router
  .get("/posts/update/:id", async (ctx) => {
    const { id } = ctx.params;
    const sql = {
      text: 'SELECT * FROM posts WHERE post_id= $1',
      values: [id],
    }
    const updateTarget = await query(sql);
    await ctx.render("update", { data: updateTarget[0] });
  })
  .post("/posts/update/:id", async (ctx) => {
    const { id } = ctx.params;
    const { postTitle, postBody } = ctx.request.body;
    const sql = {
      text: 'UPDATE posts SET post_title= $1, post_body= $2 WHERE post_id=$3',
      values: [postTitle,postBody,id],
    }
    await query(sql);
    ctx.redirect("/posts");
  })
  .get("/posts/delete/:id", async (ctx) => {
    const { id } = ctx.params;
    const sql = {
      text: 'DELETE FROM posts WHERE post_id=$1',
      values: [id],
    }
    await query(sql);
    ctx.redirect("/posts");
  });
router
  .get("/compose", async (ctx) => {
    await ctx.render("compose");
  })
  .post("/compose", async (ctx) => {
    const { postTitle, postBody } = ctx.request.body;
    const sql = {
      text: 'INSERT INTO posts (post_title,post_body) VALUES($1,$2)',
      values: [postTitle,postBody]
    }
    await query(sql);
    ctx.redirect("/blogs");
  });

app.listen(3000, () => console.log("server is running !"));
