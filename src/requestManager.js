const fs = require("fs");
const https = require("https");
const { urlToHttpOptions } = require("url");
const { DefaultDeserializer } = require("v8");

module.exports = class requestManager {
    async getBlog(url, key) {
        return new Promise(async (res, rej) => {
            let urlDATA;
            try {
                urlDATA = urlToHttpOptions(new URL(url));
            } catch (err) {
                rej(err);
            }

            let data = await this.fetch(
                `https://www.googleapis.com/blogger/v3/blogs/byurl?key=${key}&url=${url}`
            ).catch((err) => {
                rej(err);
            });

            res(JSON.parse(data));
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

        let urlDATA = urlToHttpOptions(new URL(url));

        options.hostname = urlDATA.hostname;
        options.path = urlDATA.path;

        //  console.log(options);

        return new Promise((res, rej) => {
            let data = "";

            /**
             * @type {fs.WriteStream} stream
             */
            let stream;

            let fileStats;

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
