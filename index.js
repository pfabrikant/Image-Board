const express = require('express');
const db = require('./lib/db.js');
const app = express();
const s3 = require('./lib/s3.js');
var multer = require('multer');
var uidSafe = require('uid-safe');
var path = require('path');
const fs = require('fs');
// boilerplate for renaming and storing files in the /uploads directory using multer and uidSafe
var diskStorage = multer.diskStorage({
    destination: function(req, file, callback) {
        callback(null, __dirname + '/uploads');
    },
    filename: function(req, file, callback) {
        uidSafe(24).then(function(uid) {
            callback(null, uid + path.extname(file.originalname));
        });
    }
});

var uploader = multer({
    storage: diskStorage,
    limits: {
        fileSize: 2097152
    }
});



// Serving the static directory
app.use(express.static('./public'));

app.use(require('body-parser').json());


// route for getting the images from the database and sending them to Vue
app.get('/images/:lastId', (req, res) => {
    if (req.params.lastId == 'start') {
        db.getNewestImages().then(results => {
            res.json(results);
        }).catch(err => console.log('error in db.getNewestImages: ', err.message));
    } else {
        db.getImages(req.params.lastId).then(results => {
            res.json(results);
        }).catch(err => console.log('error in db.getImages: ', err.message));
    }
});

// route for fetching a specific image for the component
app.get('/getImage/:id', (req, res) => {
    db.getImage(req.params.id).then(data => {
        res.json(data.rows);
    }).catch(err => {
        console.log('error in GET /getimage: ', err.message);
        res.status(500);
    });
});
//route for fetching the comments for a specific image in the openVueImageComponent
app.get('/getComments/:id', (req, res) => {
    db.getComments(req.params.id).then(data => {
        res.json(data.rows);
    }).catch(err => {
        console.log('error in GET /getComments: ', err.message);
    });
});

//check for new images
app.get('/getlatestId', (req, res) => {
    db.getLatestId().then(id => {
        res.json(id);
    }).catch(err => console.log('error in /getLatestId GET route: ', err.message));
});

app.get('/getReplies/:imageid', (req, res) => {
    db.getReplies(req.params.imageid).then(results => {
        res.json(results.rows);
    }).catch(err => {
        console.log('error in GET getReplies: ', err.message);
    });

});


// route for receiving the uploaded image and its information from Vue, storing it locally in the /uploads directory,
// sending it to the aws s3, updating the database, sending back a response to vue
app.post('/upload', uploader.single('file'), s3.uploadS3, (req, res) => {
    if (req.file) {
        let url = 'https://s3.amazonaws.com/image-board-spiced-pfabrikant/' + req.file.filename;
        db.insertImage(url, req.body.username, req.body.title, req.body.description).then(results => {
            res.json(results);
            fs.promises.unlink(req.file.path);
        }).catch(err => console.log('error in insertImages: ', err.message));
    } else {
        console.log('error in uploader!');
        res.status(500);
    }


});

app.post('/submitReply', (req, res) => {
    db.submitReply(req.body.username, req.body.reply, req.body.commentId).then(results => {
        res.json(results.rows[0]);
    });
});

// route for submitting a comments
app.post('/submitComment', (req, res) => {
    console.log(req.body);
    db.submitComment(req.body.comment, req.body.username, req.body.imageId).then(data => {
        res.json(data.rows[0]);
    }).catch(err => {
        console.log('error in POST /submitComment: ', err.message);
        res.status(500);
    });
});

app.get('*', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});

app.listen(process.env.PORT || 8080, () => console.log('listening'));