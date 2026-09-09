// ==========================================================================
// Ask Nahla: voice-enabled AI agent widget.
//
// This file only builds the front end (the floating button, the panel, voice
// input/output). The actual "brain" is a small Cloudflare Worker that calls
// the Anthropic API with a system prompt describing Nahla, using only real,
// verified facts. See worker/agent-worker.js and worker/README.md for that
// half, and for exactly how to deploy it.
//
// PLACEHOLDER: set this to the deployed Worker's URL once it exists, e.g.
// "https://nahla-agent.<your-subdomain>.workers.dev". Until then, the widget
// still opens and works, it just tells the visitor the agent is not
// connected yet and points them to email instead of failing silently.
// ==========================================================================

(function () {
  "use strict";

  var AGENT_ENDPOINT = ""; // PLACEHOLDER: paste the deployed Worker URL here

  var MAX_MESSAGE_LENGTH = 500;
  var MAX_HISTORY_TURNS = 6; // user+assistant pairs kept for context

  var history = [];
  var isSending = false;

  // ---- Build the DOM ----
  var root = document.getElementById("agent-root");
  if (!root) return;

  var fab = document.createElement("button");
  fab.className = "agent-fab";
  fab.type = "button";
  fab.setAttribute("aria-haspopup", "dialog");
  fab.setAttribute("aria-expanded", "false");
  fab.innerHTML =
    '<span class="agent-fab-icon" aria-hidden="true">NN</span>' +
    '<span class="agent-fab-label">Ask Nahla</span>';

  var panel = document.createElement("div");
  panel.className = "agent-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "Ask Nahla, an AI assistant answering on her behalf");
  panel.innerHTML =
    '<div class="agent-header">' +
      '<span class="mark" aria-hidden="true">NN</span>' +
      '<div class="agent-header-text"><strong>Ask Nahla</strong><span>AI assistant, speaks for her using real info</span></div>' +
      '<button type="button" class="agent-close" aria-label="Close">&times;</button>' +
    '</div>' +
    '<p class="agent-disclosure">' +
      "This is an AI assistant, not Nahla herself. It only answers using facts she has " +
      "provided. For anything else, email her directly." +
    '</p>' +
    '<div class="agent-messages" aria-live="polite"></div>' +
    '<div class="agent-status"></div>' +
    '<div class="agent-input-row">' +
      '<button type="button" class="agent-mic-btn" aria-label="Ask by voice" title="Ask by voice">&#127908;</button>' +
      '<input type="text" class="agent-text-input" placeholder="Ask about Nahla&hellip;" aria-label="Your question">' +
      '<button type="button" class="agent-send-btn" aria-label="Send">&#10148;</button>' +
    '</div>';

  root.appendChild(fab);
  root.appendChild(panel);

  var messagesEl = panel.querySelector(".agent-messages");
  var statusEl = panel.querySelector(".agent-status");
  var textInput = panel.querySelector(".agent-text-input");
  var micBtn = panel.querySelector(".agent-mic-btn");
  var sendBtn = panel.querySelector(".agent-send-btn");
  var closeBtn = panel.querySelector(".agent-close");

  addMessage("system", "Hi, I'm an AI assistant answering questions about Nahla. Try asking what she's built, or how to reach her.");

  // ---- Open / close ----
  function openPanel() {
    panel.classList.add("is-open");
    fab.setAttribute("aria-expanded", "true");
    window.setTimeout(function () { textInput.focus(); }, 100);
    document.addEventListener("keydown", onKeydown);
  }
  function closePanel() {
    panel.classList.remove("is-open");
    fab.setAttribute("aria-expanded", "false");
    document.removeEventListener("keydown", onKeydown);
    stopListening();
  }
  function onKeydown(event) {
    if (event.key === "Escape") closePanel();
  }

  fab.addEventListener("click", function () {
    var isOpen = panel.classList.contains("is-open");
    if (isOpen) closePanel(); else openPanel();
  });
  closeBtn.addEventListener("click", closePanel);

  // ---- Messages UI ----
  function addMessage(role, text) {
    var bubble = document.createElement("div");
    bubble.className = "agent-msg agent-msg-" + role;
    bubble.textContent = text;
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    return bubble;
  }

  function setStatus(html) {
    statusEl.innerHTML = html || "";
  }

  // ---- Speech synthesis (speaking the reply aloud) ----
  var canSpeak = "speechSynthesis" in window;

  function speak(text) {
    if (!canSpeak) return;
    try {
      window.speechSynthesis.cancel(); // don't stack overlapping replies
      var utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1;
      utterance.pitch = 1;
      window.speechSynthesis.speak(utterance);
    } catch (err) {
      // Speech synthesis is a nice-to-have; a failure here should never break
      // the text conversation.
    }
  }

  // ---- Speech recognition (voice input) ----
  var SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
  var recognizer = null;
  var isListening = false;

  if (!SpeechRecognitionCtor) {
    micBtn.hidden = true; // graceful fallback: text input still works everywhere
  } else {
    recognizer = new SpeechRecognitionCtor();
    recognizer.lang = "en-US";
    recognizer.interimResults = false;
    recognizer.maxAlternatives = 1;

    recognizer.addEventListener("result", function (event) {
      var transcript = event.results[0][0].transcript;
      textInput.value = transcript;
      sendMessage(transcript);
    });
    recognizer.addEventListener("end", function () {
      isListening = false;
      micBtn.dataset.listening = "false";
      setStatus("");
    });
    recognizer.addEventListener("error", function () {
      isListening = false;
      micBtn.dataset.listening = "false";
      setStatus("Didn't catch that, try typing instead.");
    });
  }

  function startListening() {
    if (!recognizer || isListening) return;
    try {
      recognizer.start();
      isListening = true;
      micBtn.dataset.listening = "true";
      setStatus('<span class="agent-wave"><span></span><span></span><span></span></span> Listening&hellip;');
    } catch (err) {
      // start() throws if called twice in a row; safe to ignore.
    }
  }
  function stopListening() {
    if (recognizer && isListening) recognizer.stop();
  }

  micBtn.addEventListener("click", function () {
    if (isListening) stopListening(); else startListening();
  });

  // ---- Sending a question to the agent ----
  function sendMessage(rawText) {
    var text = (rawText || textInput.value || "").trim();
    if (!text || isSending) return;
    if (text.length > MAX_MESSAGE_LENGTH) {
      text = text.slice(0, MAX_MESSAGE_LENGTH);
    }

    addMessage("user", text);
    textInput.value = "";
    isSending = true;
    setStatus("Thinking&hellip;");

    if (!AGENT_ENDPOINT) {
      // The Worker has not been deployed/configured yet. Fail honestly
      // instead of pretending to be smart with canned responses.
      window.setTimeout(function () {
        addMessage(
          "assistant",
          "The AI agent isn't connected yet. Email nahla.nabil.52@gmail.com directly and she'll get back to you."
        );
        setStatus("");
        isSending = false;
      }, 300);
      return;
    }

    history.push({ role: "user", content: text });
    trimHistory();

    fetch(AGENT_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, history: history.slice(0, -1) })
    })
      .then(function (response) {
        if (!response.ok) throw new Error("Agent responded with " + response.status);
        return response.json();
      })
      .then(function (data) {
        var reply = (data && data.reply) || "Sorry, I didn't get a usable reply. Try emailing Nahla directly.";
        history.push({ role: "assistant", content: reply });
        trimHistory();
        addMessage("assistant", reply);
        speak(reply);
      })
      .catch(function () {
        addMessage(
          "assistant",
          "Something went wrong reaching the agent. Email nahla.nabil.52@gmail.com and she'll answer directly."
        );
      })
      .finally(function () {
        setStatus("");
        isSending = false;
      });
  }

  function trimHistory() {
    var maxEntries = MAX_HISTORY_TURNS * 2;
    if (history.length > maxEntries) {
      history = history.slice(history.length - maxEntries);
    }
  }

  sendBtn.addEventListener("click", function () { sendMessage(); });
  textInput.addEventListener("keydown", function (event) {
    if (event.key === "Enter") sendMessage();
  });
})();
