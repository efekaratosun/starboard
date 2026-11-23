import AVFoundation
import Capacitor
import Speech

@objc(StarboardSpeechPlugin)
public class StarboardSpeechPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "StarboardSpeechPlugin"
    public let jsName = "StarboardSpeech"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "status", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "start", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "stop", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "cancel", returnType: CAPPluginReturnPromise)
    ]

    private static let turkishLocale = Locale(identifier: "tr-TR")
    private static let silenceAfterTextChange: TimeInterval = 1.6
    private static let noSpeechTimeout: TimeInterval = 8.0
    private static let maxSessionDuration: TimeInterval = 30.0

    private var audioEngine = AVAudioEngine()
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private var speechRecognizer: SFSpeechRecognizer?

    private var activeStartCall: CAPPluginCall?
    private var latestText = ""
    private var hasReceivedSpeech = false
    private var silenceWorkItem: DispatchWorkItem?
    private var noSpeechWorkItem: DispatchWorkItem?
    private var maxDurationWorkItem: DispatchWorkItem?
    private var isSessionRunning = false

    // MARK: - Public API

    @objc public func status(_ call: CAPPluginCall) {
        let supported = Self.isOnDeviceTurkishSupported()
        let permission = Self.aggregatePermission()
        call.resolve([
            "supported": supported,
            "permission": permission
        ])
    }

    @objc public func start(_ call: CAPPluginCall) {
        guard activeStartCall == nil, !isSessionRunning else {
            call.reject("Another speech session is already active.", "error")
            return
        }

        guard Self.isOnDeviceTurkishSupported() else {
            call.reject("On-device Turkish speech recognition is not available on this device.", "unsupported")
            return
        }

        let hints = call.getArray("hints", String.self) ?? []

        ensurePermissions { [weak self] granted in
            guard let self else { return }
            guard granted else {
                call.reject("Microphone or speech recognition permission was denied.", "denied")
                return
            }
            self.beginSession(call: call, hints: hints)
        }
    }

    @objc public func stop(_ call: CAPPluginCall) {
        guard isSessionRunning else {
            call.resolve(["text": latestText])
            return
        }
        finishSession(resolving: call, text: latestText)
    }

    @objc public func cancel(_ call: CAPPluginCall) {
        tearDownSession(notify: false)
        if let pending = activeStartCall {
            activeStartCall = nil
            pending.resolve(["text": ""])
        }
        call.resolve()
    }

    // MARK: - Support and permissions

    private static func turkishRecognizer() -> SFSpeechRecognizer? {
        SFSpeechRecognizer(locale: turkishLocale)
    }

    private static func isOnDeviceTurkishSupported() -> Bool {
        guard let recognizer = turkishRecognizer() else { return false }
        return recognizer.isAvailable && recognizer.supportsOnDeviceRecognition
    }

    private static func microphonePermissionState() -> String {
        switch AVAudioSession.sharedInstance().recordPermission {
        case .granted:
            return "granted"
        case .denied:
            return "denied"
        case .undetermined:
            return "prompt"
        @unknown default:
            return "prompt"
        }
    }

    private static func speechPermissionState() -> String {
        switch SFSpeechRecognizer.authorizationStatus() {
        case .authorized:
            return "granted"
        case .denied, .restricted:
            return "denied"
        case .notDetermined:
            return "prompt"
        @unknown default:
            return "prompt"
        }
    }

    private static func aggregatePermission() -> String {
        let mic = microphonePermissionState()
        let speech = speechPermissionState()
        if mic == "denied" || speech == "denied" {
            return "denied"
        }
        if mic == "granted" && speech == "granted" {
            return "granted"
        }
        return "prompt"
    }

    private func ensurePermissions(completion: @escaping (Bool) -> Void) {
        let group = DispatchGroup()
        var micOk = false
        var speechOk = false

        let micState = Self.microphonePermissionState()
        if micState == "granted" {
            micOk = true
        } else if micState == "denied" {
            completion(false)
            return
        } else {
            group.enter()
            AVAudioSession.sharedInstance().requestRecordPermission { granted in
                micOk = granted
                group.leave()
            }
        }

        let speechState = Self.speechPermissionState()
        if speechState == "granted" {
            speechOk = true
        } else if speechState == "denied" {
            completion(false)
            return
        } else {
            group.enter()
            SFSpeechRecognizer.requestAuthorization { status in
                speechOk = status == .authorized
                group.leave()
            }
        }

        if micState == "granted" && speechState == "granted" {
            completion(true)
            return
        }

        group.notify(queue: .main) {
            completion(micOk && speechOk)
        }
    }

    // MARK: - Session lifecycle

    private func beginSession(call: CAPPluginCall, hints: [String]) {
        guard let recognizer = Self.turkishRecognizer() else {
            call.reject("On-device Turkish speech recognition is not available on this device.", "unsupported")
            return
        }

        if !recognizer.supportsOnDeviceRecognition {
            call.reject("On-device Turkish speech recognition is not available on this device.", "unsupported")
            return
        }

        speechRecognizer = recognizer
        activeStartCall = call
        latestText = ""
        hasReceivedSpeech = false
        isSessionRunning = true

        cancelTimers()

        let audioSession = AVAudioSession.sharedInstance()
        do {
            try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
            try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
        } catch {
            isSessionRunning = false
            activeStartCall = nil
            call.reject("Could not configure the audio session.", "error")
            return
        }

        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest else {
            releaseAudioSession()
            isSessionRunning = false
            activeStartCall = nil
            call.reject("Could not create a recognition request.", "error")
            return
        }

        recognitionRequest.requiresOnDeviceRecognition = true
        recognitionRequest.shouldReportPartialResults = true
        if !hints.isEmpty {
            recognitionRequest.contextualStrings = hints
        }

        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        inputNode.removeTap(onBus: 0)
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] buffer, _ in
            self?.recognitionRequest?.append(buffer)
        }

        audioEngine.prepare()
        do {
            try audioEngine.start()
        } catch {
            inputNode.removeTap(onBus: 0)
            releaseAudioSession()
            isSessionRunning = false
            activeStartCall = nil
            call.reject("Could not start audio capture.", "error")
            return
        }

        scheduleMaxDurationTimeout()
        scheduleNoSpeechTimeout()

        recognitionTask = recognizer.recognitionTask(with: recognitionRequest) { [weak self] result, error in
            guard let self else { return }
            if let result {
                let text = result.bestTranscription.formattedString
                self.handleTranscriptionUpdate(text)
                if result.isFinal {
                    self.finishSession(resolving: nil, text: text)
                }
            } else if let error {
                let nsError = error as NSError
                if nsError.domain == "kAFAssistantErrorDomain", nsError.code == 216 {
                    // User stopped or session ended; already handled elsewhere.
                    return
                }
                if self.isSessionRunning {
                    self.failSession(message: error.localizedDescription)
                }
            }
        }
    }

    private func handleTranscriptionUpdate(_ text: String) {
        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { return }

        if trimmed != latestText {
            latestText = trimmed
            hasReceivedSpeech = true
            notifyListeners("partial", data: ["text": trimmed])
            cancelNoSpeechTimeout()
            scheduleSilenceTimeout()
        }
    }

    private func finishSession(resolving extraCall: CAPPluginCall?, text: String) {
        guard isSessionRunning || activeStartCall != nil else {
            extraCall?.resolve(["text": text.trimmingCharacters(in: .whitespacesAndNewlines)])
            return
        }

        let finalText = text.trimmingCharacters(in: .whitespacesAndNewlines)
        let startCall = activeStartCall
        activeStartCall = nil
        tearDownSession(notify: true)

        startCall?.resolve(["text": finalText])
        extraCall?.resolve(["text": finalText])
    }

    private func failSession(message: String) {
        tearDownSession(notify: false)
        if let startCall = activeStartCall {
            activeStartCall = nil
            startCall.reject(message, "error")
        }
    }

    private func tearDownSession(notify: Bool) {
        cancelTimers()

        if audioEngine.isRunning {
            audioEngine.stop()
        }
        audioEngine.inputNode.removeTap(onBus: 0)

        recognitionRequest?.endAudio()
        recognitionRequest = nil
        recognitionTask?.cancel()
        recognitionTask = nil
        speechRecognizer = nil

        releaseAudioSession()
        isSessionRunning = false

        if !notify {
            // cancel path: listeners are not notified of a final result
        }
    }

    private func releaseAudioSession() {
        do {
            try AVAudioSession.sharedInstance().setActive(false, options: .notifyOthersOnDeactivation)
        } catch {
            // Best effort; session may already be inactive.
        }
    }

    // MARK: - Timers

    private func cancelTimers() {
        silenceWorkItem?.cancel()
        silenceWorkItem = nil
        noSpeechWorkItem?.cancel()
        noSpeechWorkItem = nil
        maxDurationWorkItem?.cancel()
        maxDurationWorkItem = nil
    }

    private func scheduleSilenceTimeout() {
        silenceWorkItem?.cancel()
        let work = DispatchWorkItem { [weak self] in
            guard let self, self.isSessionRunning else { return }
            self.finishSession(resolving: nil, text: self.latestText)
        }
        silenceWorkItem = work
        DispatchQueue.main.asyncAfter(
            deadline: .now() + Self.silenceAfterTextChange,
            execute: work
        )
    }

    private func scheduleNoSpeechTimeout() {
        noSpeechWorkItem?.cancel()
        let work = DispatchWorkItem { [weak self] in
            guard let self, self.isSessionRunning, !self.hasReceivedSpeech else { return }
            self.finishSession(resolving: nil, text: "")
        }
        noSpeechWorkItem = work
        DispatchQueue.main.asyncAfter(
            deadline: .now() + Self.noSpeechTimeout,
            execute: work
        )
    }

    private func cancelNoSpeechTimeout() {
        noSpeechWorkItem?.cancel()
        noSpeechWorkItem = nil
    }

    private func scheduleMaxDurationTimeout() {
        maxDurationWorkItem?.cancel()
        let work = DispatchWorkItem { [weak self] in
            guard let self, self.isSessionRunning else { return }
            self.finishSession(resolving: nil, text: self.latestText)
        }
        maxDurationWorkItem = work
        DispatchQueue.main.asyncAfter(
            deadline: .now() + Self.maxSessionDuration,
            execute: work
        )
    }
}