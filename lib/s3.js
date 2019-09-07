const aws = require('aws-sdk');
const fs = require('fs');

let secrets;
if (process.env.NODE_ENV == 'production') {
    secrets = process.env; // in prod the secrets are environment variables
} else {
    secrets = require('../secrets.json'); // in dev they are in secrets.json which is listed in .gitignore
}


const s3 = new aws.S3({
    accessKeyId: secrets.AWS_KEY,
    secretAccessKey: secrets.AWS_SECRET
});

exports.uploadS3 = function(req, res, next) {
    s3.putObject({
        Bucket: 'image-board-spiced-pfabrikant',
        ACL: 'public-read',
        Key: req.file.filename,
        Body: fs.createReadStream(req.file.path),
        ContentType: req.file.mimetype,
        ContentLength: req.file.size
    }).promise().then(
        () => {
            next();
        }
    ).catch(
        err => {
            // uh oh
            console.log('error in sending file to s3: ', err.message);
            res.status(500);
        }
    );
};
