import { browser } from 'wxt/browser';
import type { KeyValueStore } from '../../data/cache/key-value-store.js';
import { clearToken, readToken, writeToken } from '../../data/settings.js';
import type { ForkwiseMessage, TokenCheckResponse } from '../../messaging.js';

const store: KeyValueStore = {
  get: (keys) => browser.storage.local.get(keys),
  set: (items) => browser.storage.local.set(items),
  remove: (keys) => browser.storage.local.remove(keys),
};

const form = document.querySelector<HTMLFormElement>('#token-form');
const input = document.querySelector<HTMLInputElement>('#token');
const clearButton = document.querySelector<HTMLButtonElement>('#clear');
const status = document.querySelector<HTMLParagraphElement>('#status');

form?.addEventListener('submit', (event) => {
  event.preventDefault();
  void save();
});

clearButton?.addEventListener('click', () => {
  void forget();
});

async function save(): Promise<void> {
  const token = input?.value.trim() ?? '';
  if (token.length === 0) {
    say('Enter a token, or press Remove to work without one.');
    return;
  }

  say('Checking with GitHub…');

  // Verified before it is stored: a mistyped token would otherwise fail
  // silently later, in a panel that has no idea why GitHub said no.
  const request: ForkwiseMessage = { type: 'verify-token', token };
  const result = await browser.runtime.sendMessage<ForkwiseMessage, TokenCheckResponse>(request);

  if (!result.ok) {
    say(`GitHub rejected it: ${result.message}. Nothing was saved.`);
    return;
  }

  await writeToken(store, token);
  say(`Saved. Budget is now ${result.remaining} of ${result.limit} requests this hour.`);
}

async function forget(): Promise<void> {
  await clearToken(store);
  if (input !== null) {
    input.value = '';
  }
  say('Token removed. Forkwise is back to 60 requests per hour.');
}

function say(message: string): void {
  if (status !== null) {
    status.textContent = message;
  }
}

// The stored value is never shown, only whether one exists: rendering a secret
// into the DOM to prove it is there gains nothing and risks a screenshot.
void readToken(store).then((token) => {
  say(token === undefined ? 'No token stored.' : 'A token is stored.');
});
