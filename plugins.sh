#!/bin/bash
# Set the PROJECT_NAME environment variable
export PROJECT_NAME=${PWD##*/}
# Get the script name from the first command line argument
SCRIPT_NAME=$1
# Run the specified script with the specified project name
cd ../plugins
case $SCRIPT_NAME in
	prettier)
		npx prettier --config .prettierrc.js --write ../$PROJECT_NAME/src/
		;;
	stylelint)
		npx stylelint --config .stylelintrc.js ../$PROJECT_NAME/src/**/*.css --fix
		;;
	eslint)
		npx eslint --config .eslintrc.js ../$PROJECT_NAME/src/
		;;
	yaspeller)
		npx yaspeller --config .yaspellerrc.js --only-errors --ignore-latin --ignore-digits --find-repeat-words ../$PROJECT_NAME/src/
		;;
	editorconfig-checker)
		npx editorconfig-checker -config .editorconfig -disable-indentation -exclude **/*.php ../$PROJECT_NAME/src/
		;;

	node-w3c-validator)
		npx node-w3c-validator --input ../$PROJECT_NAME/site/**/*.html --format lint --verbose --errors-only
		;;
	vnu-jar)
		java -jar node_modules/vnu-jar/build/dist/vnu.jar --filterfile .vnurc --skip-non-html ../$PROJECT_NAME/site
		;;
	bem-validate)
		npx bem-validate ../$PROJECT_NAME/site/**/*.html
		;;
	htmlhint)
		npx htmlhint --config .htmlhintrс "../$PROJECT_NAME/site/**/*.html"
		;;
	html-validate)
		npx html-validate --config .htmlvalidate.js "../$PROJECT_NAME/site/**/*.html"
		;;

	browser-sync)
		npx browser-sync start --server ../$PROJECT_NAME/site --files ../$PROJECT_NAME/site
		;;
	sharp)
		node sharp ../$PROJECT_NAME/src/img/ ../$PROJECT_NAME/site/img/
		;;
	sharp-webp)
		node sharp ../$PROJECT_NAME/src/img/ ../$PROJECT_NAME/site/img/ webp
		;;
	sharp-avif)
		node sharp ../$PROJECT_NAME/src/img/ ../$PROJECT_NAME/site/img/ avif
		;;
	typograf)
		node typograf.js ../$PROJECT_NAME/site/
		;;
	# svgo)
	# 	npx svgo --folder ../$PROJECT_NAME/site/ --recursive --multipass --quiet --precision 3
	# 	;;
	svgo)
		node svgo ../$PROJECT_NAME/site/ ../$PROJECT_NAME/site/
	;;
	cli-real-favicon)
		node cli-real-favicon.js ../$PROJECT_NAME/src/favicon.svg ../$PROJECT_NAME/src
		;;
	ttf2woff2)
		node ttf2woff2.js ../$PROJECT_NAME/src/fls
		;;
	broken-link-checker)
		npx blc --input https://$PROJECT_NAME/ --recursive --ordered --verbose --filter-level 3
		;;
	purgecss)
		npx purgecss --css ../$PROJECT_NAME/site/**/*.css --content ../$PROJECT_NAME/site/**/*.html ../$PROJECT_NAME/site/**/*.js --config ./purgecss.config.js --rejected > ../$PROJECT_NAME/site/purgecss.json
		# --rejected-css чтобы увидеть весь удалённый CSS.
		;;
esac
