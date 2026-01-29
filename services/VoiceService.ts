class VoiceService {
    private synthesis: SpeechSynthesis;
    private voice: SpeechSynthesisVoice | null = null;
    private enabled: boolean = false;

    constructor() {
        this.synthesis = window.speechSynthesis;
        if (this.synthesis.onvoiceschanged !== undefined) {
            this.synthesis.onvoiceschanged = this.loadVoices.bind(this);
        }
        this.loadVoices(); // Initial attempt
    }

    private loadVoices() {
        const voices = this.synthesis.getVoices();
        // Try to find a good English voice
        this.voice = voices.find(v => v.name.includes("Google US English")) ||
            voices.find(v => v.lang === 'en-US') ||
            voices[0] || null;
    }

    public setEnabled(enabled: boolean) {
        this.enabled = enabled;
        if (!enabled) {
            this.stop();
        }
    }

    public isEnabled() {
        return this.enabled;
    }

    public speak(text: string) {
        if (!this.enabled || !this.voice) return;

        // Cancel any current speaking
        this.stop();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.voice;
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        utterance.text = text; // Read full text without omitting code blocks
        this.synthesis.speak(utterance);
    }

    public stop() {
        if (this.synthesis.speaking) {
            this.synthesis.cancel();
        }
    }
}

export const voiceService = new VoiceService();
