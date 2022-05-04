const fs = require("fs");
const https = require("https");

module.exports = class requestManager {
    async getBlog(url, key) {
        return new Promise(async (res, rej) => {
            let urlDATA;
            try {
                urlDATA = new URL(url);
            } catch (err) {
                rej(err);
            }

            let data = await this.fetch(
                `https://www.googleapis.com/blogger/v3/blogs/byurl?key=${key}&url=${url}`
            ).catch((err) => {
                rej(err);
            });

            let blog = JSON.parse(data);

            if (blog.error) {
                rej(blog.error);
                return;
            }

            let post = await this.fetch(
                `https://www.googleapis.com/blogger/v3/blogs/${blog.id}/posts/bypath?path=${urlDATA.pathname}&key=${key}`
            ).catch((err) => {
                //not a post returning just a blog
                res(blog);
            });

            let postJson = JSON.parse(post);

            if (postJson.error) res(blog);
            else {
                blog.post = postJson;

                res(blog);
            }
        });
    }

    /**
     *
     * @param {Object} options
     * @param {String} url
     * @param {String} [method="GET"]
     * @param {String} [filename] optional path to file when response to big
     *
     * @returns
     */
    async fetch(url, filename, method) {
        /*  const options = {
            hostname: 'example.com',
            path: '/todos',
            method: 'GET'
          }
        */

        let options = {};

        if (!method) options.method = "GET";
        else options.method = method;

        let urlDATA = new URL(url);

        options.hostname = urlDATA.hostname;
        options.path = urlDATA.pathname + urlDATA.search;

        //  console.log(options);

        return new Promise((res, rej) => {
            let data = "";

            /**
             * @type {fs.WriteStream} stream
             */
            let stream;

            if (filename) {
                let path = filename.split("/");
                path.pop();
                if (!fs.existsSync(path)) fs.mkdirSync(path.join("/"), { recursive: true });
                stream = fs.createWriteStream(filename);
            }

            let req = https.request(options, (res) => {
                res.on(
                    "data",
                    /**
                     *
                     * @param {Buffer} d
                     */
                    (d) => {
                        if (!filename) data = data + d;
                        else {
                            stream.write(d);
                        }
                    }
                );
            });

            req.on("error", (error) => {
                stream.end();
                rej(error);
            });

            req.on("close", () => {
                if (!filename) res(data);
                else {
                    stream.end();
                    res();
                }
            });

            req.end();
        });
    }
};
