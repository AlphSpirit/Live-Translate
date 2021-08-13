const speech = require('@google-cloud/speech');
const { RtAudio, RtAudioFormat, RtAudioApi, RtAudioStreamFlags } = require("audify");
const client = new speech.SpeechClient();
const { app, BrowserWindow } = require("electron");

const encoding = "LINEAR16";
const sampleRateHertz = 16000;
const languageCode = "en-US";

/**
 * @type {BrowserWindow}
 */
let window;

const request = {
    config: {
        encoding,
        sampleRateHertz,
        languageCode
    }
};

const stream = client.streamingRecognize(request).on("error", console.error).on("data", data => {
    if (data.results[0].alternatives[0].confidence >= 0.8) {
        console.log("RECEIVED: " + data.results[0].alternatives[0].transcript);
        window.webContents.send("recognize", data.results[0].alternatives[0].transcript);
    }
});

const audio = new RtAudio(RtAudioApi.WINDOWS_WASAPI);
audio.openStream(null, {
    deviceId: 2,
    nChannels: 1,
    firstChannel: 0
}, RtAudioFormat.RTAUDIO_SINT16, sampleRateHertz, 1920, "MyStream2", pcm => {
    stream.write(pcm);
}, (...args) => {
    console.log(args);
}, 0, (type, error) => {
    console.log(type);
    console.log(error);
    console.log(Date.now() - start);
});
audio.start();

let streamInterval = setInterval(() => {
    audio.isStreamOpen();
}, 1000);

console.log('Listening, press Ctrl+C to stop.');

app.whenReady().then(() => {
    window = new BrowserWindow({
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        },
        width: 1024,
        height: 768
    });
    window.loadFile("index.html");
    window.on("closed", () => {
        clearInterval(streamInterval);
        audio.closeStream();
        stream.end();
    });
});