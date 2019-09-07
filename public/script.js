new Vue({
    el: '.main',
    data: {
        pictures: null,
        title: '',
        description: '',
        username: '',
        file: null,
        imageId: location.hash,
        visible: true,
        updateResults: false,
        clearInterval: null
    },
    mounted: function() {
        let self = this;
        //always redirect to home
        if (window.location != '') {
            this.imageId = null;
            window.history.replaceState({}, document.title, "/");
        }
        //get newest 18 images
        axios.get('/images/start').then(results => {
            self.pictures = results.data.rows;
        }).then(() => {
            self.checkBottomOfScreen();
        }).catch((err) => {
            console.log('error in mounted function axios get method: ', err.message);
        });
        // listen to hash change (triggered by click on one of the images)
        $(window).on('hashchange', function() {
            self.imageId = window.location.hash;
        });
        // check if there are new uploads every 5 sec
        self.clearInterval = setInterval(this.checkIfNewResults.bind(self), 5000);
    },
    methods: {
        checkIfNewResults: function() {
            let self = this;
            axios.get('/getlatestId').then(id => {
                if (id.data.rows[0].id != self.pictures[0].id) {
                    self.updateResults = true;
                }
            }).catch(err => console.log('error in refreshResults: ', err.message));
        },
        refreshResults: function() {
            let self = this;
            axios.get('/images/start').then(results => {
                self.pictures = results.data.rows;
                self.updateResults = false;
            }).catch((err) => {
                console.log('error in refreshResults: ', err.message);
            });
        },
        closeUpdateResults: function() {
            this.updateResults = false;
            window.clearInterval(this.clearInterval);
        },
        seen: function() {
            this.visible = false;
        },
        checkBottomOfScreen: function checkBottomOfScreen() {
            let self = this;
            if ($(document).scrollTop() + $(window).height() > $(document).height() - 20) {
                self.loadNextImages();
            } else {
                setTimeout(checkBottomOfScreen.bind(self), 1000);
            }
        },
        changeHandler: function(e) {
            this.file = e.target.files[0];
        },
        submitImage: function(e) {
            let self = this;
            e.preventDefault();
            let formData = new FormData();
            formData.append("title", self.title);
            formData.append("description", self.description);
            formData.append("username", self.username);
            formData.append("file", self.file);
            axios.post('/upload', formData).then((response) => {
                self.pictures.unshift(response.data.rows[0]);
                self.title = '';
                self.description = '';
                self.username = '';
                self.file = null;
            }).catch(err => {
                console.log('error in post /uploads axios', err.message);
            });
        },

        closeBox: function() {
            this.imageId = null;
            location.hash = '';
            history.replaceState(null, null, ' ');
            this.visible = true;
        },
        loadNextImages: function() {
            let self = this;
            // console.log(that.pictures[that.pictures.length - 1].id);
            axios.get(`/images/${self.pictures[self.pictures.length-1].id}`).then(results => {
                if (results.data.rows.length != 0) {
                    for (let i = 0; i < results.data.rows.length; i++) {
                        self.pictures.push(results.data.rows[i]);
                    }
                }
                self.checkBottomOfScreen();
            }).catch((err) => {
                console.log('error in loadNextImages method axios get method: ', err.message);
            });

        }
    }

});