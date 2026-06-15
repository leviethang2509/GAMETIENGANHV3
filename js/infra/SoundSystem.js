// js/infra/SoundSystem.js
export class SoundSystem {
    constructor() {
        this.ctx = null;
        this.nodes = {
            masterGain: null,
            bgmGain: null,
            sfxGain: null,
            ambienceGain: null
        };
        this.buffers = new Map();
        this.activeSources = new Set();
        this.initialized = false;
        
        // Cài đặt âm lượng mặc định
        this.volumes = {
            master: 0.8,
            bgm: 0.5,
            sfx: 0.7,
            ambience: 0.4
        };
        this.muted = false;
    }

    toggleMute() {
        if (!this.initialized) this.init();
        this.muted = !this.muted;
        const masterGainNode = this.nodes.masterGain;
        if (masterGainNode) {
            const targetVolume = this.muted ? 0.0 : this.volumes.master;
            masterGainNode.gain.setValueAtTime(targetVolume, this.ctx.currentTime);
        }
        return this.muted;
    }

    init() {
        if (this.initialized) return;

        // Khởi tạo AudioContext
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) {
            console.warn("Web Audio API is not supported in this browser.");
            return;
        }

        this.ctx = new AudioContextClass();

        // Tạo đồ thị Node (Audio Graph)
        this.nodes.masterGain = this.ctx.createGain();
        this.nodes.masterGain.gain.setValueAtTime(this.volumes.master, this.ctx.currentTime);
        this.nodes.masterGain.connect(this.ctx.destination);

        this.nodes.bgmGain = this.ctx.createGain();
        this.nodes.bgmGain.gain.setValueAtTime(this.volumes.bgm, this.ctx.currentTime);
        this.nodes.bgmGain.connect(this.nodes.masterGain);

        this.nodes.sfxGain = this.ctx.createGain();
        this.nodes.sfxGain.gain.setValueAtTime(this.volumes.sfx, this.ctx.currentTime);
        this.nodes.sfxGain.connect(this.nodes.masterGain);

        this.nodes.ambienceGain = this.ctx.createGain();
        this.nodes.ambienceGain.gain.setValueAtTime(this.volumes.ambience, this.ctx.currentTime);
        this.nodes.ambienceGain.connect(this.nodes.masterGain);

        this.initialized = true;
        console.log("SoundSystem: AudioContext and Gain Nodes initialized.");

        // Thêm trình lắng nghe sự kiện tương tác người dùng để resume AudioContext (Autoplay Policy)
        const resumeCtx = () => {
            if (this.ctx && this.ctx.state === 'suspended') {
                this.ctx.resume().then(() => {
                    console.log("SoundSystem: AudioContext resumed successfully.");
                    // Xóa event listener sau khi đã resume thành công
                    window.removeEventListener('click', resumeCtx);
                    window.removeEventListener('keydown', resumeCtx);
                });
            }
        };
        window.addEventListener('click', resumeCtx);
        window.addEventListener('keydown', resumeCtx);
    }

    async preloadAudio(key, url) {
        if (!this.initialized) this.init();
        if (this.buffers.has(key)) return;

        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            // Đảm bảo hỗ trợ trình duyệt cũ dùng callback thay vì promise cho decodeAudioData
            const audioBuffer = await new Promise((resolve, reject) => {
                this.ctx.decodeAudioData(arrayBuffer, resolve, reject);
            });
            this.buffers.set(key, audioBuffer);
            console.log(`SoundSystem: Preloaded audio [${key}] from ${url}`);
        } catch (error) {
            console.error(`SoundSystem: Failed to load audio [${key}] from ${url}`, error);
        }
    }

    playSFX(key) {
        if (!this.initialized) this.init();
        const buffer = this.buffers.get(key);
        if (!buffer) {
            console.warn(`SoundSystem: Sound [${key}] not preloaded or failed to load.`);
            return null;
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(this.nodes.sfxGain);
        source.start(0);

        this.activeSources.add(source);
        source.onended = () => {
            this.activeSources.delete(source);
        };
        return source;
    }

    playBGM(key, loop = true) {
        if (!this.initialized) this.init();
        const buffer = this.buffers.get(key);
        if (!buffer) {
            console.warn(`SoundSystem: BGM [${key}] not preloaded.`);
            return null;
        }

        // Dừng nhạc nền cũ nếu đang chạy
        if (this.bgmSource) {
            try {
                this.bgmSource.stop();
            } catch (e) {}
        }

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = loop;
        source.connect(this.nodes.bgmGain);
        source.start(0);
        this.bgmSource = source;
        return source;
    }

    playPositionalSFX(key, position, camera, maxDistance = 50) {
        if (!this.initialized) this.init();
        const buffer = this.buffers.get(key);
        if (!buffer) return null;

        const source = this.ctx.createBufferSource();
        source.buffer = buffer;

        // Tạo PannerNode cho âm thanh 3D
        const panner = this.ctx.createPanner();
        panner.panningModel = 'HRTF';
        panner.distanceModel = 'inverse';
        panner.refDistance = 1;
        panner.maxDistance = maxDistance;
        panner.rolloffFactor = 1;
        panner.coneInnerAngle = 360;
        panner.coneOuterAngle = 360;

        // Cập nhật vị trí của nguồn phát
        const time = this.ctx.currentTime;
        panner.positionX.setValueAtTime(position.x, time);
        panner.positionY.setValueAtTime(position.y || 0, time);
        panner.positionZ.setValueAtTime(position.z, time);

        // Kết nối source -> panner -> masterGain (hoặc sfxGain)
        source.connect(panner);
        panner.connect(this.nodes.sfxGain);

        source.start(0);
        this.activeSources.add(source);
        source.onended = () => {
            this.activeSources.delete(source);
        };
        return source;
    }

    updateListener(camera) {
        if (!this.initialized || !this.ctx || !camera) return;

        const time = this.ctx.currentTime;
        const listener = this.ctx.listener;

        // Cập nhật vị trí listener trùng với Camera
        if (listener.positionX) {
            listener.positionX.setValueAtTime(camera.position.x, time);
            listener.positionY.setValueAtTime(camera.position.y, time);
            listener.positionZ.setValueAtTime(camera.position.z, time);
        } else {
            // Hỗ trợ các trình duyệt cũ hơn
            listener.setPosition(camera.position.x, camera.position.y, camera.position.z);
        }

        // Lấy hướng nhìn và hướng đỉnh đầu của Camera
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);

        if (listener.forwardX) {
            listener.forwardX.setValueAtTime(forward.x, time);
            listener.forwardY.setValueAtTime(forward.y, time);
            listener.forwardZ.setValueAtTime(forward.z, time);
            listener.upX.setValueAtTime(up.x, time);
            listener.upY.setValueAtTime(up.y, time);
            listener.upZ.setValueAtTime(up.z, time);
        } else {
            listener.setOrientation(forward.x, forward.y, forward.z, up.x, up.y, up.z);
        }
    }

    setVolume(type, volume) {
        if (!this.initialized) this.init();
        this.volumes[type] = volume;
        const gainNode = this.nodes[`${type}Gain`] || this.nodes.masterGain;
        if (gainNode) {
            gainNode.gain.setValueAtTime(volume, this.ctx.currentTime);
        }
    }
}
