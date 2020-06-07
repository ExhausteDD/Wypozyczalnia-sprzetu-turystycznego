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

app.listen(3003, function() {
    console.log('Node express work on 3003');
});

app.get('/', function(req, res) {
    con.query(
        'SELECT * FROM goods',
        function(error, result) {
            if (error) throw err;
            // console.log(result);
            let goods = {};
            for (let i = 0; i < result.length; i++){
                goods[result[i]['id']] = result[i];
            }
            // console.log(goods);
            console.log(JSON.parse(JSON.stringify(goods)));
            res.render('main', {
                foo: 'hello',
                bar: 7,
                goods: JSON.parse(JSON.stringify(goods))
            });
        }
    );
});
