const fs = require("fs");

function parseHTML(htmlString) {
    let parsed = {};

    let html = new HtmlObject();

    let split = htmlString.split("<");
    for (let index = 0; index < split.length; index++) {
        html.next(split[index]);
    }

    return html;
}

class HtmlObject {
    children = [];
    child = false;
    parent;
    /**
     *
     * @param {String} split
     */
    next(split) {
        if (this.child) this.children[this.children.length - 1].next(split);
        else {
            let temp = split.split(">");

            if (split.startsWith("/")) {
                if (temp.length > 1) {
                    if (this.parent) {
                        this.parent.child = false;
                        this.parent.next(temp[1]);
                    }
                } else {
                    if (this.parent) this.parent.child = false;
                }
            } else {
                if (temp.length > 1) {
                    let child = new HtmlObject();
                    child.tag = temp.shift();

                    this.children.push(child);

                    child.next(temp.join(">"));
                } else {
                    let child = new HtmlObject();
                    child.tag = "text";
                    child.inner = split;
                    this.children.push(child);
                }
            }
        }
    }
}

let testString = `Hey, so, uh, this is kind of an unusual post. It's a celebration of sorts for B\u003cspan\u003eattle Vixens reaching episode 100(!). However, r\u003c/span\u003eather than being a part of the story, it's just a bunch of background information, behind-the-scenes thinking about how the story might be adapted into other media, and other nonsense like that. It's extremely self-indulgent to talk publicly about all of this, and I appreciate not everyone will care about it. If you just want to read the story, Episode 100 is posting concurrently to this, and the link to it is here: \u003ca href=\"https://whatevrtgcaptions.blogspot.com/2022/03/battle-vixens-100.html\"\u003ehttps://whatevrtgcaptions.blogspot.com/2022/03/battle-vixens-100.html\u003c/a\u003e\u003cbr /\u003e\u003cdiv align=\"LEFT\" style=\"font-style: normal; font-weight: normal; margin-bottom: 0in;\"\u003e&nbsp;\u003c/div\u003e\u003cdiv align=\"LEFT\" style=\"font-style: normal; font-weight: normal; margin-bottom: 0in;\"\u003eAlso, here at the top I'll\nput a list of the topics that are below so you can just ctrl+f to\nthe ones you are interested in. If I think of other things to put in\nhere, I may add more sections later and link back to this post rather\nthan making a brand new`;

//testString = require("./test.json").content;

//console.log(testString);

let html = parseHTML(testString);

fs.writeFileSync("testHtml.json", JSON.stringify(html));
