let express = require('express');
let  app = express();
/**
 * public - name of folder where are all files of app
 */
app.use(express.static('public'));

/**
 * pug - tempate engine of html
 */
app.set('view engine', 'pug');

/**
 * connect mysql module
 */
let mysql = require('mysql');

/**
 * confugure mysql module
 */
let con = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'wypozyczalnia'
});

app.use(express.json());

app.listen(3003, function() {
    console.log('Node express work on 3003');
});

app.get('/', function(req, res) {
    con.query(
        'SELECT * FROM goods',
        function(error, result) {
            if (error) throw error;
            let goods = {};
            for (let i = 0; i < result.length; i++){
                goods[result[i]['id']] = result[i];
            }
            console.log(JSON.parse(JSON.stringify(goods)));
            res.render('main', {
                foo: 'hello',
                bar: 7,
                goods: JSON.parse(JSON.stringify(goods))
            });
        }
    );
});

app.get('/category', function(req, res) {
    console.log(req.query.id);
    let categoryId = req.query.id;

    let category = new Promise(function(resolve, reject){
        con.query(
            'SELECT * FROM category WHERE id='+categoryId,
            function(error, result){
                if (error) reject(error);
                resolve(result);
            }
        );
    });
    let goods = new Promise(function(resolve, reject){
        con.query(
            'SELECT * FROM goods WHERE category='+categoryId,
            function(error, result){
                if (error) reject(error);
                resolve(result);
            }
        );
    });

    Promise.all([category, goods]).then(function(value){
        res.render('category', {
            category: JSON.parse(JSON.stringify(value[0])),
            goods: JSON.parse(JSON.stringify(value[1]))
        });
    });
});

app.get('/goods', function(req, res) {
    console.log(req.query.id);
    con.query('SELECT * FROM goods WHERE id='+req.query.id, function(error, result, fields){
        if (error) throw error;
        res.render('goods', {goods: JSON.parse(JSON.stringify(result))});
    });
});


app.post('/get-category-list', function(req, res){
    // console.log(req.body);
    con.query('SELECT id, category FROM category', function(error, result, fields){
        if (error) throw error;
        console.log(result);
        res.json(result);
    });
});

app.post('/get-goods-info', function(req, res){
    console.log(req.body.key);
    con.query('SELECT id, name, cost FROM goods WHERE id IN ('+req.body.key.join(',')+')', function(error, result, fields){
        if (error) throw error;
        console.log(result);
        let goods = {};
        for (let i = 0; i < result.length; i++){
            goods[result[i]['id']] = result[i];
        }
        res.json(goods);
    });
});