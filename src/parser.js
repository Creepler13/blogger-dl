const fs = require("fs");

module.exports = class Parser {
    /**
     *
     * @param {String} content
     * @param {String} postName
     * @param {String} archivePath
     * @returns
     */
    parseContent(content, postName, blogUrl) {
        let hoster = "";

        hoster = new URL(blogUrl).hostname;

        let parsedContent = {
            hrefs: {},
            media: { images: {} },
            content: content,
        };

        let mediaID = 0;

        let t = content.split('href="');
        for (let index = 1; index < t.length; index++) {
            let href = t[index].split('"')[0];

            if (href.endsWith(".html")) {
                if (new RegExp(hoster).test(href)) {
                    let name = href.split("/").pop().split(".")[0];
                    if (!parsedContent.hrefs[name]) parsedContent.hrefs[name] = [];
                    parsedContent.hrefs[name].push(href);
                }
            } else {
                if (href.endsWith(".jpg") || href.endsWith(".png") || href.endsWith(".jpeg")) {
                    let name = href.split("/").pop();
                    if (!parsedContent.media.images[name]) {
                        parsedContent.media.images[name] = { links: [], id: mediaID };
                        mediaID++;
                    }
                    parsedContent.media.images[name].links.push(href);
                }
            }
        }

        t = content.split('src="');
        for (let index = 1; index < t.length; index++) {
            let href = t[index].split('"')[0];

            if (href.endsWith(".jpg") || href.endsWith(".png") || href.endsWith(".jpeg")) {
                let name = href.split("/").pop();
                if (!parsedContent.media.images[name]) {
                    parsedContent.media.images[name] = { links: [], id: mediaID };
                    mediaID++;
                }
                parsedContent.media.images[name].links.push(href);
            }

            if (new RegExp("https://blogger.googleusercontent.com/img/a/").test(href)) {
                let name = href.split("/").pop() + ".jpg";
                if (!parsedContent.media.images[name]) {
                    parsedContent.media.images[name] = { links: [], id: mediaID };
                    mediaID++;
                }
                parsedContent.media.images[name].links.push(href);
            }
        }

        for (const key in parsedContent.hrefs) {
            parsedContent.hrefs[key].forEach((link) => {
                if (!new URL(link).pathname.startsWith("/p"))
                    parsedContent.content = parsedContent.content.replace(
                        new RegExp(`${link}`, "g"),
                        `../../posts/${key}/${key}.html`
                    );
                else
                    parsedContent.content = parsedContent.content.replace(
                        new RegExp(`${link}`, "g"),
                        `../../pages/${key}/${key}.html`
                    );
            });
        }

        for (const key in parsedContent.media.images) {
            parsedContent.media.images[key].links.forEach((link) => {
                parsedContent.content = parsedContent.content.replace(
                    new RegExp(`${link}`, "g"),
                    `../${postName}/media/images/${parsedContent.media.images[key].id}.${key
                        .split(".")
                        .pop()}`
                );
            });
        }

        return parsedContent;
    }
};
