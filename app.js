let express = require('express');
let app = express();
let cookieParser = require('cookie-parser');
let admin = require('./admin');
let makeHash = require('./hash');

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


/**
 * confugure nodemailer module
 */
const nodemailer = require('nodemailer');


app.use(express.json());
app.use(express.urlencoded());
app.use(cookieParser());

app.listen(3003, function () {
    console.log('Node express work on 3003');
});

app.use(function (req, res, next) {
    if (req.originalUrl == '/admin' || req.originalUrl == '/admin-order') {
        admin(req, res, con, next);
    }
    else {
        next();
    }
});

app.get('/', function (req, res) {
    let category = new Promise(function (resolve, reject) {
        con.query(
            "select id,name, cost, image, category, slug from (select id,name,cost,image,category, slug, if(if(@curr_category != category, @curr_category := category, '') != '', @k := 0, @k := @k + 1) as ind   from goods, ( select @curr_category := '' ) v ) goods where ind < 3",
            function (error, result, fields) {
                if (error) return reject(error);
                resolve(result);
            }
        );
    });

    let categoryDescription = new Promise(function (resolve, reject) {
        con.query(
            "SELECT * FROM category ",
            function (error, result, field) {
                if (error) return reject(error);
                resolve(result);
            }
        );
    });
    Promise.all([category,categoryDescription]).then(function (value) {
        console.log(value[0]);
        res.render('index', {
            goods: JSON.parse(JSON.stringify(value[0])),
            category: JSON.parse(JSON.stringify(value[1])),
        });
    });
});


app.get('/category', function (req, res) {
    console.log(req.query.id);
    let categoryId = req.query.id;

    let category = new Promise(function (resolve, reject) {
        con.query(
            'SELECT * FROM category WHERE id=' + categoryId,
            function (error, result) {
                if (error) reject(error);
                resolve(result);
            }
        );
    });
    let goods = new Promise(function (resolve, reject) {
        con.query(
            'SELECT * FROM goods WHERE category=' + categoryId,
            function (error, result) {
                if (error) reject(error);
                resolve(result);
            }
        );
    });

    Promise.all([category, goods]).then(function (value) {
        res.render('category', {
            category: JSON.parse(JSON.stringify(value[0])),
            goods: JSON.parse(JSON.stringify(value[1]))
        });
    });
});

app.get('/goods/*', function (req, res) {
    console.log(req.query.id);
    con.query('SELECT * FROM goods WHERE slug="' + req.params['0'] + '"', function (error, result, fields) {
        if (error) throw error;
        console.log(result);
        result = JSON.parse(JSON.stringify(result));
        console.log(result[0]['id']);
        con.query('SELECT * FROM images WHERE goods_id=' + result[0]['id'], function (error, goodsImages, fields) {
            if (error) throw error;
            console.log(goodsImages); 
            goodsImages = JSON.parse(JSON.stringify(goodsImages)); 
            res.render('goods', { 
                goods: result, 
                goods_images: goodsImages 
            });
        });
    });
});

app.get('/order', function (req, res) {
        res.render('order');
});


app.post('/get-category-list', function (req, res) {
    con.query('SELECT id, category FROM category', function (error, result, fields) {
        if (error) throw error;
        console.log(result);
        res.json(result);
    });
});

app.post('/get-goods-info', function (req, res) {
    console.log(req.body.key);
    if (req.body.key.length != 0) {
        con.query('SELECT id, name, cost FROM goods WHERE id IN (' + req.body.key.join(',') + ')', function (error, result, fields) {
            if (error) throw error;
            console.log(result);
            let goods = {};
            for (let i = 0; i < result.length; i++) {
                goods[result[i]['id']] = result[i];
            }
            res.json(goods);
        });
    }
    else {
        res.send('0');
    }
});

app.post('/finish-order', function (req, res) {
    console.log(req.body);
    if (req.body.key.length != 0) {
        let key = Object.keys(req.body.key);
        con.query(
            'SELECT id, name, cost FROM goods WHERE id IN (' + key.join(',') + ')', 
            function (error, result, fields) {   
                if (error) throw error;
                console.log(result);  
                sendMail(req.body, result).catch(console.error);
                saveOrder(req.body, result);
                res.send('1');  
            });          
    }
    else {
    res.send('0');
    }
});

app.get('/admin', function (req, res) {
    res.render('admin', {}); 
});   

app.get('/admin-order', function (req, res) {
    con.query(`SELECT 
	s.id as id,
    s.user_id as user_id,
    s.goods_id as goods_id,
    s.goods_cost as goods_cost,
    s.goods_amount as goods_amount,
    s.total as total,
    from_unixtime(date,"%Y-%m-%d %h:%m") as human_date,
    u.user_name as user,
    u.user_phone as phone,
    u.address as address
    
FROM 
	shop_order s
LEFT JOIN 
	user_info u
ON s.user_id = u.id`, function (error, result, fields) {
        if (error) throw error;
        res.render('admin-order', { order: JSON.parse(JSON.stringify(result)) });
    });
});    


/**
 *      login form
 */
app.get('/login', function (req, res) {
    res.render('login', {});
    });

app.post('/login', function (req, res) {
    console.log('==========================================')
    console.log(req.body);
    console.log(req.body.login);
    console.log(req.body.password);
    console.log('==========================================')
    con.query(
        'SELECT * FROM user WHERE login="' + req.body.login+'" and password="'+req.body.password+'"',
        function (error, result) {
            if (error) reject(error);            
            if (result.length == 0) {
                console.log('error user not found');
                res.redirect('/login');
            }
            else {
                result = JSON.parse(JSON.stringify(result));
                let hash = makeHash(32);
                res.cookie('hash', hash);
                res.cookie('id',result[0]['id']);
                /**
                 *      write hash to db
                 */
                sql = "UPDATE USER SET hash = '" + hash + "' WHERE id="+result[0]['id'];
                con.query(sql, function (error, resultQuery) {
                    if (error) throw error;
                    res.redirect('/admin');
            });          
        };
    });     
});

app.get('/add-category', function (req, res) {
    res.render('add_category', {});
    });

app.post('/add-category', function (req, res) {
    console.log(req.body);
    if (req.body.length != 0) {
        addCategories(req.body, res);    
    }
    else {
    res.send('0');
    }
});    


function saveOrder(data, result) {
    // data - information about user
    // result - information abou product
    let sql;
    sql = "INSERT INTO user_info (user_name, user_phone, user_email, address) VALUES ('"+ data.username + "','" + data.phone + "','" + data.email + "','" + data.address + "')";
    con.query(sql, function (error, resultQuery) {
        if (error) throw error;
        console.log('1 user info saved');
        console.log(resultQuery);
        let userId = resultQuery.insertId;
        date = new Date() / 1000;
        for (let i = 0; i < result.length; i++) {
            sql = "INSERT INTO shop_order(date, user_id, goods_id,goods_cost, goods_amount, total) VALUES (" + date + "," + userId + "," + result[i]['id'] + "," + result[i]['cost'] + "," + data.key[result[i]['id']] + "," + data.key[result[i]['id']] * result[i]['cost'] + ")";
            con.query(sql, function (error, resultQuery) {
                if (error) throw error;
                console.log("1 goods saved");
            })
        }
    });
}

function addCategories(data, result) {
    // data - information about user
    // result - information abou product
    let sql;
    sql = "INSERT INTO category (category, description, image ) VALUES ('"+ data.category + "','" + data.description + "','" + data.image + "')";
    con.query(sql, function (error, resultQuery) {
        if (error) throw error;
        console.log('1 category was added');
        console.log(resultQuery);
        }
    );
}

async function sendMail(data, result) {
    let res = '<h2>Zamówienie z wypożyczalni</h2>';
    let total = 0;
    for (let i = 0; i < result.length; i++) {
      res += `<p>${result[i]['name']} - ${data.key[result[i]['id']]} szt. - ${result[i]['cost'] * data.key[result[i]['id']]} zł</p>`;
      total += result[i]['cost'] * data.key[result[i]['id']];
    }
    console.log(res);
    res += '<hr>';
    res += `Total ${total} uah`;
    res += `<hr>Phone: ${data.phone}`;
    res += `<hr>Username: ${data.username}`;
    res += `<hr>Address: ${data.address}`;
    res += `<hr>Email: ${data.email}`;
  
    let testAccount = await nodemailer.createTestAccount();
  
    let transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass // generated ethereal password
      }
    });
  
    let mailOption = {
      from: '<vitalii.lukash@gmail.com>',
      to: "vitalii.lukash@gmail.com," + data.email,
      subject: "Wypożyczalnia zamówienie",
      text: 'Testowanie wysyłki maili',
      html: res
    };
  
    let info = await transporter.sendMail(mailOption);
    console.log("MessageSent: %s", info.messageId);
    console.log("PreviewSent: %s", nodemailer.getTestMessageUrl(info));
    return true;
  }