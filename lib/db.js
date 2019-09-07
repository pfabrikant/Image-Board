var spicedPg = require('spiced-pg');
var db = spicedPg(process.env.DATABASE_URL || 'postgres:postgres:postgres@localhost:5432/images');

exports.getNewestImages = function() {
    return db.query('SELECT * FROM images ORDER BY id DESC LIMIT 18');
};
exports.getImages = function(id) {
    return db.query('SELECT * FROM images WHERE id<$1 ORDER BY id DESC LIMIT 18', [id]);
};
exports.insertImage = function(url, username, title, description) {
    return db.query(`INSERT INTO images (url, username, title, description) VALUES ($1, $2, $3, $4) RETURNING id, url, username, title, description`, [url, username, title, description]);
};
exports.getImage = function(id) {
    return db.query(`(SELECT * FROM images WHERE id >= ${id} ORDER BY id ASC LIMIT 2)
                        UNION
                        (SELECT * FROM images WHERE id < ${id} ORDER BY id DESC LIMIT 1)
                        ORDER BY id ASC`);
};

exports.getComments = function(id) {
    return db.query(`SELECT * FROM comments WHERE imageId=${id}`);
};
exports.submitComment = function(comment, username, id) {
    return db.query(`INSERT INTO comments (comment, username, imageId) VALUES ($1, $2, $3) returning comment, username, imageId, created_at`, [comment, username, id]);
};
exports.getLatestId = function() {
    return db.query('SELECT id FROM images ORDER BY id DESC LIMIT 1');
};
exports.submitReply = function(username, reply, commentId) {
    return db.query('INSERT INTO replies (username, comment, commentId) VALUES ($1, $2, $3) RETURNING username, comment, created_at', [username, reply, commentId]);
};
exports.getReplies = function(id) {
    return db.query(`SELECT *
FROM replies
WHERE commentId IN (SELECT id FROM comments WHERE imageId=${id})`);
};