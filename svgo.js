const fs = require('fs');
const path = require('path');
const { optimize } = require('svgo');

// Определение конфигурации SVGO:
const svgoConfig = {
	args: {
		recursive: true,
		multipass: true,
		// quiet: false,
		precision: 3
	},
	plugins: [
		{// Настройка или удаление плагинов по умолчанию (Yes):
			name: 'preset-default', params: {
				overrides: {
					// Пример настройки параметры плагинов по умолчанию:
					// inlineStyles: {
					//  onlyMatchedOnce: false,
					// },

					// Округляет числа до фикс. точности:
					// cleanupNumericValues: {},

					// Удаляет атрибут ViewBox:
					removeViewBox: false,
				},
			},
		},
		// Добавление новых плагинов:

		// Удаляет width/height и добавить viewBox (надо отключить removeViewBox):
		'removeDimensions',

		// Удаляет атрибут xmlns у встроенных SVG:
		// 'removeXMLNS',
	]
};

let totalSizeBefore = 0;
let totalSizeAfter = 0;
let totalFilesProcessed = 0;

// Получение входящего и исходящего пути из аргументов командной строки:
const inputFolder = process.argv[2];
const outputFolder = process.argv[3];

// Проверка, есть ли папка куда будут сохранены обработанные файлы. Если есть - пропускает, если нет - создаёт:
if (!fs.existsSync(outputFolder)) {
		fs.mkdirSync(outputFolder);
}

function processDirectory(inputDir, outputDir) {
		// Проверка существования выходной папки и создание ее при необходимости:
		if (!fs.existsSync(outputDir)) {
				fs.mkdirSync(outputDir);
		}

		// Чтение содержимого входной папки:
		let filenames = fs.readdirSync(inputDir);

		// Обработка каждого файла/папки:
		filenames.forEach((file) => {
				const inputPath = path.join(inputDir, file);
				const outputPath = path.join(outputDir, file);

				// Проверка, является ли элемент файлом или папкой:
				if (fs.statSync(inputPath).isDirectory()) {
						// Если это папка и указан аргумент recursive - вызываем функцию рекурсивно для обработки содержимого папки:
						if (svgoConfig.args.recursive) {
								processDirectory(inputPath, outputPath);
						}
				} else if (path.extname(inputPath) === '.svg') {
						// Если это файл SVG - обрабатываем его с помощью SVGO:
						const inputSize = fs.statSync(inputPath).size;
						totalSizeBefore += inputSize;

						const svgString = fs.readFileSync(inputPath, 'utf8');
						try {
								let optimizedSvg = { data: svgString };
								for (let i = 0; i < svgoConfig.args.multipass; i++) {
										const precisionConfig = { ...svgoConfig, floatPrecision: svgoConfig.args.precision };
										optimizedSvg = optimize(optimizedSvg.data, precisionConfig);
								}

								fs.writeFileSync(outputPath, optimizedSvg.data);
								const outputSize = fs.statSync(outputPath).size;
								totalSizeAfter += outputSize;
								totalFilesProcessed++;
						} catch (err) {
								console.log(`\x1b[31mSVGO: ошибка при оптимизиции SVG-файла ${inputPath}: ${err.message}\x1b[0m`);
						}
				}
		});
}

// Вызов функции для обработки SVG-файлов во входной папке:
processDirectory(inputFolder, outputFolder);

const compressionRatio = 1 - totalSizeAfter / totalSizeBefore;
const compressionPercentage = Math.ceil(compressionRatio * 100);
if (!svgoConfig.args.quiet) {
		console.log(`\x1b[32mSVGO: обработано файлов svg: ${totalFilesProcessed}, они сжаты на: ${compressionPercentage}%\x1b[0m`);
}
