// Скрипт для Слайдера "До-после":

const container = document.querySelector('.before-after');
document.querySelector('.before-after__range').addEventListener('input', (e) => {
	container.style.setProperty('--before-after-position', `${e.target.value}%`);
});




//Скрипт Soundist для управления аудио на сайте. Создан в Mitorun Studio, Олег Миторун (идея) и А.П.Гешов (код), версия 23.04.2023

(() => {
	let soundistMute = sessionStorage.getItem('soundist-mute') === 'true' ? true : false;

	const soundistMap = new Map();

	class Soundist {
		constructor(element) {
			this.element = element;
			this.class = ['soundist-active'];
			this.class = element.dataset.class ? this.class.concat(element.dataset.class.split(' ')) : this.class;
			this.volume = element.dataset.volume ? element.dataset.volume / 100 : 1;
			this.start = element.dataset.start ? Number(element.dataset.start) : 0;
			this.duration = element.dataset.duration ? Number(element.dataset.duration) : 0;
			this.end = this.duration ? this.start + this.duration : 0;
			this.loop = element.dataset.loop === undefined ? false : 100;
			this.loop = element.dataset.loop ? Number(element.dataset.loop) : this.loop;
			this.loops = 1;
			this.pause = element.dataset.pause === undefined ? false : true;
			this.stop = element.dataset.stop === undefined ? false : true;
			this.audio = new Audio(element.dataset.soundist);
			this.audio.currentTime = this.start;
			this.audio.volume = this.volume;
			this.audio.ontimeupdate = this.ontimeupdate;
			this.audio.onended = this.onended;
		}

		stopped = () => this.audio.paused;

		play = () => {
			this.audio.play();
			this.style(true);
		};

		replay = () => {
			this.halt();
			if (!this.stop && !this.pause) this.play();
		};

		halt = () => {
			if (this.pause) this.pausing();
			else this.stopping();
		};

		stopping = () => {
			this.audio.pause();
			this.style(false);
			this.reload();
		};

		pausing = () => {
			this.audio.pause();
			this.style(false);
		};

		newloop = () => {
			if (this.loops < this.loop) {
				this.loops += 1;
				this.play();
			} else {
				this.loops = 1;
			}
		};

		reload = () => {
			if (this.start) this.audio.load();
			this.audio.currentTime = this.start;
		};

		style = (enable) => {
			if (enable) this.element.classList.add(...this.class);
			else this.element.classList.remove(...this.class);
		};

		onended = () => {
			this.style(false);
			this.reload();
			if (this.loop) this.newloop();
		};

		ontimeupdate = () => {
			if (this.end && this.audio.currentTime > this.end) {
				this.stopping();
				if (this.loop) this.newloop();
			}
		};
	}

	const preloadSound = (element) => {
		const soundist = new Soundist(element);
		soundistMap.set(element, soundist);
	};

	const stopAll = () => {
		soundistMap.forEach((item) => {
			if (!item.stopped()) item.stopping();
		});
	};

	const soundElements = document.querySelectorAll('[data-soundist]');
	soundElements.forEach((element) => {
		if (element.dataset.preload !== undefined) preloadSound(element);
		element.addEventListener('click', () => {
			const soundist = soundistMap.get(element) || new Soundist(element);
			soundistMap.set(element, soundist);
			if (!soundistMute) {
				if (soundist.stopped()) {
					stopAll();
					soundist.play();
				} else {
					soundist.replay();
				}
			}
		});
	});

	const setMuteClass = (element) => {
		const muteClass = 'soundist-mute';
		if (soundistMute) element.classList.add(muteClass);
		else element.classList.remove(muteClass);
	};

	const muteElements = document.querySelectorAll('[data-soundist-mute]');
	muteElements.forEach((element) => {
		setMuteClass(element);
		element.addEventListener('click', () => {
			soundistMute = !soundistMute;
			if (soundistMute) stopAll();
			sessionStorage.setItem('soundist-mute', soundistMute);
			muteElements.forEach((item) => setMuteClass(item));
		});
	});
})();
