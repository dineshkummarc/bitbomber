LIB_DIR = lib
SRC_DIR = src
DIST_DIR = dist
BOMBERMAN_GAME_DIR = ${LIB_DIR}/bomberman-game

BASE_FILES = ${SRC_DIR}/onload.js\
			 ${SRC_DIR}/lobbyhandler.js\
			 ${SRC_DIR}/httpclient.js\
			 ${SRC_DIR}/lobbypanel.js\
			 ${SRC_DIR}/gamehandler.js\
			 ${SRC_DIR}/socketclient.js\
			 ${SRC_DIR}/gamepanel.js\
			 ${SRC_DIR}/keyboardhandler.js\
			 ${SRC_DIR}/factorialtimer.js
JSLINT4JAVA = ${LIB_DIR}/jslint4java-1.4.6.jar
CLOSURE_COMPILER = ${LIB_DIR}/compiler.jar
BUNDLE_VERSION = ${DIST_DIR}/bomberman.js
BUNDLE_ALL_VERSION = ${DIST_DIR}/bomberman.all.js
MIN_VERSION = ${DIST_DIR}/bomberman.min.js
MIN_ALL_VERSION = ${DIST_DIR}/bomberman.all.min.js

all: update lint build

update:
	git submodule update --init
	$(call clone_or_pull, ${BOMBERMAN_GAME_DIR}, git@github.com:/eirikb/bomberman-game)

lint: 
	java -jar ${JSLINT4JAVA} ${BASE_FILES}

build: 
	cat ${BOMBERMAN_GAME_DIR}/dist/bomberman.js > ${BUNDLE_VERSION}
	cat ${BOMBERMAN_GAME_DIR}/dist/bomberman.all.js > ${BUNDLE_ALL_VERSION}
	cat ${BASE_FILES} >> ${BUNDLE_ALL_VERSION}
	cat ${BASE_FILES} >> ${BUNDLE_VERSION}
	java -jar ${CLOSURE_COMPILER} --js ${BUNDLE_VERSION} --js_output_file ${MIN_VERSION}
	java -jar ${CLOSURE_COMPILER} --js ${BUNDLE_ALL_VERSION} --js_output_file ${MIN_ALL_VERSION}

define clone_or_pull
-@@if test ! -d $(strip ${1})/.git; then \
	echo "Cloning $(strip ${1})..."; \
	git clone $(strip ${verbose}) --depth=1 $(strip ${2}) $(strip ${1}); \
	else \
	echo "Pulling $(strip ${1})..."; \
	git --git-dir=$(strip ${1})/.git pull $(strip ${verbose}) origin master; \
	fi

endef

.PHONY: all update lint
