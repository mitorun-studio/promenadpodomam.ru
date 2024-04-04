const { EleventyHtmlBasePlugin } = require('@11ty/eleventy');
const { EleventyI18nPlugin } = require('@11ty/eleventy');
const pluginBundle = require('@11ty/eleventy-plugin-bundle');
const eleventyNavigationPlugin = require('@11ty/eleventy-navigation');
const htmlMinifierTerser = require('html-minifier-terser');
const lightningCSS = require('@11tyrocks/eleventy-plugin-lightningcss');
const esbuild = require('esbuild');
// const markdownIt = require('markdown-it')({ html: true });
const markdownIt = require('markdown-it');
const markdownItScrollTable = require('markdown-it-scrolltable');
const prettyData = require('pretty-data');
const syntaxHighlight = require('@11ty/eleventy-plugin-syntaxhighlight');
const externalLinks = require('eleventy-plugin-external-links');
const yaml = require('js-yaml');




module.exports = function(eleventyConfig) {
	//------------------------------------------------
	// Настройки Eleventy: ---------------------------
	//------------------------------------------------

	// Настройка параметров сервера: -----------------
	eleventyConfig.setServerOptions({
		//watch: ['site/**/*.css'],
		showAllHosts: true, // Показать локальные IP-адреса сети для тестирования устройств.
	});
	// Задержка в отслеживании (watch):
	eleventyConfig.setWatchThrottleWaitTime(1000); // 0ms default.

	// Отслеживание (watch) картинок для конвейера (pipeline):
	eleventyConfig.addWatchTarget('img/**/*.{svg,avif,webp,png,jpg,jpeg,gif}');

	// Плагины: --------------------------------------

	// Сборка разных файлов и кусков кода:
	eleventyConfig.addPlugin(pluginBundle);

	// Организация меню и хлебных крошек:
	eleventyConfig.addPlugin(eleventyNavigationPlugin);

	// Добавление пути из pathPrefix к локальным ссылкам:
	eleventyConfig.addPlugin(EleventyHtmlBasePlugin);

	// Настройка ссылок для мультиязычных сайтов, добавляет фильтры locale_url и locale_links :
	eleventyConfig.addPlugin(EleventyI18nPlugin, {
		defaultLanguage: 'ru', // Обязательное! На русских сайтах "ru", на английских "en" (любой тег BCP 47).

		// Тип ошибки если нет локализованного контента:
		// errorMode: 'strict',// выдать ошибку если контента нет в /en/slug .
		errorMode: 'allow-fallback', // выдать ошибку если контента нет и в /en/slug и в /slug .
		// errorMode: "never",// не выдавать ошибки.
	});

	// Подсветка синтаксиса в примерах кода от PrismJS:
	// eleventyConfig.addPlugin(syntaxHighlight, {
	// 	preAttributes: {tabindex: 0},
	// });

	// Добавляет атрибуты target и rel к внешним ссылкам:
	eleventyConfig.addPlugin(externalLinks, {
		name: 'external-links', // Plugin name
		regex: /^(([a-z]+:)|(\/\/))/i, // Regex that test if href is external
		target: '_blank', // 'target' attribute for external links
		rel: 'noopener', // 'rel' attribute for external links
		extensions: ['.html'], // Extensions to apply transform to
		includeDoctype: false, // Default to include '<!DOCTYPE html>' at the beginning of the file
	});

	// Добавляет формат .yml в форматы данных:
	eleventyConfig.addDataExtension('yml', (contents) => yaml.load(contents));
	eleventyConfig.addDataExtension('yaml', (contents) => yaml.load(contents));

	//------------------------------------------------
	// Фильтры для переменных: -----------------------
	//------------------------------------------------

	// Фильтр для удобочитаемой русской даты:
	// Использование: "{{ date | readableDateRu }}", результат: "13 ноября 2022":
	eleventyConfig.addFilter('readableDateRu', function (value) {
		return value
			.toLocaleString('ru', {
				day: 'numeric',
				month: 'long',// numeric | long | short.
				year: 'numeric',
			})
			.replace(' г.', '')
			.replace('г.', '');
	});

	eleventyConfig.addFilter('readableDateEn', function (value) {
		return value.toLocaleString('en', {
			day: 'numeric',
			month: 'long',// numeric | long | short.
			year: 'numeric',
		});
	});

	// Добавление функционала маркдауна {{ content | markdown | safe }}
	eleventyConfig.addFilter('markdown', function (value) {
		return markdownIt.render(value);
	});

	// Добавление функционала маркдауна инлайн {{ post.title | markdownInline | safe }}
	eleventyConfig.addFilter('markdownInline', function (value) {
		return markdownIt.renderInline(value);
	});

	// eleventyConfig.setLibrary('md', markdownIt);

	eleventyConfig.setLibrary(
		'md',
		markdownIt({
			html: true,
			linkify: true,
			typographer: true,
		}).use(markdownItScrollTable)
	);

	//------------------------------------------------
	// Шорткоды: -------------------------------------
	//------------------------------------------------

	// Добавить текущий год {% year %}:
	eleventyConfig.addShortcode('year', () => `${new Date().getFullYear()}`);

	// Генерация картинки OpenGraph для каждой страницы {% opengraph _site.siteUrl %}:
	eleventyConfig.addShortcode('encodeuri', function (baseUrl) {
		const pathPrefix = eleventyConfig.pathPrefix || '';
		const encodedURL = encodeURIComponent(baseUrl + pathPrefix + this.page.url);
		return encodedURL;
	});

	//------------------------------------------------
	// Обработка HTML: -------------------------------
	//------------------------------------------------

	// Добавление преобразования для минимизации HTML-файлов:
	eleventyConfig.addTransform('html-minify', function (content, path) {
		if (path && path.endsWith('.html')) {
			return htmlMinifierTerser.minify(content, {
				removeComments: true, // Удалить комментарии (default: false).
				collapseWhitespace: true, // Удалить пробелы в текстовых областях. Это может испортить текст внутри <code>, опасная настройка (default: false).
				removeScriptTypeAttributes: true, // Удалить type="text/javascript" из script тегов (default: false).
				removeStyleLinkTypeAttributes: true, // Удалить type="text/css" из style и link тегов (default: false).
				collapseBooleanAttributes: true, // Удалять логические атрибуты типа disabled="disabled", с этим нужно осторожно (default: false).
				includeAutoGeneratedTags: false, // Вставка тегов, сгенерированных парсером HTML, не уверен что нужно (default: true).
				minifyCSS: true, // Минифицировать встроенный CSS используя clean-css (default: false).
				minifyJS: true, // Минифицировать встроенный JS используя UglifyJS (default: false).
				//quoteCharacter: "",// Тип кавычек для значений атрибутов (' or ").

				// Настройки для экстремального сжатия:
				// removeRedundantAttributes: true,// Удалять атрибуты со значением по умолчанию, с этим нужно осторожно (default: false).
				// decodeEntities: true,// Использовать прямые символы Unicode (default: false). Оно в примерах кода из "&lt;/h1&gt;" делает "&lt;/h1>"
				//collapseInlineTagWhitespace: true,// Это убирает нужные пробелы между инлайновыми тегами, например у ссылок в тексте, лучше не включать эту настройку (default: false)!
				//sortAttributes: true,// Сортировать атрибуты по частоте, для лучшего сжатия gzip (default: false).
				//sortClassName: true,// Сортировать классы стилей по частоте, для лучшего сжатия gzip (default: false).
				//removeAttributeQuotes: true,// Удалить кавычки у атрибутов, только для экстремального сжатия (default: false).
				//removeOptionalTags: true,// Удалить необязательные теги, только для экстремального сжатия. На практике он удалял закрывающие </p> из-за чего браузер далее создавал пустые теги <p>, лучше не включать эту настройку (default: false)!
				//minifyURLs: false(default ) | String | Object | Function(text)(использует relateurl, пока думаю не стоит включать) (default: false).
			});
		}
		return content;
	});

	//------------------------------------------------
	// Обработка CSS: --------------------------------
	//------------------------------------------------

	// Добавление плагина LightningCSS:
	eleventyConfig.addPlugin(lightningCSS, {
		//importPrefix: '_', // Тип: строка, по умолчанию: '_'.
		//nesting: true, // Тип: логический, по умолчанию: true.
		//customMedia: true, // Тип: логический, по умолчанию: true.
		//minify: true, // Тип: логический, по умолчанию: true.
		//sourceMap: false, // Тип: логический, по умолчанию: false.
		// visitors: [], // Тип: массив, по умолчанию: [].
		// customAtRules: {} // Тип: объект, по умолчанию: {}.
	});

	//------------------------------------------------
	// Обработка JS: ---------------------------------
	//------------------------------------------------

	eleventyConfig.addTemplateFormats('js');

	eleventyConfig.addExtension('js', {
		outputFileExtension: 'js',
		compile: async (content, path) => {
			if (path !== './src/mitosite.js') {
				return;
			}
			return async () => {
				return esbuild.buildSync({
					target: 'es2020',
					entryPoints: [path],
					minify: true,
					bundle: true,
					write: false,
				}).outputFiles[0].text;
			};
		},
	});

	//------------------------------------------------
	// Обработка SVG: --------------------------------
	//------------------------------------------------

	// Тут должны быть: сборка спрайта, минификация всех SVG с SVGO, создание нужных фавиконок из файла favicon.svg

	//------------------------------------------------
	// Обработка других форматов: --------------------
	//------------------------------------------------

	// Минификация XML и JSON:
	// eleventyConfig.addTransform('minXmlJson', (content, path) => {
	// 	if (path && path.endsWith('.xml')) {
	// 		return prettyData.pd.xmlmin(content);
	// 	}
	// 	if (path && path.endsWith('.json')) {
	// 		return prettyData.pd.jsonmin(content);
	// 	}
	// 	return content;
	// });

	//------------------------------------------------
	// Прямое копирование файлов и папок: ------------
	//------------------------------------------------

	eleventyConfig.addPassthroughCopy('src/admin'); // Для CMS Decap.
	eleventyConfig.addPassthroughCopy('src/img');
	//eleventyConfig.addPassthroughCopy('src/img/**/*.{svg,avif,webp,jxl,jpg,jpeg,png,tif,tiff,bmp,gif}');
	eleventyConfig.addPassthroughCopy('src/fls');
	eleventyConfig.addPassthroughCopy('src/*.{js,php,txt,xml,json,webmanifest,htaccess,svg,ico}');

	//eleventyConfig.addPassthroughCopy({
	//	'./public/': '/',
	//	'./node_modules/prismjs/themes/prism-okaidia.css': '/css/prism-okaidia.css'
	//});

	//------------------------------------------------
	// Настройка путей, папок и движков: -------------
	//------------------------------------------------

	return {
		pathPrefix: '', // Тут можно указать дополнение к ссылкам (например имя репозитория на GitHub) и оно будет подставляться к локальным ссылкам с помощью плагина html-base.
		addPassthroughFileCopy: true,
		dataTemplateEngine: 'njk',
		markdownTemplateEngine: 'njk',
		htmlTemplateEngine: 'njk',
		templateFormats: ['html', 'njk', 'md'],
		dir: {
			input: 'src',
			output: 'site',
			includes: '_includes',
			layouts: '_includes',
			data: '_includes',
		},
	};
};
