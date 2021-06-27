#!/bin/bash
CLEANER="./clean.sh";
if [[ -f $CLEANER ]];then
	echo "	- found $CLEANER file"
	source $CLEANER
else
	echo "	- $CLEANER is not present"
fi

TARBALL="./tarball.sh";
if [[ -f $TARBALL ]];then
	echo "	- found $TARBALL file"
	source $TARBALL
	echo "	- serving up project"
	npx http-server ./public -d -i -g;
else
	echo "	- $TARBALL is not present"
fi

