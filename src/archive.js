const fs = require("fs");
const Parser = require("./parser.js");
const Downloader = require("./requestManager.js");
module.exports = class Archive {
    constructor() {
        this.downloader = new Downloader();
        this.parser = new Parser();
    }

    /**
     *
     * @param {*} url
     * @param {*} path
     * @param {*} key
     * @param {*} template
     * @param {*} args
     * @returns
     */
    async init(url, path, key, args, help) {
        this.blogUrl = url;
        this.key = key;
        this.args = args;
        this.path = path;
        this.help = help;

        return new Promise(async (res, rej) => {
            //WIP

            let json = await this.downloader.getBlog(url, this.key).catch((e) => rej(e));

            if (json.id == undefined) {
                console.log("Blog not found");
                process.exit();
            }

            this.name = json.name;

            res(json);
        });
    }

    async createArchive(blogJSON) {
        console.log("Name: " + blogJSON.name);
        console.log("Path: " + this.path);

        return new Promise(async (res, rej) => {
            fs.mkdirSync(`${this.path}/${this.name}/posts`, { recursive: true }, (err) => {
                if (err) {
                    console.log(err);
                    process.exit();
                }
            });

            fs.mkdirSync(`${this.path}/${this.name}/pages`, { recursive: true }, (err) => {
                if (err) {
                    console.log(err);
                    process.exit();
                }
            });

            if (this.args.css.used)
                if (fs.existsSync(this.args.css.data))
                    fs.copyFileSync(this.args.css.data, `${this.path}/${this.name}/style.css`);
                else this.help(`\ncss file ${this.args.css.data} not found\n`);

            fs.writeFileSync(`${this.path}/${this.name}/blog.json`, JSON.stringify(blogJSON));

            res();
        });
    }

    async getPosts(url, nextPageToken) {
        let limit = false;

        if (this.args.limit.used) {
            let l = parseInt(this.args.limit.data);
            if (isNaN(l)) {
                console.log("Invalid limit argument");
                process.exit();
            } else {
                limit = l;
            }
        }

        if (!nextPageToken)
            console.log("Gathering posts" + (limit ? " (limit: " + limit + ")" : ""));

        let data = await this.downloader.fetch(
            url +
                `?key=${this.key}&maxResults=${!limit ? 500 : limit}` +
                (nextPageToken ? `&pageToken=${nextPageToken}` : "")
        );
        let json = JSON.parse(data);

        if (json.nextPageToken && (limit ? json.items.length < limit : true))
            json.items = [...json.items, ...(await this.getPosts(url, json.nextPageToken))];

        if (nextPageToken) return json.items;

        let labels = {};

        json.items.forEach((post) => {
            if (post.labels)
                post.labels.forEach((label) => {
                    if (!labels[label]) labels[label] = [];
                    labels[label].push(post.url);
                });
        });

        json.labels = labels;

        let postsfile = {};

        for (const key in json.items) {
            let post = json.items[key];
            postsfile[post.id] = {
                url: post.url,
                localUrl: this.convertUrlToLocalPostUrl(post.url),
                labels: post.labels,
                title: post.title,
            };
        }

        console.log("Posts found: " + json.items.length);
        console.log("");

        fs.writeFileSync(`${this.path}/${this.name}/posts.json`, JSON.stringify(postsfile));

        return json;
    }

    async getPages(url, nextPageToken) {
        if (!nextPageToken) console.log("Gathering pages");

        let data = await this.downloader.fetch(
            url +
                `?key=${this.key}&maxResults=500` +
                (nextPageToken ? `&pageToken=${nextPageToken}` : "")
        );
        let json = JSON.parse(data);

        if (json.nextPageToken)
            json.items = [...json.items, ...(await this.getPages(url, json.nextPageToken))];

        if (nextPageToken) return json.items;

        let pagesfile = {};

        for (const key in json.items) {
            let page = json.items[key];

            pagesfile[page.id] = {
                url: page.url,
                localUrl: this.convertUrlToLocalPageUrl(page.url),
                title: page.title,
            };
        }

        console.log("Pages found: " + (json.items ? json.items.length : 0));
        console.log("");

        fs.writeFileSync(`${this.path}/${this.name}/pages.json`, JSON.stringify(pagesfile));

        return json;
    }

    /**
     *
     * @param {Object} postData
     * @param {Number} postData.id
     * @param {Number} postData.blog.id
     * @param {String} postData.published
     * @param {String} postData.updated
     * @param {String} postData.url
     * @param {String} postData.selfLink
     * @param {String} postData.title
     * @param {String} postData.content
     * @param {String[]} postData.labels
     * @param {Number} postData.replies.totalItems
     * @param {String} postData.replies.selfLink
     * @param {String} postData.etag
     */
    async addPage(pageData) {
        let pageName = pageData.url.split("/").pop().split(".")[0];

        if (!this.args.override.used)
            if (fs.existsSync(`${this.path}/${this.name}/posts/${pageName}/${pageName}.json`))
                return console.log("Page already exists: " + pageName);

        console.log("Parsing page: " + pageName);

        let parsedPage = this.parser.parseContent(
            pageData.content,
            pageName,
            this.blogUrl,
            this.args
        );

        if (!this.args["no-media"].used)
            for (const key in parsedPage.media.images) {
                console.log("Downloading image: " + key);

                await this.downloader.fetch(
                    parsedPage.media.images[key].links[0],
                    `${this.path}/${this.name}/pages/${pageName}/media/images/${
                        parsedPage.media.images[key].id
                    }.${key.split(".").pop()}`
                );
            }

        console.log("Creating page html");

        //let page = this.postHandler.createPage(pageData, parsedPage);
        let page = parsedPage.content;

        if (!fs.existsSync(`${this.path}/${this.name}/pages/${pageName}`))
            fs.mkdirSync(`${this.path}/${this.name}/pages/${pageName}`, { recursive: true });

        if (this.args.css.used)
            page = `<link rel="stylesheet" href="../../style.css"></link>` + page;

        fs.writeFileSync(`${this.path}/${this.name}/pages/${pageName}/${pageName}.html`, page);

        delete parsedPage.content;

        let pagejson = { data: pageData, parsed: parsedPage };

        if (this.args["page-json"])
            fs.writeFileSync(
                `${this.path}/${this.name}/pages/${pageName}/${pageName}.json`,
                JSON.stringify(pagejson)
            );

        console.log("");
    }

    async archivePosts(blogJSON) {
        let posts = await this.getPosts(blogJSON.posts.selfLink);

        for (let index = 0; index < posts.items.length; index++) {
            await this.addPost(posts.items[index]);
        }
    }

    async addPost(postData) {
        let postName = postData.url.split("/").pop().split(".")[0];

        if (!this.args.override.used)
            if (fs.existsSync(`${this.path}/${this.name}/posts/${postName}/${postName}.json`))
                return console.log("Post already exists: " + postName);

        console.log("Parsing post: " + postName);

        let parsedPost = this.parser.parseContent(
            postData.content,
            postName,
            this.blogUrl,
            this.args
        );

        if (!this.args["no-media"].used)
            for (const key in parsedPost.media.images) {
                console.log("Downloading image: " + key);

                await this.downloader.fetch(
                    parsedPost.media.images[key].links[0],
                    `${this.path}/${this.name}/posts/${postName}/media/images/${
                        parsedPost.media.images[key].id
                    }.${key.split(".").pop()}`
                );
            }

        console.log("Creating post html");

        let post = '<div class="content">' + parsedPost.content + "</div>";

        if (!fs.existsSync(`${this.path}/${this.name}/posts/${postName}`))
            fs.mkdirSync(`${this.path}/${this.name}/posts/${postName}`, { recursive: true });

        if (this.args.css.used)
            post = `<link rel="stylesheet" href="../../style.css"></link>` + post;

        delete parsedPost.content;

        let postjson = { data: postData, parsed: parsedPost };

        if (this.args.replies.used) {
            let hasNextPage = "a";

            let json = { items: [] };
            while (hasNextPage) {
                let data = await this.downloader.fetch(
                    postData.replies.selfLink +
                        `?key=${this.key}    ` +
                        (hasNextPage && hasNextPage != "a" ? `&pageToken=${nextPageToken}` : "")
                );

                let repliesJson = JSON.parse(data);

                if (repliesJson.items) json.items = [...json.items, ...repliesJson.items];

                hasNextPage = json.nextPageToken;
            }

            post = post + "<br /><div class='replies'>";
            json.items.forEach((reply) => {
                post = post + `<div class="reply">`;

                post = post + `<div class="replyUser"> ${reply.author.displayName} </div>`;
                post = post + `<div class="replyContent"> ${reply.content} </div>`;

                post = post + `</div>`;
            });

            post = post + "</div>";

            if (json.items.length != 0)
                fs.writeFileSync(
                    `${this.path}/${this.name}/posts/${postName}/replies.json`,
                    JSON.stringify(json)
                );
        }

        if (this.args["post-json"])
            fs.writeFileSync(
                `${this.path}/${this.name}/posts/${postName}/${postName}.json`,
                JSON.stringify(postjson)
            );

        fs.writeFileSync(`${this.path}/${this.name}/posts/${postName}/${postName}.html`, post);

        console.log("");
    }

    async archivePosts(blogJSON) {
        let posts = await this.getPosts(blogJSON.posts.selfLink);

        if (posts.items)
            for (let index = 0; index < posts.items.length; index++) {
                await this.addPost(posts.items[index]);
            }
    }

    async archivePages(blogJSON) {
        let pages = await this.getPages(blogJSON.pages.selfLink);

        if (pages.items)
            for (let index = 0; index < pages.items.length; index++) {
                await this.addPage(pages.items[index]);
            }
    }

    convertUrlToLocalPostUrl(url) {
        let postName = url.split("/").pop().split(".")[0];
        let path = `./posts/${postName}/${postName}.html`;
        return path;
    }

    convertUrlToLocalPageUrl(url) {
        let pageName = url.split("/").pop().split(".")[0];
        let path = `./pages/${pageName}/${pageName}.html`;
        return path;
    }
};
