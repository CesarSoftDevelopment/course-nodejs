// FILE GOES TO HAVE THE SETTINGS NEEDED TO OUR APPLICATION RESPONSE THE HTTP REQUESTS.

let express = require('express');
let bodyParser = require('body-parser');
let multiparty = require('connect-multiparty');
let mongodb = require('mongodb');
let objectID = require('mongodb').ObjectId;
// manipulate files inside our application
let fs = require('fs');

// app retrive the instance from express
let app = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(multiparty());

// function goes to work middleware in our application 
// next is a paramter that contains the function to continue in flow processing of our application
app.use(function(req, res, next){
    // habilita requisições de dominio diferente
    res.setHeader("Access-Control-Allow-Origin", "*")
    // vai pre-configurar quais que são o métodos que essa origem pode requisitar
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
    // vai habilitar que a requisição feita pela a origem tenha capacidade de rescrever os header do request
    res.setHeader("Access-Control-Allow-Headers", "content-type");
    // 
    res.setHeader("Access-Control-Allow-Credencials", true);

    next();

});

let port = 3000;

app.listen(port);

let db = new mongodb.Db(
    'instagram',
    new mongodb.Server('localhost', 27017, {}),
    {}
);

console.log('SERVER RUNING... listen in port ' + port);


// including a route between get method
// root from api
app.get('/', function(req, res){
    res.send({msg: 'Ola'});
});

// =============== uri + http verb = restfull ===================== //

// POST(create)
app.post('/api', function(req, res){

    let date = new Date();

    time_stamp = date.getTime();

    let url_imagem = time_stamp + '_' + req.files.arquivo.originalFilename;

    let path_origin = req.files.arquivo.path;
    let path_destiny = './uploads/' + url_imagem;

   

    fs.rename(path_origin, path_destiny, function(err){
        if(err) {
            res.status(500).json({error: err});
            return;
        }

        let datas = {
            url_imagem: url_imagem,
            title: req.body.titulo
        }

        db.open(function(err, mongoclient){
        mongoclient.collection('postagens', function(err, collection){
            // insert datas retrived by post
            // after insert datas make the function
            collection.insert(datas, function(err, records){
                if(err) {
                    // res.json(err);
                    res.json({'status': 'erro'});
                }else {
                    // res.json(records);
                    res.json({'status': 'insert done'});
                }
                mongoclient.close();
            });
        });
    });

   });

    

});

// GET(read) from express
app.get('/api', function(req, res){
    
    db.open(function(err, mongoclient){
        mongoclient.collection('postagens', function(err, collection){
            // catch datas from database
            // after cath datas make this function
            collection.find().toArray(function(err, results){
                if(err) {
                    // show errors
                    res.json(err);
                }else {
                    // show results
                    res.json(results);
                }
                mongoclient.close();
            });
        });
    });

});

// GET(read) by id from express
app.get('/api/:id', function(req, res){
    db.open(function(err, mongoclient){
        mongoclient.collection('postagens', function(err, collection){
            // catch datas from database
            // after cath datas make this function
            collection.find(objectID(req.params.id)).toArray(function(err, results){
                if(err) {
                    // show errors
                    res.json(err);
                }else {
                    // show results
                    res.status(200).json(results);
                }
                mongoclient.close();
            });
        });
    });
});


app.get('/imagens/:imagem', function(req, res){

    let img = req.params.imagem;

    // retrieve binaries from image
    fs.readFile('./uploads/'+img, function(err, content) {
        if(err) {
            res.status(400).json(err);
            return;
        }

        res.writeHead(200, { 'content-type': 'image/jpg'});
        res.end(content);
    });
});


// PUT(update) by id from express
app.put('/api/:id', function(req, res){
    db.open(function(err, mongoclient){
        mongoclient.collection('postagens', function(err, collection){
            collection.update(
                // query search from database
                { _id : objectID(req.params.id) },
                // instruction of the document or documents.
                // set, makes a document has been alter
                { $push : 
                        {
                            comentarios: {
                                id_comentario: new objectID(),
                                comentario: req.body.comentario
                            }
                        }
                
                
                },

                // multi is the parameter that checks whether to modify one or all records.
                {},
                // callback function => action must be execute after update
                // error, records => datas from update execution
                function(err, records) {
                    if(err) {
                        res.json(err);
                    }else {
                        res.json(records);
                    }
                    mongoclient.close();
                }
            );
        });
    });
    
});

// DELETE(remover) by id from express
app.delete('/api/:id', function(req, res){

    db.open(function(err, mongoclient){
        mongoclient.collection('postagens', function(err, collection){
           collection.update(
               { },
               {
                   $pull : {
                       comentarios: {id_comentario : objectID(req.params.id)}
                   }
               },
               {multi: true},
               function(err, records) {
                    if(err) {
                        res.json(err);
                    }else {
                        res.json(records)
                    }
                    mongoclient.close();
            });
        });
    });
});



