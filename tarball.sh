#!/bin/bash
tar czfm cydran-todomvc.tgz index.html css js images robots.txt manifest.json learn.json LICENSE README.md node_modules/todomvc* node_modules/cydran/dist/cydran.*

pubdir="./public"

if [ -d $pubdir ]; then
	rm -fr $pubdir
fi

mkdir public

tar zxf cydran-todomvc.tgz -C $pubdir
