const {Client}= require('pg');
const connection= new Client({
    user: 'postgres',
    host: 'localhost',
    database:'bloggerblogger',
    password: 'root',
    port: 5432
});


module.exports= connection;


