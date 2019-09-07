(function() {
    Vue.component('vue-image', {
        data: function() {
            return {
                comment: '',
                imageUsername: '',
                commentUsername: '',
                url: '',
                title: '',
                description: '',
                created_at: '',
                comments: [],
                nextImageId: null,
                previousImageId: null,
                replyUsername: '',
                reply: '',
                clickedid: null,
                replies: [],
                commentsIds: []
            };
        },
        props: ['imageid'],
        mounted: function() {
            this.getImageAndComment(this.imageid);
        },
        watch: {
            imageid: function() {
                this.getImageAndComment(this.imageid);
            }
        },

        template: "#vue-image",
        methods: {
            closeBox: function() {
                this.$emit('close');
            },
            submitComment: function(e) {
                e.preventDefault();
                axios.post('/submitComment', {
                    username: this.commentUsername,
                    comment: this.comment,
                    imageId: this.imageid
                }).then(results => {
                    this.comments.unshift(results.data);
                    this.comment = '';
                    this.commentUsername = '';
                }).catch(err => {
                    console.log('error in post /submitcomments: ', err.message);
                });
            },
            submitReply: function(e) {
                let self = this;
                axios.post('/submitReply/', {
                    username: this.replyUsername,
                    reply: this.reply,
                    commentId: e.path[2].attributes[0].value
                }).then(results => {
                    let newCommentArr = self.comments.map(comment => {
                        if (comment.id == e.path[2].attributes[0].value) {
                            comment.replies.push({
                                text: results.data.comment,
                                username: results.data.username,
                                created_at: results.data.created_at
                            });
                        }

                        return comment;
                    });
                    console.log(newCommentArr);
                    self.comments = newCommentArr;
                }).catch(err => {
                    console.log('error in post /submitreplies: ', err.message);
                });


            },
            updateData: function(results, a, b, c, d, e, f, g) {
                let self = this;
                self.url = results.data[a].url;
                self.title = results.data[b].title;
                self.description = results.data[c].description;
                self.imageUsername = results.data[d].username;
                self.created_at = results.data[e].created_at;
                self.previousImageId = results.data[f].id;
                self.nextImageId = results.data[g].id;

            },
            getImageAndComment: function(id) {
                const self = this;
                axios.get(`/getImage/${id}`).then(results => {
                    if (results.data.length == 0) {
                        this.$emit('close');
                    } else if (results.data.length == 3) {
                        self.updateData(results, 1, 1, 1, 1, 1, 0, 2);
                    } else {
                        // if no previous
                        if (results.data[0].id == id) {
                            self.updateData(results, 0, 0, 0, 0, 0, 0, 1);
                            self.previousImageId = null;
                            //if no next
                        } else {
                            self.updateData(results, 1, 1, 1, 1, 1, 0, 1);
                            self.nextImageId = null;
                        }
                    }
                    //get comments
                }).then(() => {
                    return axios.get(`/getComments/${id}`);
                }).then(results => {
                    self.comments = [];
                    for (let i = 0; i < results.data.length; i++) {
                        self.comments.push(results.data[i]);
                    }
                    //get replies
                    return axios.get(`/getReplies/${self.imageid}`);
                }).then(results => {
                    //order the replies per comment. Creating a new comments array that we will
                    // then reassign to self.comments, triggering a rerendering of the component
                    let newCommentArr = self.comments.map(comment => {
                        comment.replies = results.data.map(reply => {
                            return {
                                text: reply.comment,
                                username: reply.username,
                                created_at: reply.created_at
                            };
                        });
                        return comment;
                    });
                    self.comments = newCommentArr;
                    //this didn't work: trying to modify nested objects inside the data object of the component.
                    // Vue doesn't do deep checks and ignored what I did in the following lines

                    // for (let i = 0; i < self.comments.length; i++) {
                    //     self.comments[i].replies = [];
                    //     for (let j = 0; j < results.data.length; j++) {
                    //         if (self.comments[i].id == results.data[j].commentid) {
                    //             self.comments[i].replies.push({
                    //                 text: results.data[j].comment,
                    //                 username: results.data[j].username,
                    //                 created_at: results.data[j].created_at
                    //             });
                    //         }
                    //     }
                    // }
                }).catch(err => {
                    console.log('error in mounted vueImage function: ', err.message);
                    this.$emit('close');

                });
            }
        }
    });
})()