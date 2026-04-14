let visorTimer = document.getElementById('time');
let btnPomodoro = document.getElementById('btn-pomodoro');
let btnShort = document.getElementById('btn-short');
let btnLong = document.getElementById('btn-long');
let btnStart = document.getElementById('btn-start');
let btnReset = document.getElementById('btn-reset');
let visorSessions = document.getElementById('sessions');
let sound = new Audio('./sons/notification-digital-chime-betacut-1-00-02.mp3');
let sessionsCount = 0;

let totalSeconds = 1500;
let timerEstaRodando = false;
let interval;
let timerType = 1500; // 25 minutos


function secondsToTime(seconds) {
    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = seconds % 60;
    visorTimer.textContent = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
}

btnPomodoro.addEventListener('click', function() {
    clearInterval(interval);
    timerEstaRodando = false;
    btnStart.textContent = 'Iniciar';
    timerType = 1500; // 25 minutos
    totalSeconds = 1500; // 25 * 60
    secondsToTime(totalSeconds);
});

btnShort.addEventListener('click', function() {
    clearInterval(interval);
    timerEstaRodando = false;
    btnStart.textContent = 'Iniciar';
    timerType = 300; // 5 minutos
    totalSeconds = 300; // 5 * 60
    secondsToTime(totalSeconds);
});

btnLong.addEventListener('click', function() {
    clearInterval(interval);
    timerEstaRodando = false;
    btnStart.textContent = 'Iniciar';
    timerType = 900; // 15 minutos
    totalSeconds = 900; // 15 * 60
    secondsToTime(totalSeconds);
});

btnStart.addEventListener('click', function() {
    if (!timerEstaRodando) {
        timerEstaRodando = true;
        btnStart.textContent = 'Pausar';
        
        let tempoFinal = Date.now() + (totalSeconds * 1000);

        interval = setInterval(function() {
            let segundosQueFaltam = Math.ceil((tempoFinal - Date.now()) / 1000);

            if (segundosQueFaltam > 0) {
                totalSeconds = segundosQueFaltam; 
                secondsToTime(totalSeconds);      
            } else {
                clearInterval(interval);
                timerEstaRodando = false;
                btnStart.textContent = 'Iniciar';
                totalSeconds = 0;
                secondsToTime(0);
                
                sound.play();
                if (timerType === 1500) { 
                    sessionsCount++;
                    visorSessions.textContent = sessionsCount;
                }
            }
        }, 100); 
    } else {
        timerEstaRodando = false;
        btnStart.textContent = 'Iniciar';
        clearInterval(interval);
    }
});

btnReset.addEventListener('click', function() {
    clearInterval(interval);
    timerEstaRodando = false;
    btnStart.textContent = 'Iniciar';
    totalSeconds = timerType;
    secondsToTime(totalSeconds);
});

