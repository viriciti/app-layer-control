# App Layer Control

This repository mirrors the [open source repository](http://github.com/viriciti/app-layer-control) with a few additions, none of which are major.

## Remote

If you have just cloned this repository, chances are you have one remote (origin) which points to `git.viriciti.com`. This is fine, but you need a second remote to stay up to date. Execute the following in your terminal:

```
git remote add github https://github.com/viriciti/app-layer-control.git
git remote set-url --push github disallowed
```

This will allow you to fetch from GitHub, but prevents any accidental push.

## How to release

The closed source version (the one you are looking at) cannot be released in the conventional release cycle, because the tags are also copied over to this repository.  
Instead, we push a tag versioned as: `[version]-production`.  
The tag can be removed and repushed if a fix is required for ViriCiti only. For general bug fixes, **fix them in the open source version**.

To automate the release cycle, execute the following commands in your terminal:

```
git fetch --all
git merge -X theirs github/master master
git checkout master
VERSION=$(cat package.json | jq -r '.version')
git tag $VERSION-production
git push origin master
git push origin $VERSION-production
```

**Note:** Depending on your editor, `:wq!` or `CTRL` + `X` when prompted for a commit message.
