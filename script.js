document.addEventListener('DOMContentLoaded', function () {
	const $ = (s) => document.querySelector(s);
	const $$ = (s) => document.querySelectorAll(s);

	const startBtn = $('#start');
	const pauseBtn = $('#pause');
	const resetBtn = $('#reset');
	const settingsBtn = $('#settingsBtn');
	const saveSettingsBtn = $('#saveSettings');
	const closeSettingsBtn = $('#closeSettings');
	const settingsPanel = $('#settings');
	const modeButtons = $$('.mode');
	const minutesEl = $('#minutes');
	const secondsEl = $('#seconds');
	const modeLabel = $('#mode-label');
	const workInput = $('#workMinutes');
	const shortInput = $('#shortMinutes');
	const longInput = $('#longMinutes');
	const cyclesInput = $('#cyclesBeforeLong');
	const autoStartInput = $('#autoStartNext');
	const pomodoroCountEl = $('#pomodoroCount');

	// sound elements
	const soundSelect = $('#soundSelect');
	const previewSoundBtn = $('#previewSound');
	const soundFileInput = $('#soundFile');
	const soundFileName = $('#soundFileName');
	const customSoundLabel = $('#customSoundLabel');
	const volumeInput = $('#soundVolume');

	// background music elements
	const bgMusicEnabledChk = $('#bgMusicEnabled');
	const bgMusicFile = $('#bgMusicFile');
	const bgMusicFileName = $('#bgMusicFileName');
	const bgMusicUploadLabel = $('#bgMusicUploadLabel');
	const previewBgBtn = $('#previewBg');
	const bgMusicControls = $('#bgMusicControls');
	const bgMusicVolumeInput = $('#bgMusicVolume');

	const defaults = { workMinutes: 25, shortMinutes: 5, longMinutes: 15, cyclesBeforeLong: 4, autoStartNext: false, sound: 'beep', soundVolume: 0.8, soundCustomData: null, soundCustomName: '', bgEnabled: false, bgData: null, bgName: '', bgVolume: 0.5 };

	function loadSettings() {
		const stored = JSON.parse(localStorage.getItem('pomodoroSettings') || 'null') || defaults;
		workInput.value = stored.workMinutes;
		shortInput.value = stored.shortMinutes;
		longInput.value = stored.longMinutes;
		cyclesInput.value = stored.cyclesBeforeLong;
		autoStartInput.checked = !!stored.autoStartNext;
		if (soundSelect) soundSelect.value = stored.sound || defaults.sound;
		if (volumeInput) volumeInput.value = typeof stored.soundVolume !== 'undefined' ? stored.soundVolume : defaults.soundVolume;
		if (soundFileName && stored.soundCustomName) soundFileName.textContent = stored.soundCustomName;

		// background music settings
		if (bgMusicEnabledChk) bgMusicEnabledChk.checked = !!stored.bgEnabled;
		if (bgMusicFileName && stored.bgName) bgMusicFileName.textContent = stored.bgName;
		if (bgMusicUploadLabel && bgMusicEnabledChk) {
			if (bgMusicEnabledChk.checked) bgMusicUploadLabel.classList.remove('hidden'); else bgMusicUploadLabel.classList.add('hidden');
		}
		if (bgMusicControls) {
			if (stored.bgEnabled) bgMusicControls.classList.remove('hidden'); else bgMusicControls.classList.add('hidden');
		}
		if (bgMusicVolumeInput) bgMusicVolumeInput.value = typeof stored.bgVolume !== 'undefined' ? stored.bgVolume : defaults.bgVolume;

		if (customSoundLabel && soundSelect) {
			if (soundSelect.value === 'custom') customSoundLabel.classList.remove('hidden'); else customSoundLabel.classList.add('hidden');
		}
		return stored;
	}

	function readFileData(file) {
		return new Promise(function (resolve, reject) {
			const r = new FileReader();
			r.onload = function (e) { resolve(e.target.result); };
			r.onerror = reject;
			r.readAsDataURL(file);
		});
	}

	function saveSettings() {
		return new Promise(function (resolve) {
			const s = {
				workMinutes: Number(workInput.value) || defaults.workMinutes,
				shortMinutes: Number(shortInput.value) || defaults.shortMinutes,
				longMinutes: Number(longInput.value) || defaults.longMinutes,
				cyclesBeforeLong: Number(cyclesInput.value) || defaults.cyclesBeforeLong,
				autoStartNext: !!autoStartInput.checked,
				sound: soundSelect ? soundSelect.value : defaults.sound,
				soundVolume: volumeInput ? Number(volumeInput.value) : defaults.soundVolume,
				soundCustomData: settings && settings.soundCustomData ? settings.soundCustomData : null,
				soundCustomName: settings && settings.soundCustomName ? settings.soundCustomName : '',
				bgEnabled: bgMusicEnabledChk ? !!bgMusicEnabledChk.checked : false,
				bgData: settings && settings.bgData ? settings.bgData : null,
				bgName: settings && settings.bgName ? settings.bgName : '',
				bgVolume: bgMusicVolumeInput ? Number(bgMusicVolumeInput.value) : defaults.bgVolume
			};

			const prev = JSON.parse(localStorage.getItem('pomodoroSettings') || 'null') || {};
			const soundFile = soundFileInput && soundFileInput.files && soundFileInput.files[0];
			const bgFile = bgMusicFile && bgMusicFile.files && bgMusicFile.files[0];
			const tasks = [];

			if (soundFile) {
				tasks.push(readFileData(soundFile).then(function (data) {
					s.soundCustomData = data;
					s.soundCustomName = soundFile.name;
				}));
			} else {
				if (prev.soundCustomData && !s.soundCustomData) { s.soundCustomData = prev.soundCustomData; s.soundCustomName = prev.soundCustomName; }
			}

			if (bgFile) {
				tasks.push(readFileData(bgFile).then(function (data) {
					s.bgData = data;
					s.bgName = bgFile.name;
				}));
			} else {
				if (prev.bgData && !s.bgData) { s.bgData = prev.bgData; s.bgName = prev.bgName; }
			}

			if (tasks.length) {
				Promise.all(tasks).then(function () {
					localStorage.setItem('pomodoroSettings', JSON.stringify(s));
					settings = s;
					applySettings();
					if (soundFileName) soundFileName.textContent = s.soundCustomName || '';
					if (bgMusicFileName) bgMusicFileName.textContent = s.bgName || '';
					resolve();
				}).catch(function (err) {
					console.error(err);
					localStorage.setItem('pomodoroSettings', JSON.stringify(s));
					settings = s;
					applySettings();
					resolve();
				});
			} else {
				localStorage.setItem('pomodoroSettings', JSON.stringify(s));
				settings = s;
				applySettings();
				if (soundFileName) soundFileName.textContent = s.soundCustomName || '';
				if (bgMusicFileName) bgMusicFileName.textContent = s.bgName || '';
				resolve();
			}
		});
	}

	function applySettings() {
		durations = { work: settings.workMinutes * 60, short: settings.shortMinutes * 60, long: settings.longMinutes * 60 };
		if (!isRunning) {
			remaining = durations[mode];
			updateDisplay();
		}
		if (soundSelect && customSoundLabel) {
			if (soundSelect.value === 'custom') customSoundLabel.classList.remove('hidden'); else customSoundLabel.classList.add('hidden');
		}
	}

	let settings = loadSettings();
	let durations = { work: settings.workMinutes * 60, short: settings.shortMinutes * 60, long: settings.longMinutes * 60 };
	let mode = 'work';
	let remaining = durations.work;
	let timerId = null;
	let isRunning = false;
	let pomodoroCount = Number(localStorage.getItem('pomodoroCount') || 0);
	let cycleCount = Number(localStorage.getItem('cycleCount') || 0);
	let audioCtx = null;
	let bgAudio = null;
	let previewBgAudio = null;
	let isPreviewingBg = false;

	function updateCounts() {
		pomodoroCountEl.textContent = String(pomodoroCount);
		localStorage.setItem('pomodoroCount', String(pomodoroCount));
		localStorage.setItem('cycleCount', String(cycleCount));
	}

	updateCounts();

	function updateDisplay() {
		const m = Math.floor(remaining / 60);
		const s = remaining % 60;
		minutesEl.textContent = String(m).padStart(2, '0');
		secondsEl.textContent = String(s).padStart(2, '0');
		modeLabel.textContent = mode === 'work' ? 'Work' : mode === 'short' ? 'Short Break' : 'Long Break';
		modeButtons.forEach((b) => b.classList.toggle('active', b.dataset.mode === mode));
	}

	function tick() {
		if (remaining > 0) {
			remaining -= 1;
			updateDisplay();
		} else {
			handleComplete();
		}
	}

	function startTimer() {
		if (isRunning) return;
		if (!audioCtx) {
			try {
				audioCtx = new (window.AudioContext || window.webkitAudioContext)();
			} catch (e) {
				audioCtx = null;
			}
		}
		timerId = setInterval(tick, 1000);
		isRunning = true;
		startBtn.disabled = true;
		pauseBtn.disabled = false;
		// start background music if enabled
		if (settings && settings.bgEnabled && settings.bgData) {
			playBgMusic();
		}
	}

	function pauseTimer() {
		if (!isRunning) return;
		clearInterval(timerId);
		timerId = null;
		isRunning = false;
		startBtn.disabled = false;
		pauseBtn.disabled = true;
		pauseBgMusic();
	}

	function resetTimer() {
		pauseTimer();
		remaining = durations[mode];
		updateDisplay();
		pauseBgMusic();
	}

	function switchMode(m) {
		pauseTimer();
		mode = m;
		remaining = durations[mode];
		updateDisplay();
	}

	function playSynth(type, volume) {
		if (!audioCtx) {
			try {
				audioCtx = new (window.AudioContext || window.webkitAudioContext)();
			} catch (e) {
				audioCtx = null;
			}
		}
		if (!audioCtx) return;
		const now = audioCtx.currentTime;
		if (type === 'beep') {
			const o = audioCtx.createOscillator();
			const g = audioCtx.createGain();
			o.type = 'sine';
			o.frequency.setValueAtTime(1000, now);
			g.gain.setValueAtTime(volume, now);
			o.connect(g);
			g.connect(audioCtx.destination);
			g.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
			o.start(now);
			o.stop(now + 0.26);
			return;
		}
		if (type === 'chime') {
			const o1 = audioCtx.createOscillator();
			const o2 = audioCtx.createOscillator();
			const g1 = audioCtx.createGain();
			const g2 = audioCtx.createGain();
			o1.type = 'sine';
			o2.type = 'sine';
			o1.frequency.setValueAtTime(880, now);
			o2.frequency.setValueAtTime(1320, now);
			g1.gain.setValueAtTime(volume * 0.7, now);
			g2.gain.setValueAtTime(volume * 0.6, now + 0.06);
			o1.connect(g1);
			o2.connect(g2);
			g1.connect(audioCtx.destination);
			g2.connect(audioCtx.destination);
			g1.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
			g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.9);
			o1.start(now);
			o2.start(now + 0.06);
			o1.stop(now + 0.62);
			o2.stop(now + 0.96);
			return;
		}
		if (type === 'bell') {
			const o = audioCtx.createOscillator();
			const g = audioCtx.createGain();
			o.type = 'triangle';
			o.frequency.setValueAtTime(660, now);
			g.gain.setValueAtTime(volume, now);
			o.connect(g);
			g.connect(audioCtx.destination);
			g.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);
			o.start(now);
			o.stop(now + 1.9);
			return;
		}
	}

	function playCompleteSound() {
		const vol = settings && typeof settings.soundVolume !== 'undefined' ? Number(settings.soundVolume) : 0.8;
		const type = settings && settings.sound ? settings.sound : 'beep';
		if (type === 'custom' && settings && settings.soundCustomData) {
			const a = new Audio(settings.soundCustomData);
			a.volume = Math.min(Math.max(vol, 0), 1);
			a.play();
		} else {
			playSynth(type, Math.min(Math.max(vol, 0), 1));
		}
	}

	function playBgMusic() {
		if (!settings || !settings.bgData) return;
		if (!bgAudio) {
			bgAudio = new Audio(settings.bgData);
			bgAudio.loop = true;
		}
		bgAudio.volume = typeof settings.bgVolume !== 'undefined' ? Number(settings.bgVolume) : 0.5;
		bgAudio.play().catch(function () {});
	}

	function pauseBgMusic() {
		if (bgAudio) {
			try { bgAudio.pause(); } catch (e) {}
		}
	}

	function showNotification(title, body) {
		if (!('Notification' in window)) return;
		if (Notification.permission === 'granted') {
			new Notification(title, { body: body });
		} else if (Notification.permission !== 'denied') {
			Notification.requestPermission().then(function (p) {
				if (p === 'granted') new Notification(title, { body: body });
			});
		}
	}

	function handleComplete() {
		playCompleteSound();
		if (mode === 'work') {
			pomodoroCount += 1;
			cycleCount += 1;
			updateCounts();
			const next = cycleCount >= settings.cyclesBeforeLong ? 'long' : 'short';
			if (cycleCount >= settings.cyclesBeforeLong) cycleCount = 0;
			showNotification('Pomodoro completo', 'Hora de descansar!');
			mode = next;
		} else {
			mode = 'work';
			showNotification('Pausa terminada', 'Hora de focar!');
		}
		durations = { work: settings.workMinutes * 60, short: settings.shortMinutes * 60, long: settings.longMinutes * 60 };
		remaining = durations[mode];
		updateDisplay();
		localStorage.setItem('cycleCount', String(cycleCount));
		if (settings.autoStartNext) {
			startTimer();
		} else {
			pauseTimer();
		}
	}

	// events
	startBtn.addEventListener('click', function () {
		startTimer();
		if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
	});
	pauseBtn.addEventListener('click', pauseTimer);
	resetBtn.addEventListener('click', resetTimer);
	settingsBtn.addEventListener('click', function () {
		settingsPanel.classList.toggle('hidden');
		settingsPanel.setAttribute('aria-hidden', String(settingsPanel.classList.contains('hidden')));
	});
	saveSettingsBtn.addEventListener('click', function () {
		saveSettings().then(function () {
			settingsPanel.classList.add('hidden');
			settingsPanel.setAttribute('aria-hidden', 'true');
		});
	});
	closeSettingsBtn.addEventListener('click', function () {
		settingsPanel.classList.add('hidden');
		settingsPanel.setAttribute('aria-hidden', 'true');
	});

	if (soundSelect) {
		soundSelect.addEventListener('change', function () {
			if (customSoundLabel) {
				if (soundSelect.value === 'custom') customSoundLabel.classList.remove('hidden'); else customSoundLabel.classList.add('hidden');
			}
		});
	}

	if (bgMusicEnabledChk) {
		bgMusicEnabledChk.addEventListener('change', function () {
			if (bgMusicEnabledChk.checked) {
				if (bgMusicUploadLabel) bgMusicUploadLabel.classList.remove('hidden');
				if (bgMusicControls) bgMusicControls.classList.remove('hidden');
			} else {
				if (bgMusicUploadLabel) bgMusicUploadLabel.classList.add('hidden');
				if (bgMusicControls) bgMusicControls.classList.add('hidden');
				pauseBgMusic();
			}
		});
	}

	if (bgMusicFile) {
		bgMusicFile.addEventListener('change', function () {
			if (bgMusicFile.files && bgMusicFile.files[0]) {
				if (bgMusicFileName) bgMusicFileName.textContent = bgMusicFile.files[0].name;
			} else {
				if (bgMusicFileName) bgMusicFileName.textContent = '';
			}
		});
	}

	if (previewBgBtn) {
		previewBgBtn.addEventListener('click', function () {
			if (isPreviewingBg) {
				if (previewBgAudio) try { previewBgAudio.pause(); } catch (e) {}
				isPreviewingBg = false;
				previewBgBtn.textContent = 'Preview Background';
				return;
			}
			// play preview from selected file or saved data
			let src = null;
			if (bgMusicFile && bgMusicFile.files && bgMusicFile.files[0]) {
				src = URL.createObjectURL(bgMusicFile.files[0]);
			} else if (settings && settings.bgData) {
				src = settings.bgData;
			}
			if (!src) return;
			previewBgAudio = new Audio(src);
			previewBgAudio.loop = false;
			previewBgAudio.volume = bgMusicVolumeInput ? Number(bgMusicVolumeInput.value) : 0.5;
			previewBgAudio.play().catch(function () {});
			isPreviewingBg = true;
			previewBgBtn.textContent = 'Stop Preview';
			previewBgAudio.onended = function () {
				isPreviewingBg = false;
				previewBgBtn.textContent = 'Preview Background';
			};
		});
	}

	if (bgMusicVolumeInput) {
		bgMusicVolumeInput.addEventListener('input', function () {
			if (bgAudio) bgAudio.volume = Number(bgMusicVolumeInput.value);
		});
	}
	if (soundFileInput) {
		soundFileInput.addEventListener('change', function () {
			if (soundFileInput.files && soundFileInput.files[0]) {
				if (soundFileName) soundFileName.textContent = soundFileInput.files[0].name;
			} else {
				if (soundFileName) soundFileName.textContent = '';
			}
		});
	}
	if (previewSoundBtn) {
		previewSoundBtn.addEventListener('click', function () {
			playCompleteSound();
		});
	}

	modeButtons.forEach(function (b) {
		b.addEventListener('click', function () {
			var m = b.dataset.mode;
			switchMode(m);
		});
	});

	// initialize
	updateDisplay();
	startBtn.addEventListener('click', function () {
		if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission();
	});
});
