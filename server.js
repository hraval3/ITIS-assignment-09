const express = require('express');
const app = express();
const port = 3000;
const bodyParser = require("body-parser");
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger.json");
const axios = require("axios");

const mariadb = require('mariadb');
const pool = mariadb.createPool({
        host : 'localhost',
        user: 'root',
        password: 'root',
        database: 'sample',
        port: 3306,
        connectionLimit: 5
})
const router = express.Router()

pool.getConnection((err, connection) => {
        if(err){
                console.error('there is an error');
        }
        if(connection) connection.release();
        return;

});

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.use('/api-docs',swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(function(req, res, next) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin','*');
  next();
});

app.get('/orders_on_date', async function (req, res) {
const sql_query = "Select * FROM orders where ORD_DATE = '2008-10-20'"
const rows = await pool.query(sql_query);
res.status(200).json(rows);
})

app.get('/advanceamount', async function (req, res) {
const sql_query = "Select ORD_NUM, CUST_CODE, AGENT_CODE from orders where ADVANCE_AMOUNT > ORD_AMOUNT/2"
const rows = await pool.query(sql_query);
res.status(200).json(rows);
})

app.get('/avg_advance_amt', async function (req, res) {
const sql_query = "Select AGENT_CODE, AVG(ADVANCE_AMOUNT) FROM orders GROUP BY AGENT_CODE"
const rows = await pool.query(sql_query);
res.status(200).json(rows);
})

app.get('/say', async function (req, res) {
        const keyword = req.query.keyword
        const lambda_url = "https://why4evmmcl.execute-api.us-east-1.amazonaws.com/say/assignment-09"
        await axios.get(lambda_url+'?keyword='+keyword)
        .then(outcome=>res.status(200).json(outcome.data))
        .catch(err=>{
                console.log(err)
                res.send(err)
        })
})

app.post('/food',async function (req,res){
  const item_id = req.body.item_id
  const item_name = req.body.item_name
  const item_unit = req.body.item_unit
  const company_id = req.body.company_id
  try{
  const query = "Insert into foods values(?,?,?,?)"
  const rows = await pool.query(query,[item_id,item_name,item_unit,company_id]);
  res.status(202).json({"data":"Item Added"});
}
catch (err) {
if (err.code == "ER_DUP_ENTRY"){
        res.status(400).json({'message' : 'This food already exists'})
}
else{
res.status(400).send(err)
}
}
})

app.put('/food', async function (req, res) {
  const item_id = req.body.item_id
  const item_name = req.body.item_name
  const item_unit = req.body.item_unit
  const company_id = req.body.company_id

  const get_query = "select * from foods where ITEM_ID = ?"
  const get_rows = await pool.query(get_query, [item_id])
  console.log(get_rows)
  if (get_rows.length === 0){
    const query = "Insert into foods values(?,?,?,?)"
    const rows = await pool.query(query,[item_id,item_name,item_unit,company_id]);
    res.status(202).json({"data":"Item Added"});
  }

  const query = "Update foods set ITEM_NAME=?, ITEM_UNIT=?, COMPANY_ID=? where ITEM_ID = ?"
  const rows = await pool.query(query, [item_name, item_unit, company_id,item_id]);
  res.status(200).json({ "data": "food updated" });

})

app.patch('/edit_food_company', async function (req, res) {
  const item_id = req.body.item_id
  const company_id = req.body.company_id

  const get_query = "Select 1 from foods where item_id = ?"
  const result = await pool.query(get_query, item_id)

  if (result.length === 0){
        res.status(404).send("Item not found")
}

  const query = "Update foods set COMPANY_ID=? where ITEM_ID = ?"
  const rows = await pool.query(query, [item_id, company_id]);
  res.status(200).json({ "data": "Company ID updated" });

})

app.delete('/food/:item_id', async function (req, res) {
  const item_id = req.params.item_id

  const get_query = "select * from foods where item_id = ?"
  const get_rows = await pool.query(get_query, [item_id])

  if (get_rows.length === 0){
        res.status(404).json({"message":"This Food ID does not exist"});
  }

  const query = "Delete from foods where ITEM_ID = ?"
  const rows = await pool.query(query, [item_id]);
  res.status(200).json({ "data": "Item Deleted" });

})

app.listen(port, function () {
  console.log('App listening at http://localhost:%s', port)
});