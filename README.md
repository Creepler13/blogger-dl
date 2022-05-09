The readme is still WIP

# Blog Downloader/Archiver for all blogs using the blogger API (only tested on blogspot.com)

blogger-dl is a downloader for all blogs using the blogget API.
it saves all posts and pages and links all oulinks to the locally saved files. (including images)

## Requirements

-   nodejs
-   blogger api key ([how to get a key](#api-key))

## Installation

The programm has to be installed globally, so thet npm can add it as a cli command

```bash
npm install blogger-dl -g
```

## Api-Key

Step 1: go to https://developers.google.com/blogger/docs/3.0/using and scroll down to the Get key button

Step 1.1: login with your google account

Step 2: after clicking the button use the spinner to create a new Project and click next

Step 3: wait

Step 4: save the key somewhere and voila you have a key

## Usage

```bash
Usage:
        blogger-dl <url> [options] -key <api-key>
        blogger-dl <url> <path> [options] -key <api-key>
    with saved key:
        blogger-dl <url> [options]
        blogger-dl <url> <path> [options]

Example:
        for whole blog:
                blogger-dl https://blogger-developers.googleblog.com/ -key <api-key>
        for single post:
                 blogger-dl https://blogger-developers.googleblog.com/2012/06/blogger-api-v3.html -key <api-key>
Options:
    General:
            -info           shows blog info without downloading
            -override       overrides already downloaded posts/pages
            -css <file>     applies css from selected file to posts/pages
            -json           creates a json file for every post/page
    Api-key:
            -key <api-key>  used to set api-key (needed if no api-key is saved!)
            -save-key       if used supplied api-key will be saved and used if no new key is supllied with -key
    Filtering:
            -limit <amount> limits the amount of posts/pages downloaded
            -search <query> searches for posts
            -no-posts       skips downloading posts
            -no-pages       skips downloading pages
            -no-media       skips downloading media and keeps them linked to the remote location
```

## Customization (WIP)

The posts/pages will be saved in base html without the css of the blog.

This means that they might be hard to read/ugly.

### CSS

The css option will copy the copy into the Blog folder and link every post/page to the css file.

```bash
-css <file>
```

## Filtering (WIP)
